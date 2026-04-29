from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from models import Prospect, ProspectCreate, ProspectUpdate, ProspectDetail
from config import PROSPECTS_DB_ID, ACTIVITIES_DB_ID, DEALS_DB_ID
from notion import (
    query_database, get_page, create_page, update_page,
    page_to_prospect, prospect_create_props, prospect_update_props,
    page_to_activity, page_to_deal,
    get_title, get_rich_text, get_select,
    normalize_company_name, normalize_contact_name,
)
import httpx

router = APIRouter(prefix="/api", tags=["prospects"])


@router.get("/prospects", response_model=list[Prospect])
async def list_prospects(
    status: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    try:
        filters = []
        if status:
            filters.append({"property": "Status", "select": {"equals": status}})
        if industry:
            filters.append({"property": "Industry", "select": {"equals": industry}})

        filter_obj = None
        if len(filters) > 1:
            filter_obj = {"and": filters}
        elif filters:
            filter_obj = filters[0]

        pages = await query_database(PROSPECTS_DB_ID, filter_obj=filter_obj)
        prospects = [page_to_prospect(p) for p in pages]

        if search:
            s = search.lower()
            prospects = [
                p for p in prospects
                if s in (p.get("company") or "").lower()
                or s in (p.get("contact_name") or "").lower()
            ]

        return [Prospect(**p) for p in prospects]
    except Exception as e:
        if isinstance(e, httpx.HTTPStatusError):
            try:
                err_detail = e.response.json()
            except Exception:
                err_detail = e.response.text
            raise HTTPException(
                status_code=500,
                detail=f"Notion API error {e.response.status_code} on {e.request.url}: {err_detail}"
            )
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")

@router.get("/prospects/duplicates")
async def get_duplicate_prospects():
    """Return groups of existing duplicate prospects based on normalized company and contact name."""
    try:
        pages = await query_database(PROSPECTS_DB_ID, page_size=1000)
        comp_groups = {}
        for page in pages:
            props = page.get("properties", {})
            company = get_title(props, "Company") or ""
            contact = get_rich_text(props, "Contact Name") or ""
            status = get_select(props, "Status")
            source = get_select(props, "Source")
            created = page.get("created_time", "")
            page_id = page.get("id", "")
            norm_company = normalize_company_name(company)
            norm_contact = normalize_contact_name(contact) if contact else ""
            is_unknown = (not norm_contact) or ("unknown" in norm_contact)
            comp_groups.setdefault(norm_company, []).append({
                "id": page_id,
                "company": company,
                "contact_name": contact,
                "norm_contact": norm_contact,
                "is_unknown": is_unknown,
                "status": status,
                "source": source,
                "created_at": created,
            })

        duplicate_groups = []
        for norm_company, prospects in comp_groups.items():
            if len(prospects) < 2:
                continue
            n = len(prospects)
            visited = [False] * n
            components = []
            for i in range(n):
                if visited[i]:
                    continue
                stack = [i]
                comp_indices = []
                visited[i] = True
                while stack:
                    j = stack.pop()
                    comp_indices.append(j)
                    for k in range(n):
                        if visited[k]:
                            continue
                        pj = prospects[j]
                        pk = prospects[k]
                        if pj["is_unknown"] or pk["is_unknown"]:
                            stack.append(k)
                            visited[k] = True
                        elif pj["norm_contact"] == pk["norm_contact"]:
                            stack.append(k)
                            visited[k] = True
                components.append(comp_indices)

            for comp in components:
                if len(comp) < 2:
                    continue
                ids = [prospects[i]["id"] for i in comp]
                companies = list({prospects[i]["company"] for i in comp})
                contact_names = list({prospects[i]["contact_name"] for i in comp})
                statuses = list({prospects[i]["status"] for i in comp if prospects[i]["status"]})
                sources = list({prospects[i]["source"] for i in comp if prospects[i]["source"]})
                created_at_list = [prospects[i]["created_at"] for i in comp]
                first = prospects[comp[0]]
                if first["is_unknown"]:
                    key = norm_company
                else:
                    key = f"{norm_company}|{first['norm_contact']}"
                duplicate_groups.append({
                    "normalized_key": key,
                    "count": len(comp),
                    "ids": ids,
                    "companies": companies,
                    "contact_names": contact_names,
                    "statuses": statuses,
                    "sources": sources,
                    "created_at": created_at_list,
                })
        return duplicate_groups
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/prospects/merge", response_model=ProspectDetail)
async def merge_prospects(body: dict):
    """
    Merge a group of duplicate prospects into one.
    Body: {ids: [page_id, ...], primary_id?: str}
    If primary_id is omitted, the oldest prospect (earliest created_time) becomes primary.
    Others are archived (status=Lost) with a note, and their research_notes/key_decision_makers
    are merged into the primary. Activities and Deals are re-parented to the primary.
    """
    try:
        ids = body.get("ids")
        primary_id = body.get("primary_id")

        if not ids or len(ids) < 2:
            raise HTTPException(status_code=400, detail="At least 2 prospect IDs are required to merge.")

        # Fetch all specified prospect pages
        pages = []
        for pid in ids:
            page = await get_page(pid)
            pages.append(page)

        # Determine primary
        if primary_id:
            primary_page = next((p for p in pages if p["id"] == primary_id), None)
            if not primary_page:
                raise HTTPException(status_code=404, detail=f"Primary ID {primary_id} not found in the provided set.")
        else:
            # Pick oldest by created_time
            def get_created(p):
                return p.get("created_time") or ""
            primary_page = min(pages, key=get_created)

        primary_id = primary_page["id"]
        primary_props = primary_page.get("properties", {})
        primary_notes_raw = get_rich_text(primary_props, "Research Notes") or ""
        primary_kdm_raw = get_rich_text(primary_props, "Key Decision Makers") or ""

        # Collect data from all non-primary prospects
        merged_notes_parts = [primary_notes_raw] if primary_notes_raw else []
        merged_kdm_set = set()
        if primary_kdm_raw:
            for line in primary_kdm_raw.split("\n"):
                line = line.strip()
                if line:
                    merged_kdm_set.add(line)

        archived_ids = []
        for page in pages:
            if page["id"] == primary_id:
                continue
            pid = page["id"]
            props = page.get("properties", {})

            # Archive: set status=Lost, append note
            notes = get_rich_text(props, "Research Notes") or ""
            contact = get_title(props, "Company") or "Unknown"
            if notes:
                merged_notes_parts.append(f"--- Merged from {contact} ({pid[:8]}): ---\n{notes}")
            kdm = get_rich_text(props, "Key Decision Makers") or ""
            if kdm:
                for line in kdm.split("\n"):
                    line = line.strip()
                    if line:
                        merged_kdm_set.add(line)

            # Update the archived prospect
            try:
                await update_page(
                    pid,
                    {
                        "Status": {"select": {"name": "Lost"}},
                        "Research Notes": {
                            "rich_text": [{"text": {"content": (notes or "") + f"\n\nArchived as duplicate of {primary_id}"}}]
                        },
                    }
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to archive prospect {pid[:8]}: {e}"
                )
            archived_ids.append(pid)

        # Build merged research notes and key decision makers
        merged_notes = "\n\n".join(merged_notes_parts)
        merged_kdm = "\n".join(sorted(merged_kdm_set))

        # Update primary prospect
        update_props = {
            "Research Notes": {"rich_text": [{"text": {"content": merged_notes}}]},
            "Key Decision Makers": {"rich_text": [{"text": {"content": merged_kdm}}]},
        }
        try:
            updated_primary = await update_page(primary_id, update_props)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update primary prospect {primary_id[:8]}: {e}"
            )

        # Re-parent activities: find all activities linked to any archived prospect, switch to primary
        for archive_pid in archived_ids:
            act_filter = {"property": "Prospect", "relation": {"contains": archive_pid}}
            acts = await query_database(ACTIVITIES_DB_ID, filter_obj=act_filter, page_size=100)
            for act in acts:
                act_id = act["id"]
                try:
                    await update_page(
                        act_id,
                        {"Prospect": {"relation": [{"id": primary_id}]}}
                    )
                except Exception as e:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to update activity {act_id[:8]} from archived prospect {archive_pid[:8]}: {e}"
                    )

        # Re-parent deals
        for archive_pid in archived_ids:
            deal_filter = {"property": "Prospect", "relation": {"contains": archive_pid}}
            deals = await query_database(DEALS_DB_ID, filter_obj=deal_filter, page_size=100)
            for deal in deals:
                deal_id = deal["id"]
                try:
                    await update_page(
                        deal_id,
                        {"Prospect": {"relation": [{"id": primary_id}]}}
                    )
                except Exception as e:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to update deal {deal_id[:8]} from archived prospect {archive_pid[:8]}: {e}"
                    )# Fetch fresh primary page with full details
        fresh = await get_page(primary_id)
        p = page_to_prospect(fresh)

        # Enrich with related activities and deals
        act_pages = await query_database(
            ACTIVITIES_DB_ID,
            filter_obj={"property": "Prospect", "relation": {"contains": primary_id}},
            sorts=[{"property": "Date", "direction": "descending"}],
        )
        p["activities"] = [page_to_activity(ap) for ap in act_pages]

        deal_pages = await query_database(
            DEALS_DB_ID,
            filter_obj={"property": "Prospect", "relation": {"contains": primary_id}},
        )
        p["deals"] = [page_to_deal(dp) for dp in deal_pages]

        return ProspectDetail(**p)
    except HTTPException:
        raise
    except Exception as e:
        if isinstance(e, httpx.HTTPStatusError):
            try:
                err_detail = e.response.json()
            except Exception:
                err_detail = e.response.text
            raise HTTPException(
                status_code=500,
                detail=f"Notion API error {e.response.status_code} on {e.request.url}: {err_detail}"
            )
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")



@router.get("/prospects/enrichment-stats")
async def get_enrichment_stats():
    """Return coverage statistics for Industry, Revenue, and Employee Count fields."""
    try:
        pages = await query_database(PROSPECTS_DB_ID, page_size=1000)
        total = len(pages)
        if total == 0:
            return {"total": 0, "industry": {"filled": 0, "percent": 0.0},
                    "revenue": {"filled": 0, "percent": 0.0},
                    "employee_count": {"filled": 0, "percent": 0.0}}

        industry_filled = 0
        revenue_filled = 0
        employee_filled = 0

        for page in pages:
            props = page.get("properties", {})
            # Industry: select
            if props.get("Industry", {}).get("select"):
                if props["Industry"]["select"] and props["Industry"]["select"].get("name"):
                    industry_filled += 1
            # Revenue: select
            if props.get("Revenue", {}).get("select"):
                if props["Revenue"]["select"] and props["Revenue"]["select"].get("name"):
                    revenue_filled += 1
            # Employee Count: select
            if props.get("Employee Count", {}).get("select"):
                if props["Employee Count"]["select"] and props["Employee Count"]["select"].get("name"):
                    employee_filled += 1

        def pct(filled):
            return round((filled / total) * 100, 2) if total else 0.0

        return {
            "total": total,
            "industry": {"filled": industry_filled, "percent": pct(industry_filled)},
            "revenue": {"filled": revenue_filled, "percent": pct(revenue_filled)},
            "employee_count": {"filled": employee_filled, "percent": pct(employee_filled)},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")

@router.get("/prospects/{page_id}", response_model=ProspectDetail)
async def get_prospect(page_id: str):
    try:
        page = await get_page(page_id)
        p = page_to_prospect(page)

        # Query activities by prospect relation (more reliable than bidirectional relation)
        act_pages = await query_database(
            ACTIVITIES_DB_ID,
            filter_obj={"property": "Prospect", "relation": {"contains": page_id}},
            sorts=[{"property": "Date", "direction": "descending"}],
        )
        p["activities"] = [page_to_activity(ap) for ap in act_pages]

        # Query deals by prospect relation
        deal_pages = await query_database(
            DEALS_DB_ID,
            filter_obj={"property": "Prospect", "relation": {"contains": page_id}},
        )
        p["deals"] = [page_to_deal(dp) for dp in deal_pages]

        return ProspectDetail(**p)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/prospects", response_model=Prospect, status_code=201)
async def create_prospect(data: ProspectCreate):
    try:
        # Extract and normalize names
        company_raw = (data.company or "").strip()
        name_raw = (data.contact_name or "").strip()
        norm_company = normalize_company_name(company_raw)
        norm_contact = normalize_contact_name(name_raw) if name_raw else ""

        # Reject unknown contacts
        if not norm_contact or "unknown" in norm_contact:
            raise HTTPException(
                status_code=400,
                detail="Cannot create prospect: contact name is missing or marked 'Unknown'."
            )

        if not norm_company:
            raise HTTPException(
                status_code=400,
                detail="Cannot create prospect: company name is required."
            )

        # Fetch existing prospects for dedup check
        existing_pages = await query_database(PROSPECTS_DB_ID)
        existing_norm_companies = set()
        existing_company_unknown = set()
        existing_known_contacts = set()

        for page in existing_pages:
            props = page.get("properties", {})
            comp_title = props.get("Company", {}).get("title", [])
            contact_rich = props.get("Contact Name", {}).get("rich_text", [])
            comp_val = comp_title[0].get("plain_text", "") if comp_title else ""
            contact_val = contact_rich[0].get("plain_text", "") if contact_rich else ""
            if comp_val:
                nc = normalize_company_name(comp_val)
                if nc:
                    existing_norm_companies.add(nc)
                    nc_contact = normalize_contact_name(contact_val) if contact_val else ""
                    if not nc_contact or "unknown" in nc_contact:
                        existing_company_unknown.add(nc)
                    else:
                        existing_known_contacts.add((nc, nc_contact))

        # Dedup rules
        if norm_company in existing_norm_companies:
            if norm_company in existing_company_unknown:
                raise HTTPException(
                    status_code=409,
                    detail=f"Duplicate blocked: company '{company_raw}' already has an Unknown contact. Resolve or update that record first."
                )
            if (norm_company, norm_contact) in existing_known_contacts:
                raise HTTPException(
                    status_code=409,
                    detail=f"Duplicate blocked: '{name_raw}' at '{company_raw}' already exists."
                )
            # else: different known contact at same company, allow

        # Create the prospect
        props = prospect_create_props(data)
        page = await create_page(PROSPECTS_DB_ID, props)
        p = page_to_prospect(page)
        return Prospect(**p)
    except HTTPException:
        raise
    except Exception as e:
        if isinstance(e, httpx.HTTPStatusError):
            try:
                err_detail = e.response.json()
            except Exception:
                err_detail = e.response.text
            raise HTTPException(
                status_code=500,
                detail=f"Notion API error {e.response.status_code} on {e.request.url}: {err_detail}"
            )
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


@router.patch("/prospects/{page_id}", response_model=Prospect)
async def update_prospect(page_id: str, data: ProspectUpdate):
    try:
        props = prospect_update_props(data)
        page = await update_page(page_id, props)
        p = page_to_prospect(page)
        from routes.dashboard import clear_dashboard_cache
        clear_dashboard_cache()
        return Prospect(**p)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





