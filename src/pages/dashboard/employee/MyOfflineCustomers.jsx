import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { IconUserPlus, IconX, IconSearch, IconPower, IconRefresh, IconAlertCircle, IconGenderMale, IconGenderFemale, IconCake, IconRulerMeasure, IconCircleCheckFilled } from '@tabler/icons-react';
import { getData, postData, patchData } from '../../../store/httpService';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../../contexts/AuthContext';

// Avatar color palette, matching LiveCustomers and SpecialSearch
const AVATAR_COLOR_PALETTE = [
  ['bg-red-500', 'text-red-50'], ['bg-pink-500', 'text-pink-50'], ['bg-purple-500', 'text-purple-50'],
  ['bg-indigo-500', 'text-indigo-50'], ['bg-blue-500', 'text-blue-50'], ['bg-cyan-500', 'text-cyan-50'],
  ['bg-teal-500', 'text-teal-50'], ['bg-green-500', 'text-green-50'], ['bg-lime-500', 'text-lime-900'],
  ['bg-yellow-500', 'text-yellow-900'], ['bg-amber-500', 'text-amber-900'], ['bg-orange-500', 'text-orange-50'],
  ['bg-fuchsia-500', 'text-fuchsia-50'], ['bg-emerald-500', 'text-emerald-50'], ['bg-sky-500', 'text-sky-50'],
];

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-4 flex flex-col items-center text-center border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 animate-pulse">
    <div className="w-16 h-16 rounded-full bg-gray-200 mb-3 dark:bg-gray-700"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 dark:bg-gray-700"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3 dark:bg-gray-700"></div>
    <div className="flex justify-center gap-3 w-full">
      <div className="h-3 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
    </div>
  </div>
);

function MyOfflineCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [genders, setGenders] = useState([]);
  const [heights, setHeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterHeight, setFilterHeight] = useState('');
  const [isChangingStatus, setIsChangingStatus] = useState({});
  const [activeRequests, setActiveRequests] = new Set();
  const [fetchError, setFetchError] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    email: '',
    mobile_number: '',
    password: '',
    confirm_password: '',
    employee_user_id: '',
    gender: '',
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  // Reset form data and errors
  const resetFormDataAndErrors = useCallback(() => {
    setFormData({
      first_name: '',
      surname: '',
      email: '',
      mobile_number: '',
      password: '',
      confirm_password: '',
      employee_user_id: '',
      gender: '',
    });
    setErrors({});
  }, []);

  // Format gender
  const formatGender = useCallback((genderId, genderOptions) => {
    const gender = genderOptions.find(g => g.id === genderId);
    return gender ? gender.name : 'N/A';
  }, []);

  // Format height (aligned with SpecialSearch and LiveCustomers)
  const formatHeight = useCallback((heightId, heightOptions) => {
    if (!heightOptions || heightId === null || heightId === undefined) return 'N/A';
    const heightObj = heightOptions.find(h => String(h.id) === String(heightId));
    return heightObj?.height ? `${heightObj.height} ft` : 'N/A';
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    setFetchError(null);
    try {
      const response = await getData('/customers/offline/');
      if (response.data && Array.isArray(response.data.results)) {
        setCustomers(response.data.results);
      } else {
        console.error('Unexpected customers API response format:', response.data);
        setCustomers([]);
        setFetchError('Unexpected data format received from the server.');
      }
    } catch (error) {
      console.error('Error fetching offline customers:', error);
      setCustomers([]);
      setFetchError('Failed to load offline customers. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await getData('/employees/');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  // Fetch genders
  const fetchGenders = useCallback(async () => {
    try {
      const response = await getData('/gender/');
      if (response.data && Array.isArray(response.data.results)) {
        setGenders(response.data.results);
      } else {
        console.error('Unexpected gender API response format:', response.data);
        setGenders([]);
      }
    } catch (error) {
      console.error('Error fetching genders:', error);
    }
  }, []);

  // Fetch heights
  const fetchHeights = useCallback(async () => {
    try {
      const response = await getData('/height/');
      if (response.data && Array.isArray(response.data.results)) {
        setHeights(response.data.results);
      } else {
        console.error('Unexpected height API response format:', response.data);
        setHeights([]);
      }
    } catch (error) {
      console.error('Error fetching heights:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access this page.');
      logout();
      navigate('/login');
      return;
    }
    fetchCustomers();
    fetchEmployees();
    fetchGenders();
    fetchHeights();
    return () => {
      // setActiveRequests(new Set()); // This line was problematic, activeRequests should be managed by useState
    };
  }, [isAuthenticated, navigate, logout, fetchCustomers, fetchEmployees, fetchGenders, fetchHeights]);

  // Filter customers
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const newFilteredCustomers = customers.filter(customer => {
      const fullName = (customer.full_name || '').toLowerCase();
      const userId = (customer.user_id || '').toLowerCase();
      const genderName = formatGender(customer.gender, genders).toLowerCase();
      const heightName = formatHeight(customer.height, heights).toLowerCase();

      const matchesSearch = fullName.includes(lowerCaseQuery) ||
        userId.includes(lowerCaseQuery) ||
        genderName.includes(lowerCaseQuery) ||
        heightName.includes(lowerCaseQuery);

      const matchesAge = filterAge === '' || String(customer.age) === filterAge;
      const matchesGender = filterGender === '' || String(customer.gender) === filterGender;
      const matchesHeight = filterHeight === '' || String(customer.height) === filterHeight;

      return matchesSearch && matchesAge && matchesGender && matchesHeight;
    });
    setFilteredCustomers(newFilteredCustomers);
  }, [customers, searchQuery, filterAge, filterGender, filterHeight, genders, heights, formatGender, formatHeight]);

  // Handle modal escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        resetFormDataAndErrors();
      }
    };
    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen, resetFormDataAndErrors]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (errors.general && Object.keys(errors).length === 1) {
      setErrors({});
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterAgeChange = (e) => {
    setFilterAge(e.target.value);
  };

  const handleFilterGenderChange = (e) => {
    setFilterGender(e.target.value);
  };

  const handleFilterHeightChange = (e) => {
    setFilterHeight(e.target.value);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setErrors({});
    let currentErrors = {};
    if (formData.password !== formData.confirm_password) {
      currentErrors.confirm_password = 'Passwords do not match.';
    }
    const requiredFields = ['first_name', 'surname', 'email', 'mobile_number', 'password', 'gender', 'employee_user_id'];
    requiredFields.forEach(field => {
      if (typeof formData[field] === 'string' && formData[field].trim() === '') {
        currentErrors[field] = `${field.replace(/_/g, ' ')} is required.`;
      }
    });
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }
    const submitData = {
      first_name: formData.first_name,
      surname: formData.surname,
      email: formData.email,
      mobile_number: formData.mobile_number,
      password: formData.password,
      employee_user_id: formData.employee_user_id,
      gender: formData.gender,
    };
    try {
      await postData('/customer/create/', submitData);
      toast.success('Customer added successfully!');
      setIsModalOpen(false);
      resetFormDataAndErrors();
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      const apiErrors = error.response?.data?.detail || error.response?.data;
      if (apiErrors) {
        if (typeof apiErrors === 'string') {
          setErrors({ general: apiErrors });
        } else if (typeof apiErrors === 'object') {
          const formattedErrors = {};
          for (const key in apiErrors) {
            if (Array.isArray(apiErrors[key])) {
              formattedErrors[key] = apiErrors[key].join(', ');
            } else if (typeof apiErrors[key] === 'string') {
              formattedErrors[key] = apiErrors[key];
            }
          }
          setErrors(formattedErrors);
        } else {
          setErrors({ general: 'An unexpected error occurred. Please try again.' });
        }
      } else {
        setErrors({ general: 'Network error or unable to connect. Please try again.' });
      }
    }
  };

  const handleToggleStatus = useCallback(async (userId, currentStatus) => {
    const requestId = uuidv4();
    if (activeRequests.has(requestId)) {
      console.warn(`[Request ${requestId}] Duplicate status toggle request for ${userId} ignored`);
      return;
    }
    const actionText = !currentStatus ? 'online' : 'offline';
    if (!window.confirm(`Are you sure you want to change customer ${userId} to ${actionText} status?`)) {
      return;
    }
    setActiveRequests(prev => new Set([...prev, requestId]));
    setIsChangingStatus(prev => ({ ...prev, [userId]: true }));
    try {
      const accessToken = Cookies.get('accessToken');
      if (!accessToken || !isAuthenticated) {
        toast.error('Please log in to perform this action.');
        logout();
        navigate('/login');
        return;
      }
      await patchData(
        `/customers/${userId}/status/`,
        { account_status: !currentStatus },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Request-ID': requestId,
          },
        }
      );
      toast.success(`Customer ${userId} status changed to ${actionText}!`);
      await fetchCustomers();
    } catch (error) {
      const errDetail = error.response?.data?.detail || `Failed to change status for ${userId}.`;
      console.error(`[Request ${requestId}] Error changing status for ${userId}:`, error);
      toast.error(errDetail);
    } finally {
      setIsChangingStatus(prev => ({ ...prev, [userId]: false }));
      setActiveRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  }, [navigate, isAuthenticated, logout, activeRequests, fetchCustomers]);

  const getInitials = useCallback((customer) => {
    if (customer?.full_name && customer.full_name.trim() !== '') {
      const parts = customer.full_name.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        return parts[0].charAt(0).toUpperCase();
      }
    }
    const firstInitial = customer?.first_name ? customer.first_name.charAt(0).toUpperCase() : '';
    const lastInitial = customer?.surname ? customer.surname.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}` || '??';
  }, []);

  const customerColors = useMemo(() => {
    const colorsMap = {};
    customers.forEach(customer => {
      const initials = getInitials(customer);
      const firstLetter = initials.charAt(0).toUpperCase();
      const charCode = firstLetter.charCodeAt(0) - 65;
      const colorIndex = (charCode >= 0 && charCode < 26) ? charCode % AVATAR_COLOR_PALETTE.length : 0;
      colorsMap[customer.user_id] = AVATAR_COLOR_PALETTE[colorIndex];
    });
    return colorsMap;
  }, [customers, getInitials]);

  return (
    <main className="min-h-screen bg-gray-50 font-inter antialiased text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8 bg-white rounded-xl shadow-lg"> {/* Removed max-w-7xl mx-auto, adjusted padding */}
        <h1 className="text-3xl font-normal text-gray-900 mb-6 text-center dark:text-gray-100">
          Offline Customers
        </h1>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6"> {/* Adjusted grid for filters */}
          <div className="relative col-span-full sm:col-span-2 lg:col-span-2 xl:col-span-2"> {/* Adjusted span for search */}
            <label htmlFor="searchQuery" className="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300"> {/* Smaller label */}
              Search by ID, Name, Gender, or Height
            </label>
            <input
              type="text"
              id="searchQuery"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 text-sm" // Reduced padding, smaller text
            />
            <IconSearch size={18} className="absolute left-2.5 top-1/2 mt-1.5 -translate-y-1/2 text-gray-400" /> {/* Adjusted icon size/position */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 mt-1.5 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                title="Clear Search Query"
              >
                <IconX size={14} /> 
              </button>
            )}
          </div>
          <div className="relative">
            <label htmlFor="filterAge" className="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">
              Filter by Age
            </label>
            <input
              id="filterAge"
              type="number"
              placeholder="Age"
              value={filterAge}
              onChange={handleFilterAgeChange}
              min="0"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
            {filterAge && (
              <button
                onClick={() => setFilterAge('')}
                className="absolute right-2 top-1/2 mt-1.5 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                title="Clear Age Filter"
              >
                <IconX size={14} />
              </button>
            )}
          </div>
          <div className="relative">
            <label htmlFor="filterGender" className="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">
              Filter by Gender
            </label>
            <select
              id="filterGender"
              value={filterGender}
              onChange={handleFilterGenderChange}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="">All Genders</option>
              {genders.map((genderOption) => (
                <option key={genderOption.id} value={genderOption.id}>
                  {genderOption.name}
                </option>
              ))}
            </select>
            {filterGender && (
              <button
                onClick={() => setFilterGender('')}
                className="absolute right-7 top-1/2 mt-1.5 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                title="Clear Gender Filter"
              >
                <IconX size={14} />
              </button>
            )}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-1">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l-.707.707L13.636 18l4.95-4.95-.707-.707L13.636 16.536z"/>
              </svg>
            </div>
          </div>
          <div className="relative">
            <label htmlFor="filterHeight" className="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">
              Filter by Height
            </label>
            <select
              id="filterHeight"
              value={filterHeight}
              onChange={handleFilterHeightChange}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="">All Heights</option>
              {heights.map((heightOption) => (
                <option key={heightOption.id} value={heightOption.id}>
                  {heightOption.height} ft
                </option>
              ))}
            </select>
            {filterHeight && (
              <button
                onClick={() => setFilterHeight('')}
                className="absolute right-7 top-1/2 mt-1.5 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                title="Clear Height Filter"
              >
                <IconX size={14} />
              </button>
            )}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-1">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l-.707.707L13.636 18l4.95-4.95-.707-.707L13.636 16.536z"/>
              </svg>
            </div>
          </div>
          <div className="col-span-full flex justify-end gap-2 mt-2"> {/* Adjusted gap and margin */}
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterAge('');
                setFilterGender('');
                setFilterHeight('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm flex items-center gap-1 text-sm" 
            >
              <IconX size={18} /> 
              Clear All
            </button>
            <button
              onClick={fetchCustomers}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1 text-sm"
              disabled={refreshing}
            >
              {refreshing ? (
                <span className="animate-spin h-4 w-4 border-2 border-t-2 border-white rounded-full"></span> 
              ) : (
                <IconRefresh size={18} />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => {
                resetFormDataAndErrors();
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1 text-sm"
            >
              <IconUserPlus size={18} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Loading State - Skeleton Loader */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-4"> {/* Adjusted grid for skeleton cards */}
            {[...Array(12)].map((_, i) => ( // Show 12 skeleton cards
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {fetchError && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-lg shadow-md mb-6 flex items-center gap-2" role="alert">
            <IconAlertCircle size={20} className="flex-shrink-0" />
            <span className="block sm:inline">{fetchError}</span>
          </div>
        )}

        {/* Customers Display */}
        {!loading && !fetchError && (
          filteredCustomers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"> {/* Adjusted grid for customer cards */}
              {filteredCustomers.map((customer, index) => {
                const [bgColorClass, textColorClass] = customerColors[customer.user_id] || ['bg-gray-400', 'text-gray-900'];
                const isOnline = customer.account_status !== undefined ? customer.account_status : false;

                return (
                  <div
                    key={customer.user_id}
                    onClick={(e) => {
                      if (!e.target.closest('button')) {
                        navigate(`/dashboard/employee/customer/${customer.user_id}`);
                      }
                    }}
                    className="customer-card relative bg-white rounded-xl p-4 flex flex-col items-center text-center cursor-pointer border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 dark:bg-gray-800 dark:border-gray-700" // Reduced padding
                    style={{ animationDelay: `${index * 0.05}s` }} // Faster animation delay
                  >
                    <div className={`absolute top-2 left-2 text-xs font-medium px-1.5 py-0.5 rounded-full z-10 ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}> {/* Smaller status badge */}
                      {isOnline ? 'Online' : 'Offline'}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(customer.user_id, isOnline);
                      }}
                      disabled={isChangingStatus[customer.user_id]}
                      className="absolute top-1.5 right-1.5 text-gray-500 hover:text-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-0.5 z-10 disabled:opacity-50 disabled:cursor-not-allowed" // Smaller button/padding
                      title={isOnline ? 'Change to Offline' : 'Change to Online'}
                    >
                      {isChangingStatus[customer.user_id] ? (
                        <span className="animate-spin h-4 w-4 border-2 border-t-2 border-indigo-600 rounded-full"></span> 
                      ) : (
                        <IconPower size={18} /> 
                      )}
                    </button>
                    {customer.profile_photos ? (
                      <img
                        src={customer.profile_photos}
                        alt={customer.full_name || 'Customer'}
                        className="flex-shrink-0 w-16 h-16 rounded-full object-cover shadow-lg mb-3" // Reduced size
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-lg mb-3 ${bgColorClass} ${textColorClass} ${customer.profile_photos ? 'hidden' : 'flex'}`} // Reduced size, smaller text
                    >
                      {getInitials(customer)}
                    </div>
                    <h3 className="text-md font-normal text-gray-900 leading-tight mb-0.5 flex items-center gap-1 dark:text-gray-100"> {/* Smaller text */}
                      {customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim()}
                      {customer.profile_verified && (
                        <IconCircleCheckFilled size={16} className="text-blue-500" title="Profile Verified" /> 
                      )}
                    </h3>
                    <p className="text-xs text-gray-600 mb-1 dark:text-gray-400">ID: {customer.user_id}</p> {/* Smaller text */}
                    <div className="text-xxs text-gray-500 space-y-0.5 w-full"> {/* Even smaller text, less space */}
                      <div className="flex justify-center gap-2"> {/* Reduced gap */}
                        {customer.age !== null && customer.age !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <IconCake size={14} className="text-purple-500" /> 
                            {customer.age} yrs
                          </div>
                        )}
                        {customer.gender !== null && customer.gender !== undefined && (
                          <div className="flex items-center gap-0.5">
                            {customer.gender === 1 ? (
                              <IconGenderMale size={14} className="text-blue-500" />
                            ) : (
                              <IconGenderFemale size={14} className="text-pink-500" />
                            )}
                            {formatGender(customer.gender, genders)}
                          </div>
                        )}
                      </div>
                      {customer.height !== null && customer.height !== undefined && (
                        <div className="flex justify-center gap-0.5">
                          <IconRulerMeasure size={14} className="text-teal-500" />
                          {formatHeight(customer.height, heights)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <IconUserPlus size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400">No offline customers found matching your criteria.</p>
            </div>
          )
        )}

        {/* Add Customer Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-4 backdrop-blur-sm animate-modal-fade-in">
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
                Add New Customer
              </h3>
              <form
                onSubmit={handleAddCustomer}
                className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              >
                {errors.general && (
                  <div className="sm:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm text-sm flex items-center gap-2">
                    <IconAlertCircle size={20} />
                    <span>{errors.general}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.first_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="surname" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Surname
                  </label>
                  <input
                    id="surname"
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.surname && (
                    <p className="text-xs text-red-600 mt-1">{errors.surname}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="mobile_number" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Mobile Number
                  </label>
                  <input
                    id="mobile_number"
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.mobile_number && (
                    <p className="text-xs text-red-600 mt-1">{errors.mobile_number}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  >
                    <option value="">Select Gender</option>
                    {genders.map((genderOption) => (
                      <option key={genderOption.id} value={genderOption.id}>
                        {genderOption.name}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-red-600 mt-1">{errors.gender}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.confirm_password && (
                    <p className="text-xs text-red-600 mt-1">{errors.confirm_password}</p>
                  )}
                </div>
                <div className="col-span-full">
                  <label htmlFor="employee_user_id" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Assign to Employee
                  </label>
                  <select
                    id="employee_user_id"
                    name="employee_user_id"
                    value={formData.employee_user_id}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.user_id} value={employee.user_id}>
                        {employee.full_name}
                      </option>
                    ))}
                  </select>
                  {errors.employee_user_id && (
                    <p className="text-xs text-red-600 mt-1">{errors.employee_user_id}</p>
                  )}
                </div>
                <div className="flex justify-end pt-4 col-span-full">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium text-base hover:bg-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); } /* Faster fade in for cards */
            to { opacity: 1; transform: translateY(0); }
          }
          .customer-card {
            animation: fadeIn 0.3s ease-out forwards; /* Adjusted animation duration */
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-modal-fade-in {
            animation: modalFadeIn 0.3s ease-out forwards;
          }
          @keyframes modalSlideDown {
            0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-modal-slide-down {
            animation: modalSlideDown 0.3s ease-out forwards;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-pulse {
            animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          select::-ms-expand {
            display: none;
          }
          .text-xxs {
            font-size: 0.65rem; /* Custom class for even smaller text */
          }
        `}</style>
      </div>
    </main>
  );
}

export default MyOfflineCustomers;