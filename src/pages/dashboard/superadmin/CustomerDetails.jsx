import React, { useEffect, useState, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconEdit, IconDeviceFloppy, IconX, IconArrowLeft, IconUser, IconMail,
  IconPhone, IconCalendar, IconMapPin, IconBriefcase, IconHeart,
  IconCurrencyRupee, IconHome, IconUsers, IconStar, IconCamera,
  IconFileText, IconAlertCircle, IconCheck, IconLoader, IconChevronDown,
  IconUpload, IconEye, IconNotes,
} from '@tabler/icons-react';
import { getData, patchData, putData, postData } from '../../../store/httpservice';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import FollowUpNotes from './FollowUpNotes';

// In a real app, move these configs to a separate file e.g. `customerDetails.config.js`
const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL;


const endpoints = [
  'profile-for', 'gender', 'height', 'body_type', 'complexion', 'physical_status',
  'marital_status', 'eating_habits', 'package_name', 'employment_type', 'education',
  'occupation', 'job_country', 'job_state', 'job_city', 'annualsalary', 'raasi',
  'star_sign', 'padam', 'dosham', 'religion', 'caste', 'mother_tongue', 'citizenship',
  'visa_type', 'family_values', 'family_type', 'family_status', 'fathers_status',
  'mothers_status', 'own_house', 'payment_status', 'payment_method',
  'payment_admin_approval', 'agreement_status', 'admin_agreement_approval',
  'settlement_status', 'settlement_type', 'settlement_admin_approval', 'country',
  'state', 'district', 'city', 'visa_country', 'employees',
];

const fieldConfig = {
    personal: {
      title: 'Personal Information',
      icon: IconUser,
      fields: {
        first_name: { type: 'text', label: 'First Name', required: true },
        middle_name: { type: 'text', label: 'Middle Name' },
        surname: { type: 'text', label: 'Surname', required: true },
        email: { type: 'email', label: 'Email', required: true },
        mobile_number: { type: 'tel', label: 'Mobile Number', required: true },
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
        job_country: { type: 'select', label: 'Job Country', endpoint: 'job_country' },
        job_state: { type: 'select', label: 'Job State', endpoint: 'job_state' },
        job_city: { type: 'select', label: 'Job City', endpoint: 'job_city' },
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
        visa_country: { type: 'select', label: 'Visa Country', endpoint: 'visa_country' },
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
        google_map_location: { type: 'text', label: 'Google Map Location' },
        family_google_map: { type: 'url', label: 'Family Google Map' },
        native_country: { type: 'select', label: 'Native Country', endpoint: 'country' },
        native_state: { type: 'select', label: 'Native State', endpoint: 'state' },
        native_district: { type: 'select', label: 'Native District', endpoint: 'district' },
        native_city: { type: 'select', label: 'Native City', endpoint: 'city' },
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
        pref_states: { type: 'multiselect', label: 'Preferred States', endpoint: 'state' },
        pref_districts: { type: 'multiselect', label: 'Preferred Districts', endpoint: 'district' },
        pref_cities: { type: 'multiselect', label: 'Preferred Cities', endpoint: 'city' },
        pref_job_countries: { type: 'multiselect', label: 'Preferred Job Countries', endpoint: 'country' },
        pref_job_states: { type: 'multiselect', label: 'Preferred Job States', endpoint: 'state' },
        pref_job_cities: { type: 'multiselect', label: 'Preferred Job Cities', endpoint: 'city' },
        pref_citizenship_countries: { type: 'multiselect', label: 'Preferred Citizenship Countries', endpoint: 'citizenship' },
        pref_visa_countries: { type: 'multiselect', label: 'Preferred Visa Countries', endpoint: 'visa_country' },
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
    followup_notes: {
      title: 'Follow-up Notes',
      icon: IconNotes,
      fields: {},
    },
};

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

// Helper function to get a display name for a dropdown ID
const getOptionName = (endpoint, id, dropdownData) => {
  if (!id || !dropdownData[endpoint]) return 'N/A';
  if (Array.isArray(id)) {
    return id.map(itemId => {
      const option = dropdownData[endpoint].find(item => item.id === itemId);
      return option ? option.name : 'N/A';
    }).join(', ');
  }
  const option = dropdownData[endpoint].find(item => item.id === id);
  return option ? option.name : 'N/A';
};

// Memoized Form Field to prevent re-renders on every input change in other fields
const FormField = memo(({ fieldName, config, value, displayValue, isEditing, error, onChange, onFileChange, onMultiselectChange, dropdownData }) => {
  const commonInputClasses = "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100";
  const errorBorder = "border-red-500";
  const normalBorder = "border-gray-300";

  const renderInput = () => {
    switch (config.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
      case 'number':
      case 'date':
      case 'time':
        return isEditing ? (
          <input
            type={config.type}
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            step={config.step}
            className={`${commonInputClasses} ${error ? errorBorder : normalBorder}`}
            placeholder={`Enter ${config.label.toLowerCase()}`}
          />
        ) : (
          <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 min-h-[44px] flex items-center">
            {displayValue || 'Not provided'}
          </div>
        );

      case 'textarea':
        return isEditing ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            rows={3}
            className={`${commonInputClasses} ${error ? errorBorder : normalBorder}`}
            placeholder={`Enter ${config.label.toLowerCase()}`}
          />
        ) : (
          <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px] dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
            {displayValue || 'Not provided'}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer py-2.5">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(fieldName, e.target.checked)}
              disabled={!isEditing}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
            />
            <span className="text-base font-medium text-gray-700 dark:text-gray-300">{config.label}</span>
          </label>
        );

      case 'select':
        const options = dropdownData[config.endpoint] || [];
        return isEditing ? (
          <div className="relative">
            <select
              value={value || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              className={`${commonInputClasses} appearance-none bg-white ${error ? errorBorder : normalBorder}`}
            >
              <option value="">Select {config.label}</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            <IconChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        ) : (
          <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 min-h-[44px] flex items-center">
            {getOptionName(config.endpoint, displayValue, dropdownData)}
          </div>
        );

      case 'multiselect':
        const multiOptions = dropdownData[config.endpoint] || [];
        const selectedValues = Array.isArray(value) ? value : [];
        return isEditing ? (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white dark:bg-gray-700 dark:border-gray-600">
            {multiOptions.map((option) => (
              <label key={option.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.id)}
                  onChange={() => onMultiselectChange(fieldName, option.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:checked:bg-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-600">
            {selectedValues.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedValues.map(id => (
                  <span key={id} className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium dark:bg-blue-900 dark:text-blue-200">
                    {getOptionName(config.endpoint, id, dropdownData)}
                  </span>
                ))}
              </div>
            ) : <span className="text-gray-500">None selected</span>}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {displayValue && (
              <div className="relative w-32 h-32">
                <img
                  src={`${BASE_URL}${displayValue}`}
                  alt={config.label}
                  className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/128x128/e0e0e0/808080?text=Image+Error`;
                    e.target.alt = "Image not available";
                  }}
                />
                <button
                  type="button"
                  onClick={() => window.open(`${BASE_URL}${displayValue}`, '_blank')}
                  className="absolute top-1 right-1 bg-black bg-opacity-60 text-white p-1.5 rounded-full hover:bg-opacity-80 transition-colors"
                  title="View Full Image"
                >
                  <IconEye size={18} />
                </button>
              </div>
            )}
            {isEditing && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileChange(fieldName, e.target.files[0])}
                  className="hidden"
                  id={`file-${fieldName}`}
                />
                <label htmlFor={`file-${fieldName}`} className="flex items-center gap-2 px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40">
                  <IconUpload size={18} />
                  <span className="text-sm font-medium">Upload {config.label}</span>
                </label>
                {displayValue && (
                  <button type="button" onClick={() => onFileChange(fieldName, null)} className="flex items-center gap-2 px-4 py-2 border border-red-300 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors dark:border-red-600 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40" title="Clear Image">
                    <IconX size={18} />
                    <span className="text-sm font-medium">Clear</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-1">
      {config.type !== 'checkbox' && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.label}
          {config.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
          <IconAlertCircle size={16} />
          {Array.isArray(error) ? error.join(', ') : error}
        </p>
      )}
    </div>
  );
});

// A section component for each category of customer details
const CustomerSection = ({ sectionKey, sectionConfig, isEditing, onEdit, onSave, onCancel, saving, children }) => {
  const IconComponent = sectionConfig.icon;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <IconComponent className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{sectionConfig.title}</h2>
        </div>
        {!isEditing ? (
          <button onClick={() => onEdit(sectionKey)} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm">
            <IconEdit size={16} />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors shadow-sm">
              <IconX size={16} />
              Cancel
            </button>
            <button onClick={() => onSave(sectionKey)} disabled={saving} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              {saving ? <IconLoader className="animate-spin" size={16} /> : <IconDeviceFloppy size={16} />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const AssignEmployeeModal = ({ isOpen, onClose, employees, onAssign, assignLoading, currentEmployee }) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {currentEmployee ? 'Change Employee' : 'Assign Employee'}
        </h2>
        <div className="relative mb-4">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="">Select an employee</option>
            {employees.map((employee) => (
              <option key={employee.user_id} value={employee.user_id}>
                {employee.full_name} ({employee.user_id})
              </option>
            ))}
          </select>
          <IconChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors">
            Cancel
          </button>
          <button onClick={() => onAssign(selectedEmployee)} disabled={assignLoading || !selectedEmployee} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {assignLoading && <IconLoader className="animate-spin" size={16} />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const PageLoader = ({ text }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <IconLoader className="mx-auto animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-gray-600 dark:text-gray-400 font-medium">{text}</p>
    </div>
  </div>
);

const NotFound = ({ onBack }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <IconAlertCircle className="mx-auto text-red-600 mb-4" size={48} />
      <p className="text-gray-600 dark:text-gray-400 font-medium">Customer not found or an error occurred.</p>
      <button onClick={onBack} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
        Back to Customers
      </button>
    </div>
  </div>
);


const CustomerDetails = () => {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

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
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Data Fetching and State Initialization
  // For larger apps, consider moving data fetching logic to custom hooks (e.g., useCustomerDetails, useDropdownData)
  const fetchCustomerDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getData(`/customer/${user_id}/`);
      const cleanedData = { ...response.data };
      excludeFields.forEach(field => delete cleanedData[field]);
      setCustomer(response.data);
      setFormData(cleanedData);
      setOriginalFormData(cleanedData);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Failed to load customer details');
      if (error.response?.status === 404) navigate('/dashboard/superadmin/customers');
    } finally {
      setLoading(false);
    }
  }, [user_id, navigate]);

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
      const dropdownMap = results.reduce((acc, { endpoint, data }) => ({ ...acc, [endpoint]: data }), {});
      setDropdownData(dropdownMap);
      setEmployees(dropdownMap['employees'] || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown options');
    } finally {
      setLoadingDropdowns(false);
    }
  }, []);

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

  // Form Handlers
  const handleInputChange = useCallback((fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, [errors]);

  const handleMultiselectChange = useCallback((fieldName, optionId) => {
    setFormData(prev => {
      const currentValues = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      const newValues = currentValues.includes(optionId)
        ? currentValues.filter(id => id !== optionId)
        : [...currentValues, optionId];
      return { ...prev, [fieldName]: newValues.length > 0 ? newValues : null };
    });
  }, []);

  const handleFileUpload = useCallback((fieldName, file) => {
    setFormData(prev => ({ ...prev, [fieldName]: file || null }));
  }, []);

  // Edit State Handlers
  const handleEditSection = useCallback((sectionKey) => {
    setEditingSection(sectionKey);
    setIsEditingAll(false);
  }, []);

  const handleCancel = useCallback(() => {
    setFormData(originalFormData);
    setErrors({});
    setIsEditingAll(false);
    setEditingSection(null);
    toast.info('Changes cancelled.');
  }, [originalFormData]);

  // Save Handler
  const handleSave = useCallback(async (sectionKey = null) => {
    const sectionsToValidate = sectionKey ? [sectionKey] : Object.keys(fieldConfig);
    const newErrors = {};
    sectionsToValidate.forEach(key => {
      if (key === 'followup_notes') return;
      Object.entries(fieldConfig[key].fields).forEach(([fieldName, config]) => {
        if (config.required && (!formData[fieldName] || formData[fieldName] === '')) {
          newErrors[fieldName] = `${config.label} is required`;
        }
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const getChangedFields = (key) => {
        const changedData = {};
        const sectionFields = Object.keys(fieldConfig[key].fields);
        sectionFields.forEach(field => {
          const originalValue = originalFormData[field];
          const newValue = formData[field];
          if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
            changedData[field] = newValue;
          }
        });
        return changedData;
      };

      const isPatch = !!sectionKey;
      const submitData = isPatch ? getChangedFields(sectionKey) : { ...formData };

      if (isPatch && Object.keys(submitData).length === 0) {
        toast.info('No changes to save.');
        setEditingSection(null);
        setIsEditingAll(false);
        setSaving(false);
        return;
      }

      const fileFields = Object.values(fieldConfig).flatMap(s => Object.entries(s.fields).filter(([, c]) => c.type === 'image').map(([f]) => f));
      const hasFiles = Object.keys(submitData).some(key => fileFields.includes(key) && submitData[key] instanceof File);

      let response;
      const apiMethod = isPatch ? patchData : putData;

      if (hasFiles) {
        const formDataObj = new FormData();
        Object.entries(submitData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              formDataObj.append(key, JSON.stringify(value));
            } else {
              formDataObj.append(key, value);
            }
          }
        });
        response = await apiMethod(`/customer/${user_id}/`, formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        if (!isPatch) {
            fileFields.forEach(key => delete submitData[key]);
        }
        response = await apiMethod(`/customer/${user_id}/`, submitData);
      }

      if (response.status === 200 || response.status === 201) {
        await fetchCustomerDetails();
        setIsEditingAll(false);
        setEditingSection(null);
        toast.success(`Customer ${sectionKey || 'details'} updated successfully!`);
      } else {
        toast.error(`Failed to update: Unexpected response`);
      }
    } catch (error) {
      const apiErrors = error.response?.data || {};
      setErrors(apiErrors);
      const errorMessage = Object.values(apiErrors).flat().join(', ') || error.message || 'Unknown error';
      toast.error(`Failed to update: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }, [formData, originalFormData, user_id, fetchCustomerDetails]);

  // Employee Assignment
  const handleAssignEmployee = async (selectedEmployeeId) => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    setAssignLoading(true);
    try {
      const payload = { employee_user_id: selectedEmployeeId, customer_user_id: user_id };
      await postData('assign/customer-to-employee/', payload);
      toast.success('Assigned successfully');
      await fetchCustomerDetails();
      setAssignModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign employee');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading || loadingDropdowns) {
    return <PageLoader text="Loading customer details and options..." />;
  }

  if (!customer) {
    return <NotFound onBack={() => navigate('/dashboard/superadmin/customers')} />;
  }

  const isEditingAny = isEditingAll || editingSection !== null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8 font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors">
              <IconArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {customer.full_name || 'Customer Profile'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">ID: {customer.user_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${customer.account_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} dark:bg-opacity-20`}>
              <div className={`w-2.5 h-2.5 rounded-full ${customer.account_status ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{customer.account_status ? 'Online' : 'Offline'}</span>
            </div>
            {!isEditingAny && (
              <button onClick={() => setIsEditingAll(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md">
                <IconEdit size={18} />
                Edit All Details
              </button>
            )}
            {isEditingAll && (
              <div className="flex items-center gap-2">
                <button onClick={handleCancel} className="flex items-center gap-2 bg-gray-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition-colors shadow-md">
                  <IconX size={18} />
                  Cancel
                </button>
                <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                  {saving ? <IconLoader className="animate-spin" size={18} /> : <IconDeviceFloppy size={18} />}
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Customer Details Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {Object.entries(fieldConfig).map(([sectionKey, config]) => {
            if (sectionKey === 'followup_notes') {
              return (
                <div key={sectionKey} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 xl:col-span-2">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg"><config.icon className="text-blue-600 dark:text-blue-400" size={24} /></div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{config.title}</h2>
                  </div>
                  <div className="p-6"><FollowUpNotes customerUserId={user_id} /></div>
                </div>
              );
            }
            return (
              <CustomerSection
                key={sectionKey}
                sectionKey={sectionKey}
                sectionConfig={config}
                isEditing={isEditingAll || editingSection === sectionKey}
                onEdit={handleEditSection}
                onSave={handleSave}
                onCancel={handleCancel}
                saving={saving && (isEditingAll || editingSection === sectionKey)}
              >
                {Object.entries(config.fields).map(([fieldName, fieldConf]) => (
                  <div key={fieldName} className={fieldConf.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <FormField
                      fieldName={fieldName}
                      config={fieldConf}
                      value={formData[fieldName]}
                      displayValue={customer[fieldName]}
                      isEditing={isEditingAll || editingSection === sectionKey}
                      error={errors[fieldName]}
                      onChange={handleInputChange}
                      onFileChange={handleFileUpload}
                      onMultiselectChange={handleMultiselectChange}
                      dropdownData={dropdownData}
                    />
                  </div>
                ))}
              </CustomerSection>
            );
          })}
        </div>

        {/* Employee Assignment Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full"><IconUser className="text-blue-600 dark:text-blue-400" size={24} /></div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Assigned Employee</h3>
                {customer.assigned_employee ? (
                  <>
                    <p className="text-blue-700 dark:text-blue-300 font-medium">{customer.assigned_employee.full_name}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">ID: {customer.assigned_employee.user_id}</p>
                  </>
                ) : <p className="text-blue-700 dark:text-blue-300 font-medium">No employee assigned</p>}
              </div>
            </div>
            <button onClick={() => setAssignModalOpen(true)} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm">
              <IconEdit size={16} />
              {customer.assigned_employee ? 'Change Employee' : 'Assign Employee'}
            </button>
          </div>
        </div>

        <AssignEmployeeModal
          isOpen={isAssignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          employees={employees}
          onAssign={handleAssignEmployee}
          assignLoading={assignLoading}
          currentEmployee={customer.assigned_employee}
        />
      </div>
    </div>
  );
};

export default CustomerDetails;