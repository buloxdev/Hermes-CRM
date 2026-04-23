# Landing Page + Bot Demo Spec

## Overview
The landing page is the first thing judges see. It needs to tell the story immediately: "Prospect on the road, manage at the desk." Then a bot demo section shows the unique differentiator, an AI agent that prospects and pushes results into the CRM.

## Page Structure

### 1. Hero Section
- Full viewport height
- Dark background with subtle gradient (slate-950 to slate-900)
- Large headline: "Your AI Sales Agent"
- Subheadline: "Tell your bot who to find. It researches, drafts, and builds your pipeline. You close."
- Two CTA buttons: "See it in action" (scrolls to demo) and "Open Dashboard" (links to /dashboard)
- Subtle animated background effect (floating dots or gradient animation, keep it minimal)

### 2. How It Works Section
Three steps in a horizontal layout with icons:
1. **Tell your bot** - "Find me VPs of Supply Chain in Dallas" (show a chat bubble UI)
2. **AI does the work** - "Researches companies, finds contacts, drafts emails" (show a processing animation)
3. **Manage your pipeline** - "Everything lands in your CRM, ready to act on" (show CRM screenshot)

### 3. Interactive Bot Demo Section
This is the hero feature. A mock messaging interface that simulates the bot prospecting flow.

**Layout:**
- Left side: Chat interface (looks like Telegram/iMessage)
- Right side: Live CRM preview showing prospects being added

**Chat Flow (auto-plays or click to advance):**
1. User sends: "Hey, find me supply chain VPs at food & beverage companies in Memphis"
2. Bot replies: "On it. Searching for VP-level supply chain roles at F&B companies in the Memphis metro area."
3. Bot replies (with typing animation): "Found 3 prospects. Here's what I got:"
4. Bot shows a prospect card: "Sarah Chen, VP Supply Chain @ Mondelez International. $2.8B revenue. Based in Memphis. 2nd degree connection."
5. Bot shows another: "James Rodriguez, SVP Operations @ Kellogg's Memphis plant. Leading distribution for the Southeast region."
6. Bot says: "Research done. Draft emails ready. All saved to your CRM. Want me to send?"
7. User: "Not yet, I'll review first."
8. Bot: "Got it. They're in your pipeline under 'New Lead'. Draft emails are attached."

**CRM Preview (right side):**
- Shows the prospects table
- As the bot "finds" prospects, they animate into the table
- Status changes from nothing to "New Lead" to "Email Drafted"
- Shows the draft email appearing in the prospect detail

**Technical Implementation:**
- Static mock data, animated with CSS transitions and timeouts
- No real API calls needed
- Each message appears with a slight delay (typing indicator animation)
- CRM preview updates in sync with chat messages
- Click "Try Again" button to replay the demo

### 4. Feature Highlights Section
Four cards in a grid:
- **Smart Research** - "AI scans web sources, news, and directories to find qualified prospects"
- **Personalized Outreach** - "Draft emails reference specific company details and pain points"
- **Pipeline Management** - "Track prospects from first touch to closed deal"
- **Works Everywhere** - "Prospect from your phone, manage from your desk"

### 5. CTA Section
- "Ready to build your pipeline?"
- "Open Dashboard" button linking to /dashboard
- "Powered by Hermes AI" footer

## Technical Changes

### Routing
- Move current dashboard from `/` to `/dashboard`
- Landing page becomes new `/`
- Update Sidebar links accordingly

### New Files
- `frontend/src/app/dashboard/page.tsx` (move current page.tsx here)
- New `frontend/src/app/page.tsx` (landing page)
- `frontend/src/components/BotDemo.tsx` (interactive bot demo)
- `frontend/src/components/Hero.tsx`
- `frontend/src/components/HowItWorks.tsx`
- `frontend/src/components/FeatureCards.tsx`

### Existing Files to Update
- `frontend/src/components/Sidebar.tsx` - Update Dashboard link to /dashboard
- `frontend/src/app/layout.tsx` - Keep sidebar only on non-landing pages, or hide sidebar on landing page

### Landing Page Layout
- NO sidebar on the landing page
- Full width, centered content
- Different layout from the CRM pages

### Sidebar Update
- Dashboard link should point to /dashboard
- Landing page has its own minimal nav (just "Open Dashboard" button and logo)

## Design Notes
- Use the same dark theme (slate-950, slate-900, teal accents)
- Landing page should feel premium, like a SaaS product page
- Smooth scroll between sections
- Bot demo is the centerpiece, make it visually impressive
- All animations should be smooth, no jank
