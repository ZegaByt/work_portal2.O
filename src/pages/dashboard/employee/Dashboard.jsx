import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, UserCheck, ChevronUp, TrendingUp, BadgeDollarSign, CalendarDays, User, FileText, Clock } from "lucide-react";
import { IconPower, IconHistory } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getData } from "../../../store/httpService";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { parse, startOfMonth, endOfMonth, eachDayOfInterval, format, startOfWeek, endOfWeek, startOfDay, endOfDay, differenceInMinutes, isValid } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// Lazy load BureauDashboard for non-critical tab
const BureauDashboard = lazy(() => import("./BureauDashboard"));

// Skeleton Components for loading states
const CardSkeleton = () => (
  <Card className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse">
    <div className="flex flex-col items-center justify-center text-center">
      <div className="rounded-full bg-gray-300 h-10 w-10 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-2/3 mt-1"></div>
      <div className="h-4 bg-gray-300 rounded w-1/3 mt-1"></div>
    </div>
  </Card>
);

const ChartSkeleton = () => (
  <div className="h-80 w-full bg-gray-200 rounded-lg animate-pulse flex items-center justify-center text-gray-500">
    Loading chart data...
  </div>
);

// Helper to parse dates with multiple formats for robustness
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const formats = [
    "yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXX", // Most common ISO format with microseconds and timezone
    "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",    // ISO format with milliseconds and timezone
    "yyyy-MM-dd'T'HH:mm:ssXXX",        // ISO format with timezone
    "yyyy-MM-dd'T'HH:mm:ss",           // ISO format without timezone
    "yyyy-MM-dd HH:mm:ss",             // Common database format
    "dd/MM/yyyy, HH:mm:ss",            // Indian common format
    "dd-MM-yyyy HH:mm:ss",
    "yyyy-MM-dd",                      // Date only
  ];
  for (const fmt of formats) {
    try {
      const parsed = parse(dateStr, fmt, new Date());
      if (isValid(parsed)) return parsed;
    } catch (err) {
      // Continue to try other formats if parsing fails
    }
  }
  console.warn(`Failed to parse date: ${dateStr}`);
  return null;
};

// Format date/time for display
const formatDateTime = (dateTime) => {
  if (!dateTime) return "N/A";
  try {
    return format(dateTime, "dd MMMyyyy, hh:mm:ss a");
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid Date";
  }
};

// Calculate work hours from login/logout times
const calculateWorkHours = (firstLogin, lastLogout) => {
  if (!firstLogin) return "N/A";
  // If no lastLogout, assume active till current time
  const endTime = lastLogout || new Date();
  const minutes = differenceInMinutes(endTime, firstLogin);
  if (minutes < 0) return "N/A"; // Should not happen with correct dates, but safeguard
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// Error Boundary Component to catch rendering errors in children
class ErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary Caught Error:", error, errorInfo);
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200 text-center">
          <h2 className="text-red-600 font-semibold text-xl mb-2">Oops! Something went wrong.</h2>
          <p className="text-gray-700">We're sorry, but there was an error rendering this section.</p>
          <details className="mt-4 text-sm text-gray-500">
            <summary>Error Details</summary>
            <pre className="whitespace-pre-wrap break-all text-left mt-2 p-2 bg-gray-100 rounded-md">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const Dashboard = () => {
  const [revenueData, setRevenueData] = useState({ daily: [], weekly: [], monthly: [] });
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [revenueError, setRevenueError] = useState(null);

  const [myCustomersCount, setMyCustomersCount] = useState(0);
  const [liveCustomersCount, setLiveCustomersCount] = useState(0);
  const [offlineCustomersCount, setOfflineCustomersCount] = useState(0);
  const [loadingCustomersStats, setLoadingCustomersStats] = useState(true);
  const [customerStatsError, setCustomerStatsError] = useState(null);

  const [firstLoginTime, setFirstLoginTime] = useState(null);
  const [lastLogoutTime, setLastLogoutTime] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError] = useState(null);

  const [employeeUserId, setEmployeeUserId] = useState(null);
  const [employeeName, setEmployeeName] = useState("Employee");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  const TARGET_WORK_HOURS_MINUTES = 8 * 60; // 8 hours in minutes

  // Effect for live time update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial user and profile data fetch
  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        const parsedUser = JSON.parse(userCookie);
        if (parsedUser.id) {
          setEmployeeUserId(parsedUser.id);
        } else {
          console.warn("User ID not found in cookie.");
          setRevenueError("User ID not found. Please log in again.");
          setCustomerStatsError("User ID not found. Please log in again.");
          setActivityError("User ID not found. Please log in again.");
          setLoadingCustomersStats(false);
          setLoadingActivity(false);
          setLoadingRevenue(false);
        }
      } catch (error) {
        console.error("Dashboard Error parsing user cookie:", error);
        setRevenueError("Invalid user session. Please log in.");
        setCustomerStatsError("Invalid user session. Please log in.");
        setActivityError("Invalid user session. Please log in.");
        setLoadingCustomersStats(false);
        setLoadingActivity(false);
        setLoadingRevenue(false);
      }
    } else {
      console.warn("Dashboard: No user cookie found.");
      setRevenueError("Please log in to view dashboard data.");
      setCustomerStatsError("Please log in to view dashboard data.");
      setActivityError("Please log in to view dashboard data.");
      setLoadingCustomersStats(false);
      setLoadingActivity(false);
      setLoadingRevenue(false);
    }

    const fetchEmployeeProfile = async () => {
      try {
        const token = Cookies.get("accessToken");
        if (!token) {
          toast.error("Authentication token missing. Please log in.", { duration: 3000 });
          return;
        }
        const response = await getData("/profile/", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000, // Increased timeout
        });
        if (response.data && response.data.full_name) {
          setEmployeeName(response.data.full_name);
        } else {
          console.warn("Employee name not found in profile data or data format unexpected.");
          setEmployeeName("Employee");
        }
      } catch (error) {
        console.error("Error fetching employee profile:", error);
        toast.error("Failed to load employee name.", { duration: 3000 });
        setEmployeeName("Employee");
      }
    };
    fetchEmployeeProfile();
  }, []);

  // Combined fetch for customer counts (My, Live, Offline) using Promise.all
  const fetchCustomerCounts = useCallback(async () => {
    if (!employeeUserId) {
      setLoadingCustomersStats(false);
      return;
    }

    setLoadingCustomersStats(true);
    setCustomerStatsError(null);
    try {
      const token = Cookies.get("accessToken");
      if (!token) throw new Error("Authentication token missing for customer data.");

      const [myCustomersRes, liveCustomersRes, offlineCustomersRes] = await Promise.all([
        getData(`/employee/${employeeUserId}/`, { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }), // Increased timeout
        getData('/customers/live/', { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }), // Increased timeout
        getData('/customers/offline/', { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }), // Increased timeout
      ]);

      // My Customers
      const assignedCustomers = myCustomersRes.data?.assigned_customers || [];
      setMyCustomersCount(assignedCustomers.length);

      const assignedCustomerIds = assignedCustomers.map(c => c.user_id);

      // Live Customers
      let liveCount = 0;
      if (liveCustomersRes.data && Array.isArray(liveCustomersRes.data.results)) {
        const liveCustomers = liveCustomersRes.data.results.filter(customer =>
          customer.account_status && assignedCustomerIds.includes(customer.user_id)
        );
        liveCount = liveCustomers.length;
      } else {
        console.error("Unexpected live customers API response format:", liveCustomersRes.data);
        setCustomerStatsError("Invalid live customer data format.");
        toast.error("Invalid live customers data format.", { duration: 3000 });
      }
      setLiveCustomersCount(liveCount);

      // Offline Customers
      let offlineCount = 0;
      if (offlineCustomersRes.data && Array.isArray(offlineCustomersRes.data.results)) {
        const offlineCustomers = offlineCustomersRes.data.results.filter(customer =>
          !customer.account_status && assignedCustomerIds.includes(customer.user_id)
        );
        offlineCount = offlineCustomers.length;
      } else {
        console.error("Unexpected offline customers API response format:", offlineCustomersRes.data);
        setCustomerStatsError("Invalid offline customer data format.");
        toast.error("Invalid offline customers data format.", { duration: 3000 });
      }
      setOfflineCustomersCount(offlineCount);

    } catch (error) {
      console.error("Error fetching customer counts:", error);
      const message = error.response?.data?.detail || error.message || "Failed to load customer data.";
      setCustomerStatsError(message);
      toast.error(message, { duration: 3000 });
      setMyCustomersCount(0);
      setLiveCustomersCount(0);
      setOfflineCustomersCount(0);
    } finally {
      setLoadingCustomersStats(false);
    }
  }, [employeeUserId]);

  // Fetch daily login/logout activity
  const fetchDailyActivity = useCallback(async () => {
    if (!employeeUserId) {
      setLoadingActivity(false);
      return;
    }

    setLoadingActivity(true);
    setActivityError(null);
    try {
      const token = Cookies.get("accessToken");
      if (!token) throw new Error("Authentication token missing for login history.");

      const response = await getData(`/my-login-history/?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000, // Increased timeout
      });

      if (response.data && Array.isArray(response.data.results)) {
        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        const todayEntries = response.data.results.filter(entry => {
          const loginTime = parseDate(entry.login_time);
          return loginTime && loginTime >= start && loginTime <= end;
        });

        if (todayEntries.length === 0) {
          setFirstLoginTime(null);
          setLastLogoutTime(null);
          toast.info("No login records found for today.", { duration: 3000, position: "top-center" });
          return;
        }

        // Sort by login time to get the very first login
        const sortedByLogin = [...todayEntries].sort((a, b) => {
          const aTime = parseDate(a.login_time);
          const bTime = parseDate(b.login_time);
          return (aTime || 0) - (bTime || 0);
        });
        const firstLogin = parseDate(sortedByLogin[0]?.login_time);

        // Sort by logout time to get the very last logout (if any)
        const sortedByLogout = [...todayEntries]
          .filter(entry => entry.logout_time) // Only consider entries with a logout time
          .sort((a, b) => {
            const aTime = parseDate(a.logout_time);
            const bTime = parseDate(b.logout_time);
            return (bTime || 0) - (aTime || 0); // Descending order for last logout
          });
        const lastLogout = sortedByLogout.length > 0 ? parseDate(sortedByLogout[0]?.logout_time) : null;

        setFirstLoginTime(firstLogin);
        setLastLogoutTime(lastLogout);
      } else {
        console.error("Unexpected login history API response format:", response.data);
        setActivityError("Invalid login history data format.");
        toast.error("Invalid login history data format.", { duration: 3000 });
        setFirstLoginTime(null);
        setLastLogoutTime(null);
      }
    } catch (error) {
      console.error("Error fetching daily activity:", error);
      const message = error.response?.data?.detail || error.message || "Failed to load daily activity.";
      setActivityError(message);
      toast.error(message, { duration: 3000 });
      setFirstLoginTime(null);
      setLastLogoutTime(null);
    } finally {
      setLoadingActivity(false);
    }
  }, [employeeUserId]);

  // Fetch revenue data
  const fetchRevenueData = useCallback(async () => {
    if (!employeeUserId) {
      setLoadingRevenue(false);
      return;
    }

    setLoadingRevenue(true);
    setRevenueError(null);
    try {
      const token = Cookies.get("accessToken");
      if (!token) throw new Error("Authentication token missing. Please log in.");

      const url = `/followup/employee/${employeeUserId}/`;
      const response = await getData(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }); // Increased timeout

      let paymentRecords = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          paymentRecords = response.data;
        } else if (Array.isArray(response.data.results)) {
          paymentRecords = response.data.results;
        } else {
          throw new Error("Invalid revenue data structure received from API. Expected array or results array.");
        }
      }

      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      const paymentNotesForMonth = paymentRecords
        .filter(record => {
          const createdDate = parseDate(record.created_at);
          const isPaymentValid = record.payment_amount && !isNaN(parseFloat(record.payment_amount));
          return isValid(createdDate) &&
                 createdDate >= monthStart &&
                 createdDate <= monthEnd &&
                 isPaymentValid;
        })
        .map(record => ({
          amount: parseFloat(record.payment_amount),
          date: parseDate(record.created_at),
        }));

      // Aggregate Daily Revenue
      const dailyAggregated = {};
      eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(day => {
        dailyAggregated[format(day, "yyyy-MM-dd")] = 0;
      });

      paymentNotesForMonth.forEach(record => {
        const dayKey = format(record.date, "yyyy-MM-dd");
        dailyAggregated[dayKey] = (dailyAggregated[dayKey] || 0) + record.amount;
      });

      const formattedDailyData = Object.keys(dailyAggregated)
        .map(day => ({
          name: format(new Date(day), "MMM dd"),
          amount: dailyAggregated[day],
        }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

      // Aggregate Weekly Revenue
      const weeklyAggregated = {};
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      daysInMonth.forEach(day => {
        const weekStart = startOfWeek(day, { weekStartsOn: 1 }); // Monday as start of week
        const weekKey = format(weekStart, "yyyy-MM-dd");
        weeklyAggregated[weekKey] = weeklyAggregated[weekKey] || { amount: 0, endDate: endOfWeek(day, { weekStartsOn: 1 }) };
      });

      paymentNotesForMonth.forEach(record => {
        const weekStart = startOfWeek(record.date, { weekStartsOn: 1 });
        const weekKey = format(weekStart, "yyyy-MM-dd");
        if (weeklyAggregated[weekKey]) {
          weeklyAggregated[weekKey].amount += record.amount;
        }
      });

      const formattedWeeklyData = Object.keys(weeklyAggregated)
        .map(weekKey => ({
          name: `${format(new Date(weekKey), "MMM dd")} - ${format(weeklyAggregated[weekKey].endDate, "MMM dd")}`,
          amount: weeklyAggregated[weekKey].amount,
        }))
        .sort((a, b) => new Date(a.name.split(' - ')[0]).getTime() - new Date(b.name.split(' - ')[0]).getTime());

      // Aggregate Monthly Revenue
      const totalMonthlyRevenue = paymentNotesForMonth.reduce((sum, record) => sum + record.amount, 0);
      const formattedMonthlyData = [
        { name: format(selectedMonth, "MMMM"), amount: totalMonthlyRevenue }
      ];

      setRevenueData({
        daily: formattedDailyData,
        weekly: formattedWeeklyData,
        monthly: formattedMonthlyData,
      });

      if (paymentNotesForMonth.length === 0) {
        toast.info(`No payment records found for ${format(selectedMonth, "MMMM yyyy")}.`, {
          duration: 4000,
          position: "top-center",
        });
      }
    } catch (err) {
      console.error("Revenue Fetch Error:", {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage = err.response?.data?.detail || err.message || "Failed to load revenue data.";
      setRevenueError(errorMessage);
      toast.error(errorMessage, { duration: 6000, position: "top-center" });
      setRevenueData({ daily: [], weekly: [], monthly: [] }); // Clear data on error
    } finally {
      setLoadingRevenue(false);
    }
  }, [employeeUserId, selectedMonth]);

  // Combined useEffect for initial data fetches and re-fetches on employeeUserId/selectedMonth change
  useEffect(() => {
    if (employeeUserId) {
      fetchCustomerCounts();
      fetchDailyActivity();
      fetchRevenueData();
    }
    // No else block needed as initial checks in each fetch function handle null employeeUserId
  }, [employeeUserId, selectedMonth, fetchCustomerCounts, fetchDailyActivity, fetchRevenueData]);

  // Memoized data for My Customer Status chart to prevent unnecessary re-renders
  const myCustomerStatusData = useMemo(() => {
    // Ensure all values are non-negative
    const otherAssigned = Math.max(0, myCustomersCount - liveCustomersCount - offlineCustomersCount);
    return [
      { name: "Live Customers", value: liveCustomersCount, color: "#22c55e" }, // Green
      { name: "Offline Customers", value: offlineCustomersCount, color: "#ef4444" }, // Red
      { name: "Other Assigned", value: otherAssigned, color: "#f97316" }, // Orange for remaining
    ];
  }, [liveCustomersCount, offlineCustomersCount, myCustomersCount]);

  // Memoized data for Daily Work Hours chart
  const dailyWorkHoursData = useMemo(() => {
    const currentWorkMinutes = firstLoginTime
      ? (lastLogoutTime ? differenceInMinutes(lastLogoutTime, firstLoginTime) : differenceInMinutes(currentTime, firstLoginTime))
      : 0;

    let workedMinutes = Math.max(0, currentWorkMinutes);
    let remainingMinutes = 0;
    let overtimeMinutes = 0;

    if (workedMinutes < TARGET_WORK_HOURS_MINUTES) {
      remainingMinutes = TARGET_WORK_HOURS_MINUTES - workedMinutes;
      workedMinutes = workedMinutes; // Keep worked minutes as is
    } else if (workedMinutes > TARGET_WORK_HOURS_MINUTES) {
      overtimeMinutes = workedMinutes - TARGET_WORK_HOURS_MINUTES;
      workedMinutes = TARGET_WORK_HOURS_MINUTES; // Cap worked minutes at target for chart
    }

    return [
      { name: "Worked", value: workedMinutes, color: "#10b981" },
      // Only show remaining if not in overtime or worked less than target
      ...(remainingMinutes > 0 ? [{ name: "Remaining", value: remainingMinutes, color: "#94a3b8" }] : []),
      ...(overtimeMinutes > 0 ? [{ name: "Overtime", value: overtimeMinutes, color: "#f59e0b" }] : []),
    ].filter(data => data.value > 0); // Filter out entries with zero value for cleaner chart
  }, [firstLoginTime, lastLogoutTime, currentTime]);


  // Dashboard stats cards data
  const myDashboardStats = [
    {
      title: "My Customers",
      value: loadingCustomersStats ? "..." : myCustomersCount.toString(),
      icon: Users,
      color: "bg-gradient-to-br from-teal-500 to-teal-700",
      loading: loadingCustomersStats,
    },
    {
      title: "Live Customers",
      value: loadingCustomersStats ? "..." : liveCustomersCount.toString(),
      icon: UserCheck,
      color: "bg-gradient-to-br from-purple-500 to-purple-700",
      loading: loadingCustomersStats,
    },
    {
      title: "Offline Customers",
      value: loadingCustomersStats ? "..." : offlineCustomersCount.toString(),
      icon: IconPower,
      color: "bg-gradient-to-br from-red-600 to-red-800",
      loading: loadingCustomersStats,
    },
    {
      title: "Daily Activity",
      value: loadingActivity ? "..." : firstLoginTime ? formatDateTime(firstLoginTime) : "No Login Today",
      change: lastLogoutTime ? formatDateTime(lastLogoutTime) : "Currently Active",
      extra: calculateWorkHours(firstLoginTime, lastLogoutTime),
      icon: IconHistory,
      color: "bg-gradient-to-br from-orange-500 to-orange-700",
      loading: loadingActivity,
      error: activityError, // Pass activity error to the card
    },
  ];

  return (
    <ErrorBoundary>
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-800">Welcome back, {employeeName}</h1>
            <p className="text-md text-gray-600 mt-1">
              Today is{" "}
              {currentTime.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              , {currentTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <Tabs defaultValue="my-dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-white rounded-lg shadow-sm mb-8">
            <TabsTrigger value="my-dashboard" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md text-gray-700 hover:text-purple-600">My Dashboard</TabsTrigger>
            <TabsTrigger value="bureau-dashboard" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md text-gray-700 hover:text-purple-600">Bureau Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="my-dashboard" className="mt-0 space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {myDashboardStats.map((card, index) => (
                <Card key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  <CardContent className="p-6">
                    {card.loading ? <CardSkeleton /> : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className={`rounded-full p-3 mb-2 ${card.color} shadow-md`}>
                          <card.icon className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">{card.title}</p>
                        {card.error ? (
                          <h3 className="text-md font-bold mt-1 text-red-600">{card.error}</h3>
                        ) : (
                          <h3 className="text-2xl font-bold mt-1 text-gray-900">{card.value}</h3>
                        )}

                        {card.title === "Daily Activity" && (
                          <>
                            <p className="text-sm text-gray-600 mt-1">Last Logout: {card.change}</p>
                            <p className="text-sm text-gray-600 mt-1">Work Hours: {card.extra}</p>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payment Collections Overview Chart */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <BadgeDollarSign className="h-5 w-5 text-green-600" />
                  <span>Payment Collections Overview</span>
                </CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-[180px] justify-start text-left font-normal ${
                        !selectedMonth && "text-muted-foreground"
                      } rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {selectedMonth ? format(selectedMonth, "MMM yyyy") : <span>Pick a month</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DatePicker
                      selected={selectedMonth}
                      onChange={(date) => setSelectedMonth(date)}
                      dateFormat="MMM yyyy"
                      showMonthYearPicker
                      inline
                      className="react-datepicker-custom"
                    />
                  </PopoverContent>
                </Popover>
              </CardHeader>
              <CardDescription className="px-6 text-gray-600">
                Revenue for {format(selectedMonth, "MMMMyyyy")} in ₹
              </CardDescription>
              <CardContent>
                {loadingRevenue ? (
                  <ChartSkeleton />
                ) : revenueError ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-red-600 text-center">{revenueError}</p>
                  </div>
                ) : (
                  <Tabs defaultValue="daily-revenue" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 p-1 bg-gray-100 rounded-lg shadow-sm mb-4">
                      <TabsTrigger value="daily-revenue" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md text-gray-700 hover:text-purple-600">Daily</TabsTrigger>
                      <TabsTrigger value="weekly-revenue" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md text-gray-700 hover:text-purple-600">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly-revenue" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md text-gray-700 hover:text-purple-600">Monthly</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily-revenue" className="h-80 w-full mt-0">
                      {revenueData.daily.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData.daily}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                            <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
                            <Bar dataKey="amount" fill="#4f46e5" name="Daily Revenue" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          No daily revenue data for this month.
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="weekly-revenue" className="h-80 w-full mt-0">
                      {revenueData.weekly.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData.weekly}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                            <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 44px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
                            <Bar dataKey="amount" fill="#06b6d4" name="Weekly Revenue" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          No weekly revenue data for this month.
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="monthly-revenue" className="h-80 w-full mt-0">
                      {revenueData.monthly.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData.monthly}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                            <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
                            <Bar dataKey="amount" fill="#facc15" name="Monthly Revenue" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          No monthly revenue data for this month.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>

            {/* My Customer Status Chart */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>My Customer Status</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">Current status of your assigned customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCustomersStats ? (
                    <ChartSkeleton />
                  ) : customerStatsError ? (
                    <div className="h-80 flex items-center justify-center">
                      <p className="text-red-600 text-center">{customerStatsError}</p>
                    </div>
                  ) : myCustomerStatusData.filter(d => d.value > 0).length > 0 ? ( // Only render if there's actual data
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={myCustomerStatusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                          <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="value" name="Customers" radius={[4, 4, 0, 0]}>
                            {myCustomerStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No customer status data available.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Work Hours Chart */}
              <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span>Daily Work Hours</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">Daily work hour compliance (8-hour target)</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingActivity ? (
                    <ChartSkeleton />
                  ) : activityError ? (
                    <div className="h-80 flex items-center justify-center">
                      <p className="text-red-600 text-center">{activityError}</p>
                    </div>
                  ) : dailyWorkHoursData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dailyWorkHoursData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            // Custom label to show hours and minutes
                            label={({ name, value }) => {
                              const hours = Math.floor(value / 60);
                              const minutes = value % 60;
                              return `${name}: ${hours}h ${minutes}m`;
                            }}
                          >
                            {dailyWorkHoursData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value, name) => {
                            const hours = Math.floor(value / 60);
                            const minutes = value % 60;
                            return [`${hours}h ${minutes}m`, name.split(' (')[0]];
                          }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No daily work hour data available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Activity Trend */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <BadgeDollarSign className="h-5 w-5 text-green-600" />
                  <span>Payment Activity Trend</span>
                </CardTitle>
                <CardDescription className="text-gray-600">Daily payment collections trend</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRevenue ? (
                  <ChartSkeleton />
                ) : revenueError ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-red-600 text-center">{revenueError}</p>
                  </div>
                ) : revenueData.daily.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={revenueData.daily}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                        <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
                        <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8, fill: '#10b981', stroke: '#10b981', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No daily payment activity data for this month.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bureau Dashboard Content */}
          <TabsContent value="bureau-dashboard" className="mt-0 space-y-8">
            <Suspense fallback={<ChartSkeleton />}>
              <BureauDashboard />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;