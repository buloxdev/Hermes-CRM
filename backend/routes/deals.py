from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models import Deal, DealCreate, DealUpdate, DealDetail, Prospect, Activity
from config import DEALS_DB_ID, PROSPECTS_DB_ID, ACTIVITIES_DB_ID
from notion import (
    query_database, get_page, create_page, update_page,
    page_to_deal, deal_create_props, deal_update_props,
    page_to_prospect, page_to_activity, get_title,
)

router = APIRouter(prefix="/api", tags=["deals"])


@router.get("/deals/{page_id}", response_model=DealDetail)
async def get_deal(page_id: str):
    try:
        page = await get_page(page_id)
        d = page_to_deal(page)

        # Resolve prospect name
        if d.get("prospect_id"):
            try:
                prospect_page = await get_page(d["prospect_id"])
                d["prospect_name"] = get_title(prospect_page["properties"], "Company")

                # Fetch full prospect
                p = page_to_prospect(prospect_page)
                d["prospect"] = Prospect(**p)

                # Fetch activities for this prospect
                act_pages_prospect = await query_database(
                    ACTIVITIES_DB_ID,
                    filter_obj={"property": "Prospect", "relation": {"contains": d["prospect_id"]}},
                    sorts=[{"property": "Date", "direction": "descending"}],
                )
            except Exception:
                act_pages_prospect = []
        else:
            act_pages_prospect = []

        # Fetch activities linked directly to this deal
        act_pages_deal = await query_database(
            ACTIVITIES_DB_ID,
            filter_obj={"property": "Deal", "relation": {"contains": page_id}},
            sorts=[{"property": "Date", "direction": "descending"}],
        )

        # Combine and dedupe
        seen_ids = set()
        all_activities = []
        for ap in act_pages_deal + act_pages_prospect:
            aid = ap["id"]
            if aid not in seen_ids:
                seen_ids.add(aid)
                all_activities.append(ap)

        # Sort by date descending
        all_activities.sort(key=lambda x: x.get("properties", {}).get("Date", {}).get("date", {}).get("start") or "", reverse=True)
        d["activities"] = [Activity(**page_to_activity(ap)) for ap in all_activities]

        return DealDetail(**d)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/deals", response_model=list[Deal])
async def list_deals(
    stage: Optional[str] = Query(None),
    prospect_id: Optional[str] = Query(None),
):
    try:
        filters = []
        if stage:
            filters.append({"property": "Stage", "select": {"equals": stage}})
        if prospect_id:
            filters.append({
                "property": "Prospect",
                "relation": {"contains": prospect_id},
            })

        filter_obj = None
        if len(filters) > 1:
            filter_obj = {"and": filters}
        elif filters:
            filter_obj = filters[0]

        pages = await query_database(DEALS_DB_ID, filter_obj=filter_obj)
        deals = [page_to_deal(p) for p in pages]

        # Resolve prospect names
        if deals:
            prospect_ids = {d["prospect_id"] for d in deals if d.get("prospect_id")}
            prospect_names = {}
            for pid in prospect_ids:
                try:
                    page = await get_page(pid)
                    name = get_title(page["properties"], "Company")
                    if name:
                        prospect_names[pid] = name
                except Exception:
                    pass
            for d in deals:
                if d.get("prospect_id"):
                    d["prospect_name"] = prospect_names.get(d["prospect_id"])

        return [Deal(**d) for d in deals]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deals", response_model=Deal, status_code=201)
async def create_deal(data: DealCreate):
    try:
        props = deal_create_props(data)
        page = await create_page(DEALS_DB_ID, props)
        d = page_to_deal(page)

        # Resolve prospect name
        if d.get("prospect_id"):
            try:
                prospect_page = await get_page(d["prospect_id"])
                d["prospect_name"] = get_title(prospect_page["properties"], "Company")
            except Exception:
                pass

        return Deal(**d)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/deals/{page_id}", response_model=Deal)
async def update_deal(page_id: str, data: DealUpdate):
    try:
        props = deal_update_props(data)
        page = await update_page(page_id, props)
        d = page_to_deal(page)

        if d.get("prospect_id"):
            try:
                prospect_page = await get_page(d["prospect_id"])
                d["prospect_name"] = get_title(prospect_page["properties"], "Company")
            except Exception:
                pass

        return Deal(**d)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
