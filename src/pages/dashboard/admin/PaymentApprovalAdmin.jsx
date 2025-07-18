import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { IconSearch, IconEdit, IconDeviceFloppy, IconLoader, IconChevronDown, IconAlertCircle, IconCheck, IconRefresh, IconX, IconCreditCard } from '@tabler/icons-react';
import { getData, patchData } from '../../../store/httpService';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { useAuth } from '../../../contexts/AuthContext';
import { debounce } from 'lodash';

// Define a list of vibrant, "glassy" color pairs for avatars
const AVATAR_COLOR_PALETTE = [
    ['bg-red-500', 'text-red-50'], ['bg-pink-500', 'text-pink-50'], ['bg-purple-500', 'text-purple-50'],
    ['bg-indigo-500', 'text-indigo-50'], ['bg-blue-500', 'text-blue-50'], ['bg-cyan-500', 'text-cyan-50'],
    ['bg-teal-500', 'text-teal-50'], ['bg-green-500', 'text-green-50'], ['bg-lime-500', 'text-lime-900'],
    ['bg-yellow-500', 'text-yellow-900'], ['bg-amber-500', 'text-amber-900'], ['bg-orange-500', 'text-orange-50'],
    ['bg-fuchsia-500', 'text-fuchsia-50'], ['bg-emerald-500', 'text-emerald-50'], ['bg-sky-500', 'text-sky-50'],
];

const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL;

function PaymentApprovalAdmin() {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomerData, setSelectedCustomerData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const paymentSectionRef = useRef(null);

    const { user } = useAuth();
    const ADMIN_USER_ID = user?.id || 'N/A';
    const ADMIN_API_ENDPOINT = `/admin/${ADMIN_USER_ID}/`;

    // Parse user ID from cookie
    useEffect(() => {
        try {
            const userCookie = Cookies.get('user');
            if (!userCookie) {
                setError('Please log in. User session not found.');
                return;
            }
            const parsedUser = JSON.parse(userCookie);
            if (parsedUser.id) {
                setUserId(parsedUser.id);
            } else {
                setError('Invalid user session. User ID not found in cookie.');
            }
        } catch (error) {
            console.error('Cookie Parse Error:', error);
            setError('Failed to load user session. Please clear cookies and log in again.');
        }
    }, []);

    // Fetch admin's assigned employees
    const fetchEmployees = useCallback(async () => {
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const response = await getData(ADMIN_API_ENDPOINT);
            if (response?.data?.assigned_employees) {
                setEmployees(response.data.assigned_employees);
                toast.success('Assigned employees loaded successfully!', { duration: 3000 });
            } else {
                throw new Error('Invalid employees data structure.');
            }
        } catch (error) {
            console.error('Error fetching employees:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            const errorMessage = error.response?.status === 401
                ? 'Unauthorized access. Please log in again.'
                : error.response?.status === 404
                ? 'Admin endpoint not found.'
                : 'Failed to load assigned employees.';
            setError(errorMessage);
            toast.error(errorMessage, { duration: 5000 });
            setEmployees([]);
        }
    }, [ADMIN_API_ENDPOINT]);

    // Fetch customers and filter by assigned employees
    const fetchCustomers = useCallback(async () => {
        if (employees.length === 0) {
            setCustomers([]);
            setFilteredCustomers([]);
            return;
        }
        try {
            setLoading(true);
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const response = await getData('/customers/');
            let customerData = Array.isArray(response.data) ? response.data : response.data?.results || [];
            if (!Array.isArray(customerData)) {
                throw new Error('Invalid customers data structure.');
            }

            const employeeIds = employees.map(emp => emp.user_id);
            const filtered = customerData
                .filter(customer => employeeIds.includes(
                    typeof customer.assigned_employee === 'object'
                    ? customer.assigned_employee?.user_id
                    : customer.assigned_employee || customer.assigned_employee_id
                ))
                .map(customer => ({
                    ...customer,
                    user_id: customer.user_id || 'N/A',
                    full_name: customer.full_name || `${customer.first_name || ''} ${customer.surname || ''}`.trim() || 'N/A',
                    payment_status: customer.payment_status || 'N/A',
                    payment_method: customer.payment_method || 'N/A',
                    payment_admin_approval: customer.payment_admin_approval || 'N/A',
                    assigned_employee: customer.assigned_employee || customer.assigned_employee_id || 'N/A',
                }));

            setCustomers(filtered);
            setFilteredCustomers(filtered);
            if (filtered.length === 0) {
                toast.info('No customers found for assigned employees.', { duration: 5000 });
            }
        } catch (error) {
            console.error('Error fetching customers:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            const errorMessage = error.response?.status === 401
                ? 'Unauthorized access. Please log in again.'
                : error.response?.status === 404
                ? 'Customers endpoint not found.'
                : 'Failed to load customers.';
            setError(errorMessage);
            toast.error(errorMessage, { duration: 5000 });
            setCustomers([]);
            setFilteredCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [employees]);

    // Fetch dropdown options
    const fetchDropdownOptions = useCallback(async () => {
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const [paymentStatusRes, paymentMethodRes, adminApprovalRes, packageNameRes] = await Promise.all([
                getData('/payment_status/'),
                getData('/payment_method/'),
                getData('/payment_admin_approval/'),
                getData('/package_name/'),
            ]);
            setDropdownOptions({
                payment_status: Array.isArray(paymentStatusRes.data.results) ? paymentStatusRes.data.results : [],
                payment_method: Array.isArray(paymentMethodRes.data.results) ? paymentMethodRes.data.results : [],
                payment_admin_approval: Array.isArray(adminApprovalRes.data.results) ? adminApprovalRes.data.results : [],
                package_name: Array.isArray(packageNameRes.data.results) ? packageNameRes.data.results : [],
            });
        } catch (error) {
            console.error('Error fetching dropdown options:', error);
            toast.error('Failed to load dropdown options', { duration: 5000 });
            setDropdownOptions({});
        }
    }, []);

    // Trigger data fetching
    useEffect(() => {
        if (userId) {
            setLoading(true);
            Promise.all([fetchEmployees(), fetchDropdownOptions()])
                .finally(() => setLoading(false));
        }
    }, [userId, fetchEmployees, fetchDropdownOptions]);

    useEffect(() => {
        if (employees.length > 0) {
            fetchCustomers();
        }
    }, [employees, fetchCustomers]);

    // Helper Functions
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

    const getDisplayValue = (fieldKey, value, optionsArray) => {
        if (!optionsArray || !Array.isArray(optionsArray)) {
            if (fieldKey === 'payment_receipt') {
                return value || null;
            }
            return value === null || value === undefined || value === '' ? 'N/A' : String(value);
        }
        const match = optionsArray.find(opt => String(opt.id ?? opt.pk ?? opt.value) === String(value));
        return match ? (match.name ?? match.label ?? match.display ?? String(match.value)) : (value === null || value === undefined || value === '' ? 'N/A' : String(value));
    };

    // Filtering and Search
    const debouncedSetSearchQuery = useCallback(
        debounce((value) => {
            setSearchQuery(value);
        }, 300),
        []
    );

    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const newFilteredCustomers = customers.filter(customer => {
            const fullName = (customer.full_name || '').toLowerCase();
            const userId = String(customer.user_id || '').toLowerCase();
            const paymentStatusName = getDisplayValue('payment_status', customer.payment_status, dropdownOptions.payment_status).toLowerCase();
            const paymentMethodName = getDisplayValue('payment_method', customer.payment_method, dropdownOptions.payment_method).toLowerCase();
            const adminApprovalStatusName = getDisplayValue('payment_admin_approval', customer.payment_admin_approval, dropdownOptions.payment_admin_approval).toLowerCase();
            return fullName.includes(lowerCaseQuery) ||
                userId.includes(lowerCaseQuery) ||
                paymentStatusName.includes(lowerCaseQuery) ||
                paymentMethodName.includes(lowerCaseQuery) ||
                adminApprovalStatusName.includes(lowerCaseQuery);
        });
        setFilteredCustomers(newFilteredCustomers);
    }, [customers, searchQuery, dropdownOptions]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Handle customer selection with smooth scroll
    const handleCustomerSelect = useCallback((customer) => {
        setSelectedCustomerData({ ...customer });
        setIsEditing(false);
        setSaveError(null);
        setSaveSuccessMessage(null);
        setFormErrors({});
        if (paymentSectionRef.current) {
            paymentSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    // Selected Customer Edit Form Handling
    const handleSelectedCustomerChange = useCallback((fieldName, value) => {
        setSelectedCustomerData(prev => ({
            ...prev,
            [fieldName]: value
        }));
        setFormErrors(prev => ({ ...prev, [fieldName]: null }));
        setSaveError(null);
        setSaveSuccessMessage(null);
    }, []);

    const handleFileUpload = useCallback((fieldName, file) => {
        setSelectedCustomerData(prev => ({ ...prev, [fieldName]: file || null }));
        setFormErrors(prev => ({ ...prev, [fieldName]: null }));
    }, []);

    const handleSave = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isEditing) {
            toast.error('Editing mode not enabled');
            return;
        }
        if (!selectedCustomerData || !selectedCustomerData.user_id) {
            setSaveError('No customer selected for saving or User ID is missing.');
            toast.error('No customer selected');
            return;
        }

        const requiredFields = {
            payment_status: 'Payment Status',
            payment_method: 'Payment Method',
            payment_admin_approval: 'Payment Admin Approval',
        };
        const newErrors = {};
        Object.entries(requiredFields).forEach(([key, label]) => {
            if (!selectedCustomerData[key] && selectedCustomerData[key] !== false) {
                newErrors[key] = `${label} is required`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setSaveError(null);
        setSaveSuccessMessage(null);

        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const originalCustomer = customers.find(c => c.user_id === selectedCustomerData.user_id);
            const changedData = {};
            paymentFields.forEach(field => {
                if (JSON.stringify(selectedCustomerData[field]) !== JSON.stringify(originalCustomer[field])) {
                    changedData[field] = selectedCustomerData[field];
                }
            });

            if (Object.keys(changedData).length === 0) {
                toast.info('No changes to save');
                setIsEditing(false);
                setLoading(false);
                return;
            }

            const fileFields = ['payment_receipt'];
            const hasFiles = Object.keys(changedData).some(key => fileFields.includes(key) && changedData[key] instanceof File);

            let response;
            if (hasFiles) {
                const formDataObj = new FormData();
                Object.entries(changedData).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formDataObj.append(key, value);
                    }
                });
                response = await patchData(`/customer/${selectedCustomerData.user_id}/`, formDataObj);
            } else {
                response = await patchData(`/customer/${selectedCustomerData.user_id}/`, changedData);
            }

            if (response.status === 200 || response.status === 201) {
                await fetchCustomers();
                setIsEditing(false);
                setSaveSuccessMessage('Payment details saved successfully!');
                toast.success('Payment details updated successfully');
            } else {
                throw new Error('Unexpected response status');
            }
        } catch (err) {
            console.error('Error saving payment details:', err);
            let errorMessage = err.response?.data?.detail || 'Failed to save payment details';
            if (err.response?.status === 401) {
                errorMessage = 'Unauthorized access. Please log in again.';
                setError(errorMessage);
            } else if (err.response?.status === 404) {
                errorMessage = 'Customer endpoint not found. Please verify the API configuration.';
            }
            const errData = err.response?.data || {};
            if (errData.detail) {
                setSaveError(`Failed to save: ${errData.detail}`);
                toast.error(errData.detail);
            } else {
                const formattedErrors = Object.keys(errData).map(key => `${key}: ${errData[key].join(', ')}`).join('; ');
                setSaveError(`Failed to save: ${formattedErrors || err.message || 'Unknown error'}`);
                toast.error(formattedErrors || err.message || 'Failed to save payment details');
                setFormErrors(errData);
            }
            setSaveSuccessMessage(null);
        } finally {
            setLoading(false);
        }
    }, [isEditing, selectedCustomerData, customers, fetchCustomers]);

    const handleCancel = useCallback(() => {
        if (selectedCustomerData) {
            const originalCustomer = customers.find(c => c.user_id === selectedCustomerData.user_id);
            if (originalCustomer) {
                setSelectedCustomerData(originalCustomer);
            }
        }
        setIsEditing(false);
        setSaveError(null);
        setSaveSuccessMessage(null);
        setFormErrors({});
        toast.info('Changes cancelled');
    }, [selectedCustomerData, customers]);

    // Refresh Handler
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setLoading(true);
        setSelectedCustomerData(null);
        setSearchQuery('');
        setFormErrors({});
        setSaveError(null);
        setSaveSuccessMessage(null);
        try {
            await Promise.all([fetchEmployees(), fetchCustomers()]);
            toast.info('Data refreshed successfully!');
        } catch (error) {
            toast.error('Failed to refresh data');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [fetchEmployees, fetchCustomers]);

    const getApprovalStatusClasses = (statusValue, fieldKey) => {
        const approvalOptions = dropdownOptions[fieldKey];
        const statusName = getDisplayValue(fieldKey, statusValue, approvalOptions);
        switch (statusName) {
            case 'Accepted':
            case 'Approved':
            case 'Paid':
                return 'bg-green-100 text-green-800 ring-1 ring-green-200';
            case 'Rejected':
            case 'Declined':
            case 'Failed':
                return 'bg-red-100 text-red-800 ring-1 ring-red-200';
            case 'Pending':
            case 'Awaiting Approval':
            case 'Awaiting Payment':
                return 'bg-orange-100 text-orange-800 ring-1 ring-orange-200';
            case 'Under Review':
                return 'bg-blue-100 text-blue-800 ring-1 ring-blue-200';
            case 'N/A':
                return 'bg-gray-100 text-gray-800 ring-1 ring-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 ring-1 ring-gray-200';
        }
    };

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

    const FormField = ({ label, name, value, type, onChange, onFileChange, disabled, options, error }) => {
        const commonClasses = 'w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow';
        const errorBorder = 'border-red-500 ring-red-200';
        const labelClasses = 'font-semibold text-gray-700 mb-1 block capitalize text-sm';

        if (type === 'select') {
            const currentOptions = options || [];
            if (disabled) {
                return (
                    <div>
                        <label htmlFor={name} className={labelClasses}>{label}</label>
                        <input
                            type="text"
                            value={getDisplayValue(name, value, currentOptions)}
                            disabled
                            className={`${commonClasses} bg-gray-100 cursor-not-allowed text-gray-600 ${error ? errorBorder : ''}`}
                        />
                        {error && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><IconAlertCircle size={14} />{error}</p>}
                    </div>
                );
            }
            return (
                <div className="relative">
                    <label htmlFor={name} className={labelClasses}>{label}</label>
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

        if (type === 'image') {
            const fileURL = value instanceof File ? URL.createObjectURL(value) : (value ? `${BASE_URL}${value}` : null);
            return (
                <div className="space-y-2">
                    <label className={labelClasses}>{label}</label>
                    <div className="flex items-center gap-4">
                        {fileURL && (
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                                <img
                                    src={fileURL}
                                    alt={label}
                                    className="w-full h-full object-cover rounded-lg border border-gray-300 shadow-sm"
                                    onError={(e) => {
                                        e.target.src = 'https://placehold.co/128x128/e0e0e0/808080?text=File+Error';
                                        e.target.alt = 'Image not available';
                                    }}
                                />
                            </div>
                        )}
                        {!disabled && (
                            <div className="flex flex-col gap-2">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => onFileChange(name, e.target.files[0])}
                                    className="hidden"
                                    id={`file-${name}`}
                                />
                                <label
                                    htmlFor={`file-${name}`}
                                    className="flex items-center justify-center gap-2 px-4 py-2 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-100 text-sm font-medium shadow-sm"
                                >
                                    {value ? 'Change File' : 'Upload File'}
                                    <IconDeviceFloppy size={18} />
                                </label>
                                {value && (
                                    <button
                                        type="button"
                                        onClick={() => onFileChange(name, null)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium shadow-sm"
                                    >
                                        Remove File
                                        <IconX size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                        {disabled && fileURL && (
                            <a
                                href={fileURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium shadow-sm"
                            >
                                View File
                                <IconDeviceFloppy size={18} />
                            </a>
                        )}
                    </div>
                    {error && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><IconAlertCircle size={14} />{error}</p>}
                </div>
            );
        }

        return (
            <div>
                <label htmlFor={name} className={labelClasses}>{label}</label>
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={type === 'date' && value ? value.split('T')[0] : (value === null || value === undefined ? '' : value)}
                    onChange={(e) => onChange(name, e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                    disabled={disabled}
                    step={type === 'number' ? '0.01' : undefined}
                    className={`${commonClasses} ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''} ${error ? errorBorder : ''}`}
                />
                {error && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><IconAlertCircle size={14} />{error}</p>}
            </div>
        );
    };

    const paymentFields = [
        'package_name', 'package_expiry', 'payment_status', 'payment_method',
        'payment_amount', 'payment_date', 'payment_receipt', 'payment_admin_approval',
        'bank_name', 'account_holder_name',
    ];

    const dateKeys = new Set(['package_expiry', 'payment_date']);
    const dropdownKeys = new Set(['payment_status', 'payment_method', 'payment_admin_approval', 'package_name']);
    const fileKeys = new Set(['payment_receipt']);
    const numberKeys = new Set(['payment_amount']);

    const getInputFieldType = (key) => {
        if (dateKeys.has(key)) return 'date';
        if (dropdownKeys.has(key)) return 'select';
        if (fileKeys.has(key)) return 'image';
        if (numberKeys.has(key)) return 'number';
        return 'text';
    };

    // Render component
    if (!userId && error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white rounded-lg p-6 shadow-lg max-w-md text-center">
                    <p className="text-red-600 font-semibold text-lg mb-2">Authentication Error</p>
                    <p className="text-red-500">{error}</p>
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
            <div className="max-w-7xl mx-auto">
                {/* Header and Search */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                    <h2 className="text-3xl font-normal tracking-tight text-gray-900 leading-tight">
                        Customer Payment Approval
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="Search customers..."
                                onChange={(e) => debouncedSetSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-gray-800"
                            />
                            <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing || loading}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl px-6 py-3 text-base font-semibold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRefreshing || loading ? <IconLoader className="animate-spin" size={22} /> : <IconRefresh size={22} />}
                            {isRefreshing || loading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div>
                </div>

                {/* Customers Table */}
                {loading && !customers.length ? (
                    <div className="flex justify-center items-center h-60 bg-white rounded-xl shadow-md border border-gray-200 mt-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
                    </div>
                ) : error && !customers.length ? (
                    <div className="text-center text-gray-500 py-10 border border-dashed rounded-xl p-6 mt-10 bg-white shadow-sm">
                        <p className="text-red-600 font-semibold mb-2">{error}</p>
                        <p>Try refreshing the page or contact support.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 bg-white mt-8">
                        <table className="min-w-full divide-y divide-gray-200 table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">Select</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Method</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin Approval</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentCustomers.length > 0 ? (
                                    currentCustomers.map((customer) => (
                                        <tr key={customer.user_id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <input
                                                    type="radio"
                                                    name="selectedCustomerRadio"
                                                    value={customer.user_id}
                                                    checked={selectedCustomerData?.user_id === customer.user_id}
                                                    onChange={() => handleCustomerSelect(customer)}
                                                    className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${customerColors[customer.user_id]?.[0] || 'bg-gray-400'} ${customerColors[customer.user_id]?.[1] || 'text-gray-900'}`}>
                                                        {getInitials(customer)}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">{customer.full_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{customer.user_id}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusClasses(customer.payment_status, 'payment_status')}`}>
                                                    {getDisplayValue('payment_status', customer.payment_status, dropdownOptions.payment_status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {getDisplayValue('payment_method', customer.payment_method, dropdownOptions.payment_method)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusClasses(customer.payment_admin_approval, 'payment_admin_approval')}`}>
                                                    {getDisplayValue('payment_admin_approval', customer.payment_admin_approval, dropdownOptions.payment_admin_approval)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => window.location.href = `/dashboard/admin/customer/${customer.user_id}`}
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                                                >
                                                    View Profile
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No customers found matching your search or assigned employees.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-end items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => paginate(page)}
                                        className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm ${
                                            currentPage === page
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment Details Section */}
                <div ref={paymentSectionRef} className="mt-10">
                    {selectedCustomerData ? (
                        <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-fadein">
                            <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <IconCreditCard size={28} className="text-blue-600" />
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        Payment Details for: <span className="text-indigo-600">{selectedCustomerData.full_name}</span>
                                    </h3>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEditing) handleCancel();
                                            else setIsEditing(true);
                                        }}
                                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all duration-200 flex items-center gap-2
                                            ${isEditing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                    >
                                        {isEditing ? (
                                            <> <IconX size={20} /> Cancel </>
                                        ) : (
                                            <> <IconEdit size={20} /> Edit </>
                                        )}
                                    </button>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? <IconLoader className="animate-spin" size={20} /> : <IconCheck size={20} />}
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {saveError && <p className="text-red-500 text-sm mb-4 flex items-center gap-1"><IconAlertCircle size={16} />{saveError}</p>}
                            {saveSuccessMessage && <p className="text-green-600 text-sm mb-4 flex items-center gap-1"><IconCheck size={16} />{saveSuccessMessage}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-6">
                                {paymentFields.map((key) => (
                                    <FormField
                                        key={key}
                                        label={key.replace(/_/g, ' ')}
                                        name={key}
                                        value={selectedCustomerData[key]}
                                        type={getInputFieldType(key)}
                                        onChange={handleSelectedCustomerChange}
                                        onFileChange={handleFileUpload}
                                        disabled={!isEditing}
                                        options={dropdownOptions[key]}
                                        error={formErrors[key]}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : (
                        <div className="text-center text-gray-500 py-10 border border-dashed rounded-xl p-6 mt-10 bg-white shadow-sm">
                            <IconChevronDown size={36} className="mx-auto mb-3 text-gray-400" />
                            <p className="font-semibold text-lg">No customer selected.</p>
                            <p className="text-base">Please select a customer from the table above to view and edit their payment details.</p>
                        </div>
                    )}
                </div>

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

export default PaymentApprovalAdmin;