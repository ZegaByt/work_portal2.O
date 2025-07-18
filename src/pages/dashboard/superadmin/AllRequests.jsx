import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { IconUserPlus, IconX, IconSearch, IconEdit, IconDeviceFloppy, IconLoader, IconChevronDown, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { getData, postData, patchData } from '../../../store/httpService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

// Define a list of vibrant, "glassy" color pairs for avatars
const AVATAR_COLOR_PALETTE = [
    ['bg-red-500', 'text-red-50'], ['bg-pink-500', 'text-pink-50'], ['bg-purple-500', 'text-purple-50'],
    ['bg-indigo-500', 'text-indigo-50'], ['bg-blue-500', 'text-blue-50'], ['bg-cyan-500', 'text-cyan-50'],
    ['bg-teal-500', 'text-teal-50'], ['bg-green-500', 'text-green-50'], ['bg-lime-500', 'text-lime-900'],
    ['bg-yellow-500', 'text-yellow-900'], ['bg-amber-500', 'text-amber-900'], ['bg-orange-500', 'text-orange-50'],
    ['bg-fuchsia-500', 'text-fuchsia-50'], ['bg-emerald-500', 'text-emerald-50'], ['bg-sky-500', 'text-sky-50'],
];

const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL

function AllRequests() {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [genders, setGenders] = useState([]);
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomerData, setSelectedCustomerData] = useState(null);
    const [isEditingPayment, setIsEditingPayment] = useState(false);
    const [isEditingAgreement, setIsEditingAgreement] = useState(false);
    const [isEditingSettlement, setIsEditingSettlement] = useState(false);
    const [saveError, setSaveError] = useState({ payment: null, agreement: null, settlement: null });
    const [saveSuccessMessage, setSaveSuccessMessage] = useState({ payment: null, agreement: null, settlement: null });
    const [formErrors, setFormErrors] = useState({});
    const [assignLoading, setAssignLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const [authError, setAuthError] = useState(null);

    const [formData, setFormData] = useState({
        first_name: '',
        surname: '',
        email: '',
        mobile_number: '',
        password: '',
        confirm_password: '',
        employee_user_id: '',
        gender: '',
    });
    const [addCustomerErrors, setAddCustomerErrors] = useState({});

    const navigate = useNavigate();

    // --- Authentication Check ---
    useEffect(() => {
        try {
            const userCookie = Cookies.get('user');
            if (!userCookie) {
                setAuthError('Please log in. User session not found.');
                setLoading(false);
                return;
            }
            const parsedUser = JSON.parse(userCookie);
            if (parsedUser.id) {
                setUserId(parsedUser.id);
            } else {
                setAuthError('Invalid user session. User ID not found in cookie.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Cookie Parse Error:', error);
            setAuthError('Failed to load user session. Please clear cookies and log in again.');
            setLoading(false);
        }
    }, []);

    // --- Data Fetching Logic ---
    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const response = await getData('/customers/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (Array.isArray(response.data)) {
                setCustomers(response.data);
                toast.success('Customers loaded successfully!', { duration: 3000 });
            } else {
                console.error('Unexpected customers API response format:', response.data);
                setCustomers([]);
                toast.error('Invalid customers data structure');
            }
        } catch (error) {
            console.error('Error fetching customers:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            let errorMessage = error.message || 'Failed to load customers.';
            if (error.response?.status === 401) {
                errorMessage = 'Unauthorized access. Please log in again.';
                setAuthError(errorMessage);
            } else if (error.response?.status === 404) {
                errorMessage = 'Customers endpoint not found. Please verify the API configuration.';
            }
            toast.error(errorMessage, { duration: 5000 });
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const response = await getData('/employees/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (Array.isArray(response.data)) {
                setEmployees(response.data);
            } else {
                console.error('Unexpected employees API response format:', response.data);
                setEmployees([]);
                toast.error('Invalid employees data structure');
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error(error.response?.data?.detail || 'Failed to load employees');
        }
    }, []);

    const fetchGenders = useCallback(async () => {
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const response = await getData('/gender/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data && Array.isArray(response.data.results)) {
                setGenders(response.data.results);
            } else {
                console.error('Unexpected gender API response format:', response.data);
                setGenders([]);
                toast.error('Invalid genders data structure');
            }
        } catch (error) {
            console.error('Error fetching genders:', error);
            toast.error(error.response?.data?.detail || 'Failed to load genders');
        }
    }, []);

    const fetchDropdownOptions = useCallback(async () => {
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const [paymentStatusRes, paymentMethodRes, adminApprovalRes, packageNameRes, agreementStatusRes, settlementStatusRes, settlementTypeRes, settlementAdminApprovalRes] = await Promise.all([
                getData('/payment_status/', { headers: { Authorization: `Bearer ${token}` } }),
                getData('/payment_method/', { headers: { Authorization: `Bearer ${token}` } }),
                getData('/payment_admin_approval/', { headers: { Authorization: `Bearer ${token}` } }),
                getData('/package_name/', { headers: { Authorization: `Bearer ${token}` } }),
                getData('/agreement_status/', { headers: { Authorization: `Bearer ${token}` } }),
                getData('/settlement_status/', { headers: { Authorization: `Bearer ${token}` } }),
                getData('/settlement_type/', { headers: { Authorization: `Bearer ${token}` } }),
                getData('/settlement_admin_approval/', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            setDropdownOptions({
                payment_status: Array.isArray(paymentStatusRes.data.results) ? paymentStatusRes.data.results : [],
                payment_method: Array.isArray(paymentMethodRes.data.results) ? paymentMethodRes.data.results : [],
                payment_admin_approval: Array.isArray(adminApprovalRes.data.results) ? adminApprovalRes.data.results : [],
                package_name: Array.isArray(packageNameRes.data.results) ? packageNameRes.data.results : [],
                agreement_status: Array.isArray(agreementStatusRes.data.results) ? agreementStatusRes.data.results : [],
                settlement_status: Array.isArray(settlementStatusRes.data.results) ? settlementStatusRes.data.results : [],
                settlement_type: Array.isArray(settlementTypeRes.data.results) ? settlementTypeRes.data.results : [],
                settlement_admin_approval: Array.isArray(settlementAdminApprovalRes.data.results) ? settlementAdminApprovalRes.data.results : [],
            });
        } catch (error) {
            console.error('Error fetching dropdown options:', error);
            toast.error(error.response?.data?.detail || 'Failed to load dropdown options');
            setDropdownOptions({});
        }
    }, []);

    useEffect(() => {
        if (userId) {
            fetchCustomers();
            fetchEmployees();
            fetchGenders();
            fetchDropdownOptions();
        }
    }, [userId, fetchCustomers, fetchEmployees, fetchGenders, fetchDropdownOptions]);

    // --- Filtering and Search ---
    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const newFilteredCustomers = customers.filter(customer => {
            const displayFullName = customer.full_name || (customer.first_name && customer.surname ? `${customer.first_name} ${customer.surname}` : '');
            const fullName = displayFullName.toLowerCase();
            const userId = String(customer.user_id || '').toLowerCase();
            const genderName = formatGender(customer.gender, genders).toLowerCase();
            const paymentStatusName = getDisplayValue('payment_status', customer.payment_status, dropdownOptions.payment_status).toLowerCase();
            const paymentMethodName = getDisplayValue('payment_method', customer.payment_method, dropdownOptions.payment_method).toLowerCase();
            const adminApprovalStatusName = getDisplayValue('payment_admin_approval', customer.payment_admin_approval, dropdownOptions.payment_admin_approval).toLowerCase();
            const employeeId = customer.assigned_employee
                ? (typeof customer.assigned_employee === 'object' ? customer.assigned_employee.user_id : customer.assigned_employee).toLowerCase()
                : '';

            return fullName.includes(lowerCaseQuery) ||
                userId.includes(lowerCaseQuery) ||
                genderName.includes(lowerCaseQuery) ||
                paymentStatusName.includes(lowerCaseQuery) ||
                paymentMethodName.includes(lowerCaseQuery) ||
                adminApprovalStatusName.includes(lowerCaseQuery) ||
                employeeId.includes(lowerCaseQuery);
        });
        setFilteredCustomers(newFilteredCustomers);
    }, [customers, searchQuery, genders, dropdownOptions]);

    // --- Add Customer Modal Handling ---
    const handleAddCustomerInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        setAddCustomerErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setAddCustomerErrors({});

        if (formData.password !== formData.confirm_password) {
            setAddCustomerErrors({ confirm_password: 'Passwords do not match' });
            toast.error('Passwords do not match');
            return;
        }

        const submitData = {
            first_name: formData.first_name,
            surname: formData.surname,
            email: formData.email,
            mobile_number: formData.mobile_number,
            password: formData.password,
            confirm_password: formData.confirm_password,
            employee_user_id: formData.employee_user_id,
            gender: formData.gender,
        };

        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            await postData('/customer/create/', submitData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setIsModalOpen(false);
            setFormData({
                first_name: '', surname: '', email: '', mobile_number: '',
                password: '', confirm_password: '', employee_user_id: '', gender: '',
            });
            fetchCustomers();
            toast.success('Customer added successfully');
        } catch (error) {
            console.error('Error adding customer:', error);
            const errDetail = error.response?.data || {};
            let errorMessage = error.response?.data?.detail || 'Failed to add customer';
            if (error.response?.status === 401) {
                errorMessage = 'Unauthorized access. Please log in again.';
                setAuthError(errorMessage);
            } else if (error.response?.status === 404) {
                errorMessage = 'Customer creation endpoint not found. Please verify the API configuration.';
            }
            if (errDetail.detail) {
                setAddCustomerErrors({ general: errDetail.detail });
                toast.error(errDetail.detail);
            } else {
                setAddCustomerErrors(errDetail);
                toast.error(Object.values(errDetail).flat().join(', ') || errorMessage);
            }
        }
    };

    // --- Selected Customer Edit Form Handling ---
    const handleSelectedCustomerChange = (fieldName, value) => {
        setSelectedCustomerData(prev => ({
            ...prev,
            [fieldName]: value
        }));
        setFormErrors(prev => ({ ...prev, [fieldName]: null }));
        setSaveError(prev => ({ ...prev, payment: null, agreement: null, settlement: null }));
        setSaveSuccessMessage(prev => ({ ...prev, payment: null, agreement: null, settlement: null }));
    };

    const handleFileUpload = useCallback((fieldName, file) => {
        setSelectedCustomerData(prev => ({ ...prev, [fieldName]: file || null }));
        setFormErrors(prev => ({ ...prev, [fieldName]: null }));
    }, []);

    const handleSave = async (e, section) => {
        e.preventDefault();
        if (!selectedCustomerData || !selectedCustomerData.user_id) {
            setSaveError(prev => ({ ...prev, [section]: 'No customer selected for saving or User ID is missing.' }));
            toast.error('No customer selected');
            return;
        }

        // Define required fields for each section
        const requiredFields = {
            payment: {
                payment_status: 'Payment Status',
                payment_method: 'Payment Method',
                payment_admin_approval: 'Payment Admin Approval',
            },
            agreement: {
                agreement_status: 'Agreement Status',
                admin_agreement_approval: 'Admin Agreement Approval',
            },
            settlement: {
                settlement_status: 'Settlement Status',
                settlement_type: 'Settlement Type',
                settlement_admin_approval: 'Settlement Admin Approval',
            },
        };

        // Validate required fields for the specific section
        const newErrors = {};
        Object.entries(requiredFields[section]).forEach(([key, label]) => {
            if (!selectedCustomerData[key]) {
                newErrors[key] = `${label} is required`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(prev => ({ ...prev, ...newErrors }));
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setSaveError(prev => ({ ...prev, [section]: null }));
        setSaveSuccessMessage(prev => ({ ...prev, [section]: null }));

        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const originalCustomer = customers.find(c => c.user_id === selectedCustomerData.user_id);
            const changedData = {};
            const sectionFields = {
                payment: paymentFields,
                agreement: agreementFields,
                settlement: settlementFields,
            }[section];

            sectionFields.forEach(field => {
                if (JSON.stringify(selectedCustomerData[field]) !== JSON.stringify(originalCustomer[field])) {
                    changedData[field] = selectedCustomerData[field];
                }
            });

            if (Object.keys(changedData).length === 0) {
                toast.info('No changes to save');
                setIsEditingPayment(false);
                setIsEditingAgreement(false);
                setIsEditingSettlement(false);
                setLoading(false);
                return;
            }

            const fileFields = ['payment_receipt', 'agreement_file', 'settlement_receipt'];
            const hasFiles = Object.keys(changedData).some(key => fileFields.includes(key) && changedData[key] instanceof File);

            let response;
            if (hasFiles) {
                const formDataObj = new FormData();
                Object.entries(changedData).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formDataObj.append(key, value);
                    }
                });
                response = await patchData(`/customer/${selectedCustomerData.user_id}/`, formDataObj, {
                    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
                });
            } else {
                response = await patchData(`/customer/${selectedCustomerData.user_id}/`, changedData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            if (response.status === 200 || response.status === 201) {
                await fetchCustomers();
                if (section === 'payment') setIsEditingPayment(false);
                if (section === 'agreement') setIsEditingAgreement(false);
                if (section === 'settlement') setIsEditingSettlement(false);
                setSaveSuccessMessage(prev => ({ ...prev, [section]: 'Details saved successfully!' }));
                toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} details updated successfully`);
            } else {
                throw new Error('Unexpected response status');
            }
        } catch (err) {
            console.error(`Error saving ${section} details:`, err);
            let errorMessage = err.response?.data?.detail || `Failed to save ${section} details`;
            if (err.response?.status === 401) {
                errorMessage = 'Unauthorized access. Please log in again.';
                setAuthError(errorMessage);
            } else if (err.response?.status === 404) {
                errorMessage = 'Customer endpoint not found. Please verify the API configuration.';
            }
            const errData = err.response?.data || {};
            if (errData.detail) {
                setSaveError(prev => ({ ...prev, [section]: `Failed to save: ${errData.detail}` }));
                toast.error(errData.detail);
            } else {
                const formattedErrors = Object.keys(errData).map(key => `${key}: ${errData[key].join(', ')}`).join('; ');
                setSaveError(prev => ({ ...prev, [section]: `Failed to save: ${formattedErrors || err.message || 'Unknown error'}` }));
                toast.error(formattedErrors || err.message || `Failed to save ${section} details`);
                setFormErrors(errData);
            }
            setSaveSuccessMessage(prev => ({ ...prev, [section]: null }));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (section) => {
        if (selectedCustomerData) {
            const originalCustomer = customers.find(c => c.user_id === selectedCustomerData.user_id);
            if (originalCustomer) {
                setSelectedCustomerData(originalCustomer);
            }
        }
        if (section === 'payment') setIsEditingPayment(false);
        if (section === 'agreement') setIsEditingAgreement(false);
        if (section === 'settlement') setIsEditingSettlement(false);
        setSaveError(prev => ({ ...prev, [section]: null }));
        setSaveSuccessMessage(prev => ({ ...prev, [section]: null }));
        setFormErrors({});
        toast.info(`${section.charAt(0).toUpperCase() + section.slice(1)} changes cancelled`);
    };

    // --- Employee Assignment ---
    const handleAssignEmployee = async (selectedEmployeeId) => {
        if (!selectedEmployeeId) {
            toast.error('Please select an employee');
            return;
        }
        setAssignLoading(true);
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const payload = { employee_user_id: selectedEmployeeId, customer_user_id: selectedCustomerData.user_id };
            await postData('assign/customer-to-employee/', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Employee assigned successfully');
            await fetchCustomers();
            setIsAssignModalOpen(false);
        } catch (error) {
            console.error('Error assigning employee:', error);
            let errorMessage = error.response?.data?.detail || 'Failed to assign employee';
            if (error.response?.status === 401) {
                errorMessage = 'Unauthorized access. Please log in again.';
                setAuthError(errorMessage);
            } else if (error.response?.status === 404) {
                errorMessage = 'Employee assignment endpoint not found. Please verify the API configuration.';
            }
            toast.error(errorMessage);
        } finally {
            setAssignLoading(false);
        }
    };

    // --- Helper Functions ---
    const getInitials = (customer) => {
        if (customer.full_name && customer.full_name.trim() !== '') {
            const parts = customer.full_name.trim().split(' ');
            if (parts.length > 1) {
                return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
            } else if (parts.length === 1 && parts[0].length > 0) {
                return parts[0].charAt(0).toUpperCase();
            }
        }
        const firstInitial = customer.first_name ? customer.first_name.charAt(0).toUpperCase() : '';
        const lastInitial = customer.surname ? customer.surname.charAt(0).toUpperCase() : '';
        return `${firstInitial}${lastInitial}` || '??';
    };

    const formatGender = (genderId, genderOptions) => {
        const gender = genderOptions.find(g => g.id === genderId);
        return gender ? gender.name : 'N/A';
    };

    const getDisplayValue = useCallback((fieldKey, value, optionsArray) => {
        if (!optionsArray || !Array.isArray(optionsArray)) {
            if (fieldKey === 'assigned_employee') {
                if (typeof value === 'object' && value !== null && value.user_id) {
                    return value.user_id;
                }
                return value || 'N/A';
            }
            if (['payment_receipt', 'agreement_file', 'settlement_receipt'].includes(fieldKey)) {
                return value || null;
            }
            return value === null || value === undefined || value === '' ? 'N/A' : String(value);
        }
        if (fieldKey === 'assigned_employee') {
            if (typeof value === 'object' && value !== null && value.full_name) {
                return `${value.full_name} (${value.user_id})`;
            }
            return value || 'N/A';
        }
        if (['profile_highlighter', 'account_status', 'profile_verified'].includes(fieldKey)) {
            return value ? 'Yes' : 'No';
        }
        const match = optionsArray.find(opt => String(opt.id ?? opt.pk ?? opt.value) === String(value));
        return match ? (match.name ?? match.label ?? match.display ?? String(match.value)) : (value === null || value === undefined || value === '' ? 'N/A' : String(value));
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
    }, [customers]);

    const FormField = useCallback(({ label, name, value, type, onChange, onFileChange, disabled, options, error }) => {
        const commonClasses = 'w-full bg-neutral-50 border border-gray-200 rounded-md px-3 py-1.5 text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
        const errorBorder = 'border-red-500';
        const labelClasses = 'font-semibold text-gray-900 mb-1 block capitalize text-xs';

        if (type === 'select') {
            const currentOptions = options || [];
            if (disabled) {
                return (
                    <div>
                        <label htmlFor={name} className={labelClasses}>
                            {label}
                        </label>
                        <input
                            type="text"
                            value={getDisplayValue(name, value, currentOptions)}
                            disabled
                            className={`${commonClasses} bg-neutral-100 cursor-not-allowed ${error ? errorBorder : ''}`}
                        />
                        {error && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><IconAlertCircle size={14} />{error}</p>}
                    </div>
                );
            }
            return (
                <div className="relative">
                    <label htmlFor={name} className={labelClasses}>
                        {label}
                    </label>
                    <select
                        id={name}
                        name={name}
                        value={value === null || value === undefined || value === '' ? '' : value}
                        onChange={(e) => onChange(name, e.target.value)}
                        disabled={disabled}
                        className={`${commonClasses} appearance-none ${error ? errorBorder : ''}`}
                    >
                        <option value="">Select {label}</option>
                        {currentOptions.map((option) => (
                            <option
                                key={option.id ?? option.pk ?? option.value}
                                value={option.id ?? option.pk ?? option.value}
                            >
                                {option.name ?? option.label ?? option.display ?? String(option.value)}
                            </option>
                        ))}
                    </select>
                    <IconChevronDown className="absolute right-3 top-1/2 translate-y-1/4 text-gray-400 pointer-events-none" size={18} />
                    {error && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><IconAlertCircle size={14} />{error}</p>}
                </div>
            );
        }

        if (type === 'checkbox') {
            return (
                <div className="flex items-center space-x-2 mt-4">
                    <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={!!value}
                        onChange={(e) => onChange(name, e.target.checked)}
                        disabled={disabled}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={name} className={`${labelClasses} !mb-0 select-none text-sm`}>
                        {label}
                    </label>
                    {error && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><IconAlertCircle size={14} />{error}</p>}
                </div>
            );
        }

        if (type === 'image') {
            return (
                <div className="space-y-2">
                    <label className={labelClasses}>{label}</label>
                    {value && (
                        <div className="relative w-32 h-32">
                            <img
                                src={value instanceof File ? URL.createObjectURL(value) : `${BASE_URL}${value}`}
                                alt={label}
                                className="w-full h-full object-cover rounded-lg border border-gray-300"
                                onError={(e) => {
                                    e.target.src = 'https://placehold.co/128x128/e0e0e0/808080?text=Image+Error';
                                    e.target.alt = 'Image not available';
                                }}
                            />
                        </div>
                    )}
                    {!disabled && (
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => onFileChange(name, e.target.files[0])}
                                className="hidden"
                                id={`file-${name}`}
                            />
                            <label
                                htmlFor={`file-${name}`}
                                className="flex items-center gap-2 px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-md cursor-pointer hover:bg-blue-100 text-sm"
                            >
                                Upload {label}
                            </label>
                            {value && (
                                <button
                                    type="button"
                                    onClick={() => onFileChange(name, null)}
                                    className="flex items-center gap-2 px-3 py-1.5 border border-red-300 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-sm"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    )}
                    {error && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><IconAlertCircle size={14} />{error}</p>}
                </div>
            );
        }

        return (
            <div>
                <label htmlFor={name} className={labelClasses}>
                    {label}
                </label>
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={type === 'date' && value ? value.split('T')[0] : (value === null || value === undefined ? '' : value)}
                    onChange={(e) => onChange(name, e.target.value)}
                    disabled={disabled}
                    step={type === 'number' ? '0.01' : undefined}
                    className={`${commonClasses} ${disabled ? 'bg-neutral-100 cursor-not-allowed' : ''} ${error ? errorBorder : ''}`}
                />
                {error && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><IconAlertCircle size={14} />{error}</p>}
            </div>
        );
    }, [getDisplayValue]);

    const paymentFields = [
        'package_name', 'package_expiry', 'profile_highlighter', 'account_status', 'profile_verified',
        'payment_status', 'payment_method', 'payment_amount', 'payment_date', 'payment_receipt',
        'payment_admin_approval', 'bank_name', 'account_holder_name',
    ];
    const agreementFields = ['agreement_status', 'agreement_file', 'admin_agreement_approval'];
    const settlementFields = [
        'settlement_status', 'settlement_by', 'settlement_amount',
        'settlement_type', 'settlement_date', 'settlement_receipt', 'settlement_admin_approval',
    ];

    const dateKeys = new Set(['package_expiry', 'payment_date', 'settlement_date']);
    const checkboxKeys = new Set(['profile_highlighter', 'account_status', 'profile_verified']);
    const dropdownKeys = new Set([
        'payment_status', 'payment_method', 'payment_admin_approval', 'package_name',
        'agreement_status', 'settlement_status', 'settlement_type', 'settlement_admin_approval',
    ]);
    const fileKeys = new Set(['payment_receipt', 'agreement_file', 'settlement_receipt']);
    const numberKeys = new Set(['payment_amount', 'settlement_amount']);

    const getInputFieldType = useCallback((key) => {
        if (dateKeys.has(key)) return 'date';
        if (checkboxKeys.has(key)) return 'checkbox';
        if (dropdownKeys.has(key)) return 'select';
        if (fileKeys.has(key)) return 'image';
        if (numberKeys.has(key)) return 'number';
        return 'text';
    }, []);

    const AssignEmployeeModal = ({ isOpen, onClose, employees, onAssign, assignLoading, currentEmployee }) => {
        const [selectedEmployee, setSelectedEmployee] = useState('');

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {currentEmployee ? 'Change Employee' : 'Assign Employee'}
                    </h2>
                    <div className="relative mb-4">
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
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
                        <button
                            onClick={() => onAssign(selectedEmployee)}
                            disabled={assignLoading || !selectedEmployee}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {assignLoading && <IconLoader className="animate-spin" size={16} />}
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Authentication Error UI
    if (!userId && !loading && authError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white rounded-lg p-6 shadow-lg max-w-md text-center">
                    <p className="text-red-600 font-semibold text-lg mb-2">Authentication Error</p>
                    <p className="text-red-500">{authError}</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="p-0 sm:p-0 bg-gray-50 min-h-screen selection:bg-indigo-600 selection:text-white">
            <div className="max-w-6xl mx-auto">
                {/* Header and Search */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 mt-2 px-4 sm:px-0 gap-4 sm:gap-0">
                    <h2 className="text-[1.5rem] font-bold tracking-tight text-gray-900 leading-tight">
                        All Requests
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-gray-800"
                            />
                            <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl px-6 py-3 text-base font-semibold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto"
                        >
                            <IconUserPlus size={22} />
                            Add Customer
                        </button>
                    </div>
                </div>

                {/* Customers Table */}
                {loading && !customers.length ? (
                    <div className="flex justify-center items-center h-60">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 bg-white mx-4 sm:mx-0">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Employee ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agreement Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settlement Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer.user_id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="radio"
                                                    name="selectedCustomerRadio"
                                                    value={customer.user_id}
                                                    checked={selectedCustomerData && selectedCustomerData.user_id === customer.user_id}
                                                    onChange={() => {
                                                        setSelectedCustomerData({ ...customer });
                                                        setIsEditingPayment(false);
                                                        setIsEditingAgreement(false);
                                                        setIsEditingSettlement(false);
                                                        setSaveError({ payment: null, agreement: null, settlement: null });
                                                        setSaveSuccessMessage({ payment: null, agreement: null, settlement: null });
                                                        setFormErrors({});
                                                    }}
                                                    className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${customerColors[customer.user_id]?.[0] || 'bg-gray-400'} ${customerColors[customer.user_id]?.[1] || 'text-gray-900'}`}>
                                                        {getInitials(customer)}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {customer.full_name || `${customer.first_name} ${customer.surname}`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">{customer.user_id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">
                                                    {customer.assigned_employee
                                                        ? (typeof customer.assigned_employee === 'object' ? customer.assigned_employee.user_id : customer.assigned_employee)
                                                        : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDisplayValue('payment_status', customer.payment_status, dropdownOptions.payment_status) === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                                    {getDisplayValue('payment_status', customer.payment_status, dropdownOptions.payment_status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {getDisplayValue('agreement_status', customer.agreement_status, dropdownOptions.agreement_status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {getDisplayValue('settlement_status', customer.settlement_status, dropdownOptions.settlement_status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/dashboard/superadmin/customer/${customer.user_id}`);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    View Profile
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                            No customers found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Payment, Agreement, and Settlement Sections */}
                {selectedCustomerData ? (
                    <div className="space-y-8 mt-10 mx-4 sm:mx-0">
                        {/* Payment Section */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-fadein">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        Payment Details for: <span className="text-indigo-600">{selectedCustomerData.full_name || `${selectedCustomerData.first_name} ${selectedCustomerData.surname}`}</span>
                                    </h3>
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Assigned Employee: {selectedCustomerData.assigned_employee
                                                ? (typeof selectedCustomerData.assigned_employee === 'object'
                                                    ? `${selectedCustomerData.assigned_employee.full_name} (${selectedCustomerData.assigned_employee.user_id})`
                                                    : selectedCustomerData.assigned_employee)
                                                : 'N/A'}
                                        </p>
                                        <button
                                            onClick={() => setIsAssignModalOpen(true)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 flex items-center gap-1"
                                        >
                                            <IconEdit size={16} />
                                            {selectedCustomerData.assigned_employee ? 'Change Employee' : 'Assign Employee'}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEditingPayment) handleCancel('payment');
                                            else setIsEditingPayment(true);
                                        }}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm font-medium shadow-sm"
                                    >
                                        {isEditingPayment ? 'Cancel' : 'Edit Payment'}
                                    </button>
                                    {isEditingPayment && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleSave(e, 'payment')}
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition text-sm shadow-md flex items-center gap-2"
                                        >
                                            {loading ? <IconLoader className="animate-spin" size={16} /> : <IconCheck size={16} />}
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {saveError.payment && <p className="text-red-500 text-sm mb-4">{saveError.payment}</p>}
                            {saveSuccessMessage.payment && <p className="text-green-600 text-sm mb-4">{saveSuccessMessage.payment}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                {paymentFields.map((key) => {
                                    const labelText = key.replace(/_/g, ' ');
                                    const inputType = getInputFieldType(key);
                                    const valueToPass = selectedCustomerData[key];
                                    const optionsForField = dropdownOptions[key];

                                    return (
                                        <FormField
                                            key={key}
                                            label={labelText}
                                            name={key}
                                            value={valueToPass}
                                            type={inputType}
                                            onChange={handleSelectedCustomerChange}
                                            onFileChange={handleFileUpload}
                                            disabled={!isEditingPayment}
                                            options={optionsForField}
                                            error={formErrors[key]}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Agreement Section */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-fadein">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">
                                    Agreement Details for: <span className="text-indigo-600">{selectedCustomerData.full_name || `${selectedCustomerData.first_name} ${selectedCustomerData.surname}`}</span>
                                </h3>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEditingAgreement) handleCancel('agreement');
                                            else setIsEditingAgreement(true);
                                        }}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm font-medium shadow-sm"
                                    >
                                        {isEditingAgreement ? 'Cancel' : 'Edit Agreement'}
                                    </button>
                                    {isEditingAgreement && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleSave(e, 'agreement')}
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition text-sm shadow-md flex items-center gap-2"
                                        >
                                            {loading ? <IconLoader className="animate-spin" size={16} /> : <IconCheck size={16} />}
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {saveError.agreement && <p className="text-red-500 text-sm mb-4">{saveError.agreement}</p>}
                            {saveSuccessMessage.agreement && <p className="text-green-600 text-sm mb-4">{saveSuccessMessage.agreement}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                {agreementFields.map((key) => {
                                    const labelText = key.replace(/_/g, ' ');
                                    const inputType = getInputFieldType(key);
                                    const valueToPass = selectedCustomerData[key];
                                    const optionsForField = dropdownOptions[key];

                                    return (
                                        <FormField
                                            key={key}
                                            label={labelText}
                                            name={key}
                                            value={valueToPass}
                                            type={inputType}
                                            onChange={handleSelectedCustomerChange}
                                            onFileChange={handleFileUpload}
                                            disabled={!isEditingAgreement}
                                            options={optionsForField}
                                            error={formErrors[key]}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Settlement Section */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-fadein">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">
                                    Settlement Details for: <span className="text-indigo-600">{selectedCustomerData.full_name || `${selectedCustomerData.first_name} ${selectedCustomerData.surname}`}</span>
                                </h3>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEditingSettlement) handleCancel('settlement');
                                            else setIsEditingSettlement(true);
                                        }}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm font-medium shadow-sm"
                                    >
                                        {isEditingSettlement ? 'Cancel' : 'Edit Settlement'}
                                    </button>
                                    {isEditingSettlement && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleSave(e, 'settlement')}
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition text-sm shadow-md flex items-center gap-2"
                                        >
                                            {loading ? <IconLoader className="animate-spin" size={16} /> : <IconCheck size={16} />}
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {saveError.settlement && <p className="text-red-500 text-sm mb-4">{saveError.settlement}</p>}
                            {saveSuccessMessage.settlement && <p className="text-green-600 text-sm mb-4">{saveSuccessMessage.settlement}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                {settlementFields.map((key) => {
                                    const labelText = key.replace(/_/g, ' ');
                                    const inputType = getInputFieldType(key);
                                    const valueToPass = selectedCustomerData[key];
                                    const optionsForField = dropdownOptions[key];

                                    return (
                                        <FormField
                                            key={key}
                                            label={labelText}
                                            name={key}
                                            value={valueToPass}
                                            type={inputType}
                                            onChange={handleSelectedCustomerChange}
                                            onFileChange={handleFileUpload}
                                            disabled={!isEditingSettlement}
                                            options={optionsForField}
                                            error={formErrors[key]}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-10 border border-dashed rounded-md p-4 mt-10 mx-4 sm:mx-0">
                        Please select a customer from the table above to view and edit their request details.
                    </div>
                )}

                {/* Add Customer Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-4 transition-opacity duration-300 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-xl p-8 relative shadow-2xl ring-1 ring-gray-900/5 animate-modal-slide-down">
                            <button
                                onClick={() => { setIsModalOpen(false); setAddCustomerErrors({}); }}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors duration-200"
                                aria-label="Close modal"
                            >
                                <IconX size={26} stroke={1.5} />
                            </button>
                            <h3 className="font-extrabold text-3xl mb-8 text-gray-900">
                                Add New Customer
                            </h3>
                            <form
                                onSubmit={handleAddCustomer}
                                className="grid grid-cols-1 gap-y-6"
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck={false}
                            >
                                {addCustomerErrors.general && (
                                    <p className="text-sm text-red-600 mb-2 text-center">{addCustomerErrors.general}</p>
                                )}
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-semibold mb-1 text-gray-700">
                                        First Name
                                    </label>
                                    <input
                                        id="first_name" type="text" name="first_name"
                                        value={formData.first_name} onChange={handleAddCustomerInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                        required
                                    />
                                    {addCustomerErrors.first_name && (
                                        <p className="text-sm text-red-600 mt-1">{addCustomerErrors.first_name}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="surname" className="block text-sm font-semibold mb-1 text-gray-700">
                                        Surname
                                    </label>
                                    <input
                                        id="surname" type="text" name="surname"
                                        value={formData.surname} onChange={handleAddCustomerInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                        required
                                    />
                                    {addCustomerErrors.surname && (
                                        <p className="text-sm text-red-600 mt-1">{addCustomerErrors.surname}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold mb-1 text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        id="email" type="email" name="email"
                                        value={formData.email} onChange={handleAddCustomerInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                        required
                                    />
                                    {addCustomerErrors.email && (
                                        <p className="text-sm text-red-600 mt-1">{addCustomerErrors.email}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="mobile_number" className="block text-sm font-semibold mb-1 text-gray-700">
                                        Mobile Number
                                    </label>
                                    <input
                                        id="mobile_number" type="tel" name="mobile_number"
                                        value={formData.mobile_number} onChange={handleAddCustomerInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                        required
                                    />
                                    {addCustomerErrors.mobile_number && (
                                        <p className="text-sm text-red-600 mt-1">{addCustomerErrors.mobile_number}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="gender" className="block text-sm font-semibold mb-1 text-gray-700">
                                        Gender
                                    </label>
                                    <select
                                        id="gender" name="gender"
                                        value={formData.gender} onChange={handleAddCustomerInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none"
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        {genders.map((genderOption) => (
                                            <option key={genderOption.id} value={genderOption.id}>
                                                {genderOption.name}
                                            </option>
                                        ))}
                                    </select>
                                    {addCustomerErrors.gender && (
                                        <p className="text-sm text-red-600 mt-1">{addCustomerErrors.gender}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold mb-1 text-gray-700">
                                        Password
                                    </label>
                                    <input
                                        id="password" type="password" name="password"
                                        value={formData.password} onChange={handleAddCustomerInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                        required
                                    />
                                    {addCustomerErrors.password && (
                                        <p className="text-sm text-red-600 mt-1">{addCustomerErrors.password}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="confirm_password" className="block text-sm font-semibold mb-1 text-gray-700">
                                        Confirm Password
                                    </label>
                                    <input
                                        id="confirm_password" type="password" name="confirm_password"
                                        value={formData.confirm_password} onChange={handleAddCustomerInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                        required
                                    />
                                    {addCustomerErrors.confirm_password && (
                                        <p className="text-sm text-red-600 mt-1">{addCustomerErrors.confirm_password}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="employee_user_id" className="block text-sm font-semibold mb-1 text-gray-700">
                                        Assign to Employee
                                    </label>
                                    <select
                                        id="employee_user_id" name="employee_user_id"
                                        value={formData.employee_user_id} onChange={handleAddCustomerInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none"
                                        required
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map((employee) => (
                                            <option key={employee.user_id} value={employee.user_id}>
                                                {employee.full_name}
                                            </option>
                                        ))}
                                    </select>
                                    {addCustomerErrors.employee_user_id && (
                                        <p className="text-sm text-red-600 mt-1">{addCustomerErrors.employee_user_id}</p>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                                    >
                                        Add Customer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <AssignEmployeeModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    employees={employees}
                    onAssign={handleAssignEmployee}
                    assignLoading={assignLoading}
                    currentEmployee={selectedCustomerData?.assigned_employee}
                />

                {/* Internal Styles for Animations */}
                <style>{`
                    .animate-fadein {
                        animation: fadein 0.25s cubic-bezier(.4,0,.2,1);
                    }
                    @keyframes fadein {
                        0% { opacity: 0; transform: scale(0.97); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    .animate-modal-slide-down {
                        animation: modalSlideDown 0.3s ease-out forwards;
                    }
                    @keyframes modalSlideDown {
                        0% { opacity: 0; transform: translateY(-20px); }
                        100% { opacity: 1; transform: translateY(0); }
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
}

export default AllRequests;