from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models import Activity, ActivityCreate, ActivityUpdate
from config import ACTIVITIES_DB_ID
from notion import (
    query_database, get_page, create_page, update_page,
    page_to_activity, activity_create_props, activity_update_props,
)

router = APIRouter(prefix="/api", tags=["activities"])


@router.get("/activities", response_model=list[Activity])
async def list_activities(prospect_id: Optional[str] = Query(None), deal_id: Optional[str] = Query(None)):
    try:
        filters = []
        if prospect_id:
            filters.append({
                "property": "Prospect",
                "relation": {"contains": prospect_id},
            })
        if deal_id:
            filters.append({
                "property": "Deal",
                "relation": {"contains": deal_id},
            })

        filter_obj = None
        if len(filters) > 1:
            filter_obj = {"and": filters}
        elif filters:
            filter_obj = filters[0]

        pages = await query_database(
            ACTIVITIES_DB_ID,
            filter_obj=filter_obj,
            sorts=[{"property": "Date", "direction": "descending"}],
        )
        activities = [page_to_activity(p) for p in pages]

        # Resolve prospect names
        prospect_names = {}
        deal_names = {}
        for a in activities:
            pid = a.get("prospect_id")
            if pid and pid not in prospect_names:
                try:
                    page = await get_page(pid)
                    from notion import get_title
                    name = get_title(page["properties"], "Company")
                    if name:
                        prospect_names[pid] = name
                except Exception:
                    pass
            if pid:
                a["prospect_name"] = prospect_names.get(pid)

            did = a.get("deal_id")
            if did and did not in deal_names:
                try:
                    page = await get_page(did)
                    from notion import get_title
                    name = get_title(page["properties"], "Deal Name")
                    if name:
                        deal_names[did] = name
                except Exception:
                    pass
            if did:
                a["deal_name"] = deal_names.get(did)

        return [Activity(**a) for a in activities]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/activities", response_model=Activity, status_code=201)
async def create_activity(data: ActivityCreate):
    try:
        props = activity_create_props(data)
        page = await create_page(ACTIVITIES_DB_ID, props)
        a = page_to_activity(page)

        if a.get("prospect_id"):
            try:
                prospect_page = await get_page(a["prospect_id"])
                from notion import get_title
                a["prospect_name"] = get_title(prospect_page["properties"], "Company")
            except Exception:
                pass

        if a.get("deal_id"):
            try:
                deal_page = await get_page(a["deal_id"])
                from notion import get_title
                a["deal_name"] = get_title(deal_page["properties"], "Deal Name")
            except Exception:
                pass

        return Activity(**a)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/activities/{page_id}", response_model=Activity)
async def update_activity(page_id: str, data: ActivityUpdate):
    try:
        props = activity_update_props(data)
        page = await update_page(page_id, props)
        a = page_to_activity(page)

        if a.get("prospect_id"):
            try:
                prospect_page = await get_page(a["prospect_id"])
                from notion import get_title
                a["prospect_name"] = get_title(prospect_page["properties"], "Company")
            except Exception:
                pass

        if a.get("deal_id"):
            try:
                deal_page = await get_page(a["deal_id"])
                from notion import get_title
                a["deal_name"] = get_title(deal_page["properties"], "Deal Name")
            except Exception:
                pass

        return Activity(**a)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/activities/{page_id}", status_code=204)
async def delete_activity(page_id: str):
    try:
        from notion import update_page
        await update_page(page_id, {"Archive": {"checkbox": True}})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
