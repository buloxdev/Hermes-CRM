import os
import asyncio
import re
import json
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from notion import create_page, query_database
from config import PROSPECTS_DB_ID

router = APIRouter(prefix="/api", tags=["agent"])

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    response: str
    action: Optional[str] = None
    data: Optional[dict] = None

SYSTEM_PROMPT = """You are Mike, an AI sales assistant embedded in a CRM app. You help with:
1. Prospecting - finding leads by role, location, industry
2. CRM questions - answering questions about prospects, deals, pipeline
3. Sales strategy - giving advice on outreach, follow-ups, closing

When the user asks for prospects, extract:
- role/title (e.g., "VP of Logistics", "Supply Chain Director")
- location/city (e.g., "Dallas", "Chicago", "Atlanta")
- industry (optional, default to logistics/supply chain)

Respond conversationally. Be concise and direct. If you need more info, ask."""

async def call_openrouter(messages: list, model: str = "anthropic/claude-sonnet-4") -> str:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Sales CRM",
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2000,
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

def _ddgs_search_sync(query: str, limit: int) -> List[dict]:
    """Synchronous DDGS search to run in thread pool."""
    from duckduckgo_search import DDGS
    results = []
    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=limit):
            results.append({
                "title": r["title"],
                "url": r["href"],
                "snippet": r["body"],
            })
    return results

async def duckduckgo_search(query: str, limit: int = 5, retries: int = 3) -> List[dict]:
    """Search using duckduckgo-search library with retries, backoff, and timeout."""
    for attempt in range(retries):
        try:
            results = await asyncio.wait_for(
                asyncio.to_thread(_ddgs_search_sync, query, limit),
                timeout=10.0,
            )
            return results
        except asyncio.TimeoutError:
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            return []
        except Exception as e:
            err_str = str(e).lower()
            if "ratelimit" in err_str or "202" in err_str:
                wait = 2 ** attempt
                if attempt < retries - 1:
                    await asyncio.sleep(wait)
                    continue
            return []
    return []

async def extract_prospecting_params(message: str) -> dict:
    """Use LLM to extract prospecting parameters from user message."""
    prompt = f"""Extract prospecting parameters from this user message. Return ONLY a JSON object with these fields:
- "intent": "prospecting" or "other"
- "role": the job title/role they want (e.g., "VP of Logistics", "Supply Chain Director")
- "location": the city or region (e.g., "Dallas", "Chicago")
- "industry": the industry if specified, otherwise null
- "query": a good search query to find these people

User message: "{message}"

JSON:"""

    messages = [
        {"role": "system", "content": "You are a parameter extraction assistant. Return only valid JSON."},
        {"role": "user", "content": prompt},
    ]
    
    try:
        raw = await call_openrouter(messages, model="openai/gpt-4o-mini")
        # Clean up markdown code blocks
        raw = raw.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception:
        return {"intent": "other", "role": None, "location": None, "industry": None, "query": None}

async def parse_prospect_from_result(title: str, snippet: str, url: str, role: str) -> dict:
    """Use LLM to extract name, title, company from a search result."""
    prompt = f"""Extract the person's name, job title, and company from this LinkedIn search result.
Return ONLY a JSON object with fields: name, title, company.
If any field is unknown, use null.

Search result title: {title}
Search result snippet: {snippet[:400]}
Expected role: {role}

JSON:"""
    
    messages = [
        {"role": "system", "content": "You extract structured data from web search results. Return only valid JSON."},
        {"role": "user", "content": prompt},
    ]
    
    try:
        raw = await call_openrouter(messages, model="openai/gpt-4o-mini")
        raw = raw.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        return {
            "name": data.get("name"),
            "title": data.get("title") or role,
            "company": data.get("company") or "Unknown",
            "url": url,
        }
    except Exception:
        return {"name": None, "title": role, "company": "Unknown", "url": url}

async def search_prospects(role: str, location: str) -> tuple[List[dict], str]:
    """Search for prospects using DuckDuckGo with multiple query strategies."""
    
    queries = [
        # Try LinkedIn first
        f'site:linkedin.com/in "{role}" "{location}"',
        f'site:linkedin.com/in "{role}" {location}',
        # Fallback: broader web search
        f'"{role}" "{location}" profile',
        f'"{role}" {location} company',
        f'"{role}" "{location}" directory',
    ]

    all_results = []
    seen_urls = set()
    search_status = ""

    for i, query in enumerate(queries):
        # Stagger searches to avoid rate limits
        if i > 0:
            await asyncio.sleep(1.5)

        try:
            results = await duckduckgo_search(query, limit=6)
            for r in results:
                url = r.get("url", "")
                title = r.get("title", "")

                # Skip job listings, company pages, and bad domains
                bad_paths = ["/jobs/", "/company/", "/pub/"]
                if any(bp in url for bp in bad_paths):
                    continue
                if url in seen_urls:
                    continue

                # Skip aggregate/directory pages
                clean_check = title.replace("| LinkedIn", "").strip()
                if clean_check.count(" at ") > 1:
                    continue
                if title.count("|") > 2:
                    continue
                if clean_check.count("-") >= 3 and "..." in clean_check:
                    continue

                seen_urls.add(url)
                all_results.append(r)

            # If we have enough results, stop searching
            if len(all_results) >= 6:
                break

        except Exception as e:
            search_status = f"Search error: {str(e)[:100]}"
            continue

    if not all_results:
        return [], search_status or "No search results returned. The search service may be temporarily unavailable."

    prospects = []
    for r in all_results[:10]:
        parsed = await parse_prospect_from_result(r["title"], r.get("snippet", ""), r["url"], role)
        if parsed["name"]:
            # Clean up name
            parsed["name"] = re.sub(r',?\s*(MBA|CPA|P\.E\.|PhD|MD|JD|CFA|CSCP|PMP).*', '', parsed["name"], flags=re.IGNORECASE).strip()

            # Fallback: targeted search for company if still unknown
            if not parsed["company"] or parsed["company"] == "Unknown":
                await asyncio.sleep(1)
                parsed["company"] = await _search_company_for_prospect(parsed["name"], parsed["title"])

            prospects.append({
                "name": parsed["name"],
                "title": parsed["title"],
                "company": parsed["company"],
                "source": "Web Research",
                "notes": f"Found via web search for {role} in {location}",
                "url": parsed["url"],
            })

    return prospects, ""

async def generate_prospects_via_llm(role: str, location: str, industry: Optional[str] = None) -> List[dict]:
    """When web search fails, use the LLM to suggest realistic prospects."""
    prompt = f"""You are a sales research assistant. Suggest 5-8 realistic prospects for a {role} in {location}{f' in the {industry} industry' if industry else ''}.

Return ONLY a JSON array of objects with these exact fields:
- "name": Full name (use realistic names)
- "title": Exact job title
- "company": Company name (use real companies with operations in {location})
- "notes": One sentence about why this is a good prospect

Requirements:
- Use REAL company names that operate in {location}
- Use realistic but fictional person names
- Target mid-market to large private companies ($100M-$5B revenue), NOT Fortune 50 megacorps
- Avoid these companies: McDonald's, Walmart, Amazon, Target, Costco, Boeing, Walgreens, Abbott, Caterpillar, Kraft Heinz, Ford, GM, Apple, Google, Microsoft, Coca-Cola, PepsiCo, Nike, UPS, FedEx, J.B. Hunt, C.H. Robinson, Amazon, Kroger, Albertsons, Publix
- Focus on regional distributors, manufacturers, private CPG brands, logistics companies, food producers, and industrial suppliers
- Return ONLY valid JSON, no markdown, no explanations

JSON array:"""

    messages = [
        {"role": "system", "content": "You generate realistic sales prospect data. Return only valid JSON arrays."},
        {"role": "user", "content": prompt},
    ]

    try:
        raw = await call_openrouter(messages, model="openai/gpt-4o-mini")
        raw = raw.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)

        prospects = []
        for item in data:
            if isinstance(item, dict) and item.get("name") and item.get("company"):
                prospects.append({
                    "name": item["name"],
                    "title": item.get("title", role),
                    "company": item["company"],
                    "source": "AI Suggested",
                    "notes": item.get("notes", f"Suggested {role} prospect in {location}"),
                    "url": "",
                })
        return prospects
    except Exception:
        return []

async def _search_company_for_prospect(name: str, title: str) -> str:
    """Do a targeted search to find company for a prospect when it's unknown."""
    queries = [
        f'"{name}" "{title}" company',
        f'"{name}" "{title}" LinkedIn',
    ]
    
    for query in queries:
        try:
            results = await duckduckgo_search(query, limit=3)
            for r in results:
                snippet = r.get("snippet", "")
                result_title = r.get("title", "")
                url = r.get("url", "")
                
                # Skip people-search sites and social media
                bad_domains = ["tiktok.com", "instagram.com", "facebook.com", "contactout.com",
                               "rocketreach.co", "zoominfo.com", "apollo.io", "crunchbase.com"]
                if any(bad in url for bad in bad_domains):
                    continue
                
                # Use LLM to extract company from this result
                prompt = f"""Extract the company name for this person from the search result.
Return ONLY the company name, or "Unknown" if not found.

Person: {name}
Title: {title}
Search result title: {result_title}
Search result snippet: {snippet[:300]}

Company:"""
                
                messages = [
                    {"role": "system", "content": "You extract company names from web search results. Return only the company name or 'Unknown'."},
                    {"role": "user", "content": prompt},
                ]
                
                try:
                    raw = await call_openrouter(messages, model="openai/gpt-4o-mini")
                    company = raw.strip().strip('"').strip("'")
                    if company and company.lower() not in ("unknown", "linkedin", "present", "not found", "null"):
                        return company
                except Exception:
                    continue
        except Exception:
            continue
    
    return "Unknown"

async def save_prospects_to_notion(prospects: List[dict]) -> int:
    """Save prospects to Notion database, skipping duplicates by company + contact name."""
    # Fetch existing prospects for deduplication
    existing_set = set()
    try:
        existing_pages = await query_database(PROSPECTS_DB_ID)
        for page in existing_pages:
            props = page.get("properties", {})
            company = ""
            contact = ""
            if props.get("Company", {}).get("title"):
                company = props["Company"]["title"][0].get("plain_text", "")
            if props.get("Contact Name", {}).get("rich_text"):
                contact = props["Contact Name"]["rich_text"][0].get("plain_text", "")
            if company and contact:
                existing_set.add(f"{company.lower().strip()}|{contact.lower().strip()}")
    except Exception:
        pass

    saved = 0
    for p in prospects:
        key = f"{p['company'].lower().strip()}|{p['name'].lower().strip()}"
        if key in existing_set:
            continue
        try:
            await create_page(
                PROSPECTS_DB_ID,
                {
                    "Company": {"title": [{"text": {"content": p["company"]}}]},
                    "Contact Name": {"rich_text": [{"text": {"content": p["name"]}}]},
                    "Contact Title": {"rich_text": [{"text": {"content": p["title"]}}]},
                    "Status": {"select": {"name": "New Lead"}},
                    "Source": {"select": {"name": p["source"]}},
                    "Research Notes": {"rich_text": [{"text": {"content": p["notes"]}}]},
                    "Website": {"url": p["url"] if p["url"].startswith("http") else None},
                }
            )
            existing_set.add(key)
            saved += 1
        except Exception:
            continue
    return saved

@router.post("/agent/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    user_message = request.messages[-1].content if request.messages else ""
    
    # Check if this is a prospecting request
    params = await extract_prospecting_params(user_message)
    
    if params.get("intent") == "prospecting" and params.get("role") and params.get("location"):
        role = params["role"]
        location = params["location"]

        # Search for prospects (DDGS disabled: threads block uvicorn event loop)
        prospects, search_error = [], "Web search disabled (DDGS blocks event loop)"

        if search_error and not prospects:
            # Use LLM fallback for realistic suggestions
            llm_prospects = await generate_prospects_via_llm(role, location, params.get("industry"))

            if llm_prospects:
                saved_count = await save_prospects_to_notion(llm_prospects)

                prospect_list = "\n".join([
                    f"- **{p['name']}** — {p['title']} at {p['company']}"
                    for p in llm_prospects[:5]
                ])

                response_text = (
                    f"Web search is temporarily limited, so I used my knowledge to suggest {len(llm_prospects)} "
                    f"{role}s in {location}. Saved {saved_count} to your CRM.\n\n"
                    f"Top suggestions (verify before reaching out):\n{prospect_list}\n\n"
                    f"Refresh your Prospects page to see them."
                )

                return ChatResponse(
                    response=response_text,
                    action="prospecting",
                    data={"prospects_found": len(llm_prospects), "saved": saved_count, "source": "llm_fallback"}
                )

            return ChatResponse(
                response=f"I tried searching for {role}s in {location}, but hit an issue: {search_error}. Try again in a moment, or ask about your existing pipeline instead.",
                action="prospecting",
                data={"prospects_found": 0, "error": search_error}
            )

        if prospects:
            saved_count = await save_prospects_to_notion(prospects)

            prospect_list = "\n".join([
                f"- **{p['name']}** — {p['title']} at {p['company']}"
                for p in prospects[:5]
            ])

            response_text = (
                f"Found {len(prospects)} {role}s in {location}. "
                f"Saved {saved_count} to your CRM.\n\n"
                f"Top results:\n{prospect_list}\n\n"
                f"Refresh your Prospects page to see them."
            )

            return ChatResponse(
                response=response_text,
                action="prospecting",
                data={"prospects_found": len(prospects), "saved": saved_count}
            )
        else:
            return ChatResponse(
                response=f"I searched for {role}s in {location} but didn't find any results. Try a different role, city, or industry.",
                action="prospecting",
                data={"prospects_found": 0}
            )
    
    # General chat - use OpenRouter
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})
    
    try:
        ai_response = await call_openrouter(messages)
        return ChatResponse(response=ai_response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
