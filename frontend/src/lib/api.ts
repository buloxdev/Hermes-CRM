const API_BASE = '/api';

export interface Prospect {
  id: string;
  company: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  status: string;
  industry: string;
  revenue: string;
  employee_count: string;
  source: string;
  key_decision_makers: string;
  research_notes: string;
  draft_email: string;
  last_outreach: string | null;
  next_action: string | null;
  next_action_type: string;
  follow_up_count: number;
  win_probability: string;
  deal_value: number;
  created_at: string;
}

export interface Deal {
  id: string;
  deal_name: string;
  stage: string;
  estimated_value: number;
  close_date: string | null;
  competitors: string;
  notes: string;
  prospect_id: string | null;
  prospect_company?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  activity: string;
  type: string;
  date: string;
  notes: string;
  outcome: string;
  prospect_id: string | null;
  prospect_company?: string;
  deal_id: string | null;
  deal_name?: string;
  created_at: string;
}

export interface UpcomingClose {
  id: string;
  deal_name: string;
  close_date: string;
  stage: string;
  estimated_value: number;
  prospect_name: string | null;
}

export interface DashboardData {
  total_prospects: number;
  prospects_by_status: Record<string, number>;
  total_pipeline_value: number;
  deals_in_pipeline: number;
  meetings_set: number;
  emails_sent: number;
  recent_activities: Activity[];
  upcoming_actions: Prospect[];
  upcoming_closes: UpcomingClose[];
  total_deal_value_by_stage: Record<string, number>;
  deal_counts_by_stage?: Record<string, number>;
}

export interface ProspectDetail extends Prospect {
  deals: Deal[];
  activities: Activity[];
}

export interface DealDetail extends Deal {
  prospect: Prospect | null;
  activities: Activity[];
}

export interface SearchResult {
  prospects: {
    id: string;
    type: 'prospect';
    name: string;
    subtitle: string;
    industry: string | null;
    revenue: string | null;
  }[];
  deals: {
    id: string;
    type: 'deal';
    name: string;
    subtitle: string;
    stage: string | null;
    estimated_value: number | null;
  }[];
  total: number;
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getDashboard(): Promise<DashboardData> {
  return fetchApi<DashboardData>('/dashboard');
}

export async function getProspects(params?: {
  status?: string;
  industry?: string;
  revenue?: string;
  search?: string;
}): Promise<Prospect[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.industry) searchParams.set('industry', params.industry);
  if (params?.revenue) searchParams.set('revenue', params.revenue);
  if (params?.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();
  return fetchApi<Prospect[]>(`/prospects${qs ? `?${qs}` : ''}`);
}

export async function getProspect(id: string): Promise<ProspectDetail> {
  return fetchApi<ProspectDetail>(`/prospects/${id}`);
}

export async function createProspect(data: Partial<Prospect>): Promise<Prospect> {
  return fetchApi<Prospect>('/prospects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProspect(id: string, data: Partial<Prospect>): Promise<Prospect> {
  return fetchApi<Prospect>(`/prospects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getDeals(params?: { stage?: string }): Promise<Deal[]> {
  const searchParams = new URLSearchParams();
  if (params?.stage) searchParams.set('stage', params.stage);
  const qs = searchParams.toString();
  return fetchApi<Deal[]>(`/deals${qs ? `?${qs}` : ''}`);
}

export async function getDeal(id: string): Promise<DealDetail> {
  return fetchApi<DealDetail>(`/deals/${id}`);
}

export async function createDeal(data: Partial<Deal>): Promise<Deal> {
  return fetchApi<Deal>('/deals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
  return fetchApi<Deal>(`/deals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getActivities(params?: { prospect_id?: string; deal_id?: string }): Promise<Activity[]> {
  const searchParams = new URLSearchParams();
  if (params?.prospect_id) searchParams.set('prospect_id', params.prospect_id);
  if (params?.deal_id) searchParams.set('deal_id', params.deal_id);
  const qs = searchParams.toString();
  return fetchApi<Activity[]>(`/activities${qs ? `?${qs}` : ''}`);
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  return fetchApi<Activity>('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
  return fetchApi<Activity>(`/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteActivity(id: string): Promise<void> {
  const res = await fetch(`/api/activities/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
}

export async function globalSearch(query: string): Promise<SearchResult> {
  return fetchApi<SearchResult>(`/search?q=${encodeURIComponent(query)}`);
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  action?: string;
  data?: Record<string, unknown>;
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  return fetchApi<ChatResponse>('/agent/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}
