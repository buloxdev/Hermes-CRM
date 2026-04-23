import asyncio
import time
from fastapi import APIRouter, HTTPException
from models import DashboardResponse, Activity, Prospect, UpcomingClose
from config import PROSPECTS_DB_ID, ACTIVITIES_DB_ID, DEALS_DB_ID
from notion import query_database, page_to_prospect, page_to_activity, page_to_deal

router = APIRouter(prefix="/api", tags=["dashboard"])

# Simple in-memory TTL cache for dashboard data
_cache = {"data": None, "ts": 0}
CACHE_TTL = 30  # seconds


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard():
    now = time.time()
    if _cache["data"] and (now - _cache["ts"]) < CACHE_TTL:
        return _cache["data"]

    try:
        # Fetch prospects, activities, and deals in parallel
        prospect_task = query_database(PROSPECTS_DB_ID)
        activity_task = query_database(
            ACTIVITIES_DB_ID,
            sorts=[{"property": "Date", "direction": "descending"}],
            page_size=10,
        )
        deals_task = query_database(DEALS_DB_ID)

        prospect_pages, activity_pages, deal_pages = await asyncio.gather(
            prospect_task, activity_task, deals_task
        )

        prospects = [page_to_prospect(p) for p in prospect_pages]
        deals = [page_to_deal(p) for p in deal_pages]

        # Build prospect lookup for fast name resolution
        prospect_lookup = {p["id"]: p for p in prospects}

        # Build deal lookup for fast name resolution
        deal_lookup = {d["id"]: d for d in deals}

        # Count by status
        status_counts: dict[str, int] = {}
        meetings_set = 0
        emails_sent = 0

        for p in prospects:
            status = p.get("status") or "Unknown"
            status_counts[status] = status_counts.get(status, 0) + 1

            if status == "Meeting Set":
                meetings_set += 1
            if status in ("Sent", "Replied", "Meeting Set"):
                emails_sent += 1

        # Pipeline value from deals (active stages only)
        total_pipeline_value = sum(
            d.get("estimated_value", 0) or 0
            for d in deals
            if d.get("stage") not in ("Closed Lost", None)
        )

        prospects_by_status = {s: c for s, c in sorted(status_counts.items())}

        # Resolve prospect names and deal names on activities using lookups
        recent_activities = []
        for ap in activity_pages:
            act = page_to_activity(ap)
            pid = act.get("prospect_id")
            if pid and pid in prospect_lookup:
                act["prospect_name"] = prospect_lookup[pid]["company"]
            did = act.get("deal_id")
            if did and did in deal_lookup:
                act["deal_name"] = deal_lookup[did]["deal_name"]
            recent_activities.append(Activity(**act))

        # Upcoming next actions
        upcoming = [
            p for p in prospects
            if p.get("next_action") and p.get("status") != "Lost"
        ]
        upcoming.sort(key=lambda x: x["next_action"])
        upcoming_actions = [Prospect(**p) for p in upcoming[:10]]

        # Upcoming deal close dates
        today = time.strftime("%Y-%m-%d")
        upcoming_closes = []
        for d in deals:
            cd = d.get("close_date")
            stage = d.get("stage")
            if cd and stage not in ("Closed Won", "Closed Lost", None):
                pid = d.get("prospect_id")
                upcoming_closes.append({
                    "id": d["id"],
                    "deal_name": d["deal_name"],
                    "close_date": cd,
                    "stage": stage,
                    "estimated_value": d.get("estimated_value"),
                    "prospect_name": prospect_lookup.get(pid, {}).get("company") if pid else None,
                })
        upcoming_closes.sort(key=lambda x: x["close_date"] or "")
        upcoming_closes_models = [UpcomingClose(**uc) for uc in upcoming_closes[:10]]

        # Compute total deal value by stage and deal counts
        total_deal_value_by_stage: dict[str, float] = {}
        deal_counts_by_stage: dict[str, int] = {}
        for d in deals:
            stage = d.get("stage") or "Unknown"
            val = d.get("estimated_value") or 0
            if val:
                total_deal_value_by_stage[stage] = total_deal_value_by_stage.get(stage, 0) + val
            deal_counts_by_stage[stage] = deal_counts_by_stage.get(stage, 0) + 1

        # Deals in pipeline (exclude closed lost)
        deals_in_pipeline = sum(
            1 for d in deals if d.get("stage") != "Closed Lost"
        )

        response = DashboardResponse(
            total_prospects=len(prospects),
            prospects_by_status=prospects_by_status,
            total_pipeline_value=total_pipeline_value,
            total_deals=len(deals),
            deals_in_pipeline=deals_in_pipeline,
            meetings_set=meetings_set,
            emails_sent=emails_sent,
            recent_activities=recent_activities,
            upcoming_actions=upcoming_actions,
            upcoming_closes=upcoming_closes_models,
            total_deal_value_by_stage=total_deal_value_by_stage,
            deal_counts_by_stage=deal_counts_by_stage,
        )

        _cache["data"] = response
        _cache["ts"] = now
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
