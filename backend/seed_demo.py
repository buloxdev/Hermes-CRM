"""Seed demo data into Notion for the hackathon presentation.

Creates realistic prospects, deals, and activities that tell a compelling
sales story: an AI bot discovering and nurturing leads in Nashville.

Usage:
    cd sales-crm/backend && source .venv/bin/activate && python seed_demo.py
"""
import json
import urllib.request
from datetime import datetime, timedelta
from config import NOTION_API_KEY, NOTION_API_VERSION, NOTION_BASE_URL, PROSPECTS_DB_ID, DEALS_DB_ID, ACTIVITIES_DB_ID

HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": NOTION_API_VERSION,
    "Content-Type": "application/json",
}

TODAY = datetime.now()
DATE_FMT = "%Y-%m-%d"


def notion_create(database_id: str, properties: dict) -> dict:
    """Create a page in a Notion database."""
    url = f"{NOTION_BASE_URL}/pages"
    body = {
        "parent": {"database_id": database_id},
        "properties": properties,
    }
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())


def title(val: str) -> dict:
    return {"title": [{"text": {"content": val}}]}


def rich(val: str) -> dict:
    if len(val) > 2000:
        val = val[:1997] + "..."
    return {"rich_text": [{"text": {"content": val}}]}


def select(val: str) -> dict:
    return {"select": {"name": val}}


def number(val: float) -> dict:
    return {"number": val}


def url_prop(val: str) -> dict:
    return {"url": val}


def date_prop(val: str) -> dict:
    return {"date": {"start": val}}


def relation(page_ids: list[str]) -> dict:
    return {"relation": [{"id": pid} for pid in page_ids]}


# --- Demo Prospects ---

PROSPECTS = [
    {
        "company": "Houchens Industries",
        "contact_name": "Sarah Mitchell",
        "contact_title": "VP of Supply Chain",
        "contact_email": "s.mitchell@houchens.com",
        "website": "https://www.houchens.com",
        "status": "Meeting Set",
        "industry": "Retail",
        "revenue": "$1B - $5B",
        "employee_count": "10000+",
        "source": "Web Research",
        "key_decision_makers": "Sarah Mitchell (VP Supply Chain), Tom Reed (Director of Logistics)",
        "research_notes": "Houchens Industries is a $3B+ employee-owned conglomerate headquartered in Bowling Green, KY. Operates 400+ retail locations across the Southeast. Recently expanded distribution footprint with a new 500,000 sq ft warehouse in Nashville. Complex multi-state supply chain with inbound from ports and domestic suppliers. Running 3 different carriers for dry goods, looking to consolidate.",
        "draft_email": "Subject: Houchens' new Nashville distribution\n\nHi Sarah,\n\nI saw Houchens opened the new Nashville warehouse. That kind of expansion puts serious pressure on getting freight right across all those locations.\n\nI work with retail companies that need their transportation to keep up with growth, not slow it down. Schneider runs one of the largest US fleets and specializes in exactly this.\n\nWould 15 minutes next week make sense to compare notes?\n\nBest,\nAnthony",
        "last_outreach": (TODAY - timedelta(days=3)).strftime(DATE_FMT),
        "next_action": (TODAY + timedelta(days=2)).strftime(DATE_FMT),
        "next_action_type": "Meeting",
        "follow_up_count": 2,
        "win_probability": "75%",
        "deal_value": 850000,
    },
    {
        "company": "Jarden Home Brands",
        "contact_name": "David Chen",
        "contact_title": "Director of Procurement",
        "contact_email": "d.chen@jardenhome.com",
        "website": "https://www.jardenhomebrands.com",
        "status": "Replied",
        "industry": "Consumer Goods",
        "revenue": "$500M - $1B",
        "employee_count": "2000-10000",
        "source": "Web Research",
        "key_decision_makers": "David Chen (Director Procurement), Lisa Park (VP Operations)",
        "research_notes": "Jarden Home Brands manufactures household consumer goods. Major retailer distribution across Walmart, Target, Kroger. Seasonal volume swings of 40% around holidays. Currently splitting freight between 4 carriers, wants to simplify. Interested in dedicated capacity for peak season.",
        "draft_email": "Subject: Jarden's seasonal freight challenge\n\nHi David,\n\nNoticed Jarden ramps up significantly for holiday season. Keeping freight reliable during 40% volume swings is tough.\n\nI work with consumer goods companies like Jarden that need transportation to keep up with seasonal peaks. Schneider runs dedicated capacity that scales with your business.\n\nWorth a quick 15-minute conversation to see if there is a fit?\n\nBest,\nAnthony",
        "last_outreach": (TODAY - timedelta(days=5)).strftime(DATE_FMT),
        "next_action": (TODAY + timedelta(days=1)).strftime(DATE_FMT),
        "next_action_type": "Call",
        "follow_up_count": 3,
        "win_probability": "50%",
        "deal_value": 420000,
    },
    {
        "company": "Ardent Mills",
        "contact_name": "Marcus Johnson",
        "contact_title": "Senior Director of Logistics",
        "contact_email": "m.johnson@ardentmills.com",
        "website": "https://www.ardentmills.com",
        "status": "Sent",
        "industry": "Food & Beverage",
        "revenue": "$1B - $5B",
        "employee_count": "2000-10000",
        "source": "Web Research",
        "key_decision_makers": "Marcus Johnson (Sr. Director Logistics), Angela Torres (VP Supply Chain)",
        "research_notes": "Ardent Mills is the largest flour miller in North America. Operates 35+ mills and mix plants. Complex inbound grain logistics and outbound flour distribution to bakeries and food manufacturers. Cross-border operations with Canada. Running mostly rail plus some OTR, looking for intermodal options.",
        "draft_email": "Subject: Ardent Mills intermodal options\n\nHi Marcus,\n\nArdent Mills moves serious volume across 35 mills. That kind of network needs flexible capacity, not just one mode.\n\nSchneider runs one of the largest US fleets plus strong intermodal partnerships. We help food manufacturers like Ardent Mills get the right mode for every lane.\n\nCould we grab 15 minutes to talk through how your freight is running?\n\nBest,\nAnthony",
        "last_outreach": (TODAY - timedelta(days=1)).strftime(DATE_FMT),
        "next_action": (TODAY + timedelta(days=4)).strftime(DATE_FMT),
        "next_action_type": "Follow-up Email",
        "follow_up_count": 1,
        "win_probability": "25%",
        "deal_value": 1200000,
    },
    {
        "company": "Bridgestone Americas",
        "contact_name": "Rachel Kim",
        "contact_title": "VP of Distribution",
        "contact_email": "r.kim@bridgestone.com",
        "website": "https://www.bridgestone.com",
        "status": "Email Drafted",
        "industry": "Automotive",
        "revenue": "$5B+",
        "employee_count": "10000+",
        "source": "Web Research",
        "key_decision_makers": "Rachel Kim (VP Distribution), Mike Santos (Director Transportation)",
        "research_notes": "Bridgestone Americas HQ in Nashville. One of the largest tire manufacturers globally. Massive outbound distribution from plants to dealers and retailers. Mexico cross-border operations for manufacturing. Currently using dedicated fleets from multiple carriers, consolidation opportunity.",
        "draft_email": "Subject: Bridgestone's Nashville distribution\n\nHi Rachel,\n\nBridgestone runs one of the most complex distribution networks in the industry. Getting tires from plants to dealers across North America is no small operation.\n\nSchneider specializes in dedicated fleet solutions for manufacturers with nationwide distribution. We also run significant Mexico cross-border capacity.\n\nOpen to a short call to discuss how we might help?\n\nBest,\nAnthony",
        "last_outreach": None,
        "next_action": (TODAY + timedelta(days=3)).strftime(DATE_FMT),
        "next_action_type": "Email",
        "follow_up_count": 0,
        "win_probability": "10%",
        "deal_value": 2000000,
    },
    {
        "company": "Dollar General",
        "contact_name": "James Wright",
        "contact_title": "Director of Inbound Logistics",
        "contact_email": "j.wright@dollartree.com",
        "website": "https://www.dollargeneral.com",
        "status": "New Lead",
        "industry": "Retail",
        "revenue": "$5B+",
        "employee_count": "10000+",
        "source": "Web Research",
        "key_decision_makers": "James Wright (Director Inbound), Patricia Hayes (SVP Supply Chain)",
        "research_notes": "Dollar General operates 19,000+ stores across the US. Massive inbound supply chain from hundreds of vendors to regional DCs. HQ in Goodlettsville, TN (Nashville area). Known for rapid store growth, adding 1,000+ locations per year. Complex last-mile to rural locations.",
        "draft_email": None,
        "last_outreach": None,
        "next_action": None,
        "next_action_type": None,
        "follow_up_count": 0,
        "win_probability": None,
        "deal_value": None,
    },
    {
        "company": "Gibson Brands",
        "contact_name": "Ana Reyes",
        "contact_title": "Head of Operations",
        "contact_email": "a.reyes@gibson.com",
        "website": "https://www.gibson.com",
        "status": "Researched",
        "industry": "Consumer Goods",
        "revenue": "$100M - $200M",
        "employee_count": "500-2000",
        "source": "Web Research",
        "key_decision_makers": "Ana Reyes (Head of Operations), Chris Lee (Warehouse Manager)",
        "research_notes": "Gibson Brands, legendary guitar manufacturer, HQ in Nashville. Ships high-value, fragile products globally. Needs white-glove freight handling. Seasonal spikes around holiday retail. Currently using LTL for most outbound, opportunity for dedicated fleet on high-volume lanes.",
        "draft_email": None,
        "last_outreach": None,
        "next_action": (TODAY + timedelta(days=5)).strftime(DATE_FMT),
        "next_action_type": "LinkedIn",
        "follow_up_count": 0,
        "win_probability": "10%",
        "deal_value": 180000,
    },
    {
        "company": "Mars Petcare",
        "contact_name": "Kevin O'Brien",
        "contact_title": "VP of Supply Chain",
        "contact_email": "k.obrien@mars.com",
        "website": "https://www.mars.com/our-companies/petcare",
        "status": "Meeting Set",
        "industry": "Food & Beverage",
        "revenue": "$5B+",
        "employee_count": "10000+",
        "source": "Referral",
        "key_decision_makers": "Kevin O'Brien (VP Supply Chain), Diana Morales (Director Transportation)",
        "research_notes": "Mars Petcare US HQ in Nashville. Manufactures and distributes pet food brands (Pedigree, Whiskas, Royal Canin). Massive dry goods distribution. Recently invested $200M in manufacturing expansion. Running dedicated fleets but capacity constrained on Southeast lanes.",
        "draft_email": "Subject: Mars Petcare capacity in the Southeast\n\nHi Kevin,\n\nHeard great things about the expansion at Mars Petcare. That kind of investment in manufacturing means freight volume is going up fast.\n\nSchneider has dedicated capacity available on the exact Southeast lanes Mars is running. We specialize in food and beverage distribution where reliability is everything.\n\nWould 15 minutes next week make sense to compare notes?\n\nBest,\nAnthony",
        "last_outreach": (TODAY - timedelta(days=2)).strftime(DATE_FMT),
        "next_action": (TODAY + timedelta(days=1)).strftime(DATE_FMT),
        "next_action_type": "Meeting",
        "follow_up_count": 1,
        "win_probability": "50%",
        "deal_value": 950000,
    },
    {
        "company": "Cracker Barrel",
        "contact_name": "Tom Bradley",
        "contact_title": "Director of Supply Chain",
        "contact_email": "t.bradley@crackerbarrel.com",
        "website": "https://www.crackerbarrel.com",
        "status": "Lost",
        "industry": "Food & Beverage",
        "revenue": "$1B - $5B",
        "employee_count": "10000+",
        "source": "Web Research",
        "key_decision_makers": "Tom Bradley (Director Supply Chain)",
        "research_notes": "Cracker Barrel Old Country Store. 660+ locations. Complex restaurant supply chain with perishable and dry goods. Decided to renew with current carrier, will revisit in Q3.",
        "draft_email": None,
        "last_outreach": (TODAY - timedelta(days=14)).strftime(DATE_FMT),
        "next_action": (TODAY + timedelta(days=90)).strftime(DATE_FMT),
        "next_action_type": "Email",
        "follow_up_count": 4,
        "win_probability": None,
        "deal_value": None,
    },
]


# --- Demo Deals ---

DEALS = [
    {
        "deal_name": "Houchens - Dedicated Fleet",
        "stage": "Proposal",
        "estimated_value": 850000,
        "close_date": (TODAY + timedelta(days=30)).strftime(DATE_FMT),
        "competitors": "Werner, Heartland Express",
        "notes": "Strong interest in dedicated fleet for Southeast regional. Sarah wants proposal by end of month. Key differentiator: Mexico cross-border for produce sourcing.",
    },
    {
        "deal_name": "Mars Petcare - Southeast Lanes",
        "stage": "Discovery",
        "estimated_value": 950000,
        "close_date": (TODAY + timedelta(days=45)).strftime(DATE_FMT),
        "competitors": "J.B. Hunt, Swift",
        "notes": "Capacity constrained on Nashville to Southeast lanes. Meeting next week to review lane analysis. Expansion creating 20% more volume.",
    },
    {
        "deal_name": "Jarden - Peak Season Dedicated",
        "stage": "Negotiation",
        "estimated_value": 420000,
        "close_date": (TODAY + timedelta(days=14)).strftime(DATE_FMT),
        "competitors": "Covenant Transport",
        "notes": "Seasonal dedicated capacity for Q4 holiday ramp. David wants 15 trucks locked in by July. Pricing competitive, need to finalize.",
    },
    {
        "deal_name": "Bridgestone - Mexico Cross-Border",
        "stage": "Closed Won",
        "estimated_value": 1200000,
        "close_date": (TODAY - timedelta(days=5)).strftime(DATE_FMT),
        "competitors": "Knight-Swift",
        "notes": "Closed Q1. Dedicated capacity for Nashville to Laredo and Matamoros lanes. 20 trucks, 3-year contract. Renewal option built in.",
    },
    {
        "deal_name": "Cracker Barrel - Dry Goods Consolidation",
        "stage": "Closed Lost",
        "estimated_value": 350000,
        "close_date": (TODAY - timedelta(days=10)).strftime(DATE_FMT),
        "competitors": "XPO Logistics",
        "notes": "Lost to incumbent renewal. Two-year lock with XPO. Will revisit Q3 2026. Keep warm with quarterly check-ins.",
    },
    {
        "deal_name": "Ardent Mills - Intermodal Pilot",
        "stage": "Qualification",
        "estimated_value": 600000,
        "close_date": (TODAY + timedelta(days=60)).strftime(DATE_FMT),
        "competitors": "Hub Group",
        "notes": "Evaluating intermodal vs OTR for mill-to-bakery lanes. Marcus wants pilot on 3 lanes before committing to full network.",
    },
]


# --- Demo Activities ---

ACTIVITIES_TEMPLATE = [
    # Houchens
    {"activity": "Initial email sent", "type": "Email", "offset": -10, "notes": "Sent intro email referencing Nashville warehouse expansion.", "outcome": "Opened and clicked link", "prospect_idx": 0},
    {"activity": "LinkedIn connection accepted", "type": "LinkedIn", "offset": -8, "notes": "Sarah accepted connection request.", "outcome": "Connected", "prospect_idx": 0},
    {"activity": "Follow-up call", "type": "Call", "offset": -5, "notes": "Discussed current carrier pain points. She mentioned 3 different carriers for dry goods.", "outcome": "Agreed to meeting", "prospect_idx": 0},
    {"activity": "Meeting scheduled", "type": "Meeting", "offset": -3, "notes": "Calendar invite sent for next Tuesday 10am CT.", "outcome": "Confirmed", "prospect_idx": 0},

    # Jarden
    {"activity": "Cold email sent", "type": "Email", "offset": -14, "notes": "Referenced seasonal volume swings and dedicated capacity.", "outcome": "Replied same day", "prospect_idx": 1},
    {"activity": "Discovery call", "type": "Call", "offset": -10, "notes": "Learned about 4 carrier situation. He wants to consolidate.", "outcome": "Requested proposal", "prospect_idx": 1},
    {"activity": "Sent lane analysis", "type": "Email", "offset": -7, "notes": "Shared top 20 lane pricing comparison.", "outcome": "Reviewed with Lisa Park", "prospect_idx": 1},
    {"activity": "Negotiation call", "type": "Call", "offset": -5, "notes": "Reviewed pricing, discussed dedicated vs contract rates.", "outcome": "Verbal agreement on 10 lanes", "prospect_idx": 1},

    # Ardent Mills
    {"activity": "Initial outreach", "type": "Email", "offset": -1, "notes": "Sent email about intermodal options for mill-to-bakery lanes.", "outcome": "Awaiting response", "prospect_idx": 2},

    # Mars Petcare
    {"activity": "Referral introduction", "type": "Email", "offset": -7, "notes": "Introduced via Mike at Houchens. Kevin was receptive.", "outcome": "Quick reply, interested", "prospect_idx": 6},
    {"activity": "Intro call", "type": "Call", "offset": -5, "notes": "Discussed expansion plans and Southeast capacity needs.", "outcome": "Wants to see options", "prospect_idx": 6},
    {"activity": "Sent capacity overview", "type": "Email", "offset": -3, "notes": "Shared available dedicated capacity on Nashville-Atlanta, Nashville-Charlotte lanes.", "outcome": "Forwarded to Diana Morales", "prospect_idx": 6},
    {"activity": "Meeting confirmed", "type": "Meeting", "offset": -2, "notes": "Meeting set for next Wednesday with Kevin and Diana.", "outcome": "Calendar invite accepted", "prospect_idx": 6},

    # Cracker Barrel (lost)
    {"activity": "Initial meeting", "type": "Meeting", "offset": -30, "notes": "Met with Tom. Good conversation but locked into 2-year contract.", "outcome": "Not ready to switch", "prospect_idx": 7},
    {"activity": "Follow-up email", "type": "Email", "offset": -20, "notes": "Sent capabilities deck anyway to stay top of mind.", "outcome": "Polite pass", "prospect_idx": 7},
    {"activity": "Final check-in", "type": "Call", "offset": -14, "notes": "Confirmed they renewed with current carrier.", "outcome": "Will revisit Q3", "prospect_idx": 7},

    # Gibson
    {"activity": "LinkedIn research", "type": "LinkedIn", "offset": -2, "notes": "Reviewed Ana's background. She came from logistics consulting.", "outcome": "Connection request sent", "prospect_idx": 5},
]


def seed():
    print("=" * 60)
    print("  Seeding demo data into Notion")
    print("=" * 60)

    # Create prospects
    print("\n--- Creating Prospects ---")
    prospect_ids = []
    for i, p in enumerate(PROSPECTS):
        props = {
            "Company": title(p["company"]),
            "Contact Name": rich(p["contact_name"]),
            "Contact Title": rich(p["contact_title"]),
            "Status": select(p["status"]),
            "Industry": select(p["industry"]),
            "Revenue": select(p["revenue"]),
            "Employee Count": select(p["employee_count"]),
            "Source": select(p["source"]),
            "Key Decision Makers": rich(p["key_decision_makers"]),
            "Research Notes": rich(p["research_notes"]),
        }

        if p.get("contact_email"):
            props["Contact Email"] = {"email": p["contact_email"]}
        if p.get("website"):
            props["Website"] = url_prop(p["website"])
        if p.get("draft_email"):
            props["Draft Email"] = rich(p["draft_email"])
        if p.get("last_outreach"):
            props["Last Outreach"] = date_prop(p["last_outreach"])
        if p.get("next_action"):
            props["Next Action"] = date_prop(p["next_action"])
        if p.get("next_action_type"):
            props["Next Action Type"] = select(p["next_action_type"])
        if p.get("follow_up_count") is not None:
            props["Follow-Up #"] = number(p["follow_up_count"])
        if p.get("win_probability"):
            props["Win Probability"] = select(p["win_probability"])
        if p.get("deal_value"):
            props["Deal Value"] = number(p["deal_value"])

        try:
            result = notion_create(PROSPECTS_DB_ID, props)
            pid = result["id"]
            prospect_ids.append(pid)
            print(f"  [{i+1}/{len(PROSPECTS)}] {p['company']} ({p['status']}) -> {pid}")
        except Exception as e:
            print(f"  [{i+1}/{len(PROSPECTS)}] {p['company']} FAILED: {e}")
            prospect_ids.append(None)

    # Create deals
    print("\n--- Creating Deals ---")
    deal_ids = []
    for i, d in enumerate(DEALS):
        props = {
            "Deal Name": title(d["deal_name"]),
            "Stage": select(d["stage"]),
            "Estimated Value": number(d["estimated_value"]),
            "Close Date": date_prop(d["close_date"]),
            "Competitors": rich(d["competitors"]),
            "Notes": rich(d["notes"]),
        }

        # Link to prospect
        prospect_link_map = {0: 0, 1: 6, 2: 1, 3: 3, 4: 7, 5: 2}
        prospect_link = prospect_link_map[i]
        if prospect_ids[prospect_link]:
            props["Prospect"] = relation([prospect_ids[prospect_link]])

        try:
            result = notion_create(DEALS_DB_ID, props)
            did = result["id"]
            deal_ids.append(did)
            print(f"  [{i+1}/{len(DEALS)}] {d['deal_name']} ({d['stage']}) -> {did}")
        except Exception as e:
            print(f"  [{i+1}/{len(DEALS)}] {d['deal_name']} FAILED: {e}")
            deal_ids.append(None)

    # Create activities
    print("\n--- Creating Activities ---")
    created = 0
    for i, a in enumerate(ACTIVITIES_TEMPLATE):
        activity_date = (TODAY + timedelta(days=a["offset"])).strftime(DATE_FMT)
        props = {
            "Activity": title(a["activity"]),
            "Type": select(a["type"]),
            "Date": date_prop(activity_date),
            "Notes": rich(a["notes"]),
            "Outcome": select(a["outcome"]),
        }

        if prospect_ids[a["prospect_idx"]]:
            props["Prospect"] = relation([prospect_ids[a["prospect_idx"]]])

        try:
            notion_create(ACTIVITIES_DB_ID, props)
            created += 1
        except Exception as e:
            print(f"  Activity '{a['activity']}' FAILED: {e}")

    print(f"  Created {created}/{len(ACTIVITIES_TEMPLATE)} activities")

    # Summary
    print("\n" + "=" * 60)
    print("  Demo data seeded!")
    print(f"  Prospects: {sum(1 for p in prospect_ids if p)}/{len(PROSPECTS)}")
    print(f"  Deals: {sum(1 for d in deal_ids if d)}/{len(DEALS)}")
    print(f"  Activities: {created}/{len(ACTIVITIES_TEMPLATE)}")
    print("=" * 60)


if __name__ == "__main__":
    seed()
