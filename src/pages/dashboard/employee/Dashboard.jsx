import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, UserCheck, ChevronUp, TrendingUp, BadgeDollarSign, CalendarDays, User, FileText, Clock } from "lucide-react";
import { IconPower, IconHistory } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getData } from "../../../store/httpservice";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { parse, startOfMonth, endOfMonth, eachDayOfInterval, format, startOfWeek, endOfWeek, startOfDay, endOfDay, differenceInMinutes, isValid } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover components
import { Button } from "@/components/ui/button"; // Import Button for DatePicker trigger
import BureauDashboard from "./BureauDashboard";

// Sample data for charts (primarily used for Bureau Dashboard or if dynamic data is not available)
const profileDataBureau = [
  { name: "Jan", active: 40, new: 24, rejected: 4 },
  { name: "Feb", active: 30, new: 13, rejected: 5 },
  { name: "Mar", active: 20, new: 29, rejected: 3 },
  { name: "Apr", active: 27, new: 38, rejected: 2 },
  { name: "May", active: 18, new: 48, rejected: 6 },
  { name: "Jun", active: 23, new: 38, rejected: 5 },
  { name: "Jul", active: 34, new: 43, rejected: 8 },
];

const matchDataBureau = [
  { name: "Successful", value: 400 },
  { name: "In Progress", value: 300 },
  { name: "Pending", value: 200 },
  { name: "Rejected", value: 100 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]; // Defined COLORS constant for re-use

// Helper to parse dates
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
    } catch (err) {
      // Continue to try other formats
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

// Calculate work hours
const calculateWorkHours = (firstLogin, lastLogout) => {
  if (!firstLogin) return "N/A";
  const endTime = lastLogout || new Date();
  const minutes = differenceInMinutes(endTime, firstLogin);
  if (minutes < 0) return "N/A";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    console.error("ErrorBoundary Caught Error:", error);
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <p className="text-red-600 font-medium">Error: {this.state.error}</p>
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
  const [employeeUserId, setEmployeeUserId] = useState(null);
  const [employeeName, setEmployeeName] = useState("Employee"); // New state for employee name
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [myCustomersCount, setMyCustomersCount] = useState(0);
  const [liveCustomersCount, setLiveCustomersCount] = useState(0);
  const [offlineCustomersCount, setOfflineCustomersCount] = useState(0);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingLiveCustomers, setLoadingLiveCustomers] = useState(true);
  const [loadingOfflineCustomers, setLoadingOfflineCustomers] = useState(true);
  const [firstLoginTime, setFirstLoginTime] = useState(null);
  const [lastLogoutTime, setLastLogoutTime] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date()); // New state for live time

  // New states for dynamic chart data
  const [myCustomerStatusData, setMyCustomerStatusData] = useState([]);
  const [loadingMyCustomerStatus, setLoadingMyCustomerStatus] = useState(true);
  const [dailyWorkHoursData, setDailyWorkHoursData] = useState([]);
  const TARGET_WORK_HOURS_MINUTES = 8 * 60; // 8 hours in minutes


  // Parse employee user ID from cookie and fetch employee name from /profile/
  useEffect(() => {
    const userCookie = Cookies.get("user");
    console.log("Dashboard useEffect: Parsing user cookie...");
    if (userCookie) {
      try {
        const parsedUser = JSON.parse(userCookie);
        console.log("Dashboard Parsed User:", parsedUser);
        if (parsedUser.id) {
          setEmployeeUserId(parsedUser.id);
        }
      } catch (error) {
        console.error("Dashboard Error parsing user cookie:", error);
        setRevenueError("Invalid user session. Please log in.");
        setLoadingRevenue(false);
        setLoadingCustomers(false);
        setLoadingLiveCustomers(false);
        setLoadingOfflineCustomers(false);
        setLoadingActivity(false);
        setLoadingMyCustomerStatus(false);
      }
    } else {
      console.warn("Dashboard: No user cookie found.");
      setRevenueError("Please log in as an employee to view dashboard data.");
      setLoadingRevenue(false);
      setLoadingCustomers(false);
      setLoadingLiveCustomers(false);
      setLoadingOfflineCustomers(false);
      setLoadingActivity(false);
      setLoadingMyCustomerStatus(false);
    }

    // Fetch employee name from /profile/ endpoint
    const fetchEmployeeProfile = async () => {
      try {
        const token = Cookies.get("accessToken");
        if (!token) {
          throw new Error("No authentication token found for profile.");
        }
        const response = await getData("/profile/", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        if (response.data && response.data.full_name) {
          setEmployeeName(response.data.full_name);
        } else {
          console.warn("Employee name not found in profile data.");
          setEmployeeName("Employee"); // Fallback
        }
      } catch (error) {
        console.error("Error fetching employee profile:", error);
        toast.error("Failed to load employee name.", { duration: 3000 });
        setEmployeeName("Employee"); // Fallback on error
      }
    };

    fetchEmployeeProfile();
  }, []); // Empty dependency array means this runs once on mount

  // Effect for live time update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer); // Cleanup on component unmount
  }, []);

  // Fetch assigned customers count
  const fetchMyCustomersCount = useCallback(async () => {
    if (!employeeUserId) {
      console.warn("fetchMyCustomersCount: No employee user ID available. Skipping fetch.");
      setLoadingCustomers(false);
      return;
    }

    setLoadingCustomers(true);
    try {
      const token = Cookies.get("accessToken");
      if (!token) {
        throw new Error("No authentication token found for customers.");
      }
      const response = await getData(`/employee/${employeeUserId}/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      console.log("Assigned Customers API Response:", response.data);
      const assignedCustomers = response.data.assigned_customers || [];
      setMyCustomersCount(assignedCustomers.length);
    } catch (error) {
      console.error("Error fetching assigned customers count:", error);
      toast.error("Failed to load customer count.", { duration: 3000 });
      setMyCustomersCount(0);
    } finally {
      setLoadingCustomers(false);
    }
  }, [employeeUserId]);

  // Fetch live customers count
  const fetchLiveCustomersCount = useCallback(async () => {
    if (!employeeUserId) {
      console.warn("fetchLiveCustomersCount: No employee user ID available. Skipping fetch.");
      setLoadingLiveCustomers(false);
      return;
    }

    setLoadingLiveCustomers(true);
    try {
      const token = Cookies.get("accessToken");
      if (!token) {
        throw new Error("No authentication token found for live customers.");
      }
      const response = await getData('/customers/live/', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      console.log("Live Customers API Response:", response.data);
      if (response.data && Array.isArray(response.data.results)) {
        const employeeCustomers = await getData(`/employee/${employeeUserId}/`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        const assignedCustomerIds = employeeCustomers.data.assigned_customers.map(c => c.user_id);
        const liveCustomers = response.data.results.filter(customer =>
          customer.account_status && assignedCustomerIds.includes(customer.user_id)
        );
        setLiveCustomersCount(liveCustomers.length);
      } else {
        console.error("Unexpected live customers API response format:", response.data);
        setLiveCustomersCount(0);
        toast.error("Invalid live customers data format.", { duration: 3000 });
      }
    } catch (error) {
      console.error("Error fetching live customers count:", error);
      toast.error("Failed to load live customers count.", { duration: 3000 });
      setLiveCustomersCount(0);
    } finally {
      setLoadingLiveCustomers(false);
    }
  }, [employeeUserId]);

  // Fetch offline customers count
  const fetchOfflineCustomersCount = useCallback(async () => {
    if (!employeeUserId) {
      console.warn("fetchOfflineCustomersCount: No employee user ID available. Skipping fetch.");
      setLoadingOfflineCustomers(false);
      return;
    }

    setLoadingOfflineCustomers(true);
    try {
      const token = Cookies.get("accessToken");
      if (!token) {
        throw new Error("No authentication token found for offline customers.");
      }
      const response = await getData('/customers/offline/', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      console.log("Offline Customers API Response:", response.data);
      if (response.data && Array.isArray(response.data.results)) {
        const employeeCustomers = await getData(`/employee/${employeeUserId}/`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        const assignedCustomerIds = employeeCustomers.data.assigned_customers.map(c => c.user_id);
        const offlineCustomers = response.data.results.filter(customer =>
          !customer.account_status && assignedCustomerIds.includes(customer.user_id)
        );
        setOfflineCustomersCount(offlineCustomers.length);
      } else {
        console.error("Unexpected offline customers API response format:", response.data);
        setOfflineCustomersCount(0);
        toast.error("Invalid offline customers data format.", { duration: 3000 });
      }
    } catch (error) {
      console.error("Error fetching offline customers count:", error);
      toast.error("Failed to load offline customers count.", { duration: 3000 });
      setOfflineCustomersCount(0);
    } finally {
      setLoadingOfflineCustomers(false);
    }
  }, [employeeUserId]);

  // Fetch daily login/logout activity
  const fetchDailyActivity = useCallback(async () => {
    if (!employeeUserId) {
      console.warn("fetchDailyActivity: No employee user ID available. Skipping fetch.");
      setLoadingActivity(false);
      return;
    }

    setLoadingActivity(true);
    setActivityError(null);
    try {
      const token = Cookies.get("accessToken");
      if (!token) {
        throw new Error("No authentication token found for login history.");
      }
      const today = new Date();
      const start = startOfDay(today);
      const end = endOfDay(today);
      const response = await getData(`/my-login-history/?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      console.log("Daily Activity API Response:", response.data);
      if (response.data && Array.isArray(response.data.results)) {
        const todayEntries = response.data.results.filter(entry => {
          const loginTime = parseDate(entry.login_time);
          return loginTime && loginTime >= start && loginTime <= end;
        });
        if (todayEntries.length === 0) {
          setFirstLoginTime(null);
          setLastLogoutTime(null);
          return;
        }
        const sortedByLogin = todayEntries.sort((a, b) => {
          const aTime = parseDate(a.login_time);
          const bTime = parseDate(b.login_time);
          return aTime - bTime;
        });
        const firstLogin = parseDate(sortedByLogin[0].login_time);
        const sortedByLogout = todayEntries
          .filter(entry => entry.logout_time)
          .sort((a, b) => {
            const aTime = parseDate(a.logout_time);
            const bTime = parseDate(b.logout_time);
            return bTime - aTime;
          });
        const lastLogout = sortedByLogout.length > 0 ? parseDate(sortedByLogout[0].logout_time) : null;
        setFirstLoginTime(firstLogin);
        setLastLogoutTime(lastLogout);
      } else {
        console.error("Unexpected login history API response format:", response.data);
        setActivityError("Invalid login history data format.");
        setFirstLoginTime(null);
        setLastLogoutTime(null);
        toast.error("Invalid login history data format.", { duration: 3000 });
      }
    } catch (error) {
      console.error("Error fetching daily activity:", error);
      setActivityError("Failed to load daily activity.");
      toast.error("Failed to load daily activity.", { duration: 3000 });
      setFirstLoginTime(null);
      setLastLogoutTime(null);
    } finally {
      setLoadingActivity(false);
    }
  }, [employeeUserId]);

  // Fetch revenue data
  const fetchRevenueData = useCallback(async () => {
    if (!employeeUserId) {
      console.warn("fetchRevenueData: No employee user ID available. Skipping fetch.");
      setLoadingRevenue(false);
      return;
    }

    console.log("fetchRevenueData called for Employee ID:", employeeUserId, "Month:", format(selectedMonth, 'yyyy-MM'));

    try {
      setLoadingRevenue(true);
      setRevenueError(null);
      const token = Cookies.get("accessToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const url = `/followup/employee/${employeeUserId}/`;
      console.log("Fetching revenue from URL:", url);
      const response = await getData(url)
      
      console.log("Revenue API Response:", response);

      let paymentRecords = [];
      if (response && response.data && Array.isArray(response.data)) {
        paymentRecords = response.data;
      } else if (response && response.data && Array.isArray(response.data.results)) {
        paymentRecords = response.data.results;
      } else {
        throw new Error("Invalid revenue data structure received from API. Expected array or results array.");
      }

      console.log("Raw Payment Records fetched:", paymentRecords);

      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      // Filter payment records for the selected month
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

      console.log("Filtered Payment Records for Month:", paymentNotesForMonth);

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
        const weekStart = startOfWeek(day, { weekStartsOn: 1 });
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
        toast.info(`No payment records found for ${format(selectedMonth, "MMMM")}.`, {
          duration: 6000,
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
      toast.error(errorMessage, {
        duration: 6000,
        position: "top-center",
        style: {
          background: "#fff",
          color: "#333",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      });
      setRevenueData({ daily: [], weekly: [], monthly: [] });
    } finally {
      setLoadingRevenue(false);
      console.log("fetchRevenueData completed.");
    }
  }, [employeeUserId, selectedMonth]);

  // Effect to update My Customer Status Data
  useEffect(() => {
    if (!loadingCustomers && !loadingLiveCustomers && !loadingOfflineCustomers) {
      setMyCustomerStatusData([
        { name: "Live Customers", value: liveCustomersCount, color: "#22c55e" }, // Green
        { name: "Offline Customers", value: offlineCustomersCount, color: "#ef4444" }, // Red
        { name: "Other Assigned", value: myCustomersCount - liveCustomersCount - offlineCustomersCount, color: "#f97316" }, // Orange for remaining
      ]);
      setLoadingMyCustomerStatus(false);
    }
  }, [loadingCustomers, loadingLiveCustomers, loadingOfflineCustomers, liveCustomersCount, offlineCustomersCount, myCustomersCount]);

  // Effect to update Daily Work Hours Data
  useEffect(() => {
    if (!loadingActivity) {
      const currentWorkMinutes = firstLoginTime
        ? (lastLogoutTime ? differenceInMinutes(lastLogoutTime, firstLoginTime) : differenceInMinutes(new Date(), firstLoginTime))
        : 0; // If no login, 0 minutes worked

      let workedMinutes = Math.max(0, currentWorkMinutes);
      let remainingMinutes = 0;
      let overtimeMinutes = 0;

      if (workedMinutes < TARGET_WORK_HOURS_MINUTES) {
        remainingMinutes = TARGET_WORK_HOURS_MINUTES - workedMinutes;
      } else if (workedMinutes > TARGET_WORK_HOURS_MINUTES) {
        overtimeMinutes = workedMinutes - TARGET_WORK_HOURS_MINUTES;
        workedMinutes = TARGET_WORK_HOURS_MINUTES; // Cap for the target segment
      }

      setDailyWorkHoursData([
        { name: "Worked", value: workedMinutes, color: "#10b981" }, // Green
        { name: "Remaining", value: remainingMinutes, color: "#94a3b8" }, // Gray/Blue
        ...(overtimeMinutes > 0 ? [{ name: "Overtime", value: overtimeMinutes, color: "#f59e0b" }] : []), // Orange
      ]);
    }
  }, [loadingActivity, firstLoginTime, lastLogoutTime]);

  // Combined useEffect for initial data fetches
  useEffect(() => {
    if (employeeUserId) {
      fetchMyCustomersCount();
      fetchLiveCustomersCount();
      fetchOfflineCustomersCount();
      fetchDailyActivity();
      fetchRevenueData();
    }
  }, [employeeUserId, selectedMonth, fetchMyCustomersCount, fetchLiveCustomersCount, fetchOfflineCustomersCount, fetchDailyActivity, fetchRevenueData]);

  // Updated myDashboardStats with Daily Activity and enhanced colors
  const myDashboardStats = [
    {
      title: "My Customers",
      value: loadingCustomers ? "..." : myCustomersCount.toString(),
      icon: Users,
      color: "bg-gradient-to-br from-teal-500 to-teal-700", // Changed color
    },
    {
      title: "Live Customers",
      value: loadingLiveCustomers ? "..." : liveCustomersCount.toString(),
      icon: UserCheck,
      color: "bg-gradient-to-br from-purple-500 to-purple-700", // Changed color
    },
    {
      title: "Offline Customers",
      value: loadingOfflineCustomers ? "..." : offlineCustomersCount.toString(),
      icon: IconPower,
      color: "bg-gradient-to-br from-red-600 to-red-800", // Kept red for offline
    },
    {
      title: "Daily Activity",
      value: loadingActivity ? "..." : firstLoginTime ? formatDateTime(firstLoginTime) : "No Login",
      change: lastLogoutTime ? formatDateTime(lastLogoutTime) : "Active",
      extra: calculateWorkHours(firstLoginTime, lastLogoutTime),
      icon: IconHistory,
      color: "bg-gradient-to-br from-orange-500 to-orange-700", // Changed color
    },
  ];

  return (
    <ErrorBoundary>
      <div className=" bg-gray-50 min-h-screen">
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
                    <div className="flex flex-col items-center justify-center text-center"> {/* Centered content */}
                      <div className={`rounded-full p-3 mb-2 ${card.color} shadow-md`}> {/* Icon at top */}
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">{card.title}</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">{card.value}</h3>
                      {card.title === "Daily Activity" && (
                        <>
                          <p className="text-sm text-gray-600 mt-1">Last Logout: {card.change}</p>
                          <p className="text-sm text-gray-600 mt-1">Work Hours: {card.extra}</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Removed the separate Month Selector for Revenue Data section */}

            {/* Payment Collections Overview Chart */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> {/* Adjusted for inline month selector */}
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <BadgeDollarSign className="h-5 w-5 text-green-600" />
                  <span>Payment Collections Overview</span>
                </CardTitle>
                {/* Month Selector integrated here */}
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
                      inline // Display inline within the popover
                      className="react-datepicker-custom" // Custom class for styling
                    />
                  </PopoverContent>
                </Popover>
              </CardHeader>
              <CardDescription className="px-6 text-gray-600">
                Revenue for {format(selectedMonth, "MMMMyyyy")} in ₹
              </CardDescription>
              <CardContent>
                {loadingRevenue ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500 animate-pulse">Loading revenue data...</p>
                  </div>
                ) : revenueError ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-red-600">{revenueError}</p>
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
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
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

            {/* My Customer Status (formerly Profile Activity) */}
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
                  <div className="h-80">
                    {loadingMyCustomerStatus ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500 animate-pulse">Loading customer status...</p>
                      </div>
                    ) : myCustomerStatusData.length > 0 ? (
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
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        No customer status data available.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Work Hours (formerly Match Status) */}
              <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span>Daily Work Hours</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">Daily work hour compliance (8-hour target)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {loadingActivity ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500 animate-pulse">Loading work hours...</p>
                      </div>
                    ) : dailyWorkHoursData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dailyWorkHoursData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${Math.floor(value / 60)}h ${value % 60}m`}
                          >
                            {dailyWorkHoursData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value, name) => [`${Math.floor(value / 60)}h ${value % 60}m`, name.split(' (')[0]]} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        No daily work hour data available.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Activity Trend (formerly Recent Activity) */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <BadgeDollarSign className="h-5 w-5 text-green-600" />
                  <span>Payment Activity Trend</span>
                </CardTitle>
                <CardDescription className="text-gray-600">Daily payment collections trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {loadingRevenue ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500 animate-pulse">Loading payment activity...</p>
                    </div>
                  ) : revenueData.daily.length > 0 ? (
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
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No daily payment activity data for this month.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bureau Dashboard Content */}
          <TabsContent value="bureau-dashboard" className="mt-0 space-y-8">
            {/* BureauDashboard component will be rendered here */}
            {/* The content of BureauDashboard.jsx will go here */}
            {/* For now, just a placeholder or the component itself */}
            <BureauDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
