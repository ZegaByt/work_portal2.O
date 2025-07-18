import React, { useEffect, useState } from "react";
import { getData } from "../../../store/httpservice";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import {
  Users, User, ChevronUp, TrendingUp, BadgeDollarSign, CalendarDays, Shield, Sun, Gauge, Wallet, BriefcaseBusiness, Ban
} from "lucide-react";
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs";

// Mock useAuth (replace with actual useAuth in your environment)
const useAuth = () => ({
  currentUser: { name: "Super Admin" },
  isAuthenticated: true,
  logout: () => console.log("Mock logout"),
});

// Vibrant colors for charts
const COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#5856D6", "#AF52DE"];

const Dashboard = () => {
  const { currentUser } = useAuth();

  const [adminCount, setAdminCount] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [employeeCount, setEmployeeCount] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [revenueReportData, setRevenueReportData] = useState(null);
  const [revenueReportLoading, setRevenueReportLoading] = useState(true);
  const [customerStats, setCustomerStats] = useState(null);
  const [customerStatsLoading, setCustomerStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-dashboard");
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    // Set up interval for live time
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);

    // Fetch Admins and Employees
    const fetchAdminEmployeeStats = async () => {
      try {
        setAdminLoading(true);
        setEmployeeLoading(true);
        const res = await getData('/admins-employees/statistics/');
        setAdminCount(res.data.total_admins || 0);
        setEmployeeCount(res.data.total_employees || 0);
      } catch (error) {
        console.error("Error fetching admin/employee stats:", error);
        setAdminCount(0);
        setEmployeeCount(0);
      } finally {
        setAdminLoading(false);
        setEmployeeLoading(false);
      }
    };

    // Fetch Revenue Report Data
    const fetchRevenueReport = async () => {
      try {
        setRevenueReportLoading(true);
        const res = await getData('/followup/revenue-report/');
        setRevenueReportData(res.data);
      } catch (error) {
        console.error("Error fetching revenue report:", error);
        setRevenueReportData(null);
      } finally {
        setRevenueReportLoading(false);
      }
    };

    // Fetch Customer Statistics
    const fetchCustomerStatistics = async () => {
      try {
        setCustomerStatsLoading(true);
        const res = await getData('/customers/statistics/');
        setCustomerStats(res.data);
      } catch (error) {
        console.error("Error fetching customer statistics:", error);
        setCustomerStats(null);
      } finally {
        setCustomerStatsLoading(false);
      }
    };

    fetchAdminEmployeeStats();
    fetchRevenueReport();
    fetchCustomerStatistics();

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Transform revenue data for charts
  const yearlyRevenueChartData = revenueReportData?.yearly_revenue
    ? Object.entries(revenueReportData.yearly_revenue).map(([year, revenue]) => ({ name: year, revenue }))
    : [];

  const monthlyRevenueChartData = revenueReportData?.monthly_revenue
    ? Object.entries(revenueReportData.monthly_revenue).map(([month, revenue]) => ({ name: month, revenue }))
    : [];

  const weeklyRevenueChartData = revenueReportData?.weekly_revenue
    ? Object.entries(revenueReportData.weekly_revenue).map(([week, revenue]) => ({ name: week, revenue }))
    : [];

  const employeeRevenueChartData = revenueReportData?.employee_revenue
    ? Object.entries(revenueReportData.employee_revenue).map(([employeeId, revenue]) => ({ name: employeeId, value: revenue }))
    : [];

  // Transform customer stats for charts
  const genderDistributionData = customerStats ? [
    { name: "Male", value: customerStats.total_male_customers, color: "#3b82f6" },
    { name: "Female", value: customerStats.total_female_customers, color: "#ec4899" },
  ] : [];

  const maleCustomerStatusData = customerStats ? [
    { name: "Male", live: customerStats.male_live_customers, offline: customerStats.male_offline_customers },
  ] : [];

  const femaleCustomerStatusData = customerStats ? [
    { name: "Female", live: customerStats.female_live_customers, offline: customerStats.female_offline_customers },
  ] : [];

  // Stats cards data
  const myDashboardStats = [
    {
      title: "Total Admins",
      value: adminLoading || adminCount === null ? "..." : adminCount.toLocaleString(),
      change: "",
      icon: Shield,
      color: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600"
    },
    {
      title: "Total Employees",
      value: employeeLoading || employeeCount === null ? "..." : employeeCount.toLocaleString(),
      change: "",
      icon: Users,
      color: "from-green-500 to-teal-600",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600"
    },
    {
      title: "Total Revenue",
      value: revenueReportLoading || revenueReportData === null ? "..." : `₹${revenueReportData.total_revenue.toLocaleString('en-IN')}`,
      change: "",
      icon: BadgeDollarSign,
      color: "from-purple-500 to-fuchsia-600",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600"
    },
    {
      title: "System Uptime",
      value: "99.9%",
      change: "Stable",
      icon: Gauge,
      color: "from-orange-500 to-red-600",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600"
    }
  ];

  const bureauDashboardStats = [
    {
      title: "Total Customers",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.total_customers.toLocaleString(),
      change: "",
      icon: Users,
      color: "from-cyan-500 to-blue-600",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-600"
    },
    {
      title: "Male Customers",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.total_male_customers.toLocaleString(),
      change: "",
      icon: User,
      color: "from-purple-500 to-purple-700",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600"
    },
    {
      title: "Female Customers",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.total_female_customers.toLocaleString(),
      change: "",
      icon: User,
      color: "from-pink-500 to-pink-700",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-600"
    },
    {
      title: "Disabled Customers",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.total_disabled_customers.toLocaleString(),
      change: "",
      icon: Ban,
      color: "from-gray-600 to-gray-800",
      iconBg: "bg-gray-600/10",
      iconColor: "text-gray-600"
    },
    {
      title: "Male Live Customers",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.male_live_customers.toLocaleString(),
      change: "",
      icon: User,
      color: "from-green-500 to-green-700",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600"
    },
    {
      title: "Male Offline Customers",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.male_offline_customers.toLocaleString(),
      change: "",
      icon: User,
      color: "from-orange-500 to-orange-700",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600"
    },
    {
      title: "Female Live Customers",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.female_live_customers.toLocaleString(),
      change: "",
      icon: User,
      color: "from-blue-500 to-blue-700",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600"
    },
    {
      title: "Female Offline Customers",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.female_offline_customers.toLocaleString(),
      change: "",
      icon: User,
      color: "from-red-500 to-red-700",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-600"
    },
    {
      title: "Total Male Disabled",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.total_male_disabled.toLocaleString(),
      change: "",
      icon: Ban,
      color: "from-red-700 to-red-900",
      iconBg: "bg-red-700/10",
      iconColor: "text-red-700"
    },
    {
      title: "Total Female Disabled",
      value: customerStatsLoading || customerStats === null ? "..." : customerStats.total_female_disabled.toLocaleString(),
      change: "",
      icon: Ban,
      color: "from-red-400 to-red-600",
      iconBg: "bg-red-400/10",
      iconColor: "text-red-500"
    }
  ];

  const formattedDate = liveTime.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedTime = liveTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  return (
    <div className="min-h-screen font-inter antialiased text-gray-800">
      <main className="w-full">
        {/* Hero Section */}
        <section className="pt-2 pb-12 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4">
            <h1 className="text-4xl pb-2 sm:text-5xl font-normal tracking-tight text-gray-900 leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-medium">Super Admin</span>
            </h1>
            <div className="text-xl sm:text-xl font-normal text-gray-700 whitespace-nowrap mt-2 sm:mt-0">
              {formattedDate} <span className="text-gray-500 px-1">|</span> {formattedTime}
            </div>
          </div>
          <p className="text-lg text-gray-600 text-center max-w-xl mx-auto opacity-90">
            Your comprehensive overview of system operations and key metrics.
          </p>
        </section>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="my-dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="relative flex gap-2 bg-gray-100/80 backdrop-blur-md rounded-xl mb-12 p-1 max-w-fit mx-auto shadow-lg border border-gray-200">
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-lg shadow-md transition-all duration-500 cubic-bezier-macOS z-0"
              style={{
                width: activeTab === "my-dashboard" ? 'calc(50% - 4px)' : 'calc(50% - 4px)',
                transform: activeTab === "my-dashboard" ? 'translateX(4px)' : 'translateX(calc(100% + 0px))',
              }}
            ></div>
            <TabsTrigger
              value="my-dashboard"
              className="relative z-10 font-medium text-base px-6 py-2 rounded-lg data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600 transition-colors duration-300 ease-in-out hover:text-gray-800"
            >
              My Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="bureau-dashboard"
              className="relative z-10 font-medium text-base px-6 py-2 rounded-lg data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600 transition-colors duration-300 ease-in-out hover:text-gray-800"
            >
              Bureau Dashboard
            </TabsTrigger>
          </TabsList>

          {/* My Dashboard Tab */}
          <TabsContent value="my-dashboard" className="space-y-12 animate-fade-in">
            {/* Stat Cards */}
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {myDashboardStats.map((card, index) => (
                <Card
                  key={index}
                  className="rounded-3xl border border-gray-200 shadow-lg overflow-hidden
                             bg-white/70 backdrop-blur-xl
                             hover:shadow-2xl transition-all duration-300 ease-out
                             relative p-0 group cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  <CardContent className="flex flex-col justify-between h-full p-8 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-base font-medium text-gray-500 block mb-1">{card.title}</span>
                        <h2 className="text-4xl font-normal mt-1 text-gray-900 drop-shadow-sm">
                          {card.value}
                        </h2>
                      </div>
                      <div className={`rounded-full p-3 ${card.iconBg} border border-gray-100 shadow-inner
                                         transform transition-all duration-300 ease-in-out
                                         group-hover:scale-110 group-hover:-translate-y-1`}>
                        <card.icon className={`h-8 w-8 ${card.iconColor}`} strokeWidth={2} />
                      </div>
                    </div>
                    {card.change && (
                      <div className="flex items-center text-sm tracking-wide font-medium space-x-1 animate-pulse-slight text-gray-600">
                        {card.change.includes("+") ? (
                          <ChevronUp className="h-4 w-4 text-green-500" />
                        ) : card.change.includes("Stable") ? (
                          <Sun className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                        )}
                        <span>{card.change}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Yearly and Monthly Revenue Charts */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Yearly Revenue */}
              <Card className="rounded-3xl border border-gray-200 shadow-lg bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800">
                    <CalendarDays className="h-7 w-7 text-indigo-600" />
                    <span>Yearly Revenue</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-base mt-2">Total revenue generated each year</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {revenueReportLoading ? (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">Loading chart...</div>
                  ) : yearlyRevenueChartData.length > 0 ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={yearlyRevenueChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                          <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-600"
                                 tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
                                   formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                          <Bar dataKey="revenue" fill="#6366f1" name="Revenue" barSize={40} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">No yearly revenue data available.</div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Revenue */}
              <Card className="rounded-3xl border border-gray-200 shadow-lg bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800">
                    <Wallet className="h-7 w-7 text-green-500" />
                    <span>Monthly Revenue</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-base mt-2">Revenue generated each month</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {revenueReportLoading ? (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">Loading chart...</div>
                  ) : monthlyRevenueChartData.length > 0 ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyRevenueChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                          <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-600"
                                 tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
                                   formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                          <Bar dataKey="revenue" fill="#10b981" name="Revenue" barSize={40} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">No monthly revenue data available.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Weekly and Employee Revenue Charts */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Weekly Revenue */}
              <Card className="rounded-3xl border border-gray-200 shadow-lg bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800">
                    <CalendarDays className="h-7 w-7 text-orange-500" />
                    <span>Weekly Revenue</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-base mt-2">Revenue generated each week</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {revenueReportLoading ? (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">Loading chart...</div>
                  ) : weeklyRevenueChartData.length > 0 ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={weeklyRevenueChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                          <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-600"
                                 tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
                                   formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                          <Bar dataKey="revenue" fill="#FF9500" name="Revenue" barSize={40} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">No weekly revenue data available.</div>
                  )}
                </CardContent>
              </Card>

              {/* Employee Revenue Distribution */}
              <Card className="rounded-3xl border border-gray-200 shadow-lg bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800">
                    <BriefcaseBusiness className="h-7 w-7 text-purple-600" />
                    <span>Employee Revenue Distribution</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-base mt-2">Distribution of revenue among employees</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {revenueReportLoading ? (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">Loading chart...</div>
                  ) : employeeRevenueChartData.length > 0 ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={employeeRevenueChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            animationDuration={800}
                            animationEasing="ease-out"
                          >
                            {employeeRevenueChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                    className="transition-all duration-300 hover:opacity-80"
                              />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
                                   formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">No employee revenue data available.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bureau Dashboard Tab */}
          <TabsContent value="bureau-dashboard" className="space-y-12 animate-fade-in">
            {/* Stat Cards */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {bureauDashboardStats.map((card, index) => (
                <Card
                  key={index}
                  className="rounded-3xl border border-gray-200 shadow-lg overflow-hidden
                             bg-white/70 backdrop-blur-xl
                             hover:shadow-2xl transition-all duration-300 ease-out
                             relative p-0 group cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-base font-medium text-gray-500">{card.title}</p>
                        <h3 className="text-4xl font-normal mt-1 text-gray-900 drop-shadow-sm">{card.value}</h3>
                      </div>
                      <div className={`rounded-full p-3 ${card.iconBg} border border-gray-100 shadow-inner
                                         transform transition-all duration-300 ease-in-out
                                         group-hover:scale-110 group-hover:-translate-y-1`}>
                        <card.icon className={`h-8 w-8 ${card.iconColor}`} strokeWidth={2} />
                      </div>
                    </div>
                    {card.change && (
                      <div className="flex items-center mt-6 text-base animate-pulse-slight text-gray-600">
                        <div className={`flex items-center font-medium ${
                          card.change.includes("+") ? "text-green-600" : "text-red-600"
                        }`}>
                          {card.change.includes("+") ? (
                            <ChevronUp className="h-5 w-5 mr-1" />
                          ) : (
                            <TrendingUp className="h-5 w-5 mr-1 text-red-500 rotate-180" />
                          )}
                          <span>{card.change}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Gender Distribution Chart */}
              <Card className="rounded-3xl border border-gray-200 shadow-lg bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800">
                    <Users className="h-7 w-7 text-blue-600" />
                    <span>Gender Distribution</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-base mt-2">Total male vs. female customers</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {customerStatsLoading ? (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">Loading chart...</div>
                  ) : genderDistributionData.length > 0 && (customerStats?.total_male_customers > 0 || customerStats?.total_female_customers > 0) ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genderDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            animationDuration={800}
                            animationEasing="ease-out"
                          >
                            {genderDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                    className="transition-all duration-300 hover:opacity-80" />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">No gender distribution data available.</div>
                  )}
                </CardContent>
              </Card>

              {/* Male Customer Status Chart */}
              <Card className="rounded-3xl border border-gray-200 shadow-lg bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800">
                    <User className="h-7 w-7 text-purple-600" />
                    <span>Male Customer Status</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-base mt-2">Live vs. Offline male customers</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {customerStatsLoading ? (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">Loading chart...</div>
                  ) : maleCustomerStatusData.length > 0 && (customerStats?.male_live_customers > 0 || customerStats?.male_offline_customers > 0) ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={maleCustomerStatusData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                          <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                          <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                            contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
                            formatter={(value, name) => [value.toLocaleString(), name]}
                          />
                          <Bar dataKey="live" fill="#22c55e" name="Live Customers" barSize={40} radius={[8, 8, 0, 0]} />
                          <Bar dataKey="offline" fill="#ef4444" name="Offline Customers" barSize={40} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">No male customer status data available.</div>
                  )}
                </CardContent>
              </Card>

              {/* Female Customer Status Chart */}
              <Card className="rounded-3xl border border-gray-200 shadow-lg bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800">
                    <User className="h-7 w-7 text-pink-600" />
                    <span>Female Customer Status</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-base mt-2">Live vs. Offline female customers</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {customerStatsLoading ? (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">Loading chart...</div>
                  ) : femaleCustomerStatusData.length > 0 && (customerStats?.female_live_customers > 0 || customerStats?.female_offline_customers > 0) ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={femaleCustomerStatusData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                          <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                          <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                            contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
                            formatter={(value, name) => [value.toLocaleString(), name]}
                          />
                          <Bar dataKey="live" fill="#22c55e" name="Live Customers" barSize={40} radius={[8, 8, 0, 0]} />
                          <Bar dataKey="offline" fill="#ef4444" name="Offline Customers" barSize={40} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">No female customer status data available.</div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Revenue Trend */}
              <Card className="rounded-3xl border border-gray-200 shadow-lg bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium text-gray-800">
                    <CalendarDays className="h-7 w-7 text-indigo-500" />
                    <span>Weekly Revenue Trend</span>
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-base mt-2">Weekly revenue trend over time</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {revenueReportLoading ? (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">Loading chart...</div>
                  ) : weeklyRevenueChartData.length > 0 ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={weeklyRevenueChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                          <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-600"
                                 tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
                                   formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#007AFF"
                            strokeWidth={4}
                            activeDot={{ r: 8, fill: '#007AFF', stroke: '#fff', strokeWidth: 3 }}
                            dot={{ r: 5, fill: '#007AFF', stroke: '#fff', strokeWidth: 2 }}
                            className="transition-all duration-300"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 w-full flex items-center justify-center text-gray-500">No weekly revenue data available.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;