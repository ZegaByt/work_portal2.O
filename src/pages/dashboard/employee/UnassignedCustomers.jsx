import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { getData } from "../../../store/httpservice";
import axios from "../../../store/axios";
import { toast } from "sonner";
import { FiUserPlus, FiLoader, FiArrowLeft } from "react-icons/fi";
import Cookies from "js-cookie";

const UnassignedCustomers = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigningIds, setAssigningIds] = useState(new Set());

  const ASSIGN_CUSTOMER_URL = `${import.meta.env.VITE_BASE_URL}/customers/assign/`;

  // Fetch unassigned customers
  const fetchUnassignedCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getData("/customers/unassigned/");
      console.log("Unassigned customers API response:", response.data);
      const data = response.data.results || response.data;
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        console.error("Unexpected API response format:", response.data);
        setError("Unexpected data format for customers.");
        setCustomers([]);
      }
    } catch (err) {
      console.error("Failed to fetch unassigned customers:", err);
      setError("Failed to load unassigned customers. Please try again.");
      setCustomers([]);
      if (err.response?.status === 401) {
        toast.error("Please log in to access this page.");
        logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, logout, isAuthenticated]);

  // Handle assigning customer to self
  const handleAssignCustomer = useCallback(
    async (customerUserId, e) => {
      e.stopPropagation();
      console.log("Assign button clicked for customer:", customerUserId);
      if (!window.confirm("Are you sure you want to assign this customer to yourself?")) {
        return;
      }

      setAssigningIds((prev) => new Set(prev).add(customerUserId));
      try {
        const token = Cookies.get("accessToken");
        console.log("Access token:", token);
        if (!token || !isAuthenticated) {
          throw new Error("No authentication token found. Please log in.");
        }

        const payload = { customer_user_id: customerUserId, employee_user_id: user.id };
        console.log("Assign payload:", payload);
        const response = await axios.post(ASSIGN_CUSTOMER_URL, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Assign API response:", response.data);

        toast.success(`Customer ${customerUserId} assigned successfully!`, {
          duration: 4000,
          position: "top-center",
          style: {
            background: "#ffffff",
            color: "#333333",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          },
        });

        await fetchUnassignedCustomers();
      } catch (err) {
        console.error("Failed to assign customer:", err);
        const errorMessage =
          err.response?.data?.detail || err.message || "Failed to assign customer.";
        console.error("Error details:", err.response?.data);
        toast.error(errorMessage, {
          duration: 4000,
          position: "top-center",
          style: {
            background: "#ffffff",
            color: "#333333",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          },
        });
      } finally {
        setAssigningIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(customerUserId);
          return newSet;
        });
      }
    },
    [user, fetchUnassignedCustomers, isAuthenticated]
  );

  useEffect(() => {
    console.log("Current user:", user, "IsAuthenticated:", isAuthenticated);
    if (!isAuthenticated || !user) {
      toast.error("Please log in to access this page.");
      logout();
      navigate("/login");
    } else {
      fetchUnassignedCustomers();
    }
  }, [user, isAuthenticated, logout, navigate, fetchUnassignedCustomers]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="flex items-center space-x-2">
          <FiLoader className="animate-spin text-blue-600 text-2xl" />
          <p className="text-gray-600 text-lg font-semibold">Loading unassigned customers...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center shadow-md">
          <p className="text-red-600 text-lg font-semibold">{error}</p>
          <button
            onClick={fetchUnassignedCustomers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard/employee")}
          className="mb-6 flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all shadow-sm text-sm font-medium"
        >
          <FiArrowLeft className="mr-2" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Unassigned Customers
          </h1>
        </div>

        {/* Customer List */}
        {customers.length === 0 ? (
          <div className="bg-white/30 backdrop-blur-md border border-gray-100 rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg font-medium">No unassigned customers found.</p>
            <p className="text-gray-500 text-sm mt-2">All customers may already be assigned to employees.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => {
              // Determine avatar letter and gradient based on gender
              const avatarLetter = customer.full_name ? customer.full_name.charAt(0).toUpperCase() : "U";
              const getAvatarGradient = (gender) => {
                switch (gender?.toLowerCase()) {
                  case "male":
                    return "from-blue-500 to-indigo-600";
                  case "female":
                    return "from-pink-500 to-purple-600";
                  default:
                    return "from-gray-500 to-gray-700";
                }
              };

              return (
                <div
                  key={customer.user_id}
                  className="bg-white/30 backdrop-blur-md border border-gray-100 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => navigate(`/dashboard/employee/customer/${customer.user_id}`)}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    {customer.profile_photos ? (
                      <img
                        src={`${import.meta.env.VITE_BASE_MEDIA_URL}${customer.profile_photos}`}
                        alt={`${customer.full_name || "Customer"}'s profile`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          e.target.src = "/assets/images/default-avatar.png";
                          e.target.onerror = null;
                        }}
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${getAvatarGradient(customer.gender)} shadow-sm`}
                      >
                        {avatarLetter}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 truncate">
                        {customer.full_name || "Unknown"}
                      </h2>
                      <p className="text-sm text-gray-500">{customer.user_id}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Gender:</span>{" "}
                      <span className="capitalize">{customer.gender || "N/A"}</span>
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.account_status
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {customer.account_status ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.profile_verified
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {customer.profile_verified ? "Verified" : "Not Verified"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleAssignCustomer(customer.user_id, e)}
                    disabled={assigningIds.has(customer.user_id)}
                    className={`mt-4 w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      assigningIds.has(customer.user_id)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {assigningIds.has(customer.user_id) ? (
                      <FiLoader className="animate-spin mr-2" />
                    ) : (
                      <FiUserPlus className="mr-2" />
                    )}
                    Assign to Me
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default UnassignedCustomers;