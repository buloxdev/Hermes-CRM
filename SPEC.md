# AI Sales Prospecting CRM - Build Spec

## Context
Standalone web app CRM for the Hermes Hackathon (due May 3rd). The pitch: "Build and manage your pipeline on the road and at the desk." Users tell their AI bot to prospect via messaging (Telegram, iMessage), the bot researches leads, drafts emails, and saves everything to Notion. The web app CRM provides the management layer to review, track, and close deals.

## Architecture
- **Backend:** FastAPI (Python) wrapping the Notion API
- **Frontend:** Next.js 14+ with App Router, Tailwind CSS
- **Database:** Notion is the source of truth. Backend reads/writes through Notion API.
- **Auth:** None. Single-user demo app.

## Notion Database Schema

### Prospects Database (ID: 343127b3-67ba-811a-9640-fe0ccbb652d1)
Properties:
- Company (title)
- Contact Name (rich_text)
- Contact Title (rich_text)
- Contact Email (email)
- Contact Phone (phone_number)
- Website (url)
- Status (select): New Lead, Researched, Email Drafted, Sent, Replied, Meeting Set, Lost
- Industry (select): Retail, Food & Beverage, Manufacturing, Consumer Goods, Automotive
- Revenue (select): $100M-200M, $200M-500M, $500M-1B, $1B-5B, $5B+, $100M-500M, $1B+
- Employee Count (select): 1-500, 500-2000, 2000-10000, 10000+
- Source (select): Manual, Web Research, Referral, Event
- Key Decision Makers (rich_text)
- Research Notes (rich_text)
- Draft Email (rich_text)
- Last Outreach (date)
- Next Action (date)
- Next Action Type (select): Email, Call, LinkedIn, Meeting
- Follow-Up # (number)
- Win Probability (select): 10%, 25%, 50%, 75%, 90%
- Deal Value (number, dollar format)
- Activities (relation to Activities DB)
- Deals (relation to Deals DB)

### Deals Database (ID: 345127b3-67ba-81e5-a417-ffb2883767d2)
Properties:
- Deal Name (title)
- Stage (select)
- Estimated Value (number)
- Close Date (date)
- Competitors (rich_text)
- Notes (rich_text)
- Prospect (relation to Prospects DB)

### Activities Database (ID: 345127b3-67ba-81c9-bdc0-c23120658953)
Properties:
- Activity (title)
- Type (select)
- Date (date)
- Notes (rich_text)
- Outcome (rich_text)
- Prospect (relation to Prospects DB)

## Notion API Details
- Use API version 2022-06-28 for database creation
- Use 2022-06-28 for all operations for consistency
- API key stored in env var NOTION_API_KEY
- Parent page ID: 343127b3-67ba-80ad-ac9e-e87a5bd982d6

## Backend Requirements (FastAPI)

### Endpoints
- GET /api/dashboard - Pipeline summary stats (total prospects by status, total deal value, recent activity)
- GET /api/prospects - List all prospects with filtering (status, industry, search)
- GET /api/prospects/{id} - Single prospect detail with related deals and activities
- POST /api/prospects - Create new prospect
- PATCH /api/prospects/{id} - Update prospect
- GET /api/deals - List all deals with filtering
- POST /api/deals - Create new deal
- PATCH /api/deals/{id} - Update deal
- GET /api/activities - List activities (optionally filtered by prospect)
- POST /api/activities - Create activity
- PATCH /api/activities/{id} - Update activity

### Environment
- NOTION_API_KEY loaded from /Users/anthonyaguilar/.hermes/profiles/sales-assistant/.env
- CORS enabled for localhost:3000
- Run on port 8000

## Frontend Requirements (Next.js)

### Pages
1. **Dashboard** (/)
   - Pipeline funnel visualization (prospects by status, horizontal bar or funnel chart)
   - Total pipeline value (sum of Deal Value for non-Lost prospects)
   - Recent activity feed (last 10 activities across all prospects)
   - Upcoming next actions (prospects with Next Action date set, sorted soonest first)
   - Quick stats cards: total prospects, deals in pipeline, meetings set, emails sent

2. **Prospects** (/prospects)
   - Filterable table/grid of all prospects
   - Filters: Status, Industry, Revenue
   - Search by company or contact name
   - Click to open prospect detail
   - Quick status change from list view
   - "New Prospect" button to add manually

3. **Prospect Detail** (/prospects/[id])
   - Contact info section (name, title, email, phone, company, website)
   - Status badge with ability to change
   - Research notes and key decision makers
   - Draft email section (display, ability to edit and save)
   - Related deals list with add new deal
   - Activity timeline (chronological log of all touchpoints)
   - Log new activity form (type, date, notes, outcome)
   - Next action and follow-up tracking

4. **Deals** (/deals)
   - Kanban board view by stage
   - Cards showing deal name, value, company, close date
   - Drag between stages (or click to advance)
   - Total value per stage shown in column header

### Design
- Dark theme (dark navy/charcoal backgrounds, light text)
- Accent color: electric blue or teal for CTAs and highlights
- Clean sans-serif typography (Inter or similar)
- Card-based layouts with subtle shadows
- Smooth transitions and hover states
- Responsive (looks good on tablet too, for the "on the road" angle)
- Icons for status types, industries, activity types (use lucide-react)
- Status colors: New Lead (gray), Researched (blue), Email Drafted (yellow), Sent (orange), Replied (green), Meeting Set (purple), Lost (red)

## File Structure
```
sales-crm/
├── backend/
│   ├── main.py
│   ├── notion.py          # Notion API client
│   ├── config.py          # Load env vars
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── dashboard.py
│   │   ├── prospects.py
│   │   ├── deals.py
│   │   └── activities.py
│   ├── models.py           # Pydantic models
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── globals.css
│   │   │   ├── prospects/
│   │   │   │   ├── page.tsx      # Prospects list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Prospect detail
│   │   │   └── deals/
│   │   │       └── page.tsx      # Deals kanban
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── PipelineFunnel.tsx
│   │   │   ├── ProspectTable.tsx
│   │   │   ├── ProspectCard.tsx
│   │   │   ├── ActivityTimeline.tsx
│   │   │   ├── DealKanban.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── RecentActivity.tsx
│   │   └── lib/
│   │       └── api.ts            # Fetch helpers
│   └── public/
└── README.md
```

## Demo Flow
1. Open localhost:3000, land on Dashboard
2. Show pipeline overview, stats, recent activity
3. Click Prospects, show filtered list
4. Open a prospect, show detail with research notes, draft email
5. Log an activity on the prospect
6. Go to Deals, show kanban board, move a deal forward
7. Back to Dashboard, show updated stats

This tells the story: "My bot prospects on the road, I manage the pipeline at the desk."
