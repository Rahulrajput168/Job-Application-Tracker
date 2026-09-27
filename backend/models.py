from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)

    company = Column(String(100), nullable=False)
    role = Column(String(150), nullable=False)
    location = Column(String(150), nullable=True)

    status = Column(
        String(50),
        default="Applied",
        nullable=False
    )

    application_date = Column(String(50), nullable=True)
    job_type = Column(String(50), nullable=True)

    salary = Column(String(100), nullable=True)
    job_url = Column(String(500), nullable=True)

    notes = Column(Text, nullable=True)

    # Application Timeline
    timeline_events = relationship(
        "ApplicationTimeline",
        back_populates="application",
        cascade="all, delete-orphan"
    )

    # Interview Schedule
    interview_schedules = relationship(
        "InterviewSchedule",
        back_populates="application",
        cascade="all, delete-orphan"
    )


class ApplicationTimeline(Base):
    __tablename__ = "application_timeline"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(
        Integer,
        ForeignKey("job_applications.id"),
        nullable=False
    )

    status = Column(String(50), nullable=False)
    event_date = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)

    application = relationship(
        "JobApplication",
        back_populates="timeline_events"
    )


class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(
        Integer,
        ForeignKey("job_applications.id"),
        nullable=False
    )

    interview_type = Column(
        String(100),
        nullable=False
    )

    interview_date = Column(
        String(50),
        nullable=False
    )

    interview_time = Column(
        String(50),
        nullable=False
    )

    mode = Column(
        String(50),
        nullable=True
    )

    meeting_link = Column(
        String(500),
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    application = relationship(
        "JobApplication",
        back_populates="interview_schedules"
    )