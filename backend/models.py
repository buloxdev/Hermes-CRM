from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ProspectStatus(str, Enum):
    NEW_LEAD = "New Lead"
    RESEARCHED = "Researched"
    EMAIL_DRAFTED = "Email Drafted"
    SENT = "Sent"
    REPLIED = "Replied"
    MEETING_SET = "Meeting Set"
    LOST = "Lost"


class Industry(str, Enum):
    RETAIL = "Retail"
    FOOD_BEVERAGE = "Food & Beverage"
    MANUFACTURING = "Manufacturing"
    CONSUMER_GOODS = "Consumer Goods"
    AUTOMOTIVE = "Automotive"


class Revenue(str, Enum):
    RANGE_100_200 = "$100M-200M"
    RANGE_100_200_ALT = "$100M - $200M"
    RANGE_200_500 = "$200M-500M"
    RANGE_200_500_ALT = "$200M - $500M"
    RANGE_500M_1B = "$500M-1B"
    RANGE_500M_1B_ALT = "$500M - $1B"
    RANGE_1B_5B = "$1B-5B"
    RANGE_1B_5B_ALT = "$1B - $5B"
    RANGE_5B_PLUS = "$5B+"
    RANGE_100_500 = "$100M-500M"
    RANGE_1B_PLUS = "$1B+"


class EmployeeCount(str, Enum):
    RANGE_1_500 = "1-500"
    RANGE_500_2000 = "500-2000"
    RANGE_2000_10000 = "2000-10000"
    RANGE_10000_PLUS = "10000+"


class Source(str, Enum):
    MANUAL = "Manual"
    WEB_RESEARCH = "Web Research"
    REFERRAL = "Referral"
    EVENT = "Event"


class NextActionType(str, Enum):
    EMAIL = "Email"
    CALL = "Call"
    LINKEDIN = "LinkedIn"
    MEETING = "Meeting"


class WinProbability(str, Enum):
    P10 = "10%"
    P25 = "25%"
    P50 = "50%"
    P75 = "75%"
    P90 = "90%"


class ActivityType(str, Enum):
    EMAIL = "Email"
    CALL = "Call"
    LINKEDIN = "LinkedIn"
    MEETING = "Meeting"
    NOTE = "Note"


class DealStage(str, Enum):
    DISCOVERY = "Discovery"
    QUALIFICATION = "Qualification"
    PROPOSAL = "Proposal"
    NEGOTIATION = "Negotiation"
    CLOSED_WON = "Closed Won"
    CLOSED_LOST = "Closed Lost"


# --- Pydantic Models ---

class ProspectBase(BaseModel):
    company: str
    contact_name: Optional[str] = None
    contact_title: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    status: Optional[ProspectStatus] = ProspectStatus.NEW_LEAD
    industry: Optional[str] = None
    revenue: Optional[str] = None
    employee_count: Optional[str] = None
    source: Optional[Source] = Source.MANUAL
    key_decision_makers: Optional[str] = None
    research_notes: Optional[str] = None
    draft_email: Optional[str] = None
    last_outreach: Optional[str] = None
    next_action: Optional[str] = None
    next_action_type: Optional[NextActionType] = None
    follow_up_count: Optional[int] = None
    win_probability: Optional[WinProbability] = None
    deal_value: Optional[float] = None


class ProspectCreate(ProspectBase):
    pass


class ProspectUpdate(BaseModel):
    company: Optional[str] = None
    contact_name: Optional[str] = None
    contact_title: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    status: Optional[ProspectStatus] = None
    industry: Optional[str] = None
    revenue: Optional[str] = None
    employee_count: Optional[str] = None
    source: Optional[Source] = None
    key_decision_makers: Optional[str] = None
    research_notes: Optional[str] = None
    draft_email: Optional[str] = None
    last_outreach: Optional[str] = None
    next_action: Optional[str] = None
    next_action_type: Optional[NextActionType] = None
    follow_up_count: Optional[int] = None
    win_probability: Optional[WinProbability] = None
    deal_value: Optional[float] = None


class Prospect(ProspectBase):
    id: str
    activities: List[str] = []
    deals: List[str] = []


class DealBase(BaseModel):
    deal_name: str
    stage: Optional[DealStage] = DealStage.DISCOVERY
    estimated_value: Optional[float] = None
    close_date: Optional[str] = None
    competitors: Optional[str] = None
    notes: Optional[str] = None
    prospect_id: Optional[str] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    deal_name: Optional[str] = None
    stage: Optional[DealStage] = None
    estimated_value: Optional[float] = None
    close_date: Optional[str] = None
    competitors: Optional[str] = None
    notes: Optional[str] = None
    prospect_id: Optional[str] = None


class Deal(DealBase):
    id: str
    prospect_name: Optional[str] = None


class ActivityBase(BaseModel):
    activity: str
    type: Optional[ActivityType] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None
    prospect_id: Optional[str] = None
    deal_id: Optional[str] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    activity: Optional[str] = None
    type: Optional[ActivityType] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None
    prospect_id: Optional[str] = None
    deal_id: Optional[str] = None


class Activity(ActivityBase):
    id: str
    prospect_name: Optional[str] = None
    deal_name: Optional[str] = None


class DealDetail(DealBase):
    id: str
    prospect_name: Optional[str] = None
    prospect: Optional[Prospect] = None
    activities: List[Activity] = []


# --- Dashboard ---

class StatusCount(BaseModel):
    status: str
    count: int


class UpcomingClose(BaseModel):
    id: str
    deal_name: str
    close_date: Optional[str] = None
    stage: Optional[str] = None
    estimated_value: Optional[float] = None
    prospect_name: Optional[str] = None


class DashboardResponse(BaseModel):
    total_prospects: int
    prospects_by_status: dict
    total_pipeline_value: float
    total_deals: int
    meetings_set: int
    emails_sent: int
    recent_activities: List[Activity]
    upcoming_actions: List[Prospect]
    upcoming_closes: List[UpcomingClose]
    total_deal_value_by_stage: Optional[dict] = None
    deals_in_pipeline: Optional[int] = None
    deal_counts_by_stage: Optional[dict] = None


class ProspectDetail(ProspectBase):
    id: str
    activities: List[Activity] = []
    deals: List[Deal] = []
