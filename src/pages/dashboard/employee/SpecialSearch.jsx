import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  IconSearch,
  IconFilter,
  IconUserCircle,
  IconX,
  IconRefresh,
  IconAlertCircle, // Used for error messages and privacy modal
  IconLoader2, // For loading spinners (used in modal)
  IconGenderMale, // For male gender icon
  IconGenderFemale, // For female gender icon
  IconCake, // For age/DOB icon
  IconRulerMeasure, // For height icon
  IconMail, // For email icon
  IconPhone, // For mobile icon
  IconCircleCheckFilled // For verified profile icon
} from '@tabler/icons-react';
import { getData } from '../../../store/httpService';
import { useNavigate } from 'react-router-dom';

// Define a vibrant color palette for avatars for consistent UI
const AVATAR_COLOR_PALETTE = [
  ['bg-red-500', 'text-red-50'], ['bg-pink-500', 'text-pink-50'], ['bg-purple-500', 'text-purple-50'],
  ['bg-indigo-500', 'text-indigo-50'], ['bg-blue-500', 'text-blue-50'], ['bg-cyan-500', 'text-cyan-50'],
  ['bg-teal-500', 'text-teal-50'], ['bg-green-500', 'text-green-50'], ['bg-lime-500', 'text-lime-900'],
  ['bg-yellow-500', 'text-yellow-900'], ['bg-amber-500', 'text-amber-900'], ['bg-orange-500', 'text-orange-50'],
  ['bg-fuchsia-500', 'text-fuchsia-50'], ['bg-emerald-500', 'text-emerald-50'], ['bg-sky-500', 'text-sky-50'],
];

// Configure backend base URL for static media files
const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL;

// ProfileAvatar Component to handle image loading and fallbacks
const ProfileAvatar = React.memo(({ customer, bgColorClass, textColorClass, getInitials }) => {
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
        className="flex-shrink-0 w-12 h-12 rounded-full object-cover shadow-md"
        onError={handleImageError}
      />
    );
  } else {
    return (
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-normal shadow-md ${bgColorClass} ${textColorClass}`}>
        {getInitials(customer)}
      </div>
    );
  }
});

// Unique key for local storage to prevent conflicts
const LOCAL_STORAGE_KEY = 'specialSearchFilters';

function SpecialSearch() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [dropdownData, setDropdownData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Initialize filter states from local storage or default empty values
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_searchQuery`) || '');
  const [filterGender, setFilterGender] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_filterGender`) || '');
  const [filterProfileFor, setFilterProfileFor] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_filterProfileFor`) || '');
  const [filterEmploymentType, setFilterEmploymentType] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_filterEmploymentType`) || '');
  const [filterEducation, setFilterEducation] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_filterEducation`) || '');
  const [filterState, setFilterState] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_filterState`) || '');
  const [filterDistrict, setFilterDistrict] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_filterDistrict`) || '');
  const [filterHeight, setFilterHeight] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_filterHeight`) || '');
  const [filterAgeMin, setFilterAgeMin] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_filterAgeMin`) || '');
  const [filterAgeMax, setFilterAgeMax] = useState(() => localStorage.getItem(`${LOCAL_STORAGE_KEY}_filterAgeMax`) || '');

  const navigate = useNavigate();

  // State for Privacy Modal
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedCustomerForPrivacy, setSelectedCustomerForPrivacy] = useState(null);
  const [sensitiveDataType, setSensitiveDataType] = useState('');
  const [hasAgreedToPrivacyInModal, setHasAgreedToPrivacyInModal] = useState(false);
  const [loadingSensitiveData, setLoadingSensitiveData] = useState(false);

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

  // Centralized formatting function for dropdowns (excluding height)
  const formatDropdownValue = useCallback((id, key, allDropdownData) => {
    const options = allDropdownData[key]?.results || allDropdownData[key];
    if (!options || id === null || id === undefined) return 'N/A';
    const item = options.find(o => String(o.id) === String(id));
    return item ? (item.name || 'N/A') : 'N/A';
  }, []);

  // Specific formatting for height
  const formatHeight = useCallback((heightId, allDropdownData) => {
    const heightOptions = allDropdownData['height']?.results || allDropdownData['height'];
    if (!heightOptions || heightId === null || heightId === undefined) return 'N/A';
    const heightObj = heightOptions.find(h => String(h.id) === String(heightId));
    return heightObj?.height ? `${heightObj.height} cm` : 'N/A';
  }, []);

  // Fetch all necessary data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(true);
    setFetchError(null);
    try {
      const [customersRes, gendersRes, profileForRes, employmentTypeRes, educationRes, countriesRes, statesRes, districtsRes, heightsRes] = await Promise.all([
        getData('/customers/'),
        getData('/gender/'),
        getData('/profile-for/'),
        getData('/employment_type/'),
        getData('/education/'),
        getData('/country/'),
        getData('/state/'),
        getData('/district/'),
        getData('/height/')
      ]);

      if (customersRes.data && Array.isArray(customersRes.data)) {
        setCustomers(customersRes.data);
      } else {
        console.error('Unexpected customers API response format:', customersRes.data);
        setCustomers([]);
        setFetchError('Unexpected data format for customers.');
      }

      setDropdownData({
        gender: gendersRes.data?.results || [],
        'profile-for': profileForRes.data?.results || [],
        employment_type: employmentTypeRes.data?.results || [],
        education: educationRes.data?.results || [],
        country: countriesRes.data?.results || [],
        state: statesRes.data?.results || [],
        district: districtsRes.data?.results || [],
        height: heightsRes.data?.results || [],
      });

    } catch (error) {
      console.error('Error fetching data for SpecialSearch:', error);
      setFetchError('Failed to load data. Please try again.');
      setCustomers([]);
      setDropdownData({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save filters to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_searchQuery`, searchQuery);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_filterGender`, filterGender);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_filterProfileFor`, filterProfileFor);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_filterEmploymentType`, filterEmploymentType);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_filterEducation`, filterEducation);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_filterState`, filterState);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_filterDistrict`, filterDistrict);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_filterHeight`, filterHeight);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_filterAgeMin`, filterAgeMin);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_filterAgeMax`, filterAgeMax);
  }, [searchQuery, filterGender, filterProfileFor, filterEmploymentType, filterEducation,
    filterState, filterDistrict, filterHeight, filterAgeMin, filterAgeMax]);

  // Filter logic
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const newFilteredCustomers = customers.filter(customer => {
      const fullName = (customer.full_name || (customer.first_name && customer.surname ? `${customer.first_name} ${customer.surname}` : '')).toLowerCase();
      const userId = String(customer.user_id || '').toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const mobileNumber = (customer.mobile_number || '').toLowerCase();
      const genderName = formatDropdownValue(customer.gender, 'gender', dropdownData).toLowerCase();
      const profileForName = formatDropdownValue(customer.profile_for, 'profile-for', dropdownData).toLowerCase();
      const employmentTypeName = formatDropdownValue(customer.employment_type, 'employment_type', dropdownData).toLowerCase();
      const educationName = formatDropdownValue(customer.education, 'education', dropdownData).toLowerCase();
      const customerState = formatDropdownValue(customer.state, 'state', dropdownData).toLowerCase();
      const customerDistrict = formatDropdownValue(customer.district, 'district', dropdownData).toLowerCase();
      const customerHeightName = formatHeight(customer.height, dropdownData).toLowerCase();

      const matchesSearch = fullName.includes(lowerCaseQuery) ||
        userId.includes(lowerCaseQuery) ||
        email.includes(lowerCaseQuery) ||
        mobileNumber.includes(lowerCaseQuery) ||
        genderName.includes(lowerCaseQuery) ||
        profileForName.includes(lowerCaseQuery) ||
        employmentTypeName.includes(lowerCaseQuery) ||
        educationName.includes(lowerCaseQuery) ||
        customerState.includes(lowerCaseQuery) ||
        customerDistrict.includes(lowerCaseQuery) ||
        customerHeightName.includes(lowerCaseQuery);

      const matchesGender = filterGender === '' || String(customer.gender) === filterGender;
      const matchesProfileFor = filterProfileFor === '' || String(customer.profile_for) === filterProfileFor;
      const matchesEmploymentType = filterEmploymentType === '' || String(customer.employment_type) === filterEmploymentType;
      const matchesEducation = filterEducation === '' || String(customer.education) === filterEducation;
      const matchesState = filterState === '' || String(customer.state) === filterState;
      const matchesDistrict = filterDistrict === '' || String(customer.district) === filterDistrict;
      const matchesHeight = filterHeight === '' || String(customer.height) === filterHeight;
      const matchesAgeMin = filterAgeMin === '' || (customer.age !== null && customer.age !== undefined && customer.age >= Number(filterAgeMin));
      const matchesAgeMax = filterAgeMax === '' || (customer.age !== null && customer.age !== undefined && customer.age <= Number(filterAgeMax));

      return matchesSearch && matchesGender && matchesProfileFor &&
        matchesEmploymentType && matchesEducation && matchesState &&
        matchesDistrict && matchesHeight && matchesAgeMin && matchesAgeMax;
    });
    setFilteredCustomers(newFilteredCustomers);
  }, [customers, searchQuery, filterGender, filterProfileFor, filterEmploymentType, filterEducation,
    filterState, filterDistrict, filterHeight, filterAgeMin, filterAgeMax, dropdownData, formatDropdownValue, formatHeight]);

  // Memoize color assignment for avatars
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

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterGender('');
    setFilterProfileFor('');
    setFilterEmploymentType('');
    setFilterEducation('');
    setFilterState('');
    setFilterDistrict('');
    setFilterHeight('');
    setFilterAgeMin('');
    setFilterAgeMax('');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(LOCAL_STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  };

  // Privacy Modal Handlers
  const handleViewSensitiveData = useCallback((customer, type) => {
    setSelectedCustomerForPrivacy(customer);
    setSensitiveDataType(type);
    setHasAgreedToPrivacyInModal(false);
    setLoadingSensitiveData(false);
    setShowPrivacyModal(true);
  }, []);

  const handlePrivacyModalAgree = useCallback(() => {
    setLoadingSensitiveData(true);
    setTimeout(() => {
      setHasAgreedToPrivacyInModal(true);
      setLoadingSensitiveData(false);
    }, 2000);
  }, []);

  const handlePrivacyModalClose = useCallback(() => {
    setShowPrivacyModal(false);
    setSelectedCustomerForPrivacy(null);
    setSensitiveDataType('');
    setHasAgreedToPrivacyInModal(false);
    setLoadingSensitiveData(false);
  }, []);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showPrivacyModal) {
        handlePrivacyModalClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPrivacyModal, handlePrivacyModalClose]);

  // Helper function to render filter input with clear button
  const renderFilterInput = (id, label, type, value, onChange, placeholder, isHighlighted) => (
    <div className="relative flex-1 min-w-[80px]"> {/* Adjusted min-width for age inputs */}
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-300">
        {label}
      </label>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full pl-3 pr-8 py-1.5 rounded-md border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400
          ${isHighlighted ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
      />
      {value && (
        <button
          onClick={() => onChange({ target: { value: '' }})}
          className="absolute right-1 top-1/2 mt-0.5 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
          title={`Clear ${label}`}
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  );

  // Helper function to render filter select with clear button
  const renderFilterSelect = (id, label, value, onChange, options, isHighlighted) => (
    <div className="relative flex-1 min-w-[100px] sm:min-w-[120px]">
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`w-full px-2 py-1.5 border rounded-md bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none shadow-sm text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400
          ${isHighlighted ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
      >
        <option value="">{`All ${label.replace('Filter by ', '')}`}</option>
        {options?.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name || option.height}
          </option>
        ))}
      </select>
      {value && (
        <button
          onClick={() => onChange({ target: { value: '' }})}
          className="absolute right-1 top-1/2 mt-0.5 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
          title={`Clear ${label}`}
        >
          <IconX size={14} />
        </button>
      )}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700 mt-0.5 dark:text-gray-400">
        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l-.707.707L13.636 18l4.95-4.95-.707-.707L13.636 16.536z"/></svg>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen  dark:text-gray-200">
      <div className="w-full px-4 sm:px-0 lg:px-0 py-0">
        <div className=" rounded-xl  p-0 sm:p-0 ">
          <h1 className="text-2xl font-normal text-gray-900 mb-5 text-center dark:text-gray-100">
            Advanced Customer Search
          </h1>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-end gap-x-2 gap-y-3 mb-6">
            <div className="relative flex-1 min-w-[180px] sm:min-w-[200px] lg:min-w-[220px]">
              <label htmlFor="searchQuery" className="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-300">
                Search by ID, Name, Email, or Mobile
              </label>
              <input
                type="text"
                id="searchQuery"
                placeholder="Enter search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-md border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400
                  ${searchQuery ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
              />
              <IconSearch size={16} className="absolute left-2 top-1/2 mt-0.5 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 mt-0.5 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Clear Search Query"
                >
                  <IconX size={14} />
                </button>
              )}
            </div>

            {renderFilterSelect('filterGender', 'Gender', filterGender, (e) => setFilterGender(e.target.value), dropdownData.gender, filterGender !== '')}
            {renderFilterSelect('filterProfileFor', 'Profile For', filterProfileFor, (e) => setFilterProfileFor(e.target.value), dropdownData['profile-for'], filterProfileFor !== '')}
            {renderFilterSelect('filterEmploymentType', 'Employment Type', filterEmploymentType, (e) => setFilterEmploymentType(e.target.value), dropdownData.employment_type, filterEmploymentType !== '')}
            {renderFilterSelect('filterEducation', 'Education', filterEducation, (e) => setFilterEducation(e.target.value), dropdownData.education, filterEducation !== '')}
            {renderFilterSelect('filterState', 'State', filterState, (e) => setFilterState(e.target.value), dropdownData.state, filterState !== '')}
            {renderFilterSelect('filterDistrict', 'District', filterDistrict, (e) => setFilterDistrict(e.target.value), dropdownData.district, filterDistrict !== '')}
            {renderFilterSelect('filterHeight', 'Height', filterHeight, (e) => setFilterHeight(e.target.value), dropdownData.height, filterHeight !== '')}
            <div className="flex gap-x-2 flex-1 min-w-[160px]"> {/* Grouping age filters */}
              {renderFilterInput('filterAgeMin', 'Min Age', 'number', filterAgeMin, (e) => setFilterAgeMin(e.target.value), 'Min', filterAgeMin !== '')}
              {renderFilterInput('filterAgeMax', 'Max Age', 'number', filterAgeMax, (e) => setFilterAgeMax(e.target.value), 'Max', filterAgeMax !== '')}
            </div>

            <div className="w-full flex justify-end sm:w-auto sm:ml-auto gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors shadow-sm flex items-center gap-1.5 text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <IconX size={16} />
                Clear All Filters
              </button>
              <button
                onClick={() => fetchData(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5 text-sm dark:bg-indigo-700 dark:hover:bg-indigo-800"
                disabled={refreshing}
              >
                {refreshing ? (
                  <span className="animate-spin h-4 w-4 border-1.5 border-t-1.5 border-white rounded-full"></span>
                ) : (
                  <IconRefresh size={18} />
                )}
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg p-3 flex flex-col items-center text-center border border-gray-100 shadow-sm animate-pulse dark:bg-gray-800 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full bg-gray-200 mb-2 dark:bg-gray-700"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 dark:bg-gray-700"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2 dark:bg-gray-700"></div>
                  <div className="flex justify-center gap-2 w-full mb-1">
                    <div className="h-4 w-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
                  <div className="flex justify-center gap-2 w-full">
                    <div className="h-4 w-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fetchError && !loading && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md mb-4 flex items-center gap-1.5 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300" role="alert">
              <IconAlertCircle size={18} className="flex-shrink-0" />
              <span className="block sm:inline text-sm">{fetchError}</span>
            </div>
          )}

          {/* Customer Results */}
          {!loading && !fetchError && (
            filteredCustomers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredCustomers.map((customer, index) => {
                  const [bgColorClass, textColorClass] = customerColors[customer.user_id] || ['bg-gray-400', 'text-gray-900'];
                  // Format name: First Name + First letter of Surname
                  const displayedName = customer.first_name && customer.surname
                    ? `${customer.first_name} ${customer.surname.charAt(0)}.`
                    : customer.full_name || 'Unnamed Customer';
                  const fullNameForTooltip = customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim();

                  return (
                    <div
                      key={customer.user_id}
                      className="customer-card relative bg-white rounded-lg p-3 flex flex-col items-center text-center cursor-pointer border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className={`absolute top-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full z-10 ${customer.account_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} dark:bg-opacity-20 dark:text-opacity-80`}>
                        {customer.account_status ? 'Online' : 'Offline'}
                      </div>
                      <div className="flex items-center gap-2 mb-2 pt-4">
                        <ProfileAvatar
                          customer={customer}
                          bgColorClass={bgColorClass}
                          textColorClass={textColorClass}
                          getInitials={getInitials}
                        />
                        <div className="flex-grow min-w-0 text-left">
                          <p className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate">ID: {customer.user_id}</p>
                          <h3
                            className="text-base font-normal text-gray-900 leading-tight flex items-center gap-1 truncate"
                            title={fullNameForTooltip}
                          >
                            {displayedName}
                            {customer.profile_verified && (
                              <IconCircleCheckFilled size={14} className="text-blue-500 flex-shrink-0 dark:text-blue-400" title="Profile Verified" />
                            )}
                          </h3>
                        </div>
                      </div>

                      <div className="border-b border-gray-200 mb-2 w-full dark:border-gray-700"></div>

                      <div className="text-xs text-gray-500 w-full flex flex-col items-center">
                        <div className="flex justify-center items-center gap-2 flex-wrap">
                          {customer.email && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewSensitiveData(customer, 'email'); }}
                              className="flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 transition-colors dark:text-indigo-400 dark:hover:text-indigo-500"
                              title="View Email"
                            >
                              <IconMail size={14} className="text-gray-400 dark:text-gray-500" />
                            </button>
                          )}
                          {(customer.email && customer.mobile_number) && <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>}
                          {customer.mobile_number && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewSensitiveData(customer, 'mobile'); }}
                              className="flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 transition-colors dark:text-indigo-400 dark:hover:text-indigo-500"
                              title="View Mobile Number"
                            >
                              <IconPhone size={14} className="text-gray-400 dark:text-gray-500" />
                            </button>
                          )}
                          {(customer.mobile_number && customer.gender !== null && customer.gender !== undefined) && <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>}
                          {customer.gender !== null && customer.gender !== undefined && (
                            <div className="flex items-center gap-0.5 dark:text-gray-300">
                              {customer.gender === 1 ? <IconGenderMale size={14} className="text-blue-500 flex-shrink-0 dark:text-blue-400" /> : <IconGenderFemale size={14} className="text-pink-500 flex-shrink-0 dark:text-pink-400" />}
                              {formatDropdownValue(customer.gender, 'gender', dropdownData)}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-center items-center gap-2 mt-1">
                          {customer.age !== null && customer.age !== undefined && (
                            <div className="flex items-center gap-0.5 dark:text-gray-300">
                              <IconCake size={14} className="text-purple-500 flex-shrink-0 dark:text-purple-400" />
                              {customer.age} years old
                            </div>
                          )}
                          {customer.height !== null && customer.height !== undefined && (
                            <div className="flex items-center gap-0.5 dark:text-gray-300">
                              <IconRulerMeasure size={14} className="text-teal-500 flex-shrink-0 dark:text-teal-400" />
                              {formatHeight(customer.height, dropdownData)}
                            </div>
                          )}
                        </div>
                        {customer.employment_type !== null && customer.employment_type !== undefined && (
                          <p className="mt-1">Employment: {formatDropdownValue(customer.employment_type, 'employment_type', dropdownData)}</p>
                        )}
                        {customer.education !== null && customer.education !== undefined && (
                          <p>Education: {formatDropdownValue(customer.education, 'education', dropdownData)}</p>
                        )}
                        {(customer.state !== null && customer.state !== undefined) || (customer.district !== null && customer.district !== undefined) ? (
                          <p>Location: {formatDropdownValue(customer.district, 'district', dropdownData)}, {formatDropdownValue(customer.state, 'state', dropdownData)}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                <IconUserCircle size={40} className="text-gray-400 mx-auto mb-3 dark:text-gray-500" />
                <p className="text-base text-gray-600 dark:text-gray-400">No customers found matching your criteria.</p>
              </div>
            )
          )}
        </div>

        {/* Privacy Modal */}
        {showPrivacyModal && selectedCustomerForPrivacy && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-3 backdrop-blur-sm animate-modal-fade-in">
            <div className="bg-white rounded-lg w-full max-w-sm p-5 relative shadow-xl ring-1 ring-gray-900/5 animate-modal-slide-down dark:bg-gray-800 dark:ring-gray-700">
              <button
                onClick={handlePrivacyModalClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Close"
              >
                <IconX size={20} />
              </button>
              <h2 className="text-xl font-normal text-gray-900 dark:text-gray-100 mb-3 text-center">
                Customer Data Privacy
              </h2>
              {!hasAgreedToPrivacyInModal ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 text-center text-sm">
                    You are about to view sensitive data for{' '}
                    <span className="font-semibold">{selectedCustomerForPrivacy.full_name || 'this customer'}</span> (ID:{' '}
                    <span className="font-semibold">{selectedCustomerForPrivacy.user_id}</span>).
                    By proceeding, you acknowledge that you will handle this information with utmost care and confidentiality, strictly for official purposes.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors shadow-sm text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrivacyModalAgree}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors shadow-sm text-sm dark:bg-indigo-700 dark:hover:bg-indigo-800"
                      disabled={loadingSensitiveData}
                    >
                      {loadingSensitiveData ? (
                        <span className="flex items-center gap-1.5">
                          <IconLoader2 size={16} className="animate-spin" /> Loading...
                        </span>
                      ) : (
                        'Agree and View'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-orange-100 border border-orange-400 text-orange-700 px-3 py-2.5 rounded-md shadow-sm mb-3 flex items-center gap-1.5 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300" role="alert">
                    <IconAlertCircle size={16} className="flex-shrink-0" />
                    <span className="block sm:inline text-xs">Privacy Reminder: Use this information responsibly.</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 mb-4">
                    {sensitiveDataType === 'email' && (
                      <p className="text-gray-800 dark:text-gray-100 text-base font-semibold break-words">
                        Email: {selectedCustomerForPrivacy.email}
                      </p>
                    )}
                    {sensitiveDataType === 'mobile' && (
                      <p className="text-gray-800 dark:text-gray-100 text-base font-semibold">
                        Mobile: {selectedCustomerForPrivacy.mobile_number}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors shadow-sm text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .customer-card {
            animation: fadeIn 0.3s ease-out forwards;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          select::-ms-expand {
            display: none;
          }
          @keyframes modalSlideDown {
            0% { opacity: 0; transform: translateY(-10px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-modal-slide-down {
            animation: modalSlideDown 0.2s ease-out forwards;
          }
          @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-modal-fade-in {
            animation: modalFadeIn 0.2s ease-out forwards;
          }
        `}</style>
      </div>
    </main>
  );
}

export default SpecialSearch;
