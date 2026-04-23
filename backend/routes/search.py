from fastapi import APIRouter, HTTPException, Query
from config import PROSPECTS_DB_ID, DEALS_DB_ID
from notion import query_database, page_to_prospect, page_to_deal, get_title

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search")
async def global_search(q: str = Query(..., min_length=1)):
    try:
        term = q.lower()

        # Fetch prospects and deals in parallel
        prospect_pages = await query_database(PROSPECTS_DB_ID)
        deal_pages = await query_database(DEALS_DB_ID)

        prospects = [page_to_prospect(p) for p in prospect_pages]
        deals = [page_to_deal(p) for p in deal_pages]

        # Build prospect name lookup for deal enrichment
        prospect_lookup = {p["id"]: p.get("company", "") for p in prospects}

        matched_prospects = []
        for p in prospects:
            fields = " ".join(filter(None, [
                p.get("company", ""),
                p.get("contact_name", ""),
                p.get("contact_title", ""),
                p.get("contact_email", ""),
                p.get("industry", ""),
            ])).lower()
            if term in fields:
                matched_prospects.append({
                    "id": p["id"],
                    "type": "prospect",
                    "name": p.get("company", ""),
                    "subtitle": " ".join(filter(None, [p.get("contact_name"), p.get("contact_title")])),
                    "industry": p.get("industry"),
                    "revenue": p.get("revenue"),
                })

        matched_deals = []
        for d in deals:
            fields = " ".join(filter(None, [
                d.get("deal_name", ""),
                d.get("stage", ""),
                d.get("notes", ""),
                prospect_lookup.get(d.get("prospect_id"), ""),
            ])).lower()
            if term in fields:
                matched_deals.append({
                    "id": d["id"],
                    "type": "deal",
                    "name": d.get("deal_name", ""),
                    "subtitle": prospect_lookup.get(d.get("prospect_id"), ""),
                    "stage": d.get("stage"),
                    "estimated_value": d.get("estimated_value"),
                })

        return {
            "prospects": matched_prospects[:10],
            "deals": matched_deals[:10],
            "total": len(matched_prospects) + len(matched_deals),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
