import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconArrowLeft,
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconMapPin,
  IconBriefcase,
  IconHeart,
  IconCurrencyRupee,
  IconHome,
  IconUsers,
  IconStar,
  IconCamera,
  IconFileText,
  IconAlertCircle,
  IconCheck,
  IconLoader2,
  IconChevronDown,
  IconUpload,
  IconEye,
  IconUserPlus,
  IconUserMinus,
  IconExternalLink,
} from '@tabler/icons-react';
import { getData, patchData, putData } from '../../../store/httpService';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';

// Image Zoom Modal Component
const ImageZoomModal = ({ src, onClose }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (src) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-modal-slide-down backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 max-w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 bg-gray-700/80 text-white rounded-full hover:bg-gray-600 transition-colors z-10 dark:bg-gray-600/80 dark:hover:bg-gray-500"
          aria-label="Close image"
        >
          <IconX size={20} />
        </button>
        <img
          src={src}
          alt="Zoomed Image"
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
          onError={(e) => {
            e.target.src = 'https://placehold.co/600x400/cccccc/000000?text=Image+Not+Found';
            e.target.onerror = null;
          }}
        />
      </div>
    </div>
  );
};

// Privacy Modal Component for Sensitive Data
const PrivacyModal = ({ isOpen, onClose, onAgree, customer, dataType, isLoading, employeeName, employeeId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-4 transition-opacity duration-300 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md p-6 relative shadow-2xl ring-1 ring-gray-900/5 animate-modal-slide-down dark:bg-gray-800 dark:ring-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Close privacy modal"
        >
          <IconX size={24} stroke={1.5} />
        </button>
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 text-center flex items-center justify-center gap-2">
          <IconAlertCircle size={24} className="text-red-500 dark:text-red-400" />
          Customer Data Privacy
        </h3>
        <p className="text-sm text-gray-700 mb-4 dark:text-gray-300 font-medium">
          Dear {employeeName} (ID: {employeeId}),
        </p>
        <p className="text-sm text-gray-600 mb-6 dark:text-gray-400 leading-relaxed">
          This action will temporarily reveal sensitive customer information ({dataType === 'email' ? 'Email' : 'Mobile Number'}).
          Please adhere to the company's privacy policy and ensure this data is not misused.
          If you require persistent access or believe this is incorrect, please contact a SuperAdmin.
        </p>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <IconLoader2 className="animate-spin text-indigo-500 mb-3" size={36} />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading sensitive data...</p>
          </div>
        ) : (
          <div className="flex justify-end gap-3 border-t pt-4 border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onAgree}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-800 transition-colors shadow-sm transform hover:scale-105"
            >
              Agree & View
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Sensitive Data Display Component
const SensitiveDataDisplay = ({ data, type, onView, isEditing }) => {
  const isMasked = !isEditing;
  const displayValue = isMasked ? '**********' : data || 'Not provided';

  return (
    <div className="relative flex items-center">
      <div className="flex-grow px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
        {displayValue}
      </div>
      {!isEditing && data && (
        <button
          onClick={onView}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors p-1"
          title={`View ${type === 'email' ? 'Email' : 'Mobile Number'}`}
        >
          <IconEye size={18} />
        </button>
      )}
    </div>
  );
};

// Main ECustomerDetails Component
const ECustomerDetails = () => {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user: loggedInUser } = useAuth();

  // State management
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [originalFormData, setOriginalFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [dropdownData, setDropdownData] = useState({});
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [sensitiveDataType, setSensitiveDataType] = useState(null);
  const [isLoadingSensitiveData, setIsLoadingSensitiveData] = useState(false);
  const [hasAgreedToPrivacy, setHasAgreedToPrivacy] = useState({});

  // State for dependent dropdowns
  const [stateOptions, setStateOptions] = useState({
    state: [],
    native_state: [],
    job_state: [],
  });
  const [districtOptions, setDistrictOptions] = useState({
    district: [],
    native_district: [],
    job_district: [],
  });
  const [cityOptions, setCityOptions] = useState({
    city: [],
    native_city: [],
    job_city: [],
  });

  const employeeName = loggedInUser?.full_name || loggedInUser?.first_name || 'Employee';
  const employeeId = loggedInUser?.id || 'N/A';

  // Dropdown endpoints (excluding dependent state, district, city)
  const endpoints = [
    'profile-for', 'gender', 'height', 'body_type', 'complexion', 'physical_status', 'marital_status', 'eating_habits',
    'package_name', 'employment_type', 'education', 'occupation', 'annualsalary',
    'raasi', 'star_sign', 'padam', 'dosham', 'religion', 'caste', 'mother_tongue', 'citizenship', 'visa_type',
    'family_values', 'family_type', 'family_status', 'fathers_status', 'mothers_status', 'own_house',
    'payment_status', 'payment_method', 'payment_admin_approval', 'agreement_status', 'admin_agreement_approval',
    'settlement_status', 'settlement_type', 'settlement_admin_approval', 'country', 'visa_country', 'employees',
  ];

  // Field configurations
  const fieldConfig = {
    personal: {
      title: 'Personal Information',
      icon: IconUser,
      fields: {
        first_name: { type: 'text', label: 'First Name', required: true },
        middle_name: { type: 'text', label: 'Middle Name' },
        surname: { type: 'text', label: 'Surname', required: true },
        email: { type: 'email', label: 'Email', required: true, sensitive: true },
        mobile_number: { type: 'tel', label: 'Mobile Number', required: true, sensitive: true },
        emergency_contact: { type: 'tel', label: 'Emergency Contact' },
        profile_for: { type: 'select', label: 'Profile For', endpoint: 'profile-for' },
        gender: { type: 'select', label: 'Gender', endpoint: 'gender' },
        dob: { type: 'date', label: 'Date of Birth' },
        height: { type: 'select', label: 'Height', endpoint: 'height' },
        weight: { type: 'number', label: 'Weight (kg)' },
        body_type: { type: 'select', label: 'Body Type', endpoint: 'body_type' },
        complexion: { type: 'select', label: 'Complexion', endpoint: 'complexion' },
        physical_status: { type: 'select', label: 'Physical Status', endpoint: 'physical_status' },
        marital_status: { type: 'select', label: 'Marital Status', endpoint: 'marital_status' },
        eating_habits: { type: 'select', label: 'Eating Habits', endpoint: 'eating_habits' },
        habits: { type: 'textarea', label: 'Habits' },
        about_me: { type: 'textarea', label: 'About Me' },
      },
    },
    photos: {
      title: 'Photos',
      icon: IconCamera,
      fields: {
        profile_photos: { type: 'image', label: 'Profile Photo' },
        photo1: { type: 'image', label: 'Photo 1' },
        photo2: { type: 'image', label: 'Photo 2' },
        photo3: { type: 'image', label: 'Photo 3' },
        photo4: { type: 'image', label: 'Photo 4' },
      },
    },
    package: {
      title: 'Package Information',
      icon: IconFileText,
      fields: {
        package_name: { type: 'select', label: 'Package Name', endpoint: 'package_name' },
        package_expiry: { type: 'date', label: 'Package Expiry' },
        profile_highlighter: { type: 'checkbox', label: 'Profile Highlighter' },
        account_status: { type: 'checkbox', label: 'Account Status' },
        profile_verified: { type: 'checkbox', label: 'Profile Verified' },
      },
    },
    career: {
      title: 'Education & Career',
      icon: IconBriefcase,
      fields: {
        education: { type: 'select', label: 'Education', endpoint: 'education' },
        college_name: { type: 'text', label: 'College Name' },
        passed_out_year: { type: 'number', label: 'Passed Out Year' },
        education_in_detail: { type: 'textarea', label: 'Education Details' },
        employment_type: { type: 'select', label: 'Employment Type', endpoint: 'employment_type' },
        company_name: { type: 'text', label: 'Company Name' },
        company_type: { type: 'text', label: 'Company Type' },
        company_address: { type: 'textarea', label: 'Company Address' },
        working_since: { type: 'date', label: 'Working Since' },
        occupation: { type: 'select', label: 'Occupation', endpoint: 'occupation' },
        occupation_details: { type: 'textarea', label: 'Occupation Details' },
        annual_salary: { type: 'select', label: 'Annual Salary', endpoint: 'annualsalary' },
        job_country: { type: 'select', label: 'Job Country', endpoint: 'country' },
        job_state: { type: 'select', label: 'Job State', endpoint: 'state' },
        job_district: { type: 'select', label: 'Job District', endpoint: 'district' },
        job_city: { type: 'select', label: 'Job City', endpoint: 'city' },
      },
    },
    astro: {
      title: 'Astro Information',
      icon: IconStar,
      fields: {
        astro_dob: { type: 'date', label: 'Astro Date of Birth' },
        birth_time: { type: 'time', label: 'Birth Time' },
        birth_place: { type: 'text', label: 'Birth Place' },
        raasi: { type: 'select', label: 'Raasi', endpoint: 'raasi' },
        star_sign: { type: 'select', label: 'Star Sign', endpoint: 'star_sign' },
        padam: { type: 'select', label: 'Padam', endpoint: 'padam' },
        dosham: { type: 'select', label: 'Dosham', endpoint: 'dosham' },
      },
    },
    religion: {
      title: 'Religion & Social',
      icon: IconUsers,
      fields: {
        religion: { type: 'select', label: 'Religion', endpoint: 'religion' },
        caste: { type: 'select', label: 'Caste', endpoint: 'caste' },
        sub_caste: { type: 'text', label: 'Sub Caste' },
        gothra: { type: 'text', label: 'Gothra' },
        mother_tongue: { type: 'select', label: 'Mother Tongue', endpoint: 'mother_tongue' },
        citizenship: { type: 'select', label: 'Citizenship', endpoint: 'citizenship' },
        visa_type: { type: 'select', label: 'Visa Type', endpoint: 'visa_type' },
      },
    },
    family: {
      title: 'Family Information',
      icon: IconHome,
      fields: {
        family_values: { type: 'select', label: 'Family Values', endpoint: 'family_values' },
        family_type: { type: 'select', label: 'Family Type', endpoint: 'family_type' },
        family_status: { type: 'select', label: 'Family Status', endpoint: 'family_status' },
        family_native: { type: 'text', label: 'Family Native' },
        father_name: { type: 'text', label: 'Father Name' },
        father_occupation: { type: 'text', label: 'Father Occupation' },
        father_occupation_details: { type: 'textarea', label: 'Father Occupation Details' },
        father_status: { type: 'select', label: 'Father Status', endpoint: 'fathers_status' },
        mother_name: { type: 'text', label: 'Mother Name' },
        mother_occupation: { type: 'text', label: 'Mother Occupation' },
        mother_occupation_details: { type: 'textarea', label: 'Mother Occupation Details' },
        mother_status: { type: 'select', label: 'Mother Status', endpoint: 'mothers_status' },
        number_of_brothers: { type: 'number', label: 'Number of Brothers' },
        number_of_brothers_married: { type: 'number', label: 'Brothers Married' },
        number_of_sisters: { type: 'number', label: 'Number of Sisters' },
        number_of_sisters_married: { type: 'number', label: 'Sisters Married' },
      },
    },
    location: {
      title: 'Location Details',
      icon: IconMapPin,
      fields: {
        country: { type: 'select', label: 'Country', endpoint: 'country' },
        state: { type: 'select', label: 'State', endpoint: 'state' },
        district: { type: 'select', label: 'District', endpoint: 'district' },
        city: { type: 'select', label: 'City', endpoint: 'city' },
        mandal: { type: 'text', label: 'Mandal' },
        village_colony: { type: 'text', label: 'Village/Colony' },
        street_number: { type: 'text', label: 'Street Number' },
        house_number: { type: 'text', label: 'House Number' },
        landmark: { type: 'text', label: 'Landmark' },
        address_remaining: { type: 'textarea', label: 'Address Remaining' },
        pincode: { type: 'text', label: 'Pincode' },
        google_map_location: { type: 'url', label: 'Google Map Location', render: 'url_button' },
        family_google_map: { type: 'url', label: 'Family Google Map', render: 'url_button' },
        native_country: { type: 'select', label: 'Native Country', endpoint: 'country' },
        native_state: { type: 'select', label: 'Native State', endpoint: 'state' },
        native_district: { type: 'select', label: 'Native District', endpoint: 'district' },
        native_city: { type: 'select', label: 'Native City', endpoint: 'city' },
      },
    },
    payment: {
      title: 'Property & Payment',
      icon: IconCurrencyRupee,
      fields: {
        own_house: { type: 'select', label: 'Own House', endpoint: 'own_house' },
        total_property_value: { type: 'number', label: 'Total Property Value', step: '0.01' },
        property_details: { type: 'textarea', label: 'Property Details' },
        payment_status: { type: 'select', label: 'Payment Status', endpoint: 'payment_status' },
        payment_method: { type: 'select', label: 'Payment Method', endpoint: 'payment_method' },
        payment_amount: { type: 'number', label: 'Payment Amount', step: '0.01' },
        payment_date: { type: 'date', label: 'Payment Date' },
        payment_receipt: { type: 'image', label: 'Payment Receipt' },
        payment_admin_approval: { type: 'select', label: 'Payment Admin Approval', endpoint: 'payment_admin_approval' },
        bank_name: { type: 'text', label: 'Bank Name' },
        account_holder_name: { type: 'text', label: 'Account Holder Name' },
        agreement_status: { type: 'select', label: 'Agreement Status', endpoint: 'agreement_status' },
        agreement_file: { type: 'image', label: 'Agreement File' },
        admin_agreement_approval: { type: 'select', label: 'Admin Agreement Approval', endpoint: 'admin_agreement_approval' },
        settlement_status: { type: 'select', label: 'Settlement Status', endpoint: 'settlement_status' },
        settlement_by: { type: 'text', label: 'Settlement By' },
        settlement_amount: { type: 'number', label: 'Settlement Amount', step: '0.01' },
        settlement_type: { type: 'select', label: 'Settlement Type', endpoint: 'settlement_type' },
        settlement_date: { type: 'date', label: 'Settlement Date' },
        settlement_receipt: { type: 'image', label: 'Settlement Receipt' },
        settlement_admin_approval: { type: 'select', label: 'Settlement Admin Approval', endpoint: 'settlement_admin_approval' },
      },
    },
    preferences: {
      title: 'Partner Preferences',
      icon: IconHeart,
      fields: {
        kuja_dosham: { type: 'select', label: 'Kuja Dosham', endpoint: 'dosham' },
        preferred_age_from: { type: 'number', label: 'Preferred Age From' },
        preferred_age_to: { type: 'number', label: 'Preferred Age To' },
        preferred_height_from: { type: 'select', label: 'Preferred Height From', endpoint: 'height' },
        preferred_height_to: { type: 'select', label: 'Preferred Height To', endpoint: 'height' },
        preferred_marital_status: { type: 'multiselect', label: 'Preferred Marital Status', endpoint: 'marital_status' },
        pref_education: { type: 'multiselect', label: 'Preferred Education', endpoint: 'education' },
        pref_occupation: { type: 'multiselect', label: 'Preferred Occupation', endpoint: 'occupation' },
        pref_Emp_type: { type: 'multiselect', label: 'Preferred Employment Type', endpoint: 'employment_type' },
        preferred_salary: { type: 'multiselect', label: 'Preferred Salary', endpoint: 'annualsalary' },
        pref_raasi: { type: 'multiselect', label: 'Preferred Raasi', endpoint: 'raasi' },
        pref_star_sign: { type: 'multiselect', label: 'Preferred Star Sign', endpoint: 'star_sign' },
        pref_dosham: { type: 'multiselect', label: 'Preferred Dosham', endpoint: 'dosham' },
        pref_religion: { type: 'select', label: 'Preferred Religion', endpoint: 'religion' },
        pref_caste: { type: 'multiselect', label: 'Preferred Caste', endpoint: 'caste' },
        pref_family_type: { type: 'multiselect', label: 'Preferred Family Type', endpoint: 'family_type' },
        pref_family_status: { type: 'multiselect', label: 'Preferred Family Status', endpoint: 'family_status' },
        pref_countries: { type: 'multiselect', label: 'Preferred Countries', endpoint: 'country' },
        pref_states: { type: 'multiselect', label: 'Preferred States', endpoint: 'state' },
        pref_districts: { type: 'multiselect', label: 'Preferred Districts', endpoint: 'district' },
        pref_cities: { type: 'multiselect', label: 'Preferred Cities', endpoint: 'city' },
        pref_job_countries: { type: 'multiselect', label: 'Preferred Job Countries', endpoint: 'country' },
        pref_job_states: { type: 'multiselect', label: 'Preferred Job States', endpoint: 'state' },
        pref_job_cities: { type: 'multiselect', label: 'Preferred Job Cities', endpoint: 'city' },
        pref_citizenship_countries: { type: 'multiselect', label: 'Preferred Citizenship Countries', endpoint: 'citizenship' },
        pref_visa_types: { type: 'multiselect', label: 'Preferred Visa Types', endpoint: 'visa_type' },
      },
    },
    certificates: {
      title: 'Certificates',
      icon: IconFileText,
      fields: {
        dob_certificate: { type: 'image', label: 'DOB Certificate' },
        caste_certificate: { type: 'image', label: 'Caste Certificate' },
        address_proof: { type: 'image', label: 'Address Proof' },
        education_certificates: { type: 'image', label: 'Education Certificates' },
        marriage_certificate: { type: 'image', label: 'Marriage Certificate' },
        divorce_certificate: { type: 'image', label: 'Divorce Certificate' },
        house_tax_documents: { type: 'image', label: 'House Tax Documents' },
        company_id: { type: 'image', label: 'Company ID' },
        payslips: { type: 'image', label: 'Payslips' },
        salary_documents: { type: 'image', label: 'Salary Documents' },
        medical_certificate: { type: 'image', label: 'Medical Certificate' },
        disability_certificate: { type: 'image', label: 'Disability Certificate' },
      },
    },
  };

  // Fields to exclude from API requests
  const excludeFields = [
    'user_id', 'full_name', 'gender_name', 'education_name', 'assigned_employee_name',
    'country_name', 'state_name', 'city_name', 'district_name', 'visa_country_name',
    'job_country_name', 'job_state_name', 'job_city_name', 'native_country_name',
    'native_state_name', 'native_district_name', 'native_city_name',
    'profile_for_name', 'height_name', 'body_type_name', 'complexion_name',
    'physical_status_name', 'marital_status_name', 'eating_habits_name',
    'package_name_name', 'employment_type_name', 'occupation_name',
    'annual_salary_name', 'raasi_name', 'star_sign_name', 'padam_name',
    'dosham_name', 'religion_name', 'caste_name', 'mother_tongue_name',
    'citizenship_name', 'visa_type_name', 'family_values_name', 'family_type_name',
    'family_status_name', 'fathers_status_name', 'mothers_status_name',
    'own_house_name', 'payment_status_name', 'payment_method_name',
    'payment_admin_approval_name', 'agreement_status_name',
    'admin_agreement_approval_name', 'settlement_status_name',
    'settlement_type_name', 'settlement_admin_approval_name',
    'images', 'is_staff', 'is_active', 'created_at', 'updated_at', 'age',
  ];

  // Fetch customer details
  const fetchCustomerDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getData(`/customer/${user_id}/`);
      const customerData = response.data;
      const cleanedData = { ...customerData };
      excludeFields.forEach(field => delete cleanedData[field]);
      setCustomer(customerData);
      setFormData(cleanedData);
      setOriginalFormData(cleanedData);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Failed to load customer details');
      if (error.response?.status === 404) {
        navigate('/dashboard/superadmin/all-customers');
      }
    } finally {
      setLoading(false);
    }
  }, [user_id, navigate]);

  // Fetch initial dropdown data (excluding dependent state, district, city)
  const fetchDropdownData = useCallback(async () => {
    setLoadingDropdowns(true);
    try {
      const promises = endpoints.map(async endpoint => {
        try {
          const response = await getData(`/${endpoint}/`);
          return { endpoint, data: response.data?.results || response.data || [] };
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
      // toast.error('Failed to load dropdown options');
    } finally {
      setLoadingDropdowns(false);
    }
  }, []);

  // Fetch states based on country ID
  const fetchStates = useCallback(async (countryId, fieldPrefix) => {
    if (!countryId) {
      setStateOptions(prev => ({ ...prev, [fieldPrefix]: [] }));
      return;
    }
    try {
      const response = await getData(`/countries/${countryId}/states/`);
      setStateOptions(prev => ({ ...prev, [fieldPrefix]: response.data?.results || response.data || [] }));
    } catch (error) {
      console.error(`Error fetching states for ${fieldPrefix}:`, error);
      setStateOptions(prev => ({ ...prev, [fieldPrefix]: [] }));
    }
  }, []);

  // Fetch districts based on state ID
  const fetchDistricts = useCallback(async (stateId, fieldPrefix) => {
    if (!stateId) {
      setDistrictOptions(prev => ({ ...prev, [fieldPrefix]: [] }));
      return;
    }
    try {
      const response = await getData(`/states/${stateId}/districts/`);
      setDistrictOptions(prev => ({ ...prev, [fieldPrefix]: response.data?.results || response.data || [] }));
    } catch (error) {
      console.error(`Error fetching districts for ${fieldPrefix}:`, error);
      setDistrictOptions(prev => ({ ...prev, [fieldPrefix]: [] }));
    }
  }, []);

  // Fetch cities based on district ID
  const fetchCities = useCallback(async (districtId, fieldPrefix) => {
    if (!districtId) {
      setCityOptions(prev => ({ ...prev, [fieldPrefix]: [] }));
      return;
    }
    try {
      const response = await getData(`/districts/${districtId}/cities/`);
      setCityOptions(prev => ({ ...prev, [fieldPrefix]: response.data?.results || response.data || [] }));
    } catch (error) {
      console.error(`Error fetching cities for ${fieldPrefix}:`, error);
      setCityOptions(prev => ({ ...prev, [fieldPrefix]: [] }));
    }
  }, []);

  // Initialize data
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access this page.');
      logout();
      navigate('/login');
      return;
    }
    fetchCustomerDetails();
    fetchDropdownData();
  }, [isAuthenticated, fetchCustomerDetails, fetchDropdownData, logout, navigate]);

  // Fetch dependent dropdowns when customer data is loaded
  useEffect(() => {
    if (customer) {
      // Fetch states for country
      if (customer.country) fetchStates(customer.country, 'state');
      if (customer.native_country) fetchStates(customer.native_country, 'native_state');
      if (customer.job_country) fetchStates(customer.job_country, 'job_state');
      // Fetch districts for state
      if (customer.state) fetchDistricts(customer.state, 'district');
      if (customer.native_state) fetchDistricts(customer.native_state, 'native_district');
      if (customer.job_state) fetchDistricts(customer.job_state, 'job_district');
      // Fetch cities for district
      if (customer.district) fetchCities(customer.district, 'city');
      if (customer.native_district) fetchCities(customer.native_district, 'native_city');
      if (customer.job_district) fetchCities(customer.job_district, 'job_city');
    }
  }, [customer, fetchStates, fetchDistricts, fetchCities]);

  // Handle country change
  const handleCountryChange = useCallback((fieldName, value) => {
    const prefix = fieldName === 'country' ? 'state' : fieldName === 'native_country' ? 'native_state' : 'job_state';
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
      [prefix]: null,
      [prefix.replace('state', 'district')]: null,
      [prefix.replace('state', 'city')]: null,
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      delete newErrors[prefix];
      delete newErrors[prefix.replace('state', 'district')];
      delete newErrors[prefix.replace('state', 'city')];
      return newErrors;
    });
    fetchStates(value, prefix);
    setDistrictOptions(prev => ({ ...prev, [prefix.replace('state', 'district')]: [] }));
    setCityOptions(prev => ({ ...prev, [prefix.replace('state', 'city')]: [] }));
  }, [fetchStates]);

  // Handle state change
  const handleStateChange = useCallback((fieldName, value) => {
    const prefix = fieldName.replace('state', 'district');
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
      [prefix]: null,
      [prefix.replace('district', 'city')]: null,
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      delete newErrors[prefix];
      delete newErrors[prefix.replace('district', 'city')];
      return newErrors;
    });
    fetchDistricts(value, prefix);
    setCityOptions(prev => ({ ...prev, [prefix.replace('district', 'city')]: [] }));
  }, [fetchDistricts]);

  // Handle district change
  const handleDistrictChange = useCallback((fieldName, value) => {
    const prefix = fieldName.replace('district', 'city');
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
      [prefix]: null,
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      delete newErrors[prefix];
      return newErrors;
    });
    fetchCities(value, prefix);
  }, [fetchCities]);

  // Handle input changes
  const handleInputChange = useCallback((fieldName, value) => {
    if (['country', 'native_country', 'job_country'].includes(fieldName)) {
      handleCountryChange(fieldName, value);
    } else if (['state', 'native_state', 'job_state'].includes(fieldName)) {
      handleStateChange(fieldName, value);
    } else if (['district', 'native_district', 'job_district'].includes(fieldName)) {
      handleDistrictChange(fieldName, value);
    } else {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value,
      }));
      if (errors[fieldName]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    }
  }, [errors, handleCountryChange, handleStateChange, handleDistrictChange]);

  // Handle multiselect changes
  const handleMultiselectChange = useCallback((fieldName, optionId) => {
    setFormData(prev => {
      const currentValues = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      const newValues = currentValues.includes(optionId)
        ? currentValues.filter(id => id !== optionId)
        : [...currentValues, optionId];
      return {
        ...prev,
        [fieldName]: newValues.length > 0 ? newValues : null,
      };
    });
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle file upload
  const handleFileUpload = useCallback((fieldName, file) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: file || null,
    }));
  }, []);

  // Validate required fields
  const validateRequiredFields = (sectionKey = null) => {
    const newErrors = {};
    const sectionsToValidate = sectionKey ? [sectionKey] : Object.keys(fieldConfig);
    sectionsToValidate.forEach(key => {
      const section = fieldConfig[key];
      Object.entries(section.fields).forEach(([fieldName, config]) => {
        if (config.required && (!formData[fieldName] || formData[fieldName] === '')) {
          newErrors[fieldName] = `${config.label} is required`;
        }
      });
    });
    return newErrors;
  };

  // Get changed fields
  const getChangedFields = (sectionKey) => {
    const changedData = {};
    const sectionFields = Object.keys(fieldConfig[sectionKey].fields);
    sectionFields.forEach(field => {
      const originalValue = originalFormData[field];
      const newValue = formData[field];
      if (Array.isArray(originalValue) && Array.isArray(newValue)) {
        if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
          changedData[field] = newValue.length > 0 ? newValue : null;
        }
      } else if (originalValue !== newValue && !(originalValue === undefined && newValue === null)) {
        changedData[field] = newValue;
      }
    });
    return changedData;
  };

  // Save changes
  const handleSave = useCallback(async (sectionKey = null) => {
    setSaving(true);
    setErrors({});
    const validationErrors = validateRequiredFields(sectionKey);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const fileFields = Object.keys(fieldConfig.photos.fields)
        .concat(Object.keys(fieldConfig.certificates.fields))
        .concat(['payment_receipt', 'agreement_file', 'settlement_receipt']);
      const multiselectFields = Object.values(fieldConfig).flatMap(section =>
        Object.entries(section.fields)
          .filter(([_, config]) => config.type === 'multiselect')
          .map(([fieldName]) => fieldName)
      );
      let submitData;
      let apiMethod;
      if (sectionKey) {
        submitData = getChangedFields(sectionKey);
        apiMethod = patchData;
      } else {
        submitData = { ...formData };
        excludeFields.forEach(field => delete submitData[field]);
        if (submitData.assigned_employee?.user_id) {
          submitData.assigned_employee = submitData.assigned_employee.user_id;
        }
        multiselectFields.forEach(field => {
          const originalValue = originalFormData[field];
          const newValue = submitData[field];
          if (JSON.stringify(newValue) === JSON.stringify(originalValue)) {
            submitData[field] = originalValue !== undefined ? originalValue : null;
          } else {
            submitData[field] = Array.isArray(newValue) && newValue.length > 0 ? newValue : null;
          }
        });
        // Map height-related fields to their IDs
        ['height', 'preferred_height_from', 'preferred_height_to'].forEach(field => {
          if (submitData[field] && typeof submitData[field] === 'string') {
            const heightOption = dropdownData['height']?.find(option => option.height === submitData[field]);
            submitData[field] = heightOption ? heightOption.id : null;
          }
        });
        apiMethod = putData;
      }
      const hasFileChanges = Object.entries(submitData).some(
        ([key, value]) => fileFields.includes(key) && (value instanceof File || value === null)
      );
      let response;
      if (hasFileChanges || sectionKey === 'photos' || sectionKey === 'certificates' || sectionKey === 'payment') {
        const formDataObj = new FormData();
        Object.keys(submitData).forEach(key => {
          const value = submitData[key];
          if (value !== null && value !== undefined && value !== '') {
            if (key === 'assigned_employee' && value?.user_id) {
              formDataObj.append(key, value.user_id);
            } else if (multiselectFields.includes(key) && Array.isArray(value)) {
              formDataObj.append(key, JSON.stringify(value));
            } else if (fileFields.includes(key) && value instanceof File) {
              formDataObj.append(key, value);
            } else if (fileFields.includes(key) && value === null) {
              formDataObj.append(key, '');
            } else {
              formDataObj.append(key, value);
            }
          }
        });
        response = await apiMethod(`/customer/${user_id}/`, formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        if (sectionKey) {
          if (Object.keys(submitData).length === 0) {
            setSaving(false);
            setEditingSection(null);
            setIsEditingAll(false);
            toast.info('No changes to save');
            return;
          }
        } else {
          fileFields.forEach(key => {
            if (!(submitData[key] instanceof File) && submitData[key] !== null) {
              delete submitData[key];
            }
          });
        }
        response = await apiMethod(`/customer/${user_id}/`, submitData, {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 200 || response.status === 201) {
        setCustomer(response.data);
        const cleanedData = { ...response.data };
        excludeFields.forEach(field => delete cleanedData[field]);
        setFormData(cleanedData);
        setOriginalFormData(cleanedData);
        await fetchCustomerDetails();
        setIsEditingAll(false);
        setEditingSection(null);
        toast.success(`Customer ${sectionKey ? sectionKey : 'details'} updated successfully!`);
      } else {
        toast.error(`Failed to update customer ${sectionKey ? sectionKey : 'details'}: Unexpected response`);
      }
    } catch (error) {
      console.error(`Error updating customer ${sectionKey ? sectionKey : 'details'}:`, error);
      const apiErrors = error.response?.data || {};
      setErrors(apiErrors);
      const errorMessage = Object.values(apiErrors).length
        ? Object.values(apiErrors).flat().join(', ')
        : error.message || 'Unknown error';
      toast.error(`Failed to update customer ${sectionKey ? sectionKey : 'details'}: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }, [formData, originalFormData, user_id, fetchCustomerDetails, dropdownData]);

  // Handle Assign Customer
  const handleAssign = useCallback(async () => {
    if (!loggedInUser || !loggedInUser.id) {
      toast.error('Your employee ID is not available. Please log in again.');
      return;
    }
    setIsAssigning(true);
    try {
      const payload = { assigned_employee: loggedInUser.id };
      const response = await patchData(`/customer/${user_id}/`, payload);
      if (response.status === 200) {
        toast.success(`Customer assigned to ${loggedInUser.full_name} successfully!`);
        await fetchCustomerDetails();
      } else {
        toast.error('Failed to assign customer.');
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
      toast.error('Failed to assign customer. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  }, [loggedInUser, user_id, fetchCustomerDetails]);

  // Handle Deassign Customer
  const handleDeassign = useCallback(async () => {
    setIsAssigning(true);
    try {
      const payload = { assigned_employee: null };
      const response = await patchData(`/customer/${user_id}/`, payload);
      if (response.status === 200) {
        toast.success('Customer deassigned successfully!');
        await fetchCustomerDetails();
      } else {
        toast.error('Failed to deassign customer.');
      }
    } catch (error) {
      console.error('Error deassigning customer:', error);
      toast.error('Failed to deassign customer. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  }, [user_id, fetchCustomerDetails]);

  // Handle Cancel Editing
  const handleCancel = useCallback((sectionKey = null) => {
    setFormData(originalFormData);
    setErrors({});
    setIsEditingAll(false);
    setEditingSection(null);
  }, [originalFormData]);

  // Handle Edit Section
  const handleEditSection = useCallback((sectionKey) => {
    setEditingSection(sectionKey);
    setIsEditingAll(false);
  }, []);

  // Get Option Name
  const getOptionName = useCallback((endpoint, id, fieldName) => {
    let options = dropdownData[endpoint] || [];
    if (['state', 'native_state', 'job_state'].includes(fieldName)) {
      options = stateOptions[fieldName] || [];
    } else if (['district', 'native_district', 'job_district'].includes(fieldName)) {
      options = districtOptions[fieldName] || [];
    } else if (['city', 'native_city', 'job_city'].includes(fieldName)) {
      options = cityOptions[fieldName] || [];
    }
    if (!id || !options) return 'N/A';
    const option = options.find(item => item.id === id);
    return option ? (['height', 'preferred_height_from', 'preferred_height_to'].includes(fieldName) ? option.height : option.name) : 'N/A';
  }, [dropdownData, stateOptions, districtOptions, cityOptions]);

  // Handle View Sensitive Data
  const handleViewSensitiveData = useCallback((dataType) => {
    setSensitiveDataType(dataType);
    setShowPrivacyModal(true);
    setIsLoadingSensitiveData(false);
  }, []);

  // Handle Privacy Modal Agree
  const handlePrivacyModalAgree = useCallback(() => {
    setIsLoadingSensitiveData(true);
    setTimeout(() => {
      setIsLoadingSensitiveData(false);
      setHasAgreedToPrivacy(prev => ({ ...prev, [sensitiveDataType]: true }));
    }, 2000); // Simulate 2-second loading
  }, [sensitiveDataType]);

  // Handle Privacy Modal Close
  const handlePrivacyModalClose = useCallback(() => {
    setShowPrivacyModal(false);
    setSensitiveDataType(null);
    setIsLoadingSensitiveData(false);
  }, []);

  // Render Field
  const renderField = (fieldName, fieldConfig, sectionKey) => {
    const value = formData[fieldName];
    const displayValue = customer?.[fieldName];
    const hasError = errors[fieldName];
    const isEditing = isEditingAll || editingSection === sectionKey;
    const isSensitive = fieldConfig.sensitive;

    const inputClasses = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;
    const displayClasses = `px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 whitespace-normal break-words`;
    const labelClasses = `block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5`;
    const errorClasses = `text-xs text-red-600 flex items-center gap-1 mt-1`;

    if (isSensitive && !isEditing) {
      return (
        <div className="space-y-1">
          <label className={labelClasses}>
            {fieldConfig.label}
            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {hasAgreedToPrivacy[fieldName] ? (
            <div className={displayClasses}>
              {displayValue || 'Not provided'}
            </div>
          ) : (
            <SensitiveDataDisplay
              data={displayValue}
              type={fieldName}
              onView={() => handleViewSensitiveData(fieldName)}
              isEditing={isEditing}
            />
          )}
          {hasError && (
            <p className={errorClasses}>
              <IconAlertCircle size={14} />
              {Array.isArray(hasError) ? hasError.join(', ') : hasError}
            </p>
          )}
        </div>
      );
    }

    let options = dropdownData[fieldConfig.endpoint] || [];
    if (['state', 'native_state', 'job_state'].includes(fieldName)) {
      options = stateOptions[fieldName] || [];
    } else if (['district', 'native_district', 'job_district'].includes(fieldName)) {
      options = districtOptions[fieldName] || [];
    } else if (['city', 'native_city', 'job_city'].includes(fieldName)) {
      options = cityOptions[fieldName] || [];
    }

    switch (fieldConfig.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
      case 'time':
        return (
          <div className="space-y-1">
            <label className={labelClasses}>
              {fieldConfig.label}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isEditing ? (
              <input
                type={fieldConfig.type}
                value={value || ''}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                step={fieldConfig.step}
                className={inputClasses}
                placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
              />
            ) : (
              <div className={`${displayClasses} ${fieldConfig.type === 'email' || fieldConfig.type === 'url' ? 'truncate' : ''}`}>
                {displayValue || 'Not provided'}
              </div>
            )}
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={14} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'url':
        return (
          <div className="space-y-1">
            <label className={labelClasses}>
              {fieldConfig.label}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={value || ''}
                  onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  className={inputClasses}
                  placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
                />
                <button
                  onClick={() => {
                    if (value) {
                      window.open(value, '_blank');
                    } else {
                      toast.info('Please enter a URL first.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm transform hover:scale-105"
                  disabled={!value}
                >
                  <IconExternalLink size={16} />
                  Open in Maps
                </button>
              </div>
            ) : (
              <div className={`${displayClasses} truncate flex items-center gap-2`}>
                {displayValue ? (
                  <a href={displayValue} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
                    {displayValue}
                  </a>
                ) : (
                  'Not provided'
                )}
                {displayValue && (
                  <button
                    onClick={() => window.open(displayValue, '_blank')}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    <IconExternalLink size={16} />
                  </button>
                )}
              </div>
            )}
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={14} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-1">
            <label className={labelClasses}>
              {fieldConfig.label}
            </label>
            {isEditing ? (
              <textarea
                value={value || ''}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                rows={4}
                className={`${inputClasses} resize-y`}
                placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
              />
            ) : (
              <div className={`${displayClasses} min-h-[60px] whitespace-pre-wrap`}>
                {displayValue || 'Not provided'}
              </div>
            )}
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={14} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleInputChange(fieldName, e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {fieldConfig.label}
              </span>
            </label>
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={14} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'select':
        const isHeightField = ['height', 'preferred_height_from', 'preferred_height_to'].includes(fieldName);
        const selectedOption = options.find(option => option.id === (value || displayValue));
        const isDisabled = ['state', 'native_state', 'job_state'].includes(fieldName)
          ? !formData[fieldName.replace('state', 'country')]
          : ['district', 'native_district', 'job_district'].includes(fieldName)
            ? !formData[fieldName.replace('district', 'state')]
            : ['city', 'native_city', 'job_city'].includes(fieldName)
              ? !formData[fieldName.replace('city', 'district')]
              : false;
        return (
          <div className="space-y-1">
            <label className={labelClasses}>
              {fieldConfig.label}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isEditing ? (
              <div className="relative">
                <select
                  value={selectedOption ? selectedOption.id : ''}
                  onChange={(e) => {
                    const selectedId = e.target.value ? parseInt(e.target.value, 10) : null;
                    handleInputChange(fieldName, selectedId);
                  }}
                  className={`${inputClasses} appearance-none bg-white dark:bg-gray-700 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDisabled}
                >
                  <option value="">Select {fieldConfig.label}</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {isHeightField ? option.height : option.name}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            ) : (
              <div className={displayClasses}>
                {getOptionName(fieldConfig.endpoint, displayValue, fieldName)}
              </div>
            )}
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={14} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'multiselect':
        const multiselectOptions = dropdownData[fieldConfig.endpoint] || [];
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-1">
            <label className={labelClasses}>
              {fieldConfig.label}
            </label>
            {isEditing ? (
              <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600">
                {multiselectOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.id)}
                      onChange={() => handleMultiselectChange(fieldName, option.id)}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{option.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className={`${displayClasses} min-h-[60px]`}>
                {selectedValues.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedValues.map(id => (
                      <span key={id} className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full dark:bg-indigo-900 dark:text-indigo-200">
                        {getOptionName(fieldConfig.endpoint, id, fieldName)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">None selected</span>
                )}
              </div>
            )}
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={14} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-1">
            <label className={labelClasses}>
              {fieldConfig.label}
            </label>
            <div className="space-y-2">
              {displayValue && (
                <div className="relative w-28 h-28">
                  <img
                    src={`${import.meta.env.VITE_BASE_MEDIA_URL}${displayValue}`}
                    alt={fieldConfig.label}
                    className="max-w-full max-h-full object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x400/cccccc/000000?text=Image+Not+Found';
                      e.target.onerror = null;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setZoomedImage(`${import.meta.env.VITE_BASE_MEDIA_URL}${displayValue}`)}
                    className="absolute top-1.5 right-1.5 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                    title="View Full Image"
                  >
                    <IconEye size={16} />
                  </button>
                </div>
              )}
              {isEditing && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(fieldName, e.target.files[0])}
                    className="hidden"
                    id={`file-${fieldName}`}
                  />
                  <label
                    htmlFor={`file-${fieldName}`}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors shadow-sm"
                  >
                    <IconUpload size={16} />
                    Upload
                  </label>
                  {displayValue && (
                    <button
                      type="button"
                      onClick={() => handleFileUpload(fieldName, null)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-red-300 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 dark:border-red-600 dark:hover:bg-red-900/20 dark:text-red-400 transition-colors shadow-sm"
                      title="Clear Image"
                    >
                      <IconX size={16} />
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={14} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading || loadingDropdowns) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="mx-auto animate-spin text-indigo-600 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <IconAlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Customer not found</p>
          <button
            onClick={() => navigate('/dashboard/superadmin/all-customers')}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-800 transition-colors shadow-sm transform hover:scale-105"
          >
            <IconArrowLeft size={16} /> Back to Customers
          </button>
        </div>
      </div>
    );
  }

  const isAssignedToCurrentUser = customer.assigned_employee?.user_id === loggedInUser?.id;
  const isAssigned = !!customer.assigned_employee;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8 selection:bg-indigo-600 selection:text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <button
              onClick={() => navigate('/dashboard/superadmin/all-customers')}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm font-medium transition-colors"
            >
              <IconArrowLeft size={18} />
              Back to Customers
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim()}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">ID: {customer.user_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${customer.account_status ? 'bg-green-500 animate-pulse-slow' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {customer.account_status ? 'Online' : 'Offline'}
              </span>
            </div>
            {!isEditingAll && !editingSection ? (
              <button
                onClick={() => setIsEditingAll(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-800 transition-colors shadow-sm transform hover:scale-105"
              >
                <IconEdit size={18} />
                Edit All
              </button>
            ) : isEditingAll ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCancel()}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <IconX size={18} />
                  Cancel
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 shadow-sm transform hover:scale-105"
                >
                  {saving ? <IconLoader2 className="animate-spin" size={18} /> : <IconDeviceFloppy size={18} />}
                  {saving ? 'Saving...' : 'Save All'}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Customer Details Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Object.entries(fieldConfig).map(([sectionKey, sectionConfig]) => {
            const IconComponent = sectionConfig.icon;

            return (
              <div key={sectionKey} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 animate-card-enter">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg">
                      <IconComponent className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {sectionConfig.title}
                    </h2>
                  </div>
                  {!isEditingAll && editingSection !== sectionKey ? (
                    <button
                      onClick={() => handleEditSection(sectionKey)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-colors shadow-sm transform hover:scale-105"
                    >
                      <IconEdit size={16} />
                      Edit
                    </button>
                  ) : editingSection === sectionKey ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCancel(sectionKey)}
                        className="flex items-center gap-1.5 bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm"
                      >
                        <IconX size={16} />
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(sectionKey)}
                        disabled={saving}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 shadow-sm transform hover:scale-105"
                      >
                        {saving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {Object.entries(sectionConfig.fields).map(([fieldName, fieldConfig]) => (
                      <div key={fieldName} className={fieldConfig.type === 'textarea' || fieldConfig.type === 'multiselect' || fieldConfig.type === 'image' || fieldConfig.render === 'url_button' ? 'md:col-span-2' : ''}>
                        {renderField(fieldName, fieldConfig, sectionKey)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assigned Employee Info */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700 p-5 shadow-md">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full">
              <IconUser className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div className="flex-grow">
              <h3 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">Assigned Employee</h3>
              {isAssigned ? (
                <>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">{customer.assigned_employee.full_name}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">ID: {customer.assigned_employee.user_id}</p>
                </>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Not assigned to any employee.</p>
              )}
            </div>
            <div className="ml-auto flex gap-2">
              {isAssigned ? (
                <button
                  onClick={handleDeassign}
                  disabled={isAssigning}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-rose-700 transition-colors disabled:opacity-50 shadow-sm transform hover:scale-105"
                >
                  {isAssigning ? <IconLoader2 className="animate-spin" size={16} /> : <IconUserMinus size={16} />}
                  {isAssigning ? 'Deassigning...' : 'Deassign'}
                </button>
              ) : (
                <button
                  onClick={handleAssign}
                  disabled={isAssigning}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 shadow-sm transform hover:scale-105"
                >
                  {isAssigning ? <IconLoader2 className="animate-spin" size={16} /> : <IconUserPlus size={16} />}
                  {isAssigning ? 'Assigning...' : 'Assign to Me'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Image Zoom Modal */}
        <ImageZoomModal src={zoomedImage} onClose={() => setZoomedImage(null)} />

        {/* Privacy Modal */}
        <PrivacyModal
          isOpen={showPrivacyModal}
          onClose={handlePrivacyModalClose}
          onAgree={handlePrivacyModalAgree}
          customer={customer}
          dataType={sensitiveDataType}
          isLoading={isLoadingSensitiveData}
          employeeName={employeeName}
          employeeId={employeeId}
        />
      </div>

      {/* Inline Styles with dropdown fix */}
      <style>{`
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
        .animate-card-enter {
          opacity: 0;
          transform: translateY(20px);
          animation: cardEnter 0.4s ease-out forwards;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
        select::-ms-expand {
          display: none;
        }
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
      `}</style>
    </div>
  );
};

export default ECustomerDetails;