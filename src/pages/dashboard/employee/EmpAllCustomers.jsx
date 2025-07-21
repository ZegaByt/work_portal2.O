import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { IconSearch, IconFilter, IconUserCircle, IconX, IconRefresh, IconAlertCircle, IconPower, IconUserPlus, IconList, IconGridDots, IconLoader2, IconCircleCheckFilled, IconMail, IconPhone, IconCalendar, IconGenderBigender, IconRulerMeasure } from '@tabler/icons-react';
import { getData, postData, patchData } from '../../../store/httpService';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../../contexts/AuthContext'; // Corrected import path

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
  ['bg-gradient-to-br from-lime-500 to-gray-900', 'text-gray-900'],
  ['bg-gradient-to-br from-yellow-500 to-yellow-600', 'text-gray-900'],
  ['bg-gradient-to-br from-amber-500 to-amber-600', 'text-white'],
  ['bg-gradient-to-br from-orange-500 to-orange-600', 'text-white'],
  ['bg-gradient-to-br from-fuchsia-500 to-fuchsia-600', 'text-white'],
  ['bg-gradient-to-br from-emerald-500 to-emerald-600', 'text-white'],
  ['bg-gradient-to-br from-sky-500 to-sky-600', 'text-white'],
];

// Configure backend base URL for static media files
const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL;

// ProfileAvatar Component to handle image loading and fallbacks
const ProfileAvatar = React.memo(({ customer, viewMode, bgColorClass, textColorClass, getInitials }) => {
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
        loading="lazy"
        className={`flex-shrink-0 w-12 h-12 rounded-full object-cover shadow-md ${viewMode === 'grid' ? '' : 'mr-2'} transform-gpu transition-transform duration-300 group-hover:scale-110`}
        onError={handleImageError}
      />
    );
  } else {
    return (
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-normal shadow-md ${viewMode === 'grid' ? '' : 'mr-2'} ${bgColorClass} ${textColorClass}`}>
        {getInitials(customer)}
      </div>
    );
  }
});

// Unique key for local storage to prevent conflicts
const LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS = 'empAllCustomersFilters';

function EmpAllCustomers() {
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
  const [activeRequests, setActiveRequests] = useState(new Set()); // Changed to a simple Set, managed directly
  const [fetchError, setFetchError] = useState(null);
  const [selectedCustomerForPrivacyModal, setSelectedCustomerForPrivacyModal] = useState(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasAgreedToPrivacyInModal, setHasAgreedToPrivacyInModal] = useState(false);
  const [isLoadingSensitiveData, setIsLoadingSensitiveData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_searchQuery`) || '');
  const [filterAge, setFilterAge] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterAge`) || '');
  const [filterGender, setFilterGender] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterGender`) || '');
  const [filterHeight, setFilterHeight] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterHeight`) || '');
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterStatus`) || '');
  const [filterProfileFor, setFilterProfileFor] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterProfileFor`) || '');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPaymentStatus`) || '');
  const [viewingDataType, setViewingDataType] = useState(null); // State to track which sensitive data is being viewed

  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    email: '',
    mobile_number: '',
    password: '',
    confirm_password: '',
    gender: '',
    profile_for: '',
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const searchTimeoutRef = useRef(null);

  const employeeName = user?.full_name || user?.first_name || 'Employee';
  const employeeId = user?.id || 'N/A';

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
    });
    setErrors({});
  }, []);

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

  const formatDropdownValue = useCallback((id, key, allDropdownData) => {
    const options = allDropdownData[key]?.results || allDropdownData[key];
    if (!options) return 'N/A';
    const item = options.find(o => String(o.id) === String(id));
    return item ? (key === 'height' ? `${item.height} ft` : item.name) : 'N/A';
  }, []);

  // Modified calculateAge to return only years
  const calculateAge = useCallback((dobString) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    // Adjust years if birthday hasn't occurred yet this year
    if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) {
      years--;
    }
    return `${years} year${years !== 1 ? 's' : ''}`;
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  const getPASStyles = useCallback((customer) => {
    const {
      payment_status,
      agreement_status,
      settlement_status,
      payment_admin_approval,
      admin_agreement_approval,
      settlement_admin_approval,
    } = customer;

    const greenColor = 'text-green-600 dark:text-green-400';
    const redColor = 'text-red-600 dark:text-red-400';
    const yellowColor = 'text-yellow-600 dark:text-yellow-400';
    const defaultColor = 'text-gray-500 dark:text-gray-400';
    const greenBgColor = 'bg-green-100 dark:bg-green-900/20';
    const redBgColor = 'bg-red-100 dark:bg-red-900/20';
    const yellowBgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
    const defaultBgColor = 'bg-gray-100 dark:bg-gray-700/50';
    const greenBorderColor = 'border-green-600 dark:border-green-500';
    const redBorderColor = 'border-red-600 dark:border-red-500';
    const yellowBorderColor = 'border-yellow-600 dark:border-yellow-500';
    const defaultBorderColor = 'border-gray-600 dark:border-gray-500';
    const greenShadow = '0 0 8px rgba(0, 255, 0, 0.3)';
    const greenShadowHover = '0 0 12px rgba(0, 255, 0, 0.5)';
    const redShadow = '0 0 8px rgba(255, 0, 0, 0.3)';
    const redShadowHover = '0 0 12px rgba(255, 0, 0, 0.5)';
    const yellowShadow = '0 0 8px rgba(255, 255, 0, 0.3)';
    const yellowShadowHover = '0 0 12px rgba(255, 255, 0, 0.5)';
    const defaultShadow = '0 0 8px rgba(128, 128, 128, 0.3)';
    const defaultShadowHover = '0 0 12px rgba(128, 128, 128, 0.5)';

    const areStatusesDefined =
      payment_status !== null &&
      payment_status !== undefined &&
      agreement_status !== null &&
      agreement_status !== undefined &&
      settlement_status !== null &&
      settlement_status !== undefined;

    const hasAdminApprovalCondition =
      (payment_admin_approval === 2 || payment_admin_approval === 3) ||
      (admin_agreement_approval === 2 || admin_agreement_approval === 3) ||
      (settlement_admin_approval === 2 || settlement_admin_approval === 3);
    const hasStatusCondition =
      areStatusesDefined &&
      (payment_status === 2 || agreement_status === 2 || settlement_status === 2);

    if (!hasAdminApprovalCondition && !hasStatusCondition) {
      return { shouldDisplayPAS: false, showNoAction: areStatusesDefined && payment_status === 1 && agreement_status === 1 && settlement_status === 1 };
    }

    const pColor =
      payment_admin_approval === 2 ? greenColor :
      payment_admin_approval === 3 ? redColor :
      payment_status === 2 ? yellowColor : defaultColor;
    const pBgColor =
      payment_admin_approval === 2 ? greenBgColor :
      payment_admin_approval === 3 ? redBgColor :
      payment_status === 2 ? yellowBgColor : defaultBgColor;
    const pBorderColor =
      payment_admin_approval === 2 ? greenBorderColor :
      payment_admin_approval === 3 ? redBorderColor :
      payment_status === 2 ? yellowBorderColor : defaultBorderColor;
    const pShadow =
      payment_admin_approval === 2 ? greenShadow :
      payment_admin_approval === 3 ? redShadow :
      payment_status === 2 ? yellowShadow : defaultShadow;
    const pShadowHover =
      payment_admin_approval === 2 ? greenShadowHover :
      payment_admin_approval === 3 ? redShadowHover :
      payment_status === 2 ? yellowShadowHover : defaultShadowHover;

    const aColor =
      admin_agreement_approval === 2 ? greenColor :
      admin_agreement_approval === 3 ? redColor :
      agreement_status === 2 ? yellowColor : defaultColor;
    const aBgColor =
      admin_agreement_approval === 2 ? greenBgColor :
      admin_agreement_approval === 3 ? redBgColor :
      agreement_status === 2 ? yellowBgColor : defaultBgColor;
    const aBorderColor =
      admin_agreement_approval === 2 ? greenBorderColor :
      admin_agreement_approval === 3 ? redBorderColor :
      agreement_status === 2 ? yellowBorderColor : defaultBorderColor;
    const aShadow =
      admin_agreement_approval === 2 ? greenShadow :
      admin_agreement_approval === 3 ? redShadow :
      agreement_status === 2 ? yellowShadow : defaultShadow;
    const aShadowHover =
      admin_agreement_approval === 2 ? greenShadowHover :
      admin_agreement_approval === 3 ? redShadowHover :
      agreement_status === 2 ? yellowShadowHover : defaultShadowHover;

    const sColor =
      settlement_admin_approval === 2 ? greenColor :
      settlement_admin_approval === 3 ? redColor :
      settlement_status === 2 ? yellowColor : defaultColor;
    const sBgColor =
      settlement_admin_approval === 2 ? greenBgColor :
      settlement_admin_approval === 3 ? redBgColor :
      settlement_status === 2 ? yellowBgColor : defaultBgColor;
    const sBorderColor =
      settlement_admin_approval === 2 ? greenBorderColor :
      settlement_admin_approval === 3 ? redBorderColor :
      settlement_status === 2 ? yellowBorderColor : defaultBorderColor;
    const sShadow =
      settlement_admin_approval === 2 ? greenShadow :
      settlement_admin_approval === 3 ? redShadow :
      settlement_status === 2 ? yellowShadow : defaultShadow;
    const sShadowHover =
      settlement_admin_approval === 2 ? greenShadowHover :
      settlement_admin_approval === 3 ? redShadowHover :
      settlement_status === 2 ? yellowShadowHover : defaultShadowHover;

    return {
      shouldDisplayPAS: true,
      showNoAction: false,
      pColor,
      pBgColor,
      pBorderColor,
      pShadow,
      pShadowHover,
      aColor,
      aBgColor,
      aBorderColor,
      aShadow,
      aShadowHover,
      sColor,
      sBgColor,
      sBorderColor,
      sShadow,
      sShadowHover,
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    setFetchError(null);
    try {
      const [customersRes, gendersRes, profileForRes, employmentTypeRes, educationRes, countriesRes, statesRes, districtsRes, packagesRes, heightsRes] = await Promise.all([
        getData('/customers/'),
        getData('/gender/'),
        getData('/profile-for/'),
        getData('/employment_type/'),
        getData('/education/'),
        getData('/country/'),
        getData('/state/'),
        getData('/district/'),
        getData('/package_name/'),
        getData('/height/'),
      ]);

      if (customersRes.data && Array.isArray(customersRes.data)) {
        setCustomers(customersRes.data.sort((a, b) => b.user_id - a.user_id)); // Sort in descending order
      } else {
        console.error('Unexpected customers API response format:', customersRes.data);
        setCustomers([]);
        setFetchError('Unexpected data format for customers.');
      }

      setDropdownData(prevData => ({
        ...prevData,
        gender: gendersRes.data?.results || [],
        'profile-for': profileForRes.data?.results || [],
        employment_type: employmentTypeRes.data?.results || [],
        education: educationRes.data?.results || [],
        country: countriesRes.data?.results || [],
        state: statesRes.data?.results || [],
        district: districtsRes.data?.results || [],
        height: heightsRes.data?.results || [],
      }));
      setPackages(packagesRes.data?.results || []);
    } catch (error) {
      console.error('Error fetching data for EmpAllCustomers:', error);
      setFetchError('Failed to load data. Please try again.');
      setCustomers([]);
      setDropdownData({
        gender: [], 'profile-for': [], employment_type: [], education: [],
        country: [], state: [], district: [], height: [],
      });
      setPackages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access this page.');
      logout();
      navigate('/login');
      return;
    }
    fetchData();
    // No need to return a cleanup function for activeRequests if it's a simple Set
  }, [isAuthenticated, navigate, logout, fetchData]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_searchQuery`, searchQuery);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterAge`, filterAge);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterGender`, filterGender);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterHeight`, filterHeight);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterStatus`, filterStatus);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterProfileFor`, filterProfileFor);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPaymentStatus`, filterPaymentStatus);
  }, [searchQuery, filterAge, filterGender, filterHeight, filterStatus, filterProfileFor, filterPaymentStatus]);

  const debouncedSetSearchQuery = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSetSearchQuery(e.target.value);
  };

  const filteredCustomersMemo = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return customers.filter(customer => {
      const displayFullName = customer.full_name || (customer.first_name && customer.surname ? `${customer.first_name} ${customer.surname}` : '');
      const fullName = displayFullName.toLowerCase();
      const userId = String(customer.user_id || '').toLowerCase();
      const genderName = formatDropdownValue(customer.gender, 'gender', dropdownData).toLowerCase();
      const profileForName = formatDropdownValue(customer.profile_for, 'profile-for', dropdownData).toLowerCase();
      const heightValue = formatDropdownValue(customer.height, 'height', dropdownData).toLowerCase();

      const matchesSearch = fullName.includes(lowerCaseQuery) ||
        userId.includes(lowerCaseQuery) ||
        genderName.includes(lowerCaseQuery) ||
        profileForName.includes(lowerCaseQuery) ||
        heightValue.includes(lowerCaseQuery) ||
        customer.email?.toLowerCase().includes(lowerCaseQuery) ||
        customer.mobile_number?.includes(lowerCaseQuery);

      const matchesAge = filterAge === '' || String(calculateAge(customer.dob)).includes(filterAge); // Filter by calculated age (years only)
      const matchesGender = filterGender === '' || String(customer.gender) === filterGender;
      const matchesHeight = filterHeight === '' || String(customer.height) === filterHeight;
      const matchesStatus = filterStatus === '' ||
        (filterStatus === 'online' && customer.account_status === true) ||
        (filterStatus === 'offline' && customer.account_status === false);
      const matchesProfileFor = filterProfileFor === '' || String(customer.profile_for) === filterProfileFor;
      const matchesPaymentStatus = filterPaymentStatus === '' ||
        (filterPaymentStatus === 'paid' && (customer.payment_status === true || customer.payment_status === 2 || String(customer.payment_status).toLowerCase() === 'paid')) ||
        (filterPaymentStatus === 'pending' && !(customer.payment_status === true || customer.payment_status === 1 || String(customer.payment_status).toLowerCase() === 'paid'));

      return matchesSearch && matchesAge && matchesGender && matchesHeight && matchesStatus && matchesProfileFor && matchesPaymentStatus;
    }).sort((a, b) => b.user_id - a.user_id); // Sort filtered customers in descending order
  }, [customers, searchQuery, filterAge, filterGender, filterHeight, filterStatus, filterProfileFor, filterPaymentStatus, dropdownData, formatDropdownValue, calculateAge]); // Added calculateAge to dependencies

  useEffect(() => {
    setFilteredCustomers(filteredCustomersMemo);
    setCurrentPage(1);
  }, [filteredCustomersMemo]);

  const validatePassword = (password) => {
    const newErrors = {};
    if (password.length < 8) {
      newErrors.length = 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
      newErrors.uppercase = 'Password must contain at least one uppercase letter.';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      newErrors.specialChar = 'Password must contain at least one special character.';
    }
    if (!/[0-9]/.test(password)) {
      newErrors.number = 'Password must contain at least one number.';
    }
    return newErrors;
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (name === 'password' || name === 'confirm_password') {
      const passwordErrors = validatePassword(name === 'password' ? value : formData.password);
      const confirmPasswordError = name === 'confirm_password' && value !== formData.password ? 'Passwords do not match.' : undefined;
      setErrors(prev => ({
        ...prev,
        password: passwordErrors,
        confirm_password: confirmPasswordError,
        general: undefined,
      }));
      if (name === 'password' && formData.confirm_password && value !== formData.confirm_password) {
        setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match.' }));
      } else if (name === 'password' && formData.confirm_password && value === formData.confirm_password) {
        setErrors(prev => ({ ...prev, confirm_password: undefined }));
      }
    } else {
      if (errors.general && Object.keys(errors).length === 1) {
        setErrors({});
      }
    }
  }, [errors, formData]);

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

  const handleFilterProfileForChange = (e) => {
    setFilterProfileFor(e.target.value);
  };

  const handleFilterPaymentStatusChange = (e) => {
    setFilterPaymentStatus(e.target.value);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    let currentErrors = {};

    const passwordValidationErrors = validatePassword(formData.password);
    if (Object.keys(passwordValidationErrors).length > 0) {
      currentErrors.password = passwordValidationErrors;
    }
    if (formData.password !== formData.confirm_password) {
      currentErrors.confirm_password = 'Passwords do not match.';
    }

    const requiredFields = ['first_name', 'surname', 'email', 'mobile_number', 'password', 'gender', 'profile_for'];
    requiredFields.forEach(field => {
      if (typeof formData[field] === 'string' && formData[field].trim() === '') {
        currentErrors[field] = `${field.replace(/_/g, ' ')} is required.`;
      } else if (formData[field] === null || formData[field] === undefined) {
        currentErrors[field] = `${field.replace(/_/g, ' ')} is required.`;
      }
    });

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      setIsSubmitting(false);
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
    };

    try {
      await postData('/customer/create/', submitData);
      toast.success('Customer added successfully!');
      setIsModalOpen(false);
      resetFormDataAndErrors();
      fetchData();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback(async (userId, currentStatus) => {
    const requestId = uuidv4();
    // Use the functional update for activeRequests to ensure latest state
    setActiveRequests(prev => {
      if (prev.has(requestId)) {
        console.warn(`[Request ${requestId}] Duplicate status toggle request for ${userId} ignored`);
        return prev;
      }
      return new Set([...prev, requestId]);
    });

    const actionText = !currentStatus ? 'online' : 'offline';
    if (!window.confirm(`Are you sure you want to change customer ${userId} to ${actionText} status?`)) {
      setActiveRequests(prev => { // Remove the request ID if user cancels
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      return;
    }

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
      await fetchData();
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
  }, [navigate, isAuthenticated, logout, fetchData]);

  const formatPaymentStatus = useCallback((statusValue) => {
    if (statusValue === true || statusValue === 2 || String(statusValue).toLowerCase() === 'paid') {
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
  const paginatedCustomers = useMemo(() => filteredCustomers.slice(startIndex, endIndex), [filteredCustomers, startIndex, endIndex]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        resetFormDataAndErrors();
        setShowPrivacyModal(false);
        setSelectedCustomerForPrivacyModal(null);
        setHasAgreedToPrivacyInModal(false);
        setViewingDataType(null);
        setIsLoadingSensitiveData(false);
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
    setFilterGender('');
    setFilterHeight('');
    setFilterStatus('');
    setFilterProfileFor('');
    setFilterPaymentStatus('');
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_searchQuery`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterAge`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterGender`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterHeight`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterStatus`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterProfileFor`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPaymentStatus`);
  };

  const renderFilterInput = (id, label, type, value, onChange, placeholder) => {
    const isHighlighted = value !== '';
    return (
      <div className="relative flex-1 min-w-[100px] sm:min-w-[120px]">
        <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-300 truncate">
          {label}
        </label>
        <input
          type={type}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full px-2 py-1.5 rounded-md border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${isHighlighted ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
        />
        {value && (
          <button
            onClick={() => onChange({ target: { value: '' }})}
            className="absolute right-1 top-1/2 mt-1 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
            title={`Clear ${label}`}
          >
            <IconX size={14} />
          </button>
        )}
      </div>
    );
  };

  const renderFilterSelect = (id, label, value, onChange, options) => {
    const isHighlighted = value !== '';
    return (
      <div className="relative flex-1 min-w-[100px] sm:min-w-[120px]">
        <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-300 truncate">
          {label}
        </label>
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full px-2 py-1.5 border rounded-md bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none shadow-sm text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${isHighlighted ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
        >
          <option value="">{`All ${label.replace('Filter by ', '')}`}</option>
          {options?.map((option) => (
            <option key={option.id || option.value} value={option.id || option.value}>
              {option.name || option.label || option.height}
            </option>
          ))}
        </select>
        {value && (
          <button
            onClick={() => onChange({ target: { value: '' }})}
            className="absolute right-1 top-1/2 mt-1 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
            title={`Clear ${label}`}
          >
            <IconX size={14} />
          </button>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700 mt-1 dark:text-gray-400">
          <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l-.707.707L13.636 18l4.95-4.95-.707-.707L13.636 16.536z"/></svg>
        </div>
      </div>
    );
  };

  return (
    <main className="p-0 sm:p-0 bg-gray-50 min-h-screen selection:bg-indigo-600 selection:text-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="w-full px-2 sm:px-4 lg:px-0 py-0"> {/* Changed to w-full and adjusted horizontal padding */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 mt-2 gap-2 sm:gap-0"> {/* Reduced margin-bottom and gap */}
          <h2 className="text-xl font-normal tracking-tight text-gray-900 leading-tight dark:text-gray-100">
            All Customers
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto"> {/* Reduced gap */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by ID, Name, Email, Mobile..."
                defaultValue={searchQuery}
                onChange={handleSearchChange}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 text-sm text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${searchQuery ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'}`}
              />
              <IconSearch size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Clear Search Query"
                >
                  <IconX size={14} />
                </button>
              )}
            </div>
            <button
              onClick={fetchData}
              className="flex items-center justify-center gap-1 bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white rounded-lg px-3 py-1.5 text-sm font-normal shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed" // Reduced padding
              disabled={refreshing}
            >
              {refreshing ? (
                <span className="animate-spin h-4 w-4 border-1.5 border-t-1.5 border-white rounded-full"></span>
              ) : (
                <IconRefresh size={18} />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center justify-center p-2 rounded-lg bg-white text-indigo-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 dark:bg-gray-700 dark:text-indigo-400"
              title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
            >
              {viewMode === 'grid' ? <IconList size={18} /> : <IconGridDots size={18} />}
            </button>
            <button
              onClick={() => {
                resetFormDataAndErrors();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-lg px-4 py-2 text-sm font-normal shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto"
            >
              <IconUserPlus size={18} />
              Add Customer
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-x-2 gap-y-3 mb-6"> {/* Reduced gap */}
          {renderFilterInput('filterAge', 'Age', 'number', filterAge, handleFilterAgeChange, 'e.g., 30')}
          {renderFilterSelect('filterGender', 'Gender', filterGender, handleFilterGenderChange, dropdownData.gender)}
          {renderFilterSelect('filterHeight', 'Height', filterHeight, handleFilterHeightChange, dropdownData.height.map(h => ({id: h.id, label: `${h.height} ft`})))}
          {renderFilterSelect('filterStatus', 'Account Status', filterStatus, handleFilterStatusChange, [
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'Offline' }
          ])}
          {renderFilterSelect('filterProfileFor', 'Profile For', filterProfileFor, handleFilterProfileForChange, dropdownData['profile-for'])}
          {renderFilterSelect('filterPaymentStatus', 'Payment Status', filterPaymentStatus, handleFilterPaymentStatusChange, [
            { value: 'paid', label: 'Paid' },
            { value: 'pending', label: 'Pending' }
          ])}
          <div className="w-full flex justify-end">
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors shadow-sm flex items-center gap-1.5 text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" // Reduced padding
            >
              <IconX size={16} />
              Clear All Filters
            </button>
          </div>
        </div>
        {fetchError && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md mb-4 flex items-center gap-1.5 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300" role="alert">
            <IconAlertCircle size={18} className="flex-shrink-0" />
            <span className="block sm:inline text-sm">{fetchError}</span>
          </div>
        )}
        {loading ? (
          <div className={`transition-all duration-500 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4' : 'space-y-3'}`}> {/* Adjusted grid columns, reduced gap */}
            {[...Array(itemsPerPage)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-3 shadow-sm animate-pulse border border-gray-100 min-h-[120px] dark:bg-gray-800 dark:border-gray-700"> {/* Reduced padding, shadow, min-height */}
                <div className="flex items-start mb-3"> {/* Reduced margin-bottom */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 mr-3 dark:bg-gray-700"></div> {/* Reduced size */}
                  <div className="flex-grow space-y-1.5"> {/* Reduced space-y */}
                    <div className="h-3 bg-gray-200 rounded w-1/3 dark:bg-gray-700"></div> {/* Reduced height */}
                    <div className="h-4 bg-gray-200 rounded w-2/3 dark:bg-gray-700"></div> {/* Reduced height */}
                  </div>
                </div>
                <div className="h-0.5 bg-gray-200 rounded mb-3 dark:bg-gray-700"></div> {/* Reduced margin-bottom */}
                <div className="space-y-1.5"> {/* Reduced space-y */}
                  <div className="h-3 bg-gray-200 rounded"></div> {/* Reduced height */}
                  <div className="h-3 bg-gray-200 rounded"></div> {/* Reduced height */}
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div> {/* Reduced height */}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={`transition-all duration-500 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4' : 'space-y-3'}`}> {/* Adjusted grid columns, reduced gap */}
              {filteredCustomers.length > 0 ? (
                paginatedCustomers.map((customer, index) => {
                  const [bgColorClass, textColorClass] = customerColors[customer.user_id] || ['bg-gray-400', 'text-gray-900'];
                  const isOnline = customer.account_status !== undefined ? customer.account_status : false;
                  const isProfileVerified = Boolean(customer.profile_verified);
                  const pasStyles = getPASStyles(customer);
                  const customerAge = calculateAge(customer.dob); // Now returns years only
                  const formattedDob = formatDate(customer.dob);

                  return (
                    <div
                      key={customer.user_id}
                      onClick={() => navigate(`/dashboard/employee/customer/${customer.user_id}`)}
                      className={`customer-card rounded-lg bg-white p-3 flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center'} cursor-pointer border border-gray-100 relative overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:rotate-z-0.5 dark:bg-gray-800 dark:border-gray-700`} // Reduced padding, rounded-lg, shadow, transform
                      style={{ animationDelay: `${index * 0.05}s` }} // Faster animation delay
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 dark:from-gray-700 dark:to-gray-800"></div>
                      <div className="absolute inset-0 border-1.5 border-transparent group-hover:border-blue-300 rounded-lg transition-all duration-300 z-10"></div> {/* Reduced border size */}
                      {pasStyles.showNoAction && (
                        <div className="absolute top-1 left-1 text-[9px] font-normal px-1 py-0.5 rounded-full text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50 bg-opacity-80 backdrop-blur-sm z-30 shadow-xs border border-gray-600 dark:border-gray-500"> {/* Reduced font, padding, shadow, border */}
                          No Action
                        </div>
                      )}
                      {pasStyles.shouldDisplayPAS && (
                        <div className="absolute top-1 left-1 flex space-x-0.5 z-30"> {/* Reduced space-x */}
                          <div className={`text-[8px] font-bold px-1 py-0.5 border-1 rounded-sm shadow-xs backdrop-blur-sm transition-all duration-200 ${pasStyles.pColor} ${pasStyles.pBgColor} ${pasStyles.pBorderColor}`} style={{ boxShadow: pasStyles.pShadow }} onMouseOver={e => e.currentTarget.style.boxShadow = pasStyles.pShadowHover} onMouseOut={e => e.currentTarget.style.boxShadow = pasStyles.pShadow}> {/* Reduced font, padding, border, shadow */}
                            P
                          </div>
                          <div className={`text-[8px] font-bold px-1 py-0.5 border-1 rounded-sm shadow-xs backdrop-blur-sm transition-all duration-200 ${pasStyles.aColor} ${pasStyles.aBgColor} ${pasStyles.aBorderColor}`} style={{ boxShadow: pasStyles.aShadow }} onMouseOver={e => e.currentTarget.style.boxShadow = pasStyles.aShadowHover} onMouseOut={e => e.currentTarget.style.boxShadow = pasStyles.aShadow}> {/* Reduced font, padding, border, shadow */}
                            A
                          </div>
                          <div className={`text-[8px] font-bold px-1 py-0.5 border-1 rounded-sm shadow-xs backdrop-blur-sm transition-all duration-200 ${pasStyles.sColor} ${pasStyles.sBgColor} ${pasStyles.sBorderColor}`} style={{ boxShadow: pasStyles.sShadow }} onMouseOver={e => e.currentTarget.style.boxShadow = pasStyles.sShadowHover} onMouseOut={e => e.currentTarget.style.boxShadow = pasStyles.sShadow}> {/* Reduced font, padding, border, shadow */}
                            S
                          </div>
                        </div>
                      )}
                      <div className={`absolute top-1 right-1 w-2 h-2 ${isOnline ? 'bg-green-500 animate-pulse-slow' : 'bg-red-500'} rounded-full z-30 shadow-xs`}></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(customer.user_id, isOnline);
                        }}
                        disabled={isChangingStatus[customer.user_id]}
                        className="absolute top-5 right-0.5 text-gray-500 hover:text-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-full p-0.5 z-30 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-indigo-300"
                        title={isOnline ? 'Change to Offline' : 'Change to Online'}
                      >
                        {isChangingStatus[customer.user_id] ? (
                          <span className="animate-spin h-3.5 w-3.5 border-1.5 border-t-1.5 border-indigo-600 rounded-full"></span>
                        ) : (
                          <IconPower size={14} />
                        )}
                      </button>

                      {/* Main customer info block: Image, ID, Name in one row */}
                      <div className={`flex items-center gap-2 z-20 w-full ${viewMode === 'grid' ? 'mb-2 pt-4' : 'mr-4'}`}>
                        <ProfileAvatar
                          customer={customer}
                          viewMode={viewMode}
                          bgColorClass={bgColorClass}
                          textColorClass={textColorClass}
                          getInitials={getInitials}
                        />
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate">ID: {customer.user_id}</p>
                          <h3 className="text-base font-normal text-gray-900 dark:text-gray-100 truncate flex items-center gap-1">
                            {customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim() || 'Unnamed Customer'}
                            {isProfileVerified && (
                              <IconCircleCheckFilled
                                size={14}
                                className="text-blue-500 dark:text-blue-400"
                                title="Profile Verified"
                              />
                            )}
                          </h3>
                        </div>
                      </div>

                      {/* Combined Contact, Gender, Height Info */}
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs mb-2 w-full z-20 flex-wrap">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewSensitiveData(customer, 'email'); }}
                          className="text-gray-600 dark:text-gray-300 flex items-center gap-0.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="View Email"
                        >
                          <IconMail size={14} className="text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        </button>
                        <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewSensitiveData(customer, 'mobile'); }}
                          className="text-gray-600 dark:text-gray-300 flex items-center gap-0.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="View Mobile Number"
                        >
                          <IconPhone size={14} className="text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        </button>
                        {customer.gender !== null && customer.gender !== undefined && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>
                            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-0.5">
                              <IconGenderBigender size={14} className="flex-shrink-0 text-gray-500 dark:text-gray-400"/>
                              {formatDropdownValue(customer.gender, 'gender', dropdownData)}
                            </p>
                          </>
                        )}
                        {customer.height !== null && customer.height !== undefined && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>
                            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-0.5">
                              <IconRulerMeasure size={14} className="flex-shrink-0 text-gray-500 dark:text-gray-400"/>
                              {formatDropdownValue(customer.height, 'height', dropdownData)}
                            </p>
                          </>
                        )}
                      </div>

                      {viewMode === 'grid' && <div className="border-b border-gray-200 mb-2 z-20 w-full dark:border-gray-700"></div>}
                      <div className={`flex-grow z-20 ${viewMode === 'list' ? 'flex flex-col sm:flex-row sm:items-center sm:gap-3' : ''} w-full`}>
                        {customer.dob && (
                          <p className="text-gray-600 text-xs mb-0.5 dark:text-gray-300 flex items-center gap-0.5">
                            <IconCalendar size={12} className="flex-shrink-0 text-gray-500 dark:text-gray-400"/>
                            <span className="font-medium">{formattedDob}</span>
                            <span className="text-gray-300 dark:text-gray-600 mx-0.5">|</span>
                            <span className="font-medium">{customerAge}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-base font-normal">No customers found matching the filters.</p>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex space-x-1.5" aria-label="Pagination">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1.5 rounded-md font-normal text-sm transition-all duration-200 ${currentPage === index + 1 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </>
        )}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-3 transition-opacity duration-300 backdrop-blur-sm">
            <div className="bg-white rounded-lg w-full max-w-md p-5 relative shadow-xl ring-1 ring-gray-900/5 animate-modal-slide-down dark:bg-gray-800 dark:ring-gray-700">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetFormDataAndErrors();
                }}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors duration-200 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close modal"
              >
                <IconX size={20} stroke={1.5} />
              </button>
              <h3 className="text-xl mb-4 text-gray-900 leading-tight dark:text-gray-100 text-center">
                Add New Customer
              </h3>
              <form
                onSubmit={handleAddCustomer}
                className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              >
                {errors.general && (
                  <div className="sm:col-span-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2.5 rounded-md shadow-sm text-sm flex items-center gap-1.5 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                    <IconAlertCircle size={16} />
                    <span>{errors.general}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="first_name" className="block text-xs font-normal mb-0.5 text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.first_name && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="surname" className="block text-xs font-normal mb-0.5 text-gray-700 dark:text-gray-300">
                    Surname
                  </label>
                  <input
                    id="surname"
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.surname && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.surname}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-normal mb-0.5 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="mobile_number" className="block text-xs font-normal mb-0.5 text-gray-700 dark:text-gray-300">
                    Mobile Number
                  </label>
                  <input
                    id="mobile_number"
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.mobile_number && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.mobile_number}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="gender" className="block text-xs font-normal mb-0.5 text-gray-700 dark:text-gray-300">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  >
                    <option value="">Select Gender</option>
                    {dropdownData.gender.map((genderOption) => (
                      <option key={genderOption.id} value={genderOption.id}>
                        {genderOption.name}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.gender}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="profile_for" className="block text-xs font-normal mb-0.5 text-gray-700 dark:text-gray-300">
                    Profile For
                  </label>
                  <select
                    id="profile_for"
                    name="profile_for"
                    value={formData.profile_for}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  >
                    <option value="">Select Profile For</option>
                    {dropdownData['profile-for'].map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {errors.profile_for && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.profile_for}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="block text-xs font-normal mb-0.5 text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.password && typeof errors.password === 'object' && (
                    <ul className="text-xs text-red-600 mt-0.5 list-disc pl-3">
                      {errors.password.length && <li>{errors.password.length}</li>}
                      {errors.password.uppercase && <li>{errors.password.uppercase}</li>}
                      {errors.password.specialChar && <li>{errors.password.specialChar}</li>}
                      {errors.password.number && <li>{errors.password.number}</li>}
                    </ul>
                  )}
                </div>
                <div>
                  <label htmlFor="confirm_password" className="block text-xs font-normal mb-0.5 text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    required
                  />
                  {errors.confirm_password && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.confirm_password}</p>
                  )}
                </div>
                <div className="flex justify-end pt-3 col-span-full">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-5 py-2 rounded-md font-semibold text-sm hover:bg-indigo-700 transition-all duration-300 shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-1.5">
                        <IconLoader2 className="animate-spin" size={16} />
                        Adding...
                      </span>
                    ) : (
                      'Add Customer'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showPrivacyModal && selectedCustomerForPrivacyModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-3 transition-opacity duration-300 backdrop-blur-sm">
            <div className="bg-white rounded-lg w-full max-w-sm p-5 relative shadow-xl ring-1 ring-gray-900/5 animate-modal-slide-down dark:bg-gray-800 dark:ring-gray-700">
              <button
                onClick={handlePrivacyModalClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors duration-200 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close privacy modal"
              >
                <IconX size={20} stroke={1.5} />
              </button>
              <h3 className="text-xl mb-3 text-gray-900 leading-tight dark:text-gray-100 text-center flex items-center justify-center gap-1.5">
                <IconAlertCircle size={24} className="text-red-500 dark:text-red-400" />
                Customer Data Privacy
              </h3>
              {!hasAgreedToPrivacyInModal ? (
                <>
                  <p className="text-gray-700 mb-3 dark:text-gray-300 font-medium text-sm">
                    Dear {employeeName} (ID: {employeeId}),
                  </p>
                  <p className="text-xs text-gray-600 mb-4 dark:text-gray-400 leading-normal">
                    This action will temporarily reveal sensitive customer information (Email and Mobile Number).
                    Please adhere to the company's privacy policy and ensure this data is not misused.
                    If you require persistent access or believe this is incorrect, please contact a SuperAdmin.
                  </p>
                  <div className="flex justify-end gap-2 border-t pt-3 border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold text-sm hover:bg-gray-300 transition-colors shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrivacyModalAgree}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-md font-semibold text-sm hover:from-indigo-700 hover:to-purple-800 transition-colors shadow-md transform hover:scale-105"
                      disabled={isLoadingSensitiveData}
                    >
                      {isLoadingSensitiveData ? (
                        <span className="flex items-center gap-1.5">
                          <IconLoader2 className="animate-spin" size={16} />
                          Loading...
                        </span>
                      ) : (
                        'Agree & View'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {isLoadingSensitiveData ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <IconLoader2 className="animate-spin text-indigo-500 mb-3" size={40} />
                      <p className="text-base text-gray-600 dark:text-gray-400">Loading sensitive data...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-red-600 font-semibold mb-3 dark:text-red-400 flex items-center gap-1.5">
                        <IconAlertCircle size={16} className="flex-shrink-0" />
                        Privacy Reminder: This sensitive information is for authorized viewing only. Please do not misuse this data.
                      </p>
                      <div className="space-y-2">
                        {viewingDataType === 'email' && selectedCustomerForPrivacyModal.email && (
                          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 flex items-center gap-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-300 hover:shadow-sm">
                            <IconMail size={20} className="text-blue-500 flex-shrink-0 dark:text-blue-400" />
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email Address:</p>
                              <p className="text-gray-800 font-semibold dark:text-gray-100 break-words text-base">{selectedCustomerForPrivacyModal.email}</p>
                            </div>
                          </div>
                        )}
                        {viewingDataType === 'mobile' && selectedCustomerForPrivacyModal.mobile_number && (
                          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 flex items-center gap-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-300 hover:shadow-sm">
                            <IconPhone size={20} className="text-green-500 flex-shrink-0 dark:text-green-400" />
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Mobile Number:</p>
                              <p className="text-gray-800 font-semibold dark:text-gray-100 text-base">{selectedCustomerForPrivacyModal.mobile_number}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end pt-4 border-t mt-4 border-gray-200 dark:border-gray-700">
                        <button
                          onClick={handlePrivacyModalClose}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold text-sm hover:bg-gray-300 transition-colors shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes modalSlideDown {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-slide-down {
          animation: modalSlideDown 0.3s ease-out forwards;
        }
        @keyframes cardEnter {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .customer-card {
          opacity: 0;
          transform: translateY(20px);
          animation: cardEnter 0.4s ease-out forwards;
        }
        .hover\\:rotate-z-0\\.5:hover { /* Adjusted for smaller rotation */
          transform: translateY(-2px) rotateZ(0.25deg);
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        select::-ms-expand {
          display: none;
        }
      `}</style>
    </main>
  );
}

export default EmpAllCustomers;
