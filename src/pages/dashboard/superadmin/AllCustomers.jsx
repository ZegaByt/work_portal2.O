import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { IconSearch, IconFilter, IconUserCircle, IconX, IconRefresh, IconAlertCircle, IconPower, IconUserPlus, IconList, IconGridDots, IconLoader2, IconCircleCheckFilled, IconMail, IconPhone, IconCalendar, IconGenderBigender, IconRulerMeasure } from '@tabler/icons-react';
import { getData, postData, patchData } from '../../../store/httpService';
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
  ['bg-gradient-to-br from-lime-500 to-gray-900', 'text-gray-900'],
  ['bg-gradient-to-br from-yellow-500 to-yellow-600', 'text-gray-900'],
  ['bg-gradient-to-br from-amber-500 to-amber-600', 'text-white'],
  ['bg-gradient-to-br from-orange-500 to-orange-600', 'text-white'],
  ['bg-gradient-to-br from-fuchsia-500 to-fuchsia-600', 'text-white'],
  ['bg-gradient-to-br from-emerald-500 to-emerald-600', 'text-white'],
  ['bg-gradient-to-br from-sky-500 to-sky-600', 'text-white'],
];

// Configure backend base URL for static media files
const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL

// ProfileAvatar Component to handle image loading and fallbacks
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
    height: [], // Add height to dropdownData state
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
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission loader

  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_searchQuery`) || '');
  const [filterAge, setFilterAge] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterAge`) || '');
  const [filterGender, setFilterGender] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterGender`) || '');
  const [filterHeight, setFilterHeight] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterHeight`) || '');
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterStatus`) || '');
  const [filterProfileFor, setFilterProfileFor] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterProfileFor`) || '');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPaymentStatus`) || '');

  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    email: '',
    mobile_number: '',
    password: '',
    confirm_password: '',
    gender: '',
    profile_for: '',
    // package_name_id: '', // Removed package_name_id
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

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
      // package_name_id: '', // Removed package_name_id
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
    return item ? (key === 'height' ? `${item.height} ft` : item.name) : 'N/A'; // For height, return item.height
  }, []);

  // Function to calculate age in years, months, and days
  const calculateAge = useCallback((dobString) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const now = new Date();

    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    let days = now.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); // Days in previous month
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

    return parts.join(', ') || '0 days';
  }, []);

  // Function to format DOB for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  const getPASStyles = (customer) => {
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
  };

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
        getData('/height/'), // Fetch height data
      ]);

      if (customersRes.data && Array.isArray(customersRes.data)) {
        setCustomers(customersRes.data);
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
        height: heightsRes.data?.results || [], // Set height data
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
    return () => {
      setActiveRequests(new Set());
    };
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

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const newFilteredCustomers = customers.filter(customer => {
      const displayFullName = customer.full_name || (customer.first_name && customer.surname ? `${customer.first_name} ${customer.surname}` : '');
      const fullName = displayFullName.toLowerCase();
      const userId = String(customer.user_id || '').toLowerCase();
      const genderName = formatDropdownValue(customer.gender, 'gender', dropdownData).toLowerCase();
      const profileForName = formatDropdownValue(customer.profile_for, 'profile-for', dropdownData).toLowerCase();
      const heightValue = formatDropdownValue(customer.height, 'height', dropdownData).toLowerCase(); // Get formatted height value

      const matchesSearch = fullName.includes(lowerCaseQuery) ||
        userId.includes(lowerCaseQuery) ||
        genderName.includes(lowerCaseQuery) ||
        profileForName.includes(lowerCaseQuery) ||
        heightValue.includes(lowerCaseQuery) || // Include height in search
        customer.email?.toLowerCase().includes(lowerCaseQuery) ||
        customer.mobile_number?.includes(lowerCaseQuery);

      const matchesAge = filterAge === '' || String(customer.age) === filterAge;
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
    });
    setFilteredCustomers(newFilteredCustomers);
    setCurrentPage(1);
  }, [customers, searchQuery, filterAge, filterGender, filterHeight, filterStatus, filterProfileFor, filterPaymentStatus, dropdownData, formatDropdownValue]);

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

  const handleInputChange = (e) => {
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

  const handleFilterProfileForChange = (e) => {
    setFilterProfileFor(e.target.value);
  };

  const handleFilterPaymentStatusChange = (e) => {
    setFilterPaymentStatus(e.target.value);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true); // Start submission loader

    let currentErrors = {};

    // Validate password fields
    const passwordValidationErrors = validatePassword(formData.password);
    if (Object.keys(passwordValidationErrors).length > 0) {
      currentErrors.password = passwordValidationErrors;
    }
    if (formData.password !== formData.confirm_password) {
      currentErrors.confirm_password = 'Passwords do not match.';
    }

    // Validate required fields
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
      setIsSubmitting(false); // Stop submission loader
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
      // package_name_id: formData.package_name_id, // Removed package_name_id from submission
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
      setIsSubmitting(false); // Stop submission loader
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
  }, [navigate, isAuthenticated, logout, activeRequests, fetchData]);

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
    setIsLoadingSensitiveData(false); // Reset loading state for new view
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
    }, 2000); // Simulate 2-second loading
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
    localStorage.removeItem(`${LOCAL_LOCAL_STORAGE_KEY_EMP_ALL_CUSTOMERS_FILTERS}_filterPaymentStatus`);
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
          className={`w-full pl-3 pr-8 py-2.5 rounded-lg border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${isHighlighted ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
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
    const isHighlighted = value !== '';
    return (
      <div className="relative flex-1 min-w-[120px]">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300 truncate">
          {label}
        </label>
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${isHighlighted ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-2 px-4 sm:px-0 gap-4 sm:gap-0">
          <h2 className="text-[1.8rem] font-normal tracking-tight text-gray-900 leading-tight dark:text-gray-100">
            All Customers
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by ID, Name, Email, Mobile..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${searchQuery ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'}`}
              />
              <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Clear Search Query"
                >
                  <IconX size={16} />
                </button>
              )}
            </div>
            <button
              onClick={fetchData}
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
              className="flex items-center justify-center p-3 rounded-xl bg-white text-indigo-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 dark:bg-gray-700 dark:text-indigo-400"
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
        <div className="flex flex-wrap items-end gap-x-4 gap-y-6 mb-8 px-4 sm:px-0">
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
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm flex items-center gap-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <IconX size={20} />
              Clear All Filters
            </button>
          </div>
        </div>
        {fetchError && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-lg shadow-md mb-6 mx-4 sm:mx-0 flex items-center gap-2 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300" role="alert">
            <IconAlertCircle size={20} className="flex-shrink-0" />
            <span className="block sm:inline">{fetchError}</span>
          </div>
        )}
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
                  const isOnline = customer.account_status !== undefined ? customer.account_status : false;
                  const isProfileVerified = Boolean(customer.profile_verified);
                  const pasStyles = getPASStyles(customer);
                  const customerAge = calculateAge(customer.dob); // Calculate age
                  const formattedDob = formatDate(customer.dob); // Format DOB

                  return (
                    <div
                      key={customer.user_id}
                      onClick={() => navigate(`/dashboard/superadmin/customer/${customer.user_id}`)}
                      className={`customer-card rounded-xl bg-white p-6 flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center'} cursor-pointer border border-gray-100 relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:rotate-z-1 dark:bg-gray-800 dark:border-gray-700`}
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 dark:from-gray-700 dark:to-gray-800"></div>
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300 rounded-xl transition-all duration-300 z-10"></div>
                      {pasStyles.showNoAction && (
                        <div className="absolute top-4 left-4 text-xs font-normal px-2 py-1 rounded-full text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50 bg-opacity-80 backdrop-blur-sm z-30 shadow-sm border border-gray-600 dark:border-gray-500">
                          No Action
                        </div>
                      )}
                      {pasStyles.shouldDisplayPAS && (
                        <div className="absolute top-4 left-4 flex space-x-1 z-30">
                          <div className={`text-[10px] font-bold px-2 py-1 border-2 rounded-sm shadow-md backdrop-blur-sm transition-all duration-200 ${pasStyles.pColor} ${pasStyles.pBgColor} ${pasStyles.pBorderColor}`} style={{ boxShadow: pasStyles.pShadow }} onMouseOver={e => e.currentTarget.style.boxShadow = pasStyles.pShadowHover} onMouseOut={e => e.currentTarget.style.boxShadow = pasStyles.pShadow}>
                            P
                          </div>
                          <div className={`text-[10px] font-bold px-2 py-1 border-2 rounded-sm shadow-md backdrop-blur-sm transition-all duration-200 ${pasStyles.aColor} ${pasStyles.aBgColor} ${pasStyles.aBorderColor}`} style={{ boxShadow: pasStyles.aShadow }} onMouseOver={e => e.currentTarget.style.boxShadow = pasStyles.aShadowHover} onMouseOut={e => e.currentTarget.style.boxShadow = pasStyles.aShadow}>
                            A
                          </div>
                          <div className={`text-[10px] font-bold px-2 py-1 border-2 rounded-sm shadow-md backdrop-blur-sm transition-all duration-200 ${pasStyles.sColor} ${pasStyles.sBgColor} ${pasStyles.sBorderColor}`} style={{ boxShadow: pasStyles.sShadow }} onMouseOver={e => e.currentTarget.style.boxShadow = pasStyles.sShadowHover} onMouseOut={e => e.currentTarget.style.boxShadow = pasStyles.sShadow}>
                            S
                          </div>
                        </div>
                      )}
                      <div className={`absolute top-4 right-4 w-3 h-3 ${isOnline ? 'bg-green-500 animate-pulse-slow' : 'bg-red-500'} rounded-full z-30 shadow-md`}></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(customer.user_id, isOnline);
                        }}
                        disabled={isChangingStatus[customer.user_id]}
                        className="absolute top-10 right-2 text-gray-500 hover:text-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 z-30 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-indigo-300"
                        title={isOnline ? 'Change to Offline' : 'Change to Online'}
                      >
                        {isChangingStatus[customer.user_id] ? (
                          <span className="animate-spin h-5 w-5 border-2 border-t-2 border-indigo-600 rounded-full"></span>
                        ) : (
                          <IconPower size={20} />
                        )}
                      </button>
                      <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center pt-4 mb-4' : 'flex-row items-center mr-6'} z-20`}>
                        <ProfileAvatar
                          customer={customer}
                          viewMode={viewMode}
                          bgColorClass={bgColorClass}
                          textColorClass={textColorClass}
                          getInitials={getInitials}
                        />
                        <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-grow'}`}>
                          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">ID: {customer.user_id}</p>
                          <h3 className="text-lg font-normal text-gray-900 dark:text-gray-100 truncate flex items-center gap-1">
                            {customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim() || 'Unnamed Customer'}
                            {isProfileVerified && (
                              <IconCircleCheckFilled
                                size={18}
                                className="text-blue-500 dark:text-blue-400"
                                title="Profile Verified"
                              />
                            )}
                          </h3>
                          <div className="mt-2 flex items-center justify-center gap-3 text-sm">
                             {/* Email Icon */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleViewSensitiveData(customer, 'email'); }}
                                className="text-gray-600 dark:text-gray-300 flex items-center gap-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="View Email"
                            >
                                <IconMail size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            {/* Mobile Icon */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleViewSensitiveData(customer, 'mobile'); }}
                                className="text-gray-600 dark:text-gray-300 flex items-center gap-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="View Mobile Number"
                            >
                                <IconPhone size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {viewMode === 'grid' && <div className="border-b border-gray-200 mb-4 z-20 w-full dark:border-gray-700"></div>}
                      <div className={`flex-grow z-20 ${viewMode === 'list' ? 'flex flex-col sm:flex-row sm:items-center sm:gap-6' : ''}`}>
                        {customer.dob && (
                          <p className="text-gray-600 text-sm mb-1 dark:text-gray-300 flex items-center gap-1">
                            <IconCalendar size={16} className="flex-shrink-0 text-gray-500 dark:text-gray-400"/>
                            <span className="font-medium">{formattedDob}</span>
                            <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
                            <span className="font-medium">{customerAge}</span>
                          </p>
                        )}
                        <div className={`flex ${viewMode === 'grid' ? 'flex-wrap justify-between' : 'flex-wrap gap-4'} items-center mt-2 gap-y-1`}>
                          {customer.gender !== null && customer.gender !== undefined && (
                            <p className="text-gray-600 text-sm flex-grow min-w-[50%] dark:text-gray-300 flex items-center gap-1">
                              <IconGenderBigender size={16} className="flex-shrink-0 text-gray-500 dark:text-gray-400"/>
                              {formatDropdownValue(customer.gender, 'gender', dropdownData)}
                            </p>
                          )}
                          {customer.height !== null && customer.height !== undefined && (
                            <p className="text-gray-600 text-sm flex-grow dark:text-gray-300 flex items-center gap-1">
                              <IconRulerMeasure size={16} className="flex-shrink-0 text-gray-500 dark:text-gray-400"/>
                              {formatDropdownValue(customer.height, 'height', dropdownData)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-normal">No customers found matching the filters.</p>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 px-4 sm:px-0">
                <nav className="flex space-x-2" aria-label="Pagination">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-4 py-2 rounded-lg font-normal text-sm transition-all duration-200 ${currentPage === index + 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
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
                {errors.general && (
                  <div className="sm:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm text-sm flex items-center gap-2 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
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
                    {dropdownData.gender.map((genderOption) => (
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
                    {dropdownData['profile-for'].map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {errors.profile_for && (
                    <p className="text-sm text-red-600 mt-1">{errors.profile_for}</p>
                  )}
                </div>
                {/* Removed Package Name field */}
                {/* <div>
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
                </div> */}
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
                  {errors.password && typeof errors.password === 'object' && (
                    <ul className="text-xs text-red-600 mt-1 list-disc pl-4">
                      {errors.password.length && <li>{errors.password.length}</li>}
                      {errors.password.uppercase && <li>{errors.password.uppercase}</li>}
                      {errors.password.specialChar && <li>{errors.password.specialChar}</li>}
                      {errors.password.number && <li>{errors.password.number}</li>}
                    </ul>
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
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold text-base hover:bg-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting} // Disable button when submitting
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <IconLoader2 className="animate-spin" size={20} />
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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-4 transition-opacity duration-300 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md p-6 relative shadow-2xl ring-1 ring-gray-900/5 animate-modal-slide-down dark:bg-gray-800 dark:ring-gray-700">
              <button
                onClick={handlePrivacyModalClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors duration-200 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close privacy modal"
              >
                <IconX size={24} stroke={1.5} />
              </button>
              <h3 className="text-2xl mb-4 text-gray-900 leading-tight dark:text-gray-100 text-center flex items-center justify-center gap-2">
                <IconAlertCircle size={28} className="text-red-500 dark:text-red-400" />
                Customer Data Privacy
              </h3>
              {!hasAgreedToPrivacyInModal ? (
                <>
                  <p className="text-gray-700 mb-4 dark:text-gray-300 font-medium">
                    Dear {employeeName} (ID: {employeeId}),
                  </p>
                  <p className="text-sm text-gray-600 mb-6 dark:text-gray-400 leading-relaxed">
                    This action will temporarily reveal sensitive customer information (Email and Mobile Number).
                    Please adhere to the company's privacy policy and ensure this data is not misused.
                    If you require persistent access or believe this is incorrect, please contact a SuperAdmin.
                  </p>
                  <div className="flex justify-end gap-3 border-t pt-4 border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrivacyModalAgree}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-800 transition-colors shadow-lg transform hover:scale-105"
                      disabled={isLoadingSensitiveData}
                    >
                      {isLoadingSensitiveData ? (
                        <span className="flex items-center gap-2">
                          <IconLoader2 className="animate-spin" size={20} />
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
                    <div className="flex flex-col items-center justify-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <IconLoader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                      <p className="text-lg text-gray-600 dark:text-gray-400">Loading sensitive data...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-red-600 font-semibold mb-4 dark:text-red-400 flex items-center gap-2">
                         <IconAlertCircle size={20} className="flex-shrink-0" />
                         Privacy Reminder: This sensitive information is for authorized viewing only. Please do not misuse this data.
                      </p>
                      <div className="space-y-3">
                        {viewingDataType === 'email' && selectedCustomerForPrivacyModal.email && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3 dark:bg-gray-700 dark:border-gray-600 transition-all duration-300 hover:shadow-md">
                            <IconMail size={24} className="text-blue-500 flex-shrink-0 dark:text-blue-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address:</p>
                              <p className="text-gray-800 font-semibold dark:text-gray-100 break-words text-lg">{selectedCustomerForPrivacyModal.email}</p>
                            </div>
                          </div>
                        )}
                        {viewingDataType === 'mobile' && selectedCustomerForPrivacyModal.mobile_number && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3 dark:bg-gray-700 dark:border-gray-600 transition-all duration-300 hover:shadow-md">
                            <IconPhone size={24} className="text-green-500 flex-shrink-0 dark:text-green-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile Number:</p>
                              <p className="text-gray-800 font-semibold dark:text-gray-100 text-lg">{selectedCustomerForPrivacyModal.mobile_number}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end pt-6 border-t mt-6 border-gray-200 dark:border-gray-700">
                        <button
                          onClick={handlePrivacyModalClose}
                          className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
        .hover\\:rotate-z-1:hover {
          transform: translateY(-4px) rotateZ(0.5deg);
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