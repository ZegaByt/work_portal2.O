import React, { useState, useEffect, useCallback, Component } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, FileText, Image, Phone, Users, IndianRupee, XCircle, UserPlus, Share2, Clock, CheckCircle } from "lucide-react"; // Added new icons
import { getData } from "../../../store/httpservice";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { format } from "date-fns";
import moment from "moment-timezone";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Error Boundary Component (unchanged - good for production error handling)
class ErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    console.error("ErrorBoundary Caught Error:", error);
    return { error: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary Caught Error Details:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4 bg-gray-100 dark:bg-gray-900">
          <Card className="w-full max-w-md bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-100">An unexpected error occurred:</CardTitle>
              <CardDescription className="text-red-600 dark:text-red-200">{this.state.error}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-500 dark:text-red-300">
                Please refresh the page or contact support if the issue persists.
              </p>
              {this.state.errorInfo && (
                <div className="mt-4 p-2 bg-red-100 rounded-md text-xs text-red-700 overflow-auto max-h-40 dark:bg-red-900 dark:text-red-100">
                  <strong>Error Details:</strong>
                  <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

const MyWorkReport = () => {
  const [dailyNotes, setDailyNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const savedDate = localStorage.getItem('selectedDate');
    return savedDate ? moment(savedDate).tz("Asia/Kolkata").toDate() : moment().tz("Asia/Kolkata").toDate();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const savedMonth = localStorage.getItem('selectedMonth');
    return savedMonth || moment().tz("Asia/Kolkata").format("YYYY-MM");
  });
  const [filterType, setFilterType] = useState(() => {
    const savedFilterType = localStorage.getItem('filterType');
    return savedFilterType || "daily";
  });
  // Change initial state for selectedCustomerId to a non-empty string for 'All Customers'
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    return localStorage.getItem('selectedCustomerId') || "all-customers"; // Changed from "" to "all-customers"
  });
  const [availableCustomers, setAvailableCustomers] = useState([]);


  const [summary, setSummary] = useState({
    totalFollowUps: 0,
    totalCalls: 0,
    totalPayments: 0,
    profileUpdates: 0,
    newProfilesSubmitted: 0, // New: Profile Status - New Profile Submitted by customer
    profilesShared: 0,       // New: Profile Status - Profiles Shared
    futureMatchFixed: 0,     // New: Future Match Status - Future Match Date Fixed
    pastMatches: 0,          // New: Past Match Status - Past Match Completed, Past Match Interested
  });

  const USE_MOCK_DATA = false;
  const API_BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    console.log("useEffect: Parsing user cookie...");
    try {
      const userCookie = Cookies.get("user");
      console.log("User Cookie:", userCookie || "Missing");
      if (!userCookie) {
        setNotesError("Please log in. User session not found.");
        setLoadingNotes(false);
        return;
      }
      const parsedUser = JSON.parse(userCookie);
      console.log("Parsed User:", parsedUser);
      if (parsedUser.id) {
        setCurrentEmployeeId(parsedUser.id);
        console.log("currentEmployeeId set to:", parsedUser.id);
      } else {
        setNotesError("Invalid user session. User ID not found in cookie.");
        setLoadingNotes(false);
      }
    } catch (error) {
      console.error("Cookie Parse Error:", error);
      setNotesError("Failed to load user session. Please clear cookies and log in again.");
      setLoadingNotes(false);
    }
  }, []);

  // Save filters to local storage
  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate ? moment(selectedDate).toISOString() : '');
    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('filterType', filterType);
    localStorage.setItem('selectedCustomerId', selectedCustomerId);
  }, [selectedDate, selectedMonth, filterType, selectedCustomerId]);

  const parseDateWithTimezone = useCallback((dateStr) => {
    if (!dateStr) return null;
    const parsedMoment = moment.utc(dateStr);
    if (parsedMoment.isValid()) {
      return parsedMoment.tz("Asia/Kolkata");
    }
    const fallbackParsed = moment(dateStr, [
      "YYYY-MM-DD HH:mm:ss.SSSSSSZ",
      "YYYY-MM-DD HH:mm:ss.SSSZ",
      "YYYY-MM-DD HH:mm:ssZ",
      "YYYY-MM-DD HH:mm:ss",
      "DD/MM/YYYY, HH:mm:ss",
      "DD-MM-YYYY HH:mm:ss",
      "YYYY-MM-DD",
    ]).tz("Asia/Kolkata");

    if (fallbackParsed.isValid()) {
      return fallbackParsed;
    }

    console.warn(`Failed to parse date: ${dateStr}`);
    return null;
  }, []);

  const getStatusDisplay = (status, note, otherNote) => {
    if (status && status !== "null") return status.replace(/_/g, " ");
    if (otherNote && otherNote !== "N/A") return otherNote;
    if (note && note !== "N/A") return note;
    return "N/A";
  };

  const fetchDailyNotes = useCallback(async () => {
    if (!currentEmployeeId) {
      console.log("fetchDailyNotes: Current employee ID not available, skipping fetch.");
      setDailyNotes([]);
      setSummary({ totalFollowUps: 0, totalCalls: 0, totalPayments: 0, profileUpdates: 0, newProfilesSubmitted: 0, profilesShared: 0, futureMatchFixed: 0, pastMatches: 0 });
      setLoadingNotes(false);
      return;
    }

    console.log("fetchDailyNotes started:", { currentEmployeeId, filterType, selectedDate: selectedDate?.toISOString(), selectedMonth, selectedCustomerId });

    try {
      setLoadingNotes(true);
      setNotesError(null);
      const token = Cookies.get("accessToken");

      if (!token) {
        console.error("fetchDailyNotes: No authentication token found. Redirecting to login or showing error.");
        throw new Error("No authentication token. Please log in.");
      }

      let notes = [];
      const url = `${API_BASE_URL}/employee/${currentEmployeeId}/customers/followups/`;
      console.log("fetchDailyNotes: Fetching from API:", url);

      if (USE_MOCK_DATA) {
        console.log("fetchDailyNotes: Using mock data.");
        const allMockNotes = [
          {
            "id": 18, "customer": 6, "note_type": "employee_customer", "customer_user_id": "GDM0000002", "customer_name": "Sai Kumar Thadaka", "note": "dfsd", "image": null, "file_upload": null, "is_read": false, "created_at": "2025-07-03T16:40:58.549794+05:30", "date": "2025-07-03T16:40:58.547798+05:30", "call_status": null, "call_status_note": null, "call_status_image": null, "call_status_other_note": null, "profile_status": "fees_recorded", "profile_status_note": null, "profile_status_image": null, "profile_status_other_note": null, "future_match_status": null, "future_match_status_note": null, "future_match_status_image": null, "future_match_status_other_note": null, "communication_status": null, "communication_status_note": null, "communication_status_image": null, "communication_status_other_note": null, "past_match_status": null, "past_match_status_note": null, "past_match_status_image": null, "past_match_status_other_note": null, "match_process_status": null, "match_process_status_note": null, "match_process_status_image": null, "match_process_status_other_note": null, "marriage_progress_status": null, "marriage_progress_status_note": null, "marriage_progress_status_image": null, "marriage_progress_status_other_note": null, "marriage_outcome_status": null, "marriage_outcome_status_note": null, "marriage_outcome_status_image": null, "marriage_outcome_status_other_note": null, "profile_closed_status": null, "profile_closed_status_note": null, "profile_closed_status_image": null, "profile_closed_status_other_note": null, "payment_amount": null, "payment_note": null, "payment_image": null, "status_summary": { "call_attempt": null, "profile_followup": null, "future_match": null, "communication": null, "past_match": null, "match_process": null, "marriage_progress": null, "marriage_outcome": null, "profile_closed": null }, "employee_user_id": "Emp00001", "employee_name": "Varun Ganduri", "reminder_date": null, "reminder_note": null
          },
          {
            "id": 17, "customer": 5, "note_type": "employee_customer", "customer_user_id": "GDM0000001", "customer_name": "Jyothi Priya", "note": "egerte", "image": null, "file_upload": null, "is_read": false, "created_at": "2025-07-02T22:36:25.591212+05:30", "date": "2025-07-02T22:36:25.590213+05:30", "call_status": null, "call_status_note": null, "call_status_image": null, "call_status_other_note": null, "profile_status": "photo_uploaded", "profile_status_note": null, "profile_status_image": null, "profile_status_other_note": null, "future_match_status": null, "future_match_status_note": null, "future_match_status_image": null, "future_match_status_other_note": null, "communication_status": null, "communication_status_note": null, "communication_status_image": null, "communication_status_other_note": null, "past_match_status": "completed", "past_match_status_note": null, "past_match_status_image": null, "past_match_status_other_note": null, "match_process_status": null, "match_process_status_note": null, "match_process_status_image": null, "match_process_status_other_note": null, "marriage_progress_status": null, "marriage_progress_status_note": null, "marriage_progress_status_image": null, "marriage_progress_status_other_note": null, "marriage_outcome_status": null, "marriage_outcome_status_note": null, "marriage_outcome_status_image": null, "marriage_outcome_status_other_note": null, "profile_closed_status": null, "profile_closed_status_note": null, "profile_closed_status_image": null, "profile_closed_status_other_note": null, "payment_amount": 15000, "payment_note": "2025-07-02 00:00", "payment_image": null, "status_summary": { "call_attempt": null, "profile_followup": null, "future_match": null, "communication": null, "past_match": null, "match_process": null, "marriage_progress": null, "marriage_outcome": null, "profile_closed": null }, "employee_user_id": "Emp00001", "employee_name": "Varun Ganduri", "reminder_date": null, "reminder_note": null
          },
          {
            id: 22, customer: 21, note_type: "employee_customer", note_created_by_employee_user_id: "Emp00002", customer_user_id: "GDM0000011", customer_name: "Customer 11", note: "Note for another employee.", created_at: "2025-06-28T10:00:00.000000+05:30", call_status: "completed_call", payment_amount: 1000,
            "employee_user_id": "Emp00002", "employee_name": "Another Employee",
          },
          {
            "id": 19, "customer": 6, "note_type": "employee_customer", "customer_user_id": "GDM0000002", "customer_name": "Sai Kumar Thadaka", "note": "Follow up 2", "image": null, "file_upload": null, "is_read": false, "created_at": "2025-07-03T17:00:00.000000+05:30", "date": "2025-07-03T17:00:00.000000+05:30", "call_status": "missed_call", "profile_status": "profiles_shared", "employee_user_id": "Emp00001", "employee_name": "Varun Ganduri", "payment_amount": 0
          },
          {
            "id": 20, "customer": 7, "note_type": "employee_customer", "customer_user_id": "GDM0000003", "customer_name": "Ravi Teja", "note": "Initial contact", "image": null, "file_upload": null, "is_read": false, "created_at": "2025-07-03T10:30:00.000000+05:30", "date": "2025-07-03T10:30:00.000000+05:30", "call_status": "completed", "profile_status": "new_profile_submitted", "employee_user_id": "Emp00001", "employee_name": "Varun Ganduri", "payment_amount": 0
          },
          {
            "id": 21, "customer": 8, "note_type": "employee_customer", "customer_user_id": "GDM0000004", "customer_name": "Priya Sharma", "note": "Future match discussion", "image": null, "file_upload": null, "is_read": false, "created_at": "2025-07-04T09:00:00.000000+05:30", "date": "2025-07-04T09:00:00.000000+05:30", "call_status": null, "profile_status": null, "future_match_status": "future_fixed", "employee_user_id": "Emp00001", "employee_name": "Varun Ganduri", "payment_amount": 0
          },
          {
            "id": 23, "customer": 9, "note_type": "employee_customer", "customer_user_id": "GDM0000005", "customer_name": "Arjun Singh", "note": "Past match follow up", "image": null, "file_upload": null, "is_read": false, "created_at": "2025-07-04T11:00:00.000000+05:30", "date": "2025-07-04T11:00:00.000000+05:30", "call_status": null, "profile_status": null, "past_match_status": "interested", "employee_user_id": "Emp00001", "employee_name": "Varun Ganduri", "payment_amount": 0
          }
        ].filter(note => note.employee_user_id === currentEmployeeId);
        notes = allMockNotes;

      } else {
        const response = await getData(url, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        console.log("fetchDailyNotes: API Response received:", response);

        if (Array.isArray(response.data?.results)) {
          notes = response.data.results;
        } else if (Array.isArray(response.data)) {
          notes = response.data;
        } else {
          throw new Error("Invalid notes data structure received from API.");
        }
      }

      console.log("fetchDailyNotes: Raw notes received (before processing):", notes);

      const processedNotes = notes.filter(note => note.employee_user_id === currentEmployeeId).map((note) => ({
        ...note,
        customer_user_id: note.customer_user_id || "N/A",
        customer_name: note.customer_name || "N/A",
        note: note.note || "No note provided.",
        note_type: note.note_type || "N/A",
        call_status_display: getStatusDisplay(note.call_status, note.call_status_note, note.call_status_other_note),
        profile_status_display: getStatusDisplay(note.profile_status, note.profile_status_note, note.profile_status_other_note),
        payment_amount: note.payment_amount ? parseFloat(note.payment_amount) : null,
        payment_note: note.payment_note || "N/A",
        created_at_parsed: parseDateWithTimezone(note.created_at || note.date),
      }));

      // Extract unique customers for the dropdown
      const uniqueCustomers = Array.from(new Set(processedNotes.map(note => note.customer_user_id)))
        .map(id => {
          const customer = processedNotes.find(note => note.customer_user_id === id);
          return { id: customer.customer_user_id, name: customer.customer_name };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      setAvailableCustomers(uniqueCustomers);

      let filteredNotes = [];

      // Apply customer filter first if selected
      let customerFilteredNotes = processedNotes;
      // Update this condition to check for the new "all-customers" value
      if (selectedCustomerId && selectedCustomerId !== "all-customers") {
        customerFilteredNotes = processedNotes.filter(note => note.customer_user_id === selectedCustomerId);
      }

      const todayInKolkata = moment().tz("Asia/Kolkata").startOf('day');

      if (filterType === "daily") {
        const targetDateMoment = moment(selectedDate).tz("Asia/Kolkata");
        const targetDayStart = targetDateMoment.clone().startOf('day');
        const targetDayEnd = targetDateMoment.clone().endOf('day');

        console.log(`Filtering for daily report on ${targetDateMoment.format('YYYY-MM-DD')}:`, { start: targetDayStart.toISOString(), end: targetDayEnd.toISOString() });

        filteredNotes = customerFilteredNotes.filter((note) => {
          const createdMoment = note.created_at_parsed;
          if (!createdMoment || !createdMoment.isValid()) {
            return false;
          }
          return createdMoment.isBetween(targetDayStart, targetDayEnd, null, '[]');
        });
      } else if (filterType === "monthly" || filterType === "all_current_month") {
        const [year, month] = selectedMonth.split('-').map(Number);
        const targetMonthMoment = moment().tz("Asia/Kolkata").year(year).month(month - 1);
        const targetMonthStart = targetMonthMoment.clone().startOf('month');
        const targetMonthEnd = targetMonthMoment.clone().endOf('month');

        console.log(`Filtering for monthly report on ${targetMonthMoment.format('YYYY-MM')}:`, { start: targetMonthStart.toISOString(), end: targetMonthEnd.toISOString() });

        filteredNotes = customerFilteredNotes.filter((note) => {
          const createdMoment = note.created_at_parsed;
          if (!createdMoment || !createdMoment.isValid()) {
            return false;
          }
          return createdMoment.isBetween(targetMonthStart, targetMonthEnd, null, '[]');
        });
      } else {
        // If no specific date/month filter, but a customer is selected, show all notes for that customer
        filteredNotes = customerFilteredNotes;
        console.warn("fetchDailyNotes: No valid filterType selected, showing customer-filtered notes.");
      }

      // Calculate summary for the filtered notes
      const uniqueProfileUpdateCustomers = new Set();
      let newProfilesSubmittedCount = 0;
      let profilesSharedCount = 0;
      let futureMatchFixedCount = 0;
      let pastMatchesCount = 0; // Combines "completed" and "interested"

      filteredNotes.forEach(note => {
        if (note.profile_status) {
          uniqueProfileUpdateCustomers.add(note.customer_user_id);
          if (note.profile_status === "new_profile_submitted") {
            newProfilesSubmittedCount++;
          }
          if (note.profile_status === "profiles_shared") {
            profilesSharedCount++;
          }
        }
        if (note.future_match_status === "future_fixed") {
          futureMatchFixedCount++;
        }
        if (note.past_match_status === "completed" || note.past_match_status === "interested") {
          pastMatchesCount++;
        }
      });

      const summaryData = {
        totalFollowUps: filteredNotes.length,
        totalCalls: filteredNotes.filter((note) => note.call_status).length,
        totalPayments: filteredNotes.reduce((sum, note) => sum + (note.payment_amount || 0), 0),
        profileUpdates: uniqueProfileUpdateCustomers.size, // Count unique customers with profile updates
        newProfilesSubmitted: newProfilesSubmittedCount,
        profilesShared: profilesSharedCount,
        futureMatchFixed: futureMatchFixedCount,
        pastMatches: pastMatchesCount,
      };
      console.log("fetchDailyNotes: Summary Data:", summaryData);
      setSummary(summaryData);

      filteredNotes.sort((a, b) => b.created_at_parsed.valueOf() - a.created_at_parsed.valueOf());
      console.log("fetchDailyNotes: Filtered and sorted notes:", filteredNotes);
      setDailyNotes(filteredNotes);

      if (filteredNotes.length === 0) {
        toast.info(`No activities found for your selected ${filterType === 'daily' ? 'day' : 'month'}${selectedCustomerId !== "all-customers" ? ` for customer ${selectedCustomerId}` : ''}.`, { duration: 5000 });
      }
    } catch (err) {
      console.error("Fetch Notes Error Details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: err
      });
      let errorMessage = err.message || "Failed to load activities.";
      if (err.response?.status === 400 && err.response?.data) {
        errorMessage = `API Error: ${JSON.stringify(err.response.data)}`;
      } else if (err.response) {
        errorMessage = `Server Error (${err.response.status}): ${err.response.statusText}`;
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your network or server.";
      }
      setNotesError(errorMessage);
      toast.error(errorMessage, { duration: 7000 });
      setDailyNotes([]);
    } finally {
      setLoadingNotes(false);
      console.log("fetchDailyNotes finished: loadingNotes set to false.");
    }
  }, [currentEmployeeId, filterType, selectedDate, selectedMonth, selectedCustomerId, parseDateWithTimezone]);

  useEffect(() => {
    console.log("useEffect: Triggering fetchDailyNotes due to dependency change.");
    fetchDailyNotes();
  }, [fetchDailyNotes]);

  const handleMonthChange = (value) => {
    console.log("handleMonthChange: Setting selectedMonth to", value);
    setSelectedMonth(value);
    setFilterType("monthly");
  };

  const handleCustomerChange = (value) => {
    console.log("handleCustomerChange: Setting selectedCustomerId to", value);
    setSelectedCustomerId(value);
    // When customer is selected, it's a specific report, so keep the current date/month filter
    // If no date/month is selected, it will default to showing all for that customer in fetchDailyNotes
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setFilterType(""); // Clear filter type when date is cleared
  };

  const clearMonthFilter = () => {
    setSelectedMonth("");
    setFilterType(""); // Clear filter type when month is cleared
  };

  const clearCustomerFilter = () => {
    setSelectedCustomerId("all-customers"); // Reset to "all-customers"
  };

  const generateMonthOptions = () => {
    const options = [];
    const today = moment().tz("Asia/Kolkata");
    for (let i = 0; i < 12; i++) {
      const date = today.clone().subtract(i, 'months').startOf('month');
      const value = date.format("YYYY-MM");
      const label = date.format("MMMM YYYY");
      options.push(<SelectItem key={value} value={value}>{label}</SelectItem>);
    }
    return options;
  };

  const getReportTitle = () => {
    let title = "Your Work Report";
    let datePart = "";
    let customerPart = "";

    if (filterType === "daily" && selectedDate) {
      datePart = `Activities for ${moment(selectedDate).format("dddd, MMMM Do, YYYY")}`;
    } else if (filterType === "monthly" && selectedMonth) {
      datePart = `Activities for ${moment(selectedMonth, "YYYY-MM").format("MMMM YYYY")}`;
    } else if (filterType === "all_current_month") {
      datePart = `All Activities for ${moment().tz("Asia/Kolkata").format("MMMM YYYY")}`;
    }

    if (selectedCustomerId && selectedCustomerId !== "all-customers") {
      const customerName = availableCustomers.find(c => c.id === selectedCustomerId)?.name;
      if (customerName) {
        customerPart = ` for ${customerName} (${selectedCustomerId})`;
      } else {
        customerPart = ` for Customer ID: ${selectedCustomerId}`;
      }
    }

    if (datePart && customerPart) {
      title = `${datePart}${customerPart}`;
    } else if (datePart) {
      title = datePart;
    } else if (customerPart) {
      title = `All Activities${customerPart}`;
    }
    return title;
  };

  const chartData = {
    labels: [
      'Total Follow-Ups',
      'Calls Made',
      // Removed 'Payments Collected' from chart labels
      'Profile Updates (Customers)',
      'New Profiles Submitted',
      'Profiles Shared',
      'Future Match Dates Fixed',
      'PM (Completed/Interested)'
    ],
    datasets: [
      {
        label: 'Count',
        data: [
          summary.totalFollowUps,
          summary.totalCalls,
          // Removed summary.totalPayments from chart data
          summary.profileUpdates,
          summary.newProfilesSubmitted,
          summary.profilesShared,
          summary.futureMatchFixed,
          summary.pastMatches
        ],
        backgroundColor: [
          '#6366F1', '#10B981', '#8B5CF6', // Indigo, Green, Purple (adjusted colors due to removal)
          '#3B82F6', '#06B6D4', '#EF4444', '#EC4899' // Blue, Cyan, Red, Pink
        ],
        borderColor: [
          '#4F46E5', '#059669', '#7C3AED',
          '#2563EB', '#0891B2', '#DC2626', '#E11D74'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(107, 114, 128)' // gray-500
        }
      },
      title: {
        display: false,
        text: 'Your Work Report Summary',
        color: 'rgb(55, 65, 81)' // gray-700
      },
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgb(107, 114, 128)' // gray-500
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgb(229, 231, 235)' // gray-200
        },
        ticks: {
          color: 'rgb(107, 114, 128)' // gray-500
        }
      },
    },
  };


  // ... (Previous imports, ErrorBoundary, state declarations, useEffect hooks, and helper functions remain unchanged)

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        <Card className="mb-6 shadow-lg rounded-xl border-none bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">My Work Report</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 text-lg">
              {getReportTitle()}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mb-6 shadow-lg rounded-xl border-none bg-white dark:bg-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl text-indigo-700 dark:text-indigo-400">
              <CalendarDays className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
              Filter Report
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
              Select a date, month, or customer to view your activities.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filter by Day */}
              <div>
                <label htmlFor="daily-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Specific Day
                </label>
                <div className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-100",
                          !selectedDate && "text-muted-foreground"
                        )}
                        id="daily-filter"
                      >
                        <CalendarDays className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date);
                            setFilterType("daily");
                            setSelectedMonth(""); // Clear month filter if date is selected
                          }
                        }}
                        initialFocus
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </PopoverContent>
                  </Popover>
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 py-0 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      onClick={clearDateFilter}
                      title="Clear Date Filter"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter by Month */}
              <div>
                <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Month
                </label>
                <div className="relative">
                  <Select value={selectedMonth} onValueChange={handleMonthChange}>
                    <SelectTrigger id="month-filter" className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-100">
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      {generateMonthOptions()}
                    </SelectContent>
                  </Select>
                  {selectedMonth && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 py-0 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      onClick={clearMonthFilter}
                      title="Clear Month Filter"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter by Customer */}
              <div>
                <label htmlFor="customer-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Customer
                </label>
                <div className="relative">
                  <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                    <SelectTrigger id="customer-filter" className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-100">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <SelectItem value="all-customers">All Customers</SelectItem>
                      {availableCustomers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCustomerId !== "all-customers" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 py-0 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      onClick={clearCustomerFilter}
                      title="Clear Customer Filter"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* All Reports for Current Month Button */}
              <div>
                <label htmlFor="current-month-all" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick View
                </label>
                <Button
                  id="current-month-all"
                  variant="outline"
                  className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-100"
                  onClick={() => {
                    setSelectedMonth(moment().tz("Asia/Kolkata").format("YYYY-MM"));
                    setFilterType("all_current_month");
                    setSelectedDate(null); // Clear daily date filter
                  }}
                >
                  <CalendarDays className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  All Reports for Current Month
                </Button>
              </div>
            </div>
            {notesError && !currentEmployeeId && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-4">{notesError}</p>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {loadingNotes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse shadow-lg rounded-xl h-32 bg-white dark:bg-gray-800"></Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-lg rounded-xl border-none transition-transform transform hover:scale-105 bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Follow-Ups</CardTitle>
                  <CalendarDays className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{summary.totalFollowUps}</div>
                </CardContent>
              </Card>
              <Card className="shadow-lg rounded-xl border-none transition-transform transform hover:scale-105 bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Calls Made</CardTitle>
                  <Phone className="h-5 w-5 text-green-500 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.totalCalls}</div>
                </CardContent>
              </Card>
              <Card className="shadow-lg rounded-xl border-none transition-transform transform hover:scale-105 bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Payments Collected</CardTitle>
                  <IndianRupee className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">₹{summary.totalPayments.toLocaleString("en-IN")}</div>
                </CardContent>
              </Card>
              <Card className="shadow-lg rounded-xl border-none transition-transform transform hover:scale-105 bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Profile Updates (Customers)</CardTitle>
                  <Users className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{summary.profileUpdates}</div>
                </CardContent>
              </Card>
            </div>

            {/* New Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-lg rounded-xl border-none transition-transform transform hover:scale-105 bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">New Profiles Submitted</CardTitle>
                  <UserPlus className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{summary.newProfilesSubmitted}</div>
                </CardContent>
              </Card>
              <Card className="shadow-lg rounded-xl border-none transition-transform transform hover:scale-105 bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Profiles Shared</CardTitle>
                  <Share2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summary.profilesShared}</div>
                </CardContent>
              </Card>
              <Card className="shadow-lg rounded-xl border-none transition-transform transform hover:scale-105 bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Future Match Dates Fixed</CardTitle>
                  <Clock className="h-5 w-5 text-teal-500 dark:text-teal-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{summary.futureMatchFixed}</div>
                </CardContent>
              </Card>
              <Card className="shadow-lg rounded-xl border-none transition-transform transform hover:scale-105 bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Past Matches (Completed/Interested)</CardTitle>
                  <CheckCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.pastMatches}</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Chart */}
        {loadingNotes ? (
          <Card className="mb-6 shadow-lg animate-pulse h-80 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800"></Card>
        ) : currentEmployeeId && (summary.totalFollowUps > 0 || summary.totalCalls > 0 || summary.profileUpdates > 0) ? (
          <Card className="mb-6 shadow-lg rounded-xl border-none bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">Activity Breakdown</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Visual overview of your activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        ) : currentEmployeeId ? (
          <Card className="mb-6 shadow-lg rounded-xl border-none bg-white dark:bg-gray-800">
            <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
              No activity data available to display chart for the selected period.
            </CardContent>
          </Card>
        ) : null}

        {/* Notes Table */}
        <Card className="shadow-lg rounded-xl border-none bg-white dark:bg-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">Activities Details</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Detailed activities for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingNotes ? (
              <div className="text-center p-8">
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-indigo-500 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">Loading activities, please wait...</span>
                </div>
              </div>
            ) : notesError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-100 p-4 rounded-md text-center">
                <h3 className="font-semibold mb-2">Error Loading Activities</h3>
                <p>{notesError}</p>
                <p className="mt-2 text-sm">Please refresh the page if the issue persists.</p>
              </div>
            ) : !currentEmployeeId ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100 p-4 rounded-md text-center">
                Please log in to view your daily activities.
              </div>
            ) : dailyNotes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100 p-4 rounded-md text-center">
                No activities found for the selected period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-700">
                      <TableHead className="w-[120px] text-gray-600 dark:text-gray-300">Time</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Customer ID</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Customer Name</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Note Type</TableHead>
                      <TableHead className="min-w-[200px] text-gray-600 dark:text-gray-300">Note Details</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Call Status</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Profile Status</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">New Profile Submitted</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Profiles Shared</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Future Match Fixed</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Past Matches</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Payment (₹)</TableHead>
                      <TableHead className="text-gray-600 dark:text-gray-300">Attachments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyNotes.map((note, index) => (
                      <TableRow key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {note.created_at_parsed ? note.created_at_parsed.format("HH:mm") : "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">{note.customer_user_id}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">{note.customer_name}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200 capitalize">{note.note_type?.replace(/_/g, " ") || "N/A"}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200 max-w-xs truncate">{note.note}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">{note.call_status_display}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">{note.profile_status_display}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">
                          {note.profile_status === "new_profile_submitted" ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">
                          {note.profile_status === "profiles_shared" ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">
                          {note.future_match_status === "future_fixed" ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">
                          {(note.past_match_status === "completed" || note.past_match_status === "interested") ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="font-semibold text-green-700 dark:text-green-300">
                          {note.payment_amount ? `₹${note.payment_amount.toLocaleString("en-IN")}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {note.image && (
                              <a href={note.image} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300" title="View Image">
                                <Image size={18} />
                              </a>
                            )}
                            {note.file_upload && (
                              <a href={note.file_upload} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300" title="View File">
                                <FileText size={18} />
                              </a>
                            )}
                            {!note.image && !note.file_upload && "N/A"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default MyWorkReport;