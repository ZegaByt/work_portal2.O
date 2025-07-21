import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { getData } from "../../../store/httpService";
import axios from "../../../store/axios";
import { toast } from "sonner";
import { FiUserPlus, FiArrowLeft, FiSearch } from "react-icons/fi"; // Removed FiLoader
import Cookies from "js-cookie";

// Skeleton component for loading state
const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-md p-4 animate-pulse border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
    <div className="flex items-center space-x-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 dark:bg-gray-700"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
      </div>
    </div>
    <div className="space-y-1 text-sm">
      <div className="h-3 bg-gray-200 rounded w-2/3 dark:bg-gray-700"></div>
      <div className="flex gap-2 mt-1">
        <div className="h-5 bg-gray-200 rounded-full w-1/4 dark:bg-gray-700"></div>
        <div className="h-5 bg-gray-200 rounded-full w-1/4 dark:bg-gray-700"></div>
      </div>
    </div>
    <div className="h-9 bg-gray-200 rounded-lg mt-4 w-full dark:bg-gray-700"></div>
  </div>
);

const UnAssignedCustomers = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigningIds, setAssigningIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filtered customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      customer.full_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      customer.user_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
      customer.gender?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-slate-950 p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center shadow-md dark:bg-red-950 dark:border-red-800">
          <p className="text-red-600 dark:text-red-100 text-lg font-semibold">{error}</p>
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
    <main className="min-h-screen  px-0 sm:px-0 lg:px-0 py-0">
      <div className="max-w-7xl mx-auto">
       
        {/* Header with Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-normal text-gray-900 dark:text-gray-100 tracking-tight flex-shrink-0">
            Unassigned Customers
          </h1>
          <div className="relative w-full sm:w-auto sm:min-w-[250px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or gender"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Customer List or Skeleton Loader */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">No unassigned customers found matching your search.</p>
            {searchTerm && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Try adjusting your search terms or check if all customers are assigned.</p>
            )}
            {!searchTerm && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">All customers may already be assigned to employees.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => {
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
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  onClick={() => navigate(`/dashboard/employee/customer/${customer.user_id}`)}
                >
                  <div className="flex items-center space-x-3 mb-3"> {/* Adjusted space-x and mb */}
                    {customer.profile_photos ? (
                      <img
                        src={`${import.meta.env.VITE_BASE_MEDIA_URL}${customer.profile_photos}`}
                        alt={`${customer.full_name || "Customer"}'s profile`}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
                        onError={(e) => {
                          e.target.src = "/assets/images/default-avatar.png";
                          e.target.onerror = null;
                        }}
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white ${getAvatarGradient(customer.gender)} shadow-sm`} 
                      >
                        {avatarLetter}
                      </div>
                    )}
                    <div>
                      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate"> {/* Adjusted text-lg to text-base */}
                        {customer.full_name || "Unknown"}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{customer.user_id}</p> {/* Adjusted text-sm to text-xs */}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs"> {/* Adjusted text-sm to text-xs */}
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Gender:</span>{" "}
                      <span className="capitalize">{customer.gender || "N/A"}</span>
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.account_status
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {customer.account_status ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.profile_verified
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
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
                    className={`mt-4 w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${ // Adjusted px/py
                      assigningIds.has(customer.user_id)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300"
                        : "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    }`}
                  >
                    {assigningIds.has(customer.user_id) ? (
                      <span className="animate-spin mr-2">🔄</span> // Simple spinner for assign button
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

export default UnAssignedCustomers;