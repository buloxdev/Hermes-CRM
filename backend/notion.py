import httpx
from typing import Optional, Any
from config import NOTION_API_KEY, NOTION_API_VERSION, NOTION_BASE_URL

HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": NOTION_API_VERSION,
    "Content-Type": "application/json",
}


# --- Notion property helpers ---

def get_title(props: dict, key: str) -> Optional[str]:
    val = props.get(key, {})
    if val.get("type") == "title" and val.get("title"):
        return val["title"][0].get("plain_text", "")
    return None


def get_rich_text(props: dict, key: str) -> Optional[str]:
    val = props.get(key, {})
    if val.get("type") == "rich_text" and val.get("rich_text"):
        return "".join(t.get("plain_text", "") for t in val["rich_text"])
    return None


def get_select(props: dict, key: str) -> Optional[str]:
    val = props.get(key, {})
    if val.get("type") == "select" and val.get("select"):
        return val["select"].get("name")
    return None


def get_number(props: dict, key: str) -> Optional[float]:
    val = props.get(key, {})
    if val.get("type") == "number":
        return val.get("number")
    return None


def get_email(props: dict, key: str) -> Optional[str]:
    val = props.get(key, {})
    return val.get("email")


def get_phone(props: dict, key: str) -> Optional[str]:
    val = props.get(key, {})
    return val.get("phone_number")


def get_url(props: dict, key: str) -> Optional[str]:
    val = props.get(key, {})
    return val.get("url")


def get_date(props: dict, key: str) -> Optional[str]:
    val = props.get(key, {})
    if val.get("type") == "date" and val.get("date"):
        return val["date"].get("start")
    return None


def get_relation_ids(props: dict, key: str) -> list[str]:
    val = props.get(key, {})
    if val.get("type") == "relation" and val.get("relation"):
        return [r["id"] for r in val["relation"]]
    return []


# --- Notion property builders for creating/updating pages ---

def title_prop(value: str) -> dict:
    return {"title": [{"text": {"content": value}}]}


def rich_text_prop(value: Optional[str]) -> dict:
    if value is None:
        return {"rich_text": []}
    return {"rich_text": [{"text": {"content": value}}]}


def select_prop(value: Optional[str]) -> dict:
    if value is None or value == "":
        return {"select": None}
    return {"select": {"name": value}}


def number_prop(value: Optional[float]) -> dict:
    if value is None:
        return {"number": None}
    return {"number": value}


def email_prop(value: Optional[str]) -> dict:
    return {"email": value}


def phone_prop(value: Optional[str]) -> dict:
    return {"phone_number": value}


def url_prop(value: Optional[str]) -> dict:
    return {"url": value}


def date_prop(value: Optional[str]) -> dict:
    if value is None:
        return {"date": None}
    return {"date": {"start": value}}


def relation_prop(page_ids: list[str]) -> dict:
    return {"relation": [{"id": pid} for pid in page_ids]}


# --- API calls ---

async def query_database(database_id: str, filter_obj: Optional[dict] = None,
                         sorts: Optional[list] = None, page_size: int = 100) -> list[dict]:
    url = f"{NOTION_BASE_URL}/databases/{database_id}/query"
    body: dict[str, Any] = {"page_size": page_size}
    if filter_obj:
        body["filter"] = filter_obj
    if sorts:
        body["sorts"] = sorts

    results = []
    has_more = True
    start_cursor = None

    async with httpx.AsyncClient() as client:
        while has_more:
            if start_cursor:
                body["start_cursor"] = start_cursor
            resp = await client.post(url, headers=HEADERS, json=body)
            resp.raise_for_status()
            data = resp.json()
            results.extend(data.get("results", []))
            has_more = data.get("has_more", False)
            start_cursor = data.get("next_cursor")

    return results


async def get_page(page_id: str) -> dict:
    url = f"{NOTION_BASE_URL}/pages/{page_id}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=HEADERS)
        resp.raise_for_status()
        return resp.json()


async def create_page(database_id: str, properties: dict) -> dict:
    url = f"{NOTION_BASE_URL}/pages"
    body = {
        "parent": {"database_id": database_id},
        "properties": properties,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=HEADERS, json=body)
        resp.raise_for_status()
        return resp.json()


async def update_page(page_id: str, properties: dict) -> dict:
    url = f"{NOTION_BASE_URL}/pages/{page_id}"
    body = {"properties": properties}
    async with httpx.AsyncClient() as client:
        resp = await client.patch(url, headers=HEADERS, json=body)
        resp.raise_for_status()
        return resp.json()


# --- Converters: Notion page -> Pydantic model dicts ---

def page_to_prospect(page: dict) -> dict:
    props = page["properties"]
    return {
        "id": page["id"],
        "company": get_title(props, "Company") or "",
        "contact_name": get_rich_text(props, "Contact Name"),
        "contact_title": get_rich_text(props, "Contact Title"),
        "contact_email": get_email(props, "Contact Email"),
        "contact_phone": get_phone(props, "Contact Phone"),
        "website": get_url(props, "Website"),
        "status": get_select(props, "Status"),
        "industry": get_select(props, "Industry"),
        "revenue": get_select(props, "Revenue"),
        "employee_count": get_select(props, "Employee Count"),
        "source": get_select(props, "Source"),
        "key_decision_makers": get_rich_text(props, "Key Decision Makers"),
        "research_notes": get_rich_text(props, "Research Notes"),
        "draft_email": get_rich_text(props, "Draft Email"),
        "last_outreach": get_date(props, "Last Outreach"),
        "next_action": get_date(props, "Next Action"),
        "next_action_type": get_select(props, "Next Action Type"),
        "follow_up_count": get_number(props, "Follow-Up #"),
        "win_probability": get_select(props, "Win Probability"),
        "deal_value": get_number(props, "Deal Value"),
        "activities": get_relation_ids(props, "Activities"),
        "deals": get_relation_ids(props, "Deals"),
    }


def page_to_deal(page: dict) -> dict:
    props = page["properties"]
    prospect_ids = get_relation_ids(props, "Prospect")
    return {
        "id": page["id"],
        "deal_name": get_title(props, "Deal Name") or "",
        "stage": get_select(props, "Stage"),
        "estimated_value": get_number(props, "Estimated Value"),
        "close_date": get_date(props, "Close Date"),
        "competitors": get_rich_text(props, "Competitors"),
        "notes": get_rich_text(props, "Notes"),
        "prospect_id": prospect_ids[0] if prospect_ids else None,
    }


def page_to_activity(page: dict) -> dict:
    props = page["properties"]
    prospect_ids = get_relation_ids(props, "Prospect")
    deal_ids = get_relation_ids(props, "Deal")
    return {
        "id": page["id"],
        "activity": get_title(props, "Activity") or "",
        "type": get_select(props, "Type"),
        "date": get_date(props, "Date"),
        "notes": get_rich_text(props, "Notes"),
        "outcome": get_select(props, "Outcome"),
        "prospect_id": prospect_ids[0] if prospect_ids else None,
        "deal_id": deal_ids[0] if deal_ids else None,
    }


# --- Build Notion property dicts from Pydantic models ---

def prospect_create_props(data) -> dict:
    props = {
        "Company": title_prop(data.company),
    }
    if data.contact_name is not None:
        props["Contact Name"] = rich_text_prop(data.contact_name)
    if data.contact_title is not None:
        props["Contact Title"] = rich_text_prop(data.contact_title)
    if data.contact_email is not None:
        props["Contact Email"] = email_prop(data.contact_email)
    if data.contact_phone is not None:
        props["Contact Phone"] = phone_prop(data.contact_phone)
    if data.website is not None:
        props["Website"] = url_prop(data.website)
    if data.status is not None:
        props["Status"] = select_prop(data.status.value if hasattr(data.status, "value") else data.status)
    if data.industry is not None:
        props["Industry"] = select_prop(data.industry.value if hasattr(data.industry, "value") else data.industry)
    if data.revenue is not None:
        props["Revenue"] = select_prop(data.revenue.value if hasattr(data.revenue, "value") else data.revenue)
    if data.employee_count is not None:
        props["Employee Count"] = select_prop(data.employee_count.value if hasattr(data.employee_count, "value") else data.employee_count)
    if data.source is not None:
        props["Source"] = select_prop(data.source.value if hasattr(data.source, "value") else data.source)
    if data.key_decision_makers is not None:
        props["Key Decision Makers"] = rich_text_prop(data.key_decision_makers)
    if data.research_notes is not None:
        props["Research Notes"] = rich_text_prop(data.research_notes)
    if data.draft_email is not None:
        props["Draft Email"] = rich_text_prop(data.draft_email)
    if data.last_outreach is not None:
        props["Last Outreach"] = date_prop(data.last_outreach)
    if data.next_action is not None:
        props["Next Action"] = date_prop(data.next_action)
    if data.next_action_type is not None:
        props["Next Action Type"] = select_prop(data.next_action_type.value if hasattr(data.next_action_type, "value") else data.next_action_type)
    if data.follow_up_count is not None:
        props["Follow-Up #"] = number_prop(data.follow_up_count)
    if data.win_probability is not None:
        props["Win Probability"] = select_prop(data.win_probability.value if hasattr(data.win_probability, "value") else data.win_probability)
    if data.deal_value is not None:
        props["Deal Value"] = number_prop(data.deal_value)
    return props


def prospect_update_props(data) -> dict:
    props = {}
    for field, key in [
        ("company", "Company"), ("contact_name", "Contact Name"),
        ("contact_title", "Contact Title"), ("contact_email", "Contact Email"),
        ("contact_phone", "Contact Phone"), ("website", "Website"),
        ("key_decision_makers", "Key Decision Makers"),
        ("research_notes", "Research Notes"), ("draft_email", "Draft Email"),
    ]:
        val = getattr(data, field, None)
        if val is not None:
            if key == "Company":
                props[key] = title_prop(val)
            elif key in ("Contact Email",):
                props[key] = email_prop(val)
            elif key in ("Contact Phone",):
                props[key] = phone_prop(val)
            elif key in ("Website",):
                props[key] = url_prop(val)
            else:
                props[key] = rich_text_prop(val)

    for field, key in [
        ("status", "Status"), ("industry", "Industry"), ("revenue", "Revenue"),
        ("employee_count", "Employee Count"), ("source", "Source"),
        ("next_action_type", "Next Action Type"), ("win_probability", "Win Probability"),
    ]:
        val = getattr(data, field, None)
        if val is not None:
            props[key] = select_prop(val.value if hasattr(val, "value") else val)

    for field, key in [("last_outreach", "Last Outreach"), ("next_action", "Next Action")]:
        val = getattr(data, field, None)
        if val is not None:
            props[key] = date_prop(val)

    if data.follow_up_count is not None:
        props["Follow-Up #"] = number_prop(data.follow_up_count)
    if data.deal_value is not None:
        props["Deal Value"] = number_prop(data.deal_value)

    return props


def deal_create_props(data) -> dict:
    props = {
        "Deal Name": title_prop(data.deal_name),
    }
    if data.stage is not None:
        props["Stage"] = select_prop(data.stage.value if hasattr(data.stage, "value") else data.stage)
    if data.estimated_value is not None:
        props["Estimated Value"] = number_prop(data.estimated_value)
    if data.close_date is not None:
        props["Close Date"] = date_prop(data.close_date)
    if data.competitors is not None:
        props["Competitors"] = rich_text_prop(data.competitors)
    if data.notes is not None:
        props["Notes"] = rich_text_prop(data.notes)
    if data.prospect_id is not None:
        props["Prospect"] = relation_prop([data.prospect_id])
    return props


def deal_update_props(data) -> dict:
    props = {}
    if data.deal_name is not None:
        props["Deal Name"] = title_prop(data.deal_name)
    if data.stage is not None:
        props["Stage"] = select_prop(data.stage.value if hasattr(data.stage, "value") else data.stage)
    if data.estimated_value is not None:
        props["Estimated Value"] = number_prop(data.estimated_value)
    if data.close_date is not None:
        props["Close Date"] = date_prop(data.close_date)
    if data.competitors is not None:
        props["Competitors"] = rich_text_prop(data.competitors)
    if data.notes is not None:
        props["Notes"] = rich_text_prop(data.notes)
    if data.prospect_id is not None:
        props["Prospect"] = relation_prop([data.prospect_id])
    return props


def activity_create_props(data) -> dict:
    props = {
        "Activity": title_prop(data.activity),
    }
    if data.type is not None:
        props["Type"] = select_prop(data.type.value if hasattr(data.type, "value") else data.type)
    if data.date is not None:
        props["Date"] = date_prop(data.date)
    if data.notes is not None:
        props["Notes"] = rich_text_prop(data.notes)
    if data.outcome is not None:
        props["Outcome"] = select_prop(data.outcome.value if hasattr(data.outcome, "value") else data.outcome)
    if data.prospect_id is not None:
        props["Prospect"] = relation_prop([data.prospect_id])
    if data.deal_id is not None:
        props["Deal"] = relation_prop([data.deal_id])
    return props


def activity_update_props(data) -> dict:
    props = {}
    if data.activity is not None:
        props["Activity"] = title_prop(data.activity)
    if data.type is not None:
        props["Type"] = select_prop(data.type.value if hasattr(data.type, "value") else data.type)
    if data.date is not None:
        props["Date"] = date_prop(data.date)
    if data.notes is not None:
        props["Notes"] = rich_text_prop(data.notes)
    if data.outcome is not None:
        props["Outcome"] = select_prop(data.outcome.value if hasattr(data.outcome, "value") else data.outcome)
    if data.prospect_id is not None:
        props["Prospect"] = relation_prop([data.prospect_id])
    if data.deal_id is not None:
        props["Deal"] = relation_prop([data.deal_id])
    return props
