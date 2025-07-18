import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    IconX, IconSearch, IconEdit, IconLoader, IconChevronDown,
    IconAlertCircle, IconCheck, IconRefresh, IconCoins,
    IconClipboardText, IconBuildingBank, IconFileDescription
} from '@tabler/icons-react';
import { getData, postData, patchData } from '../../../store/httpService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { useAuth } from '../../../contexts/AuthContext';
import { debounce } from 'lodash'; // Import lodash debounce for search optimization

// Define a list of vibrant, "glassy" color pairs for avatars
const AVATAR_COLOR_PALETTE = [
    ['bg-red-500', 'text-red-50'], ['bg-pink-500', 'text-pink-50'], ['bg-purple-500', 'text-purple-50'],
    ['bg-indigo-500', 'text-indigo-50'], ['bg-blue-500', 'text-blue-50'], ['bg-cyan-500', 'text-cyan-50'],
    ['bg-teal-500', 'text-teal-50'], ['bg-green-500', 'text-green-50'], ['bg-lime-500', 'text-lime-900'],
    ['bg-yellow-500', 'text-yellow-900'], ['bg-amber-500', 'text-amber-900'], ['bg-orange-500', 'text-orange-50'],
    ['bg-fuchsia-500', 'text-fuchsia-50'], ['bg-emerald-500', 'text-emerald-50'], ['bg-sky-500', 'text-sky-50'],
];

const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL;

function MyEmpAllRequests() {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [genders, setGenders] = useState([]);
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [loading, setLoading] = useState(false); // Initialize loading to false
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
    const [authError, setAuthError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false); // New state to track refresh

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { user } = useAuth();
    const ADMIN_USER_ID = user?.id || 'N/A';
    const ADMIN_API_ENDPOINT = `/admin/${ADMIN_USER_ID}/`;

    const navigate = useNavigate();

    // --- Authentication Check ---
    useEffect(() => {
        try {
            const userCookie = Cookies.get('user');
            if (!userCookie) {
                setAuthError('Please log in. User session not found.');
                return;
            }
            const parsedUser = JSON.parse(userCookie);
            if (parsedUser.id) {
                setUserId(parsedUser.id);
            } else {
                setAuthError('Invalid user session. User ID not found in cookie.');
            }
        } catch (error) {
            console.error('Cookie Parse Error:', error);
            setAuthError('Failed to load user session. Please clear cookies and log in again.');
        }
    }, []);

    // --- Fetch Admin's Assigned Employees ---
    const fetchEmployees = useCallback(async () => {
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const response = await getData(ADMIN_API_ENDPOINT);
            if (response?.data?.assigned_employees) {
                setEmployees(response.data.assigned_employees);
                toast.success('Assigned employees loaded successfully!', { duration: 3000 });
            } else {
                console.warn('Unexpected employees response structure:', response.data);
                throw new Error('Invalid employees data structure received from API.');
            }
        } catch (error) {
            console.error('Error fetching employees:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            let errorMessage = error.message || 'Failed to load assigned employees.';
            if (error.response?.status === 404) {
                errorMessage = 'Admin endpoint not found. Please verify the admin ID or API configuration.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Unauthorized access. Please log in again.';
                setAuthError(errorMessage);
            }
            toast.error(errorMessage, { duration: 5000 });
            setEmployees([]);
        }
    }, [ADMIN_API_ENDPOINT]);

    // --- Fetch Customers and Filter by Assigned Employees ---
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
            let customerData = [];
            if (Array.isArray(response.data)) {
                customerData = response.data;
            } else if (Array.isArray(response.data?.results)) {
                customerData = response.data.results;
            } else {
                console.error('Unexpected customers API response format:', response.data);
                throw new Error('Invalid customers data structure received from API.');
            }
            const employeeIds = employees.map((emp) => emp.user_id);
            const filtered = customerData
                .filter((customer) => {
                    const employeeId = customer.assigned_employee
                        ? (typeof customer.assigned_employee === 'object' ? customer.assigned_employee.user_id : customer.assigned_employee)
                        : customer.assigned_employee_id || null;
                    return employeeIds.includes(employeeId);
                })
                .map((customer) => ({
                    ...customer,
                    user_id: customer.user_id || 'N/A',
                    full_name: customer.full_name || (customer.first_name && customer.surname ? `${customer.first_name} ${customer.surname}` : 'N/A'),
                    payment_status: customer.payment_status || 'N/A',
                    payment_method: customer.payment_method || 'N/A',
                    payment_admin_approval: customer.payment_admin_approval || 'N/A',
                    agreement_status: customer.agreement_status || 'N/A',
                    admin_agreement_approval: customer.admin_agreement_approval || 'N/A',
                    settlement_status: customer.settlement_status || 'N/A',
                    settlement_admin_approval: customer.settlement_admin_approval || 'N/A',
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
            let errorMessage = error.message || 'Failed to load customers.';
            if (error.response?.status === 404) {
                errorMessage = 'Customers endpoint not found. Please verify the API configuration.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Unauthorized access. Please log in again.';
                setAuthError(errorMessage);
            }
            toast.error(errorMessage, { duration: 5000 });
            setCustomers([]);
            setFilteredCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [employees]); // Removed 'loading' from dependencies

    // --- Fetch Genders and Dropdown Options ---
    const fetchGenders = useCallback(async () => {
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const response = await getData('/gender/');
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
            const [paymentStatusRes, paymentMethodRes, adminApprovalRes, packageNameRes, agreementStatusRes, adminAgreementApprovalRes, settlementStatusRes, settlementTypeRes, settlementAdminApprovalRes] = await Promise.all([
                getData('/payment_status/'),
                getData('/payment_method/'),
                getData('/payment_admin_approval/'),
                getData('/package_name/'),
                getData('/agreement_status/'),
                getData('/admin_agreement_approval/'),
                getData('/settlement_status/'),
                getData('/settlement_type/'),
                getData('/settlement_admin_approval/'),
            ]);
            setDropdownOptions({
                payment_status: Array.isArray(paymentStatusRes.data.results) ? paymentStatusRes.data.results : [],
                payment_method: Array.isArray(paymentMethodRes.data.results) ? paymentMethodRes.data.results : [],
                payment_admin_approval: Array.isArray(adminApprovalRes.data.results) ? adminApprovalRes.data.results : [],
                package_name: Array.isArray(packageNameRes.data.results) ? packageNameRes.data.results : [],
                agreement_status: Array.isArray(agreementStatusRes.data.results) ? agreementStatusRes.data.results : [],
                admin_agreement_approval: Array.isArray(adminAgreementApprovalRes.data.results) ? adminAgreementApprovalRes.data.results : [],
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
            setLoading(true);
            Promise.all([fetchEmployees(), fetchGenders(), fetchDropdownOptions()])
                .finally(() => setLoading(false));
        }
    }, [userId, fetchEmployees, fetchGenders, fetchDropdownOptions]);

    useEffect(() => {
        if (employees.length > 0) {
            fetchCustomers();
        }
    }, [employees, fetchCustomers]);

    // --- Filtering and Search ---
    const debouncedSetSearchQuery = useCallback(
        debounce((value) => {
            setSearchQuery(value);
        }, 300),
        []
    );

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
            const agreementStatusName = getDisplayValue('agreement_status', customer.agreement_status, dropdownOptions.agreement_status).toLowerCase();
            const adminAgreementApprovalName = getDisplayValue('admin_agreement_approval', customer.admin_agreement_approval, dropdownOptions.admin_agreement_approval).toLowerCase();
            const settlementStatusName = getDisplayValue('settlement_status', customer.settlement_status, dropdownOptions.settlement_status).toLowerCase();
            const settlementAdminApprovalName = getDisplayValue('settlement_admin_approval', customer.settlement_admin_approval, dropdownOptions.settlement_admin_approval).toLowerCase();
            const employeeId = customer.assigned_employee
                ? (typeof customer.assigned_employee === 'object' ? customer.assigned_employee.user_id : customer.assigned_employee).toLowerCase()
                : '';
            return fullName.includes(lowerCaseQuery) ||
                userId.includes(lowerCaseQuery) ||
                genderName.includes(lowerCaseQuery) ||
                paymentStatusName.includes(lowerCaseQuery) ||
                paymentMethodName.includes(lowerCaseQuery) ||
                adminApprovalStatusName.includes(lowerCaseQuery) ||
                agreementStatusName.includes(lowerCaseQuery) ||
                adminAgreementApprovalName.includes(lowerCaseQuery) ||
                settlementStatusName.includes(lowerCaseQuery) ||
                settlementAdminApprovalName.includes(lowerCaseQuery) ||
                employeeId.includes(lowerCaseQuery);
        });
        setFilteredCustomers(newFilteredCustomers);
    }, [customers, searchQuery, genders, dropdownOptions]);

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

    // --- Selected Customer Edit Form Handling ---
    const handleSelectedCustomerChange = useCallback((fieldName, value) => {
        setSelectedCustomerData(prev => ({
            ...prev,
            [fieldName]: value
        }));
        setFormErrors(prev => ({ ...prev, [fieldName]: null }));
        setSaveError(prev => ({ ...prev, payment: null, agreement: null, settlement: null }));
        setSaveSuccessMessage(prev => ({ ...prev, payment: null, agreement: null, settlement: null }));
    }, []);

    const handleFileUpload = useCallback((fieldName, file) => {
        setSelectedCustomerData(prev => ({ ...prev, [fieldName]: file || null }));
        setFormErrors(prev => ({ ...prev, [fieldName]: null }));
    }, []);

    const handleSave = useCallback(async (e, section) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        if (!selectedCustomerData || !selectedCustomerData.user_id) {
            setSaveError(prev => ({ ...prev, [section]: 'No customer selected for saving or User ID is missing.' }));
            toast.error('No customer selected');
            return;
        }
        // Ensure editing mode is active for the section
        const isEditing = {
            payment: isEditingPayment,
            agreement: isEditingAgreement,
            settlement: isEditingSettlement
        }[section];
        if (!isEditing) {
            toast.error(`Editing mode not enabled for ${section}`);
            return;
        }
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
        const newErrors = {};
        Object.entries(requiredFields[section]).forEach(([key, label]) => {
            if (({
                payment: paymentFields,
                agreement: agreementFields,
                settlement: settlementFields
            }[section]).includes(key) && !selectedCustomerData[key] && selectedCustomerData[key] !== false) {
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
                if (section === 'payment') setIsEditingPayment(false);
                if (section === 'agreement') setIsEditingAgreement(false);
                if (section === 'settlement') setIsEditingSettlement(false);
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
                response = await patchData(`/customer/${selectedCustomerData.user_id}/`, formDataObj);
            } else {
                response = await patchData(`/customer/${selectedCustomerData.user_id}/`, changedData);
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
    }, [selectedCustomerData, isEditingPayment, isEditingAgreement, isEditingSettlement, customers, fetchCustomers]);

    const handleCancel = useCallback((section) => {
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
    }, [selectedCustomerData, customers]);

    // --- Employee Assignment ---
    const handleAssignEmployee = useCallback(async (selectedEmployeeId) => {
        if (!selectedEmployeeId) {
            toast.error('Please select an employee');
            return;
        }
        setAssignLoading(true);
        try {
            const token = Cookies.get('accessToken');
            if (!token) throw new Error('No authentication token. Please log in.');
            const payload = { employee_user_id: selectedEmployeeId, customer_user_id: selectedCustomerData.user_id };
            await postData('/assign/customer-to-employee/', payload);
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
    }, [selectedCustomerData, fetchCustomers]);

    // --- Refresh Handler ---
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return; // Prevent multiple refreshes
        setIsRefreshing(true);
        setLoading(true);
        setSelectedCustomerData(null);
        setSearchQuery('');
        setFormErrors({});
        setSaveError({ payment: null, agreement: null, settlement: null });
        setSaveSuccessMessage({ payment: null, agreement: null, settlement: null });
        try {
            await fetchEmployees();
            await fetchCustomers();
            toast.info('Data refreshed successfully!');
        } catch (error) {
            toast.error('Failed to refresh data');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [fetchEmployees, fetchCustomers]);

    // --- Helper Functions ---
    const getInitials = useCallback((customer) => {
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
    }, []);

    const formatGender = useCallback((genderId, genderOptions) => {
        const gender = genderOptions.find(g => g.id === genderId);
        return gender ? gender.name : 'N/A';
    }, []);

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

    const getApprovalStatusClasses = useCallback((statusValue, fieldKey) => {
        const approvalOptions = dropdownOptions[fieldKey];
        const statusName = getDisplayValue(fieldKey, statusValue, approvalOptions);
        switch (statusName) {
            case 'Accepted':
            case 'Approved':
            case 'Paid':
            case 'Completed':
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
    }, [getDisplayValue, dropdownOptions]);

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

    const FormField = useCallback(({ label, name, value, type, onChange, onFileChange, disabled, options, error }) => {
        const commonClasses = 'w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow';
        const errorBorder = 'border-red-500 ring-red-200';
        const labelClasses = 'font-semibold text-gray-700 mb-1 block capitalize text-sm';

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
                            className={`${commonClasses} bg-gray-100 cursor-not-allowed text-gray-600 ${error ? errorBorder : ''}`}
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
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                    />
                    <label htmlFor={name} className={`${labelClasses} !mb-0 select-none text-sm`}>
                        {label}
                    </label>
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
                                    <IconFileDescription size={18} />
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
                                <IconFileDescription size={18} />
                            </a>
                        )}
                    </div>
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
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault(); // Prevent form submission on Enter
                    }}
                    disabled={disabled}
                    step={type === 'number' ? '0.01' : undefined}
                    className={`${commonClasses} ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''} ${error ? errorBorder : ''}`}
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
        'agreement_status', 'admin_agreement_approval', 'settlement_status', 'settlement_type', 'settlement_admin_approval',
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
        const [selectedEmployee, setSelectedEmployee] = useState(currentEmployee?.user_id || '');

        useEffect(() => {
            setSelectedEmployee(currentEmployee?.user_id || '');
        }, [currentEmployee]);

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md animate-modal-slide-down">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <IconEdit size={24} className="text-indigo-600" />
                        {currentEmployee ? 'Change Assigned Employee' : 'Assign Employee'}
                    </h2>
                    <div className="mb-4 text-gray-700">
                        <p>Current Employee: <span className="font-semibold">{currentEmployee ? `${currentEmployee.full_name} (${currentEmployee.user_id})` : 'N/A'}</span></p>
                    </div>
                    <div className="relative mb-6">
                        <label htmlFor="assign-employee-select" className="sr-only">Select Employee</label>
                        <select
                            id="assign-employee-select"
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-gray-800"
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
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onAssign(selectedEmployee)}
                            disabled={assignLoading || !selectedEmployee}
                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                        >
                            {assignLoading && <IconLoader className="animate-spin" size={20} />}
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Authentication Error UI
    if (!userId && authError) {
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
            <div className="max-w-7xl mx-auto">
                {/* Header and Search */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                    <h2 className="text-3xl font-normal tracking-tight text-gray-900 leading-tight">
                        My Employees' Requests
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
                ) : (
                    <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 bg-white mt-8">
                        <table className="min-w-full divide-y divide-gray-200 table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">Select</th>
                                    <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                    <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer ID</th>
                                    <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned Employee ID</th>
                                    <th colSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-blue-800 uppercase tracking-wider bg-blue-50 border-b border-gray-200">Payment</th>
                                    <th colSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-green-800 uppercase tracking-wider bg-green-50 border-b border-gray-200">Agreement</th>
                                    <th colSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-purple-800 uppercase tracking-wider bg-purple-50 border-b border-gray-200">Settlement</th>
                                    <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Actions</th>
                                </tr>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-50">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-50">Admin Approval</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase tracking-wider bg-green-50">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase tracking-wider bg-green-50">Admin Approval</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider bg-purple-50">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider bg-purple-50">Admin Approval</th>
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
                                                    className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${customerColors[customer.user_id]?.[0] || 'bg-gray-400'} ${customerColors[customer.user_id]?.[1] || 'text-gray-900'}`}>
                                                        {getInitials(customer)}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {customer.full_name || `${customer.first_name} ${customer.surname}`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">{customer.user_id}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">
                                                    {customer.assigned_employee
                                                        ? (typeof customer.assigned_employee === 'object' ? customer.assigned_employee.user_id : customer.assigned_employee)
                                                        : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm bg-blue-50">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusClasses(customer.payment_status, 'payment_status')}`}>
                                                    {getDisplayValue('payment_status', customer.payment_status, dropdownOptions.payment_status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm bg-blue-50">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusClasses(customer.payment_admin_approval, 'payment_admin_approval')}`}>
                                                    {getDisplayValue('payment_admin_approval', customer.payment_admin_approval, dropdownOptions.payment_admin_approval)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm bg-green-50">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusClasses(customer.agreement_status, 'agreement_status')}`}>
                                                    {getDisplayValue('agreement_status', customer.agreement_status, dropdownOptions.agreement_status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm bg-green-50">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusClasses(customer.admin_agreement_approval, 'admin_agreement_approval')}`}>
                                                    {getDisplayValue('admin_agreement_approval', customer.admin_agreement_approval, dropdownOptions.admin_agreement_approval)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm bg-purple-50">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusClasses(customer.settlement_status, 'settlement_status')}`}>
                                                    {getDisplayValue('settlement_status', customer.settlement_status, dropdownOptions.settlement_status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm bg-purple-50">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusClasses(customer.settlement_admin_approval, 'settlement_admin_approval')}`}>
                                                    {getDisplayValue('settlement_admin_approval', customer.settlement_admin_approval, dropdownOptions.settlement_admin_approval)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/dashboard/admin/customer/${customer.user_id}`);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                                                >
                                                    View Profile
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
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

                {/* Payment, Agreement, and Settlement Sections */}
                {selectedCustomerData ? (
                    <div className="space-y-8 mt-10">
                        {/* Payment Section */}
                        <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-fadein">
                            <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <IconCoins size={28} className="text-blue-600" />
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        Payment Details
                                    </h3>
                                    <span className="text-xl font-semibold text-indigo-600 ml-2">
                                        for: {selectedCustomerData.full_name || `${selectedCustomerData.first_name} ${selectedCustomerData.surname}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col text-right text-sm text-gray-700">
                                        Assigned Employee: <span className="font-semibold text-gray-900">
                                            {selectedCustomerData.assigned_employee
                                                ? (typeof selectedCustomerData.assigned_employee === 'object'
                                                    ? `${selectedCustomerData.assigned_employee.full_name} (${selectedCustomerData.assigned_employee.user_id})`
                                                    : selectedCustomerData.assigned_employee)
                                                : 'N/A'}
                                        </span>
                                        <button
                                            onClick={() => setIsAssignModalOpen(true)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1 flex items-center justify-end gap-1"
                                        >
                                            <IconEdit size={14} />
                                            {selectedCustomerData.assigned_employee ? 'Change Employee' : 'Assign Employee'}
                                        </button>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200 hidden sm:block"></div>
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isEditingPayment) handleCancel('payment');
                                                else setIsEditingPayment(true);
                                            }}
                                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all duration-200 flex items-center gap-2
                                                ${isEditingPayment ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                        >
                                            {isEditingPayment ? (
                                                <> <IconX size={20} /> Cancel </>
                                            ) : (
                                                <> <IconEdit size={20} /> Edit </>
                                            )}
                                        </button>
                                        {isEditingPayment && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleSave(e, 'payment')}
                                                disabled={loading}
                                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? <IconLoader className="animate-spin" size={20} /> : <IconCheck size={20} />}
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {saveError.payment && <p className="text-red-500 text-sm mb-4 flex items-center gap-1"><IconAlertCircle size={16} />{saveError.payment}</p>}
                            {saveSuccessMessage.payment && <p className="text-green-600 text-sm mb-4 flex items-center gap-1"><IconCheck size={16} />{saveSuccessMessage.payment}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-6">
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
                        </section>

                        {/* Agreement Section */}
                        <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-fadein">
                            <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <IconClipboardText size={28} className="text-green-600" />
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        Agreement Details
                                    </h3>
                                    <span className="text-xl font-semibold text-indigo-600 ml-2">
                                        for: {selectedCustomerData.full_name || `${selectedCustomerData.first_name} ${selectedCustomerData.surname}`}
                                    </span>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEditingAgreement) handleCancel('agreement');
                                            else setIsEditingAgreement(true);
                                        }}
                                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all duration-200 flex items-center gap-2
                                            ${isEditingAgreement ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                    >
                                        {isEditingAgreement ? (
                                            <> <IconX size={20} /> Cancel </>
                                        ) : (
                                            <> <IconEdit size={20} /> Edit </>
                                        )}
                                    </button>
                                    {isEditingAgreement && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleSave(e, 'agreement')}
                                            disabled={loading}
                                            className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? <IconLoader className="animate-spin" size={20} /> : <IconCheck size={20} />}
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {saveError.agreement && <p className="text-red-500 text-sm mb-4 flex items-center gap-1"><IconAlertCircle size={16} />{saveError.agreement}</p>}
                            {saveSuccessMessage.agreement && <p className="text-green-600 text-sm mb-4 flex items-center gap-1"><IconCheck size={16} />{saveSuccessMessage.agreement}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-6">
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
                        </section>

                        {/* Settlement Section */}
                        <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-fadein">
                            <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <IconBuildingBank size={28} className="text-purple-600" />
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        Settlement Details
                                    </h3>
                                    <span className="text-xl font-semibold text-indigo-600 ml-2">
                                        for: {selectedCustomerData.full_name || `${selectedCustomerData.first_name} ${selectedCustomerData.surname}`}
                                    </span>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEditingSettlement) handleCancel('settlement');
                                            else setIsEditingSettlement(true);
                                        }}
                                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all duration-200 flex items-center gap-2
                                            ${isEditingSettlement ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                                    >
                                        {isEditingSettlement ? (
                                            <> <IconX size={20} /> Cancel </>
                                        ) : (
                                            <> <IconEdit size={20} /> Edit </>
                                        )}
                                    </button>
                                    {isEditingSettlement && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleSave(e, 'settlement')}
                                            disabled={loading}
                                            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? <IconLoader className="animate-spin" size={20} /> : <IconCheck size={20} />}
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {saveError.settlement && <p className="text-red-500 text-sm mb-4 flex items-center gap-1"><IconAlertCircle size={16} />{saveError.settlement}</p>}
                            {saveSuccessMessage.settlement && <p className="text-green-600 text-sm mb-4 flex items-center gap-1"><IconCheck size={16} />{saveSuccessMessage.settlement}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-6">
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
                        </section>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-10 border border-dashed rounded-xl p-6 mt-10 bg-white shadow-sm">
                        <IconChevronDown size={36} className="mx-auto mb-3 text-gray-400" />
                        <p className="font-semibold text-lg">No customer selected.</p>
                        <p className="text-base">Please select a customer from the table above to view and edit their request details.</p>
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

export default MyEmpAllRequests;