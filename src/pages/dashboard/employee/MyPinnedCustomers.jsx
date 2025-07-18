import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { IconUserPlus, IconX, IconSearch, IconGridDots, IconList, IconRefresh, IconAlertCircle, IconPower, IconEye, IconLoader2, IconStar } from '@tabler/icons-react';
import { getData, postData, patchData } from '../../../store/httpservice';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../../contexts/AuthContext';

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

// Configure backend base URL for static media files
const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL;

// ProfileAvatar Component
const ProfileAvatar = ({ customer, viewMode, bgColorClass, textColorClass, getInitials }) => {
  const [currentImageSource, setCurrentImageSource] = useState(null);

  useEffect(() => {
    if (customer.profile_photos) {
      setCurrentImageSource('profile_photos');
    } else if (customer.photo1) {
      setCurrentImageSource('photo1');
    } else {
      setCurrentImageSource(null);
    }
  }, [customer.profile_photos, customer.photo1]);

  const handleImageError = () => {
    if (currentImageSource === 'profile_photos' && customer.photo1) {
      setCurrentImageSource('photo1');
    } else {
      setCurrentImageSource(null);
    }
  };

  let imageUrlToDisplay = null;
  if (currentImageSource === 'profile_photos' && customer.profile_photos) {
    imageUrlToDisplay = `${BASE_URL}${customer.profile_photos}`;
  } else if (currentImageSource === 'photo1' && customer.photo1) {
    imageUrlToDisplay = `${BASE_URL}${customer.photo1}`;
  }

  if (imageUrlToDisplay) {
    return (
      <img
        src={imageUrlToDisplay}
        alt={`${customer.full_name || customer.user_id}'s profile`}
        className={`flex-shrink-0 w-16 h-16 rounded-full object-cover shadow-md ${viewMode === 'grid' ? 'mb-2' : 'mr-4'} transform-gpu transition-transform duration-300 group-hover:scale-110`}
        onError={handleImageError}
      />
    );
  } else {
    return (
      <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-xl font-normal shadow-md ${viewMode === 'grid' ? 'mb-2' : 'mr-4'} ${bgColorClass} ${textColorClass}`}>
        {getInitials(customer)}
      </div>
    );
  }
};

// Unique key for local storage
const LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS = 'myPinnedCustomersFilters';

function MyPinnedCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [dropdownData, setDropdownData] = useState({
    gender: [],
    'profile-for': [],
    employment_type: [],
    education: [],
    country: [],
    state: [],
    district: [],
  });
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isChangingStatus, setIsChangingStatus] = useState({});
  const [activeRequests, setActiveRequests] = useState(new Set());
  const [fetchError, setFetchError] = useState(null);
  const [selectedCustomerForPrivacyModal, setSelectedCustomerForPrivacyModal] = useState(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasAgreedToPrivacyInModal, setHasAgreedToPrivacyInModal] = useState(false);
  const [isLoadingSensitiveData, setIsLoadingSensitiveData] = useState(false);
  const [viewingDataType, setViewingDataType] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_searchQuery`) || '');
  const [filterAge, setFilterAge] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterAge`) || '');
  const [filterGender, setFilterGender] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterGender`) || 'all');
  const [filterHeight, setFilterHeight] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterHeight`) || '');
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterStatus`) || 'all');
  const [filterProfileFor, setFilterProfileFor] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterProfileFor`) || 'all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterPaymentStatus`) || 'all');

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
    dob: '',
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const employeeName = user?.full_name || user?.first_name || 'Employee';
  const employeeId = user?.id || 'N/A';

  // Reset form data and errors
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
      dob: '',
    });
    setErrors({});
  }, []);

  // Utility to get initials for avatar
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

  // Centralized formatting function for dropdowns
  const formatDropdownValue = useCallback((value, key, allDropdownData) => {
    const options = allDropdownData[key]?.results || allDropdownData[key];
    if (!options || value === null || value === undefined || value === '') return 'N/A';
    let item = options.find(o => String(o.id) === String(value));
    if (!item && typeof value === 'string') {
      item = options.find(o => o.name && o.name.toLowerCase() === value.toLowerCase());
    }
    return item ? item.name : 'N/A';
  }, []);

  // Fetch all necessary data
  const fetchPinnedCustomers = useCallback(async () => {
    if (!employeeId || !isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      setFetchError('Authentication required to fetch pinned customers.');
      return;
    }
    setLoading(true);
    setRefreshing(true);
    setFetchError(null);
    try {
      const accessToken = Cookies.get('accessToken');
      let customerEndpoint = `/employee/${employeeId}/`;
      const [customersRes, gendersRes, profileForRes, employmentTypeRes, educationRes, countriesRes, statesRes, districtsRes, packagesRes] = await Promise.all([
        getData(customerEndpoint, { headers: { Authorization: `Bearer ${accessToken}` } }),
        getData('/gender/'),
        getData('/profile-for/'),
        getData('/employment_type/'),
        getData('/education/'),
        getData('/country/'),
        getData('/state/'),
        getData('/district/'),
        getData('/package_name/'),
      ]);

      let assignedCustomers = [];
      if (customersRes.data && Array.isArray(customersRes.data.assigned_customers)) {
        assignedCustomers = customersRes.data.assigned_customers.filter(customer => customer.pinned_status === true);
      } else {
        console.error('Unexpected assigned customers API response format:', customersRes.data);
        setFetchError('Unexpected data format for pinned customers.');
      }
      setCustomers(assignedCustomers);

      setDropdownData({
        gender: gendersRes.data?.results || [],
        'profile-for': profileForRes.data?.results || [],
        employment_type: employmentTypeRes.data?.results || [],
        education: educationRes.data?.results || [],
        country: countriesRes.data?.results || [],
        state: statesRes.data?.results || [],
        district: districtsRes.data?.results || [],
      });
      setPackages(packagesRes.data?.results || []);
    } catch (error) {
      console.error('Error fetching data for MyPinnedCustomers:', error);
      if (error.response?.status === 500) {
        setFetchError('Server error occurred. Please try again later.');
      } else if (error.response?.status === 401) {
        setFetchError('Unauthorized access. Please log in again.');
        logout();
        navigate('/login');
      } else {
        setFetchError('Failed to load data. Please try again.');
      }
      setCustomers([]);
      setDropdownData({
        gender: [], 'profile-for': [], employment_type: [], education: [],
        country: [], state: [], district: [],
      });
      setPackages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeId, isAuthenticated, logout, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !employeeId) {
      toast.error('Please log in to access this page.');
      logout();
      navigate('/login');
      return;
    }
    fetchPinnedCustomers();
    return () => {
      setActiveRequests(new Set());
    };
  }, [isAuthenticated, navigate, logout, fetchPinnedCustomers, employeeId]);

  // Save filters to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_searchQuery`, searchQuery);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterAge`, filterAge);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterGender`, filterGender);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterHeight`, filterHeight);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterStatus`, filterStatus);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterProfileFor`, filterProfileFor);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterPaymentStatus`, filterPaymentStatus);
  }, [searchQuery, filterAge, filterGender, filterHeight, filterStatus, filterProfileFor, filterPaymentStatus]);

  // Filter logic
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const newFilteredCustomers = customers.filter(customer => {
      const displayFullName = customer.full_name || (customer.first_name && customer.surname ? `${customer.first_name} ${customer.surname}` : '');
      const fullName = displayFullName.toLowerCase();
      const userId = String(customer.user_id || '').toLowerCase();
      const genderName = formatDropdownValue(customer.gender, 'gender', dropdownData).toLowerCase();
      const profileForName = formatDropdownValue(customer.profile_for, 'profile-for', dropdownData).toLowerCase();

      const matchesSearch = fullName.includes(lowerCaseQuery) ||
        userId.includes(lowerCaseQuery) ||
        genderName.includes(lowerCaseQuery) ||
        profileForName.includes(lowerCaseQuery) ||
        customer.email?.toLowerCase().includes(lowerCaseQuery) ||
        customer.mobile_number?.includes(lowerCaseQuery);

      const matchesAge = filterAge === '' || String(customer.age) === filterAge;
      const matchesGender = filterGender === 'all' || String(customer.gender) === filterGender;
      const matchesHeight = filterHeight === '' || String(customer.height) === filterHeight;
      const matchesAccountStatus = filterStatus === 'all' ||
        (filterStatus === 'online' && Boolean(customer.account_status)) ||
        (filterStatus === 'offline' && !Boolean(customer.account_status));
      const matchesPaymentStatus = filterPaymentStatus === 'all' ||
        (filterPaymentStatus === 'paid' && (customer.payment_status === true || customer.payment_status === 1 || customer.payment_status === 2 || String(customer.payment_status).toLowerCase() === 'paid')) ||
        (filterPaymentStatus === 'pending' && !(customer.payment_status === true || customer.payment_status === 1 || customer.payment_status === 2 || String(customer.payment_status).toLowerCase() === 'paid'));

      return matchesSearch && matchesAge && matchesGender && matchesHeight && matchesAccountStatus && matchesPaymentStatus;
    });
    setFilteredCustomers(newFilteredCustomers);
    setCurrentPage(1);
  }, [customers, searchQuery, filterAge, filterGender, filterHeight, filterStatus, filterProfileFor, filterPaymentStatus, dropdownData, formatDropdownValue]);

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

  const handleFilterProfileFor = (e) => {
    setFilterProfileFor(e.target.value);
  };

  const handleFilterPaymentStatusChange = (e) => {
    setFilterPaymentStatus(e.target.value);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setErrors({});

    let currentErrors = {};
    if (formData.password !== formData.confirm_password) {
      currentErrors.confirm_password = 'Passwords do not match.';
    }
    const requiredFields = ['first_name', 'surname', 'email', 'mobile_number', 'password', 'gender', 'profile_for', 'package_name_id', 'dob'];
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
      dob: formData.dob,
    };

    try {
      await postData('/customer/create/', submitData);
      toast.success('Customer added successfully!');
      setIsModalOpen(false);
      resetFormDataAndErrors();
      fetchPinnedCustomers();
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
      await fetchPinnedCustomers();
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
  }, [navigate, isAuthenticated, logout, activeRequests, fetchPinnedCustomers]);

  const handleUnpinCustomer = useCallback(async (userId) => {
    const requestId = uuidv4();
    if (activeRequests.has(requestId)) {
      console.warn(`[Request ${requestId}] Duplicate unpin request for ${userId} ignored`);
      return;
    }

    if (!window.confirm(`Are you sure you want to unpin customer ${userId}?`)) {
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
        { pinned_status: false },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Request-ID': requestId,
          },
        }
      );

      console.log(`[Request ${requestId}] Unpin response for ${userId}:`, response);
      toast.success(`Customer ${userId} unpinned successfully!`);
      await fetchPinnedCustomers();
    } catch (error) {
      const errDetail = error.response?.data?.detail || `Failed to unpin customer ${userId}.`;
      console.error(`[Request ${requestId}] Error unpinning customer ${userId}:`, error, 'Response:', error.response?.data);
      toast.error(errDetail);
    } finally {
      setIsChangingStatus(prev => ({ ...prev, [userId]: false }));
      setActiveRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  }, [navigate, isAuthenticated, logout, activeRequests, fetchPinnedCustomers]);

  const formatPaymentStatus = useCallback((statusValue) => {
    if (statusValue === true || statusValue === 1 || statusValue === 2 || (typeof statusValue === 'string' && statusValue.toLowerCase() === 'paid')) {
      return 'Paid';
    }
    return 'Pending';
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
        handlePrivacyModalClose();
      }
    };
    if (isModalOpen || showPrivacyModal) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isModalOpen, resetFormDataAndErrors, showPrivacyModal]);

  const handleViewSensitiveData = useCallback((customer, type) => {
    setSelectedCustomerForPrivacyModal(customer);
    setViewingDataType(type);
    setShowPrivacyModal(true);
    setHasAgreedToPrivacyInModal(false);
    setIsLoadingSensitiveData(false);
  }, []);

  const handlePrivacyModalClose = useCallback(() => {
    setShowPrivacyModal(false);
    setSelectedCustomerForPrivacyModal(null);
    setHasAgreedToPrivacyInModal(false);
    setViewingDataType(null);
    setIsLoadingSensitiveData(false);
  }, []);

  const handlePrivacyModalAgree = useCallback(() => {
    setIsLoadingSensitiveData(true);
    setTimeout(() => {
      setIsLoadingSensitiveData(false);
      setHasAgreedToPrivacyInModal(true);
    }, 2000);
  }, []);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterAge('');
    setFilterGender('all');
    setFilterHeight('');
    setFilterStatus('all');
    setFilterProfileFor('all');
    setFilterPaymentStatus('all');

    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_searchQuery`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterAge`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterGender`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterHeight`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterStatus`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterProfileFor`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PINNED_CUSTOMERS_FILTERS}_filterPaymentStatus`);
  };

  const renderFilterInput = (id, label, type, value, onChange, placeholder) => {
    const isHighlighted = value !== '';
    return (
      <div className="relative flex-1 min-w-[120px]">
        <label htmlFor={id} className="block text-sm font-normal text-gray-700 mb-1 dark:text-gray-300 truncate">
          {label}
        </label>
        <input
          type={type}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full pl-3 pr-8 py-2.5 rounded-lg border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400
            ${isHighlighted ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
        />
        {value && (
          <button
            onClick={() => onChange({ target: { value: '' }})}
            className="absolute right-2 top-1/2 mt-1 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
            title={`Clear ${label}`}
          >
            <IconX size={16} />
          </button>
        )}
      </div>
    );
  };

  const renderFilterSelect = (id, label, value, onChange, options) => {
    const isHighlighted = value !== 'all' && value !== '';
    return (
      <div className="relative flex-1 min-w-[120px]">
        <label htmlFor={id} className="block text-sm font-normal text-gray-700 mb-1 dark:text-gray-300 truncate">
          {label}
        </label>
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400
            ${isHighlighted ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
        >
          <option value="all">{`All ${label.replace('Filter by ', '')}`}</option>
          {options?.map((option) => (
            <option key={option.id || option.value} value={option.id || option.value}>
              {option.name || option.label}
            </option>
          ))}
        </select>
        {value !== 'all' && value !== '' && (
          <button
            onClick={() => onChange({ target: { value: 'all' }})}
            className="absolute right-2 top-1/2 mt-1 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
            title={`Clear ${label}`}
          >
            <IconX size={16} />
          </button>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-1 dark:text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l-.707.707L13.636 18l4.95-4.95-.707-.707L13.636 16.536z"/></svg>
        </div>
      </div>
    );
  };

  return (
    <main className="p-0 sm:p-0 bg-gray-50 min-h-screen selection:bg-indigo-600 selection:text-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-6xl mx-auto">
        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-2 px-4 sm:px-0 gap-4 sm:gap-0">
          <h2 className="text-[1.8rem] font-normal tracking-tight text-gray-900 leading-tight dark:text-gray-100">
            My Pinned Customers
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by ID, Name, Email, Mobile..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400
                  ${searchQuery ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'}`}
              />
              <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 mt-1 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Clear Search Query"
                >
                  <IconX size={16} />
                </button>
              )}
            </div>
            <button
              onClick={fetchPinnedCustomers}
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
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center justify-center p-3 rounded-xl bg-white text-indigo-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl dark:bg-gray-700 dark:text-indigo-400"
              title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
            >
              {viewMode === 'grid' ? <IconList size={22} /> : <IconGridDots size={22} />}
            </button>
            <button
              onClick={() => {
                resetFormDataAndErrors();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl px-6 py-3 text-base font-normal shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto"
            >
              <IconUserPlus size={22} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-6 mb-8 px-4 sm:px-0">
          {renderFilterInput('filterAge', 'Age', 'number', filterAge, handleFilterAgeChange, 'e.g., 30')}
          {renderFilterSelect('filterGender', 'Gender', filterGender, handleFilterGenderChange, dropdownData.gender)}
          {renderFilterInput('filterHeight', 'Height (cm)', 'number', filterHeight, handleFilterHeightChange, 'e.g., 175.5')}
          {renderFilterSelect('filterStatus', 'Account Status', filterStatus, handleFilterStatusChange, [
            { value: 'all', label: 'All Statuses' },
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'Offline' }
          ])}
          {renderFilterSelect('filterProfileFor', 'Profile For', filterProfileFor, handleFilterProfileFor, dropdownData['profile-for'])}
          {renderFilterSelect('filterPaymentStatus', 'Payment Status', filterPaymentStatus, handleFilterPaymentStatusChange, [
            { value: 'all', label: 'All Payment Statuses' },
            { value: 'paid', label: 'Paid' },
            { value: 'pending', label: 'Pending' }
          ])}
          <div className="w-full flex justify-end">
            <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-normal hover:bg-gray-300 transition-colors shadow-sm flex items-center gap-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <IconX size={20} />
              Clear All Filters
            </button>
          </div>
        </div>

        {/* General Fetch Error Display */}
        {fetchError && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-lg shadow-md mb-6 mx-4 sm:mx-0 flex items-center gap-2 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300" role="alert">
            <IconAlertCircle size={20} className="flex-shrink-0" />
            <span className="block sm:inline font-normal">{fetchError}</span>
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
              {filteredCustomers.length > 0 ? (
                paginatedCustomers.map((customer, index) => {
                  const [bgColorClass, textColorClass] = customerColors[customer.user_id] || ['bg-gray-400', 'text-gray-900'];
                  const paymentStatusText = formatPaymentStatus(customer.payment_status);
                  const paymentStatusColorClass = paymentStatusText === 'Paid' ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300' : 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300';
                  const isOnline = Boolean(customer.account_status);

                  return (
                    <div
                      key={customer.user_id}
                      onClick={(e) => {
                        if (e.target.closest('.unpin-button') || e.target.closest('.status-button')) return;
                        navigate(`/dashboard/employee/customer/${customer.user_id}`);
                      }}
                      className={`customer-card rounded-xl bg-white p-6 flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center'} cursor-pointer border relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:rotate-z-1 dark:bg-gray-800 dark:border-gray-700 border-2 border-yellow-400 dark:border-yellow-300`}
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 dark:from-gray-700 dark:to-gray-800"></div>
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300 rounded-xl transition-all duration-300 z-10"></div>

                      {customer.payment_status !== null && customer.payment_status !== undefined && (
                        <div className={`absolute top-4 left-4 text-xs font-normal px-2 py-1 rounded-full ${paymentStatusColorClass} bg-opacity-80 backdrop-blur-sm z-30 shadow-sm border border-opacity-20 border-current`}>
                          {paymentStatusText}
                        </div>
                      )}

                      <div className="absolute top-4 left-20 text-xs font-normal px-2 py-1 rounded-full text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 bg-opacity-80 backdrop-blur-sm z-30 shadow-sm border border-opacity-20 border-current">
                        Pinned
                      </div>

                      <div className={`absolute top-4 ${viewMode === 'grid' ? 'left-[100px]' : 'left-[120px]'} text-xs font-normal px-2 py-1 rounded-full ${isOnline ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300' : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-300'} bg-opacity-80 backdrop-blur-sm z-30 shadow-sm border border-opacity-20 border-current`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnpinCustomer(customer.user_id);
                        }}
                        className="unpin-button absolute top-4 right-4 p-2 rounded-full text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/30 transition-colors z-30 shadow-sm"
                        title="Unpin Customer"
                        disabled={isChangingStatus[customer.user_id]}
                        aria-label={`Unpin customer ${customer.user_id}`}
                      >
                        {isChangingStatus[customer.user_id] ? (
                          <IconLoader2 size={20} className="animate-spin" />
                        ) : (
                          <IconStar size={20} />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(customer.user_id, isOnline);
                        }}
                        className="status-button absolute top-4 right-16 p-2 rounded-full text-gray-500 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-gray-900/30 transition-colors z-30 shadow-sm"
                        title={isOnline ? 'Set Customer Offline' : 'Set Customer Online'}
                        disabled={isChangingStatus[customer.user_id]}
                        aria-label={isOnline ? `Set customer ${customer.user_id} offline` : `Set customer ${customer.user_id} online`}
                      >
                        {isChangingStatus[customer.user_id] ? (
                          <IconLoader2 size={20} className="animate-spin" />
                        ) : (
                          <IconPower size={20} />
                        )}
                      </button>

                      <ProfileAvatar
                        customer={customer}
                        viewMode={viewMode}
                        bgColorClass={bgColorClass}
                        textColorClass={textColorClass}
                        getInitials={getInitials}
                      />

                      <div className={`z-20 ${viewMode === 'grid' ? 'flex-1' : 'flex-1 flex items-center'}`}>
                        <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">ID: {customer.user_id}</p>
                          <h3 className="text-lg font-normal text-gray-900 dark:text-gray-100 truncate">
                            {customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim() || 'Unnamed Customer'}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-gray-600 dark:text-gray-300">
                              Gender: {formatDropdownValue(customer.gender, 'gender', dropdownData)}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                              Profile For: {formatDropdownValue(customer.profile_for, 'profile-for', dropdownData)}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              Email:{' '}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSensitiveData(customer, 'email');
                                }}
                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                              >
                                <IconEye size={16} />
                              </button>
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              Mobile:{' '}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSensitiveData(customer, 'mobile');
                                }}
                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                              >
                                <IconEye size={16} />
                              </button>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-normal">No pinned customers found matching the filters.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 px-4 sm:px-0">
                <nav className="flex space-x-2" aria-label="Pagination">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-4 py-2 rounded-lg font-normal text-sm transition-all duration-200 ${
                        currentPage === index + 1
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </>
        )}

        {/* Add Customer Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl dark:bg-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-normal text-gray-900 dark:text-gray-100">Add New Customer</h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetFormDataAndErrors();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <IconX size={24} />
                </button>
              </div>
              <form onSubmit={handleAddCustomer}>
                <div className="space-y-4">
                  {errors.general && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                      <IconAlertCircle size={20} />
                      <span>{errors.general}</span>
                    </div>
                  )}
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-normal text-gray-700 dark:text-gray-300">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label htmlFor="surname" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Surname</label>
                    <input
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.surname ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="mobile_number" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Mobile Number</label>
                    <input
                      type="text"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.mobile_number ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.mobile_number && <p className="text-red-500 text-sm mt-1">{errors.mobile_number}</p>}
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Confirm Password</label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.confirm_password ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>}
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select Gender</option>
                      {dropdownData.gender.map(gender => (
                        <option key={gender.id} value={gender.id}>{gender.name}</option>
                      ))}
                    </select>
                    {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                  </div>
                  <div>
                    <label htmlFor="profile_for" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Profile For</label>
                    <select
                      name="profile_for"
                      value={formData.profile_for}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.profile_for ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select Profile For</option>
                      {dropdownData['profile-for'].map(profile => (
                        <option key={profile.id} value={profile.id}>{profile.name}</option>
                      ))}
                    </select>
                    {errors.profile_for && <p className="text-red-500 text-sm mt-1">{errors.profile_for}</p>}
                  </div>
                  <div>
                    <label htmlFor="package_name_id" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Package</label>
                    <select
                      name="package_name_id"
                      value={formData.package_name_id}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.package_name_id ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select Package</option>
                      {packages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                      ))}
                    </select>
                    {errors.package_name_id && <p className="text-red-500 text-sm mt-1">{errors.package_name_id}</p>}
                  </div>
                  <div>
                    <label htmlFor="dob" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.dob ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetFormDataAndErrors();
                    }}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-normal hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-normal hover:from-indigo-700 hover:to-purple-800"
                  >
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Privacy Consent Modal */}
        {showPrivacyModal && selectedCustomerForPrivacyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl dark:bg-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-normal text-gray-900 dark:text-gray-100">
                  View {viewingDataType === 'email' ? 'Email' : 'Mobile Number'}
                </h3>
                <button
                  onClick={handlePrivacyModalClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <IconX size={24} />
                </button>
              </div>
              {!hasAgreedToPrivacyInModal ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You are about to view sensitive information for {selectedCustomerForPrivacyModal.full_name || selectedCustomerForPrivacyModal.user_id}. Please confirm you have the necessary permissions.
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-normal hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrivacyModalAgree}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-normal hover:from-indigo-700 hover:to-purple-800"
                    >
                      Agree
                    </button>
                  </div>
                </div>
              ) : isLoadingSensitiveData ? (
                <div className="flex justify-center items-center">
                  <IconLoader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {viewingDataType === 'email' ? 'Email' : 'Mobile Number'}: {selectedCustomerForPrivacyModal[viewingDataType]}
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-normal hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default MyPinnedCustomers;