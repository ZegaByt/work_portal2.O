import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import { toast } from "sonner";
import { getData, patchData } from "../../../store/httpService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Custom SVG Icons for a professional look ---
const IconBellRinging = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.35 15.65a4 4 0 1 0 3.3 0" />
    <path d="M12 22v-2" />
  </svg>
);

const IconCalendarCheck = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <path d="M21 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
    <path d="M3 10h18" />
    <path d="m15 19l2 2l4-4" />
  </svg>
);

const IconWarningCircle = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconCheck = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-gray-200 animate-pulse">
    <div className="flex items-start mb-3">
      <div className="h-6 w-6 bg-gray-200 rounded-full mr-3"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
    <div className="flex space-x-2 mt-4">
      <div className="flex-1 h-9 bg-gray-200 rounded-full"></div>
      <div className="flex-1 h-9 bg-gray-200 rounded-full"></div>
    </div>
  </div>
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
        return `Reminders for ${customDate ? moment(customDate).format("DD MMMM YYYY") : "Selected Date"}`;
      default:
        return "Today's Follow-up Reminders";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="text-center p-6 bg-white rounded-lg shadow-xl animate-fade-in max-w-sm w-full">
          <IconWarningCircle className="mx-auto h-12 w-12 text-red-500 mb-3 animate-jiggle" />
          <h3 className="text-lg text-red-700 mb-2">Error Loading Data</h3>
          <p className="text-gray-700 text-sm">{error}</p>
          <button
            onClick={() => navigate("/dashboard/employee")}
            className="mt-5 px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-inter text-gray-800 bg-gray-50 pb-10">
      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-0 py-0 transition-all duration-300">
        {/* Header Section */}
        <div className="pb-6 mb-6 relative">
          <h1 className="text-3xl font-bold text-blue-800 mb-3 leading-tight flex items-center">
            <IconBellRinging className="w-8 h-8 text-indigo-500 mr-3 animate-bell-ring" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              {getHeading()}
            </span>
          </h1>
          <p className="text-gray-600 text-base max-w-xl">
            Effortlessly manage your customer follow-ups and ensure every task is actioned.
          </p>

          {/* Filter Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleFilterChange("today")}
              className={`px-5 py-2 rounded-full text-sm transition-all duration-300 transform hover:scale-105 shadow-sm
                ${filter === "today"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-300/50"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
            >
              Today
            </button>
            <button
              onClick={() => handleFilterChange("tomorrow")}
              className={`px-5 py-2 rounded-full text-sm transition-all duration-300 transform hover:scale-105 shadow-sm
                ${filter === "tomorrow"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-300/50"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
            >
              Tomorrow
            </button>
            <div className="flex items-center gap-2 bg-gray-100 rounded-full pl-3 pr-2 py-1 shadow-sm">
              <button
                onClick={() => handleFilterChange("custom")}
                className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 transform hover:scale-105
                  ${filter === "custom"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-300/50"
                    : "text-gray-700 hover:bg-gray-200"
                  }`}
              >
                On Specific Date
              </button>
              {filter === "custom" && (
                <div className="relative">
                  <IconCalendarCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="pl-9 pr-2 py-1.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700 transition-all duration-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List or Skeleton/Empty State */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100 animate-fade-in">
            <IconBellRinging className="mx-auto h-16 w-16 text-gray-300 mb-5" />
            <p className="text-gray-600 text-lg">
              No active reminders {filter === "today" ? "for today" : filter === "tomorrow" ? "for tomorrow" : `on ${customDate || "the selected date"}`}.
            </p>
            <p className="text-gray-500 mt-1 text-sm">
              All clear! Why not create a new follow-up?
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-5 shadow-lg border-t-4 border-indigo-400 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl relative overflow-hidden group animate-fade-in
                  ${notification.mark_complete ? "opacity-70 grayscale" : "hover:border-indigo-500"}`}
                style={{
                  background: notification.mark_complete
                    ? "linear-gradient(145deg, #f0f0f0, #e0e0e0)"
                    : "linear-gradient(145deg, #ffffff, #f0f0f0)",
                  boxShadow: notification.mark_complete
                    ? "inset 2px 2px 5px #bebebe, inset -5px -5px 10px #ffffff"
                    : "5px 5px 10px rgba(0,0,0,0.05), -5px -5px 10px rgba(255,255,255,0.8)",
                  borderTop: notification.mark_complete ? "4px solid #a0a0a0" : "4px solid #6366f1",
                }}
              >
                <div className="flex items-start mb-3">
                  <IconBellRinging className="h-6 w-6 text-indigo-500 mr-3 flex-shrink-0 animate-wiggle-subtle" />
                  <div className="flex-1">
                    <p
                      className={`text-base font-medium leading-snug
                        ${notification.mark_complete ? "line-through text-gray-500" : "text-gray-900"}`}
                    >
                      {notification.customerName}
                    </p>
                    <p
                      className={`text-sm mt-0.5
                        ${notification.mark_complete ? "line-through text-gray-400" : "text-gray-600"}`}
                    >
                      {notification.reminderNote}
                    </p>
                  </div>
                  <span className="absolute top-4 right-4 px-2.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
                    {notification.urgency}
                  </span>
                </div>

                <div
                  className={`text-sm text-gray-500 mt-2
                    ${notification.mark_complete ? "line-through text-gray-400" : ""}`}
                >
                  Due: <span className="font-medium text-gray-700">{notification.reminderDate}</span>
                </div>

                <div className="mt-5 flex space-x-2">
                  <button
                    onClick={() => handleViewNote(notification.customerId)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md transform hover:-translate-y-0.5"
                  >
                    View Customer
                  </button>
                  <button
                    onClick={() => handleMarkDone(notification.noteId)}
                    disabled={notification.mark_complete}
                    className={`flex-1 px-4 py-2 rounded-full text-sm transition-all duration-200 shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5
                      ${
                        notification.mark_complete
                          ? "bg-green-100 text-green-700 border border-green-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                      }`}
                  >
                    {notification.mark_complete ? (
                      <>
                        <IconCheck className="h-4 w-4" />
                        Submitted
                      </>
                    ) : (
                      <>
                        <IconCheck className="h-4 w-4" />
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
          background-color: #f8fafc; /* Light background for contrast */
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

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes jiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
            75% { transform: rotate(-1deg); }
        }
        .animate-jiggle {
            animation: jiggle 0.4s ease-in-out infinite;
        }

        @keyframes bell-ring {
            0%, 100% { transform: rotate(0); }
            15%, 45% { transform: rotate(10deg); }
            30%, 60% { transform: rotate(-10deg); }
            75% { transform: rotate(3deg); }
            90% { transform: rotate(-3deg); }
        }
        .animate-bell-ring {
            animation: bell-ring 2s ease-in-out infinite;
        }
        
        @keyframes wiggle-subtle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1deg); }
          75% { transform: rotate(-1deg); }
        }
        .animate-wiggle-subtle {
          animation: wiggle-subtle 1s ease-in-out infinite;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #e0e7ff; /* Light blue track */
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #93c5fd; /* Light blue thumb */
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #60a5fa; /* Darker blue on hover */
        }
      `}</style>
    </div>
  );
};

export default ActionToday;