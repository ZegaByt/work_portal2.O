import React, { useState, useEffect, useCallback } from 'react';
import { IconUserScan, IconBriefcase, IconMail, IconPhone, IconCalendarEvent, IconMapPin, IconSchool, IconUsers, IconAlertCircle, IconLoader, IconUserShield, IconArrowLeft, IconUserCircle, IconChevronDown, IconCheck, IconSearch } from '@tabler/icons-react';
import { getData, patchData } from '../../../store/httpservice';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';

// [Previous imports and helper functions (ProfileAvatar, FormField, etc.) remain unchanged]

// Define a professional and versatile color palette for avatars
const AVATAR_COLOR_PALETTE = [
  ['bg-blue-600', 'text-white'],
  ['bg-indigo-600', 'text-white'],
  ['bg-purple-600', 'text-white'],
  ['bg-teal-600', 'text-white'],
  ['bg-green-600', 'text-white'],
  ['bg-cyan-600', 'text-white'],
  ['bg-red-600', 'text-white'],
  ['bg-pink-600', 'text-white'],
  ['bg-orange-600', 'text-white'],
  ['bg-emerald-600', 'text-white'],
];

// Configure your backend's base URL for static media files
const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL ;

// Helper function to get initials for avatars
const getInitials = (person) => {
  const nameToUse = person.full_name && person.full_name.trim() !== ''
    ? person.full_name
    : (person.first_name && person.surname ? `${person.first_name} ${person.surname}` : '');

  if (!nameToUse) return '??';

  const parts = nameToUse.trim().split(' ');
  if (parts.length > 1) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].charAt(0).toUpperCase();
  }
  return '??';
};

// ProfileAvatar Component
const ProfileAvatar = ({ person, sizeClass, bgColorClass, textColorClass, isCustomer = false }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [person]);

  const imageUrl = isCustomer
    ? person.profile_photos ? `${BASE_URL}${person.profile_photos}` : null
    : person.image ? `${BASE_URL}${person.image}` : null;

  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={`${person.full_name || 'Profile'}'s avatar`}
        className={`object-cover rounded-full border border-gray-200 dark:border-gray-600 shadow-md ${sizeClass}`}
        onError={() => setImageError(true)}
      />
    );
  } else {
    const initials = getInitials(person);
    const firstLetter = initials.charAt(0).toUpperCase();
    const charCode = firstLetter.charCodeAt(0) - 65;
    const colorIndex = charCode >= 0 && charCode < 26 ? charCode % AVATAR_COLOR_PALETTE.length : 0;
    const [defaultBgClass, defaultTextColorClass] = AVATAR_COLOR_PALETTE[colorIndex];

    return (
      <div className={`flex items-center justify-center rounded-full font-bold ${sizeClass} ${bgColorClass || defaultBgClass} ${textColorClass || defaultTextColorClass}`}>
        {initials}
      </div>
    );
  }
};

// FormField Component for Employee Dropdown
const FormField = ({ label, name, value, onChange, options, disabled, error, currentEmployeeId }) => {
  const commonClasses = `w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300`;
  const errorBorder = 'border-red-500';
  const labelClasses = 'block text-sm font-semibold mb-1 text-gray-700 capitalize';

  // Filter out the current employee from options
  const filteredOptions = options.filter(option => option.user_id !== currentEmployeeId);

  return (
    <div className="relative">
      <label htmlFor={name} className={labelClasses}>{label}</label>
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        disabled={disabled || filteredOptions.length === 0}
        className={`${commonClasses} appearance-none bg-white ${error ? errorBorder : 'border-gray-200'} ${filteredOptions.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">Select {label}</option>
        {filteredOptions.map((option) => (
          <option key={option.user_id} value={option.user_id}>
            {option.full_name || 'N/A'}
          </option>
        ))}
      </select>
      <IconChevronDown className="absolute right-3 top-1/2 translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
      {error && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><IconAlertCircle size={14} />{error}</p>}
      {filteredOptions.length === 0 && (
        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
          <IconAlertCircle size={14} /> No other employees available to reassign.
        </p>
      )}
    </div>
  );
};

const MyEmployees = () => {
  const { isAuthenticated, user } = useAuth();
  const [adminDetails, setAdminDetails] = useState(null);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState(''); // New state for customer search
  const [filteredCustomers, setFilteredCustomers] = useState([]); // New state for filtered customers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [loadingEmployeeCustomers, setLoadingEmployeeCustomers] = useState(false);
  const [employeeCustomersError, setEmployeeCustomersError] = useState(null);
  const [reassigningCustomer, setReassigningCustomer] = useState({});

  if (!isAuthenticated || !user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-red-600 dark:text-red-400 font-sans flex items-center justify-center">
        <IconAlertCircle className="h-8 w-8 mr-3" />
        <p className="text-lg">Error: User not authenticated or invalid user ID.</p>
      </div>
    );
  }

  const ADMIN_USER_ID = user.id;
  const ADMIN_API_ENDPOINT = `/admin/${ADMIN_USER_ID}/`;

  const fetchAdminAndEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getData(ADMIN_API_ENDPOINT);
      if (response && response.data) {
        setAdminDetails(response.data.admin_details);
        setAssignedEmployees(response.data.assigned_employees || []);
        setFilteredEmployees(response.data.assigned_employees || []);
        toast.success("Admin and employee list loaded successfully!", { duration: 2000 });
      } else {
        throw new Error("Invalid response format for admin details.");
      }
    } catch (err) {
      console.error("Error fetching admin details:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch admin and employee details.";
      setError(errorMessage);
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, [ADMIN_API_ENDPOINT]);

  const fetchEmployeeCustomers = useCallback(async (employeeId) => {
    setLoadingEmployeeCustomers(true);
    setEmployeeCustomersError(null);
    try {
      const EMP_API_ENDPOINT = `/employee/${employeeId}/`;
      const response = await getData(EMP_API_ENDPOINT);
      if (response && response.data) {
        setSelectedEmployeeData(response.data);
        setFilteredCustomers(response.data.assigned_customers || []); // Initialize filtered customers
        toast.success(`Customers for ${response.data.employee_details.full_name} loaded!`, { duration: 2000 });
      } else {
        throw new Error("Invalid response format for employee customers.");
      }
    } catch (err) {
      console.error("Error fetching employee customers:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch employee's customer details.";
      setEmployeeCustomersError(errorMessage);
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoadingEmployeeCustomers(false);
    }
  }, []);

  const handleReassignEmployee = useCallback(async (customerId, employeeId, customerName, currentEmployeeId) => {
    if (!customerId) {
      toast.error("Invalid customer ID.", { duration: 3000 });
      return;
    }
    if (!employeeId) {
      toast.error("Please select an employee.", { duration: 3000 });
      return;
    }
    if (employeeId === currentEmployeeId) {
      toast.info("Customer is already assigned to this employee.", { duration: 3000 });
      return;
    }

    const targetEmployee = assignedEmployees.find(emp => emp.user_id === employeeId);
    const targetEmployeeName = targetEmployee?.full_name || 'the selected employee';

    if (window.confirm(`Are you sure you want to reassign ${customerName || 'this customer'} to ${targetEmployeeName}?`)) {
      setReassigningCustomer((prev) => ({ ...prev, [customerId]: true }));
      try {
        await patchData(`/customer/${customerId}/`, { assigned_employee: employeeId });
        await fetchEmployeeCustomers(selectedEmployeeId);
        toast.success(`Customer ${customerName || customerId} reassigned to ${targetEmployeeName}!`, { duration: 2000 });
      } catch (err) {
        console.error("Error reassigning customer:", err);
        const errorMessage = err.response?.data?.detail || err.message || "Failed to reassign customer.";
        toast.error(errorMessage, { duration: 3000 });
      } finally {
        setReassigningCustomer((prev) => ({ ...prev, [customerId]: false }));
      }
    }
  }, [fetchEmployeeCustomers, selectedEmployeeId, assignedEmployees]);

  // Filter employees based on search query
  useEffect(() => {
    const lowerCaseQuery = employeeSearchQuery.toLowerCase();
    const filtered = assignedEmployees.filter(employee => {
      const fullName = (employee.full_name || '').toLowerCase();
      const userId = (employee.user_id || '').toLowerCase();
      return fullName.includes(lowerCaseQuery) || userId.includes(lowerCaseQuery);
    });
    setFilteredEmployees(filtered);
  }, [employeeSearchQuery, assignedEmployees]);

  // Filter customers based on search query
  useEffect(() => {
    if (!selectedEmployeeData?.assigned_customers) {
      setFilteredCustomers([]);
      return;
    }
    const lowerCaseQuery = customerSearchQuery.toLowerCase();
    const filtered = selectedEmployeeData.assigned_customers.filter(customer => {
      const fullName = (customer.full_name || '').toLowerCase();
      const userId = (customer.user_id || '').toLowerCase();
      const gender = (customer.gender || '').toLowerCase();
      return fullName.includes(lowerCaseQuery) || userId.includes(lowerCaseQuery) || gender.includes(lowerCaseQuery);
    });
    setFilteredCustomers(filtered);
  }, [customerSearchQuery, selectedEmployeeData]);

  useEffect(() => {
    fetchAdminAndEmployees();
  }, [fetchAdminAndEmployees]);

  const handleEmployeeCardClick = (employeeId) => {
    if (!employeeId) {
      toast.error("Invalid employee ID.", { duration: 3000 });
      return;
    }
    setSelectedEmployeeId(employeeId);
    setCustomerSearchQuery(''); // Reset customer search when selecting a new employee
    fetchEmployeeCustomers(employeeId);
  };

  const handleBackToEmployees = () => {
    setSelectedEmployeeId(null);
    setSelectedEmployeeData(null);
    setEmployeeCustomersError(null);
    setReassigningCustomer({});
    setCustomerSearchQuery(''); // Reset customer search
    setFilteredCustomers([]); // Reset filtered customers
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-sans flex items-center justify-center">
        <IconLoader className="animate-spin h-8 w-8 text-blue-500 mr-3" />
        <p className="text-lg">Loading employee data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-red-600 dark:text-red-400 font-sans flex items-center justify-center">
        <IconAlertCircle className="h-8 w-8 mr-3" />
        <p className="text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans p-0 sm:p-0">
      <div className="w-full mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100 flex items-center justify-center">
          <IconBriefcase className="inline-block mr-3 h-8 w-8 text-blue-500 dark:text-blue-400" />
          <span className="tracking-wide">MY EMPLOYEES DASHBOARD</span>
          <IconUsers className="inline-block ml-3 h-8 w-8 text-green-500 dark:text-green-400" />
        </h1>

        {adminDetails && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-5 flex items-center text-blue-700 dark:text-blue-400">
              <IconUserShield className="mr-2 text-yellow-600 dark:text-yellow-400" />
              ADMINISTRATOR PROFILE
            </h2>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-shrink-0">
                <ProfileAvatar
                  person={adminDetails}
                  sizeClass="w-28 h-28 text-4xl"
                  bgColorClass="bg-blue-600"
                  textColorClass="text-white"
                />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{adminDetails.full_name || 'N/A'}</h3>
                <p className="text-md text-gray-600 dark:text-gray-300 mb-2">User ID: <span className="text-blue-500 dark:text-blue-300 font-medium">{adminDetails.user_id || 'N/A'}</span></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p className="flex items-center">
                    <IconMail size={16} className="mr-2 text-gray-500 dark:text-gray-500" /> {adminDetails.email || 'N/A'}
                  </p>
                  <p className="flex items-center">
                    <IconPhone size={16} className="mr-2 text-gray-500 dark:text-gray-500" /> {adminDetails.mobile_number || 'N/A'}
                  </p>
                  <p className="flex items-center">
                    <IconCalendarEvent size={16} className="mr-2 text-gray-500 dark:text-gray-500" /> DOB: {adminDetails.dob || 'N/A'}
                  </p>
                  <p className="flex items-center">
                    <IconMapPin size={16} className="mr-2 text-gray-500 dark:text-gray-500" /> Address: {adminDetails.address || 'N/A'}
                  </p>
                  <p className="flex items-center col-span-full">
                    <IconSchool size={16} className="mr-2 text-gray-500 dark:text-gray-500" /> Education: {adminDetails.education || 'N/A'}
                  </p>
                </div>
                <p className="text-sm mt-3">
                  Status: <span className={`font-semibold ${adminDetails.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{adminDetails.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {!selectedEmployeeId ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold flex items-center text-purple-700 dark:text-purple-400">
                <IconUsers className="mr-2 text-blue-500 dark:text-blue-400" />
                ASSIGNED EMPLOYEES ({filteredEmployees.length})
              </h2>
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search employees by name or ID..."
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 text-gray-800 text-sm"
                />
                <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {filteredEmployees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEmployees.map((employee) => (
                  <button
                    key={employee.user_id}
                    onClick={() => handleEmployeeCardClick(employee.user_id)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-4 flex items-center space-x-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 text-left"
                  >
                    <ProfileAvatar
                      person={employee}
                      sizeClass="w-14 h-14 text-lg"
                    />
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{employee.full_name || 'N/A'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">ID: {employee.user_id || 'N/A'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <IconPhone size={14} className="mr-1 text-gray-500 dark:text-gray-400" />
                        Mobile: <span className="ml-1">{employee.mobile_number || 'N/A'}</span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <IconCheck size={14} className="mr-1 text-blue-500 dark:text-blue-400" />
                        Customers: <span className="font-bold ml-1">{employee.customer_count !== undefined ? employee.customer_count : 'N/A'}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600 dark:text-gray-400 text-base py-8">
                No employees found matching your search.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6">
            <button
              onClick={handleBackToEmployees}
              className="mb-6 flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 font-medium"
            >
              <IconArrowLeft className="mr-2" size={20} /> Back to Employees
            </button>

            {loadingEmployeeCustomers ? (
              <div className="flex items-center justify-center py-10">
                <IconLoader className="animate-spin h-8 w-8 text-blue-500 mr-3" />
                <p className="text-lg text-gray-700 dark:text-gray-300">Loading employee's customers...</p>
              </div>
            ) : employeeCustomersError ? (
              <div className="text-center text-red-600 dark:text-red-400 text-lg py-10">
                <IconAlertCircle className="h-8 w-8 mx-auto mb-2" />
                Error: {employeeCustomersError}
              </div>
            ) : selectedEmployeeData && selectedEmployeeData.employee_details ? (
              <>
                <h2 className="text-xl font-semibold mb-5 flex items-center text-purple-700 dark:text-purple-400">
                  <IconUserScan className="mr-2 text-cyan-500 dark:text-cyan-400" />
                  {selectedEmployeeData.employee_details.full_name || 'Employee'}'s Customers
                </h2>

                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-4 mb-6 flex items-center space-x-4 shadow-sm">
                  <ProfileAvatar
                    person={selectedEmployeeData.employee_details}
                    sizeClass="w-16 h-16 text-xl"
                  />
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{selectedEmployeeData.employee_details.full_name || 'N/A'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">ID: {selectedEmployeeData.employee_details.user_id || 'N/A'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <IconMail size={14} className="mr-1 text-gray-400 dark:text-gray-500" /> {selectedEmployeeData.employee_details.email || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Customer Search Bar */}
                <div className="relative w-full sm:w-80 mb-6">
                  <input
                    type="text"
                    placeholder="Search customers by name, ID, or gender..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 text-gray-800 text-sm"
                  />
                  <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                {filteredCustomers && filteredCustomers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCustomers.map((customer) => (
                      customer.user_id ? (
                        <div
                          key={customer.user_id}
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-4 flex items-center space-x-4 shadow-sm"
                        >
                          <ProfileAvatar
                            person={customer}
                            sizeClass="w-14 h-14 text-lg"
                            isCustomer={true}
                          />
                          <div className="flex-grow">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{customer.full_name || 'N/A'}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">ID: {customer.user_id || 'N/A'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <IconUserCircle size={14} className="mr-1 text-gray-400 dark:text-gray-500" /> Gender: {customer.gender || 'N/A'}
                            </p>
                            <p className="text-sm mt-1">
                              Payment: <span className={`font-semibold ${customer.payment_status === 'Paid' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{customer.payment_status || 'N/A'}</span>
                            </p>
                            <div className="mt-2">
                              <FormField
                                label="Assigned Employee"
                                name="assigned_employee"
                                value={customer.assigned_employee?.user_id || customer.assigned_employee || ''}
                                onChange={(name, value) => handleReassignEmployee(customer.user_id, value, customer.full_name, customer.assigned_employee?.user_id || customer.assigned_employee)}
                                options={assignedEmployees}
                                disabled={reassigningCustomer[customer.user_id]}
                                error={null}
                                currentEmployeeId={customer.assigned_employee?.user_id || customer.assigned_employee}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={Math.random()}
                          className="text-center text-red-600 dark:text-red-400 text-base py-4"
                        >
                          Invalid customer data (missing user_id).
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 dark:text-gray-400 text-base py-8">
                    No customers found matching your search.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-600 dark:text-gray-400 text-base py-8">
                Employee details not found.
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f9fafb;
        }

        .font-sans {
          font-family: 'Inter', sans-serif;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #e0e0e0;
          border-radius: 10px;
        }
        .dark ::-webkit-scrollbar-track {
          background: #333;
        }
        ::-webkit-scrollbar-thumb {
          background: #a0a0a0;
          border-radius: 10px;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #606060;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #909090;
        }
      `}</style>
    </div>
  );
};

export default MyEmployees;