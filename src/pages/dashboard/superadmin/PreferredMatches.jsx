import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getData } from '../../../store/httpService';
import { IconHeart, IconFilter, IconX, IconSearch, IconGridDots, IconList } from '@tabler/icons-react';

// Define vibrant color pairs for avatars (reusing from AllCustomers)
const AVATAR_COLOR_PALETTE = [
  ['bg-red-500', 'text-red-50'], ['bg-pink-500', 'text-pink-50'], ['bg-purple-500', 'text-purple-50'],
  ['bg-indigo-500', 'text-indigo-50'], ['bg-blue-500', 'text-blue-50'], ['bg-cyan-500', 'text-cyan-50'],
  ['bg-teal-500', 'text-teal-50'], ['bg-green-500', 'text-green-50'], ['bg-lime-500', 'text-lime-900'],
  ['bg-yellow-500', 'text-yellow-900'], ['bg-amber-500', 'text-amber-900'], ['bg-orange-500', 'text-orange-50'],
  ['bg-fuchsia-500', 'text-fuchsia-50'], ['bg-emerald-500', 'text-emerald-50'], ['bg-sky-500', 'text-sky-50'],
];

const PreferredMatches = () => {
  const { user_id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [genders, setGenders] = useState([]);
  const [profileForOptions, setProfileForOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    ageMin: '',
    ageMax: '',
    heightMin: '',
    heightMax: '',
    maritalStatus: '',
    religion: '',
    caste: '',
  });
  const [dropdownData, setDropdownData] = useState({});

  // Fetch customer and all customers
  const fetchCustomer = useCallback(async () => {
    try {
      const response = await getData(`/customer/${user_id}/`);
      setCustomer(response.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  }, [user_id]);

  const fetchAllCustomers = useCallback(async () => {
    try {
      const response = await getData('/customers/');
      setAllCustomers(response.data);
    } catch (error) {
      console.error('Error fetching all customers:', error);
    }
  }, []);

  const fetchGenders = useCallback(async () => {
    try {
      const response = await getData('/gender/');
      setGenders(response.data.results || []);
    } catch (error) {
      console.error('Error fetching genders:', error);
    }
  }, []);

  const fetchProfileFor = useCallback(async () => {
    try {
      const response = await getData('/profile-for/');
      setProfileForOptions(response.data.results || []);
    } catch (error) {
      console.error('Error fetching profile_for:', error);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    const endpoints = ['marital_status', 'religion', 'caste'];
    const data = {};
    await Promise.all(
      endpoints.map(async (ep) => {
        try {
          const response = await getData(`/${ep}/`);
          data[ep] = Array.isArray(response.data?.results) ? response.data.results : [];
        } catch (err) {
          console.error(`Failed to fetch ${ep}:`, err);
          data[ep] = [];
        }
      })
    );
    setDropdownData(data);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCustomer(),
        fetchAllCustomers(),
        fetchGenders(),
        fetchProfileFor(),
        fetchDropdowns(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, [fetchCustomer, fetchAllCustomers, fetchGenders, fetchProfileFor, fetchDropdowns]);

  // Format gender and profile_for
  const formatGender = useCallback(
    (genderId) => {
      const gender = genders.find((g) => g.id === genderId);
      return gender ? gender.name : 'N/A';
    },
    [genders]
  );

  const formatProfileFor = useCallback(
    (profileId) => {
      const profile = profileForOptions.find((p) => p.id === profileId);
      return profile ? profile.name : 'N/A';
    },
    [profileForOptions]
  );

  // Calculate match score based on preferences
  const calculateMatchScore = useCallback(
    (customer, match) => {
      let score = 0;
      const maxPoints = 10; // Total points for all criteria

      // Gender matching: Male prefers Female, Female prefers Male
      const customerGender = formatGender(customer.gender).toLowerCase();
      const matchGender = formatGender(match.gender).toLowerCase();
      if (
        (customerGender === 'male' && matchGender === 'female') ||
        (customerGender === 'female' && matchGender === 'male')
      ) {
        score += 2; // Critical match
      } else {
        return 0; // No match if gender preference not met
      }

      // Age preference
      if (
        match.age >= (customer.preferred_age_min || 0) &&
        match.age <= (customer.preferred_age_max || 100)
      ) {
        score += 2;
      }

      // Height preference
      if (
        match.height >= (customer.preferred_height_min || 0) &&
        match.height <= (customer.preferred_height_max || 300)
      ) {
        score += 1;
      }

      // Marital status preference
      if (
        !customer.preferred_marital_status ||
        match.marital_status === customer.preferred_marital_status
      ) {
        score += 1;
      }

      // Religion preference
      if (
        !customer.preferred_religion ||
        match.religion === customer.preferred_religion
      ) {
        score += 1;
      }

      // Caste preference
      if (!customer.preferred_caste || match.caste === customer.preferred_caste) {
        score += 1;
      }

      // Annual income preference
      if (
        match.annual_salary >= (customer.preferred_annual_income_min || 0) &&
        match.annual_salary <=
          (customer.preferred_annual_income_max || Infinity)
      ) {
        score += 1;
      }

      // Education preference
      if (
        !customer.preferred_education ||
        match.education === customer.preferred_education
      ) {
        score += 1;
      }

      return Math.round((score / maxPoints) * 100);
    },
    [formatGender]
  );

  // Filter matches
  useEffect(() => {
    if (!customer || !allCustomers.length) return;

    const lowerCaseQuery = searchQuery.toLowerCase();
    const matches = allCustomers
      .filter((match) => {
        if (match.user_id === customer.user_id) return false; // Exclude self

        const fullName =
          match.full_name ||
          (match.first_name && match.surname
            ? `${match.first_name} ${match.surname}`
            : '')
            .toLowerCase();
        const userId = String(match.user_id || '').toLowerCase();
        const genderName = formatGender(match.gender).toLowerCase();

        const matchesSearch =
          fullName.includes(lowerCaseQuery) ||
          userId.includes(lowerCaseQuery) ||
          genderName.includes(lowerCaseQuery);

        const matchesFilters =
          (!filters.ageMin || match.age >= Number(filters.ageMin)) &&
          (!filters.ageMax || match.age <= Number(filters.ageMax)) &&
          (!filters.heightMin || match.height >= Number(filters.heightMin)) &&
          (!filters.heightMax || match.height <= Number(filters.heightMax)) &&
          (!filters.maritalStatus ||
            String(match.marital_status) === filters.maritalStatus) &&
          (!filters.religion || String(match.religion) === filters.religion) &&
          (!filters.caste || String(match.caste) === filters.caste);

        return matchesSearch && matchesFilters;
      })
      .map((match) => ({
        ...match,
        matchScore: calculateMatchScore(customer, match),
      }))
      .filter((match) => match.matchScore > 0) // Only include valid matches
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

    setFilteredMatches(matches);
  }, [
    customer,
    allCustomers,
    searchQuery,
    filters,
    calculateMatchScore,
    formatGender,
  ]);

  // Handle input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Get initials for avatar
  const getInitials = (customer) => {
    if (customer.full_name && customer.full_name.trim() !== '') {
      const parts = customer.full_name.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        return parts[0].charAt(0).toUpperCase();
      }
    }
    const firstInitial = customer.first_name
      ? customer.first_name.charAt(0).toUpperCase()
      : '';
    const lastInitial = customer.surname
      ? customer.surname.charAt(0).toUpperCase()
      : '';
    return `${firstInitial}${lastInitial}` || '??';
  };

  // Assign colors to customers
  const customerColors = useMemo(() => {
    const colorsMap = {};
    allCustomers.forEach((customer) => {
      const initials = getInitials(customer);
      const firstLetter = initials.charAt(0).toUpperCase();
      const charCode = firstLetter.charCodeAt(0) - 65;
      const colorIndex =
        charCode >= 0 && charCode < 26
          ? charCode % AVATAR_COLOR_PALETTE.length
          : 0;
      colorsMap[customer.user_id] = AVATAR_COLOR_PALETTE[colorIndex];
    });
    return colorsMap;
  }, [allCustomers]);

  // Match score circle component
  const MatchScoreCircle = ({ score }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const strokeColorClass =
      score >= 80
        ? 'text-green-600'
        : score >= 60
        ? 'text-lime-500'
        : score >= 40
        ? 'text-yellow-500'
        : 'text-red-500';

    return (
      <div className="relative w-12 h-12">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-gray-200"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="24"
            cy="24"
          />
          <circle
            className={strokeColorClass}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="24"
            cy="24"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
          {score}%
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <p className="text-gray-500 text-lg font-semibold">Loading matches...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <p className="text-red-600 text-lg font-semibold">Customer data not available.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 font-inter selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-5"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Preferred Matches for {customer.full_name || customer.user_id}
              </h2>
              <p className="text-sm mt-1 opacity-80">
                Showing matches based on your preferences
              </p>
            </div>
            <button
              onClick={() => navigate(`/dashboard/superadmin/customer/${user_id}`)}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Back to Profile
            </button>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by ID, Name, or Gender..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder-gray-400"
              />
              <IconSearch
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title={
                  viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'
                }
              >
                {viewMode === 'grid' ? <IconList size={24} /> : <IconGridDots size={24} />}
              </button>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center gap-2 bg-white text-indigo-600 rounded-xl px-6 py-3 font-semibold shadow-lg hover:scale-105 hover:shadow-2xl transition-all"
              >
                <IconFilter size={22} />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Matches Display */}
        <div
          className={`transition-all duration-500 ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }`}
        >
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match, index) => {
              const [bgColorClass, textColorClass] =
                customerColors[match.user_id] || ['bg-gray-400', 'text-gray-900'];
              const isOnline = match.account_status !== undefined ? match.account_status : false;

              return (
                <div
                  key={match.user_id}
                  onClick={() =>
                    navigate(`/dashboard/superadmin/customer/${match.user_id}`)
                  }
                  className={`customer-card bg-white/95 backdrop-blur-sm rounded-xl p-6 flex ${
                    viewMode === 'grid' ? 'flex-col' : 'flex-row items-center'
                  } cursor-pointer border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 transform-gpu hover:scale-105 relative overflow-hidden group`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-300 rounded-xl transition-all duration-500 z-10"></div>

                  <div className="absolute top-3 left-4 flex items-center gap-2 z-30">
                    <MatchScoreCircle score={match.matchScore} />
                    <span className="text-xs font-semibold text-gray-600">
                      Match Score
                    </span>
                  </div>

                  <div
                    className={`absolute top-3 ${
                      viewMode === 'grid' ? 'left-24' : 'left-4 top-10'
                    } text-xs font-semibold px-2 py-1 rounded-full ${
                      isOnline ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    } bg-opacity-80 backdrop-blur-sm z-30 shadow-sm border border-opacity-20 border-current`}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </div>

                  <div
                    className={`absolute top-3 right-4 w-3 h-3 ${
                      isOnline ? 'bg-green-500' : 'bg-red-500'
                    } rounded-full animate-pulse-slow z-30 shadow-md`}
                  ></div>

                  <div
                    className={`flex ${
                      viewMode === 'grid' ? 'items-center mb-4 pt-4' : 'items-center mr-6'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-md mr-4 ${bgColorClass} ${textColorClass} transform-gpu transition-transform duration-300 group-hover:rotate-12`}
                    >
                      {getInitials(match)}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-500 mb-0 font-medium">
                        ID: {match.user_id}
                      </p>
                      <p className="text-lg font-semibold text-gray-800 leading-tight">
                        {match.full_name ||
                          `${match.first_name} ${match.surname}`}
                      </p>
                    </div>
                  </div>

                  {viewMode === 'grid' && (
                    <div className="border-b border-gray-200 mb-4 z-20"></div>
                  )}

                  <div
                    className={`flex-grow z-20 ${
                      viewMode === 'list'
                        ? 'flex flex-col sm:flex-row sm:items-center sm:gap-6'
                        : ''
                    }`}
                  >
                    {match.email && (
                      <p className="text-gray-600 text-sm mb-1 truncate">
                        Email: {match.email}
                      </p>
                    )}
                    {match.mobile_number && (
                      <p className="text-gray-600 text-sm mb-1">
                        Mobile: {match.mobile_number}
                      </p>
                    )}
                    {match.profile_for !== null &&
                      match.profile_for !== undefined && (
                        <p className="text-gray-600 text-sm mb-1">
                          Profile For: {formatProfileFor(match.profile_for)}
                        </p>
                      )}
                    <div
                      className={`flex ${
                        viewMode === 'grid'
                          ? 'flex-wrap justify-between'
                          : 'flex-wrap gap-4'
                      } items-center mt-2 gap-y-1`}
                    >
                      {match.gender !== null && match.gender !== undefined && (
                        <p className="text-gray-600 text-sm flex-grow min-w-[50%]">
                          Gender: {formatGender(match.gender)}
                        </p>
                      )}
                      {match.age !== null && match.age !== undefined && (
                        <p className="text-gray-600 text-sm flex-grow">
                          Age: {match.age}
                        </p>
                      )}
                      {match.height !== null && match.height !== undefined && (
                        <p className="text-gray-600 text-sm flex-grow">
                          Height: {match.height} cm
                        </p>
                      )}
                      {match.marital_status !== null &&
                        match.marital_status !== undefined && (
                          <p className="text-gray-600 text-sm flex-grow">
                            Marital Status:{' '}
                            {dropdownData.marital_status?.find(
                              (opt) => opt.id === match.marital_status
                            )?.name || 'N/A'}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-600 text-lg py-10">
              No matches found based on your preferences.
            </div>
          )}
        </div>

        {/* Filter Modal */}
        {isFilterModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadein">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl w-full max-w-md p-8 relative shadow-2xl ring-1 ring-gray-900/10 animate-spring-modal border-t-8 border-indigo-600">
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-full p-1"
                aria-label="Close modal"
              >
                <IconX size={26} stroke={1.5} />
              </button>
              <h3 className="font-extrabold text-2xl mb-6 text-gray-900">
                Refine Matches
              </h3>
              <div className="grid grid-cols-1 gap-y-4">
                <div className="grid grid-cols-2 gap-x-4">
                  <div>
                    <label
                      htmlFor="ageMin"
                      className="block text-sm font-semibold mb-1 text-gray-700"
                    >
                      Min Age
                    </label>
                    <input
                      id="ageMin"
                      type="number"
                      name="ageMin"
                      value={filters.ageMin}
                      onChange={handleFilterChange}
                      className="w-full bg-gray-50/90 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ageMax"
                      className="block text-sm font-semibold mb-1 text-gray-700"
                    >
                      Max Age
                    </label>
                    <input
                      id="ageMax"
                      type="number"
                      name="ageMax"
                      value={filters.ageMax}
                      onChange={handleFilterChange}
                      className="w-full bg-gray-50/90 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                  <div>
                    <label
                      htmlFor="heightMin"
                      className="block text-sm font-semibold mb-1 text-gray-700"
                    >
                      Min Height (cm)
                    </label>
                    <input
                      id="heightMin"
                      type="number"
                      name="heightMin"
                      value={filters.heightMin}
                      onChange={handleFilterChange}
                      className="w-full bg-gray-50/90 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="heightMax"
                      className="block text-sm font-semibold mb-1 text-gray-700"
                    >
                      Max Height (cm)
                    </label>
                    <input
                      id="heightMax"
                      type="number"
                      name="heightMax"
                      value={filters.heightMax}
                      onChange={handleFilterChange}
                      className="w-full bg-gray-50/90 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="maritalStatus"
                    className="block text-sm font-semibold mb-1 text-gray-700"
                  >
                    Marital Status
                  </label>
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={filters.maritalStatus}
                    onChange={handleFilterChange}
                    className="w-full bg-gray-50/90 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">All</option>
                    {dropdownData.marital_status?.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="religion"
                    className="block text-sm font-semibold mb-1 text-gray-700"
                  >
                    Religion
                  </label>
                  <select
                    id="religion"
                    name="religion"
                    value={filters.religion}
                    onChange={handleFilterChange}
                    className="w-full bg-gray-50/90 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">All</option>
                    {dropdownData.religion?.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="caste"
                    className="block text-sm font-semibold mb-1 text-gray-700"
                  >
                    Caste
                  </label>
                  <select
                    id="caste"
                    name="caste"
                    value={filters.caste}
                    onChange={handleFilterChange}
                    className="w-full bg-gray-50/90 border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">All</option>
                    {dropdownData.caste?.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setIsFilterModalOpen(false)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Styles */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

          .font-inter {
            font-family: 'Inter', sans-serif;
          }

          .bg-pattern {
            background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239CA3AF' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20zM40 40H20L40 20z'/%3E%3C/g%3E%3C/svg%3E");
          }

          .animate-fadein {
            animation: fadein 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }
          @keyframes fadein {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }

          .spring-modal {
            animation: springModal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          @keyframes springModal {
            0% { opacity: 0; transform: translateY(-50px) scale(0.9); }
            60% { opacity: 1; transform: translateY(10px) scale(1.02); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          .customer-card {
            opacity: 0;
            transform: translateY(30px) rotateX(10deg);
            animation: cardEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          @keyframes cardEnter {
            0% { opacity: 0; transform: translateY(30px) rotateX(10deg); }
            100% { opacity: 1; transform: translateY(0) rotateX(0); }
          }

          .animate-pulse-slow {
            animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </main>
  );
};

export default PreferredMatches;