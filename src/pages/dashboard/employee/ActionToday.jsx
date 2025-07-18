import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import { toast } from "sonner";
import { getData, patchData } from "../../../store/httpService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Custom SVG Icons for a professional look ---
// A sleek alert/bell icon for notifications
const IconBellRinging = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.35 15.65a4 4 0 1 0 3.3 0" />
    <path d="M12 22v-2" />
  </svg>
);

// A modern calendar icon
const IconCalendarCheck = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <path d="M21 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
    <path d="M3 10h18" />
    <path d="m15 19l2 2l4-4" />
  </svg>
);

// A simple loading spinner icon
const IconSpinner = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

// An alert circle icon for errors
const IconWarningCircle = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// A checkmark icon for the Done/Submitted button
const IconCheck = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const ActionToday = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("today"); // today, tomorrow, custom
  const [customDate, setCustomDate] = useState("");
  const [completedNotes, setCompletedNotes] = useState(new Set()); // Track completed notes

  // Fetch notes
  useEffect(() => {
    const fetchNotes = async () => {
      if (!user?.id) {
        setError("User ID not available. Please log in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getData(`/employee/${user.id}/customers/followups/`);
        // Ensure that `response.data` is an array; default to empty if not.
        setNotes(Array.isArray(response.data) ? response.data : []);
        // Initialize completed notes based on mark_complete field
        const completed = new Set(
          response.data
            .filter((note) => note.mark_complete)
            .map((note) => note.id)
        );
        setCompletedNotes(completed);
        setError(null);
      } catch (err) {
        console.error("Error fetching follow-up notes:", err);
        setError("Failed to load follow-up notes. Please try again.");
        toast.error("Failed to load follow-up notes.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user?.id]);

  // Handle marking a note as done
  const handleMarkDone = async (noteId) => {
    try {
      await patchData(`/followup/note/${noteId}/`, { mark_complete: true });
      // Update notes state to reflect mark_complete: true
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? { ...note, mark_complete: true } : note
        )
      );
      setCompletedNotes((prev) => new Set(prev).add(noteId));
      toast.success("Follow-up marked as completed!");
    } catch (err) {
      console.error("Error marking follow-up as done:", err);
      toast.error("Failed to mark follow-up as completed.");
    }
  };

  // Process notifications
  const today = moment().tz("Asia/Kolkata").startOf("day");
  const tomorrow = moment().tz("Asia/Kolkata").add(1, "days").startOf("day");
  const custom = customDate ? moment(customDate).tz("Asia/Kolkata").startOf("day") : null;

  const notifications = notes
    .filter((note) => note.reminder_date)
    .map((note) => {
      try {
        const reminderDate = moment(note.reminder_date).tz("Asia/Kolkata");
        if (!reminderDate.isValid()) {
          console.warn(`Invalid date for note ${note.id}: ${note.reminder_date}`);
          return null;
        }

        const isToday = reminderDate.isSame(today, "day");
        const isTomorrow = reminderDate.isSame(tomorrow, "day");
        const isCustom = custom && reminderDate.isSame(custom, "day");

        if (
          (filter === "today" && isToday) ||
          (filter === "tomorrow" && isTomorrow) ||
          (filter === "custom" && isCustom)
        ) {
          const notificationId = `${note.customer_user_id}-${note.id}-${note.reminder_date}`;
          return {
            id: notificationId,
            customerId: note.customer_user_id,
            customerName: note.customer_name,
            noteId: note.id,
            reminderDate: reminderDate.format("DD MMM YYYY"),
            reminderNote: note.reminder_note,
            urgency: filter === "today" ? "Due Today" : filter === "tomorrow" ? "Due Tomorrow" : "Due on Date",
            mark_complete: note.mark_complete,
          };
        }
        return null;
      } catch (err) {
        console.error(`Error processing reminder_date for note ${note.id}:`, err);
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => moment(a.reminderDate, "DD MMM YYYY").diff(moment(b.reminderDate, "DD MMM YYYY")));

  // Handle View Note
  const handleViewNote = (customerId) => {
    navigate(`/dashboard/employee/customer/${customerId}`);
  };

  // Handle Filter Change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter !== "custom") {
      setCustomDate("");
    }
  };

  // Dynamic Heading
  const getHeading = () => {
    switch (filter) {
      case "today":
        return "Today's Follow-up Reminders";
      case "tomorrow":
        return "Tomorrow's Follow-up Reminders";
      case "custom":
        return `Follow-up Reminders for ${customDate ? moment(customDate).format("DD MMMM YYYY") : "Selected Date"}`;
      default:
        return "Today's Follow-up Reminders";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-xl animate-fade-in">
          <IconSpinner className="mx-auto h-16 w-16 text-blue-500 animate-spin-slow" />
          <p className="text-gray-700 text-lg mt-4">Loading your important reminders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-xl animate-fade-in">
          <IconWarningCircle className="mx-auto h-16 w-16 text-red-500 mb-4 animate-jiggle" />
          <h3 className="text-xl text-red-700 mb-2">Error Loading Data</h3>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate("/dashboard/employee")}
            className="mt-6 px-7 py-3 bg-blue-600 text-white rounded-full text-base hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-inter text-gray-800">
      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 transition-all duration-300">
        {/* Header Section */}
        <div className="p-6 mb-6 relative overflow-hidden">
          <h1 className="text-4xl text-blue-800 mb-4 leading-tight flex items-center">
            <IconBellRinging className="w-10 h-10 text-orange-500 mr-4 animate-bell-ring" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              {getHeading()}
            </span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            Stay on top of your customer follow-ups and ensure no important task is missed.
          </p>

          {/* Filter Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => handleFilterChange("today")}
              className={`px-6 py-3 rounded-full text-base transition-all duration-300 transform hover:scale-105 shadow-md
                ${filter === "today"
                  ? "bg-blue-600 text-white shadow-blue-300/50"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
            >
              Today
            </button>
            <button
              onClick={() => handleFilterChange("tomorrow")}
              className={`px-6 py-3 rounded-full text-base transition-all duration-300 transform hover:scale-105 shadow-md
                ${filter === "tomorrow"
                  ? "bg-blue-600 text-white shadow-blue-300/50"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
            >
              Tomorrow
            </button>
            <div className="flex items-center gap-3 bg-gray-100 rounded-full pl-3 pr-2 py-1.5 shadow-md">
              <button
                onClick={() => handleFilterChange("custom")}
                className={`px-3 py-2 rounded-full text-base transition-all duration-300 transform hover:scale-105
                  ${filter === "custom"
                    ? "bg-blue-600 text-white shadow-blue-300/50"
                    : "text-gray-700 hover:bg-gray-200"
                  }`}
              >
                On Specific Date
              </button>
              {filter === "custom" && (
                <div className="relative">
                  <IconCalendarCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 transition-all duration-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100 animate-fade-in">
            <IconBellRinging className="mx-auto h-20 w-20 text-gray-400 mb-6" />
            <p className="text-gray-600 text-xl">
              No active reminders {filter === "today" ? "for today" : filter === "tomorrow" ? "for tomorrow" : `on ${customDate || "the selected date"}`}.
            </p>
            <p className="text-gray-500 mt-2">
              Time to relax, or perhaps create a new follow-up!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-6 shadow-md border-t-4 border-orange-400 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg relative overflow-hidden group animate-fade-in
                  ${notification.mark_complete ? "opacity-75" : ""}`}
              >
                <div className="flex items-start mb-4">
                  <IconBellRinging className="h-7 w-7 text-orange-500 mr-3 flex-shrink-0 animate-wiggle-subtle" />
                  <div className="flex-1">
                    <p
                      className={`text-base text-gray-900 leading-snug
                        ${notification.mark_complete ? "line-through text-gray-500" : ""}`}
                    >
                      {notification.customerName} (ID: {notification.customerId})
                    </p>
                    <p
                      className={`text-sm text-gray-600 mt-1
                        ${notification.mark_complete ? "line-through text-gray-400" : ""}`}
                    >
                      Reminder for: <span className="text-gray-800">{notification.reminderNote}</span>
                    </p>
                  </div>
                  <span className="absolute top-4 right-4 px-3 py-1 text-xs rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                    {notification.urgency}
                  </span>
                </div>

                <div
                  className={`text-sm text-gray-500 mt-3
                    ${notification.mark_complete ? "line-through text-gray-400" : ""}`}
                >
                  Due on: <span className="text-gray-700">{notification.reminderDate}</span>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => handleViewNote(notification.customerId)}
                    className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors duration-200 shadow-md transform hover:-translate-y-0.5"
                  >
                    View Customer
                  </button>
                  <button
                    onClick={() => handleMarkDone(notification.noteId)}
                    disabled={notification.mark_complete}
                    className={`flex-1 px-5 py-2.5 rounded-full text-sm transition-all duration-200 shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-2
                      ${
                        notification.mark_complete
                          ? "bg-green-100 text-green-700 border border-green-300 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                  >
                    {notification.mark_complete ? (
                      <>
                        <IconCheck className="h-5 w-5" />
                        Submitted
                      </>
                    ) : (
                      <>
                        <IconCheck className="h-5 w-5" />
                        Done
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Styles and Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        /* Custom Animations */
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }

        @keyframes jiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
            75% { transform: rotate(-2deg); }
        }
        .animate-jiggle {
            animation: jiggle 0.5s ease-in-out infinite;
        }

        @keyframes bell-ring {
            0%, 100% { transform: rotate(0); }
            15%, 45% { transform: rotate(15deg); }
            30%, 60% { transform: rotate(-15deg); }
            75% { transform: rotate(5deg); }
            90% { transform: rotate(-5deg); }
        }
        .animate-bell-ring {
            animation: bell-ring 2.5s ease-in-out infinite;
        }
        
        @keyframes wiggle-subtle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
        .animate-wiggle-subtle {
          animation: wiggle-subtle 1.5s ease-in-out infinite;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #e0e7ff;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #93c5fd;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
      `}</style>
    </div>
  );
};

export default ActionToday;