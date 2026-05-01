import os
import asyncio
import re
import json
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from notion import create_page, query_database, normalize_company_name, normalize_contact_name
from config import PROSPECTS_DB_ID, BRAVE_SEARCH_API_KEY

router = APIRouter(prefix="/api", tags=["agent"])

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: Optional[List[ChatMessage]] = None
    message: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    action: Optional[str] = None
    data: Optional[dict] = None

SYSTEM_PROMPT = """You are Mike, an AI sales assistant embedded in a CRM app. You help with:
1. Prospecting - finding leads by role, location, industry
2. CRM queries - pulling deal/activity data
3. Notion management - creating/updating pages

You have access to:
- Brave Search for fresh web results (primary)
- Notion API for CRM data
- Real-time company research

When prospecting, use only search-backed results. Do not supplement sparse results with model knowledge.
Never invent personal details, names, companies, emails, phones, or placeholder values.
Only return prospects with a valid person name and a valid company from search-backed evidence.
If you need more info, ask."""

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
    """Extract prospecting parameters from user message."""
    class Params(BaseModel):
        intent: str = "other"
        role: str
        location: str = ""
        industry: Optional[str] = None
        count: int = 2

    prompt = f"""Classify this sales CRM chat request and extract prospecting parameters when relevant.
Return JSON with exactly these keys: intent, role, location, industry, count.

Rules:
- intent must be "prospecting" if the user asks to find, search for, source, or add leads/prospects.
- intent must be "other" for general chat, CRM questions, or unclear requests.
- role should be the requested buyer/contact role, or an empty string.
- location should be a city, state, region, or empty string.
- industry should be a string or null.
- count should be an integer, default 2.

Request: "{message}"

JSON:"""

    try:
        raw = await call_openrouter([{
            "role": "user",
            "content": prompt
        }], model="openai/gpt-4o-mini")
        raw = raw.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        return {
            "intent": data.get("intent", "other"),
            "role": data.get("role", ""),
            "location": data.get("location", ""),
            "industry": data.get("industry"),
            "count": int(data.get("count", 2)) if isinstance(data.get("count"), (int, float, str)) else 2,
            "query": message,
        }
    except Exception:
        return {"intent": "other", "role": "", "location": "", "industry": None, "count": 2, "query": message}

async def parse_prospect_from_result(title: str, snippet: str, url: str, role: str, location: str = "") -> dict:
    """Use LLM to extract name, title, company, and enrichment data from a search result."""
    prompt = f"""Extract prospect details from this LinkedIn search result.

Return ONLY a JSON object with these exact fields:
- name: Full person name (or null if unknown)
- title: Exact job title (or null)
- company: Company name (or null)
- industry: One of: Retail, Food & Beverage, Manufacturing, Consumer Goods, Automotive (or null)
- revenue: One of: $100M-200M, $200M-500M, $500M-1B, $1B-5B, $5B+, $100M-500M, $1B+ (or null)
- employee_count: One of: 1-500, 500-2000, 2000-10000, 10000+ (or null)
- notes: One sentence summarizing why this person is a relevant prospect for {role} in {location}

Search result title: {title}
Search result snippet: {snippet[:500]}
Expected role: {role}
Location context: {location}

Rules:
- If a field is unknown or ambiguous, use null.
- For industry: infer from company description in snippet; default to null if unsure.
- For revenue/employee_count: infer from company size signals (e.g., "Fortune 500", "global", "startup", "manufacturing plant"); use null rather than guess.
- Notes should reference the source (LinkedIn/company site) and any specific pain point mentioned.

JSON:
"""
    
    messages = [
        {"role": "system", "content": "You extract structured prospect data from web search results. Return only valid JSON."},
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
            "company": data.get("company"),
            "industry": data.get("industry"),
            "revenue": data.get("revenue"),
            "employee_count": data.get("employee_count"),
            "notes": data.get("notes") or f"Found via Brave Search for {role} in {location or 'target market'}; verify before outreach.",
            "url": url,
        }
    except Exception:
        return {
            "name": None,
            "title": role,
            "company": None,
            "industry": None,
            "revenue": None,
            "employee_count": None,
            "notes": f"Found via Brave Search for {role} in {location or 'target market'}; verify before outreach.",
            "url": url,
        }
async def brave_search(query: str, num: int = 10) -> List[dict]:
    if not BRAVE_SEARCH_API_KEY:
        return []
    headers = {
        "Accept": "application/json",
        "X-Subscription-Token": BRAVE_SEARCH_API_KEY,
    }
    params = {"q": query, "count": num, "text_decorations": "false"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                headers=headers, params=params,
            )
            if resp.status_code != 200:
                return []
            data = resp.json()
            results = data.get("web", {}).get("results", [])
            return [
                {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("description", "")}
                for r in results
            ]
    except Exception:
        return []


EXCLUDED_COMPANIES = {
    "xpo logistics", "red classic logistics", "coyote logistics", "ups freight",
    "fedex freight", "jb hunt", "schneider", "swift transportation",
    "roland machinery", "cmac", "tema logistics", "estes express",
    "old dominion", "yrc freight", "saia", "hl4", "tql", "randstad",
    "lineage logistics", "amazon", "walmart", "target", "costco",
    "home depot", "lowes", "kroger", "walgreens", "abbott laboratories",
    "caterpillar", "kraft heinz", "ford motor", "general motors",
    "mcdonalds", "boeing", "unitedhealth", "fidelity investments", "state farm",
    "dhl supply chain", "exel", "zenith global", "sisu", "gates",
    "neiman marcus", "target corporation", "the home depot", "7-eleven",
    "mckesson", "cardinal health",
}

EXCLUDED_KEYWORDS = {
    "3pl", "third party logistics", "freight", "truckload", "l tl",
    "warehouse", "distribution center", "fulfillment center",
    "refrigerated", "frozen", "foodservice", "grocery", "supermarket",
    "retail store", "big-box", "wholesale", "bulk", "manufacturing",
}

def _is_excluded_company(company: str, location_city: str = "") -> bool:
    """Check if a company should be excluded from results.
    Dynamically excludes city+logistics combos like 'Phoenix Logistics' when searching Phoenix."""
    if not company:
        return False
    norm = company.lower().strip()
    if norm in ("unknown", "unknown - verify via linkedin"):
        return False
    if norm in EXCLUDED_COMPANIES:
        return True
    for kw in EXCLUDED_KEYWORDS:
        if kw in norm:
            return True
    for excluded in EXCLUDED_COMPANIES:
        if (norm.startswith(excluded + " ") or
            norm.startswith(excluded + "'") or
            norm.startswith(excluded + "-") or
            norm.endswith(" " + excluded)):
            return True
    # Dynamic exclusion: if company starts with '[city] [logistics-suffix]', exclude
    if location_city:
        city_lower = location_city.lower().strip()
        logistics_suffixes = [
            "logistics", "logistics solutions", "logistics inc", "logistics group",
            "transportation", "transit", "freight", "trucking", "supply chain",
            "distribution", "delivery", "courier", "fulfillment", "3pl", "logistica",
        ]
        for suffix in logistics_suffixes:
            if norm == f"{city_lower} {suffix}" or norm.startswith(f"{city_lower} {suffix} "):
                return True
            if norm.startswith(f"{city_lower} {suffix}") and (len(norm) == len(f"{city_lower} {suffix}") or norm[len(f"{city_lower} {suffix}")] in (" ", "-", "&")):
                return True
    return False


def _format_location_for_query(location: str) -> str:
    """Format location string into a precise search query format.
    Converts 'Phoenix' -> 'Phoenix, AZ', 'Greater Phoenix Area' -> 'Phoenix, AZ'
    Keeps full format if already contains state abbreviation or comma."""
    if not location:
        return ""
    # Normalize whitespace
    loc = " ".join(location.strip().split())
    # Check if already has state (pattern: city, ST or city, state name)
    import re
    if re.search(r',\s*([A-Z]{2}$|[A-Za-z]+$)', loc):
        return loc  # already formatted
    # If it's a major metro area name, map to canonical city, state
    metro_map = {
        "greater phoenix area": "Phoenix, AZ",
        "phoenix metro": "Phoenix, AZ",
        "phoenix metropolitan": "Phoenix, AZ",
        "dfw": "Dallas-Fort Worth, TX",
        "dallas fort worth": "Dallas-Fort Worth, TX",
        "dallas/ft worth": "Dallas-Fort Worth, TX",
        "nyc": "New York, NY",
        "new york city": "New York, NY",
        "los angeles": "Los Angeles, CA",
        "la": "Los Angeles, CA",
        "san francisco": "San Francisco, CA",
        "sf": "San Francisco, CA",
        "chicago": "Chicago, IL",
        "boston": "Boston, MA",
        "seattle": "Seattle, WA",
        "atlanta": "Atlanta, GA",
        "denver": "Denver, CO",
        "miami": "Miami, FL",
        "houston": "Houston, TX",
        "philadelphia": "Philadelphia, PA",
    }
    normalized = loc.lower()
    if normalized in metro_map:
        return metro_map[normalized]
    # Default: assume city only, add common state abbreviation or keep as-is
    # For ambiguous cities without state, we keep original but warn via query structure
    return loc

async def search_prospects(role: str, location: str, count: int = 2, industry: Optional[str] = None) -> tuple[List[dict], str]:
    """Find prospects using Brave Search results and extract person/company details."""
    # Normalize and format location for better search precision
    formatted_location = _format_location_for_query(location)
    location_quoted = f'"{formatted_location}"' if formatted_location else ""
    role_quoted = f'"{role}"' if role else ""
    industry_part = f' "{industry}"' if industry else ""

    # Build queries with quoted terms to force phrase matching
    # Prioritize LinkedIn site search with exact role + location
    queries = [
        # Primary: LinkedIn profiles with exact title and location
        f'site:linkedin.com/in {role_quoted} {location_quoted}'.strip(),
        # Secondary: LinkedIn with industry
        f'site:linkedin.com/in {role_quoted} {location_quoted}{industry_part}'.strip(),
        # Tertiary: Broad web with quotes
        f'{role_quoted} {location_quoted} LinkedIn profile'.strip(),
        # Quaternary: Executive focus
        f'{role_quoted} {location_quoted} executive'.strip(),
    ]

    prospects = []
    seen = set()

    for query in queries:
        brave_results = await brave_search(query, num=max(count * 4, 8))
        for result in brave_results:
            title = result.get("title", "")
            snippet = result.get("snippet", "")
            url = result.get("url", "")
            if not title or url in seen:
                continue
            if any(bad in url for bad in ("/jobs/", "/company/", "/school/", "/learning/")):
                continue
            seen.add(url)

            parsed = await parse_prospect_from_result(title, snippet, url, role, location)
            company = parsed.get("company")
            name = parsed.get("name")
            # Skip if contact name contains "Unknown"
            if name and "unknown" in name.lower():
                continue

            # Extract city for dynamic company exclusion
            city_for_exclusion = formatted_location.split(",")[0] if formatted_location else (location.split(",")[0] if location else "")
            if _is_excluded_company(company, city_for_exclusion):
                continue
            if not name:
                continue
            if not _has_known_company(company):
                continue

            prospects.append({
                "name": name,
                "title": parsed.get("title") or role,
                "company": company,
                "industry": parsed.get("industry"),
                "revenue": parsed.get("revenue"),
                "employee_count": parsed.get("employee_count"),
                "source": "Web Research",
                "notes": parsed.get("notes") or f"Found via Brave Search for {role} in {location or 'target market'}; verify before outreach.",
                "url": parsed.get("url") or url,
            })

            if len(prospects) >= count:
                return prospects, ""

    return [], "Brave Search did not return usable person results."

def _has_known_name(name: str) -> bool:
    if not name:
        return False
    return "unknown" not in name.lower()

def _has_known_company(company: str) -> bool:
    if not company:
        return False
    normalized = company.strip().lower()
    if not normalized:
        return False
    placeholder_values = {
        "unknown",
        "unknown - verify via linkedin",
        "verify via linkedin",
        "not found",
        "n/a",
        "na",
        "none",
        "null",
        "linkedin",
        "present",
        "company",
    }
    if normalized in placeholder_values:
        return False
    return "unknown" not in normalized

async def _search_company_for_prospect(name: str, title: str) -> Optional[str]:
    """Do a targeted search to find company for a prospect when the company is missing."""
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
Return ONLY the company name, or an empty string if not found.

Person: {name}
Title: {title}
Search result title: {result_title}
Search result snippet: {snippet[:300]}

Company:"""
                
                messages = [
                    {"role": "system", "content": "You extract company names from web search results. Return only a real company name or an empty string."},
                    {"role": "user", "content": prompt},
                ]
                
                try:
                    raw = await call_openrouter(messages, model="openai/gpt-4o-mini")
                    company = raw.strip().strip('"').strip("'")
                    if _has_known_company(company):
                        return company
                except Exception:
                    continue
        except Exception:
            continue
    
    return None

async def save_prospects_to_notion(prospects: List[dict]) -> int:
    """Save prospects to Notion database, skipping duplicates based on normalized company and contact name.
    Skips prospects with contact name or company containing placeholder values. Does not overwrite existing records."""
    # Build deduplication sets from existing prospects
    existing_norm_companies = set()          # all normalized company names present
    existing_company_unknown = set()         # normalized companies that have at least one unknown contact
    existing_known_contacts = set()          # set of (norm_company, norm_contact) for known contacts

    try:
        existing_pages = await query_database(PROSPECTS_DB_ID)
        for page in existing_pages:
            props = page.get("properties", {})
            company_raw = ""
            contact_raw = ""
            if props.get("Company", {}).get("title"):
                company_raw = props["Company"]["title"][0].get("plain_text", "")
            if props.get("Contact Name", {}).get("rich_text"):
                contact_raw = props["Contact Name"]["rich_text"][0].get("plain_text", "")
            if company_raw:
                norm_company = normalize_company_name(company_raw)
                if norm_company:
                    existing_norm_companies.add(norm_company)
                    norm_contact = normalize_contact_name(contact_raw) if contact_raw else ""
                    if not norm_contact or "unknown" in norm_contact:
                        existing_company_unknown.add(norm_company)
                    else:
                        existing_known_contacts.add((norm_company, norm_contact))
    except Exception:
        pass

    saved = 0
    for p in prospects:
        company_raw = p.get("company") or ""
        name_raw = p.get("name") or ""
        norm_company = normalize_company_name(company_raw)
        norm_contact = normalize_contact_name(name_raw) if name_raw else ""

        # Skip if contact name is missing or contains 'unknown'
        if not norm_contact or "unknown" in norm_contact:
            continue

        # Skip if company is missing or a placeholder
        if not _has_known_company(company_raw):
            continue

        # If the company is entirely new, safe to create
        if norm_company not in existing_norm_companies:
            pass
        else:
            # Company exists — apply conflict rules
            if norm_company in existing_company_unknown:
                continue
            if (norm_company, norm_contact) in existing_known_contacts:
                continue
            # else: different known contact, no unknowns — allow

        try:
            await create_page(
                PROSPECTS_DB_ID,
                {
                    "Company": {"title": [{"text": {"content": p["company"]}}]},
                    "Contact Name": {"rich_text": [{"text": {"content": p["name"]}}]},
                    "Contact Title": {"rich_text": [{"text": {"content": p["title"]}}]},
                    "Status": {"select": {"name": "New Lead"}},
                    "Source": {"select": {"name": p["source"]}},
                    "Industry": {"select": {"name": p["industry"]}} if p.get("industry") else {"select": None},
                    "Revenue": {"select": {"name": p["revenue"]}} if p.get("revenue") else {"select": None},
                    "Employee Count": {"select": {"name": p["employee_count"]}} if p.get("employee_count") else {"select": None},
                    "Research Notes": {"rich_text": [{"text": {"content": p["notes"]}}]},
                    "Website": {"url": p["url"]} if p.get("url") and isinstance(p["url"], str) and p["url"].startswith("http") else None,
                }
            )
            # Update in-memory sets to prevent duplicates within the same batch
            existing_norm_companies.add(norm_company)
            existing_known_contacts.add((norm_company, norm_contact))
            saved += 1
        except Exception:
            continue
    return saved

@router.post("/agent/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    request_messages = request.messages or []
    user_message = request.message or (request_messages[-1].content if request_messages else "")
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # Check if this is a prospecting request
    params = await extract_prospecting_params(user_message)
    
    if params.get("intent") == "prospecting" and params.get("role") and params.get("location"):
        role = params["role"]
        location = params["location"]
        try:
            requested_count = int(params.get("count", 2))
        except (TypeError, ValueError):
            requested_count = 2
        count = max(1, min(requested_count, 3))

        prospects, search_error = await search_prospects(
            role,
            location,
            count,
            params.get("industry"),
        )
        prospects = [
            p for p in prospects[:count]
            if _has_known_name(p.get("name", "")) and _has_known_company(p.get("company", ""))
        ]

        if search_error and not prospects:
            return ChatResponse(
                response=f"I searched for {role} in {location}, but could not find {count} prospects with both a valid name and valid company. I did not save fake, unnamed, or placeholder records. Try a broader title, nearby metro area, or a specific industry.",
                action="prospecting",
                data={"prospects_found": 0, "error": search_error}
            )

        if prospects:
            saved_count = await save_prospects_to_notion(prospects)

            prospect_list = "\n".join([
                f"- **{p['name']}** — {p['title']} at {p['company']}"
                for p in prospects[:count]
            ])

            response_text = (
                f"Found {len(prospects)} {role} in {location}. "
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
                response=f"I searched for {role} in {location} but didn't find any results. Try a different role, city, or industry.",
                action="prospecting",
                data={"prospects_found": 0}
            )
    
    # General chat - use OpenRouter
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in request_messages:
        messages.append({"role": msg.role, "content": msg.content})
    if not request_messages:
        messages.append({"role": "user", "content": user_message})
    
    try:
        ai_response = await call_openrouter(messages)
        return ChatResponse(response=ai_response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
