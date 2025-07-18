import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { IconUserPlus, IconX, IconSearch, IconRefresh } from '@tabler/icons-react';
import { getData, postData } from '../../../store/httpservice';
import { useNavigate } from 'react-router-dom';

const AVATAR_COLOR_PALETTE = [
  ['bg-gradient-to-br from-red-500 to-red-600', 'text-white'],
  ['bg-gradient-to-br from-pink-500 to-pink-600', 'text-white'],
  ['bg-gradient-to-br from-purple-500 to-purple-600', 'text-white'],
  ['bg-gradient-to-br from-indigo-500 to-indigo-600', 'text-white'],
  ['bg-gradient-to-br from-blue-500 to-blue-600', 'text-white'],
  ['bg-gradient-to-br from-cyan-500 to-cyan-600', 'text-white'],
  ['bg-gradient-to-br from-teal-500 to-teal-600', 'text-white'],
  ['bg-gradient-to-br from-green-500 to-green-600', 'text-white'],
  ['bg-gradient-to-br from-lime-500 to-lime-600', 'text-gray-900'],
  ['bg-gradient-to-br from-yellow-500 to-yellow-600', 'text-gray-900'],
  ['bg-gradient-to-br from-amber-500 to-amber-600', 'text-white'],
  ['bg-gradient-to-br from-orange-500 to-orange-600', 'text-white'],
  ['bg-gradient-to-br from-fuchsia-500 to-fuchsia-600', 'text-white'],
  ['bg-gradient-to-br from-emerald-500 to-emerald-600', 'text-white'],
  ['bg-gradient-to-br from-sky-500 to-sky-600', 'text-white'],
];

function AllEmployees() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    mobile_number: '+91', // Prefix with +91
    dob: '',
    address: '',
    emergency_contact: '+91', // Prefix with +91
    password: '',
    confirm_password: '',
    admin_user_id: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  const navigate = useNavigate();

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getData('/employees/');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchAdminUsers = useCallback(async () => {
    try {
      setLoadingAdmins(true);
      const response = await getData('/admins/');
      setAdminUsers(response.data);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const newFilteredEmployees = employees.filter(employee => {
      const displayFullName = employee.full_name || '';
      const fullName = displayFullName.toLowerCase();
      const userId = String(employee.user_id || '').toLowerCase();
      return fullName.includes(lowerCaseQuery) || userId.includes(lowerCaseQuery);
    });
    setFilteredEmployees(newFilteredEmployees);
  }, [employees, searchQuery]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        resetFormDataAndErrors();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      fetchAdminUsers(); // Fetch admins when modal opens
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen, fetchAdminUsers]);

  const resetFormDataAndErrors = () => {
    setFormData({
      email: '',
      full_name: '',
      mobile_number: '+91',
      dob: '',
      address: '',
      emergency_contact: '+91',
      password: '',
      confirm_password: '',
      admin_user_id: '',
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Enforce +91 prefix for mobile and emergency contact
    if (name === 'mobile_number' || name === 'emergency_contact') {
      if (!newValue.startsWith('+91')) {
        newValue = '+91' + newValue.replace(/[^0-9]/g, ''); // Ensure only numbers after +91
      } else {
        newValue = '+91' + newValue.substring(3).replace(/[^0-9]/g, ''); // Keep +91, clean rest
      }
    }

    setFormData({
      ...formData,
      [name]: newValue,
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Password validation feedback
    if (name === 'password' || name === 'confirm_password') {
      validatePassword(name === 'password' ? newValue : formData.password, name === 'confirm_password' ? newValue : formData.confirm_password);
    }
  };

  const validatePassword = (password, confirmPassword) => {
    const newErrors = { ...errors };
    let isValid = true;

    // Clear previous password-related errors first
    newErrors.password = undefined;
    newErrors.confirm_password = undefined;

    // Minimum 8 characters
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
      isValid = false;
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      newErrors.password = newErrors.password ? newErrors.password + ' ' : '';
      newErrors.password += 'Must contain at least one uppercase letter.';
      isValid = false;
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      newErrors.password = newErrors.password ? newErrors.password + ' ' : '';
      newErrors.password += 'Must contain at least one lowercase letter.';
      isValid = false;
    }

    // At least one number
    if (!/[0-9]/.test(password)) {
      newErrors.password = newErrors.password ? newErrors.password + ' ' : '';
      newErrors.password += 'Must contain at least one number.';
      isValid = false;
    }

    // At least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      newErrors.password = newErrors.password ? newErrors.password + ' ' : '';
      newErrors.password += 'Must contain at least one special character.';
      isValid = false;
    }

    // Passwords match
    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirm_password = 'Passwords do not match.';
      isValid = false;
    } else if (!confirmPassword && password) { // Handle confirm_password empty when password is not
        newErrors.confirm_password = 'This field is required.';
        isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear errors at the start of submission

    const isPasswordValid = validatePassword(formData.password, formData.confirm_password);

    // Basic form validation for required fields
    const newErrors = {};
    for (const key in formData) {
      if (typeof formData[key] === 'string' && formData[key].trim() === '') {
        // Specifically check for non-prefix fields or if prefix is the only thing
        if (key === 'mobile_number' && formData[key] === '+91') {
            newErrors[key] = 'Mobile number is required.';
        } else if (key === 'emergency_contact' && formData[key] === '+91') {
            newErrors[key] = 'Emergency contact is required.';
        } else if (key !== 'confirm_password' && key !== 'password' && formData[key].trim() === '') {
            newErrors[key] = 'This field is required.';
        }
      }
    }
    // Specific check for password and confirm password required fields
    if (!formData.password) newErrors.password = 'This field is required.';
    if (!formData.confirm_password) newErrors.confirm_password = 'This field is required.';


    if (Object.keys(newErrors).length > 0 || !isPasswordValid) {
        setErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
        return;
    }

    setSubmitting(true);
    try {
      // Send the entire formData, including confirm_password, as the backend expects it.
      await postData('/employee/create/', formData); 
      setIsModalOpen(false);
      resetFormDataAndErrors();
      fetchEmployees();
    } catch (error) {
      const apiErrors = error.response?.data?.detail || error.response?.data || {};
      setErrors(apiErrors);
      console.error('Error adding employee:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (employee) => {
    if (employee.full_name && employee.full_name.trim() !== '') {
      const parts = employee.full_name.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        return parts[0].charAt(0).toUpperCase();
      }
    }
    return employee.email ? employee.email.charAt(0).toUpperCase() : 'NA'; // Fallback to email initial
  };

  const employeeColors = useMemo(() => {
    const colorsMap = {};
    employees.forEach(employee => {
      const initials = getInitials(employee);
      const firstLetter = initials.charAt(0).toUpperCase();
      const charCode = firstLetter.charCodeAt(0) - 65;
      const colorIndex = (charCode >= 0 && charCode < 26) ? charCode % AVATAR_COLOR_PALETTE.length : 0;
      colorsMap[employee.user_id] = AVATAR_COLOR_PALETTE[colorIndex];
    });
    return colorsMap;
  }, [employees]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    switch (strength) {
      case 0: return { text: '', color: '' };
      case 1:
      case 2: return { text: 'Weak', color: 'text-red-500' };
      case 3: return { text: 'Moderate', color: 'text-orange-500' };
      case 4:
      case 5: return { text: 'Strong', color: 'text-green-500' };
      default: return { text: '', color: '' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <main className="p-0 sm:p-0 bg-gray-50 min-h-screen selection:bg-indigo-600 selection:text-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-6xl mx-auto">
        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-2 px-4 sm:px-0 gap-4 sm:gap-0">
          <h2 className="text-[1.8rem] font-normal tracking-tight text-gray-900 leading-tight dark:text-gray-100">
            All Employees
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by ID or Name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              />
              <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white rounded-xl px-6 py-3 text-base font-normal shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={refreshing}
            >
              {refreshing ? (
                <span className="animate-spin h-5 w-5 border-2 border-t-2 border-white rounded-full"></span>
              ) : (
                <IconRefresh size={22} />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {/* Add Employee Button */}
            <button
              onClick={() => {
                resetFormDataAndErrors();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl px-6 py-3 text-base font-normal shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto"
            >
              <IconUserPlus size={22} />
              Add Employee
            </button>
          </div>
        </div>

        {/* Employees Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-0">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee, index) => {
                const [bgColorClass, textColorClass] = employeeColors[employee.user_id] || ['bg-gray-400', 'text-gray-900'];

                return (
                  <div
                    key={employee.user_id}
                    className="employee-card rounded-xl bg-white p-6 flex items-start cursor-pointer min-h-[140px] border border-gray-100 relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:rotate-z-1 dark:bg-gray-800 dark:border-gray-700"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => navigate(`/dashboard/superadmin/employee/${employee.user_id}`)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 dark:from-gray-700 dark:to-gray-800"></div>
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300 rounded-xl transition-all duration-300 z-10"></div>

                    <div className="flex-grow flex items-start z-20">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-xl font-normal shadow-md mr-4 ${bgColorClass} ${textColorClass}`}>
                        {getInitials(employee)}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm text-gray-500 mb-1 font-normal dark:text-gray-400">ID: {employee.user_id}</p>
                        <p className="text-lg font-normal text-gray-800 mb-1 leading-tight dark:text-gray-100">
                          {employee.full_name || 'N/A'}
                        </p>
                        {employee.email && (
                          <p className="text-gray-600 text-sm truncate dark:text-gray-300">{employee.email}</p>
                        )}
                        {employee.mobile_number && (
                          <p className="text-gray-600 text-sm mt-1 dark:text-gray-300">{employee.mobile_number}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-600 text-lg py-10 dark:text-gray-400">
                No employees found matching your search.
              </div>
            )}
          </div>
        )}

        {/* Add Employee Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-4 transition-opacity duration-300 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 relative shadow-2xl ring-1 ring-gray-900/5 animate-modal-slide-down dark:bg-gray-800 dark:ring-gray-700">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetFormDataAndErrors();
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors duration-200 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close modal"
              >
                <IconX size={24} stroke={1.5} />
              </button>
              <h3 className="text-2xl mb-6 text-gray-900 leading-tight dark:text-gray-100 text-center">
                Add New Employee
              </h3>
              <form
                onSubmit={handleAddEmployee}
                className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              >
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.full_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label htmlFor="mobile_number" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Mobile Number
                  </label>
                  <input
                    id="mobile_number"
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.mobile_number && (
                    <p className="text-xs text-red-600 mt-1">{errors.mobile_number}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dob" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Date of Birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.dob && (
                    <p className="text-xs text-red-600 mt-1">{errors.dob}</p>
                  )}
                </div>

                {/* Emergency Contact */}
                <div>
                  <label htmlFor="emergency_contact" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Emergency Contact
                  </label>
                  <input
                    id="emergency_contact"
                    type="tel"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.emergency_contact && (
                    <p className="text-xs text-red-600 mt-1">{errors.emergency_contact}</p>
                  )}
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600 mt-1">{errors.address}</p>
                  )}
                </div>

                {/* Admin User ID */}
                <div>
                  <label htmlFor="admin_user_id" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Admin User
                  </label>
                  {loadingAdmins ? (
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm flex items-center justify-center dark:bg-gray-700 dark:border-gray-600">
                      <span className="animate-spin h-4 w-4 border-2 border-t-2 border-indigo-600 rounded-full"></span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">Loading Admins...</span>
                    </div>
                  ) : (
                    <select
                      id="admin_user_id"
                      name="admin_user_id"
                      value={formData.admin_user_id}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      required
                    >
                      <option value="">Select an Admin</option>
                      {adminUsers.map(admin => (
                        <option key={admin.user_id} value={admin.user_id}>
                          {admin.full_name || `Admin ID: ${admin.user_id}`}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.admin_user_id && (
                    <p className="text-xs text-red-600 mt-1">{errors.admin_user_id}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {formData.password && (
                    <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                      Password Strength: {passwordStrength.text}
                    </p>
                  )}
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.confirm_password && (
                    <p className="text-xs text-red-600 mt-1">{errors.confirm_password}</p>
                  )}
                </div>

                <div className="flex justify-end pt-3 sm:col-span-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-normal text-base hover:bg-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="animate-spin h-5 w-5 border-2 border-t-2 border-white rounded-full inline-block mr-2"></span>
                    ) : null}
                    {submitting ? 'Adding Employee...' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .animate-fadein {
          animation: fadein 0.25s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadein {
          0% { opacity: 0; transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }

        .animate-modal-slide-down {
          animation: modalSlideDown 0.3s ease-out forwards;
        }

        @keyframes modalSlideDown {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .employee-card {
          opacity: 0;
          transform: translateY(20px);
          animation: cardEnter 0.4s ease-out forwards;
        }

        @keyframes cardEnter {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Adjusted for smoother effect */
        .hover\\:rotate-z-1:hover {
          transform: translateY(-4px) rotateZ(0.5deg);
        }

        /* Basic spinner for refresh button */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </main>
  );
}

export default AllEmployees;