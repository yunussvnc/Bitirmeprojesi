"""Definitions extracted from :mod:`schemas`."""

from datetime import datetime
from pydantic import BaseModel
from typing import Dict
from typing import List
from typing import Optional

class AdminStatsResponse(BaseModel):
    total_users: int
    total_venues: int
    active_stories: int
    ai_queries_today: int


class AdminAuditLogResponse(BaseModel):
    id: int
    admin_id: int
    action: str
    target_type: str
    target_id: Optional[int] = None
    details: Optional[Dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AIQueryLogCreate(BaseModel):
    user_id: Optional[int] = None
    query_text: str
    query_type: str
    llm_layer: str
    response_time_ms: int
    result_count: int
    status: str


class AIQueryLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    query_text: str
    query_type: str
    llm_layer: str
    response_time_ms: int
    result_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class InteractionCreate(BaseModel):
    place_id: int
    interaction_type: str  # 'MAP_CLICK', 'CARD_VIEW', etc.
    weight: Optional[int] = 1


class PaginatedAIQueryLogs(BaseModel):
    items: List[AIQueryLogResponse]
    total: int
    page: int
    page_size: int


class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    target_type: str
    target_id: int
    reason: str
    description: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SystemHealthItem(BaseModel):
    status: str
    latency_ms: float


class SystemHealthResponse(BaseModel):
    status: str
    services: Dict[str, SystemHealthItem]
