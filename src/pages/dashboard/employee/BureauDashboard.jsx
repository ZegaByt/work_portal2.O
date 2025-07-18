import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, User, FileText, UserCheck, UserX } from "lucide-react"; // Added UserX for offline/disabled
import { getData } from "../../../store/httpservice";
import Cookies from "js-cookie";
import { toast } from "sonner";

// Define COLORS for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

// Error Boundary Component (copied from Dashboard.jsx for consistency)
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

const BureauDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBureauStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The accessToken is automatically attached by the Axios interceptor
      // in httpService, so no need to pass it explicitly here.
      // Also removed the timeout as it's handled globally or can be added if specific to this call.
      const response = await getData("customers/statistics/");
        
      if (response && response.data) {
        
        setStatistics(response.data);
      } else {
        throw new Error("Invalid statistics data structure received.");
      }
    } catch (err) {
      console.error("Bureau Statistics Fetch Error:", {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage = err.response?.data?.detail || err.message || "Failed to load bureau statistics.";
      setError(errorMessage);
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBureauStatistics();
  }, [fetchBureauStatistics]);

  // Prepare data for charts
  const genderDistributionData = statistics ? [
    { name: "Male", value: statistics.total_male_customers, color: "#3b82f6" }, // Blue
    { name: "Female", value: statistics.total_female_customers, color: "#ec4899" }, // Pink
  ] : [];

  const maleCustomerStatusData = statistics ? [
    { name: "Male Live", value: statistics.male_live_customers, color: "#22c55e" }, // Green
    { name: "Male Offline", value: statistics.male_offline_customers, color: "#ef4444" }, // Red
  ] : [];

  const femaleCustomerStatusData = statistics ? [
    { name: "Female Live", value: statistics.female_live_customers, color: "#22c55e" }, // Green
    { name: "Female Offline", value: statistics.female_offline_customers, color: "#ef4444" }, // Red
  ] : [];

  // Define stats cards based on fetched data
  const bureauStatsCards = [
    {
      title: "Total Customers",
      value: loading ? "..." : (statistics?.total_customers || 0).toLocaleString(),
      icon: Users,
      color: "bg-gradient-to-br from-teal-500 to-teal-700",
    },
    {
      title: "Male Customers",
      value: loading ? "..." : (statistics?.total_male_customers || 0).toLocaleString(),
      icon: User,
      color: "bg-gradient-to-br from-purple-500 to-purple-700",
    },
    {
      title: "Female Customers",
      value: loading ? "..." : (statistics?.total_female_customers || 0).toLocaleString(),
      icon: User,
      color: "bg-gradient-to-br from-pink-500 to-pink-700",
    },
    {
      title: "Disabled Customers",
      value: loading ? "..." : (statistics?.total_disabled_customers || 0).toLocaleString(),
      icon: FileText, // Using FileText for consistency with "Deleted Profiles" in old dashboard
      color: "bg-gradient-to-br from-gray-600 to-gray-800",
    },
    // New cards added below
    {
      title: "Male Live Customers",
      value: loading ? "..." : (statistics?.male_live_customers || 0).toLocaleString(),
      icon: UserCheck,
      color: "bg-gradient-to-br from-green-500 to-green-700", // Green for live
    },
    {
      title: "Male Offline Customers",
      value: loading ? "..." : (statistics?.male_offline_customers || 0).toLocaleString(),
      icon: UserX,
      color: "bg-gradient-to-br from-orange-500 to-orange-700", // Orange for offline
    },
    {
      title: "Female Live Customers",
      value: loading ? "..." : (statistics?.female_live_customers || 0).toLocaleString(),
      icon: UserCheck,
      color: "bg-gradient-to-br from-blue-500 to-blue-700", // Blue for live
    },
    {
      title: "Female Offline Customers",
      value: loading ? "..." : (statistics?.female_offline_customers || 0).toLocaleString(),
      icon: UserX,
      color: "bg-gradient-to-br from-red-500 to-red-700", // Red for offline
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg">Loading bureau dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <p className="text-red-600 font-medium text-lg">Error: {error}</p>
          <button
            onClick={fetchBureauStatistics}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-800 mb-6">Bureau Overview</h2>

        {/* Bureau Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {bureauStatsCards.map((card, index) => (
            <Card key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900">{card.value}</h3>
                  </div>
                  <div className={`rounded-full p-3 ${card.color} shadow-md`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Gender Distribution Chart */}
          <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Gender Distribution</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Total male vs. female customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {genderDistributionData.length > 0 && (statistics?.total_male_customers > 0 || statistics?.total_female_customers > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {genderDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No gender distribution data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Male Customer Status Chart */}
          <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <User className="h-5 w-5 text-purple-600" />
                <span>Male Customer Status</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Live vs. Offline male customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {maleCustomerStatusData.length > 0 && (statistics?.male_live_customers > 0 || statistics?.male_offline_customers > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maleCustomerStatusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                      <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="value" name="Customers" radius={[4, 4, 0, 0]}>
                        {maleCustomerStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No male customer status data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Female Customer Status Chart */}
          <Card className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <User className="h-5 w-5 text-pink-600" />
                <span>Female Customer Status</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Live vs. Offline female customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {femaleCustomerStatusData.length > 0 && (statistics?.female_live_customers > 0 || statistics?.female_offline_customers > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={femaleCustomerStatusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                      <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-500" />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="value" name="Customers" radius={[4, 4, 0, 0]}>
                        {femaleCustomerStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No female customer status data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BureauDashboard;
