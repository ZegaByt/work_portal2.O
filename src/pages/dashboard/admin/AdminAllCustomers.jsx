import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { IconUserPlus, IconX, IconSearch, IconGridDots, IconList, IconRefresh, IconAlertCircle, IconPower } from '@tabler/icons-react';
import { getData, postData, patchData } from '../../../store/httpservice';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../../contexts/AuthContext'; // Using the path from the provided immersive

// Define vibrant color pairs for avatars using gradients
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

// IMPORTANT: Configure your backend's base URL for static media files here.
// This is crucial for images to load correctly.
// Example: If your backend serves media from "https://your-api-domain.com/media/",
// then BASE_URL should be "https://your-api-domain.com".
// If your backend is running locally on port 8000, it might be 'http://localhost:8000'.
const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL
; // <<< CONFIGURE THIS WITH YOUR ACTUAL BACKEND DOMAIN

// New ProfileAvatar Component to handle image loading and fallbacks
const ProfileAvatar = ({ customer, viewMode, bgColorClass, textColorClass, getInitials }) => {
  // State to track which image source is currently being attempted
  const [currentImageSource, setCurrentImageSource] = useState(null); // 'profile_photos', 'photo1', or null

  // Effect to determine initial image source and reset on customer change
  useEffect(() => {
    if (customer.profile_photos) {
      setCurrentImageSource('profile_photos');
    } else if (customer.photo1) {
      setCurrentImageSource('photo1');
    } else {
      setCurrentImageSource(null); // Fallback to initials if neither is present
    }
  }, [customer.profile_photos, customer.photo1]);

  // Handler for image loading errors
  const handleImageError = () => {
    if (currentImageSource === 'profile_photos' && customer.photo1) {
      // If profile_photos failed, try photo1
      setCurrentImageSource('photo1');
    } else {
      // If photo1 also failed or was the last attempt, fallback to initials
      setCurrentImageSource(null);
    }
  };

  let imageUrlToDisplay = null;
  if (currentImageSource === 'profile_photos' && customer.profile_photos) {
    imageUrlToDisplay = `${BASE_URL}/${customer.profile_photos}`;
  } else if (currentImageSource === 'photo1' && customer.photo1) {
    imageUrlToDisplay = `${BASE_URL}/${customer.photo1}`;
  }

  if (imageUrlToDisplay) {
    return (
      <img
        src={imageUrlToDisplay}
        alt={`${customer.full_name || customer.user_id}'s profile`}
        // Ensure object-cover and rounded-full for proper circular fit
        className={`flex-shrink-0 w-16 h-16 rounded-full object-cover shadow-md ${viewMode === 'grid' ? 'mb-2' : 'mr-4'} transform-gpu transition-transform duration-300 group-hover:scale-110`}
        onError={handleImageError} // Call handler on image error
      />
    );
  } else {
    // Fallback to initials
    return (
      <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-xl font-normal shadow-md ${viewMode === 'grid' ? 'mb-2' : 'mr-4'} ${bgColorClass} ${textColorClass}`}>
        {getInitials(customer)}
      </div>
    );
  }
};


function AllCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [genders, setGenders] = useState([]);
  const [profileForOptions, setProfileForOptions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterHeight, setFilterHeight] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isChangingStatus, setIsChangingStatus] = useState({});
  const [activeRequests, setActiveRequests] = useState(new Set());
  const [fetchError, setFetchError] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    email: '',
    mobile_number: '',
    password: '',
    confirm_password: '',
    gender: '',
    profile_for: '',
    package_name_id: '',
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const resetFormDataAndErrors = useCallback(() => {
    setFormData({
      first_name: '',
      surname: '',
      email: '',
      mobile_number: '',
      password: '',
      confirm_password: '',
      gender: '',
      profile_for: '',
      package_name_id: '',
    });
    setErrors({});
  }, []);

  const formatGender = useCallback((genderId, genderOptions) => {
    const gender = genderOptions.find(g => g.id === genderId);
    return gender ? gender.name : 'N/A';
  }, []);

  const formatProfileFor = useCallback((profileId, profileOptions) => {
    const profile = profileOptions.find(p => p.id === profileId);
    return profile ? profile.name : 'N/A';
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    setFetchError(null);
    try {
      const response = await getData('/customers/');
      if (response.data && Array.isArray(response.data)) {
        setCustomers(response.data);
      } else {
        console.error('Unexpected customers API response format:', response.data);
        setCustomers([]);
        setFetchError('Unexpected data format received from the server for customers.');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      setFetchError('Failed to load customers. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  const fetchGenders = useCallback(async () => {
    try {
      const response = await getData('/gender/');
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setGenders(response.data.results);
      } else {
        console.error('Unexpected gender API response format:', response.data);
        setGenders([]);
        setFetchError('Unexpected data format received from the server for genders.');
      }
    } catch (error) {
      console.error('Error fetching genders:', error);
      setGenders([]);
      setFetchError('Failed to load gender options.');
    }
  }, []);

  const fetchProfileFor = useCallback(async () => {
    try {
      const response = await getData('/profile-for/');
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setProfileForOptions(response.data.results);
      } else {
        console.error('Unexpected profile_for API response format:', response.data);
        setProfileForOptions([]);
        setFetchError('Unexpected data format received from the server for profile options.');
      }
    } catch (error) {
      console.error('Error fetching profile_for options:', error);
      setProfileForOptions([]);
      setFetchError('Failed to load profile for options.');
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      const response = await getData('/package_name/');
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setPackages(response.data.results);
      } else {
        console.error('Unexpected packages API response format:', response.data);
        setPackages([]);
        setFetchError('Unexpected data format received from the server for packages.');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
      setFetchError('Failed to load package options.');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access this page.');
      logout();
      navigate('/login');
      return;
    }
    fetchCustomers();
    fetchGenders();
    fetchProfileFor();
    fetchPackages();

    return () => {
      setActiveRequests(new Set());
    };
  }, [isAuthenticated, navigate, logout, fetchCustomers, fetchGenders, fetchProfileFor, fetchPackages]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const newFilteredCustomers = customers.filter(customer => {
      const displayFullName = customer.full_name || (customer.first_name && customer.surname ? `${customer.first_name} ${customer.surname}` : '');
      const fullName = displayFullName.toLowerCase();
      const userId = String(customer.user_id || '').toLowerCase();
      const genderName = formatGender(customer.gender, genders).toLowerCase();
      const profileForName = formatProfileFor(customer.profile_for, profileForOptions).toLowerCase();

      const matchesSearch = fullName.includes(lowerCaseQuery) ||
        userId.includes(lowerCaseQuery) ||
        genderName.includes(lowerCaseQuery) ||
        profileForName.includes(lowerCaseQuery) ||
        customer.email?.toLowerCase().includes(lowerCaseQuery) ||
        customer.mobile_number?.includes(lowerCaseQuery);

      const matchesAge = filterAge === '' || String(customer.age) === filterAge;
      const matchesGender = filterGender === '' || String(customer.gender) === filterGender;
      const matchesHeight = filterHeight === '' || String(customer.height) === filterHeight;
      const matchesStatus = filterStatus === '' ||
        (filterStatus === 'online' && customer.account_status) ||
        (filterStatus === 'offline' && !customer.account_status);

      return matchesSearch && matchesAge && matchesGender && matchesHeight && matchesStatus;
    });
    setFilteredCustomers(newFilteredCustomers);
    setCurrentPage(1);
  }, [customers, searchQuery, filterAge, filterGender, filterHeight, filterStatus, genders, profileForOptions, formatGender, formatProfileFor]);

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

  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setErrors({});

    let currentErrors = {};
    if (formData.password !== formData.confirm_password) {
      currentErrors.confirm_password = 'Passwords do not match.';
    }
    const requiredFields = ['first_name', 'surname', 'email', 'mobile_number', 'password', 'gender', 'profile_for', 'package_name_id'];
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
      confirm_password: formData.confirm_password,
      gender: formData.gender,
      profile_for: formData.profile_for,
      package_name_id: formData.package_name_id,
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

      const response = await patchData(
        `/customers/${userId}/status/`,
        { account_status: !currentStatus },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Request-ID': requestId,
          },
        }
      );

      console.log(`[Request ${requestId}] Status change response for ${userId}:`, response);
      toast.success(`Customer ${userId} status changed to ${actionText}!`);
      await fetchCustomers();
    } catch (error) {
      const errDetail = error.response?.data?.detail || `Failed to change status for ${userId} to ${actionText}.`;
      console.error(`[Request ${requestId}] Error changing status for ${userId}:`, error, 'Response:', error.response?.data);
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

  const getInitials = (customer) => {
    const nameToUse = customer.full_name && customer.full_name.trim() !== ''
      ? customer.full_name
      : (customer.first_name && customer.surname ? `${customer.first_name} ${customer.surname}` : '');

    if (!nameToUse) return '??';

    const parts = nameToUse.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].charAt(0).toUpperCase();
    }
    return '??';
  };

  const formatPaymentStatus = (statusValue) => {
    if (statusValue === true || statusValue === 1 || String(statusValue).toLowerCase() === 'paid') {
      return 'Paid';
    }
    return 'Pending';
  };

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
  }, [customers]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        resetFormDataAndErrors();
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isModalOpen, resetFormDataAndErrors]);


  return (
    <main className="p-0 sm:p-0 bg-gray-50 min-h-screen selection:bg-indigo-600 selection:text-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-6xl mx-auto">
        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-2 px-4 sm:px-0 gap-4 sm:gap-0">
          <h2 className="text-[1.8rem] font-normal tracking-tight text-gray-900 leading-tight dark:text-gray-100">
            All Customers
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by ID, Name, or Gender..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              />
              <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchCustomers}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white rounded-xl px-6 py-3 text-base font-semibold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={refreshing}
            >
              {refreshing ? (
                <span className="animate-spin h-5 w-5 border-2 border-t-2 border-white rounded-full"></span>
              ) : (
                <IconRefresh size={22} />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {/* View Mode Toggle */}
            <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="flex items-center justify-center p-3 rounded-xl bg-white text-indigo-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
            >
                {viewMode === 'grid' ? <IconList size={22} /> : <IconGridDots size={22} />}
            </button>

            {/* Add Customer Button */}
            <button
              onClick={() => {
                resetFormDataAndErrors();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl px-6 py-3 text-base font-semibold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto"
            >
              <IconUserPlus size={22} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8 px-4 sm:px-0">
          <div>
            <label htmlFor="filterAge" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
              Filter by Age
            </label>
            <input
              id="filterAge"
              type="number"
              placeholder="e.g., 30"
              value={filterAge}
              onChange={handleFilterAgeChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label htmlFor="filterGender" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
              Filter by Gender
            </label>
            <select
              id="filterGender"
              value={filterGender}
              onChange={handleFilterGenderChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            >
              <option value="">All Genders</option>
              {genders.map((genderOption) => (
                <option key={genderOption.id} value={genderOption.id}>
                  {genderOption.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterHeight" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
              Filter by Height (cm)
            </label>
            <input
              id="filterHeight"
              type="number"
              step="0.1"
              placeholder="e.g., 175.5"
              value={filterHeight}
              onChange={handleFilterHeightChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label htmlFor="filterStatus" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
              Filter by Status
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={handleFilterStatusChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            >
              <option value="">All Statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        {/* General Fetch Error Display */}
        {fetchError && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-lg shadow-md mb-6 mx-4 sm:mx-0 flex items-center gap-2" role="alert">
            <IconAlertCircle size={20} className="flex-shrink-0" />
            <span className="block sm:inline">{fetchError}</span>
          </div>
        )}

        {/* Customers Display */}
        {loading ? (
          <div className={`transition-all duration-500 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-0' : 'space-y-4 px-4 sm:px-0'}`}>
            {[...Array(itemsPerPage)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md animate-pulse border border-gray-100 min-h-[140px] dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-start mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 dark:bg-gray-700"></div>
                  <div className="flex-grow space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3 dark:bg-gray-700"></div>
                    <div className="h-5 bg-gray-200 rounded w-2/3 dark:bg-gray-700"></div>
                  </div>
                </div>
                <div className="h-0.5 bg-gray-200 rounded mb-4 dark:bg-gray-700"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={`transition-all duration-500 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-0' : 'space-y-4 px-4 sm:px-0'}`}>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer, index) => {
                  const [bgColorClass, textColorClass] = customerColors[customer.user_id] || ['bg-gray-400', 'text-gray-900'];
                  const paymentStatusText = formatPaymentStatus(customer.payment_status);
                  const paymentStatusColorClass = paymentStatusText === 'Paid' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50';
                  const isOnline = customer.account_status !== undefined ? customer.account_status : false;

                  return (
                    <div
                      key={customer.user_id}
                      onClick={() => navigate(`/dashboard/superadmin/customer/${customer.user_id}`)}
                      className={`customer-card rounded-xl bg-white p-6 flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center'} cursor-pointer border border-gray-100 relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:rotate-z-1 dark:bg-gray-800 dark:border-gray-700`}
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 dark:from-gray-700 dark:to-gray-800"></div>
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300 rounded-xl transition-all duration-300 z-10"></div>

                      {/* Payment Status badge */}
                      {customer.payment_status !== null && customer.payment_status !== undefined && (
                        <div className={`absolute top-4 left-4 text-xs font-normal px-2 py-1 rounded-full ${paymentStatusColorClass} bg-opacity-80 backdrop-blur-sm z-30 shadow-sm border border-opacity-20 border-current`}>
                          {paymentStatusText}
                        </div>
                      )}

                      {/* Account Status badge (Online/Offline text) */}
                      <div className={`absolute top-4 ${viewMode === 'grid' ? 'left-[100px]' : 'left-[120px]'} text-xs font-normal px-2 py-1 rounded-full ${isOnline ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} bg-opacity-80 backdrop-blur-sm z-30 shadow-sm border border-opacity-20 border-current`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </div>

                      {/* Status dot with blinking effect */}
                      <div className={`absolute top-4 right-4 w-3 h-3 ${isOnline ? 'bg-green-500 animate-pulse-slow' : 'bg-red-500'} rounded-full z-30 shadow-md`}></div>

                      {/* Toggle Status Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(customer.user_id, isOnline);
                        }}
                        disabled={isChangingStatus[customer.user_id]}
                        className="absolute top-10 right-2 text-gray-500 hover:text-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 z-30 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isOnline ? 'Change to Offline' : 'Change to Online'}
                      >
                        {isChangingStatus[customer.user_id] ? (
                          <span className="animate-spin h-5 w-5 border-2 border-t-2 border-indigo-600 rounded-full"></span>
                        ) : (
                          <IconPower size={20} />
                        )}
                      </button>

                      {/* Main content area */}
                      <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center pt-4 mb-4' : 'flex-row items-center mr-6'} z-20`}>
                        <ProfileAvatar
                          customer={customer}
                          viewMode={viewMode}
                          bgColorClass={bgColorClass}
                          textColorClass={textColorClass}
                          getInitials={getInitials}
                        />
                        <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-grow'}`}>
                          <p className="text-sm text-gray-500 mb-0 font-normal dark:text-gray-400">ID: {customer.user_id}</p>
                          <p className="text-lg font-normal text-gray-800 leading-tight dark:text-gray-100">
                            {customer.full_name || `${customer.first_name} ${customer.surname}`}
                          </p>
                        </div>
                      </div>

                      {viewMode === 'grid' && <div className="border-b border-gray-200 mb-4 z-20 w-full dark:border-gray-700"></div>}

                      <div className={`flex-grow z-20 ${viewMode === 'list' ? 'flex flex-col sm:flex-row sm:items-center sm:gap-6' : ''}`}>
                        {customer.email && (
                          <p className="text-gray-600 text-sm mb-1 truncate dark:text-gray-300">Email: {customer.email}</p>
                        )}
                        {customer.mobile_number && (
                          <p className="text-gray-600 text-sm mb-1 dark:text-gray-300">Mobile: {customer.mobile_number}</p>
                        )}
                        {customer.dob && (
                          <p className="text-gray-600 text-sm mb-1 dark:text-gray-300">DOB: {customer.dob}</p>
                        )}
                         {customer.profile_for !== null && customer.profile_for !== undefined && (
                          <p className="text-gray-600 text-sm mb-1 dark:text-gray-300">Profile For: {formatProfileFor(customer.profile_for, profileForOptions)}</p>
                        )}
                        <div className={`flex ${viewMode === 'grid' ? 'flex-wrap justify-between' : 'flex-wrap gap-4'} items-center mt-2 gap-y-1`}>
                          {customer.gender !== null && customer.gender !== undefined && (
                            <p className="text-gray-600 text-sm flex-grow min-w-[50%] dark:text-gray-300">Gender: {formatGender(customer.gender, genders)}</p>
                          )}
                          {customer.age !== null && customer.age !== undefined && (
                            <p className="text-gray-600 text-sm flex-grow dark:text-gray-300">Age: {customer.age}</p>
                          )}
                          {customer.height !== null && customer.height !== undefined && (
                            <p className="text-gray-600 text-sm flex-grow dark:text-gray-300">Height: {customer.height} cm</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center text-gray-600 text-lg py-10 dark:text-gray-400">
                  No customers found matching your criteria.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0 px-4 sm:px-0">
                <div className="text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 dark:bg-gray-700 dark:text-indigo-400 dark:border-gray-600 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Add Customer Modal */}
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
                Add New Customer
              </h3>
              <form
                onSubmit={handleAddCustomer}
                className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              >
                {/* General API error display for form submission */}
                {errors.general && (
                  <div className="sm:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm text-sm flex items-center gap-2">
                    <IconAlertCircle size={20} />
                    <span>{errors.general}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="first_name" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.first_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="surname" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Surname
                  </label>
                  <input
                    id="surname"
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.surname && (
                    <p className="text-xs text-red-600 mt-1">{errors.surname}</p>
                  )}
                </div>
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
                <div>
                  <label htmlFor="gender" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
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
                    <p className="text-sm text-red-600 mt-1">{errors.gender}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="profile_for" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Profile For
                  </label>
                  <select
                    id="profile_for"
                    name="profile_for"
                    value={formData.profile_for}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  >
                    <option value="">Select Profile For</option>
                    {profileForOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {errors.profile_for && (
                    <p className="text-sm text-red-600 mt-1">{errors.profile_for}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="package_name_id" className="block text-sm font-normal mb-1 text-gray-700 dark:text-gray-300">
                    Package Name
                  </label>
                  <select
                    id="package_name_id"
                    name="package_name_id"
                    value={formData.package_name_id}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  >
                    <option value="">Select Package</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                  {errors.package_name_id && (
                    <p className="text-sm text-red-600 mt-1">{errors.package_name_id}</p>
                  )}
                </div>
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
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                  )}
                </div>
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

                <div className="flex justify-end pt-4 col-span-full">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold text-base hover:bg-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Internal Styles */}
      <style>{`
        /* Custom spin animation for loading state */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        /* Modal Slide Down */
        @keyframes modalSlideDown {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-slide-down {
          animation: modalSlideDown 0.3s ease-out forwards;
        }

        /* Card Enter Animation */
        @keyframes cardEnter {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .customer-card {
          opacity: 0;
          transform: translateY(20px);
          animation: cardEnter 0.4s ease-out forwards;
        }

        /* Adjusted for smoother effect */
        .hover\\:rotate-z-1:hover {
          transform: translateY(-4px) rotateZ(0.5deg);
        }

        /* Blinking effect for status dot */
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </main>
  );
}

export default AllCustomers;