import { useEffect, useState } from "react";
import "./index.css";

const API_URL = "http://127.0.0.1:8000/api/applications";
const BASE_API_URL = "http://127.0.0.1:8000/api";

const emptyForm = {
  company: "",
  role: "",
  location: "",
  status: "Applied",
  application_date: "",
  job_type: "Full-time",
  salary: "",
  job_url: "",
  notes: "",
};

const emptyTimelineForm = {
  status: "Interview",
  notes: "",
};

const emptyInterviewForm = {
  interview_type: "Interview",
  interview_date: "",
  interview_time: "",
  mode: "Online",
  meeting_link: "",
  notes: "",
};

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const [viewingApplication, setViewingApplication] =
    useState(null);

  // =========================================================
  // TIMELINE STATES
  // =========================================================

  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [timelineForm, setTimelineForm] =
    useState(emptyTimelineForm);

  // =========================================================
  // INTERVIEW SCHEDULE STATES
  // =========================================================

  const [interviewSchedules, setInterviewSchedules] = useState([]);
  const [interviewLoading, setInterviewLoading] = useState(false);

  const [showInterviewForm, setShowInterviewForm] = useState(false);

  const [interviewForm, setInterviewForm] =
    useState(emptyInterviewForm);

  const [editingInterviewId, setEditingInterviewId] =
    useState(null);

  const [upcomingInterviews, setUpcomingInterviews] =
    useState([]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchApplications();
    fetchUpcomingInterviews();
  }, []);

  // =========================================================
  // FETCH APPLICATIONS
  // =========================================================

  const fetchApplications = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await response.json();

      setApplications(data);
    } catch (error) {
      console.error(
        "Error fetching applications:",
        error
      );

      alert("Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // APPLICATION FORM HANDLING
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);

    setFormData({
      ...emptyForm,
      application_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setShowForm(true);
  };

  const openEditForm = (application) => {
    setEditingId(application.id);

    setFormData({
      company: application.company || "",
      role: application.role || "",
      location: application.location || "",
      status: application.status || "Applied",
      application_date:
        application.application_date || "",
      job_type:
        application.job_type || "Full-time",
      salary: application.salary || "",
      job_url: application.job_url || "",
      notes: application.notes || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  // =========================================================
  // VIEW APPLICATION
  // =========================================================

  const openViewModal = async (application) => {
    setViewingApplication(application);

    setShowTimelineForm(false);
    setShowInterviewForm(false);

    setTimelineForm(emptyTimelineForm);
    setInterviewForm(emptyInterviewForm);

    setEditingInterviewId(null);

    await Promise.all([
      fetchTimeline(application.id),
      fetchInterviewSchedules(application.id),
    ]);
  };

  const closeViewModal = () => {
    setViewingApplication(null);

    setTimelineEvents([]);
    setInterviewSchedules([]);

    setShowTimelineForm(false);
    setShowInterviewForm(false);

    setTimelineForm(emptyTimelineForm);
    setInterviewForm(emptyInterviewForm);

    setEditingInterviewId(null);
  };

  // =========================================================
  // UPDATE MAIN APPLICATION STATUS
  // =========================================================

  const updateApplicationStatus = async (
    application,
    newStatus
  ) => {
    if (!application) {
      return null;
    }

    try {
      const updatedApplication = {
        company: application.company,
        role: application.role,
        location: application.location || "",
        status: newStatus,
        application_date:
          application.application_date || "",
        job_type:
          application.job_type || "",
        salary:
          application.salary || "",
        job_url:
          application.job_url || "",
        notes:
          application.notes || "",
      };

      const response = await fetch(
        `${API_URL}/${application.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedApplication),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update application status"
        );
      }

      const updated = await response.json();

      setApplications((previous) =>
        previous.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );

      setViewingApplication(updated);

      return updated;
    } catch (error) {
      console.error(
        "Error updating application status:",
        error
      );

      return null;
    }
  };

  // =========================================================
  // SAVE APPLICATION
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.company.trim() ||
      !formData.role.trim()
    ) {
      alert("Company and Role are required.");
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const oldApplication = editingId
        ? applications.find(
            (application) =>
              application.id === editingId
          )
        : null;

      // Automatically set today's date for new applications
      const dataToSave = {
        ...formData,
        application_date:
          formData.application_date ||
          new Date()
            .toISOString()
            .split("T")[0],
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Application API Error:",
          response.status,
          errorText
        );

        throw new Error(
          "Failed to save application"
        );
      }

      const savedApplication =
        await response.json();

      // =====================================================
      // AUTOMATIC TIMELINE
      // =====================================================

      if (!editingId) {
        // Automatically create Applied event
        // with current date + time.
        await createTimelineEvent(
          savedApplication.id,
          {
            status: "Applied",
            notes: "Application submitted.",
          },
          false
        );
      } else if (
        oldApplication &&
        oldApplication.status !== formData.status
      ) {
        // Automatically create status-change event
        // with current date + time.
        await createTimelineEvent(
          editingId,
          {
            status: formData.status,
            notes: `Application status changed to ${formData.status}.`,
          },
          false
        );
      }

      await fetchApplications();
      await fetchUpcomingInterviews();

      closeForm();
    } catch (error) {
      console.error(
        "Error saving application:",
        error
      );

      alert("Unable to save application.");
    }
  };

  // =========================================================
  // DELETE APPLICATION
  // =========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete application"
        );
      }

      setApplications((previous) =>
        previous.filter(
          (application) =>
            application.id !== id
        )
      );

      setUpcomingInterviews((previous) =>
        previous.filter(
          (interview) =>
            interview.application_id !== id
        )
      );

      if (viewingApplication?.id === id) {
        closeViewModal();
      }
    } catch (error) {
      console.error(
        "Error deleting application:",
        error
      );

      alert("Unable to delete application.");
    }
  };

  // =========================================================
  // TIMELINE
  // =========================================================

  const fetchTimeline = async (applicationId) => {
    try {
      setTimelineLoading(true);

      const response = await fetch(
        `${API_URL}/${applicationId}/timeline`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch timeline"
        );
      }

      const data = await response.json();

      setTimelineEvents(data);
    } catch (error) {
      console.error(
        "Error fetching timeline:",
        error
      );

      setTimelineEvents([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  // =========================================================
  // CREATE TIMELINE EVENT
  // =========================================================

  const createTimelineEvent = async (
    applicationId,
    eventData,
    showAlert = true
  ) => {
    try {
      /*
       * IMPORTANT:
       * Backend requires event_date.
       *
       * If event_date is not supplied,
       * automatically use current date + time.
       */
      const automaticEventDate =
        eventData.event_date ||
        new Date().toISOString();

      const finalEventData = {
        status: eventData.status,
        event_date: automaticEventDate,
        notes: eventData.notes || "",
      };

      const response = await fetch(
        `${API_URL}/${applicationId}/timeline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            finalEventData
          ),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Timeline API Error:",
          response.status,
          errorText
        );

        throw new Error(
          `Failed to create timeline event: ${response.status}`
        );
      }

      const newEvent =
        await response.json();

      if (
        viewingApplication?.id === applicationId
      ) {
        setTimelineEvents((previous) => [
          ...previous,
          newEvent,
        ]);
      }

      return newEvent;
    } catch (error) {
      console.error(
        "Error creating timeline event:",
        error
      );

      if (showAlert) {
        alert(
          "Unable to add timeline event."
        );
      }

      return null;
    }
  };

  const handleTimelineChange = (event) => {
    const { name, value } = event.target;

    setTimelineForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openTimelineForm = () => {
    setTimelineForm({
      status: "Interview",
      notes: "",
    });

    setShowTimelineForm(true);
  };

  const closeTimelineForm = () => {
    setShowTimelineForm(false);
    setTimelineForm(emptyTimelineForm);
  };

  // =========================================================
  // ADD TIMELINE EVENT
  // =========================================================

  const handleTimelineSubmit = async (event) => {
    event.preventDefault();

    if (!viewingApplication) {
      return;
    }

    const newEvent =
      await createTimelineEvent(
        viewingApplication.id,
        {
          status: timelineForm.status,
          notes: timelineForm.notes,
          // event_date intentionally omitted.
          // createTimelineEvent automatically adds
          // current date + time.
        }
      );

    if (!newEvent) {
      return;
    }

    /*
     * Technical Round and HR Round are interview stages.
     * The main application status remains "Interview".
     */
    const mainStatus = [
      "Technical Round",
      "HR Round",
    ].includes(timelineForm.status)
      ? "Interview"
      : timelineForm.status;

    /*
     * Update main application status only if needed.
     */
    if (
      viewingApplication.status !== mainStatus
    ) {
      await updateApplicationStatus(
        viewingApplication,
        mainStatus
      );
    }

    await fetchTimeline(
      viewingApplication.id
    );

    await fetchApplications();

    closeTimelineForm();
  };

  // =========================================================
  // DELETE TIMELINE EVENT
  // =========================================================

  const handleDeleteTimelineEvent = async (
    timelineId
  ) => {
    const confirmed = window.confirm(
      "Delete this timeline event?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${BASE_API_URL}/timeline/${timelineId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete timeline event"
        );
      }

      setTimelineEvents((previous) =>
        previous.filter(
          (timelineEvent) =>
            timelineEvent.id !== timelineId
        )
      );
    } catch (error) {
      console.error(
        "Error deleting timeline event:",
        error
      );

      alert(
        "Unable to delete timeline event."
      );
    }
  };

  // =========================================================
  // INTERVIEW SCHEDULE
  // =========================================================

  const fetchInterviewSchedules = async (
    applicationId
  ) => {
    try {
      setInterviewLoading(true);

      const response = await fetch(
        `${API_URL}/${applicationId}/interview`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch interview schedules"
        );
      }

      const data = await response.json();

      setInterviewSchedules(data);
    } catch (error) {
      console.error(
        "Error fetching interview schedules:",
        error
      );

      setInterviewSchedules([]);
    } finally {
      setInterviewLoading(false);
    }
  };

  const fetchUpcomingInterviews = async () => {
    try {
      const response = await fetch(
        `${BASE_API_URL}/interviews/upcoming`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch upcoming interviews"
        );
      }

      const data = await response.json();

      setUpcomingInterviews(data);
    } catch (error) {
      console.error(
        "Error fetching upcoming interviews:",
        error
      );

      setUpcomingInterviews([]);
    }
  };

  const handleInterviewChange = (event) => {
    const { name, value } = event.target;

    setInterviewForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openScheduleInterviewForm = () => {
    setEditingInterviewId(null);

    setInterviewForm({
      ...emptyInterviewForm,
      interview_type: "Interview",
    });

    setShowInterviewForm(true);
  };

  const openEditInterviewForm = (interview) => {
    setEditingInterviewId(interview.id);

    setInterviewForm({
      interview_type:
        interview.interview_type ||
        "Interview",

      interview_date:
        interview.interview_date || "",

      interview_time:
        interview.interview_time || "",

      mode:
        interview.mode || "Online",

      meeting_link:
        interview.meeting_link || "",

      notes:
        interview.notes || "",
    });

    setShowInterviewForm(true);
  };

  const closeInterviewForm = () => {
    setShowInterviewForm(false);

    setEditingInterviewId(null);

    setInterviewForm(emptyInterviewForm);
  };

  // =========================================================
  // SAVE INTERVIEW SCHEDULE
  // =========================================================

  const handleInterviewSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!viewingApplication) {
      return;
    }

    if (
      !interviewForm.interview_date ||
      !interviewForm.interview_time
    ) {
      alert(
        "Please select interview date and time."
      );

      return;
    }

    try {
      const url = editingInterviewId
        ? `${BASE_API_URL}/interviews/${editingInterviewId}`
        : `${API_URL}/${viewingApplication.id}/interview`;

      const method = editingInterviewId
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          interviewForm
        ),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Interview API Error:",
          response.status,
          errorText
        );

        throw new Error(
          "Failed to save interview schedule"
        );
      }

      await response.json();

      // =====================================================
      // AUTOMATIC STATUS UPDATE
      // =====================================================

      /*
       * Whenever an interview is scheduled,
       * automatically move the application to Interview.
       */
      if (
        viewingApplication.status !==
        "Interview"
      ) {
        await updateApplicationStatus(
          viewingApplication,
          "Interview"
        );
      }

      // =====================================================
      // AUTOMATIC TIMELINE EVENT
      // =====================================================

      /*
       * Combine the actual scheduled interview date
       * and time into one datetime string.
       *
       * Example:
       * 2026-09-28 + 10:30
       * =>
       * 2026-09-28T10:30
       */
      const scheduledDateTime =
        `${interviewForm.interview_date}T${interviewForm.interview_time}`;

      if (!editingInterviewId) {
        await createTimelineEvent(
          viewingApplication.id,
          {
            status: "Interview Scheduled",
            event_date:
              scheduledDateTime,
            notes:
              `${interviewForm.interview_type} scheduled for ${formatDate(
                interviewForm.interview_date
              )} at ${formatTime(
                interviewForm.interview_time
              )}.`,
          },
          false
        );
      }

      // Refresh all related data
      await fetchInterviewSchedules(
        viewingApplication.id
      );

      await fetchUpcomingInterviews();

      await fetchTimeline(
        viewingApplication.id
      );

      await fetchApplications();

      closeInterviewForm();
    } catch (error) {
      console.error(
        "Error saving interview schedule:",
        error
      );

      alert(
        "Unable to save interview schedule."
      );
    }
  };

  // =========================================================
  // DELETE INTERVIEW
  // =========================================================

  const handleDeleteInterview = async (
    interviewId
  ) => {
    const confirmed = window.confirm(
      "Delete this interview schedule?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${BASE_API_URL}/interviews/${interviewId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete interview schedule"
        );
      }

      setInterviewSchedules((previous) =>
        previous.filter(
          (interview) =>
            interview.id !== interviewId
        )
      );

      await fetchUpcomingInterviews();

      if (viewingApplication) {
        await fetchTimeline(
          viewingApplication.id
        );
      }
    } catch (error) {
      console.error(
        "Error deleting interview:",
        error
      );

      alert(
        "Unable to delete interview schedule."
      );
    }
  };

  // =========================================================
  // FILTER + SORT
  // =========================================================

  const filteredApplications = applications
    .filter((application) => {
      const search =
        searchTerm.toLowerCase().trim();

      const matchesSearch =
        (application.company || "")
          .toLowerCase()
          .includes(search) ||
        (application.role || "")
          .toLowerCase()
          .includes(search) ||
        (application.location || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        application.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return b.id - a.id;
      }

      return a.id - b.id;
    });

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalApplications =
    applications.length;

  const appliedCount =
    applications.filter(
      (application) =>
        application.status === "Applied"
    ).length;

  const interviewCount =
    applications.filter(
      (application) =>
        application.status === "Interview"
    ).length;

  const offerCount =
    applications.filter(
      (application) =>
        application.status === "Offer"
    ).length;

  const rejectedCount =
    applications.filter(
      (application) =>
        application.status === "Rejected"
    ).length;

  const successRate =
    totalApplications > 0
      ? Math.round(
          (offerCount /
            totalApplications) *
            100
        )
      : 0;

  // =========================================================
  // HELPERS
  // =========================================================

  const getInitials = (company) => {
    if (!company) return "?";

    const words = company
      .trim()
      .split(" ");

    if (words.length === 1) {
      return words[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      words[0][0] +
      words[1][0]
    ).toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      return "Not specified";
    }

    const parsedDate =
      new Date(dateTime);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return dateTime;
    }

    return parsedDate.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatTime = (time) => {
    if (!time) return "";

    const [hours, minutes] =
      time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getTimelineIcon = (status) => {
    switch (status) {
      case "Applied":
        return "✓";

      case "Interview":
        return "◷";

      case "Interview Scheduled":
        return "◷";

      case "Technical Round":
        return "⚙";

      case "HR Round":
        return "👤";

      case "Managerial Round":
        return "◷";

      case "Final Round":
        return "★";

      case "Offer":
        return "★";

      case "Rejected":
        return "×";

      default:
        return "•";
    }
  };

  const getApplicationForInterview = (
    applicationId
  ) => {
    return applications.find(
      (application) =>
        application.id === applicationId
    );
  };

  const scrollToApplications = () => {
    document
      .getElementById(
        "applications-section"
      )
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="app-shell">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            JT
          </div>

          <div>
            <h2>JobTrack</h2>

            <span>
              Application Manager
            </span>
          </div>

        </div>

        <nav className="sidebar-nav">

          <button
            className="nav-item active"
            onClick={scrollToTop}
          >
            <span className="nav-icon">
              ⌂
            </span>

            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={
              scrollToApplications
            }
          >
            <span className="nav-icon">
              ▣
            </span>

            Applications
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-tip">

            <div className="tip-icon">
              ✦
            </div>

            <div>

              <strong>
                Stay organized
              </strong>

              <p>
                Keep your applications,
                interviews and offers
                in one place.
              </p>

            </div>

          </div>

          <div className="sidebar-footer">
            Job Application Tracker
            <span>v1.2</span>
          </div>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="main-content">

        {/* ===================================================
            TOP BAR
        ==================================================== */}

        <header className="topbar">

          <div>

            <p className="eyebrow">
              OVERVIEW
            </p>

            <h1>
              Dashboard
            </h1>

            <p className="page-subtitle">
              Track and manage your job
              applications from one place.
            </p>

          </div>

          <button
            className="add-button"
            onClick={openAddForm}
          >
            <span>+</span>
            Add Application
          </button>

        </header>

        {/* ===================================================
            STATISTICS
        ==================================================== */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon blue">
                ▣
              </div>

              <span className="stat-label">
                TOTAL
              </span>

            </div>

            <div className="stat-value">
              {totalApplications}
            </div>

            <p>
              All job applications
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon purple">
                ↗
              </div>

              <span className="stat-label">
                APPLIED
              </span>

            </div>

            <div className="stat-value">
              {appliedCount}
            </div>

            <p>
              Applications submitted
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon yellow">
                ◷
              </div>

              <span className="stat-label">
                INTERVIEWS
              </span>

            </div>

            <div className="stat-value">
              {interviewCount}
            </div>

            <p>
              Interview stages
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon green">
                ✓
              </div>

              <span className="stat-label">
                OFFERS
              </span>

            </div>

            <div className="stat-value">
              {offerCount}
            </div>

            <p>
              Offers received
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon red">
                ×
              </div>

              <span className="stat-label">
                REJECTED
              </span>

            </div>

            <div className="stat-value">
              {rejectedCount}
            </div>

            <p>
              Applications rejected
            </p>

          </div>

          <div className="stat-card success-card">

            <div className="stat-card-top">

              <div className="stat-icon cyan">
                %
              </div>

              <span className="stat-label">
                SUCCESS RATE
              </span>

            </div>

            <div className="stat-value">
              {successRate}%
            </div>

            <p>
              Offer conversion rate
            </p>

          </div>

        </section>

        {/* ===================================================
            UPCOMING INTERVIEWS
        ==================================================== */}

        <section className="pipeline-section">

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                SCHEDULE
              </p>

              <h2>
                Upcoming Interviews
              </h2>

            </div>

            <span className="pipeline-total">
              {upcomingInterviews.length} scheduled
            </span>

          </div>

          {upcomingInterviews.length === 0 ? (

            <div className="timeline-empty">

              <div>
                ◷
              </div>

              <p>
                No upcoming interviews
              </p>

              <span>
                Schedule an interview from any
                application to see it here.
              </span>

            </div>

          ) : (

            <div className="application-list">

              {upcomingInterviews.map(
                (interview) => {

                  const application =
                    getApplicationForInterview(
                      interview.application_id
                    );

                  return (
                    <article
                      className="application-card"
                      key={interview.id}
                    >

                      <div className="company-logo">
                        {getInitials(
                          application?.company
                        )}
                      </div>

                      <div className="application-main">

                        <div className="application-title-row">

                          <div>

                            <h3>
                              {application?.role ||
                                "Job Application"}
                            </h3>

                            <p className="company-name">
                              {application?.company ||
                                "Company"}
                            </p>

                          </div>

                          <span className="status-badge interview">

                            <span className="status-dot"></span>

                            Upcoming

                          </span>

                        </div>

                        <div className="application-meta">

                          <span>
                            ◷{" "}
                            {formatDate(
                              interview.interview_date
                            )}
                          </span>

                          <span>
                            ⏰{" "}
                            {formatTime(
                              interview.interview_time
                            )}
                          </span>

                          <span>
                            {interview.interview_type}
                          </span>

                          {interview.mode && (
                            <span>
                              {interview.mode}
                            </span>
                          )}

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* ===================================================
            APPLICATION PIPELINE
        ==================================================== */}

        <section className="pipeline-section">

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                APPLICATION PIPELINE
              </p>

              <h2>
                Application Progress
              </h2>

            </div>

            <span className="pipeline-total">
              {totalApplications} total
            </span>

          </div>

          <div className="pipeline">

            <div className="pipeline-step">

              <div className="pipeline-number blue-bg">
                {appliedCount}
              </div>

              <div>

                <strong>
                  Applied
                </strong>

                <span>
                  Submitted
                </span>

              </div>

            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-step">

              <div className="pipeline-number yellow-bg">
                {interviewCount}
              </div>

              <div>

                <strong>
                  Interview
                </strong>

                <span>
                  In process
                </span>

              </div>

            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-step">

              <div className="pipeline-number green-bg">
                {offerCount}
              </div>

              <div>

                <strong>
                  Offer
                </strong>

                <span>
                  Received
                </span>

              </div>

            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-step">

              <div className="pipeline-number red-bg">
                {rejectedCount}
              </div>

              <div>

                <strong>
                  Rejected
                </strong>

                <span>
                  Closed
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            APPLICATIONS
        ==================================================== */}

        <section
          className="applications-section"
          id="applications-section"
        >

          <div className="applications-header">

            <div>

              <p className="eyebrow">
                TRACKER
              </p>

              <h2>
                Your Applications
              </h2>

              <p>
                Manage your current job
                search activity.
              </p>

            </div>

            <button
              className="small-add-button"
              onClick={openAddForm}
            >
              + New Application
            </button>

          </div>

          {/* FILTERS */}

          <div className="toolbar">

            <div className="search-wrapper">

              <span className="search-icon">
                ⌕
              </span>

              <input
                type="text"
                className="search-input"
                placeholder="Search company, role or location..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="All">
                All Status
              </option>

              <option value="Applied">
                Applied
              </option>

              <option value="Interview">
                Interview
              </option>

              <option value="Offer">
                Offer
              </option>

              <option value="Rejected">
                Rejected
              </option>

            </select>

            <select
              className="filter-select"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
            >

              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

            </select>

          </div>

          {/* APPLICATION LIST */}

          {loading ? (

            <div className="empty-state">

              <div className="loading-spinner"></div>

              <p>
                Loading applications...
              </p>

            </div>

          ) : filteredApplications.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ▣
              </div>

              <h3>
                No applications found
              </h3>

              <p>
                Add your first job application
                to start tracking your job search.
              </p>

              <button
                className="add-button empty-add"
                onClick={openAddForm}
              >
                + Add Application
              </button>

            </div>

          ) : (

            <div className="application-list">

              {filteredApplications.map(
                (application) => (

                  <article
                    className="application-card"
                    key={application.id}
                  >

                    <div className="company-logo">
                      {getInitials(
                        application.company
                      )}
                    </div>

                    <div className="application-main">

                      <div className="application-title-row">

                        <div>

                          <h3>
                            {application.role}
                          </h3>

                          <p className="company-name">
                            {application.company}
                          </p>

                        </div>

                        <span
                          className={`status-badge ${
                            (
                              application.status ||
                              "Applied"
                            ).toLowerCase()
                          }`}
                        >

                          <span className="status-dot"></span>

                          {application.status}

                        </span>

                      </div>

                      <div className="application-meta">

                        <span>
                          ◉{" "}
                          {application.location ||
                            "Location not specified"}
                        </span>

                        <span>
                          ◷{" "}
                          {application.job_type ||
                            "Job type not specified"}
                        </span>

                        <span>
                          ▣{" "}
                          {formatDate(
                            application.application_date
                          )}
                        </span>

                        {application.salary && (
                          <span>
                            ₹ {application.salary}
                          </span>
                        )}

                      </div>

                    </div>

                    <div className="application-actions">

                      <button
                        className="action-btn view"
                        onClick={() =>
                          openViewModal(
                            application
                          )
                        }
                      >
                        View
                      </button>

                      <button
                        className="action-btn edit"
                        onClick={() =>
                          openEditForm(
                            application
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="action-btn delete"
                        onClick={() =>
                          handleDelete(
                            application.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

          {!loading &&
            applications.length > 0 && (

              <div className="results-footer">

                Showing{" "}

                <strong>
                  {filteredApplications.length}
                </strong>{" "}

                of{" "}

                <strong>
                  {applications.length}
                </strong>{" "}

                applications

              </div>

            )}

        </section>

        {/* ===================================================
            ADD / EDIT APPLICATION MODAL
        ==================================================== */}

        {showForm && (

          <div
            className="modal-overlay"
            onClick={closeForm}
          >

            <div
              className="modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <p className="eyebrow">
                    {editingId
                      ? "UPDATE APPLICATION"
                      : "NEW APPLICATION"}
                  </p>

                  <h2>
                    {editingId
                      ? "Edit Application"
                      : "Add Application"}
                  </h2>

                </div>

                <button
                  className="close-btn"
                  onClick={closeForm}
                >
                  ×
                </button>

              </div>

              <form onSubmit={handleSubmit}>

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Company *
                    </label>

                    <input
                      type="text"
                      name="company"
                      value={
                        formData.company
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Microsoft"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Job Role *
                    </label>

                    <input
                      type="text"
                      name="role"
                      value={
                        formData.role
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Data Analyst"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Location
                    </label>

                    <input
                      type="text"
                      name="location"
                      value={
                        formData.location
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Noida"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        formData.status
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="Applied">
                        Applied
                      </option>

                      <option value="Interview">
                        Interview
                      </option>

                      <option value="Offer">
                        Offer
                      </option>

                      <option value="Rejected">
                        Rejected
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Application Date
                    </label>

                    <input
                      type="date"
                      name="application_date"
                      value={
                        formData.application_date
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Job Type
                    </label>

                    <select
                      name="job_type"
                      value={
                        formData.job_type
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="Full-time">
                        Full-time
                      </option>

                      <option value="Part-time">
                        Part-time
                      </option>

                      <option value="Internship">
                        Internship
                      </option>

                      <option value="Contract">
                        Contract
                      </option>

                      <option value="Remote">
                        Remote
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Salary
                    </label>

                    <input
                      type="text"
                      name="salary"
                      value={
                        formData.salary
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 6 LPA"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Job URL
                    </label>

                    <input
                      type="url"
                      name="job_url"
                      value={
                        formData.job_url
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="https://..."
                    />

                  </div>

                </div>

                <div className="form-group">

                  <label>
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      formData.notes
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Add interview notes, recruiter details, preparation notes..."
                    rows="4"
                  ></textarea>

                </div>

                <div className="modal-actions">

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-btn"
                  >
                    {editingId
                      ? "Update Application"
                      : "Save Application"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* ===================================================
            VIEW DETAILS MODAL
        ==================================================== */}

        {viewingApplication && (

          <div
            className="modal-overlay"
            onClick={closeViewModal}
          >

            <div
              className="details-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* APPLICATION HEADER */}

              <div className="details-top">

                <div className="details-company-logo">
                  {getInitials(
                    viewingApplication.company
                  )}
                </div>

                <div className="details-company">

                  <p className="eyebrow">
                    APPLICATION DETAILS
                  </p>

                  <h2>
                    {viewingApplication.role}
                  </h2>

                  <p>
                    {viewingApplication.company}
                  </p>

                </div>

                <button
                  className="close-btn"
                  onClick={closeViewModal}
                >
                  ×
                </button>

              </div>

              {/* STATUS */}

              <div className="details-status-row">

                <span
                  className={`status-badge ${
                    (
                      viewingApplication.status ||
                      "Applied"
                    ).toLowerCase()
                  }`}
                >

                  <span className="status-dot"></span>

                  {viewingApplication.status}

                </span>

              </div>

              {/* DETAILS */}

              <div className="details-grid">

                <div className="detail-item">

                  <span>
                    Location
                  </span>

                  <strong>
                    {viewingApplication.location ||
                      "Not specified"}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Application Date
                  </span>

                  <strong>
                    {formatDate(
                      viewingApplication.application_date
                    )}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Job Type
                  </span>

                  <strong>
                    {viewingApplication.job_type ||
                      "Not specified"}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Salary
                  </span>

                  <strong>
                    {viewingApplication.salary ||
                      "Not specified"}
                  </strong>

                </div>

              </div>

              {viewingApplication.notes && (

                <div className="notes-box">

                  <span>
                    Notes
                  </span>

                  <p>
                    {viewingApplication.notes}
                  </p>

                </div>

              )}

              {/* =================================================
                  INTERVIEW MANAGEMENT
              ================================================== */}

              <div className="timeline-section">

                <div className="timeline-header">

                  <div>

                    <p className="eyebrow">
                      INTERVIEW MANAGEMENT
                    </p>

                    <h3>
                      Interview Schedule
                    </h3>

                  </div>

                  <button
                    className="timeline-add-btn"
                    onClick={
                      openScheduleInterviewForm
                    }
                  >
                    + Schedule Interview
                  </button>

                </div>

                {/* INTERVIEW FORM */}

                {showInterviewForm && (

                  <form
                    className="timeline-form"
                    onSubmit={
                      handleInterviewSubmit
                    }
                  >

                    <div className="timeline-form-grid">

                      <div className="form-group">

                        <label>
                          Interview Type
                        </label>

                        <select
                          name="interview_type"
                          value={
                            interviewForm.interview_type
                          }
                          onChange={
                            handleInterviewChange
                          }
                        >

                          <option value="Interview">
                            Interview
                          </option>

                          <option value="Technical Round">
                            Technical Round
                          </option>

                          <option value="HR Round">
                            HR Round
                          </option>

                          <option value="Managerial Round">
                            Managerial Round
                          </option>

                          <option value="Final Round">
                            Final Round
                          </option>

                        </select>

                      </div>

                      <div className="form-group">

                        <label>
                          Interview Date
                        </label>

                        <input
                          type="date"
                          name="interview_date"
                          value={
                            interviewForm.interview_date
                          }
                          onChange={
                            handleInterviewChange
                          }
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Interview Time
                        </label>

                        <input
                          type="time"
                          name="interview_time"
                          value={
                            interviewForm.interview_time
                          }
                          onChange={
                            handleInterviewChange
                          }
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Interview Mode
                        </label>

                        <select
                          name="mode"
                          value={
                            interviewForm.mode
                          }
                          onChange={
                            handleInterviewChange
                          }
                        >

                          <option value="Online">
                            Online
                          </option>

                          <option value="Google Meet">
                            Google Meet
                          </option>

                          <option value="Microsoft Teams">
                            Microsoft Teams
                          </option>

                          <option value="Zoom">
                            Zoom
                          </option>

                          <option value="Phone">
                            Phone
                          </option>

                          <option value="In-person">
                            In-person
                          </option>

                        </select>

                      </div>

                    </div>

                    <div className="form-group">

                      <label>
                        Meeting / Interview Link
                      </label>

                      <input
                        type="url"
                        name="meeting_link"
                        value={
                          interviewForm.meeting_link
                        }
                        onChange={
                          handleInterviewChange
                        }
                        placeholder="https://meet.google.com/..."
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Interview Notes
                      </label>

                      <textarea
                        name="notes"
                        value={
                          interviewForm.notes
                        }
                        onChange={
                          handleInterviewChange
                        }
                        placeholder="e.g. Prepare SQL, Python and project questions..."
                        rows="3"
                      ></textarea>

                    </div>

                    <div className="timeline-form-actions">

                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={
                          closeInterviewForm
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="save-btn"
                      >
                        {editingInterviewId
                          ? "Update Interview"
                          : "Schedule Interview"}
                      </button>

                    </div>

                  </form>

                )}

                {/* INTERVIEW LIST */}

                {interviewLoading ? (

                  <div className="timeline-loading">
                    Loading interview schedules...
                  </div>

                ) : interviewSchedules.length === 0 ? (

                  <div className="timeline-empty">

                    <div>
                      ◷
                    </div>

                    <p>
                      No interview scheduled
                    </p>

                    <span>
                      Schedule an interview when
                      you receive an interview call.
                    </span>

                  </div>

                ) : (

                  <div className="application-list">

                    {interviewSchedules.map(
                      (interview) => (

                        <article
                          className="application-card"
                          key={interview.id}
                        >

                          <div className="company-logo">
                            ◷
                          </div>

                          <div className="application-main">

                            <div className="application-title-row">

                              <div>

                                <h3>
                                  {interview.interview_type}
                                </h3>

                                <p className="company-name">
                                  {formatDate(
                                    interview.interview_date
                                  )}{" "}
                                  •{" "}
                                  {formatTime(
                                    interview.interview_time
                                  )}
                                </p>

                              </div>

                              <span className="status-badge interview">

                                <span className="status-dot"></span>

                                Scheduled

                              </span>

                            </div>

                            <div className="application-meta">

                              {interview.mode && (
                                <span>
                                  ◉{" "}
                                  {interview.mode}
                                </span>
                              )}

                              {interview.notes && (
                                <span>
                                  📝{" "}
                                  {interview.notes}
                                </span>
                              )}

                            </div>

                          </div>

                          <div className="application-actions">

                            <button
                              className="action-btn edit"
                              onClick={() =>
                                openEditInterviewForm(
                                  interview
                                )
                              }
                            >
                              Edit
                            </button>

                            {interview.meeting_link && (
                              <a
                                href={
                                  interview.meeting_link
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="action-btn view"
                              >
                                Join
                              </a>
                            )}

                            <button
                              className="action-btn delete"
                              onClick={() =>
                                handleDeleteInterview(
                                  interview.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </article>

                      )
                    )}

                  </div>

                )}

              </div>

              {/* =================================================
                  APPLICATION TIMELINE
              ================================================== */}

              <div className="timeline-section">

                <div className="timeline-header">

                  <div>

                    <p className="eyebrow">
                      APPLICATION HISTORY
                    </p>

                    <h3>
                      Application Timeline
                    </h3>

                  </div>

                  <button
                    className="timeline-add-btn"
                    onClick={
                      openTimelineForm
                    }
                  >
                    + Add Event
                  </button>

                </div>

                {/* TIMELINE FORM */}

                {showTimelineForm && (

                  <form
                    className="timeline-form"
                    onSubmit={
                      handleTimelineSubmit
                    }
                  >

                    <div className="timeline-form-grid">

                      <div className="form-group">

                        <label>
                          Stage
                        </label>

                        <select
                          name="status"
                          value={
                            timelineForm.status
                          }
                          onChange={
                            handleTimelineChange
                          }
                        >

                          <option value="Applied">
                            Applied
                          </option>

                          <option value="Interview">
                            Interview
                          </option>

                          <option value="Technical Round">
                            Technical Round
                          </option>

                          <option value="HR Round">
                            HR Round
                          </option>

                          <option value="Offer">
                            Offer
                          </option>

                          <option value="Rejected">
                            Rejected
                          </option>

                        </select>

                      </div>

                    </div>

                    <div className="form-group">

                      <label>
                        Event Notes
                      </label>

                      <textarea
                        name="notes"
                        value={
                          timelineForm.notes
                        }
                        onChange={
                          handleTimelineChange
                        }
                        placeholder="e.g. Interview completed successfully..."
                        rows="3"
                      ></textarea>

                    </div>

                    <p>
                      Date and time are added
                      automatically when you save
                      this event.
                    </p>

                    <div className="timeline-form-actions">

                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={
                          closeTimelineForm
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="save-btn"
                      >
                        Add Timeline Event
                      </button>

                    </div>

                  </form>

                )}

                {/* TIMELINE LOADING */}

                {timelineLoading ? (

                  <div className="timeline-loading">
                    Loading application history...
                  </div>

                ) : timelineEvents.length === 0 ? (

                  <div className="timeline-empty">

                    <div>
                      ◷
                    </div>

                    <p>
                      No timeline events yet.
                    </p>

                    <span>
                      Add an event to track this
                      application journey.
                    </span>

                  </div>

                ) : (

                  <div className="timeline">

                    {timelineEvents.map(
                      (
                        timelineEvent,
                        index
                      ) => (

                        <div
                          className="timeline-item"
                          key={
                            timelineEvent.id
                          }
                        >

                          <div
                            className={`timeline-marker ${
                              (
                                timelineEvent.status ||
                                ""
                              )
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )
                            }`}
                          >

                            {getTimelineIcon(
                              timelineEvent.status
                            )}

                          </div>

                          {index <
                            timelineEvents.length -
                              1 && (
                            <div className="timeline-connector"></div>
                          )}

                          <div className="timeline-content">

                            <div className="timeline-event-top">

                              <div>

                                <h4>
                                  {
                                    timelineEvent.status
                                  }
                                </h4>

                                <span className="timeline-date">
                                  {formatDateTime(
                                    timelineEvent.event_date
                                  )}
                                </span>

                              </div>

                              <button
                                className="timeline-delete"
                                onClick={() =>
                                  handleDeleteTimelineEvent(
                                    timelineEvent.id
                                  )
                                }
                                title="Delete timeline event"
                              >
                                ×
                              </button>

                            </div>

                            {timelineEvent.notes && (

                              <p className="timeline-notes">
                                {
                                  timelineEvent.notes
                                }
                              </p>

                            )}

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

              {/* =================================================
                  DETAILS ACTIONS
              ================================================== */}

              <div className="details-actions">

                {viewingApplication.job_url && (

                  <a
                    href={
                      viewingApplication.job_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="job-link"
                  >
                    Open Job Listing ↗
                  </a>

                )}

                <button
                  className="cancel-btn"
                  onClick={closeViewModal}
                >
                  Close
                </button>

                <button
                  className="save-btn"
                  onClick={() => {
                    closeViewModal();

                    openEditForm(
                      viewingApplication
                    );
                  }}
                >
                  Edit Application
                </button>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default App;