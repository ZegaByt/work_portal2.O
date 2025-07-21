import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, FileText, Image, Download, RefreshCw, Info } from "lucide-react";
import { getData } from "../../../store/httpService";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { parse, startOfMonth, endOfMonth, format, isValid, startOfDay, endOfDay, isToday } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Import jsPDF and autoTable via CDN in the browser
const loadJsPDF = () => {
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  script.async = true;
  document.body.appendChild(script);
  return script;
};

const loadAutoTable = () => {
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
  script.async = true;
  document.body.appendChild(script);
  return script;
};

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
  return ReactDOM.createPortal(children, document.body);
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
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-6 mb-6 border border-gray-200/50 max-w-4xl mx-auto">
          <p className="text-red-600 font-semibold text-lg">An unexpected error occurred:</p>
          <p className="text-red-500 mt-2">{this.state.error}</p>
          <p className="text-gray-500 text-sm mt-4">Please refresh the page or contact support if the issue persists.</p>
          {this.state.errorInfo && (
            <details className="mt-4 text-sm text-gray-600">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 p-2 bg-gray-50/90 rounded-md overflow-auto max-h-60">{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const EmployeeLeadFollowUps = () => {
  const [followUpNotes, setFollowUpNotes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(""); // Customer filter
  const [paymentStatus, setPaymentStatus] = useState("any"); // Payment status filter
  const [callStatus, setCallStatus] = useState("any"); // Call status filter
  const [showTodayOnly, setShowTodayOnly] = useState(false); // Today's notes filter
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [notesError, setNotesError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [uniqueCustomers, setUniqueCustomers] = useState([]); // Unique customers for dropdown
  const [jsPDFLoaded, setJsPDFLoaded] = useState(false);
  const [autoTableLoaded, setAutoTableLoaded] = useState(false);

  // Toggle for mock data
  const USE_MOCK_DATA = false;

  const BASE_FOLLOWUP_URL = "/followup/employee/";
  const BASE_EMPLOYEE_URL = "/employees/";

  // Debounce filter inputs
  const debouncedSelectedEmployeeId = useDebounce(selectedEmployeeId, 500);
  const debouncedSelectedCustomer = useDebounce(selectedCustomer, 500);
  const debouncedPaymentStatus = useDebounce(paymentStatus, 500);
  const debouncedCallStatus = useDebounce(callStatus, 500);
  const debouncedShowTodayOnly = useDebounce(showTodayOnly, 500);
  const debouncedSelectedMonth = useDebounce(selectedMonth, 500);
  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);

  // Load jsPDF and autoTable
  useEffect(() => {
    const jsPDFScript = loadJsPDF();
    const autoTableScript = loadAutoTable();

    jsPDFScript.onload = () => setJsPDFLoaded(true);
    autoTableScript.onload = () => setAutoTableLoaded(true);

    return () => {
      document.body.removeChild(jsPDFScript);
      document.body.removeChild(autoTableScript);
    };
  }, []);

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

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        setNotesError(null);
        const token = Cookies.get("accessToken");
        if (!token) {
          throw new Error("No authentication token. Please log in.");
        }

        const response = await getData(BASE_EMPLOYEE_URL)

        let employeeList = [];
        if (Array.isArray(response.data)) {
          employeeList = response.data;
        } else if (Array.isArray(response.data?.results)) {
          employeeList = response.data.results;
        } else {
          console.warn("Unexpected employees response structure:", response.data);
          throw new Error("Invalid employees data structure received from API.");
        }

        setEmployees(employeeList);
      } catch (err) {
        console.error("Fetch Employees Error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setNotesError(err.message || "Failed to load employees. Network or server error.");
        toast.error(err.message || "Failed to load employees.", { duration: 5000 });
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (userId) {
      fetchEmployees();
    }
  }, [userId]);

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
    if (status && status !== "null") return status.replace(/_/g, ' ');
    if (otherNote && otherNote !== "N/A") return otherNote;
    if (note && note !== "N/A") return note;
    return "N/A";
  };

  // Calculate call attempts metrics
  const calculateCallMetrics = (notes) => {
    const totalAttempts = notes.filter(note => note.call_status).length;
    const statusBreakdown = notes.reduce((acc, note) => {
      if (note.call_status) {
        const displayStatus = getStatusDisplay(note.call_status, note.call_status_note, note.call_status_other_note);
        acc[displayStatus] = (acc[displayStatus] || 0) + 1;
      }
      return acc;
    }, {});
    return { totalAttempts, statusBreakdown };
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!jsPDFLoaded || !autoTableLoaded || !window.jspdf) {
      toast.error("PDF generation libraries not loaded. Please try again.", { duration: 5000 });
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Employee Follow-Up Notes Report", 14, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), "MMMM dd, yyyy HH:mm")}`, 14, 28);
    doc.text("Detailed insights into employee customer interactions.", 14, 34);

    // Filters Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Applied Filters", 14, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const filters = [
      `Employee: ${selectedEmployeeId ? (employees.find(e => e.user_id === selectedEmployeeId)?.full_name || selectedEmployeeId) : "None"}`,
      `Customer: ${selectedCustomer ? (uniqueCustomers.find(c => c.customer_user_id === selectedCustomer)?.customer_name || selectedCustomer) : "Any"}`,
      `Payment Status: ${paymentStatus === "any" ? "Any" : paymentStatus === "paid" ? "Paid" : "Unpaid"}`,
      `Call Status: ${callStatus === "any" ? "Any" : getStatusDisplay(callStatus, null, null)}`,
      `Month: ${format(selectedMonth, "MMMM yyyy")}`,
      `Date Range: ${startDate ? format(startDate, "PPP") : "None"} to ${endDate ? format(endDate, "PPP") : "None"}`,
      `Today's Notes Only: ${showTodayOnly ? "Yes" : "No"}`
    ];

    let y = 50;
    filters.forEach(filter => {
      doc.text(`• ${filter}`, 20, y);
      y += 6;
    });

    // Table
    const headers = [
      "Date & Time",
      "Customer ID",
      "Customer Name",
      "Note Type",
      "Note Details",
      "Call Status",
      "Profile Status",
      "Future Match",
      "Communication",
      "Past Match",
      "Match Process",
      "Marriage Progress",
      "Marriage Outcome",
      "Profile Closed",
      "Payment (₹)",
      "Payment Note",
      "Attachments"
    ];

    const rows = followUpNotes.map(note => [
      format(note.created_at_parsed || new Date(), "MMM dd, yyyy HH:mm"),
      note.customer_user_id,
      note.customer_name,
      note.note_type?.replace(/_/g, ' ') || 'N/A',
      note.note,
      note.call_status_display,
      note.profile_status_display,
      note.future_match_status_display,
      note.communication_status_display,
      note.past_match_status_display,
      note.match_process_status_display,
      note.marriage_progress_status_display,
      note.marriage_outcome_status_display,
      note.profile_closed_status_display,
      note.payment_amount ? `₹${note.payment_amount.toLocaleString('en-IN')}` : "N/A",
      note.payment_note,
      [note.image, note.file_upload].filter(Boolean).join(", ") || "N/A"
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
        minCellHeight: 8
      },
      headStyles: {
        fillColor: [79, 70, 229], // Indigo-600
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Date & Time
        1: { cellWidth: 15 }, // Customer ID
        2: { cellWidth: 20 }, // Customer Name
        3: { cellWidth: 20 }, // Note Type
        4: { cellWidth: 30 }, // Note Details
        5: { cellWidth: 20 }, // Call Status
        6: { cellWidth: 20 }, // Profile Status
        7: { cellWidth: 20 }, // Future Match
        8: { cellWidth: 20 }, // Communication
        9: { cellWidth: 20 }, // Past Match
        10: { cellWidth: 20 }, // Match Process
        11: { cellWidth: 20 }, // Marriage Progress
        12: { cellWidth: 20 }, // Marriage Outcome
        13: { cellWidth: 20 }, // Profile Closed
        14: { cellWidth: 15 }, // Payment (₹)
        15: { cellWidth: 20 }, // Payment Note
        16: { cellWidth: 25 } // Attachments
      },
      margin: { top: 10, left: 14, right: 14 }
    });

    doc.save(`follow_up_notes_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF report generated successfully!", { duration: 3000 });
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedEmployeeId("");
    setSelectedCustomer("");
    setPaymentStatus("any");
    setCallStatus("any");
    setShowTodayOnly(false);
    setSelectedMonth(new Date());
    setStartDate(null);
    setEndDate(null);
    toast.info("Filters reset successfully!", { duration: 3000 });
  };

  // Fetch follow-up notes
  const fetchFollowUpNotes = useCallback(async () => {
    if (!debouncedSelectedEmployeeId) {
      setFollowUpNotes([]);
      setUniqueCustomers([]);
      setLoadingNotes(false);
      return;
    }

    try {
      setLoadingNotes(true);
      setNotesError(null);
      const token = Cookies.get("accessToken");
      if (!token) {
        throw new Error("No authentication token. Please log in.");
      }

      let notes = [];
      if (USE_MOCK_DATA) {
        notes = [
          
        ];
        notes = notes.filter(note => note.note_created_by_employee_user_id === debouncedSelectedEmployeeId);
      } else {
        const response = await getData(`${BASE_FOLLOWUP_URL}${debouncedSelectedEmployeeId}/`)

        if (Array.isArray(response.data?.results)) {
          notes = response.data.results;
        } else if (Array.isArray(response.data)) {
          notes = response.data;
        } else {
          console.warn("Unexpected notes response structure:", response.data);
          throw new Error("Invalid notes data structure received from API.");
        }
      }

      const processedNotes = notes.map((note) => ({
        ...note,
        customer_user_id: note.customer_user_id || "N/A",
        customer_name: note.customer_name || "N/A",
        note: note.note || "No general note provided.",
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

      // Extract unique customers
      const customers = Array.from(new Set(processedNotes.map(note => note.customer_user_id)))
        .map(id => {
          const note = processedNotes.find(n => n.customer_user_id === id);
          return { customer_user_id: id, customer_name: note.customer_name };
        })
        .sort((a, b) => a.customer_name.localeCompare(b.customer_name));
      setUniqueCustomers(customers);

      const monthStart = startOfMonth(debouncedSelectedMonth);
      const monthEnd = endOfMonth(debouncedSelectedMonth);
      const filterStartDate = debouncedStartDate ? startOfDay(debouncedStartDate) : null;
      const filterEndDate = debouncedEndDate ? endOfDay(debouncedEndDate) : null;

      const filteredNotes = processedNotes.filter((note) => {
        const createdDate = note.created_at_parsed;
        if (!createdDate || isNaN(createdDate.getTime())) {
          console.warn("Skipping note due to invalid or unparsable date:", note.created_at || note.date, note);
          return false;
        }

        const inMonth = createdDate >= monthStart && createdDate <= monthEnd;
        const inDateRange = (!filterStartDate || createdDate >= filterStartDate) &&
                            (!filterEndDate || createdDate <= filterEndDate);
        const matchesCustomer = !debouncedSelectedCustomer || note.customer_user_id === debouncedSelectedCustomer;
        const matchesPayment = debouncedPaymentStatus === "any" ||
                              (debouncedPaymentStatus === "paid" && note.payment_amount) ||
                              (debouncedPaymentStatus === "unpaid" && !note.payment_amount);
        const matchesCallStatus = debouncedCallStatus === "any" ||
                                 note.call_status === debouncedCallStatus;
        const matchesToday = !debouncedShowTodayOnly || isToday(createdDate);

        return inMonth && inDateRange && matchesCustomer && matchesPayment && matchesCallStatus && matchesToday;
      });

      filteredNotes.sort((a, b) => b.created_at_parsed.getTime() - a.created_at_parsed.getTime());

      setFollowUpNotes(filteredNotes);

      if (filteredNotes.length === 0) {
        toast.info("No follow-up notes found for the selected filters.", { duration: 5000 });
        if (processedNotes.length > 0 && filteredNotes.length === 0) {
          toast.warning("Some notes might be outside the selected filters or have invalid data.", { duration: 7000 });
        }
      }
    } catch (err) {
      console.error("Fetch Notes Error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      let errorMessage = err.message || "Failed to load follow-up notes.";
      if (err.response?.status === 400 && err.response?.data) {
        errorMessage = `API Error: ${JSON.stringify(err.response.data)}`;
      } else if (err.response) {
        errorMessage = `Server Error (${err.response.status}): ${err.response.statusText}`;
      }
      setNotesError(errorMessage);
      toast.error(errorMessage, { duration: 7000 });
      setFollowUpNotes([]);
      setUniqueCustomers([]);
    } finally {
      setLoadingNotes(false);
    }
  }, [
    debouncedSelectedEmployeeId,
    debouncedSelectedCustomer,
    debouncedPaymentStatus,
    debouncedCallStatus,
    debouncedShowTodayOnly,
    debouncedSelectedMonth,
    debouncedStartDate,
    debouncedEndDate
  ]);

  useEffect(() => {
    fetchFollowUpNotes();
  }, [fetchFollowUpNotes]);

  // Fallback UI for initial loading/error states
  if (!userId && !loadingEmployees && notesError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 shadow-2xl max-w-md text-center">
          <p className="text-red-600 font-semibold text-lg mb-2">Authentication Error</p>
          <p className="text-red-500">{notesError}</p>
          <p className="text-gray-500 text-sm mt-4">Please log in again or contact support.</p>
        </div>
      </div>
    );
  }

  // Calculate metrics for display
  const { totalAttempts, statusBreakdown } = calculateCallMetrics(followUpNotes);

  // Unique call statuses for dropdown
  const uniqueCallStatuses = Array.from(new Set(followUpNotes.map(note => note.call_status).filter(Boolean)))
    .map(status => ({
      value: status,
      label: getStatusDisplay(status, null, null)
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 font-inter relative overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Employee Follow-Up Notes</h1>
              <p className="text-gray-600 text-lg mt-1">
                Detailed insights into employee customer interactions. Today is{" "}
                <span className="font-semibold">{format(new Date(), "EEEE, MMMM do, yyyy")}</span>.
              </p>
            </div>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={followUpNotes.length === 0 || !jsPDFLoaded || !autoTableLoaded}
            >
              <Download className="h-5 w-5" />
              Export to PDF
            </button>
          </div>

          {/* Metrics Card */}
          {selectedEmployeeId && (
            <Card className="mb-6 bg-white/95 backdrop-blur-md shadow-2xl border-none rounded-2xl">
              <CardHeader className="border-b border-gray-100/50 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-indigo-700">
                  <Info className="h-6 w-6 text-indigo-500" />
                  Employee Performance Metrics
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Summary of call attempts for {employees.find(e => e.user_id === selectedEmployeeId)?.full_name || selectedEmployeeId}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-indigo-50/50 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-gray-800">Total Call Attempts</p>
                    <p className="text-2xl font-bold text-indigo-600">{totalAttempts}</p>
                  </div>
                  <div className="bg-indigo-50/50 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-gray-800">Call Status Breakdown</p>
                    {Object.entries(statusBreakdown).length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {Object.entries(statusBreakdown).map(([status, count]) => (
                          <li key={status} className="text-gray-700">
                            {status}: <span className="font-semibold">{count}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 mt-2">No call attempts recorded</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6 bg-white/95 backdrop-blur-md shadow-2xl border-none rounded-2xl">
            <CardHeader className="border-b border-gray-100/50 pb-4 flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl text-indigo-700">
                  <CalendarDays className="h-6 w-6 text-indigo-500" />
                  Filter Notes
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Refine your view by selecting filters below.
                </CardDescription>
              </div>
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                <RefreshCw className="h-5 w-5" />
                Reset Filters
              </button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
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
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto bg-white/95 backdrop-blur-sm border-gray-200 rounded-lg shadow-lg">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                <Select onValueChange={setPaymentStatus} value={paymentStatus}>
                  <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-gray-200 rounded-lg shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition-all duration-300">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-gray-200 rounded-lg shadow-lg">
                    <SelectItem value="any" className="hover:bg-indigo-50 transition-colors">
                      Any
                    </SelectItem>
                    <SelectItem value="paid" className="hover:bg-indigo-50 transition-colors">
                      Paid
                    </SelectItem>
                    <SelectItem value="unpaid" className="hover:bg-indigo-50 transition-colors">
                      Unpaid
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Call Status</label>
                <Select onValueChange={setCallStatus} value={callStatus}>
                  <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-gray-200 rounded-lg shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition-all duration-300">
                    <SelectValue placeholder="Select call status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto bg-white/95 backdrop-blur-sm border-gray-200 rounded-lg shadow-lg">
                    <SelectItem value="any" className="hover:bg-indigo-50 transition-colors">
                      Any
                    </SelectItem>
                    {uniqueCallStatuses.map((status) => (
                      <SelectItem
                        key={status.value}
                        value={status.value}
                        className="hover:bg-indigo-50 transition-colors"
                      >
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Month</label>
                <DatePicker
                  selected={selectedMonth}
                  onChange={(date) => setSelectedMonth(date)}
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker
                  className="w-full p-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 text-gray-900 shadow-sm"
                  popperClassName="react-datepicker-popper"
                  popperContainer={BodyPortal}
                  popperPlacement="bottom-start"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showTodayOnly"
                  checked={showTodayOnly}
                  onChange={(e) => setShowTodayOnly(e.target.checked)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-400 border-gray-200 rounded"
                />
                <label htmlFor="showTodayOnly" className="text-sm font-semibold text-gray-700">
                  Show Today's Notes Only
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-none rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-100/50 pb-4 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-xl text-gray-800">Follow-Up Notes Overview</CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Notes for <span className="font-semibold">{selectedEmployeeId || "selected employee"}</span> in{" "}
                <span className="font-semibold">{format(selectedMonth, "MMMM yyyy")}</span>
                {startDate && endDate && (
                  <> from <span className="font-semibold">{format(startDate, "PPP")}</span> to <span className="font-semibold">{format(endDate, "PPP")}</span></>
                )}
                {selectedCustomer && (
                  <> for customer <span className="font-semibold">{uniqueCustomers.find(c => c.customer_user_id === selectedCustomer)?.customer_name || selectedCustomer}</span></>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingNotes || loadingEmployees ? (
                <div className="grid grid-cols-1 gap-4 p-6">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-md animate-pulse">
                      <div className="flex flex-col gap-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notesError ? (
                <div className="h-64 flex flex-col items-center justify-center text-red-600 text-center p-4">
                  <p className="font-semibold text-lg mb-2">Error Loading Notes</p>
                  <p>{notesError}</p>
                  <p className="text-sm text-gray-500 mt-2">Try selecting a different employee or refresh the page.</p>
                </div>
              ) : !selectedEmployeeId ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>Please select an employee from the dropdown above to view their notes.</p>
                </div>
              ) : followUpNotes.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No follow-up notes found for the selected filters.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Note Type</TableHead>
                      <TableHead>Note Details</TableHead>
                      <TableHead>Call Status</TableHead>
                      <TableHead>Profile Status</TableHead>
                      <TableHead>Future Match</TableHead>
                      <TableHead>Communication</TableHead>
                      <TableHead>Past Match</TableHead>
                      <TableHead>Match Process</TableHead>
                      <TableHead>Marriage Progress</TableHead>
                      <TableHead>Marriage Outcome</TableHead>
                      <TableHead>Profile Closed</TableHead>
                      <TableHead>Payment (₹)</TableHead>
                      <TableHead>Payment Note</TableHead>
                      <TableHead>Attachments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followUpNotes.map((note, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-indigo-50/30 transition-all duration-300 transform-gpu hover:scale-[1.01] cursor-pointer"
                        style={{ animationDelay: `${index * 0.1}s`, animation: 'rowEnter 0.5s ease-out forwards' }}
                      >
                        <TableCell className="font-medium text-gray-900">
                          {format(note.created_at_parsed || new Date(), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-gray-700">{note.customer_user_id}</TableCell>
                        <TableCell className="text-gray-700">{note.customer_name}</TableCell>
                        <TableCell className="text-gray-700 capitalize">{note.note_type?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                        <TableCell className="text-gray-700 max-w-xs truncate">{note.note}</TableCell>
                        <TableCell className="text-gray-700">{note.call_status_display}</TableCell>
                        <TableCell className="text-gray-700">{note.profile_status_display}</TableCell>
                        <TableCell className="text-gray-700">{note.future_match_status_display}</TableCell>
                        <TableCell className="text-gray-700">{note.communication_status_display}</TableCell>
                        <TableCell className="text-gray-700">{note.past_match_status_display}</TableCell>
                        <TableCell className="text-gray-700">{note.match_process_status_display}</TableCell>
                        <TableCell className="text-gray-700">{note.marriage_progress_status_display}</TableCell>
                        <TableCell className="text-gray-700">{note.marriage_outcome_status_display}</TableCell>
                        <TableCell className="text-gray-700">{note.profile_closed_status_display}</TableCell>
                        <TableCell className="font-semibold text-green-700">
                          {note.payment_amount ? `₹${note.payment_amount.toLocaleString('en-IN')}` : "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-700 max-w-[150px] truncate">{note.payment_note}</TableCell>
                        <TableCell>
                          <div className="flex gap-3">
                            {note.image && (
                              <a
                                href={note.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                                title="View Image"
                              >
                                <Image size={18} />
                              </a>
                            )}
                            {note.file_upload && (
                              <a
                                href={note.file_upload}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                                title="View File"
                              >
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Internal Styles */}
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
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
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

export default EmployeeLeadFollowUps;