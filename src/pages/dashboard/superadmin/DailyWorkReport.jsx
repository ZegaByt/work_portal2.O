import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, FileText, Image, Phone, Users, IndianRupee } from "lucide-react";
import { getData } from "../../../store/httpService";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, isValid, parse } from "date-fns";
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

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <p className="text-red-600 font-medium text-lg">An unexpected error occurred:</p>
          <p className="text-red-500 mt-2">{this.state.error}</p>
          <p className="text-gray-500 text-sm mt-4">Please refresh the page or contact support if the issue persists.</p>
          {this.state.errorInfo && (
            <details className="mt-4 text-sm text-gray-600">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded-md overflow-auto">{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const DailyWorkReport = () => {
  const [dailyNotes, setDailyNotes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [notesError, setNotesError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [summary, setSummary] = useState({
    totalFollowUps: 0,
    totalCalls: 0,
    totalPayments: 0,
    profileUpdates: 0,
  });

  const USE_MOCK_DATA = false;
  const BASE_FOLLOWUP_URL = "/followup/employee/";

  // Parse user ID from cookie
  useEffect(() => {
    try {
      const userCookie = Cookies.get("user");
      console.log("User Cookie:", userCookie || "Missing");
      if (!userCookie) {
        setNotesError("Please log in. User session not found.");
        setLoadingEmployees(false);
        return;
      }
      const parsedUser = JSON.parse(userCookie);
      console.log("Parsed User:", parsedUser);
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
        console.log("Access Token for Employees:", token ? `Present (${token.substring(0, 10)}...)` : "Missing");
        if (!token) {
          throw new Error("No authentication token. Please log in.");
        }
        const response = await getData('/employees/')
        console.log("Employees Response:", response);
        let employeeList = [];
        if (Array.isArray(response.data)) {
          employeeList = response.data;
        } else if (Array.isArray(response.data?.results)) {
          employeeList = response.data.results;
        } else {
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

  // Parse ISO date
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
        if (isValid(parsed)) return parsed;
      } catch (err) {}
    }
    console.warn(`Failed to parse date: ${dateStr}`);
    return null;
  };

  // Get status display
  const getStatusDisplay = (status, note, otherNote) => {
    if (status && status !== "null") return status.replace(/_/g, " ");
    if (otherNote && otherNote !== "N/A") return otherNote;
    if (note && note !== "N/A") return note;
    return "N/A";
  };

  // Fetch daily notes
  const fetchDailyNotes = useCallback(async () => {
    if (!selectedEmployeeId) {
      console.log("No employee selected, skipping fetchDailyNotes.");
      setDailyNotes([]);
      setLoadingNotes(false);
      return;
    }
    console.log("fetchDailyNotes started:", { time: new Date().toISOString(), selectedEmployeeId });
    try {
      setLoadingNotes(true);
      setNotesError(null);
      const token = Cookies.get("accessToken");
      console.log("Access Token for Notes:", token ? `Present (${token.substring(0, 10)}...)` : "Missing");
      if (!token) {
        throw new Error("No authentication token. Please log in.");
      }
      let notes = [];
      if (USE_MOCK_DATA) {
        console.log("Using mock notes");
        notes = [
          
        ];
        notes = notes.filter((note) => note.note_created_by_employee_user_id === selectedEmployeeId);
      } else {
        const response = await getData(`${BASE_FOLLOWUP_URL}${selectedEmployeeId}/`)
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
      // Process notes
      const processedNotes = notes.map((note) => ({
        ...note,
        customer_user_id: note.customer_user_id || "N/A",
        customer_name: note.customer_name || "N/A",
        note: note.note || "No note provided.",
        note_type: note.note_type || "N/A",
        call_status_display: getStatusDisplay(note.call_status, note.call_status_note, note.call_status_other_note),
        profile_status_display: getStatusDisplay(note.profile_status, note.profile_status_note, note.profile_status_other_note),
        payment_amount: note.payment_amount ? parseFloat(note.payment_amount) : null,
        payment_note: note.payment_note || "N/A",
        created_at_parsed: parseDate(note.created_at || note.date),
      }));
      // Filter for today
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      console.log("Today Range:", { start: todayStart.toISOString(), end: todayEnd.toISOString() });
      const filteredNotes = processedNotes.filter((note) => {
        const createdDate = note.created_at_parsed;
        if (!createdDate || isNaN(createdDate.getTime())) {
          console.warn("Skipping note due to invalid date:", note.created_at || note.date);
          return false;
        }
        return createdDate >= todayStart && createdDate <= todayEnd;
      });
      // Calculate summary
      const summaryData = {
        totalFollowUps: filteredNotes.length,
        totalCalls: filteredNotes.filter((note) => note.call_status).length,
        totalPayments: filteredNotes.reduce((sum, note) => sum + (note.payment_amount || 0), 0),
        profileUpdates: filteredNotes.filter((note) => note.profile_status).length,
      };
      console.log("Summary Data:", summaryData);
      setSummary(summaryData);
      filteredNotes.sort((a, b) => b.created_at_parsed.getTime() - a.created_at_parsed.getTime());
      console.log("Filtered Notes:", filteredNotes);
      setDailyNotes(filteredNotes);
      if (filteredNotes.length === 0) {
        toast.info("No activities found for the selected employee today.", { duration: 5000 });
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
  }, [selectedEmployeeId]);

  useEffect(() => {
    console.log("fetchDailyNotes triggered with employeeId:", selectedEmployeeId);
    fetchDailyNotes();
  }, [fetchDailyNotes]);

  // Chart data
  const chartData = {
    labels: ["Follow-Ups", "Calls", "Profile Updates"],
    datasets: [
      {
        label: "Today's Activities",
        data: [summary.totalFollowUps, summary.totalCalls, summary.profileUpdates],
        backgroundColor: ["#4f46e5", "#10b981", "#f59e0b"],
        borderColor: ["#4338ca", "#059669", "#d97706"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Activity Breakdown" },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Count" } },
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
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-extrabold mb-2 text-gray-900">Daily Work Report</h1>
        <p className="text-gray-600 mb-6 text-lg">
          Overview of employee activities for{" "}
          <span className="font-semibold">{format(new Date(), "EEEE, MMMM do, yyyy")}</span>.
        </p>

        {/* Filter Card */}
        {loadingEmployees || loadingNotes ? (
          <div className="bg-gray-200 animate-pulse rounded-xl shadow-lg mb-6 h-32"></div>
        ) : (
          <Card className="mb-6 shadow-lg border-none rounded-xl">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-indigo-700">
                <CalendarDays className="h-6 w-6 text-indigo-500" />
                Select Employee
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Choose an employee to view their daily work report.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
                <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
                  <SelectTrigger className="w-full bg-white border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {employees.length === 0 ? (
                      <SelectItem value="no-employees" disabled>
                        No employees found
                      </SelectItem>
                    ) : (
                      employees.map((employee) => (
                        <SelectItem key={employee.user_id} value={employee.user_id}>
                          {employee.full_name || employee.user_id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {notesError && !selectedEmployeeId && (
                  <p className="text-red-500 text-xs mt-1">{notesError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {loadingNotes || loadingEmployees ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="shadow-lg border-none rounded-xl">
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
            <Card className="shadow-lg border-none rounded-xl">
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
            <Card className="shadow-lg border-none rounded-xl">
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
            <Card className="shadow-lg border-none rounded-xl">
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
        )}

        {/* Chart */}
        {loadingNotes || loadingEmployees ? (
          <Card className="mb-6 shadow-lg border-none rounded-xl">
            <div className="bg-gray-200 animate-pulse rounded-xl h-64"></div>
          </Card>
        ) : selectedEmployeeId && summary.totalFollowUps + summary.totalCalls + summary.profileUpdates > 0 ? (
          <Card className="mb-6 shadow-lg border-none rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Activity Breakdown</CardTitle>
              <CardDescription className="text-gray-600">
                Visual overview of today's activities for {selectedEmployeeId}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        ) : selectedEmployeeId ? (
          <Card className="mb-6 shadow-lg border-none rounded-xl">
            <CardContent className="text-center text-gray-500 p-6">
              No activity data available to display chart for {selectedEmployeeId}.
            </CardContent>
          </Card>
        ) : null}

        {/* Notes Table */}
        <Card className="shadow-lg border-none rounded-xl">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-xl text-gray-800">Today's Activities</CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Detailed activities for <span className="font-semibold">{selectedEmployeeId || "selected employee"}</span> today.
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
                <p>No activities found for the selected employee today.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[120px]">Time</TableHead>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Note Type</TableHead>
                      <TableHead className="min-w-[200px]">Note Details</TableHead>
                      <TableHead>Call Status</TableHead>
                      <TableHead>Profile Status</TableHead>
                      <TableHead>Payment (₹)</TableHead>
                      <TableHead>Attachments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyNotes.map((note, index) => (
                      <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-900">
                          {format(note.created_at_parsed || new Date(), "HH:mm")}
                        </TableCell>
                        <TableCell className="text-gray-700">{note.customer_user_id}</TableCell>
                        <TableCell className="text-gray-700">{note.customer_name}</TableCell>
                        <TableCell className="text-gray-700 capitalize">{note.note_type?.replace(/_/g, " ") || "N/A"}</TableCell>
                        <TableCell className="text-gray-700 max-w-xs truncate">{note.note}</TableCell>
                        <TableCell className="text-gray-700">{note.call_status_display}</TableCell>
                        <TableCell className="text-gray-700">{note.profile_status_display}</TableCell>
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
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default DailyWorkReport;