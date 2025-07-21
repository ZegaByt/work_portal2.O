import React, { useEffect, useState, useCallback, useMemo, Suspense, lazy } from 'react';
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

// Define BASE_MEDIA_URL with a fallback for environments that don't support import.meta
const BASE_MEDIA_URL = import.meta.env.VITE_BASE_MEDIA_URL || '';

// --- Skeleton Components for Suspense Fallback ---
const SkeletonField = () => (
  <div className="space-y-1">
    <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
  </div>
);

const SkeletonSection = ({ title }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"> {/* Removed animate-card-enter here */}
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse h-8 w-8"></div>
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
    </div>
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {[...Array(6)].map((_, i) => ( // Render a few skeleton fields
          <SkeletonField key={i} />
        ))}
      </div>
    </div>
  </div>
);

// --- Modals (retained as they are global overlays) ---
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

const PrivacyModal = ({ isOpen, onClose, onAgree, dataType, isLoading, employeeName, employeeId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-4 transition-opacity duration-300 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md p-6 relative shadow-2xl ring-1 ring-gray-900/5 animate-modal-slide-down dark:bg-gray-800 dark:ring-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors duration-200 dark:text-gray-500 dark:hover:text-gray-300"
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

// --- Section Card Content Component ---
// This component renders the fields within each section card.
// It's separated to simplify the SectionCard and allow renderField to be passed down.
const SectionCardContent = React.memo(({
  fields,
  sectionKey,
  renderField,
}) => {
  return (
    <div className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {Object.entries(fields).map(([fieldName, fieldConfig]) => (
          <div key={fieldName} className={fieldConfig.type === 'textarea' || fieldConfig.type === 'multiselect' || fieldConfig.type === 'image' || fieldConfig.render === 'url_button' ? 'md:col-span-2' : ''}>
            {renderField(fieldName, fieldConfig, sectionKey)}
          </div>
        ))}
      </div>
    </div>
  );
});

// --- Section Card Wrapper Component ---
// This component provides the common card structure and edit/save buttons for each section.
const SectionCard = React.memo(({
  title,
  icon: IconComponent,
  sectionKey,
  fields, // Pass fields down to SectionCardContent
  formData, // Passed for SectionCardContent
  customer, // Passed for SectionCardContent
  errors, // Passed for SectionCardContent
  isEditingAll,
  editingSection,
  handleEditSection,
  handleCancel,
  handleSave,
  saving,
  renderField, // Pass renderField down to SectionCardContent
}) => {
  const isEditing = isEditingAll || editingSection === sectionKey;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 animate-card-enter">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg">
            <IconComponent className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
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
      <SectionCardContent
        fields={fields}
        sectionKey={sectionKey}
        renderField={renderField}
      />
    </div>
  );
});

// --- Lazy Loaded Section Components ---
// These components will wrap SectionCard and be lazy loaded.
// In a real application, these would be in separate files.
const PersonalSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="personal" title="Personal Information" icon={IconUser} fields={props.fieldConfig.personal.fields} />
}));
const PhotosSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="photos" title="Photos" icon={IconCamera} fields={props.fieldConfig.photos.fields} />
}));
const PackageSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="package" title="Package Information" icon={IconFileText} fields={props.fieldConfig.package.fields} />
}));
const CareerSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="career" title="Education & Career" icon={IconBriefcase} fields={props.fieldConfig.career.fields} />
}));
const AstroSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="astro" title="Astro Information" icon={IconStar} fields={props.fieldConfig.astro.fields} />
}));
const ReligionSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="religion" title="Religion & Social" icon={IconUsers} fields={props.fieldConfig.religion.fields} />
}));
const FamilySection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="family" title="Family Information" icon={IconHome} fields={props.fieldConfig.family.fields} />
}));
const LocationSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="location" title="Location Details" icon={IconMapPin} fields={props.fieldConfig.location.fields} />
}));
const PaymentSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="payment" title="Property & Payment" icon={IconCurrencyRupee} fields={props.fieldConfig.payment.fields} />
}));
const PreferencesSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="preferences" title="Partner Preferences" icon={IconHeart} fields={props.fieldConfig.preferences.fields} />
}));
const CertificatesSection = lazy(() => Promise.resolve({
  default: (props) => <SectionCard {...props} sectionKey="certificates" title="Certificates" icon={IconFileText} fields={props.fieldConfig.certificates.fields} />
}));


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
  // More granular loading for dependent dropdowns
  const [loadingDependentData, setLoadingDependentData] = useState({});
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [sensitiveDataType, setSensitiveDataType] = useState(null);
  const [isLoadingSensitiveData, setIsLoadingSensitiveData] = useState(false);
  const [hasAgreedToPrivacy, setHasAgreedToPrivacy] = useState({});
  const [activeTab, setActiveTab] = useState('personal'); // State for active navigation tab

  const employeeName = loggedInUser?.full_name || loggedInUser?.first_name || 'Employee';
  const employeeId = loggedInUser?.id || 'N/A';

  // Map of section keys to their corresponding lazy components
  const sectionComponents = useMemo(() => ({
    personal: PersonalSection,
    photos: PhotosSection,
    package: PackageSection,
    career: CareerSection,
    astro: AstroSection,
    religion: ReligionSection,
    family: FamilySection,
    location: LocationSection,
    payment: PaymentSection,
    preferences: PreferencesSection,
    certificates: CertificatesSection,
  }), []);

  // Dropdown endpoints (excluding dependent state, district, city as they are fetched dynamically)
  const endpoints = useMemo(() => [
    'profile-for', 'gender', 'height', 'body_type', 'complexion', 'physical_status', 'marital_status', 'eating_habits',
    'package_name', 'employment_type', 'education', 'occupation', 'annualsalary',
    'raasi', 'star_sign', 'padam', 'dosham', 'religion', 'caste', 'mother_tongue', 'citizenship', 'visa_type',
    'family_values', 'family_type', 'family_status', 'fathers_status', 'mothers_status', 'own_house',
    'payment_status', 'payment_method', 'payment_admin_approval', 'agreement_status', 'admin_agreement_approval',
    'settlement_status', 'settlement_type', 'settlement_admin_approval', 'country', 'visa_country', 'employees',
  ], []);

  // Field configurations - Memoized for stability
  const fieldConfig = useMemo(() => ({
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
        job_state: { type: 'select', label: 'Job State', endpoint: 'state', dependsOn: 'job_country' },
        job_district: { type: 'select', label: 'Job District', endpoint: 'district', dependsOn: 'job_state' },
        job_city: { type: 'select', label: 'Job City', endpoint: 'city', dependsOn: 'job_district' },
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
        state: { type: 'select', label: 'State', endpoint: 'state', dependsOn: 'country' },
        district: { type: 'select', label: 'District', endpoint: 'district', dependsOn: 'state' },
        city: { type: 'select', label: 'City', endpoint: 'city', dependsOn: 'district' },
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
        native_state: { type: 'select', label: 'Native State', endpoint: 'state', dependsOn: 'native_country' },
        native_district: { type: 'select', label: 'Native District', endpoint: 'district', dependsOn: 'native_state' },
        native_city: { type: 'select', label: 'Native City', endpoint: 'city', dependsOn: 'native_district' },
        native_mandal: { type: 'text', label: 'Native Mandal' },
        native_village_colony: { type: 'text', label: 'Native Village/Colony' },
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
        pref_states: { type: 'multiselect', label: 'Preferred States', endpoint: 'state', dependsOn: 'pref_countries' },
        pref_districts: { type: 'multiselect', label: 'Preferred Districts', endpoint: 'district', dependsOn: 'pref_states' },
        pref_cities: { type: 'multiselect', label: 'Preferred Cities', endpoint: 'city', dependsOn: 'pref_districts' },
        pref_job_countries: { type: 'multiselect', label: 'Preferred Job Countries', endpoint: 'country' },
        pref_job_states: { type: 'multiselect', label: 'Preferred Job States', endpoint: 'state', dependsOn: 'pref_job_countries' },
        pref_job_cities: { type: 'multiselect', label: 'Preferred Job Cities', endpoint: 'city', dependsOn: 'pref_job_states' },
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
  }), []);

  // Fields to exclude from API requests - Memoized
  const excludeFields = useMemo(() => [
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
  ], []);

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
        navigate('/dashboard/employee/all-customers');
      }
    } finally {
      setLoading(false);
    }
  }, [user_id, navigate, excludeFields]);

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
      // toast.error('Failed to load dropdown options'); // Re-enable if critical
    } finally {
      setLoadingDropdowns(false);
    }
  }, [endpoints]);

  // Fetch dependent data (e.g., states for a country)
  const fetchDependentData = useCallback(async (endpoint, parentId, fieldName, isMultiSelect = false) => {
    setLoadingDependentData(prev => ({ ...prev, [fieldName]: true }));
    try {
      let url;
      if (endpoint === 'state') {
        url = `/countries/${parentId}/states/`;
      } else if (endpoint === 'district') {
        url = `/states/${parentId}/districts/`;
      } else if (endpoint === 'city') {
        url = `/districts/${parentId}/cities/`;
      } else {
        return;
      }

      const response = await getData(url);
      const data = response.data?.results || response.data || [];

      setDropdownData(prev => {
        const existingOptions = prev[endpoint] || [];
        let newOptions;
        if (isMultiSelect) {
          const combinedOptions = [...existingOptions, ...data];
          const uniqueOptionsMap = new Map();
          combinedOptions.forEach(option => uniqueOptionsMap.set(option.id, option));
          newOptions = Array.from(uniqueOptionsMap.values());
        } else {
          newOptions = data;
        }
        return {
          ...prev,
          [endpoint]: newOptions,
        };
      });
    } catch (error) {
      console.error(`Error fetching dependent ${endpoint} data for ${fieldName}:`, error);
      toast.error(`Failed to load ${fieldConfig[fieldName]?.label || endpoint} options`);
      setDropdownData(prev => ({
        ...prev,
        [endpoint]: [],
      }));
    } finally {
      setLoadingDependentData(prev => ({ ...prev, [fieldName]: false }));
    }
  }, [fieldConfig]);


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

  // Effect to fetch initial dependent dropdown data based on customer's profile
  useEffect(() => {
    if (customer && !loading && !loadingDropdowns) {
      const dependentFieldMap = {
        country: ['state', 'district', 'city'],
        native_country: ['native_state', 'native_district', 'native_city'],
        job_country: ['job_state', 'job_district', 'job_city'],
        state: ['district', 'city'],
        native_state: ['native_district', 'native_city'],
        job_state: ['job_district', 'job_city'],
        district: ['city'],
        native_district: ['native_city'],
        job_district: ['job_city'],
        pref_countries: ['pref_states', 'pref_districts', 'pref_cities'],
        pref_states: ['pref_districts', 'pref_cities'],
        pref_districts: ['pref_cities'],
        pref_job_countries: ['pref_job_states', 'pref_job_cities'],
        pref_job_states: ['pref_job_cities'],
      };

      // Function to recursively fetch dependent data
      const fetchInitialDependent = (parentFieldName, currentFormData) => {
        const parentValue = currentFormData[parentFieldName];
        const childrenFields = dependentFieldMap[parentFieldName];

        if (parentValue && childrenFields && childrenFields.length > 0) {
          const isMultiSelect = fieldConfig.preferences.fields[parentFieldName]?.type === 'multiselect';
          const childFieldName = childrenFields[0]; // Fetch only the immediate child
          const childEndpoint = fieldConfig.location.fields[childFieldName]?.endpoint || fieldConfig.career.fields[childFieldName]?.endpoint || fieldConfig.preferences.fields[childFieldName]?.endpoint;

          if (childEndpoint) {
            if (isMultiSelect && Array.isArray(parentValue)) {
              parentValue.forEach(id => fetchDependentData(childEndpoint, id, childFieldName, true));
            } else if (!isMultiSelect) {
              fetchDependentData(childEndpoint, parentValue, childFieldName, false);
            }
          }
          // Recursively call for the next level of dependency if the child field has a value
          if (currentFormData[childFieldName]) {
            fetchInitialDependent(childFieldName, currentFormData);
          }
        }
      };

      // Trigger initial fetches for all top-level dependent fields
      ['country', 'native_country', 'job_country', 'pref_countries', 'pref_job_countries'].forEach(parentField => {
        fetchInitialDependent(parentField, formData);
      });
    }
  }, [customer, loading, loadingDropdowns, formData, fetchDependentData, fieldConfig]);


  // Handle input changes (for single-select dropdowns)
  const handleInputChange = useCallback((fieldName, value) => {
    setFormData(prev => {
      const newFormData = { ...prev, [fieldName]: value };

      // Define dependent fields for clearing
      const dependentFieldsMap = {
        country: ['state', 'district', 'city'],
        state: ['district', 'city'],
        district: ['city'],
        native_country: ['native_state', 'native_district', 'native_city'],
        native_state: ['native_district', 'native_city'],
        native_district: ['native_city'],
        job_country: ['job_state', 'job_district', 'job_city'],
        job_state: ['job_district', 'job_city'],
        job_district: ['job_city'],
      };

      // Clear dependent fields and their dropdown options
      const dependentsToClear = dependentFieldsMap[fieldName];
      if (dependentsToClear) {
        setDropdownData(prevDropdown => {
          const newDropdownData = { ...prevDropdown };
          dependentsToClear.forEach(depField => {
            newFormData[depField] = null; // Clear dependent field value
            const depEndpoint = fieldConfig.location.fields[depField]?.endpoint || fieldConfig.career.fields[depField]?.endpoint || fieldConfig.preferences.fields[depField]?.endpoint;
            if (depEndpoint) {
              newDropdownData[depEndpoint] = []; // Clear dependent dropdown options
            }
          });
          return newDropdownData;
        });
      }

      return newFormData;
    });

    // Clear errors for the changed field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Fetch new dependent data if a value is selected
    const sectionKeys = Object.keys(fieldConfig);
    let fieldConfigEntry = null;
    let currentSectionKey = null;
    for (const key of sectionKeys) {
      if (fieldConfig[key].fields[fieldName]) {
        fieldConfigEntry = fieldConfig[key].fields[fieldName];
        currentSectionKey = key;
        break;
      }
    }

    // If it's a dependent field and a value is selected, fetch its children
    if (fieldConfigEntry && fieldConfigEntry.dependsOn && value && value !== '') {
      let childFieldName = '';
      let childEndpoint = '';

      if (fieldName.includes('country')) {
        childFieldName = fieldName.replace('country', 'state');
        childEndpoint = 'state';
      } else if (fieldName.includes('state')) {
        childFieldName = fieldName.replace('state', 'district');
        childEndpoint = 'district';
      } else if (fieldName.includes('district')) {
        childFieldName = fieldName.replace('district', 'city');
        childEndpoint = 'city';
      }

      if (childFieldName && childEndpoint) {
        fetchDependentData(childEndpoint, value, childFieldName, false);
      }
    }
  }, [errors, fieldConfig, fetchDependentData]);

  // Handle multiselect changes
  const handleMultiselectChange = useCallback((fieldName, optionId) => {
    setFormData(prev => {
      const currentValues = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      const newValues = currentValues.includes(optionId)
        ? currentValues.filter(id => id !== optionId)
        : [...currentValues, optionId];
      
      const newFormData = {
        ...prev,
        [fieldName]: newValues.length > 0 ? newValues : [],
      };

      // Define dependent fields for clearing
      const dependentFieldsMap = {
        pref_countries: ['pref_states', 'pref_districts', 'pref_cities'],
        pref_states: ['pref_districts', 'pref_cities'],
        pref_districts: ['pref_cities'],
        pref_job_countries: ['pref_job_states', 'pref_job_cities'],
        pref_job_states: ['pref_job_cities'],
      };

      // Clear dependent fields and their dropdown options
      const dependentsToClear = dependentFieldsMap[fieldName];
      if (dependentsToClear) {
        setDropdownData(prevDropdown => {
          const newDropdownData = { ...prevDropdown };
          dependentsToClear.forEach(depField => {
            newFormData[depField] = []; // Clear dependent multiselect field value
            const depEndpoint = fieldConfig.preferences.fields[depField]?.endpoint;
            if (depEndpoint) {
              newDropdownData[depEndpoint] = []; // Clear dependent dropdown options
            }
          });
          return newDropdownData;
        });
      }

      return newFormData;
    });

    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Fetch new dependent data for multiselect
    const sectionKeys = Object.keys(fieldConfig);
    let fieldConfigEntry = null;
    let currentSectionKey = null;
    for (const key of sectionKeys) {
      if (fieldConfig[key].fields[fieldName]) {
        fieldConfigEntry = fieldConfig[key].fields[fieldName];
        currentSectionKey = key;
        break;
      }
    }

    if (fieldConfigEntry && fieldConfigEntry.dependsOn) {
      setFormData(prevFormData => {
        const updatedValues = Array.isArray(prevFormData[fieldName]) ? prevFormData[fieldName] : [];
        
        let childFieldName = '';
        let childEndpoint = '';
        if (fieldName.includes('countries')) {
          childFieldName = fieldName.replace('countries', 'states');
          childEndpoint = 'state';
        } else if (fieldName.includes('states')) {
          childFieldName = fieldName.replace('states', 'districts');
          childEndpoint = 'district';
        } else if (fieldName.includes('districts')) {
          childFieldName = fieldName.replace('districts', 'cities');
          childEndpoint = 'city';
        } else if (fieldName.includes('job_countries')) {
          childFieldName = fieldName.replace('job_countries', 'job_states');
          childEndpoint = 'state';
        } else if (fieldName.includes('job_states')) {
          childFieldName = fieldName.replace('job_states', 'job_cities');
          childEndpoint = 'city';
        }

        if (childFieldName && childEndpoint) {
          // Clear the specific child dropdown options before fetching new ones
          setDropdownData(prev => ({
            ...prev,
            [childEndpoint]: [],
          }));
          if (updatedValues.length > 0) {
            updatedValues.forEach(id => {
              fetchDependentData(childEndpoint, id, childFieldName, true); // Pass true for isMultiSelect
            });
          }
        }
        return prevFormData; // Return previous state as we only triggered side effects
      });
    }
  }, [errors, fieldConfig, fetchDependentData]);


  // Handle file upload
  const handleFileUpload = useCallback((fieldName, file) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: file || null,
    }));
  }, []);

  // Validate required fields
  const validateRequiredFields = useCallback((sectionKey = null) => {
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
  }, [formData, fieldConfig]);

  // Get changed fields
  const getChangedFields = useCallback((sectionKey) => {
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
  }, [formData, originalFormData, fieldConfig]);

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
        if (Object.keys(submitData).length === 0) {
          setSaving(false);
          setEditingSection(null);
          setIsEditingAll(false);
          toast.info('No changes to save');
          return;
        }
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
      if (hasFileChanges || fileFields.some(f => Object.keys(submitData).includes(f))) {
        const formDataObj = new FormData();
        Object.keys(submitData).forEach(key => {
          const value = submitData[key];
          if (value !== null && value !== undefined && value !== '') {
            if (key === 'assigned_employee' && value?.user_id) {
              formDataObj.append(key, value.user_id);
            } else if (multiselectFields.includes(key) && Array.isArray(value)) {
              // Append each item in array separately for Django ListField
              value.forEach(item => formDataObj.append(`${key}[]`, item)); // Use [] for array
            } else if (fileFields.includes(key) && value instanceof File) {
              formDataObj.append(key, value);
            } else if (fileFields.includes(key) && value === null) {
              formDataObj.append(key, ''); // Explicitly send empty string for clearing files
            } else {
              formDataObj.append(key, value);
            }
          }
        });
        response = await apiMethod(`/customer/${user_id}/`, formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // If no file changes, ensure no file-related fields are sent in JSON payload
        const jsonSubmitData = { ...submitData };
        fileFields.forEach(key => {
          if (jsonSubmitData.hasOwnProperty(key)) {
            delete jsonSubmitData[key];
          }
        });
        response = await apiMethod(`/customer/${user_id}/`, jsonSubmitData, {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 200 || response.status === 201) {
        // Re-fetch customer details to ensure fresh data and proper state sync after save
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
  }, [formData, originalFormData, user_id, fetchCustomerDetails, dropdownData, fieldConfig, excludeFields, validateRequiredFields, getChangedFields]);

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
  const handleCancel = useCallback(() => {
    setFormData(originalFormData); // Revert to original data
    setErrors({});
    setIsEditingAll(false);
    setEditingSection(null);

    // Re-initialize dependent dropdowns based on original data
    const dependentFieldMap = {
      country: ['state', 'district', 'city'],
      native_country: ['native_state', 'native_district', 'native_city'],
      job_country: ['job_state', 'job_district', 'job_city'],
      state: ['district', 'city'],
      native_state: ['native_district', 'native_city'],
      job_state: ['job_district', 'job_city'],
      district: ['city'],
      native_district: ['native_city'],
      job_district: ['job_city'],
      pref_countries: ['pref_states', 'pref_districts', 'pref_cities'],
      pref_states: ['pref_districts', 'pref_cities'],
      pref_districts: ['pref_cities'],
      pref_job_countries: ['pref_job_states', 'pref_job_cities'],
      pref_job_states: ['pref_job_cities'],
    };

    const reFetchDependent = (parentFieldName, currentData) => {
      const parentValue = currentData[parentFieldName];
      const childrenFields = dependentFieldMap[parentFieldName];

      if (parentValue && childrenFields && childrenFields.length > 0) {
        const isMultiSelect = fieldConfig.preferences.fields[parentFieldName]?.type === 'multiselect';
        const childFieldName = childrenFields[0];
        const childEndpoint = fieldConfig.location.fields[childFieldName]?.endpoint || fieldConfig.career.fields[childFieldName]?.endpoint || fieldConfig.preferences.fields[childFieldName]?.endpoint;

        if (childEndpoint) {
          if (isMultiSelect && Array.isArray(parentValue)) {
            parentValue.forEach(id => fetchDependentData(childEndpoint, id, childFieldName, true));
          } else if (!isMultiSelect) {
            fetchDependentData(childEndpoint, parentValue, childFieldName, false);
          }
        }
        if (currentData[childFieldName]) {
          reFetchDependent(childFieldName, currentData);
        }
      } else if (childrenFields) { // Clear children if parent is cleared
        setDropdownData(prev => {
          const newDropdownData = { ...prev };
          childrenFields.forEach(childField => {
            const childEndpoint = fieldConfig.location.fields[childField]?.endpoint || fieldConfig.career.fields[childField]?.endpoint || fieldConfig.preferences.fields[childField]?.endpoint;
            if (childEndpoint) {
              newDropdownData[childEndpoint] = [];
            }
          });
          return newDropdownData;
        });
      }
    };

    // Trigger re-initialization for all top-level dependent fields
    ['country', 'native_country', 'job_country', 'pref_countries', 'pref_job_countries'].forEach(parentField => {
      reFetchDependent(parentField, originalFormData);
    });

  }, [originalFormData, fetchDependentData, fieldConfig]);

  // Handle Edit Section
  const handleEditSection = useCallback((sectionKey) => {
    setEditingSection(sectionKey);
    setIsEditingAll(false);
  }, []);

  // Get Option Name - Memoized
  const getOptionName = useCallback((endpoint, id, fieldName) => {
    let options = dropdownData[endpoint] || [];
    // Special handling for dependent dropdowns
    if (fieldName.includes('state') && endpoint === 'state') {
      options = dropdownData.state || [];
    } else if (fieldName.includes('district') && endpoint === 'district') {
      options = dropdownData.district || [];
    } else if (fieldName.includes('city') && endpoint === 'city') {
      options = dropdownData.city || [];
    }

    if (!id || !options) return 'Not provided';

    if (Array.isArray(id)) {
      return id.map(singleId => {
        const option = options.find(item => item.id === singleId);
        return option ? (['height', 'preferred_height_from', 'preferred_height_to'].includes(fieldName) ? option.height : option.name) : 'Not provided';
      }).join(', ');
    } else {
      const option = options.find(item => item.id === id);
      return option ? (['height', 'preferred_height_from', 'preferred_height_to'].includes(fieldName) ? option.height : option.name) : 'Not provided';
    }
  }, [dropdownData]);

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
      setShowPrivacyModal(false); // Close modal after agreeing and "loading"
    }, 1000); // Simulate 1-second loading for faster UX
  }, [sensitiveDataType]);

  // Handle Privacy Modal Close
  const handlePrivacyModalClose = useCallback(() => {
    setShowPrivacyModal(false);
    setSensitiveDataType(null);
    setIsLoadingSensitiveData(false);
  }, []);

  // Render Field - Optimized and refined
  const renderField = useCallback((fieldName, fieldConfigItem, sectionKey) => {
    const value = formData[fieldName];
    const displayValue = customer?.[fieldName];
    const hasError = errors[fieldName];
    const isEditing = isEditingAll || editingSection === sectionKey;
    const isSensitive = fieldConfigItem.sensitive;

    const inputClasses = `w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;
    const displayClasses = `px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 whitespace-normal break-words min-h-[34px] flex items-center`;
    const labelClasses = `block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1`;
    const errorClasses = `text-xs text-red-600 flex items-center gap-1 mt-0.5`;

    if (isSensitive && !isEditing) {
      return (
        <div className="space-y-0.5">
          <label className={labelClasses}>
            {fieldConfigItem.label}
            {fieldConfigItem.required && <span className="text-red-500 ml-0.5">*</span>}
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
              <IconAlertCircle size={12} />
              {Array.isArray(hasError) ? hasError.join(', ') : hasError}
            </p>
          )}
        </div>
      );
    }

    let options = dropdownData[fieldConfigItem.endpoint] || [];
    // Dynamic options for dependent dropdowns
    if (fieldConfigItem.dependsOn) {
      // Determine the correct endpoint for the dependent dropdown based on fieldName
      let dependentEndpoint = '';
      if (fieldName.includes('state')) {
        dependentEndpoint = 'state';
      } else if (fieldName.includes('district')) {
        dependentEndpoint = 'district';
      } else if (fieldName.includes('city')) {
        dependentEndpoint = 'city';
      }
      options = dropdownData[dependentEndpoint] || [];
    }

    const isLoading = loadingDependentData[fieldName]; // Check loading for this specific field
    const isDisabled = !isEditing || isLoading || (fieldConfigItem.dependsOn && (!formData[fieldConfigItem.dependsOn] || (Array.isArray(formData[fieldConfigItem.dependsOn]) && formData[fieldConfigItem.dependsOn].length === 0)));

    switch (fieldConfigItem.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
      case 'time':
        return (
          <div className="space-y-0.5">
            <label className={labelClasses}>
              {fieldConfigItem.label}
              {fieldConfigItem.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {isEditing ? (
              <input
                type={fieldConfigItem.type}
                value={value || ''}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                step={fieldConfigItem.step}
                className={inputClasses}
                placeholder={`Enter ${fieldConfigItem.label.toLowerCase()}`}
              />
            ) : (
              <div className={`${displayClasses} ${fieldConfigItem.type === 'email' || fieldConfigItem.type === 'url' ? 'truncate' : ''}`}>
                {displayValue || 'Not provided'}
              </div>
            )}
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={12} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'url':
        return (
          <div className="space-y-0.5">
            <label className={labelClasses}>
              {fieldConfigItem.label}
              {fieldConfigItem.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={value || ''}
                  onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  className={inputClasses}
                  placeholder={`Enter ${fieldConfigItem.label.toLowerCase()}`}
                />
                <button
                  onClick={() => {
                    if (value) {
                      window.open(value, '_blank');
                    } else {
                      toast.info('Please enter a URL first.');
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-xs font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm transform hover:scale-105"
                  disabled={!value}
                >
                  <IconExternalLink size={14} />
                  Open
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
                    className="flex items-center gap-0.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    <IconExternalLink size={14} />
                  </button>
                )}
              </div>
            )}
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={12} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-0.5">
            <label className={labelClasses}>
              {fieldConfigItem.label}
            </label>
            {isEditing ? (
              <textarea
                value={value || ''}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                rows={3}
                className={`${inputClasses} resize-y`}
                placeholder={`Enter ${fieldConfigItem.label.toLowerCase()}`}
              />
            ) : (
              <div className={`${displayClasses} min-h-[50px] whitespace-pre-wrap`}>
                {displayValue || 'Not provided'}
              </div>
            )}
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={12} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleInputChange(fieldName, e.target.checked)}
                disabled={!isEditing}
                className="w-3.5 h-3.5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {fieldConfigItem.label}
              </span>
            </label>
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={12} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'select':
        const isHeightField = ['height', 'preferred_height_from', 'preferred_height_to'].includes(fieldName);
        const selectedOption = options.find(option => option.id === (value || displayValue));
        
        return (
          <div className="space-y-0.5">
            <label className={labelClasses}>
              {fieldConfigItem.label}
              {fieldConfigItem.required && <span className="text-red-500 ml-0.5">*</span>}
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
                  <option value="">
                    {isLoading ? 'Loading...' : `Select ${fieldConfigItem.label}`}
                  </option>
                  {!isLoading && options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {isHeightField ? option.height : option.name}
                    </option>
                  ))}
                </select>
                {isLoading && (
                  <IconLoader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={16} />
                )}
                <IconChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>
            ) : (
              <div className={displayClasses}>
                {getOptionName(fieldConfigItem.endpoint, displayValue, fieldName)}
              </div>
            )}
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={12} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'multiselect':
        const multiselectOptions = options;
        const selectedValues = Array.isArray(value) ? value : [];
        
        return (
          <div className="space-y-0.5">
            <label className={labelClasses}>
              {fieldConfigItem.label}
            </label>
            {isEditing ? (
              <div className={`space-y-0.5 max-h-36 overflow-y-auto border border-gray-300 rounded-md p-1.5 bg-white dark:bg-gray-700 dark:border-gray-600 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <IconLoader2 className="animate-spin text-gray-400 mr-2" size={16} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading options...</span>
                  </div>
                ) : multiselectOptions.length > 0 ? (
                  multiselectOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option.id)}
                        onChange={() => handleMultiselectChange(fieldName, option.id)}
                        className="w-3.5 h-3.5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500"
                        disabled={isDisabled}
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{option.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2 text-center">No options available</p>
                )}
              </div>
            ) : (
              <div className={`${displayClasses} min-h-[50px]`}>
                {selectedValues.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedValues.map(id => (
                      <span key={id} className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-200">
                        {getOptionName(fieldConfigItem.endpoint, id, fieldName)}
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
                <IconAlertCircle size={12} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      case 'image':
        const imageUrl = displayValue ? `${BASE_MEDIA_URL}${displayValue}` : '';
        return (
          <div className="space-y-0.5">
            <label className={labelClasses}>
              {fieldConfigItem.label}
            </label>
            <div className="space-y-1.5">
              {imageUrl && (
                <div className="relative w-24 h-24">
                  <img
                    src={imageUrl}
                    alt={fieldConfigItem.label}
                    className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x400/cccccc/000000?text=Image+Not+Found';
                      e.target.onerror = null;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setZoomedImage(imageUrl)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full hover:bg-black/70 transition-colors text-xs"
                    title="View Full Image"
                  >
                    <IconEye size={14} />
                  </button>
                </div>
              )}
              {isEditing && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(fieldName, e.target.files[0])}
                    className="hidden"
                    id={`file-${fieldName}`}
                  />
                  <label
                    htmlFor={`file-${fieldName}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-md cursor-pointer text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors shadow-sm"
                  >
                    <IconUpload size={14} />
                    Upload
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => handleFileUpload(fieldName, null)}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-red-300 rounded-md text-red-600 text-xs font-medium hover:bg-red-50 dark:border-red-600 dark:hover:bg-red-900/20 dark:text-red-400 transition-colors shadow-sm"
                      title="Clear Image"
                    >
                      <IconX size={14} />
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
            {hasError && (
              <p className={errorClasses}>
                <IconAlertCircle size={12} />
                {Array.isArray(hasError) ? hasError.join(', ') : hasError}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [formData, customer, errors, isEditingAll, editingSection, hasAgreedToPrivacy, dropdownData, loadingDependentData, handleInputChange, handleMultiselectChange, handleFileUpload, handleViewSensitiveData, getOptionName, setZoomedImage]);


  if (loading || loadingDropdowns) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div>
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Customer Details Sections Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries(fieldConfig).map(([sectionKey, sectionConfig]) => (
            <SkeletonSection key={sectionKey} title={sectionConfig.title} />
          ))}
        </div>

        {/* Assigned Employee Info Skeleton */}
        <div className="mt-5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse h-8 w-8"></div>
            <div className="flex-grow">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          </div>
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
            onClick={() => navigate('/dashboard/employee/all-customers')}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6 selection:bg-indigo-600 selection:text-white">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <button
              onClick={() => navigate('/dashboard/employee/all-customers')}
              className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm font-medium transition-colors"
            >
              <IconArrowLeft size={16} />
              Back to Customers
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim()}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">ID: {customer.user_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${customer.account_status ? 'bg-green-500 animate-pulse-slow' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {customer.account_status ? 'Online' : 'Offline'}
              </span>
            </div>
            {!isEditingAll && !editingSection ? (
              <button
                onClick={() => setIsEditingAll(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-3 py-1.5 rounded-md font-medium hover:from-indigo-700 hover:to-purple-800 transition-colors shadow-sm transform hover:scale-105 text-sm"
              >
                <IconEdit size={16} />
                Edit All
              </button>
            ) : isEditingAll ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 bg-gray-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-gray-700 transition-colors shadow-sm text-sm"
                >
                  <IconX size={16} />
                  Cancel
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1.5 rounded-md font-medium hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 shadow-sm transform hover:scale-105"
                >
                  {saving ? <IconLoader2 className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
                  {saving ? 'Saving...' : 'Save All'}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Main Content Area: Navigation and Sections */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Navigation Sidebar */}
          <nav className="w-full lg:w-64 p-0 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-wrap lg:flex-col gap-2 lg:gap-1.5">
            {Object.entries(fieldConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors
                  ${activeTab === key
                    ? 'bg-indigo-500 text-white shadow-md hover:bg-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
              >
                <config.icon size={18} />
                {config.title}
              </button>
            ))}
          </nav>

          {/* Dynamic Section Content */}
          <div className="flex-grow">
            <Suspense fallback={<SkeletonSection title={fieldConfig[activeTab].title} />}>
              {React.createElement(sectionComponents[activeTab], {
                fieldConfig: fieldConfig, // Pass the entire fieldConfig
                formData: formData,
                customer: customer,
                errors: errors,
                isEditingAll: isEditingAll,
                editingSection: editingSection,
                handleEditSection: handleEditSection,
                handleCancel: handleCancel,
                handleSave: handleSave,
                renderField: renderField,
                saving: saving,
              })}
            </Suspense>
          </div>
        </div>

        {/* Assigned Employee Info */}
        <div className="mt-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-full">
              <IconUser className="text-indigo-600 dark:text-indigo-400" size={20} />
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
            <div className="ml-auto flex gap-1.5">
              {isAssigned ? (
                <button
                  onClick={handleDeassign}
                  disabled={isAssigning}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-md text-xs font-medium hover:from-red-600 hover:to-rose-700 transition-colors disabled:opacity-50 shadow-sm transform hover:scale-105"
                >
                  {isAssigning ? <IconLoader2 className="animate-spin" size={14} /> : <IconUserMinus size={14} />}
                  {isAssigning ? 'Deassigning...' : 'Deassign'}
                </button>
              ) : (
                <button
                  onClick={handleAssign}
                  disabled={isAssigning}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md text-xs font-medium hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 shadow-sm transform hover:scale-105"
                >
                  {isAssigning ? <IconLoader2 className="animate-spin" size={14} /> : <IconUserPlus size={14} />}
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
          dataType={sensitiveDataType}
          isLoading={isLoadingSensitiveData}
          employeeName={employeeName}
          employeeId={employeeId}
        />
      </div>

      {/* Inline Styles with dropdown fix */}
      <style>{`
        @keyframes modalSlideDown {
          0% { opacity: 0; transform: translateY(-20px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-slide-down {
          animation: modalSlideDown 0.25s ease-out forwards;
        }
        @keyframes cardEnter {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-card-enter {
          opacity: 0;
          transform: translateY(10px);
          animation: cardEnter 0.3s ease-out forwards;
        }
        .animate-card-enter:nth-child(1) { animation-delay: 0s; }
        .animate-card-enter:nth-child(2) { animation-delay: 0.05s; }
        .animate-card-enter:nth-child(3) { animation-delay: 0.1s; }
        .animate-card-enter:nth-child(4) { animation-delay: 0.15s; }
        .animate-card-enter:nth-child(5) { animation-delay: 0.2s; }
        .animate-card-enter:nth-child(6) { animation-delay: 0.25s; }
        .animate-card-enter:nth-child(7) { animation-delay: 0.3s; }
        .animate-card-enter:nth-child(8) { animation-delay: 0.35s; }
        .animate-card-enter:nth-child(9) { animation-delay: 0.4s; }
        .animate-card-enter:nth-child(10) { animation-delay: 0.45s; }
        
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
        /* New Skeleton Animation */
        @keyframes pulse {
          0%, 100% {
            background-color: #e5e7eb; /* gray-200 */
          }
          50% {
            background-color: #d1d5db; /* gray-300 */
          }
        }
        .dark .animate-pulse {
          animation-name: pulse-dark;
        }
        @keyframes pulse-dark {
          0%, 100% {
            background-color: #374151; /* gray-700 */
          }
          50% {
            background-color: #4b5563; /* gray-600 */
          }
        }
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default ECustomerDetails;
