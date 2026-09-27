from pydantic import BaseModel
from typing import Optional


class JobApplicationBase(BaseModel):
    company: str
    role: str
    location: Optional[str] = None
    status: str = "Applied"
    application_date: Optional[str] = None
    job_type: Optional[str] = None
    salary: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None


class JobApplicationCreate(JobApplicationBase):
    pass


class JobApplicationResponse(JobApplicationBase):
    id: int

    class Config:
        from_attributes = True


# -----------------------------
# Application Timeline Schemas
# -----------------------------

class TimelineEventBase(BaseModel):
    status: str
    event_date: Optional[str] = None
    notes: Optional[str] = None


class TimelineEventCreate(TimelineEventBase):
    pass


class TimelineEventResponse(BaseModel):
    id: int
    application_id: int
    status: str
    event_date: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# -----------------------------
# Interview Schedule Schemas
# -----------------------------

class InterviewScheduleBase(BaseModel):
    interview_type: str
    interview_date: str
    interview_time: str
    mode: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class InterviewScheduleCreate(InterviewScheduleBase):
    pass


class InterviewScheduleResponse(InterviewScheduleBase):
    id: int
    application_id: int

    class Config:
        from_attributes = True