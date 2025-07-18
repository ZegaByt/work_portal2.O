import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  IconSearch,
  IconFilter,
  IconUserCircle,
  IconX,
  IconRefresh,
  IconAlertCircle, // Used for error messages and privacy modal
  IconLoader2, // For loading spinners
  IconGenderMale, // For male gender icon
  IconGenderFemale, // For female gender icon
  IconCake, // For age/DOB icon
  IconRulerMeasure, // For height icon
  IconMail, // For email icon
  IconPhone, // For mobile icon
  IconCircleCheckFilled // For verified profile icon
} from '@tabler/icons-react';
import { getData } from '../../../store/httpservice';
import { useNavigate } from 'react-router-dom';

// Define a vibrant color palette for avatars for consistent UI
const AVATAR_COLOR_PALETTE = [
  ['bg-red-500', 'text-red-50'], ['bg-pink-500', 'text-pink-50'], ['bg-purple-500', 'text-purple-50'],
  ['bg-indigo-500', 'text-indigo-50'], ['bg-blue-500', 'text-blue-50'], ['bg-cyan-500', 'text-cyan-50'],
  ['bg-teal-500', 'text-teal-50'], ['bg-green-500', 'text-green-50'], ['bg-lime-500', 'text-lime-900'],
  ['bg-yellow-500', 'text-yellow-900'], ['bg-amber-500', 'text-amber-900'], ['bg-orange-500', 'text-orange-50'],
  ['bg-fuchsia-500', 'text-fuchsia-50'], ['bg-emerald-500', 'text-emerald-50'], ['bg-sky-500', 'text-sky-50'],
];

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
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full pl-3 pr-8 py-2.5 rounded-lg border bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm
          ${isHighlighted ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
      />
      {value && (
        <button
          onClick={() => onChange({ target: { value: '' }})}
          className="absolute right-2 top-1/2 mt-1 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          title={`Clear ${label}`}
        >
          <IconX size={16} />
        </button>
      )}
    </div>
  );

  // Helper function to render filter select with clear button
  const renderFilterSelect = (id, label, value, onChange, options, isHighlighted) => (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none shadow-sm
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
          className="absolute right-2 top-1/2 mt-1 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          title={`Clear ${label}`}
        >
          <IconX size={16} />
        </button>
      )}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-1">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l-.707.707L13.636 18l4.95-4.95-.707-.707L13.636 16.536z"/></svg>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 font-inter antialiased text-gray-800">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl font-normal text-gray-900 mb-6 text-center">
          Advanced Customer Search
        </h1>

        {/* Search and Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 items-end">
          <div className="relative col-span-full md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
              Search by ID, Name, Email, or Mobile Number
            </label>
            <input
              type="text"
              id="searchQuery"
              placeholder="Enter search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm
                ${searchQuery ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'}`}
            />
            <IconSearch size={20} className="absolute left-3 top-1/2 mt-1 -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 mt-1 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                title="Clear Search Query"
              >
                <IconX size={16} />
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
          <div className="grid grid-cols-2 gap-x-4 col-span-1">
            {renderFilterInput('filterAgeMin', 'Min Age', 'number', filterAgeMin, (e) => setFilterAgeMin(e.target.value), 'Min', filterAgeMin !== '')}
            {renderFilterInput('filterAgeMax', 'Max Age', 'number', filterAgeMax, (e) => setFilterAgeMax(e.target.value), 'Max', filterAgeMax !== '')}
          </div>

          <div className="col-span-full flex justify-end gap-3">
            <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm flex items-center gap-2"
            >
              <IconX size={20} />
              Clear All Filters
            </button>
            <button
              onClick={() => fetchData(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
              disabled={refreshing}
            >
              {refreshing ? (
                <span className="animate-spin h-5 w-5 border-2 border-t-2 border-white rounded-full"></span>
              ) : (
                <IconRefresh size={20} />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-dashed border-indigo-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading customers...</p>
          </div>
        )}

        {fetchError && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-lg shadow-md mb-6 flex items-center gap-2" role="alert">
            <IconAlertCircle size={20} className="flex-shrink-0" />
            <span className="block sm:inline">{fetchError}</span>
          </div>
        )}

        {/* Customer Results */}
        {!loading && !fetchError && (
          filteredCustomers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCustomers.map((customer, index) => {
                const [bgColorClass, textColorClass] = customerColors[customer.user_id] || ['bg-gray-400', 'text-gray-900'];
                return (
                  <div
                    key={customer.user_id}
                    className="customer-card relative bg-white rounded-xl p-5 flex flex-col items-center text-center cursor-pointer border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className={`absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-full z-10 ${customer.account_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {customer.account_status ? 'Online' : 'Offline'}
                    </div>
                    {customer.profile_photos ? (
                      <img
                        src={`${import.meta.env.VITE_BASE_MEDIA_URL}${customer.profile_photos}`}
                        alt={customer.full_name || 'Customer'}
                        className="flex-shrink-0 w-20 h-20 rounded-full object-cover shadow-lg mb-4"
                      />
                    ) : (
                      <div className={`flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg mb-4 ${bgColorClass} ${textColorClass}`}>
                        {getInitials(customer)}
                      </div>
                    )}
                    <h3 className="text-lg font-normal text-gray-900 leading-tight mb-1 flex items-center gap-1">
                      {customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim()}
                      {customer.profile_verified && (
                        <IconCircleCheckFilled size={18} className="text-blue-500" title="Profile Verified" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">ID: {customer.user_id}</p>
                    <div className="text-xs text-gray-500 space-y-1 w-full">
                      <div className="flex justify-center gap-4">
                        {customer.email && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewSensitiveData(customer, 'email'); }}
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="View Email"
                          >
                            <IconMail size={16} className="text-gray-400" />
                          </button>
                        )}
                        {customer.mobile_number && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewSensitiveData(customer, 'mobile'); }}
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="View Mobile Number"
                          >
                            <IconPhone size={16} className="text-gray-400" />
                          </button>
                        )}
                        {customer.gender !== null && customer.gender !== undefined && (
                          <div className="flex items-center gap-1">
                            {customer.gender === 1 ? <IconGenderMale size={16} className="text-blue-500" /> : <IconGenderFemale size={16} className="text-pink-500" />}
                            {formatDropdownValue(customer.gender, 'gender', dropdownData)}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center gap-4">
                        {customer.age !== null && customer.age !== undefined && (
                          <div className="flex items-center gap-1">
                            <IconCake size={16} className="text-purple-500" />
                            {customer.age} years old
                          </div>
                        )}
                        {customer.height !== null && customer.height !== undefined && (
                          <div className="flex items-center gap-1">
                            <IconRulerMeasure size={16} className="text-teal-500" />
                            {formatHeight(customer.height, dropdownData)}
                          </div>
                        )}
                      </div>
                      {customer.employment_type !== null && customer.employment_type !== undefined && (
                        <p>Employment: {formatDropdownValue(customer.employment_type, 'employment_type', dropdownData)}</p>
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
            <div className="text-center py-10">
              <IconUserCircle size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No customers found matching your criteria.</p>
            </div>
          )
        )}

        {/* Privacy Modal */}
        {showPrivacyModal && selectedCustomerForPrivacy && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-4 backdrop-blur-sm animate-modal-fade-in">
            <div className="bg-white rounded-xl w-full max-w-md p-6 relative shadow-2xl ring-1 ring-gray-900/5 animate-modal-slide-down dark:bg-gray-800 dark:ring-gray-700">
              <button
                onClick={handlePrivacyModalClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Close"
              >
                <IconX size={24} />
              </button>
              <h2 className="text-2xl font-normal text-gray-900 dark:text-gray-100 mb-4 text-center">
                Customer Data Privacy
              </h2>
              {!hasAgreedToPrivacyInModal ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">
                    You are about to view sensitive data for{' '}
                    <span className="font-semibold">{selectedCustomerForPrivacy.full_name || 'this customer'}</span> (ID:{' '}
                    <span className="font-semibold">{selectedCustomerForPrivacy.user_id}</span>).
                    By proceeding, you acknowledge that you will handle this information with utmost care and confidentiality, strictly for official purposes.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrivacyModalAgree}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                      disabled={loadingSensitiveData}
                    >
                      {loadingSensitiveData ? (
                        <span className="flex items-center gap-2">
                          <IconLoader2 size={20} className="animate-spin" /> Loading...
                        </span>
                      ) : (
                        'Agree and View'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-lg shadow-md mb-4 flex items-center gap-2" role="alert">
                    <IconAlertCircle size={20} className="flex-shrink-0" />
                    <span className="block sm:inline">Privacy Reminder: Use this information responsibly.</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-6">
                    {sensitiveDataType === 'email' && (
                      <p className="text-gray-800 dark:text-gray-100 text-lg font-semibold break-words">
                        Email: {selectedCustomerForPrivacy.email}
                      </p>
                    )}
                    {sensitiveDataType === 'mobile' && (
                      <p className="text-gray-800 dark:text-gray-100 text-lg font-semibold">
                        Mobile: {selectedCustomerForPrivacy.mobile_number}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handlePrivacyModalClose}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm"
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
          select::-ms-expand {
            display: none;
          }
          @keyframes modalSlideDown {
            0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-modal-slide-down {
            animation: modalSlideDown 0.3s ease-out forwards;
          }
          @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-modal-fade-in {
            animation: modalFadeIn 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </main>
  );
}

export default SpecialSearch;