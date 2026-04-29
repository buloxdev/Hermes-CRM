import asyncio
import time
from datetime import date, datetime
from fastapi import APIRouter, HTTPException
from models import DashboardResponse, Activity, Prospect, UpcomingClose, TopAccount, DailyBriefItem
from config import PROSPECTS_DB_ID, ACTIVITIES_DB_ID, DEALS_DB_ID
from notion import query_database, page_to_prospect, page_to_activity, page_to_deal

router = APIRouter(prefix="/api", tags=["dashboard"])

# Simple in-memory TTL cache for dashboard data
_cache = {"data": None, "ts": 0}
CACHE_TTL = 30  # seconds


def clear_dashboard_cache():
    _cache["data"] = None
    _cache["ts"] = 0

TARGET_INDUSTRIES = {
    "retail",
    "food & beverage",
    "food and beverage",
    "manufacturing",
    "consumer goods",
    "cpg",
    "automotive",
}

READY_STATUSES = {"Researched", "Email Drafted", "Replied", "Meeting Set"}
ACTIVE_DEAL_STAGES = {"Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won"}


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value[:10]).date()
    except ValueError:
        return None


def _revenue_in_target(revenue: str | None) -> bool:
    if not revenue:
        return False
    normalized = revenue.replace(" ", "").upper()
    return any(token in normalized for token in ("100M", "200M", "500M", "1B", "5B"))


def _score_top_account(prospect: dict, active_deal_value: float, latest_activity: date | None) -> tuple[int, str, str]:
    score = 0
    reasons: list[str] = []
    today = date.today()

    industry = (prospect.get("industry") or "").lower()
    if any(target in industry for target in TARGET_INDUSTRIES):
        score += 15
        reasons.append("target industry")

    if _revenue_in_target(prospect.get("revenue")):
        score += 15
        reasons.append("revenue fit")

    if prospect.get("contact_name") or prospect.get("contact_title"):
        score += 10
        reasons.append("contact identified")

    if prospect.get("research_notes"):
        score += 10
        reasons.append("research ready")

    if prospect.get("draft_email"):
        score += 10
        reasons.append("draft ready")

    status = prospect.get("status")
    if status in READY_STATUSES:
        score += 15
        reasons.append(f"{status.lower()} status")

    next_action = _parse_date(prospect.get("next_action"))
    if next_action:
        days_until = (next_action - today).days
        if days_until < 0:
            score += 25
            reasons.append("overdue next action")
        elif days_until == 0:
            score += 25
            reasons.append("next action due today")
        elif days_until <= 3:
            score += 15
            reasons.append("next action this week")

    potential = active_deal_value or prospect.get("deal_value") or 0
    if potential >= 1_000_000:
        score += 15
        reasons.append("high value")
    elif potential >= 250_000:
        score += 10
        reasons.append("meaningful value")

    if latest_activity:
        days_stale = (today - latest_activity).days
        if days_stale >= 14:
            score += 10
            reasons.append("stale activity")
    else:
        score += 10
        reasons.append("no activity logged")

    if score >= 80:
        priority = "High"
    elif score >= 55:
        priority = "Medium"
    else:
        priority = "Low"

    reason = ", ".join(reasons[:3]) if reasons else "Needs qualification"
    return min(score, 100), priority, reason


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

        # Build latest activity and active deal value lookups for account prioritization
        latest_activity_by_prospect: dict[str, date] = {}
        for ap in activity_pages:
            act = page_to_activity(ap)
            activity_date = _parse_date(act.get("date"))
            pid = act.get("prospect_id")
            if pid and activity_date:
                current = latest_activity_by_prospect.get(pid)
                if current is None or activity_date > current:
                    latest_activity_by_prospect[pid] = activity_date

        active_deal_value_by_prospect: dict[str, float] = {}
        for d in deals:
            pid = d.get("prospect_id")
            stage = d.get("stage")
            if pid and stage in ACTIVE_DEAL_STAGES:
                active_deal_value_by_prospect[pid] = active_deal_value_by_prospect.get(pid, 0) + (d.get("estimated_value") or 0)

        top_account_rows = []
        for p in prospects:
            if p.get("status") == "Lost":
                continue
            active_deal_value = active_deal_value_by_prospect.get(p["id"], 0)
            score, priority, reason = _score_top_account(
                p,
                active_deal_value,
                latest_activity_by_prospect.get(p["id"]),
            )
            top_account_rows.append({
                "id": p["id"],
                "company": p["company"],
                "contact_name": p.get("contact_name"),
                "contact_title": p.get("contact_title"),
                "status": p.get("status"),
                "score": score,
                "priority": priority,
                "reason": reason,
                "next_action": p.get("next_action"),
                "next_action_type": p.get("next_action_type"),
                "deal_value": p.get("deal_value"),
                "active_deal_value": active_deal_value,
            })
        top_account_rows.sort(
            key=lambda x: (
                x["score"],
                x.get("active_deal_value") or x.get("deal_value") or 0,
            ),
            reverse=True,
        )
        top_accounts = [TopAccount(**row) for row in top_account_rows[:5]]

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

        today_date = date.today()
        overdue_actions = [
            p for p in prospects
            if p.get("status") != "Lost"
            and (action_date := _parse_date(p.get("next_action")))
            and action_date < today_date
        ]
        due_today_actions = [
            p for p in prospects
            if p.get("status") != "Lost"
            and (action_date := _parse_date(p.get("next_action")))
            and action_date == today_date
        ]
        closing_this_week = [
            d for d in deals
            if d.get("stage") not in ("Closed Won", "Closed Lost", None)
            and (close_date := _parse_date(d.get("close_date")))
            and 0 <= (close_date - today_date).days <= 7
        ]
        stale_active_deals = []
        for d in deals:
            if d.get("stage") not in ACTIVE_DEAL_STAGES or d.get("stage") == "Closed Won":
                continue
            pid = d.get("prospect_id")
            latest_activity = latest_activity_by_prospect.get(pid) if pid else None
            if latest_activity is None or (today_date - latest_activity).days >= 14:
                stale_active_deals.append(d)

        drafts_ready = [
            p for p in prospects
            if p.get("status") != "Lost" and p.get("draft_email")
        ]
        researched_needs_draft = [
            p for p in prospects
            if p.get("status") in ("Researched", "Email Drafted") and not p.get("draft_email")
        ]
        missing_next_action = [
            p for p in prospects
            if p.get("status") in READY_STATUSES and not p.get("next_action")
        ]

        brief_rows = []
        if overdue_actions:
            first = sorted(overdue_actions, key=lambda p: p.get("next_action") or "")[0]
            brief_rows.append({
                "id": "overdue-actions",
                "type": "action",
                "title": "Overdue follow-ups",
                "subtitle": f"Start with {first.get('company') or 'the oldest account'}.",
                "count": len(overdue_actions),
                "priority": "High",
                "href": f"/prospects/{first['id']}",
            })
        if due_today_actions:
            first = sorted(due_today_actions, key=lambda p: p.get("company") or "")[0]
            brief_rows.append({
                "id": "due-today",
                "type": "action",
                "title": "Actions due today",
                "subtitle": f"Work {first.get('company') or 'the first account'} before new research.",
                "count": len(due_today_actions),
                "priority": "High",
                "href": f"/prospects/{first['id']}",
            })
        if closing_this_week:
            first = sorted(closing_this_week, key=lambda d: d.get("close_date") or "")[0]
            brief_rows.append({
                "id": "closing-this-week",
                "type": "deal",
                "title": "Deals closing this week",
                "subtitle": f"Nearest close: {first.get('deal_name') or 'active deal'}.",
                "count": len(closing_this_week),
                "priority": "High",
                "href": f"/deals/{first['id']}",
            })
        if stale_active_deals:
            first = stale_active_deals[0]
            brief_rows.append({
                "id": "stale-deals",
                "type": "deal",
                "title": "Stale active deals",
                "subtitle": f"Log a next step for {first.get('deal_name') or 'an active deal'}.",
                "count": len(stale_active_deals),
                "priority": "Medium",
                "href": f"/deals/{first['id']}",
            })
        if drafts_ready:
            first = sorted(drafts_ready, key=lambda p: p.get("company") or "")[0]
            brief_rows.append({
                "id": "drafts-ready",
                "type": "outreach",
                "title": "Drafts ready for review",
                "subtitle": f"Review the draft for {first.get('company') or 'the first account'}.",
                "count": len(drafts_ready),
                "priority": "Medium",
                "href": f"/prospects/{first['id']}",
            })
        if researched_needs_draft:
            first = sorted(researched_needs_draft, key=lambda p: p.get("company") or "")[0]
            brief_rows.append({
                "id": "needs-draft",
                "type": "outreach",
                "title": "Researched accounts need drafts",
                "subtitle": f"Turn research into outreach for {first.get('company') or 'the first account'}.",
                "count": len(researched_needs_draft),
                "priority": "Medium",
                "href": f"/prospects/{first['id']}",
            })
        if missing_next_action:
            first = sorted(missing_next_action, key=lambda p: p.get("company") or "")[0]
            brief_rows.append({
                "id": "missing-next-action",
                "type": "hygiene",
                "title": "Accounts need next actions",
                "subtitle": f"Set a next step for {first.get('company') or 'an active account'}.",
                "count": len(missing_next_action),
                "priority": "Low",
                "href": f"/prospects/{first['id']}",
            })
        daily_brief = [DailyBriefItem(**row) for row in brief_rows[:5]]

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
            top_accounts=top_accounts,
            daily_brief=daily_brief,
            total_deal_value_by_stage=total_deal_value_by_stage,
            deal_counts_by_stage=deal_counts_by_stage,
        )

        _cache["data"] = response
        _cache["ts"] = now
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
