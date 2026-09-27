from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import JobApplication, ApplicationTimeline, InterviewSchedule

from schemas import (
    JobApplicationCreate,
    JobApplicationResponse,
    TimelineEventCreate,
    TimelineEventResponse,
    InterviewScheduleCreate,
    InterviewScheduleResponse
)


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Job Application Tracker API",
    description="Backend API for managing job applications and application timelines",
    version="1.1.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Basic Routes
# -----------------------------

@app.get("/")
def root():
    return {
        "message": "Job Application Tracker API is running",
        "status": "success"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Backend is working correctly"
    }


# -----------------------------
# Job Application Routes
# -----------------------------

@app.post(
    "/api/applications",
    response_model=JobApplicationResponse
)
def create_application(
    application: JobApplicationCreate,
    db: Session = Depends(get_db)
):
    new_application = JobApplication(
        **application.model_dump()
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application


@app.get(
    "/api/applications",
    response_model=list[JobApplicationResponse]
)
def get_applications(
    db: Session = Depends(get_db)
):
    return db.query(JobApplication).order_by(
        JobApplication.id.desc()
    ).all()


@app.get(
    "/api/applications/{application_id}",
    response_model=JobApplicationResponse
)
def get_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return application


@app.put(
    "/api/applications/{application_id}",
    response_model=JobApplicationResponse
)
def update_application(
    application_id: int,
    updated_data: JobApplicationCreate,
    db: Session = Depends(get_db)
):
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    for key, value in updated_data.model_dump().items():
        setattr(application, key, value)

    db.commit()
    db.refresh(application)

    return application


@app.delete("/api/applications/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    db.delete(application)
    db.commit()

    return {
        "message": "Application deleted successfully"
    }


# -----------------------------
# Application Timeline Routes
# -----------------------------

@app.post(
    "/api/applications/{application_id}/timeline",
    response_model=TimelineEventResponse
)
def create_timeline_event(
    application_id: int,
    timeline_data: TimelineEventCreate,
    db: Session = Depends(get_db)
):
    # Check whether application exists
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # Create timeline event
    new_event = ApplicationTimeline(
        application_id=application_id,
        status=timeline_data.status,
        event_date=timeline_data.event_date,
        notes=timeline_data.notes
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@app.get(
    "/api/applications/{application_id}/timeline",
    response_model=list[TimelineEventResponse]
)
def get_timeline_events(
    application_id: int,
    db: Session = Depends(get_db)
):
    # Check whether application exists
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return db.query(ApplicationTimeline).filter(
        ApplicationTimeline.application_id == application_id
    ).order_by(
        ApplicationTimeline.id.asc()
    ).all()


@app.delete("/api/timeline/{timeline_id}")
def delete_timeline_event(
    timeline_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(ApplicationTimeline).filter(
        ApplicationTimeline.id == timeline_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Timeline event not found"
        )

    db.delete(event)
    db.commit()

    return {
        "message": "Timeline event deleted successfully"
    }
# -----------------------------
# Interview Schedule Routes
# -----------------------------

@app.post(
    "/api/applications/{application_id}/interview",
    response_model=InterviewScheduleResponse
)
def create_interview_schedule(
    application_id: int,
    interview_data: InterviewScheduleCreate,
    db: Session = Depends(get_db)
):
    # Check whether application exists
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # Create interview schedule
    new_interview = InterviewSchedule(
        application_id=application_id,
        interview_type=interview_data.interview_type,
        interview_date=interview_data.interview_date,
        interview_time=interview_data.interview_time,
        mode=interview_data.mode,
        meeting_link=interview_data.meeting_link,
        notes=interview_data.notes
    )

    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    return new_interview


@app.get(
    "/api/applications/{application_id}/interview",
    response_model=list[InterviewScheduleResponse]
)
def get_interview_schedules(
    application_id: int,
    db: Session = Depends(get_db)
):
    # Check whether application exists
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return db.query(InterviewSchedule).filter(
        InterviewSchedule.application_id == application_id
    ).order_by(
        InterviewSchedule.interview_date.asc(),
        InterviewSchedule.interview_time.asc()
    ).all()


@app.get(
    "/api/interviews/upcoming",
    response_model=list[InterviewScheduleResponse]
)
def get_upcoming_interviews(
    db: Session = Depends(get_db)
):
    today = datetime.now().strftime("%Y-%m-%d")

    return db.query(InterviewSchedule).filter(
        InterviewSchedule.interview_date >= today
    ).order_by(
        InterviewSchedule.interview_date.asc(),
        InterviewSchedule.interview_time.asc()
    ).all()


@app.put(
    "/api/interviews/{interview_id}",
    response_model=InterviewScheduleResponse
)
def update_interview_schedule(
    interview_id: int,
    updated_data: InterviewScheduleCreate,
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewSchedule).filter(
        InterviewSchedule.id == interview_id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview schedule not found"
        )

    interview.interview_type = updated_data.interview_type
    interview.interview_date = updated_data.interview_date
    interview.interview_time = updated_data.interview_time
    interview.mode = updated_data.mode
    interview.meeting_link = updated_data.meeting_link
    interview.notes = updated_data.notes

    db.commit()
    db.refresh(interview)

    return interview


@app.delete("/api/interviews/{interview_id}")
def delete_interview_schedule(
    interview_id: int,
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewSchedule).filter(
        InterviewSchedule.id == interview_id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview schedule not found"
        )

    db.delete(interview)
    db.commit()

    return {
        "message": "Interview schedule deleted successfully"
    }

