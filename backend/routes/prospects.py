from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models import Prospect, ProspectCreate, ProspectUpdate, ProspectDetail
from config import PROSPECTS_DB_ID
from notion import (
    query_database, get_page, create_page, update_page,
    page_to_prospect, prospect_create_props, prospect_update_props,
    page_to_activity, page_to_deal,
)

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
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prospects/{page_id}", response_model=ProspectDetail)
async def get_prospect(page_id: str):
    try:
        page = await get_page(page_id)
        p = page_to_prospect(page)

        # Query activities by prospect relation (more reliable than bidirectional relation)
        from config import ACTIVITIES_DB_ID, DEALS_DB_ID
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
        props = prospect_create_props(data)
        page = await create_page(PROSPECTS_DB_ID, props)
        p = page_to_prospect(page)
        return Prospect(**p)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/prospects/{page_id}", response_model=Prospect)
async def update_prospect(page_id: str, data: ProspectUpdate):
    try:
        props = prospect_update_props(data)
        page = await update_page(page_id, props)
        p = page_to_prospect(page)
        return Prospect(**p)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
