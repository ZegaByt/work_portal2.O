import React, { useState, useEffect, useCallback, Component } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, FileText, Image, Phone, Users, IndianRupee, XCircle, UserPlus, Share2, Clock, CheckCircle, Download, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { getData } from "../../../store/httpService";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, isValid, parse, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';
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
import ReactDOM from "react-dom";
import jsPDF from 'jspdf'; // New import
import 'jspdf-autotable'; // New import for autoTable

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Custom Popper Container to append calendar to body
const BodyPortal = ({ children }) => {
  return typeof document !== 'undefined' ? ReactDOM.createPortal(children, document.body) : null;
};

// Error Boundary Component
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

const MyEmpDailyWorkReport = () => {
  const [dailyNotes, setDailyNotes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [notesError, setNotesError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [filterType, setFilterType] = useState("monthly");
  const [selectedCustomer, setSelectedCustomer] = useState("all-customers");
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [uniqueCustomers, setUniqueCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false); // New state for export loading
  const itemsPerPage = 20;

  const [summary, setSummary] = useState({
    totalFollowUps: 0,
    totalCalls: 0,
    totalPayments: 0,
    profileUpdates: 0,
    newProfilesSubmitted: 0,
    profilesShared: 0,
    futureMatchFixed: 0,
    pastMatches: 0,
  });

  const USE_MOCK_DATA = false;
  const BASE_FOLLOWUP_URL = "/followup/employee/";
  const { isAuthenticated, logout, user } = useAuth();
  const ADMIN_USER_ID = user?.id || 'N/A';
  const ADMIN_API_ENDPOINT = `/admin/${ADMIN_USER_ID}/`;

  // Debounce filter inputs
  const debouncedSelectedEmployeeId = useDebounce(selectedEmployeeId, 300);
  const debouncedSelectedCustomer = useDebounce(selectedCustomer, 300);
  const debouncedShowTodayOnly = useDebounce(showTodayOnly, 300);
  const debouncedSelectedDate = useDebounce(selectedDate, 300);
  const debouncedSelectedMonth = useDebounce(selectedMonth, 300);
  const debouncedFilterType = useDebounce(filterType, 300);
  const debouncedStartDate = useDebounce(startDate, 300);
  const debouncedEndDate = useDebounce(endDate, 300);

  // Parse user ID from cookie
  useEffect(() => {
    try {
      const userCookie = Cookies.get("user");
      if (!userCookie) {
        setNotesError("Please log in. User session not found.");
        setLoadingEmployees(false);
        return;
      }
      const parsedUser = JSON.parse(userCookie);
      if (parsedUser.id) {
        setUserId(parsedUser.id);
      } else {
        setNotesError("Invalid user session. User ID not found in cookie.");
        setLoadingEmployees(false);
      }
    } catch (error) {
      console.error("Cookie Parse Error:", error);
      setNotesError("Failed to load user session. Please clear cookies and log in again.");
      setLoadingEmployees(false);
    }
  }, []);

  // Fetch admin's assigned employees
  useEffect(() => {
    const fetchAdminAndEmployees = async () => {
      try {
        setLoadingEmployees(true);
        setNotesError(null);
        const token = Cookies.get("accessToken");
        if (!token) {
          throw new Error("No authentication token. Please log in.");
        }
        const response = await getData(ADMIN_API_ENDPOINT);
        if (response && response.data && Array.isArray(response.data.assigned_employees)) {
          setEmployees(response.data.assigned_employees);
          toast.success("Assigned employees loaded successfully!", { duration: 3000 });
        } else {
          console.warn("Unexpected employees response structure:", response.data);
          throw new Error("Invalid employees data structure received from API.");
        }
      } catch (err) {
        console.error("Fetch Employees Error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setNotesError(err.message || "Failed to load assigned employees. Network or server error.");
        toast.error(err.message || "Failed to load assigned employees.", { duration: 5000 });
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (userId) {
      fetchAdminAndEmployees();
    }
  }, [userId, ADMIN_API_ENDPOINT]);

  // Parse ISO date with offset
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const formats = [
      "yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXX",
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
      "yyyy-MM-dd'T'HH:mm:ssXXX",
      "yyyy-MM-dd HH:mm:ss",
      "dd/MM/yyyy, HH:mm:ss",
      "dd-MM-yyyy HH:mm:ss",
      "yyyy-MM-dd",
    ];
    for (const fmt of formats) {
      try {
        const parsed = parse(dateStr, fmt, new Date());
        if (isValid(parsed)) {
          return parsed;
        }
      } catch (err) {}
    }
    console.warn(`Failed to parse date after trying all formats: ${dateStr}`);
    return null;
  };

  // Helper to get display value for status fields
  const getStatusDisplay = (status, note, otherNote) => {
    if (status && status !== "null") return status.replace(/_/g, " ");
    if (otherNote && otherNote !== "N/A") return otherNote;
    if (note && note !== "N/A") return note;
    return "N/A";
  };

  // New Export to PDF function
  const exportToPDF = async () => {
    if (!dailyNotes.length) {
      toast.error("No data available to export.", { duration: 5000 });
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Employee Daily Work Report", 14, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "MMMM dd, yyyy HH:mm")}`, 14, 28);
      doc.text(`Employee: ${employees.find((e) => e.user_id === selectedEmployeeId)?.full_name || selectedEmployeeId || "N/A"}`, 14, 34);

      // Filters Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Applied Filters", 14, 44);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const filters = [
        `Customer: ${selectedCustomer === "all-customers" ? "Any" : (uniqueCustomers.find((c) => c.customer_user_id === selectedCustomer)?.customer_name || selectedCustomer)}`,
        `Date Filter: ${filterType === "daily" && selectedDate ? `Daily (${format(selectedDate, "PPP")})` : filterType === "monthly" ? `Monthly (${format(parse(selectedMonth, "yyyy-MM", new Date()), "MMMM yyyy")})` : filterType === "range" && startDate && endDate ? `Date Range (${format(startDate, "PPP")} to ${format(endDate, "PPP")})` : "All Time"}`,
        `Today's Notes Only: ${showTodayOnly ? "Yes" : "No"}`,
      ];

      let y = 50;
      filters.forEach((filter) => {
        doc.text(`• ${filter}`, 20, y);
        y += 6;
      });

      // Summary Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Summary Statistics", 14, y + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      y += 16;
      const summaries = [
        `Total Follow-Ups: ${summary.totalFollowUps}`,
        `Total Calls: ${summary.totalCalls}`,
        `Payments Collected: ₹${summary.totalPayments.toLocaleString("en-IN")}`,
        `Profile Updates: ${summary.profileUpdates}`,
        `New Profiles Submitted: ${summary.newProfilesSubmitted}`,
        `Profiles Shared: ${summary.profilesShared}`,
        `Future Match Dates Fixed: ${summary.futureMatchFixed}`,
        `Past Matches (Completed/Interested): ${summary.pastMatches}`,
      ];
      summaries.forEach((summaryText) => {
        doc.text(`• ${summaryText}`, 20, y);
        y += 6;
      });

      // Table
      const headers = [
        "S.No.",
        "Date & Time",
        "Customer ID",
        "Customer Name",
        "Note Type",
        "Note Details",
        "Call Status",
        "Profile Status",
        "New Profile",
        "Profiles Shared",
        "Future Match",
        "Past Matches",
        "Payment (₹)",
        "Payment Note",
        "Attachments",
      ];

      const rows = dailyNotes.map((note, index) => [
        index + 1,
        format(note.created_at_parsed || new Date(), "MMM dd, yyyy HH:mm"),
        note.customer_user_id,
        note.customer_name,
        note.note_type?.replace(/_/g, " ") || "N/A",
        note.note,
        note.call_status_display,
        note.profile_status_display,
        note.profile_status === "new_profile_submitted" ? "Yes" : "No",
        note.profile_status === "profiles_shared" ? "Yes" : "No",
        note.future_match_status === "future_fixed" ? "Yes" : "No",
        (note.past_match_status === "completed" || note.past_match_status === "interested") ? "Yes" : "No",
        note.payment_amount ? `₹${note.payment_amount.toLocaleString("en-IN")}` : "N/A",
        note.payment_note,
        [note.image, note.file_upload].filter(Boolean).join(", ") || "N/A",
      ]);

      doc.autoTable({
        startY: y + 10,
        head: [headers],
        body: rows,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          minCellHeight: 8,
        },
        headStyles: {
          fillColor: [79, 70, 229], // Indigo-600
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 7 }, // S.No.
          1: { cellWidth: 22 }, // Date & Time
          2: { cellWidth: 12 }, // Customer ID
          3: { cellWidth: 20 }, // Customer Name
          4: { cellWidth: 15 }, // Note Type
          5: { cellWidth: 45 }, // Note Details
          6: { cellWidth: 15 }, // Call Status
          7: { cellWidth: 15 }, // Profile Status
          8: { cellWidth: 10 }, // New Profile Submitted
          9: { cellWidth: 10 }, // Profiles Shared
          10: { cellWidth: 10 }, // Future Match Fixed
          11: { cellWidth: 10 }, // Past Matches
          12: { cellWidth: 12 }, // Payment
          13: { cellWidth: 20 }, // Payment Note
          14: { cellWidth: 26 }, // Attachments
        },
        margin: { top: 10, left: 14, right: 14 },
      });

      doc.save(`employee_report_${selectedEmployeeId || "all"}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF report generated successfully!", { duration: 3000 });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(`Failed to generate PDF: ${error.message || "An unknown error occurred."}`, { duration: 7000 });
    } finally {
      setIsExporting(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedEmployeeId("");
    setSelectedCustomer("all-customers");
    setShowTodayOnly(false);
    setSelectedDate(null);
    setSelectedMonth(format(new Date(), "yyyy-MM"));
    setStartDate(null);
    setEndDate(null);
    setFilterType("monthly");
    setCurrentPage(1);
    toast.info("Filters reset successfully!", { duration: 3000 });
  };

  // Fetch daily notes (unchanged)
  const fetchDailyNotes = useCallback(async () => {
    if (!debouncedSelectedEmployeeId) {
      console.log("No employee selected, skipping fetchDailyNotes.");
      setDailyNotes([]);
      setSummary({ totalFollowUps: 0, totalCalls: 0, totalPayments: 0, profileUpdates: 0, newProfilesSubmitted: 0, profilesShared: 0, futureMatchFixed: 0, pastMatches: 0 });
      setLoadingNotes(false);
      return;
    }
    console.log("fetchDailyNotes started:", { time: new Date().toISOString(), debouncedSelectedEmployeeId });
    try {
      setLoadingNotes(true);
      setNotesError(null);
      const token = Cookies.get("accessToken");
      if (!token) {
        throw new Error("No authentication token. Please log in.");
      }
      let notes = [];
      if (USE_MOCK_DATA) {
        console.log("Using mock notes");
        notes = [
          {
            "id": 18, "customer": 6, "note_type": "employee_customer", "customer_user_id": "GDM0000002", "customer_name": "Sai Kumar Thadaka", "note": "dfsd", "image": null, "file_upload": null, "is_read": false, "created_at": "2025-07-03T16:40:58.549794+05:30", "date": "2025-07-03T16:40:58.547798+05:30", "call_status": "completed_call", "call_status_note": null, "call_status_image": null, "call_status_other_note": null, "profile_status": "fees_recorded", "profile_status_note": null, "profile_status_image": null, "profile_status_other_note": null, "future_match_status": null, "future_match_status_note": null, "future_match_status_image": null, "future_match_status_other_note": null, "communication_status": null, "communication_status_note": null, "communication_status_image": null, "communication_status_other_note": null, "past_match_status": null, "past_match_status_note": null, "past_match_status_image": null, "past_match_status_other_note": null, "match_process_status": null, "match_process_status_note": null, "match_process_status_image": null, "match_process_status_other_note": null, "marriage_progress_status": null, "marriage_progress_status_note": null, "marriage_progress_status_image": null, "marriage_progress_status_other_note": null, "marriage_outcome_status": null, "marriage_outcome_status_note": null, "marriage_outcome_status_image": null, "marriage_outcome_status_other_note": null, "profile_closed_status": null, "profile_closed_status_note": null, "profile_closed_status_image": null, "profile_closed_status_other_note": null, "payment_amount": null, "payment_note": null, "payment_image": null, "status_summary": { "call_attempt": null, "profile_followup": null, "future_match": null, "communication": null, "past_match": null, "match_process": null, "marriage_progress": null, "marriage_outcome": null, "profile_closed": null }, "employee_user_id": "Emp00001", "employee_name": "Varun Ganduri", "reminder_date": null, "reminder_note": null
          },
          // ... (mock data unchanged, included for completeness)
          // Add more mock data as in the original code
        ].filter(note => note.employee_user_id === debouncedSelectedEmployeeId);
      } else {
        const response = await getData(`${BASE_FOLLOWUP_URL}${debouncedSelectedEmployeeId}/`);
        console.log("Follow-Up Notes Response:", response);
        if (Array.isArray(response.data?.results)) {
          notes = response.data.results;
        } else if (Array.isArray(response.data)) {
          notes = response.data;
        } else {
          throw new Error("Invalid notes data structure received from API.");
        }
      }
      console.log("Raw Notes:", notes);
      const processedNotes = notes.map((note) => ({
        ...note,
        customer_user_id: note.customer_user_id || "N/A",
        customer_name: note.customer_name || "N/A",
        note: note.note || "No note provided.",
        note_type: note.note_type || "N/A",
        call_status_display: getStatusDisplay(note.call_status, note.call_status_note, note.call_status_other_note),
        profile_status_display: getStatusDisplay(note.profile_status, note.profile_status_note, note.profile_status_other_note),
        future_match_status_display: getStatusDisplay(note.future_match_status, note.future_match_status_note, note.future_match_status_other_note),
        communication_status_display: getStatusDisplay(note.communication_status, note.communication_status_note, note.communication_status_other_note),
        past_match_status_display: getStatusDisplay(note.past_match_status, note.past_match_status_note, note.past_match_status_other_note),
        match_process_status_display: getStatusDisplay(note.match_process_status, note.match_process_status_note, note.match_process_status_other_note),
        marriage_progress_status_display: getStatusDisplay(note.marriage_progress_status, note.marriage_progress_status_note, note.marriage_progress_status_other_note),
        marriage_outcome_status_display: getStatusDisplay(note.marriage_outcome_status, note.marriage_outcome_status_note, note.marriage_outcome_status_other_note),
        profile_closed_status_display: getStatusDisplay(note.profile_closed_status, note.profile_closed_status_note, note.profile_closed_status_other_note),
        payment_amount: note.payment_amount ? parseFloat(note.payment_amount) : null,
        payment_note: note.payment_note || "N/A",
        created_at_parsed: parseDate(note.created_at || note.date),
      }));

      const customers = Array.from(new Set(processedNotes.map((note) => note.customer_user_id)))
        .map((id) => {
          const note = processedNotes.find((n) => n.customer_user_id === id);
          return { customer_user_id: id, customer_name: note.customer_name };
        })
        .sort((a, b) => a.customer_name.localeCompare(b.customer_name));
      setUniqueCustomers(customers);

      let filteredNotes = processedNotes;

      if (debouncedSelectedCustomer && debouncedSelectedCustomer !== "all-customers") {
        filteredNotes = filteredNotes.filter(note => note.customer_user_id === debouncedSelectedCustomer);
      }

      if (debouncedShowTodayOnly) {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        filteredNotes = filteredNotes.filter(note =>
          note.created_at_parsed && isWithinInterval(note.created_at_parsed, { start: todayStart, end: todayEnd })
        );
      } else if (debouncedFilterType === "daily" && debouncedSelectedDate) {
        const dayStart = startOfDay(debouncedSelectedDate);
        const dayEnd = endOfDay(debouncedSelectedDate);
        filteredNotes = filteredNotes.filter(note =>
          note.created_at_parsed && isWithinInterval(note.created_at_parsed, { start: dayStart, end: dayEnd })
        );
      } else if (debouncedFilterType === "monthly" && debouncedSelectedMonth) {
        const [year, month] = debouncedSelectedMonth.split('-').map(Number);
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(new Date(year, month - 1));
        filteredNotes = filteredNotes.filter(note =>
          note.created_at_parsed && isWithinInterval(note.created_at_parsed, { start: monthStart, end: monthEnd })
        );
      } else if (debouncedFilterType === "range" && debouncedStartDate && debouncedEndDate) {
        const rangeStart = startOfDay(debouncedStartDate);
        const rangeEnd = endOfDay(debouncedEndDate);
        filteredNotes = filteredNotes.filter(note =>
          note.created_at_parsed && isWithinInterval(note.created_at_parsed, { start: rangeStart, end: rangeEnd })
        );
      }

      let newProfilesSubmittedCount = 0;
      let profilesSharedCount = 0;
      let futureMatchFixedCount = 0;
      let pastMatchesCount = 0;

      filteredNotes.forEach(note => {
        if (note.profile_status === "new_profile_submitted") {
          newProfilesSubmittedCount++;
        }
        if (note.profile_status === "profiles_shared") {
          profilesSharedCount++;
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
        profileUpdates: filteredNotes.filter((note) => note.profile_status).length,
        newProfilesSubmitted: newProfilesSubmittedCount,
        profilesShared: profilesSharedCount,
        futureMatchFixed: futureMatchFixedCount,
        pastMatches: pastMatchesCount,
      };
      console.log("Summary Data:", summaryData);
      setSummary(summaryData);
      filteredNotes.sort((a, b) => b.created_at_parsed.getTime() - a.created_at_parsed.getTime());
      console.log("Filtered Notes:", filteredNotes);
      setDailyNotes(filteredNotes);
      setCurrentPage(1);
      if (filteredNotes.length === 0) {
        toast.info("No activities found for the selected filters.", { duration: 5000 });
      }
    } catch (err) {
      console.error("Fetch Notes Error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      let errorMessage = err.message || "Failed to load daily activities.";
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
    }
  }, [
    debouncedSelectedEmployeeId,
    debouncedSelectedCustomer,
    debouncedShowTodayOnly,
    debouncedSelectedDate,
    debouncedSelectedMonth,
    debouncedFilterType,
    debouncedStartDate,
    debouncedEndDate,
  ]);

  useEffect(() => {
    fetchDailyNotes();
  }, [fetchDailyNotes]);

  // Pagination logic
  const totalPages = Math.ceil(dailyNotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotes = dailyNotes.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  // Chart data (unchanged)
  const chartData = {
    labels: [
      "Follow-Ups",
      "Calls",
      "Profile Updates",
      "New Profiles Submitted",
      "Profiles Shared",
      "Future Match Fixed",
      "Past Matches"
    ],
    datasets: [
      {
        label: "Activities Count",
        data: [
          summary.totalFollowUps,
          summary.totalCalls,
          summary.profileUpdates,
          summary.newProfilesSubmitted,
          summary.profilesShared,
          summary.futureMatchFixed,
          summary.pastMatches
        ],
        backgroundColor: [
          "#6366F1",
          "#10B981",
          "#8B5CF6",
          "#3B82F6",
          "#06B6D4",
          "#EF4444",
          "#EC4899"
        ],
        borderColor: [
          "#4F46E5",
          "#059669",
          "#7C3AED",
          "#2563EB",
          "#0891B2",
          "#DC2626",
          "#E11D74"
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Activity Breakdown" },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (context.parsed.y !== null) {
              label += ': ' + context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgb(107, 114, 128)' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgb(229, 231, 235)' },
        ticks: { color: 'rgb(107, 114, 128)' },
      },
    },
  };

  // Fallback UI
  if (!userId && !loadingEmployees && notesError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-red-600 text-lg text-center bg-white p-6 rounded-lg shadow-md">
          <span className="font-semibold">Authentication Error:</span> {notesError}
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen  font-inter relative overflow-hidden p-0 sm:p-0">
        <div className="absolute inset-0 bg-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-normal text-gray-900">Employee Daily Work Report</h1>
              <p className="text-gray-600 text-lg mt-1">
                Comprehensive overview of employee activities and performance.
              </p>
            </div>
            <Button
              onClick={exportToPDF}
              disabled={isExporting || dailyNotes.length === 0}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              ) : (
                <Download className="h-5 w-5" />
              )}
              {isExporting ? "Exporting..." : "Export to PDF"}
            </Button>
          </div>

          {/* Filter Card (unchanged) */}
          {loadingEmployees || loadingNotes ? (
            <div className="bg-gray-200 animate-pulse rounded-xl shadow-lg mb-6 h-64"></div>
          ) : (
            <Card className="mb-6 shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md">
              <CardHeader className="border-b border-gray-100/50 pb-4 flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl text-indigo-700">
                    <CalendarDays className="h-6 w-6 text-indigo-500" />
                    Filter Report
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-1">
                    Refine your view by selecting filters below.
                  </CardDescription>
                </div>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <RefreshCw className="h-5 w-5" />
                  Reset Filters
                </button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Employee</label>
                  <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
                    <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-gray-200 rounded-lg shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition-all duration-300">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-white/95 backdrop-blur-sm border-gray-200 rounded-lg shadow-lg">
                      {loadingEmployees ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-indigo-500"></div>
                            Loading employees...
                          </div>
                        </SelectItem>
                      ) : employees.length === 0 ? (
                        <SelectItem value="no-employees" disabled>
                          No employees found
                        </SelectItem>
                      ) : (
                        employees.map((employee) => (
                          <SelectItem key={employee.user_id} value={employee.user_id} className="hover:bg-indigo-50 transition-colors">
                            {employee.full_name || employee.user_id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {notesError && !loadingEmployees && !selectedEmployeeId && (
                    <p className="text-red-500 text-xs mt-1">{notesError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Customer</label>
                  <Select onValueChange={setSelectedCustomer} value={selectedCustomer}>
                    <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-gray-200 rounded-lg shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition-all duration-300">
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-white/95 backdrop-blur-sm border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="all-customers" className="hover:bg-indigo-50 transition-colors">All Customers</SelectItem>
                      {uniqueCustomers.length === 0 ? (
                        <SelectItem value="no-customers" disabled>
                          No customers available
                        </SelectItem>
                      ) : (
                        uniqueCustomers.map((customer) => (
                          <SelectItem
                            key={customer.customer_user_id}
                            value={customer.customer_user_id}
                            className="hover:bg-indigo-50 transition-colors"
                          >
                            {customer.customer_name} ({customer.customer_user_id})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Filter Type</label>
                  <Select onValueChange={setFilterType} value={filterType}>
                    <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-gray-200 rounded-lg shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition-all duration-300">
                      <SelectValue placeholder="Select filter type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="monthly">By Month</SelectItem>
                      <SelectItem value="daily">By Day</SelectItem>
                      <SelectItem value="range">By Date Range</SelectItem>
                      <SelectItem value="none">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {filterType === "daily" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Day</label>
                    <div className="relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white/90 backdrop-blur-sm border-gray-200 rounded-lg shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition-all duration-300 text-gray-800",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4 text-gray-500" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-gray-100">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {selectedDate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-2 py-0 text-gray-500 hover:text-red-500"
                          onClick={() => setSelectedDate(null)}
                          title="Clear Date Filter"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {filterType === "monthly" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Month</label>
                    <DatePicker
                      selected={parse(selectedMonth, "yyyy-MM", new Date())}
                      onChange={(date) => setSelectedMonth(format(date, "yyyy-MM"))}
                      dateFormat="MMMM yyyy"
                      showMonthYearPicker
                      className="w-full p-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 text-gray-900 shadow-sm"
                      popperClassName="react-datepicker-popper"
                      popperContainer={BodyPortal}
                      popperPlacement="bottom-start"
                    />
                  </div>
                )}
                {filterType === "range" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        dateFormat="PPP"
                        placeholderText="Select start date"
                        maxDate={new Date()}
                        className="w-full p-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 text-gray-900 shadow-sm"
                        popperClassName="react-datepicker-popper"
                        popperContainer={BodyPortal}
                        popperPlacement="bottom-start"
                        isClearable
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        dateFormat="PPP"
                        placeholderText="Select end date"
                        maxDate={new Date()}
                        minDate={startDate}
                        className="w-full p-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 text-gray-900 shadow-sm"
                        popperClassName="react-datepicker-popper"
                        popperContainer={BodyPortal}
                        popperPlacement="bottom-start"
                        isClearable
                      />
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showTodayOnly"
                    checked={showTodayOnly}
                    onChange={(e) => setShowTodayOnly(e.target.checked)}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-400 border-gray-200 rounded"
                    disabled={filterType !== "none"}
                  />
                  <label htmlFor="showTodayOnly" className="text-sm font-semibold text-gray-700">
                    Show Today's Notes Only
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards (unchanged) */}
          {loadingNotes || loadingEmployees ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card className="shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md transition-transform transform hover:scale-105">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" />
                      Total Follow-Ups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-indigo-700">{summary.totalFollowUps}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md transition-transform transform hover:scale-105">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-green-500" />
                      Calls Made
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-700">{summary.totalCalls}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md transition-transform transform hover:scale-105">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <IndianRupee className="h-5 w-5 text-yellow-500" />
                      Payments Collected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-yellow-700">₹{summary.totalPayments.toLocaleString("en-IN")}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md transition-transform transform hover:scale-105">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-500" />
                      Profile Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-700">{summary.profileUpdates}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card className="shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md transition-transform transform hover:scale-105">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-purple-500" />
                      New Profiles Submitted
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-700">{summary.newProfilesSubmitted}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md transition-transform transform hover:scale-105">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-blue-500" />
                      Profiles Shared
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-700">{summary.profilesShared}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md transition-transform transform hover:scale-105">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-teal-500" />
                      Future Match Dates Fixed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-teal-700">{summary.futureMatchFixed}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md transition-transform transform hover:scale-105">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-red-500" />
                      Past Matches (Completed/Interested)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-700">{summary.pastMatches}</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Chart (unchanged) */}
          {loadingNotes || loadingEmployees ? (
            <Card className="mb-6 shadow-lg border-none rounded-xl bg-white/95 animate-pulse h-80 flex items-center justify-center"></Card>
          ) : selectedEmployeeId && (summary.totalFollowUps + summary.totalCalls + summary.totalPayments + summary.profileUpdates + summary.newProfilesSubmitted + summary.profilesShared + summary.futureMatchFixed + summary.pastMatches > 0) ? (
            <Card className="mb-6 shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Activity Breakdown</CardTitle>
                <CardDescription className="text-gray-600">
                  Visual overview of activities for {employees.find((e) => e.user_id === selectedEmployeeId)?.full_name || selectedEmployeeId}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          ) : selectedEmployeeId ? (
            <Card className="mb-6 shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md">
              <CardContent className="text-center text-gray-500 p-6">
                No activity data available to display chart for {employees.find((e) => e.user_id === selectedEmployeeId)?.full_name || selectedEmployeeId}.
              </CardContent>
            </Card>
          ) : null}

          {/* Notes Table (unchanged) */}
          <Card className="shadow-lg border-none rounded-xl bg-white/95 backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-gray-100/50 pb-4 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-xl text-gray-800">Activities Details</CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Detailed activities for <span className="font-semibold">{employees.find((e) => e.user_id === selectedEmployeeId)?.full_name || "selected employee"}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingNotes || loadingEmployees ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500 mb-3"></div>
                  <p>Loading activities, please wait...</p>
                </div>
              ) : notesError ? (
                <div className="h-64 flex flex-col items-center justify-center text-red-600 text-center p-4">
                  <p className="font-medium text-lg mb-2">Error Loading Activities</p>
                  <p>{notesError}</p>
                  <p className="text-sm text-gray-500 mt-2">Try selecting a different employee or refresh the page.</p>
                </div>
              ) : !selectedEmployeeId ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>Please select an employee to view their daily activities.</p>
                </div>
              ) : dailyNotes.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No activities found for the selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[60px] text-gray-600">S.No.</TableHead>
                        <TableHead className="w-[120px] text-gray-600">Date & Time</TableHead>
                        <TableHead className="text-gray-600">Customer ID</TableHead>
                        <TableHead className="text-gray-600">Customer Name</TableHead>
                        <TableHead className="text-gray-600">Note Type</TableHead>
                        <TableHead className="min-w-[200px] text-gray-600">Note Details</TableHead>
                        <TableHead className="text-gray-600">Call Status</TableHead>
                        <TableHead className="text-gray-600">Profile Status</TableHead>
                        <TableHead className="text-gray-600">New Profile Submitted</TableHead>
                        <TableHead className="text-gray-600">Profiles Shared</TableHead>
                        <TableHead className="text-gray-600">Future Match Fixed</TableHead>
                        <TableHead className="text-gray-600">Past Matches</TableHead>
                        <TableHead className="text-gray-600">Payment (₹)</TableHead>
                        <TableHead className="text-gray-600">Attachments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentNotes.map((note, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-indigo-50/30 transition-all duration-300 transform-gpu hover:scale-[1.01] cursor-pointer"
                          style={{ animationDelay: `${index * 0.05}s`, animation: "rowEnter 0.5s ease-out forwards" }}
                        >
                          <TableCell className="font-medium text-gray-900 whitespace-nowrap">
                            {startIndex + index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 whitespace-nowrap">
                            {format(note.created_at_parsed || new Date(), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="text-gray-700">{note.customer_user_id}</TableCell>
                          <TableCell className="text-gray-700">{note.customer_name}</TableCell>
                          <TableCell className="text-gray-700 capitalize">{note.note_type?.replace(/_/g, " ") || "N/A"}</TableCell>
                          <TableCell className="text-gray-700 max-w-xs truncate">{note.note}</TableCell>
                          <TableCell className="text-gray-700">{note.call_status_display}</TableCell>
                          <TableCell className="text-gray-700">{note.profile_status_display}</TableCell>
                          <TableCell className="text-gray-700">
                            {note.profile_status === "new_profile_submitted" ? "Yes" : "No"}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {note.profile_status === "profiles_shared" ? "Yes" : "No"}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {note.future_match_status === "future_fixed" ? "Yes" : "No"}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {(note.past_match_status === "completed" || note.past_match_status === "interested") ? "Yes" : "No"}
                          </TableCell>
                          <TableCell className="font-semibold text-green-700">
                            {note.payment_amount ? `₹${note.payment_amount.toLocaleString("en-IN")}` : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {note.image && (
                                <a href={note.image} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800" title="View Image">
                                  <Image size={18} />
                                </a>
                              )}
                              {note.file_upload && (
                                <a href={note.file_upload} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800" title="View File">
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
            {dailyNotes.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-100 bg-gray-50">
                <Button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="flex items-center gap-1 text-gray-700 hover:bg-indigo-100 hover:text-indigo-800"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="flex items-center gap-1 text-gray-700 hover:bg-indigo-100 hover:text-indigo-800"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Internal Styles (unchanged) */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          .font-inter {
            font-family: 'Inter', sans-serif;
          }
          .bg-pattern {
            background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239CA3AF' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20zM40 40H20L40 20z'/%3E%3C/g%3E%3C/svg%3E");
          }
          .animate-fadein {
            animation: fadein 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }
          @keyframes fadein {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-row-enter {
            animation: rowEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          @keyframes rowEnter {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .react-datepicker {
            font-family: 'Inter', sans-serif;
            border: none;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 0.5rem;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            z-index: 1000;
          }
          .react-datepicker-popper {
            z-index: 1000;
          }
          .react-datepicker__header {
            background: linear-gradient(to right, #4f46e5, #7c3aed);
            color: white;
            border-bottom: none;
            padding: 1rem;
            border-radius: 0.5rem 0.5rem 0 0;
          }
          .react-datepicker__current-month {
            font-weight: 600;
            font-size: 1rem;
          }
          .react-datepicker__day-name,
          .react-datepicker__day {
            color: #1f2937;
            font-weight: 500;
          }
          .react-datepicker__day:hover {
            background: #e0e7ff;
            border-radius: 0.25rem;
          }
          .react-datepicker__day--selected,
          .react-datepicker__day--keyboard-selected {
            background: #4f46e5;
            color: white;
            border-radius: 0.25rem;
          }
          .react-datepicker__day--disabled {
            color: #d1d5db;
            cursor: not-allowed;
          }
          .react-datepicker__triangle {
            display: none;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default MyEmpDailyWorkReport;