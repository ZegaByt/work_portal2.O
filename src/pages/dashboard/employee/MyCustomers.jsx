import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { IconUserPlus, IconX, IconSearch, IconGridDots, IconList, IconRefresh, IconAlertCircle, IconPower, IconEye, IconLoader2, IconStar, IconCircleCheckFilled, IconGenderMale, IconGenderFemale, IconCake, IconRulerMeasure } from '@tabler/icons-react';
import { getData, postData, patchData } from '../../../store/httpservice';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../../contexts/AuthContext';

// Non-gradient avatar color palette, matching OfflineCustomers
const AVATAR_COLOR_PALETTE = [
  ['bg-red-500', 'text-red-50'], ['bg-pink-500', 'text-pink-50'], ['bg-purple-500', 'text-purple-50'],
  ['bg-indigo-500', 'text-indigo-50'], ['bg-blue-500', 'text-blue-50'], ['bg-cyan-500', 'text-cyan-50'],
  ['bg-teal-500', 'text-teal-50'], ['bg-green-500', 'text-green-50'], ['bg-lime-500', 'text-lime-900'],
  ['bg-yellow-500', 'text-yellow-900'], ['bg-amber-500', 'text-amber-900'], ['bg-orange-500', 'text-orange-50'],
  ['bg-fuchsia-500', 'text-fuchsia-50'], ['bg-emerald-500', 'text-emerald-50'], ['bg-sky-500', 'text-sky-50'],
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
        className={`flex-shrink-0 w-20 h-20 rounded-full object-cover shadow-lg ${viewMode === 'grid' ? 'mb-4' : 'mr-4'}`}
        onError={handleImageError}
      />
    );
  } else {
    return (
      <div className={`flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-normal shadow-lg ${viewMode === 'grid' ? 'mb-4' : 'mr-4'} ${bgColorClass} ${textColorClass}`}>
        {getInitials(customer)}
      </div>
    );
  }
};

// Unique key for local storage
const LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS = 'myCustomersFilters';

function MyCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [dropdownData, setDropdownData] = useState({
    gender: [],
    height: [],
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
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_searchQuery`) || '');
  const [filterAge, setFilterAge] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterAge`) || '');
  const [filterGender, setFilterGender] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterGender`) || 'all');
  const [filterHeight, setFilterHeight] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterHeight`) || '');
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterStatus`) || 'all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPaymentStatus`) || 'all');
  const [filterPinnedStatus, setFilterPinnedStatus] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPinnedStatus`) || 'all');

  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    email: '',
    mobile_number: '',
    password: '',
    confirm_password: '',
    gender: '',
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

  // Format height
  const formatHeight = useCallback((heightId, heightOptions) => {
    if (!heightOptions || heightId === null || heightId === undefined) return 'N/A';
    const heightObj = heightOptions.find(h => String(h.id) === String(heightId));
    return heightObj?.height ? `${heightObj.height} cm` : 'N/A';
  }, []);

  // Centralized formatting function for dropdowns
  const formatDropdownValue = useCallback((value, key, allDropdownData) => {
    const options = allDropdownData[key]?.results || allDropdownData[key] || [];
    if (!options || value === null || value === undefined || value === '') return 'N/A';
    let item = options.find(o => String(o.id) === String(value));
    if (!item && typeof value === 'string') {
      item = options.find(o => o.name && o.name.toLowerCase() === value.toLowerCase());
    }
    return item ? item.name : 'N/A';
  }, []);

  // Fetch all necessary data
  const fetchCustomers = useCallback(async () => {
    if (!employeeId || !isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      setFetchError('Authentication required to fetch customers.');
      return;
    }
    setLoading(true);
    setRefreshing(true);
    setFetchError(null);
    try {
      let customerEndpoint = `/employee/${employeeId}/`;
      const [customersRes, gendersRes, heightsRes, packagesRes] = await Promise.all([
        getData(customerEndpoint),
        getData('/gender/'),
        getData('/height/'),
        getData('/package_name/'),
      ]);

      let assignedCustomers = [];
      if (customersRes.data && Array.isArray(customersRes.data.assigned_customers)) {
        assignedCustomers = customersRes.data.assigned_customers;
      } else {
        console.error('Unexpected assigned customers API response format:', customersRes.data);
        assignedCustomers = [];
        setFetchError('Unexpected data format for assigned customers.');
      }
      setCustomers(assignedCustomers);

      setDropdownData({
        gender: gendersRes.data?.results || [],
        height: heightsRes.data?.results || [],
      });
      setPackages(packagesRes.data?.results || []);
    } catch (error) {
      console.error('Error fetching data for MyCustomers:', error);
      setFetchError('Failed to load data. Please try again.');
      setCustomers([]);
      setDropdownData({
        gender: [],
        height: [],
      });
      setPackages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !employeeId) {
      toast.error('Please log in to access this page.');
      logout();
      navigate('/login');
      return;
    }
    fetchCustomers();
    return () => {
      setActiveRequests(new Set());
    };
  }, [isAuthenticated, navigate, logout, fetchCustomers, employeeId]);

  // Save filters to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_searchQuery`, searchQuery);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterAge`, filterAge);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterGender`, filterGender);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterHeight`, filterHeight);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterStatus`, filterStatus);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPaymentStatus`, filterPaymentStatus);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPinnedStatus`, filterPinnedStatus);
  }, [searchQuery, filterAge, filterGender, filterHeight, filterStatus, filterPaymentStatus, filterPinnedStatus]);

  // Filter logic
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const newFilteredCustomers = customers.filter(customer => {
      const displayFullName = customer.full_name || (customer.first_name && customer.surname ? `${customer.first_name} ${customer.surname}` : '');
      const fullName = displayFullName.toLowerCase();
      const userId = String(customer.user_id || '').toLowerCase();
      const genderName = formatDropdownValue(customer.gender, 'gender', dropdownData).toLowerCase();
      const heightName = formatHeight(customer.height, dropdownData.height).toLowerCase();

      const matchesSearch = fullName.includes(lowerCaseQuery) ||
        userId.includes(lowerCaseQuery) ||
        genderName.includes(lowerCaseQuery) ||
        heightName.includes(lowerCaseQuery) ||
        customer.email?.toLowerCase().includes(lowerCaseQuery) ||
        customer.mobile_number?.includes(lowerCaseQuery);

      const matchesAge = filterAge === '' || String(customer.age) === filterAge;
      const matchesGender = filterGender === 'all' || String(customer.gender) === filterGender;
      const matchesHeight = filterHeight === '' || String(customer.height) === filterHeight;
      const matchesAccountStatus = filterStatus === 'all' ||
        (filterStatus === 'online' && Boolean(customer.account_status)) ||
        (filterStatus === 'offline' && !Boolean(customer.account_status));
      const matchesPaymentStatus = filterPaymentStatus === 'all' ||
        (filterPaymentStatus === 'paid' && (customer.payment_status === true || customer.payment_status === 2 || String(customer.payment_status).toLowerCase() === 'paid')) ||
        (filterPaymentStatus === 'Not Paid' && !(customer.payment_status === true || customer.payment_status === 1 || String(customer.payment_status).toLowerCase() === 'paid'));
      const matchesPinnedStatus = filterPinnedStatus === 'all' ||
        (filterPinnedStatus === 'pinned' && Boolean(customer.pinned_status)) ||
        (filterPinnedStatus === 'unpinned' && !Boolean(customer.pinned_status));

      return matchesSearch && matchesAge && matchesGender && matchesHeight && matchesAccountStatus && matchesPaymentStatus && matchesPinnedStatus;
    }).sort((a, b) => (b.pinned_status ? 1 : 0) - (a.pinned_status ? 1 : 0));
    setFilteredCustomers(newFilteredCustomers);
    setCurrentPage(1);
  }, [customers, searchQuery, filterAge, filterGender, filterHeight, filterStatus, filterPaymentStatus, filterPinnedStatus, dropdownData, formatHeight, formatDropdownValue]);

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

  const handleFilterPaymentStatusChange = (e) => {
    setFilterPaymentStatus(e.target.value);
  };

  const handleFilterPinnedStatusChange = (e) => {
    setFilterPinnedStatus(e.target.value);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setErrors({});

    let currentErrors = {};
    if (formData.password !== formData.confirm_password) {
      currentErrors.confirm_password = 'Passwords do not match.';
    }
    const requiredFields = ['first_name', 'surname', 'email', 'mobile_number', 'password', 'gender', 'package_name_id', 'dob'];
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
      gender: formData.gender,
      package_name_id: formData.package_name_id,
      dob: formData.dob,
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

  const handleTogglePin = useCallback(async (userId, currentPinnedStatus) => {
    const requestId = uuidv4();
    if (activeRequests.has(requestId)) {
      console.warn(`[Request ${requestId}] Duplicate pin toggle request for ${userId} ignored`);
      return;
    }

    const actionText = !currentPinnedStatus ? 'pin' : 'unpin';
    if (!window.confirm(`Are you sure you want to ${actionText} customer ${userId}?`)) {
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
        { pinned_status: !currentPinnedStatus },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Request-ID': requestId,
          },
        }
      );

      console.log(`[Request ${requestId}] Pin status change response for ${userId}:`, response);
      toast.success(`Customer ${userId} ${actionText}ned successfully!`);
      await fetchCustomers();
    } catch (error) {
      const errDetail = error.response?.data?.detail || `Failed to ${actionText} customer ${userId}.`;
      console.error(`[Request ${requestId}] Error changing pin status for ${userId}:`, error);
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

  const formatPaymentStatus = useCallback((statusValue) => {
    if (statusValue === true || statusValue === 2 || (typeof statusValue === 'string' && statusValue.toLowerCase() === 'paid')) {
      return 'Paid';
    }
    return 'Not Paid';
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
    setFilterPaymentStatus('all');
    setFilterPinnedStatus('all');

    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_searchQuery`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterAge`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterGender`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterHeight`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterStatus`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPaymentStatus`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPinnedStatus`);
  };

  const renderFilterInput = (id, label, type, value, onChange, placeholder) => {
    const isHighlighted = value !== '';
    return (
      <div className="relative flex-1 min-w-[120px]">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300 truncate">
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
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300 truncate">
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
            className="absolute right-8 top-1/2 mt-1 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
            title={`Clear ${label}`}
          >
            <IconX size={16} />
          </button>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-1 dark:text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l-.707.707L13.636 18l4.95-4.95-.707-.707L13.636 16.536z"/>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 font-inter antialiased text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
          <h2 className="text-3xl font-normal text-gray-900 leading-tight dark:text-gray-100">
            My Assigned Customers
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by ID, Name, Gender, Height..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400
                  ${searchQuery ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
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
              onClick={fetchCustomers}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg px-6 py-2.5 font-medium shadow-sm hover:bg-indigo-700 transition-all duration-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={refreshing}
            >
              {refreshing ? (
                <span className="animate-spin h-5 w-5 border-2 border-t-2 border-white rounded-full"></span>
              ) : (
                <IconRefresh size={20} />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center justify-center p-2.5 rounded-lg bg-gray-50 text-indigo-600 shadow-sm hover:bg-gray-200 transition-all duration-300 dark:bg-gray-700 dark:text-indigo-400 dark:hover:bg-gray-600"
              title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
            >
              {viewMode === 'grid' ? <IconList size={20} /> : <IconGridDots size={20} />}
            </button>
            <button
              onClick={() => {
                resetFormDataAndErrors();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-6 py-2.5 font-medium shadow-sm hover:bg-indigo-700 transition-all duration-300 w-full sm:w-auto"
            >
              <IconUserPlus size={20} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {renderFilterInput('filterAge', 'Filter by Age', 'number', filterAge, handleFilterAgeChange, 'e.g., 30')}
          {renderFilterSelect('filterGender', 'Filter by Gender', filterGender, handleFilterGenderChange, dropdownData.gender)}
          {renderFilterSelect('filterHeight', 'Filter by Height', filterHeight, handleFilterHeightChange, dropdownData.height.map(h => ({ id: h.id, name: `${h.height} cm` })))}
          {renderFilterSelect('filterStatus', 'Filter by Account Status', filterStatus, handleFilterStatusChange, [
            { value: 'all', label: 'All Statuses' },
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'Offline' }
          ])}
          {renderFilterSelect('filterPaymentStatus', 'Filter by Payment Status', filterPaymentStatus, handleFilterPaymentStatusChange, [
            { value: 'all', label: 'All Payment Statuses' },
            { value: 'paid', label: 'Paid' },
            { value: 'Not Paid', label: 'Not Paid' }
          ])}
          {renderFilterSelect('filterPinnedStatus', 'Filter by Pinned Status', filterPinnedStatus, handleFilterPinnedStatusChange, [
            { value: 'all', label: 'All Pinned Statuses' },
            { value: 'pinned', label: 'Pinned' },
            { value: 'unpinned', label: 'Unpinned' }
          ])}
          <div className="col-span-full flex justify-end">
            <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm flex items-center gap-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <IconX size={20} />
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-dashed border-indigo-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading customers...</p>
          </div>
        )}

        {/* General Fetch Error Display */}
        {fetchError && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-lg shadow-md mb-6 flex items-center gap-2 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300" role="alert">
            <IconAlertCircle size={20} className="flex-shrink-0" />
            <span className="block sm:inline font-normal">{fetchError}</span>
          </div>
        )}

        {/* Customers Display */}
        {!loading && !fetchError && (
          <>
            <div className={`transition-all duration-500 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}`}>
              {filteredCustomers.length > 0 ? (
                paginatedCustomers.map((customer, index) => {
                  const [bgColorClass, textColorClass] = customerColors[customer.user_id] || ['bg-gray-400', 'text-gray-900'];
                  const isOnline = Boolean(customer.account_status);
                  const isPinned = Boolean(customer.pinned_status);
                  const isProfileVerified = Boolean(customer.profile_verified);

                  const isNoAction = customer.payment_status === 'Not Paid' && 
                    customer.agreement_status === 'No Agrement' && 
                    customer.settlement_status === 'No Settlement';

                  const getButtonStyles = (status, adminStatus) => {
                    if (adminStatus === 'Accepted' || adminStatus === 'Approved') {
                      return 'text-green-800 bg-green-100 border-green-500 font-bold dark:bg-green-900/30 dark:text-green-300 dark:border-green-500';
                    } else if (adminStatus === 'Rejected') {
                      return 'text-red-800 bg-red-100 border-red-500 font-bold dark:bg-red-900/30 dark:text-red-300 dark:border-red-500';
                    } else if (status === 'Paid' || status === 'Agrement Done' || status === 'Settlement Done') {
                      return 'text-yellow-800 bg-yellow-100 border-yellow-500 font-bold dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-500';
                    }
                    return 'text-gray-600 bg-gray-50 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-600';
                  };

                  const pButtonStyles = getButtonStyles(customer.payment_status, customer.payment_admin_approval);
                  const aButtonStyles = getButtonStyles(customer.agreement_status, customer.admin_agreement_approval);
                  const sButtonStyles = getButtonStyles(customer.settlement_status, customer.settlement_admin_approval);

                  return (
                    <div
                      key={customer.user_id}
                      onClick={(e) => {
                        if (e.target.closest('.pin-button') || e.target.closest('.status-button') || e.target.closest('.sensitive-data-button')) return;
                        navigate(`/dashboard/employee/customer/${customer.user_id}`);
                      }}
                      className={`customer-card relative bg-white rounded-xl p-5 flex ${viewMode === 'grid' ? 'flex-col items-center text-center' : 'flex-row items-center'} cursor-pointer border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 dark:bg-gray-800 dark:border-gray-700`}
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <div className="absolute top-3 left-3 flex gap-1 text-xs font-medium z-30">
                        {isNoAction ? (
                          <div className="px-2 py-1 rounded text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400 shadow-sm border border-gray-300 dark:border-gray-600">
                            No Action
                          </div>
                        ) : (
                          <>
                            <span className={`px-2 py-1 rounded-none border border-solid w-5 h-5 flex items-center justify-center ${pButtonStyles}`}>
                              P
                            </span>
                            <span className={`px-2 py-1 rounded-none border border-solid w-5 h-5 flex items-center justify-center ${aButtonStyles}`}>
                              A
                            </span>
                            <span className={`px-2 py-1 rounded-none border border-solid w-5 h-5 flex items-center justify-center ${sButtonStyles}`}>
                              S
                            </span>
                          </>
                        )}
                      </div>
                      <div className={`absolute top-3 ${viewMode === 'grid' ? 'left-20' : 'left-24'} text-xs font-medium px-2 py-1 rounded-full ${isOnline ? 'text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-300' : 'text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-300'} shadow-sm border border-gray-300 dark:border-gray-600 z-30`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </div>
                      {isPinned && (
                        <div className={`absolute top-3 ${viewMode === 'grid' ? 'left-36' : 'left-40'} text-xs font-medium px-2 py-1 rounded-full text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 shadow-sm border border-yellow-300 dark:border-yellow-600 z-30`}>
                          Pinned
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(customer.user_id, isOnline);
                        }}
                        className="status-button absolute top-2 right-2 text-gray-500 hover:text-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 z-30 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isOnline ? 'Change to Offline' : 'Change to Online'}
                        disabled={isChangingStatus[customer.user_id]}
                      >
                        {isChangingStatus[customer.user_id] ? (
                          <span className="animate-spin h-5 w-5 border-2 border-t-2 border-indigo-600 rounded-full"></span>
                        ) : (
                          <IconPower size={20} />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(customer.user_id, isPinned);
                        }}
                        className={`pin-button absolute top-2 right-10 p-1 rounded-full ${
                          isPinned
                            ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/30'
                            : 'text-gray-500 bg-gray-50 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-gray-900/30'
                        } transition-colors z-30 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isPinned ? 'Unpin Customer' : 'Pin Customer'}
                        disabled={isChangingStatus[customer.user_id]}
                      >
                        {isChangingStatus[customer.user_id] ? (
                          <IconLoader2 size={20} className="animate-spin" />
                        ) : (
                          <IconStar size={20} />
                        )}
                      </button>
                      <ProfileAvatar
                        customer={customer}
                        viewMode={viewMode}
                        bgColorClass={bgColorClass}
                        textColorClass={textColorClass}
                        getInitials={getInitials}
                      />
                      <h3 className="text-lg font-normal text-gray-900 leading-tight mb-1 flex items-center gap-1 dark:text-gray-100">
                        {customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim() || 'Unnamed Customer'}
                        {isProfileVerified && (
                          <IconCircleCheckFilled size={18} className="text-blue-500 dark:text-blue-400" title="Profile Verified" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 dark:text-gray-400">ID: {customer.user_id}</p>
                      <div className="text-xs text-gray-500 space-y-1 w-full">
                        <div className={`${viewMode === 'grid' ? 'flex justify-center gap-4' : 'space-y-1'}`}>
                          {customer.dob && (
                            <div className="flex items-center gap-1">
                              <IconCake size={16} className="text-purple-500" />
                              {customer.dob}
                            </div>
                          )}
                          {customer.gender !== null && customer.gender !== undefined && (
                            <div className="flex items-center gap-1">
                              {customer.gender === 1 ? (
                                <IconGenderMale size={16} className="text-blue-500" />
                              ) : (
                                <IconGenderFemale size={16} className="text-pink-500" />
                              )}
                              {formatDropdownValue(customer.gender, 'gender', dropdownData)}
                            </div>
                          )}
                          {customer.age !== null && customer.age !== undefined && (
                            <div className="flex items-center gap-1">
                              <IconCake size={16} className="text-purple-500" />
                              {customer.age} years old
                            </div>
                          )}
                          {customer.height !== null && customer.height !== undefined && (
                            <div className="flex items-center gap-1">
                              <IconRulerMeasure size={16} className="text-teal-500" />
                              {formatHeight(customer.height, dropdownData.height)}
                            </div>
                          )}
                        </div>
                        <div className={`${viewMode === 'grid' ? 'flex justify-center gap-4' : 'space-y-1'}`}>
                          <div className="flex items-center gap-1">
                            Email:{' '}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSensitiveData(customer, 'email');
                              }}
                              className="sensitive-data-button text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                            >
                              <IconEye size={16} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            Mobile:{' '}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSensitiveData(customer, 'mobile_number');
                              }}
                              className="sensitive-data-button text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                            >
                              <IconEye size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-10">
                  <IconUserPlus size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 dark:text-gray-400">No customers found matching the filters.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex space-x-2" aria-label="Pagination">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
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
                  <div className="sm:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm text-sm flex items-center gap-2 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                    <IconAlertCircle size={20} />
                    <span>{errors.general}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <label htmlFor="surname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Surname</label>
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.surname && <p className="text-xs text-red-600 mt-1">{errors.surname}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                  <input
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.mobile_number && <p className="text-xs text-red-600 mt-1">{errors.mobile_number}</p>}
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  >
                    <option value="">Select Gender</option>
                    {dropdownData.gender.map(gender => (
                      <option key={gender.id} value={gender.id}>{gender.name}</option>
                    ))}
                  </select>
                  {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
                </div>
                <div>
                  <label htmlFor="package_name_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Package</label>
                  <select
                    name="package_name_id"
                    value={formData.package_name_id}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  >
                    <option value="">Select Package</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
                  {errors.package_name_id && <p className="text-xs text-red-600 mt-1">{errors.package_name_id}</p>}
                </div>
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.dob && <p className="text-xs text-red-600 mt-1">{errors.dob}</p>}
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

        {/* Privacy Consent Modal */}
        {showPrivacyModal && selectedCustomerForPrivacyModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-4 backdrop-blur-sm animate-modal-fade-in">
            <div className="bg-white rounded-xl w-full max-w-md p-6 relative shadow-2xl ring-1 ring-gray-900/5 animate-modal-slide-down dark:bg-gray-800 dark:ring-gray-700">
              <button
                onClick={handlePrivacyModalClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors duration-200 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close modal"
              >
                <IconX size={24} stroke={1.5} />
              </button>
              <h3 className="text-2xl mb-6 text-gray-900 leading-tight dark:text-gray-100 text-center">
                View {viewingDataType === 'email' ? 'Email' : 'Mobile Number'}
              </h3>
              {!hasAgreedToPrivacyInModal ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    You are about to view sensitive information for {selectedCustomerForPrivacyModal.full_name || selectedCustomerForPrivacyModal.user_id}. Please confirm you have the necessary permissions.
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrivacyModalAgree}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Agree
                    </button>
                  </div>
                </div>
              ) : isLoadingSensitiveData ? (
                <div className="flex justify-center items-center py-4">
                  <IconLoader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    {viewingDataType === 'email' ? 'Email' : 'Mobile Number'}: {selectedCustomerForPrivacyModal[viewingDataType]}
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .customer-card {
            animation: fadeIn 0.4s ease-out forwards;
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
          select::-ms-expand {
            display: none;
          }
        `}</style>
        </div>
    </main>
  );
}

export default MyCustomers;