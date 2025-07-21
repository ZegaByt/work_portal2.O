import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getData } from '../../../store/httpService';
import { toast } from 'sonner';
import moment from 'moment-timezone';

// Refined Inline SVG Icons for a self-contained component
const IconUser = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconHeart = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 12.572l-7.5 7.5l-7.5-7.5a5 5 0 1 1 7.5-6.566a5 5 0 1 1 7.5 6.566Z"/></svg>;
const IconCheckCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconXCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>;
const IconLoader = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
const IconAdjustments = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0-4 0Z"/><path d="M6 4v4"/><path d="M6 12v8"/><path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0-4 0Z"/><path d="M12 4v10"/><path d="M12 18v2"/><path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0-4 0Z"/><path d="M18 4v1"/><path d="M18 9v11"/></svg>;
const IconChevronLeft = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6l6 6"/></svg>;
const IconChevronRight = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6l-6 6"/></svg>;
const IconStars = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.75l-6.172 3.245l1.179-6.873l-5-4.867l6.908-1.004l3.088-6.25l3.088 6.25l6.908 1.004l-5 4.867l1.179 6.873z"/></svg>;
const IconTarget = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconClipboardList = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const IconSearch = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;

// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="relative p-4 rounded-lg border border-gray-200 bg-gray-50 shadow-md animate-pulse">
    <div className="flex items-center mb-4">
      <div className="w-16 h-16 rounded-full bg-gray-200 mr-4"></div>
      <div className="flex-grow">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="ml-auto h-6 bg-gray-200 rounded w-1/5"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
    </div>
  </div>
);


const MatchMakingApp = () => {
  const [allCustomers, setAllCustomers] = useState([]);
  const [primaryCustomer, setPrimaryCustomer] = useState(null);
  const [matchedCustomers, setMatchedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [currentMatchingMode, setCurrentMatchingMode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Matching criteria state
  const [criteria, setCriteria] = useState({
    maritalStatus: true,
    ageProximity: true,
    educationMatch: true,
    occupationMatch: true,
    religionMatch: true,
    casteMatch: true,
    locationProximity: true,
    bodyComplexionHabits: true,
    heightMatch: true,
    physicalStatusMatch: true,
  });

  // Pagination states for matched customers
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 5;

  // const CUSTOMERS_API_URL = "http://127.0.0.1:8000/api/customers/";
  const BASE_MEDIA_URL = import.meta.env.VITE_BASE_MEDIA_URL;

  const MAX_SCORE_ALGORITHM_CALCULATED = 100 + 50 + 70 + 60 + 60 + 20 + 20 + 25 + 15 + 20 + 15;
  const MAX_SCORE_PREFERENCE_CALCULATED = 100 + 50 + 40 + 30 + 30 + 20 + 20 + 25 + 70 + 20 + 15;
  const MAX_SCORE_ASTROLOGY = 100 + 70 + 70 + 60 + 30;

  // Mappings for display names
  const PAYMENT_STATUS_MAP = {
    1: "Pending",
    2: "Paid",
  };

  const PACKAGE_NAME_MAP = {
    1: "Basic",
    2: "Premium",
  };

  const RAASI_MAP = {
    1: "Mesha (Aries)",
    2: "Vrishabha (Taurus)",
    3: "Mithuna (Gemini)",
    4: "Karka (Cancer)",
    5: "Simha (Leo)",
    6: "Kanya (Virgo)",
    7: "Tula (Libra)",
    8: "Vrishchika (Scorpio)",
    9: "Dhanu (Sagittarius)",
    10: "Makara (Capricorn)",
    11: "Kumbha (Aquarius)",
    12: "Meena (Pisces)",
  };

  const STAR_SIGN_MAP = {
    1: "Ashwini", 2: "Bharani", 3: "Krittika", 4: "Rohini", 5: "Mrigashira",
    6: "Ardra", 7: "Punarvasu", 8: "Pushya", 9: "Ashlesha", 10: "Magha",
    11: "Purva Phalguni", 12: "Uttara Phalguni", 13: "Hasta", 14: "Chitra",
    15: "Swati", 16: "Vishakha", 17: "Anuradha", 18: "Jyeshtha", 19: "Mula",
    20: "Purva Ashadha", 21: "Uttara Ashadha", 22: "Shravana", 23: "Dhanishta",
    24: "Shatabhisha", 25: "Purva Bhadrapada", 26: "Uttara Bhadrapada",
    27: "Revati",
  };

  const DOSHAM_MAP = {
    1: "Kuja Dosham Present",
    2: "Kuja Dosham Absent",
  };

  const PADAM_MAP = {
    1: "Padam 1",
    2: "Padam 2",
    3: "Padam 3",
    4: "Padam 4",
  };

  const PHYSICAL_STATUS_MAP = {
    1: "Normal",
    2: "Physically Challenged",
  };

  // Fetch all customers
  const fetchAllCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getData('/customers/');
      if (response && Array.isArray(response.data)) {
        setAllCustomers(response.data);
        toast.success("Customer profiles loaded.", { duration: 2000 });
      } else {
        setError("Invalid response format for customers.");
        toast.error("Failed to load customers: Invalid data.", { duration: 3000 });
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to fetch customers. Please check network and API.");
      toast.error("Error fetching customers.", { duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCustomers();
  }, [fetchAllCustomers]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle primary customer selection
  const handlePrimaryCustomerSelect = (customer) => {
    setPrimaryCustomer(customer);
    setMatchedCustomers([]);
    setCurrentPage(1);
    setCurrentMatchingMode(null);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  // Filter customers based on search query
  const filteredCustomers = allCustomers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.user_id.toString().includes(searchQuery)
  );

  // Toggle customization options
  const toggleCriteria = (criterion) => {
    setCriteria(prev => ({ ...prev, [criterion]: !prev[criterion] }));
  };

  // Algorithm-based Matchmaking Logic
  const runAlgorithmMatchmaking = useCallback(async () => {
    if (!primaryCustomer) {
      toast.error("Please select a primary customer first.", { duration: 3000 });
      return;
    }

    setIsMatching(true);
    setMatchedCustomers([]);
    setCurrentPage(1);
    setCurrentMatchingMode('algorithm');

    toast.info("Processing matches using Algorithm...", { duration: 5000 });
    await new Promise(resolve => setTimeout(resolve, 1500));

    const potentialMatches = allCustomers.filter(
      (customer) => customer.user_id !== primaryCustomer.user_id
    );

    const matches = potentialMatches.map((potentialMatch) => {
      let score = 0;
      const matchedReasons = [];

      const primaryGender = primaryCustomer.gender;
      const matchGender = potentialMatch.gender;
      const isGenderCompatible = (primaryGender === 1 && matchGender === 2) || (primaryGender === 2 && matchGender === 1);
      if (!isGenderCompatible) {
        return { customer: potentialMatch, score: 0, reasons: ["Incompatible Gender"], isMatch: false };
      }
      score += 100;
      matchedReasons.push("Gender Compatible");

      if (criteria.maritalStatus && primaryCustomer.marital_status === potentialMatch.marital_status && primaryCustomer.marital_status !== null) {
        score += 50;
        matchedReasons.push("Marital Status");
      }

      if (criteria.ageProximity && primaryCustomer.age && potentialMatch.age) {
        const ageDiff = Math.abs(primaryCustomer.age - potentialMatch.age);
        if (ageDiff <= 5) {
          score += 40;
          matchedReasons.push("Age Proximity (within 5 years)");
        } else if (ageDiff <= 10) {
          score += 20;
          matchedReasons.push("Age Proximity (within 10 years)");
        }

        const primaryPrefAgeFrom = primaryCustomer.preferred_age_from;
        const primaryPrefAgeTo = primaryCustomer.preferred_age_to;
        const matchPrefAgeFrom = potentialMatch.preferred_age_from;
        const matchPrefAgeTo = potentialMatch.preferred_age_to;

        if (primaryPrefAgeFrom && primaryPrefAgeTo && potentialMatch.age >= primaryPrefAgeFrom && potentialMatch.age <= primaryPrefAgeTo) {
          score += 15;
          matchedReasons.push("Matches Primary's Preferred Age Range");
        }
        if (matchPrefAgeFrom && matchPrefAgeTo && primaryCustomer.age >= matchPrefAgeFrom && primaryCustomer.age <= matchPrefAgeTo) {
          score += 15;
          matchedReasons.push("Primary Matches Partner's Preferred Age Range");
        }
      }

      if (criteria.educationMatch && primaryCustomer.pref_education && potentialMatch.education) {
        if (Array.isArray(primaryCustomer.pref_education) && primaryCustomer.pref_education.includes(potentialMatch.education)) {
          score += 30;
          matchedReasons.push("Education Match (Primary's Preference)");
        }
      }
      if (criteria.educationMatch && potentialMatch.pref_education && primaryCustomer.education) {
        if (Array.isArray(potentialMatch.pref_education) && potentialMatch.pref_education.includes(primaryCustomer.education)) {
          score += 30;
          matchedReasons.push("Education Match (Partner's Preference)");
        }
      }

      if (criteria.occupationMatch && primaryCustomer.pref_occupation && potentialMatch.occupation) {
        if (Array.isArray(primaryCustomer.pref_occupation) && primaryCustomer.pref_occupation.includes(potentialMatch.occupation)) {
          score += 30;
          matchedReasons.push("Occupation Match (Primary's Preference)");
        }
      }
      if (criteria.occupationMatch && potentialMatch.pref_occupation && primaryCustomer.occupation) {
        if (Array.isArray(potentialMatch.pref_occupation) && potentialMatch.pref_occupation.includes(primaryCustomer.occupation)) {
          score += 30;
          matchedReasons.push("Occupation Match (Partner's Preference)");
        }
      }

      if (criteria.religionMatch && primaryCustomer.religion && potentialMatch.religion && primaryCustomer.religion === potentialMatch.religion) {
        score += 20;
        matchedReasons.push("Religion Match");
      }

      if (criteria.casteMatch && primaryCustomer.caste && potentialMatch.caste && primaryCustomer.caste === potentialMatch.caste) {
        score += 20;
        matchedReasons.push("Caste Match");
      }

      if (criteria.locationProximity) {
        if (primaryCustomer.city && potentialMatch.city && primaryCustomer.city === potentialMatch.city) {
          score += 25;
          matchedReasons.push("Same City");
        } else if (primaryCustomer.state && potentialMatch.state && primaryCustomer.state === potentialMatch.state) {
          score += 15;
          matchedReasons.push("Same State");
        } else if (primaryCustomer.country && potentialMatch.country && primaryCustomer.country === potentialMatch.country) {
          score += 10;
          matchedReasons.push("Same Country");
        }
      }

      if (criteria.bodyComplexionHabits) {
        let minorAttrScore = 0;
        if (primaryCustomer.body_type && potentialMatch.body_type && primaryCustomer.body_type === potentialMatch.body_type) {
          minorAttrScore += 5; matchedReasons.push("Body Type Match");
        }
        if (primaryCustomer.complexion && potentialMatch.complexion && primaryCustomer.complexion === potentialMatch.complexion) {
          minorAttrScore += 5; matchedReasons.push("Complexion Match");
        }
        if (primaryCustomer.eating_habits && potentialMatch.eating_habits && primaryCustomer.eating_habits === potentialMatch.eating_habits) {
          minorAttrScore += 5; matchedReasons.push("Eating Habits Match");
        }
        score += minorAttrScore;
      }

      if (criteria.heightMatch && primaryCustomer.height && potentialMatch.height) {
        const heightDiff = Math.abs(primaryCustomer.height - potentialMatch.height);
        if (heightDiff <= 5) {
          score += 20;
          matchedReasons.push("Height Proximity (within 5 units)");
        } else if (heightDiff <= 10) {
          score += 10;
          matchedReasons.push("Height Proximity (within 10 units)");
        }
      }

      if (criteria.physicalStatusMatch && primaryCustomer.physical_status && potentialMatch.physical_status && primaryCustomer.physical_status === potentialMatch.physical_status) {
        score += 15;
        matchedReasons.push(`Physical Status Match: ${PHYSICAL_STATUS_MAP[primaryCustomer.physical_status] || 'N/A'}`);
      }

      return { customer: potentialMatch, score, reasons: matchedReasons, isMatch: score > 0 };
    }).filter(match => match.isMatch);

    matches.sort((a, b) => b.score - a.score);
    setMatchedCustomers(matches);
    setIsMatching(false);

    if (matches.length > 0) {
      toast.success(`${matches.length} potential matches found by Algorithm!`, { duration: 3000 });
    } else {
      toast.info("No matches found by Algorithm with current criteria.", { duration: 3000 });
    }
  }, [primaryCustomer, allCustomers, criteria]);

  // Preference-based Matchmaking Logic
  const runPreferenceMatchmaking = useCallback(async () => {
    if (!primaryCustomer) {
      toast.error("Please select a primary customer first.", { duration: 3000 });
      return;
    }

    setIsMatching(true);
    setMatchedCustomers([]);
    setCurrentPage(1);
    setCurrentMatchingMode('preferences');

    toast.info("Processing matches using Preferences...", { duration: 5000 });
    await new Promise(resolve => setTimeout(resolve, 1500));

    const potentialMatches = allCustomers.filter(
      (customer) => customer.user_id !== primaryCustomer.user_id
    );

    const matches = potentialMatches.map((potentialMatch) => {
      let score = 0;
      const matchedReasons = [];

      const primaryGender = primaryCustomer.gender;
      const matchGender = potentialMatch.gender;
      const isGenderCompatible = (primaryGender === 1 && matchGender === 2) || (primaryGender === 2 && matchGender === 1);
      if (!isGenderCompatible) {
        return { customer: potentialMatch, score: 0, reasons: ["Incompatible Gender"], isMatch: false };
      }
      score += 100;
      matchedReasons.push("Gender Compatible");

      if (criteria.maritalStatus && Array.isArray(primaryCustomer.preferred_marital_status) && primaryCustomer.preferred_marital_status.includes(potentialMatch.marital_status)) {
        score += 50;
        matchedReasons.push("Matches Preferred Marital Status");
      }

      if (criteria.ageProximity && primaryCustomer.preferred_age_from && primaryCustomer.preferred_age_to && potentialMatch.age) {
        if (potentialMatch.age >= primaryCustomer.preferred_age_from && potentialMatch.age <= primaryCustomer.preferred_age_to) {
          score += 40;
          matchedReasons.push("Matches Preferred Age Range");
        }
      }

      if (criteria.educationMatch && Array.isArray(primaryCustomer.pref_education) && primaryCustomer.pref_education.includes(potentialMatch.education)) {
        score += 30;
        matchedReasons.push("Matches Preferred Education");
      }

      if (criteria.occupationMatch && Array.isArray(primaryCustomer.pref_occupation) && primaryCustomer.pref_occupation.includes(potentialMatch.occupation)) {
        score += 30;
        matchedReasons.push("Matches Preferred Occupation");
      }

      if (criteria.religionMatch && primaryCustomer.pref_religion && primaryCustomer.pref_religion === potentialMatch.religion) {
        score += 20;
        matchedReasons.push("Matches Preferred Religion");
      }

      if (criteria.casteMatch && Array.isArray(primaryCustomer.pref_caste) && primaryCustomer.pref_caste.includes(potentialMatch.caste)) {
        score += 20;
        matchedReasons.push("Matches Preferred Caste");
      }

      if (criteria.locationProximity) {
        if (Array.isArray(primaryCustomer.pref_cities) && primaryCustomer.pref_cities.includes(potentialMatch.city)) {
          score += 25;
          matchedReasons.push("Matches Preferred City");
        } else if (Array.isArray(primaryCustomer.pref_states) && primaryCustomer.pref_states.includes(potentialMatch.state)) {
          score += 15;
          matchedReasons.push("Matches Preferred State");
        } else if (Array.isArray(primaryCustomer.pref_countries) && primaryCustomer.pref_countries.includes(potentialMatch.country)) {
          score += 10;
          matchedReasons.push("Matches Preferred Country");
        }
      }

      if (criteria.bodyComplexionHabits) {
        let minorPrefScore = 0;
        if (Array.isArray(primaryCustomer.pref_family_type) && primaryCustomer.pref_family_type.includes(potentialMatch.family_type)) {
          minorPrefScore += 10; matchedReasons.push("Matches Preferred Family Type");
        }
        if (Array.isArray(primaryCustomer.pref_family_status) && primaryCustomer.pref_family_status.includes(potentialMatch.family_status)) {
          minorPrefScore += 10; matchedReasons.push("Matches Preferred Family Status");
        }
        if (Array.isArray(primaryCustomer.pref_Emp_type) && primaryCustomer.pref_Emp_type.includes(potentialMatch.employment_type)) {
          minorPrefScore += 10; matchedReasons.push("Matches Preferred Employment Type");
        }
        if (Array.isArray(primaryCustomer.preferred_salary) && potentialMatch.annual_salary) {
            if (primaryCustomer.preferred_salary.length > 0) {
                minorPrefScore += 10; matchedReasons.push("Matches Preferred Salary Category");
            }
        }
        if (Array.isArray(primaryCustomer.pref_raasi) && primaryCustomer.pref_raasi.includes(potentialMatch.raasi)) {
          minorPrefScore += 5; matchedReasons.push("Matches Preferred Raasi");
        }
        if (Array.isArray(primaryCustomer.pref_star_sign) && primaryCustomer.pref_star_sign.includes(potentialMatch.star_sign)) {
          minorPrefScore += 5; matchedReasons.push("Matches Preferred Star Sign");
        }
        if (Array.isArray(primaryCustomer.pref_dosham) && primaryCustomer.pref_dosham.includes(potentialMatch.dosham)) {
          minorPrefScore += 5; matchedReasons.push("Matches Preferred Dosham");
        }
        if (Array.isArray(primaryCustomer.pref_visa_types) && primaryCustomer.pref_visa_types.includes(potentialMatch.visa_type)) {
          minorPrefScore += 5; matchedReasons.push("Matches Preferred Visa Type");
        }
        if (Array.isArray(primaryCustomer.pref_citizenship_countries) && primaryCustomer.pref_citizenship_countries.includes(potentialMatch.citizenship)) {
          minorPrefScore += 5; matchedReasons.push("Matches Preferred Citizenship");
        }
        if (Array.isArray(primaryCustomer.pref_visa_countries) && potentialMatch.visa_country && primaryCustomer.pref_visa_countries.includes(potentialMatch.visa_country)) {
          minorPrefScore += 5; matchedReasons.push("Matches Preferred Visa Country");
        }
        score += minorPrefScore;
      }

      if (criteria.heightMatch && primaryCustomer.preferred_height_from && primaryCustomer.preferred_height_to && potentialMatch.height) {
        if (potentialMatch.height >= primaryCustomer.preferred_height_from && potentialMatch.height <= primaryCustomer.preferred_height_to) {
          score += 20;
          matchedReasons.push("Matches Preferred Height Range");
        }
      }

      if (criteria.physicalStatusMatch && Array.isArray(primaryCustomer.preferred_physical_status) && primaryCustomer.preferred_physical_status.includes(potentialMatch.physical_status)) {
        score += 15;
        matchedReasons.push(`Matches Preferred Physical Status: ${PHYSICAL_STATUS_MAP[potentialMatch.physical_status] || 'N/A'}`);
      }

      return { customer: potentialMatch, score, reasons: matchedReasons, isMatch: score > 0 };
    }).filter(match => match.isMatch);

    matches.sort((a, b) => b.score - a.score);
    setMatchedCustomers(matches);
    setIsMatching(false);

    if (matches.length > 0) {
      toast.success(`${matches.length} potential matches found by Preferences!`, { duration: 3000 });
    } else {
      toast.info("No matches found by Preferences with current criteria.", { duration: 3000 });
    }
  }, [primaryCustomer, allCustomers, criteria]);

  // Astrology-based Matchmaking Logic
  const runAstrologyMatchmaking = useCallback(async () => {
    if (!primaryCustomer) {
      toast.error("Please select a primary customer first.", { duration: 3000 });
      return;
    }

    setIsMatching(true);
    setMatchedCustomers([]);
    setCurrentPage(1);
    setCurrentMatchingMode('astrology');

    toast.info("Processing matches using Astrology...", { duration: 5000 });
    await new Promise(resolve => setTimeout(resolve, 1500));

    const potentialMatches = allCustomers.filter(
      (customer) => customer.user_id !== primaryCustomer.user_id
    );

    const matches = potentialMatches.map((potentialMatch) => {
      let score = 0;
      const matchedReasons = [];

      const primaryGender = primaryCustomer.gender;
      const matchGender = potentialMatch.gender;
      const isGenderCompatible = (primaryGender === 1 && matchGender === 2) || (primaryGender === 2 && matchGender === 1);
      if (!isGenderCompatible) {
        return { customer: potentialMatch, score: 0, reasons: ["Incompatible Gender"], isMatch: false };
      }
      score += 100;
      matchedReasons.push("Gender Compatible");

      if (primaryCustomer.raasi && potentialMatch.raasi && primaryCustomer.raasi === potentialMatch.raasi) {
        score += 70;
        matchedReasons.push(`Raasi Match: ${RAASI_MAP[primaryCustomer.raasi] || 'N/A'}`);
      } else if (primaryCustomer.raasi === null || potentialMatch.raasi === null) {
          matchedReasons.push("Raasi data missing for one or both profiles (no score applied).");
      }

      if (primaryCustomer.star_sign && potentialMatch.star_sign && primaryCustomer.star_sign === potentialMatch.star_sign) {
        score += 70;
        matchedReasons.push(`Nakshatram Match: ${STAR_SIGN_MAP[primaryCustomer.star_sign] || 'N/A'}`);
      } else if (primaryCustomer.star_sign === null || potentialMatch.star_sign === null) {
          matchedReasons.push("Nakshatram data missing for one or both profiles (no score applied).");
      }

      if (primaryCustomer.kuja_dosham && potentialMatch.kuja_dosham && primaryCustomer.kuja_dosham === potentialMatch.kuja_dosham) {
        score += 60;
        matchedReasons.push(`Kuja Dosham Compatibility: Both ${DOSHAM_MAP[primaryCustomer.kuja_dosham] || 'N/A'}`);
      } else if (primaryCustomer.kuja_dosham !== null && potentialMatch.kuja_dosham !== null && primaryCustomer.kuja_dosham !== potentialMatch.kuja_dosham) {
          matchedReasons.push(`Kuja Dosham Mismatch: Primary ${DOSHAM_MAP[primaryCustomer.kuja_dosham] || 'N/A'}, Match ${DOSHAM_MAP[potentialMatch.kuja_dosham] || 'N/A'}`);
      } else if (primaryCustomer.kuja_dosham === null || potentialMatch.kuja_dosham === null) {
          matchedReasons.push("Kuja Dosham data missing for one or both profiles (no score applied).");
      }

      if (primaryCustomer.padam && potentialMatch.padam && primaryCustomer.padam === potentialMatch.padam) {
        score += 30;
        matchedReasons.push(`Padam Match: ${PADAM_MAP[primaryCustomer.padam] || 'N/A'}`);
      } else if (primaryCustomer.padam === null || potentialMatch.padam === null) {
          matchedReasons.push("Padam data missing for one or both profiles (no score applied).");
      }

      return { customer: potentialMatch, score, reasons: matchedReasons, isMatch: score > 0 };
    }).filter(match => match.isMatch);

    matches.sort((a, b) => b.score - a.score);
    setMatchedCustomers(matches);
    setIsMatching(false);

    if (matches.length > 0) {
      toast.success(`${matches.length} potential matches found by Astrology!`, { duration: 3000 });
    } else {
      toast.info("No matches found by Astrology with current criteria.", { duration: 3000 });
    }
  }, [primaryCustomer, allCustomers]);

  // Pagination logic
  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = matchedCustomers.slice(indexOfFirstMatch, indexOfLastMatch);
  const totalPages = Math.ceil(matchedCustomers.length / matchesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  let currentMaxScore;
  if (currentMatchingMode === 'algorithm') {
    currentMaxScore = MAX_SCORE_ALGORITHM_CALCULATED;
  } else if (currentMatchingMode === 'preferences') {
    currentMaxScore = MAX_SCORE_PREFERENCE_CALCULATED;
  } else if (currentMatchingMode === 'astrology') {
    currentMaxScore = MAX_SCORE_ASTROLOGY;
  } else {
    currentMaxScore = 0;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-700 p-8">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-blue-700">
          Matchmaking Dashboard
        </h1>
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mt-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-red-600">
        <IconXCircle className="h-8 w-8 mr-2" />
        <p className="text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-inter p-0 sm:p-0 lg:p-0">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-8 text-blue-700 tracking-tight flex items-center justify-center">
        <IconHeart className="inline-block mr-3 h-8 w-8 sm:h-10 sm:w-10 text-red-500 animate-bounce-slow" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">Matchmaking Dashboard</span>
        <IconUser className="inline-block ml-3 h-8 w-8 sm:h-10 sm:w-10 text-teal-600 animate-bounce-slow" />
      </h1>

      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 sm:p-8 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-5 flex items-center text-blue-700">
          <IconTarget className="mr-2 text-purple-600" />
          Select Primary Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="relative" ref={dropdownRef}>
            <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 mb-1">
              Choose a Customer:
            </label>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm cursor-pointer flex items-center justify-between"
            >
              <span>{primaryCustomer ? `${primaryCustomer.full_name} (ID: ${primaryCustomer.user_id})` : "-- Select a customer --"}</span>
              <IconChevronRight className={`h-4 w-4 transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
            </div>
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-gray-200">
                  <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1.5">
                    <IconSearch className="h-4 w-4 text-gray-500 mr-2" />
                    <input
                      id="customer-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or ID..."
                      className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-500 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.user_id}
                        onClick={() => handlePrimaryCustomerSelect(customer)}
                        className="px-3 py-2 hover:bg-blue-50 text-gray-800 cursor-pointer flex items-center text-sm"
                      >
                        <span>{customer.full_name} (ID: {customer.user_id})</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-xs">No customers found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {primaryCustomer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-4 shadow-sm">
              <div className="flex-shrink-0">
                {primaryCustomer.profile_photos ? (
                  <img
                    src={`${BASE_MEDIA_URL}${primaryCustomer.profile_photos}`}
                    alt={primaryCustomer.full_name}
                    className="w-20 h-20 rounded-full object-cover border-3 border-blue-400 shadow-sm"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/80x80/F0F4F8/63B3ED?text=${primaryCustomer.full_name.charAt(0)}`; }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-3 border-blue-400 shadow-sm">
                    {primaryCustomer.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-grow text-sm">
                <h3 className="text-lg font-bold text-blue-700 mb-0.5">{primaryCustomer.full_name}</h3>
                <p className="text-xs text-gray-600">ID: {primaryCustomer.user_id}</p>
                <p className="text-xs text-gray-600">Gender: {primaryCustomer.gender === 1 ? 'Male' : 'Female'}</p>
                <p className="text-xs text-gray-600">Age: {primaryCustomer.age}</p>
                <p className="text-xs text-gray-600">Marital Status: {primaryCustomer.marital_status === 1 ? 'Single' : 'Other'}</p>
                <p className="text-xs text-gray-600">Location: {primaryCustomer.city_name || primaryCustomer.state_name || primaryCustomer.country_name || 'N/A'}</p>
                {primaryCustomer.raasi && <p className="text-xs text-gray-600">Raasi: {RAASI_MAP[primaryCustomer.raasi] || primaryCustomer.raasi}</p>}
                {primaryCustomer.star_sign && <p className="text-xs text-gray-600">Nakshatram: {STAR_SIGN_MAP[primaryCustomer.star_sign] || primaryCustomer.star_sign}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-5">
          <button
            onClick={() => setShowCustomization(!showCustomization)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-semibold border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <IconAdjustments className="mr-2 text-gray-500 h-4 w-4" />
            {showCustomization ? "Hide Match Parameters" : "Configure Match Parameters"}
          </button>

          {showCustomization && (
            <div className="mt-4 p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-inner grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <p className="col-span-full text-base font-bold text-blue-600 mb-2">Prioritize Matches By:</p>
              {Object.keys(criteria).map(key => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={key}
                    checked={criteria[key]}
                    onChange={() => toggleCriteria(key)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 bg-white focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
                  />
                  <label htmlFor={key} className="ml-2 text-gray-700 text-sm font-medium cursor-pointer">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={runAlgorithmMatchmaking}
            disabled={!primaryCustomer || isMatching}
            className={`w-full py-3 rounded-lg text-base font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl
              ${!primaryCustomer || isMatching
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white shadow-md hover:bg-blue-700 active:bg-blue-800"
              }
            `}
          >
            {isMatching && currentMatchingMode === 'algorithm' ? (
              <span className="flex items-center justify-center">
                <IconLoader className="animate-spin mr-2 h-5 w-5" /> EXECUTING ALGORITHM...
              </span>
            ) : (
              "Algorithm Match"
            )}
          </button>
          <button
            onClick={runPreferenceMatchmaking}
            disabled={!primaryCustomer || isMatching}
            className={`w-full py-3 rounded-lg text-base font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl
              ${!primaryCustomer || isMatching
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white shadow-md hover:bg-green-700 active:bg-green-800"
              }
            `}
          >
            {isMatching && currentMatchingMode === 'preferences' ? (
              <span className="flex items-center justify-center">
                <IconLoader className="animate-spin mr-2 h-5 w-5" /> ANALYZING PREFERENCES...
              </span>
            ) : (
              "Preference Match"
            )}
          </button>
          <button
            onClick={runAstrologyMatchmaking}
            disabled={!primaryCustomer || isMatching}
            className={`w-full py-3 rounded-lg text-base font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl
              ${!primaryCustomer || isMatching
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-purple-600 text-white shadow-md hover:bg-purple-700 active:bg-purple-800"
              }
            `}
          >
            {isMatching && currentMatchingMode === 'astrology' ? (
              <span className="flex items-center justify-center">
                <IconLoader className="animate-spin mr-2 h-5 w-5" /> CONSULTING ASTROLOGY...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <IconStars className="mr-2 h-5 w-5" /> Astrology Match
              </span>
            )}
          </button>
        </div>
      </div>

      {matchedCustomers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 sm:p-8 mt-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-blue-700 flex items-center justify-center">
            <IconClipboardList className="inline-block mr-2 h-6 w-6 text-teal-600" />
            <span className="tracking-wide">Identified Matches ({matchedCustomers.length})</span>
          </h2>

          <div className="space-y-5">
            {currentMatches.map((match, index) => (
              <div
                key={match.customer.user_id}
                className="relative p-5 rounded-lg border border-gray-200 bg-gray-50 shadow-md transform transition-transform duration-300 hover:scale-[1.005] hover:shadow-lg"
              >
                <div className="flex items-center mb-3">
                  {match.customer.profile_photos ? (
                    <img
                      src={`${BASE_MEDIA_URL}${match.customer.profile_photos}`}
                      alt={match.customer.full_name}
                      className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-blue-400 shadow-sm"
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/64x64/E0E7FF/63B3ED?text=${match.customer.full_name.charAt(0)}`; }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold mr-4 border-2 border-blue-400 shadow-sm">
                      {match.customer.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-blue-800">{match.customer.full_name}</h3>
                    <p className="text-xs text-gray-500">ID: {match.customer.user_id}</p>
                  </div>
                  <div className="ml-auto text-base font-bold text-green-600 flex items-center">
                    SCORE: <span className="ml-1.5 text-xl font-extrabold text-orange-600">{match.score}</span> / {currentMaxScore}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-gray-700 text-sm">
                  <p><span className="font-semibold text-gray-800">Gender:</span> {match.customer.gender === 1 ? 'Male' : 'Female'}</p>
                  <p><span className="font-semibold text-gray-800">Age:</span> {match.customer.age} years</p>
                  <p><span className="font-semibold text-gray-800">Marital Status:</span> {match.customer.marital_status === 1 ? 'Single' : 'Other'}</p>
                  <p><span className="font-semibold text-gray-800">Education:</span> {match.customer.education_name || 'N/A'}</p>
                  <p><span className="font-semibold text-gray-800">Occupation:</span> {match.customer.occupation_name || 'N/A'}</p>
                  <p><span className="font-semibold text-gray-800">Location:</span> {match.customer.city_name || match.customer.state_name || match.customer.country_name || 'N/A'}</p>
                  <p><span className="font-semibold text-gray-800">Height:</span> {match.customer.height ? `${match.customer.height} cm` : 'N/A'}</p>
                  <p><span className="font-semibold text-gray-800">Weight:</span> {match.customer.weight ? `${match.customer.weight} kg` : 'N/A'}</p>
                  <p>
                    <span className="font-semibold text-gray-800">Payment:</span>{" "}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      match.customer.payment_status === 2
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    }`}>
                      {PAYMENT_STATUS_MAP[match.customer.payment_status] || 'N/A'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-800">Package:</span>{" "}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      match.customer.package_name === 1
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}>
                      {PACKAGE_NAME_MAP[match.customer.package_name] || 'N/A'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-800">Account:</span>{" "}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      match.customer.account_status
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {match.customer.account_status ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </p>
                </div>

                {match.reasons.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-3">
                    <p className="text-xs font-semibold text-blue-600 mb-1.5">MATCHED ON:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.reasons.map((reason, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-4">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <IconChevronLeft className="inline-block mr-1.5 h-4 w-4" /> Previous
              </button>
              <span className="text-base font-bold text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next <IconChevronRight className="inline-block ml-1.5 h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {matchedCustomers.length === 0 && primaryCustomer && !isMatching && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mt-8 text-center text-gray-600">
          <p className="text-lg font-bold text-red-600 mb-2">No Matches Found</p>
          <p className="text-base">The system could not identify potential matches for <span className="text-blue-700 font-semibold">{primaryCustomer.full_name}</span> with the current parameters.</p>
          <p className="text-sm mt-2">Consider adjusting the <span className="text-blue-600 font-semibold">Match Parameters</span> above and re-initiating the process.</p>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% {
            background-color: #e2e8f0; /* gray-200 */
          }
          50% {
            background-color: #cbd5e0; /* gray-300 */
          }
        }

        .animate-pulse .bg-gray-200 {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #a0aec0;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #63b3ed;
        }
      `}</style>
    </div>
  );
};

export default MatchMakingApp;