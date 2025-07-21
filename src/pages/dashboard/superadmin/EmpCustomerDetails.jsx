import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  IconArrowLeft,
  IconUserCircle,
  IconNotes,
  IconHeart,
  IconShare,
  IconCopy,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconGauge,
  IconCircleCheckFilled,
  IconRefresh,
  IconUser,
  IconCalendar,
  IconBriefcase,
  IconStar,
  IconHome,
  IconCreditCard,
  IconMapPin,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { getData } from '../../../store/httpService';
import ECustomerDetails from './ECustomerDetails';
import FollowUpNotes from './FollowUpNotes';
import EmpCustomerInterests from './EmpCustomerInterests';
import { Badge } from '@/components/ui/badge';

// Field configuration
const fieldConfig = {
  personal: {
    fields: {
      first_name: { required: true, type: 'text' },
      middle_name: { type: 'text' },
      surname: { required: true, type: 'text' },
      email: { required: true, type: 'email' },
      mobile_number: { required: true, type: 'tel' },
      emergency_contact: { type: 'tel' },
      profile_for: { type: 'select', endpoint: 'profile-for' },
      gender: { type: 'select', endpoint: 'gender' },
      dob: { type: 'date' },
      height: { type: 'select', endpoint: 'height' },
      weight: { type: 'number' },
      body_type: { type: 'select', endpoint: 'body_type' },
      complexion: { type: 'select', endpoint: 'complexion' },
      physical_status: { type: 'select', endpoint: 'physical_status' },
      marital_status: { type: 'select', endpoint: 'marital_status' },
      eating_habits: { type: 'select', endpoint: 'eating_habits' },
      habits: { type: 'textarea' },
      about_me: { type: 'textarea' },
    },
  },
  photos: {
    fields: {
      profile_photos: { type: 'image' },
      photo1: { type: 'image' },
      photo2: { type: 'image' },
      photo3: { type: 'image' },
      photo4: { type: 'image' },
    },
  },
  package: {
    fields: {
      package_name: { type: 'select', endpoint: 'package_name' },
      package_expiry: { type: 'date' },
      profile_highlighter: { type: 'checkbox' },
      account_status: { type: 'checkbox' },
      profile_verified: { type: 'checkbox' },
    },
  },
  career: {
    fields: {
      education: { type: 'select', endpoint: 'education' },
      college_name: { type: 'text' },
      passed_out_year: { type: 'number' },
      education_in_detail: { type: 'textarea' },
      employment_type: { type: 'select', endpoint: 'employment_type' },
      company_name: { type: 'text' },
      company_type: { type: 'text' },
      company_address: { type: 'textarea' },
      working_since: { type: 'date' },
      occupation: { type: 'select', endpoint: 'occupation' },
      occupation_details: { type: 'textarea' },
      annual_salary: { type: 'select', endpoint: 'annualsalary' },
      job_country: { type: 'select', endpoint: 'job_country' },
      job_state: { type: 'select', endpoint: 'job_state' },
      job_city: { type: 'select', endpoint: 'job_city' },
    },
  },
  astro: {
    fields: {
      astro_dob: { type: 'date' },
      birth_time: { type: 'time' },
      birth_place: { type: 'text' },
      raasi: { type: 'select', endpoint: 'raasi' },
      star_sign: { type: 'select', endpoint: 'star_sign' },
      padam: { type: 'select', endpoint: 'padam' },
      dosham: { type: 'select', endpoint: 'dosham' },
    },
  },
  religion: {
    fields: {
      religion: { type: 'select', endpoint: 'religion' },
      caste: { type: 'select', endpoint: 'caste' },
      sub_caste: { type: 'text' },
      gothra: { type: 'text' },
      mother_tongue: { type: 'select', endpoint: 'mother_tongue' },
      citizenship: { type: 'select', endpoint: 'citizenship' },
      visa_country: { type: 'select', endpoint: 'visa_country' },
      visa_type: { type: 'select', endpoint: 'visa_type' },
    },
  },
  family: {
    fields: {
      family_values: { type: 'select', endpoint: 'family_values' },
      family_type: { type: 'select', endpoint: 'family_type' },
      family_status: { type: 'select', endpoint: 'family_status' },
      family_native: { type: 'text' },
      father_name: { type: 'text' },
      father_occupation: { type: 'text' },
      father_occupation_details: { type: 'textarea' },
      father_status: { type: 'select', endpoint: 'fathers_status' },
      mother_name: { type: 'text' },
      mother_occupation: { type: 'text' },
      mother_occupation_details: { type: 'textarea' },
      mother_status: { type: 'select', endpoint: 'mothers_status' },
      number_of_brothers: { type: 'number' },
      number_of_brothers_married: { type: 'number' },
      number_of_sisters: { type: 'number' },
      number_of_sisters_married: { type: 'number' },
    },
  },
  location: {
    fields: {
      country: { type: 'select', endpoint: 'country' },
      state: { type: 'select', endpoint: 'state' },
      district: { type: 'select', endpoint: 'district' },
      city: { type: 'select', endpoint: 'city' },
      mandal: { type: 'text' },
      village_colony: { type: 'text' },
      street_number: { type: 'text' },
      house_number: { type: 'text' },
      landmark: { type: 'text' },
      address_remaining: { type: 'textarea' },
      pincode: { type: 'text' },
      google_map_location: { type: 'url', render: 'map' },
      family_google_map: { type: 'url', render: 'map' },
      native_country: { type: 'select', endpoint: 'country' },
      native_state: { type: 'select', endpoint: 'state' },
      native_district: { type: 'select', endpoint: 'district' },
      native_city: { type: 'select', endpoint: 'city' },
      native_mandal: { type: 'text' },
      native_village_colony: { type: 'text' },
    },
  },
  payment: {
    fields: {
      own_house: { type: 'select', endpoint: 'own_house' },
      total_property_value: { type: 'number', step: '0.01' },
      property_details: { type: 'textarea' },
      payment_status: { type: 'select', endpoint: 'payment_status' },
      payment_method: { type: 'select', endpoint: 'payment_method' },
      payment_amount: { type: 'number', step: '0.01' },
      payment_date: { type: 'date' },
      payment_receipt: { type: 'image' },
      payment_admin_approval: { type: 'select', endpoint: 'payment_admin_approval' },
      bank_name: { type: 'text' },
      account_holder_name: { type: 'text' },
      agreement_status: { type: 'select', endpoint: 'agreement_status' },
      agreement_file: { type: 'image' },
      admin_agreement_approval: { type: 'select', endpoint: 'admin_agreement_approval' },
      settlement_status: { type: 'select', endpoint: 'settlement_status' },
      settlement_by: { type: 'text' },
      settlement_amount: { type: 'number', step: '0.01' },
      settlement_type: { type: 'select', endpoint: 'settlement_type' },
      settlement_date: { type: 'date' },
      settlement_receipt: { type: 'image' },
      settlement_admin_approval: { type: 'select', endpoint: 'settlement_admin_approval' },
    },
  },
  preferences: {
    fields: {
      kuja_dosham: { type: 'select', endpoint: 'dosham' },
      preferred_age_from: { type: 'number' },
      preferred_age_to: { type: 'number' },
      preferred_height_from: { type: 'select', endpoint: 'height' },
      preferred_height_to: { type: 'select', endpoint: 'height' },
      preferred_marital_status: { type: 'multiselect', endpoint: 'marital_status' },
      pref_education: { type: 'multiselect', endpoint: 'education' },
      pref_occupation: { type: 'multiselect', endpoint: 'occupation' },
      pref_Emp_type: { type: 'multiselect', endpoint: 'employment_type' },
      preferred_salary: { type: 'multiselect', endpoint: 'annualsalary' },
      pref_raasi: { type: 'multiselect', endpoint: 'raasi' },
      pref_star_sign: { type: 'multiselect', endpoint: 'star_sign' },
      pref_dosham: { type: 'multiselect', endpoint: 'dosham' },
      pref_religion: { type: 'select', endpoint: 'religion' },
      pref_caste: { type: 'multiselect', endpoint: 'caste' },
      pref_family_type: { type: 'multiselect', endpoint: 'family_type' },
      pref_family_status: { type: 'multiselect', endpoint: 'family_status' },
      pref_countries: { type: 'multiselect', endpoint: 'country' },
      pref_states: { type: 'multiselect', endpoint: 'state' },
      pref_districts: { type: 'multiselect', endpoint: 'district' },
      pref_cities: { type: 'multiselect', endpoint: 'city' },
      pref_job_countries: { type: 'multiselect', endpoint: 'country' },
      pref_job_states: { type: 'multiselect', endpoint: 'state' },
      pref_job_cities: { type: 'multiselect', endpoint: 'city' },
      pref_citizenship_countries: { type: 'multiselect', endpoint: 'citizenship' },
      pref_visa_countries: { type: 'multiselect', endpoint: 'visa_country' },
      pref_visa_types: { type: 'multiselect', endpoint: 'visa_type' },
    },
  },
  certificates: {
    fields: {
      dob_certificate: { type: 'image' },
      caste_certificate: { type: 'image' },
      address_proof: { type: 'image' },
      education_certificates: { type: 'image' },
      marriage_certificate: { type: 'image' },
      divorce_certificate: { type: 'image' },
      house_tax_documents: { type: 'image' },
      company_id: { type: 'image' },
      payslips: { type: 'image' },
      salary_documents: { type: 'image' },
      medical_certificate: { type: 'image' },
      disability_certificate: { type: 'image' },
    },
  },
};

// Modal component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto transform scale-95 animate-scale-up">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <IconX size={28} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

// ProgressCircle component
const ProgressCircle = ({ percentage }) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const [waveOffset, setWaveOffset] = useState(0);

  useEffect(() => {
    let animationFrameId;
    const animateWave = () => {
      setWaveOffset((prevOffset) => (prevOffset + 0.05) % (2 * Math.PI));
      animationFrameId = requestAnimationFrame(animateWave);
    };

    animationFrameId = requestAnimationFrame(animateWave);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const getColorClass = () => {
    if (percentage <= 30) return 'text-red-500';
    if (percentage <= 60) return 'text-orange-500';
    if (percentage <= 85) return 'text-blue-500';
    return 'text-green-500';
  };

  const getFillColor = () => {
    if (percentage <= 30) return 'rgba(239, 68, 68, 0.8)';
    if (percentage <= 60) return 'rgba(249, 115, 22, 0.8)';
    if (percentage <= 85) return 'rgba(59, 130, 246, 0.8)';
    return 'rgba(34, 197, 94, 0.8)';
  };

  const baseWaveY = 100 - (percentage * 0.9);

  const generateWavePath = () => {
    const waveAmplitude = 3;
    const waveFrequency = 0.08;
    const numSegments = 100;

    let pathData = `M0,${baseWaveY}`;

    for (let i = 0; i <= numSegments; i++) {
      const x = (i / numSegments) * 100;
      const y = baseWaveY + waveAmplitude * Math.sin(x * waveFrequency + waveOffset);
      pathData += ` L${x},${y}`;
    }

    pathData += ` L100,100 L0,100 Z`;

    return pathData;
  };

  return (
    <div className="relative w-24 h-24 sm:w-32 sm:h-32">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          className={getColorClass()}
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
        />
        <defs>
          <clipPath id="circleClip">
            <circle r={radius} cx="50" cy="50" />
          </clipPath>
        </defs>
        <path
          d={generateWavePath()}
          fill={getFillColor()}
          fillOpacity="0.9"
          clipPath="url(#circleClip)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg sm:text-2xl font-bold ${getColorClass()}`}>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

// Dropdown endpoints
const endpoints = [
  'profile-for', 'gender', 'height', 'body_type',
  'complexion', 'physical_status', 'marital_status', 'eating_habits',
  'package_name', 'employment_type', 'education', 'occupation',
  'job_country', 'job_state', 'job_city', 'annualsalary',
  'raasi', 'star_sign', 'padam', 'dosham', 'religion', 'caste',
  'mother_tongue', 'citizenship', 'visa_type', 'family_values',
  'family_type', 'family_status', 'fathers_status', 'mothers_status',
  'own_house', 'payment_status', 'payment_method', 'payment_admin_approval',
  'agreement_status', 'admin_agreement_approval', 'settlement_status',
  'settlement_type', 'settlement_admin_approval',
  'country', 'state', 'district', 'city', 'visa_country',
];

const EmpCustomerDetails = () => {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('CustomerDetails');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('basic');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [accountStatus, setAccountStatus] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownData, setDropdownData] = useState({});
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const { setCurrentCustomerHeaderInfo } = useOutletContext();

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    setLoadingDropdowns(true);
    try {
      const384px = endpoints.map(async endpoint => {
        try {
          const response = await getData(`/${endpoint}/`);
          return {
            endpoint,
            data: response.data?.results || response.data || [],
          };
        } catch (error) {
          console.error(`Error fetching ${endpoint}:`, error);
          return { endpoint, data: [] };
        }
      });

      const results = await Promise.all(promises);
      const dropdownMap = {};
      results.forEach(({ endpoint, data }) => {
        dropdownMap[endpoint] = data;
      });
      setDropdownData(dropdownMap);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown options');
    } finally {
      setLoadingDropdowns(false);
    }
  }, []);

  // Get option name for display
  const getOptionName = useCallback((endpoint, id) => {
    if (!id || !dropdownData[endpoint]) return 'N/A';
    const option = dropdownData[endpoint].find(item => item.id === id);
    return option ? option.name : 'N/A';
  }, [dropdownData]);

  const fetchCustomerDetails = useCallback(async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const response = await getData(`/customer/${user_id}/`);
      const customerData = response.data;

      console.log('Customer Data:', customerData);

      let paymentStatusName = customerData.payment_status_name || 'Pending';
      if (customerData.payment_status && !customerData.payment_status_name) {
        try {
          const paymentStatusResponse = await getData('/payment_status/');
          const paymentStatusOptions = paymentStatusResponse.data?.results || paymentStatusResponse.data || [];
          const foundStatus = paymentStatusOptions.find(option => option.id === customerData.payment_status);
          paymentStatusName = foundStatus ? foundStatus.name : 'Pending';
        } catch (error) {
          console.error('Error fetching payment_status options:', error);
          paymentStatusName = 'Pending';
        }
      }

      const totalFields = Object.values(fieldConfig).reduce(
        (acc, section) => acc + Object.keys(section.fields).length,
        0
      );
      const filledFields = Object.keys(customerData).reduce((acc, key) => {
        if (Object.values(fieldConfig).some(section => section.fields.hasOwnProperty(key))) {
          const value = customerData[key];
          if (Array.isArray(value)) {
            return value.length > 0 ? acc + 1 : acc;
          } else if (typeof value === 'object' && value !== null) {
            return Object.keys(value).length > 0 ? acc + 1 : acc;
          } else if (value !== null && value !== undefined && value !== '') {
            return acc + 1;
          }
        }
        return acc;
      }, 0);

      const percentage = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
      setCompletionPercentage(percentage);
      setCustomer(customerData);
      setAccountStatus(customerData.account_status);
      setPaymentStatus(paymentStatusName);

      const headerInfo = {
        full_name: customerData.full_name || `${customerData.first_name || ''} ${customerData.surname || ''}`.trim(),
        profile_photos: customerData.profile_photos,
        completion_percentage: percentage,
        accountStatus: customerData.account_status,
        paymentStatus: paymentStatusName,
        profileVerified: customerData.profile_verified,
        onOpenBasicProfileModal: () => openModal('basic'),
        onOpenFullProfileModal: () => openModal('full'),
        onSetActiveTab: setActiveTab,
        currentActiveTab: activeTab,
      };

      console.log('Header Info:', headerInfo);

      setCurrentCustomerHeaderInfo(headerInfo);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Failed to load customer details');
      if (error.response?.status === 404) {
        navigate('/dashboard/employee/all-customers');
      }
      setCurrentCustomerHeaderInfo(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user_id, navigate, setCurrentCustomerHeaderInfo, activeTab]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access this page.');
      logout();
      navigate('/login');
      return;
    }
    fetchCustomerDetails();
    fetchDropdownData();

    return () => {
      setCurrentCustomerHeaderInfo(null);
    };
  }, [isAuthenticated, logout, navigate, fetchCustomerDetails, fetchDropdownData, setCurrentCustomerHeaderInfo]);

  const renderContent = () => {
    switch (activeTab) {
      case 'CustomerDetails':
        return <ECustomerDetails />;
      case 'Followups':
        return <FollowUpNotes user_id={user_id} />;
      case 'Interests':
        return <EmpCustomerInterests user_id={user_id} />;
      default:
        return null;
    }
  };

  const openModal = (type) => {
    setModalContent(type);
    setIsModalOpen(true);
    setCopied(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCopy = (data) => {
    // Map fields to their endpoints for select/multiselect fields
    const fieldToEndpointMap = {};
    Object.entries(fieldConfig).forEach(([sectionKey, section]) => {
      Object.entries(section.fields).forEach(([fieldName, field]) => {
        if (field.type === 'select' || field.type === 'multiselect') {
          fieldToEndpointMap[fieldName] = field.endpoint;
        }
      });
    });

    // Fields to exclude from copy
    const excludeFields = [
      'user_id', 'assigned_employee', 'mobile_number', 'email', 'profile_photos', 'photo1', 'photo2', 'photo3', 'photo4', 'images',
      'dob_certificate', 'caste_certificate', 'address_proof', 'education_certificates', 'marriage_certificate', 'divorce_certificate',
      'house_tax_documents', 'company_id', 'payslips', 'salary_documents', 'medical_certificate', 'disability_certificate',
      'bank_name', 'account_holder_name', 'created_by_details', 'last_updated_by_details', 'agreement_file', 'payment_receipt',
      'settlement_receipt', 'settlement_status', 'settlement_by', 'settlement_amount', 'settlement_type', 'settlement_date',
      'settlement_admin_approval', 'agreement_status', 'admin_agreement_approval', 'payment_status', 'payment_method',
      'payment_amount', 'payment_date', 'payment_admin_approval', 'package_name', 'package_expiry', 'profile_highlighter',
      'account_status', 'pinned_status', 'profile_verified', 'google_map_location', 'family_google_map', 'country', 'state',
      'district', 'city', 'mandal', 'village_colony', 'street_number', 'house_number', 'landmark', 'address_remaining', 'pincode',
      'native_country', 'native_state', 'native_district', 'native_city', 'native_mandal', 'native_village_colony', 'followup_notes',
      'assigned_employee_name', 'is_staff', 'is_active', 'created_at', 'updated_at'
    ];

    // Format data as WhatsApp-compatible text
    const formatDataAsText = (data) => {
      const currencyFields = ['total_property_value', 'preferred_salary'];
      const sectionIcons = {
        personal: '👤',
        career: '💼',
        astro: '🌟',
        religion: '🛐',
        family: '👨‍👩‍👧',
        location: '📍',
        payment: '💳',
        preferences: '⚙️',
      };

      const lines = [`${sectionIcons.personal} *Personal Details*`];
      Object.entries(fieldConfig).forEach(([sectionKey, section]) => {
        const sectionLines = [];
        Object.entries(section.fields).forEach(([key, field]) => {
          if (!excludeFields.includes(key) && data[key] !== undefined && data[key] !== null && data[key] !== '') {
            let formattedValue = 'N/A';
            if (Array.isArray(data[key])) {
              if (fieldToEndpointMap[key] && dropdownData[fieldToEndpointMap[key]]) {
                formattedValue = data[key].length > 0
                  ? data[key].map(id => getOptionName(fieldToEndpointMap[key], id)).filter(v => v !== 'N/A').join(', ')
                  : 'None';
              } else {
                formattedValue = data[key].length > 0 ? data[key].join(', ') : 'None';
              }
            } else if (fieldToEndpointMap[key] && dropdownData[fieldToEndpointMap[key]]) {
              formattedValue = getOptionName(fieldToEndpointMap[key], data[key]);
            } else if (currencyFields.includes(key)) {
              formattedValue = `₹${parseFloat(data[key]).toLocaleString('en-IN')}`;
            } else {
              formattedValue = data[key].toString();
            }
            if (formattedValue && formattedValue !== 'N/A' && formattedValue !== 'None') {
              const label = key
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              sectionLines.push(`  ${label}: ${formattedValue}`);
            }
          }
        });
        if (sectionLines.length > 0) {
          lines.push(`\n${sectionIcons[sectionKey] || '📋'} *${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}*`);
          lines.push(...sectionLines);
        }
      });

      return lines.join('\n').replace(/^\s*[\r\n]/gm, '');
    };

    const textToCopy = formatDataAsText(data);

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy data');
    });
  };

  const getBasicProfileData = () => {
    if (!customer) return { message: 'No customer data available' };
    return {
      full_name: customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim(),
      profile_for: customer.profile_for,
      gender: customer.gender,
      dob: customer.dob,
      marital_status: customer.marital_status,
    };
  };

  const getFullProfileData = () => {
    if (!customer) return { message: 'No customer data available' };
    const fullData = { ...customer };
    const excludeFields = [
      'user_id', 'assigned_employee', 'mobile_number', 'email', 'profile_photos', 'photo1', 'photo2', 'photo3', 'photo4', 'images',
      'dob_certificate', 'caste_certificate', 'address_proof', 'education_certificates', 'marriage_certificate', 'divorce_certificate',
      'house_tax_documents', 'company_id', 'payslips', 'salary_documents', 'medical_certificate', 'disability_certificate',
      'bank_name', 'account_holder_name', 'created_by_details', 'last_updated_by_details', 'agreement_file', 'payment_receipt',
      'settlement_receipt', 'settlement_status', 'settlement_by', 'settlement_amount', 'settlement_type', 'settlement_date',
      'settlement_admin_approval', 'agreement_status', 'admin_agreement_approval', 'payment_status', 'payment_method',
      'payment_amount', 'payment_date', 'payment_admin_approval', 'package_name', 'package_expiry', 'profile_highlighter',
      'account_status', 'pinned_status', 'profile_verified', 'google_map_location', 'family_google_map', 'country', 'state',
      'district', 'city', 'mandal', 'village_colony', 'street_number', 'house_number', 'landmark', 'address_remaining', 'pincode',
      'native_country', 'native_state', 'native_district', 'native_city', 'native_mandal', 'native_village_colony', 'followup_notes',
      'assigned_employee_name', 'is_staff', 'is_active', 'created_at', 'updated_at'
    ];
    excludeFields.forEach(field => delete fullData[field]);
    return fullData;
  };

  const renderModalContent = () => {
    const data = modalContent === 'basic' ? getBasicProfileData() : getFullProfileData();
    if (modalContent === 'basic') {
      return (
        <div className="space-y-6">
          {customer?.profile_photos ? (
            <img
              src={`${import.meta.env.VITE_BASE_MEDIA_URL}${customer.profile_photos}`}
              alt="Profile"
              className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-200 dark:border-gray-600 shadow-md"
              onError={(e) => { e.target.style.display = 'none'; e.target.onerror = null; }}
            />
          ) : (
            <div className="w-32 h-32 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto shadow-md">
              <IconUserCircle size={64} className="text-gray-400 dark:text-gray-500" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>Name:</strong> {data.full_name}</p>
            <p><strong>Profile For:</strong> {getOptionName('profile-for', data.profile_for) || 'Not provided'}</p>
            <p><strong>Gender:</strong> {getOptionName('gender', data.gender) || 'Not provided'}</p>
            <p><strong>Date of Birth:</strong> {data.dob || 'Not provided'}</p>
            <p><strong>Marital Status:</strong> {getOptionName('marital_status', data.marital_status) || 'Not provided'}</p>
          </div>
          <button
            onClick={() => handleCopy(data)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all w-full justify-center shadow-lg transform active:scale-95"
          >
            {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      );
    } else {
      const currencyFields = ['total_property_value', 'preferred_salary'];
      const fieldToEndpointMap = {};
      Object.entries(fieldConfig).forEach(([sectionKey, section]) => {
        Object.entries(section.fields).forEach(([fieldName, field]) => {
          if (field.type === 'select' || field.type === 'multiselect') {
            fieldToEndpointMap[fieldName] = field.endpoint;
          }
        });
      });
      const sectionIcons = {
        personal: <IconUser size={20} className="inline-block mr-2" />,
        career: <IconBriefcase size={20} className="inline-block mr-2" />,
        astro: <IconStar size={20} className="inline-block mr-2" />,
        religion: <IconUser size={20} className="inline-block mr-2" />,
        family: <IconHome size={20} className="inline-block mr-2" />,
        location: <IconMapPin size={20} className="inline-block mr-2" />,
        payment: <IconCreditCard size={20} className="inline-block mr-2" />,
        preferences: <IconUser size={20} className="inline-block mr-2" />,
      };

      return (
        <div className="space-y-6">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto text-sm text-gray-800 dark:text-gray-200 max-h-80">
            {Object.entries(fieldConfig).map(([sectionKey, section]) => {
              const sectionFields = Object.entries(section.fields).filter(([key]) => !excludeFields.includes(key) && data[key] !== undefined && data[key] !== null && data[key] !== '');
              if (sectionFields.length === 0) return null;
              return (
                <div key={sectionKey} className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-2 mb-2">
                    {sectionIcons[sectionKey]}{sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}
                  </h3>
                  {sectionFields.map(([key, field]) => {
                    let formattedValue = 'N/A';
                    if (Array.isArray(data[key])) {
                      if (fieldToEndpointMap[key] && dropdownData[fieldToEndpointMap[key]]) {
                        formattedValue = data[key].length > 0
                          ? data[key].map(id => getOptionName(fieldToEndpointMap[key], id)).filter(v => v !== 'N/A').join(', ')
                          : 'None';
                      } else {
                        formattedValue = data[key].length > 0 ? data[key].join(', ') : 'None';
                      }
                    } else if (fieldToEndpointMap[key] && dropdownData[fieldToEndpointMap[key]]) {
                      formattedValue = getOptionName(fieldToEndpointMap[key], data[key]);
                    } else if (currencyFields.includes(key)) {
                      formattedValue = `₹${parseFloat(data[key]).toLocaleString('en-IN')}`;
                    } else {
                      formattedValue = data[key].toString();
                    }
                    if (formattedValue === 'N/A' || formattedValue === 'None') return null;
                    const label = key
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    return (
                      <p key={key} className="ml-4 mb-1">
                        <span className="font-semibold">{label}:</span> {formattedValue}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => handleCopy(data)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all w-full justify-center shadow-lg transform active:scale-95"
          >
            {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      );
    }
  };

  // Fields to exclude from rendering
  const excludeFields = [
    'user_id', 'assigned_employee', 'mobile_number', 'email', 'profile_photos', 'photo1', 'photo2', 'photo3', 'photo4', 'images',
    'dob_certificate', 'caste_certificate', 'address_proof', 'education_certificates', 'marriage_certificate', 'divorce_certificate',
    'house_tax_documents', 'company_id', 'payslips', 'salary_documents', 'medical_certificate', 'disability_certificate',
    'bank_name', 'account_holder_name', 'created_by_details', 'last_updated_by_details', 'agreement_file', 'payment_receipt',
    'settlement_receipt', 'settlement_status', 'settlement_by', 'settlement_amount', 'settlement_type', 'settlement_date',
    'settlement_admin_approval', 'agreement_status', 'admin_agreement_approval', 'payment_status', 'payment_method',
    'payment_amount', 'payment_date', 'payment_admin_approval', 'package_name', 'package_expiry', 'profile_highlighter',
    'account_status', 'pinned_status', 'profile_verified', 'google_map_location', 'family_google_map', 'country', 'state',
    'district', 'city', 'mandal', 'village_colony', 'street_number', 'house_number', 'landmark', 'address_remaining', 'pincode',
    'native_country', 'native_state', 'native_district', 'native_city', 'native_mandal', 'native_village_colony', 'followup_notes',
    'assigned_employee_name', 'is_staff', 'is_active', 'created_at', 'updated_at'
  ];

  if (loading || loadingDropdowns) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <IconGauge className="w-16 h-16 text-blue-600 animate-spin-slow mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <IconAlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-xl font-semibold">Customer not found</p>
          <button
            onClick={() => navigate('/dashboard/employee/all-customers')}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto"
          >
            <IconArrowLeft size={20} /> Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-0 sm:p-0 lg:p-0">
      <div className="max-w-7xl mx-auto">
        {/* Customer Info Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {customer.profile_photos ? (
              <img
                src={`${import.meta.env.VITE_BASE_MEDIA_URL}${customer.profile_photos}`}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-400 dark:border-blue-600 shadow-sm"
                onError={(e) => { e.target.src = ''; e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <IconUserCircle size={40} className="text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div className="flex flex-col items-center sm:items-start space-y-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim()}
                {customer.profile_verified && (
                  <IconCircleCheckFilled
                    size={20}
                    className="text-amber-500 dark:text-amber-400"
                    title="Profile Verified"
                  />
                )}
              </h2>
              <div className="flex flex-wrap gap-1">
                <Badge
                  className="text-xs font-medium bg-blue-500 text-white border-blue-700 shadow-blue-500/50 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Customer No: {customer.user_id || 'N/A'}
                </Badge>
                {completionPercentage !== undefined && (
                  <Badge
                    className={`text-xs font-medium ${
                      completionPercentage >= 80
                        ? 'bg-green-500 text-white border-green-700 shadow-green-500/50'
                        : completionPercentage >= 60
                        ? 'bg-pink-500 text-white border-pink-700 shadow-pink-500/50'
                        : completionPercentage >= 30
                        ? 'bg-orange-500 text-white border-orange-700 shadow-orange-500/50'
                        : 'bg-red-500 text-white border-red-700 shadow-red-500/50'
                    } transition-all duration-300 ease-in-out transform hover:scale-105`}
                  >
                    {Math.round(completionPercentage)}% Completion
                  </Badge>
                )}
                {accountStatus !== null && (
                  <Badge
                    className={`text-xs font-medium ${
                      accountStatus
                        ? 'bg-green-500 text-white border-green-700 shadow-green-500/50'
                        : 'bg-red-500 text-white border-red-700 shadow-red-500/50'
                    } transition-all duration-300 ease-in-out transform hover:scale-105`}
                  >
                    Account is {accountStatus ? 'Active' : 'Not Active'}
                  </Badge>
                )}
                {paymentStatus && (
                  <div className="flex items-center gap-1">
                    <Badge
                      className={`text-xs font-medium ${
                        paymentStatus.toLowerCase() === 'paid'
                          ? 'bg-green-500 text-white border-green-700 shadow-green-500/50'
                          : 'bg-red-500 text-white border-red-700 shadow-red-500/50'
                      } transition-all duration-300 ease-in-out transform hover:scale-105`}
                    >
                      Payment: {paymentStatus}
                    </Badge>
                    {customer.paid_amount != null && (
                      <Badge
                        className="text-xs font-medium bg-gray-500 text-white border-gray-700 shadow-gray-500/50 transition-all duration-300 ease-in-out transform hover:scale-105"
                      >
                        Paid: ₹{parseFloat(customer.paid_amount).toLocaleString('en-IN')}
                      </Badge>
                    )}
                  </div>
                )}
                <Badge
                  className={`text-xs font-medium ${
                    customer.assigned_employee
                      ? 'bg-indigo-500 text-white border-indigo-700 shadow-indigo-500/50'
                      : 'bg-gray-500 text-white border-gray-700 shadow-gray-500/50'
                  } transition-all duration-300 ease-in-out transform hover:scale-105`}
                >
                  {customer.assigned_employee
                    ? `Assigned to: ${customer.assigned_employee.full_name} (ID: ${customer.assigned_employee.user_id})`
                    : 'Not Assigned'}
                </Badge>
                <Badge
                  className="text-xs font-medium bg-indigo-500 text-white border-indigo-700 shadow-indigo-500/50 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  {customer.created_by_details
                    ? `Created by: ${customer.created_by_details.full_name} (ID: ${customer.created_by_details.user_id})`
                    : 'Created by: N/A'}
                </Badge>
                <Badge
                  className="text-xs font-medium bg-indigo-500 text-white border-indigo-700 shadow-indigo-500/50 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  {customer.last_updated_by_details
                    ? `Last Updated by: ${customer.last_updated_by_details.full_name} (ID: ${customer.last_updated_by_details.user_id})`
                    : 'Last Updated by: N/A'}
                </Badge>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ProgressCircle percentage={completionPercentage} />
              <button
                onClick={() => fetchCustomerDetails()}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed text-xs font-medium"
                title="Refresh Customer Data"
              >
                <IconRefresh size={16} className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {renderContent()}
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={modalContent === 'basic' ? 'Basic Profile Overview' : 'Full Customer Data'}
        >
          {renderModalContent()}
        </Modal>
      </div>
    </div>
  );
};

export default EmpCustomerDetails;