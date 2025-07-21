import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getData } from "../../../store/httpService";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { format, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, parseISO } from "date-fns";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Users, IndianRupee, Gauge
} from "lucide-react";

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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-red-600 font-medium text-lg dark:text-red-400">An unexpected error occurred:</p>
          <p className="text-red-500 mt-2 dark:text-red-300">{this.state.error}</p>
          <p className="text-gray-500 text-sm mt-4 dark:text-gray-400">Please refresh the page or contact support if the issue persists.</p>
          {this.state.errorInfo && (
            <details className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded-md overflow-auto dark:bg-gray-700">{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Vibrant colors for charts
const COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#5856D6", "#AF52DE"];

// Custom legend render
const renderLegend = (props) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: entry.color }}></div>
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

const AdminDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalRevenue: 0,
    systemUptime: "99.9%", // Hardcoded as per requirement
  });
  const [yearlyRevenue, setYearlyRevenue] = useState([{ name: "2025", value: 0 }]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([{ name: "2025-07", value: 0 }]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([{ name: "2025-W27", value: 0 }]);
  const [employeeRevenue, setEmployeeRevenue] = useState([]);
  const [liveTime, setLiveTime] = useState(new Date());

  // Parse admin ID from cookie
  useEffect(() => {
    try {
      const userCookie = Cookies.get("user");
      if (!userCookie) {
        setError("Please log in. User session not found.");
        setLoadingEmployees(false);
        return;
      }
      const parsedUser = JSON.parse(userCookie);
      if (parsedUser.id) {
        setAdminId(parsedUser.id);
      } else {
        setError("Invalid user session. User ID not found in cookie.");
        setLoadingEmployees(false);
      }
    } catch (error) {
      console.error("Cookie Parse Error:", error);
      setError("Failed to load user session. Please clear cookies and log in again.");
      setLoadingEmployees(false);
    }
  }, []);

  // Update live time
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch assigned employees and aggregate revenue
  const fetchEmployeesAndRevenue = useCallback(async () => {
    if (!adminId || !isAuthenticated) return;
    try {
      setLoadingEmployees(true);
      setError(null);
      const token = Cookies.get("accessToken");
      if (!token) {
        throw new Error("No authentication token. Please log in.");
      }
      const response = await getData(`/admin/${adminId}/`);
      console.log("Employees API Response:", response);
      const assignedEmployees = Array.isArray(response?.data?.assigned_employees)
        ? response.data.assigned_employees
        : [];
      setEmployees(assignedEmployees);
      setSummary((prev) => ({ ...prev, totalEmployees: assignedEmployees.length }));
      toast.success("Assigned employees loaded successfully!", { duration: 3000 });

      // Aggregate revenue data
      const yearlyData = [];
      const monthlyData = [];
      const weeklyData = [];
      let totalRevenue = 0;
      const employeeRevenueData = [];

      for (const employee of assignedEmployees) {
        try {
          const empResponse = await getData(`/followup/employee/${employee.user_id}/`);
          console.log(`Employee ${employee.user_id} Notes Response:`, empResponse);
          const notes = Array.isArray(empResponse.data?.results)
            ? empResponse.data.results
            : Array.isArray(empResponse.data)
            ? empResponse.data
            : [];
          let employeeTotalRevenue = 0;

          notes.forEach((note) => {
            const payment = note.payment_amount ? parseFloat(note.payment_amount) : 0;
            if (payment <= 0) return;
            totalRevenue += payment;
            employeeTotalRevenue += payment;

            const createdAt = parseISO(note.created_at || note.date || new Date().toISOString());
            const year = format(createdAt, "yyyy");
            const month = format(createdAt, "yyyy-MM");
            const week = format(createdAt, "yyyy-'W'II");

            // Yearly Revenue
            if (year === "2025") {
              const existingYear = yearlyData.find((d) => d.name === year);
              if (existingYear) {
                existingYear.value += payment;
              } else {
                yearlyData.push({ name: year, value: payment });
              }
            }

            // Monthly Revenue
            if (month === "2025-07") {
              const existingMonth = monthlyData.find((d) => d.name === month);
              if (existingMonth) {
                existingMonth.value += payment;
              } else {
                monthlyData.push({ name: month, value: payment });
              }
            }

            // Weekly Revenue
            if (week === "2025-W27") {
              const existingWeek = weeklyData.find((d) => d.name === week);
              if (existingWeek) {
                existingWeek.value += payment;
              } else {
                weeklyData.push({ name: week, value: payment });
              }
            }
          });

          employeeRevenueData.push({
            name: employee.full_name || employee.user_id,
            value: employeeTotalRevenue,
          });
        } catch (err) {
          console.error(`Error fetching notes for employee ${employee.user_id}:`, err);
          employeeRevenueData.push({
            name: employee.full_name || employee.user_id,
            value: 0,
          });
        }
      }

      setSummary((prev) => ({ ...prev, totalRevenue }));
      setYearlyRevenue(yearlyData.length > 0 ? yearlyData : [{ name: "2025", value: 0 }]);
      setMonthlyRevenue(monthlyData.length > 0 ? monthlyData : [{ name: "2025-07", value: 0 }]);
      setWeeklyRevenue(weeklyData.length > 0 ? weeklyData : [{ name: "2025-W27", value: 0 }]);
      setEmployeeRevenue(employeeRevenueData.filter((d) => d.value > 0));
    } catch (err) {
      console.error("Fetch Employees Error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.message || "Failed to load assigned employees.");
      toast.error(err.message || "Failed to load assigned employees.", { duration: 5000 });
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [adminId, isAuthenticated]);

  useEffect(() => {
    fetchEmployeesAndRevenue();
  }, [fetchEmployeesAndRevenue]);

  // Stats cards data
  const statsCards = [
    {
      title: "My Employees",
      value: loadingEmployees ? "..." : summary.totalEmployees.toLocaleString(),
      icon: Users,
      color: "from-green-500 to-teal-600",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: loadingEmployees ? "..." : `₹${summary.totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: "from-orange-500 to-red-600",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600",
    },
    {
      title: "System Uptime",
      value: summary.systemUptime,
      subValue: "Stable",
      icon: Gauge,
      color: "from-purple-500 to-fuchsia-600",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600",
    },
  ];

  const formattedDate = liveTime.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedTime = liveTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  // Fallback UI for authentication errors
  if (!isAuthenticated || (!adminId && !loadingEmployees && error)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <p className="text-red-600 text-lg text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:text-red-400">
          <span className="font-semibold">Authentication Error:</span> {error || "Please log in to access the dashboard."}
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen font-inter antialiased text-gray-800 dark:text-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <main className="w-full max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="pt-2 pb-12 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4">
              <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-gray-900 dark:text-gray-100 leading-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-medium">{user?.name || "Admin"}</span>
              </h1>
              <div className="text-xl sm:text-xl font-normal text-gray-700 dark:text-gray-300 whitespace-nowrap mt-2 sm:mt-0">
                {formattedDate} <span className="text-gray-500 dark:text-gray-400 px-1">|</span> {formattedTime}
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 text-center max-w-xl mx-auto opacity-90">
              Monitor your team's performance and revenue metrics.
            </p>
          </section>

          {/* Stat Cards */}
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {statsCards.map((card, index) => (
              <Card
                key={index}
                className="rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 ease-out relative p-0 group cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                <CardContent className="flex flex-col justify-between h-full p-8 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-base font-medium text-gray-500 dark:text-gray-400 block mb-1">{card.title}</span>
                      <h2 className="text-4xl font-normal mt-1 text-gray-900 dark:text-gray-100 drop-shadow-sm">
                        {card.value}
                      </h2>
                      {card.subValue && (
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">{card.subValue}</span>
                      )}
                    </div>
                    <div className={`rounded-full p-3 ${card.iconBg} border border-gray-100 dark:border-gray-600 shadow-inner transform transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:-translate-y-1`}>
                      <card.icon className={`h-8 w-8 ${card.iconColor}`} strokeWidth={2} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Yearly Revenue Chart */}
            <Card className="rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
              <CardHeader className="p-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800 dark:text-gray-100">
                  <IndianRupee className="h-7 w-7 text-indigo-600" />
                  <span>Yearly Revenue</span>
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 text-base mt-2">
                  Total revenue generated in 2025
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {loadingEmployees ? (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Loading chart...</div>
                ) : yearlyRevenue[0].value > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={yearlyRevenue}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-600 dark:text-gray-400" />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          className="text-sm text-gray-600 dark:text-gray-400"
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                          contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', backgroundColor: 'white', color: '#1f2937' }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Bar dataKey="value" fill="#6366f1" name="Revenue" barSize={40} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">No revenue data available.</div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Revenue Chart */}
            <Card className="rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
              <CardHeader className="p-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800 dark:text-gray-100">
                  <IndianRupee className="h-7 w-7 text-indigo-600" />
                  <span>Monthly Revenue</span>
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 text-base mt-2">
                  Revenue generated in July 2025
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {loadingEmployees ? (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Loading chart...</div>
                ) : monthlyRevenue[0].value > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyRevenue}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-600 dark:text-gray-400" />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          className="text-sm text-gray-600 dark:text-gray-400"
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                          contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', backgroundColor: 'white', color: '#1f2937' }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Bar dataKey="value" fill="#6366f1" name="Revenue" barSize={40} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">No revenue data available.</div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Revenue Chart */}
            <Card className="rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
              <CardHeader className="p-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800 dark:text-gray-100">
                  <IndianRupee className="h-7 w-7 text-indigo-600" />
                  <span>Weekly Revenue</span>
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 text-base mt-2">
                  Revenue generated in Week 27, 2025
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {loadingEmployees ? (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Loading chart...</div>
                ) : weeklyRevenue[0].value > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklyRevenue}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-600 dark:text-gray-400" />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          className="text-sm text-gray-600 dark:text-gray-400"
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                          contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', backgroundColor: 'white', color: '#1f2937' }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Bar dataKey="value" fill="#6366f1" name="Revenue" barSize={40} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">No revenue data available.</div>
                )}
              </CardContent>
            </Card>

            {/* Employee Revenue Distribution Chart */}
            <Card className="rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
              <CardHeader className="p-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800 dark:text-gray-100">
                  <Users className="h-7 w-7 text-purple-600" />
                  <span>Employee Revenue Distribution</span>
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 text-base mt-2">
                  Revenue contribution by each employee
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {loadingEmployees ? (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Loading chart...</div>
                ) : employeeRevenue.length > 0 && employeeRevenue.some((entry) => entry.value > 0) ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={employeeRevenue}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          dataKey="value"
                          animationDuration={800}
                          animationEasing="ease-out"
                        >
                          {employeeRevenue.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="transition-all duration-300 hover:opacity-80"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', backgroundColor: 'white', color: '#1f2937' }}
                          formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]}
                        />
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          content={renderLegend}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">No revenue data available.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;