// src/components/employees/EmployeeCustomerInterests.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getData, postData } from '../../../store/httpservice'; // Adjust path if needed
import Cookies from "js-cookie";
import { IconArrowLeft, IconSend, IconCheck, IconX, IconLinkOff, IconTrash, IconPlus, IconUserCircle } from '@tabler/icons-react';

// Define a list of vibrant, "glassy" color pairs for avatars
const AVATAR_COLOR_PALETTE = [
    ['bg-red-500', 'text-red-50'],
    ['bg-pink-500', 'text-pink-50'],
    ['bg-purple-500', 'text-purple-50'],
    ['bg-indigo-500', 'text-indigo-50'],
    ['bg-blue-500', 'text-blue-50'],
    ['bg-cyan-500', 'text-cyan-50'],
    ['bg-teal-500', 'text-teal-50'],
    ['bg-green-500', 'text-green-50'],
    ['bg-lime-500', 'text-lime-900'],
    ['bg-yellow-500', 'text-yellow-900'],
    ['bg-amber-500', 'text-amber-900'],
    ['bg-orange-500', 'text-orange-50'],
    ['bg-fuchsia-500', 'text-fuchsia-50'],
    ['bg-emerald-500', 'text-emerald-50'],
    ['bg-sky-500', 'text-sky-50'],
];

function EmployeeCustomerInterests() {
    const { user_id } = useParams(); // Get the user_id from the URL path, e.g., "GDM0000007"
    const navigate = useNavigate();
    const [customerInterests, setCustomerInterests] = useState({
        sent_interests: [],
        received_interests: [],
        matched_interests: [],
        rejected_interests: [],
    });
    const [currentCustomerDetails, setCurrentCustomerDetails] = useState(null); // To display the current customer's name
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the inline "Send Interest" form
    const [isSendInterestFormOpen, setIsSendInterestFormOpen] = useState(false);
    const [allOtherCustomers, setAllOtherCustomers] = useState([]); // List of all other customers for the 'Send Interest' dropdown
    const [selectedTargetCustomer, setSelectedTargetCustomer] = useState('');
    const [sendInterestError, setSendInterestError] = useState('');

    // Employee user ID from cookie for authorization (assuming an employee is logged in)
    const employeeUserId = Cookies.get('user') ? JSON.parse(Cookies.get('user')).id : null;

    // --- Console logs for debugging ---
    console.log("EmployeeCustomerInterests component loaded.");
    console.log("user_id from useParams():", user_id);
    console.log("employeeUserId from cookie:", employeeUserId);
    // --- End console logs ---


    // Helper for initials and avatar colors
    const getInitials = useCallback((person) => {
        if (!person || (!person.name && !person.full_name)) {
            return '??';
        }
        const nameToUse = person.name || person.full_name;
        const parts = nameToUse.trim().split(' ');
        if (parts.length > 1) {
            return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
        } else if (parts.length === 1 && parts[0].length > 0) {
            return parts[0].charAt(0).toUpperCase();
        }
        return '??';
    }, []);

    const getAvatarColor = useCallback((person) => {
        const initials = getInitials(person);
        const firstLetter = initials.charAt(0).toUpperCase();
        const charCode = firstLetter.charCodeAt(0) - 65;
        const colorIndex = (charCode >= 0 && charCode < 26) ? charCode % AVATAR_COLOR_PALETTE.length : 0;
        return AVATAR_COLOR_PALETTE[colorIndex];
    }, [getInitials]);

    // Function to fetch all necessary data
    const fetchCustomerData = useCallback(async () => {
        // --- Console logs for debugging ---
        console.log("fetchCustomerData called.");
        console.log("Current user_id in fetchCustomerData:", user_id);
        console.log("Current employeeUserId in fetchCustomerData:", employeeUserId);
        // --- End console logs ---

        if (!employeeUserId) {
            setError("Employee not logged in. Please log in to view interests.");
            setLoading(false);
            console.error("Error: Employee not logged in."); // Log error
            return;
        }
        if (!user_id) { // This is the check that's currently failing if routing is off
            setError("Customer ID is missing from the URL. Cannot fetch interests.");
            setLoading(false);
            console.error("Error: user_id is missing from URL parameters."); // Log error
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching customer details for: /customer/${user_id}/`);
            const customerDetailResponse = await getData(`/customer/${user_id}/`);
            setCurrentCustomerDetails(customerDetailResponse.data);
            console.log("Customer details response:", customerDetailResponse.data);

            console.log(`Fetching interests for: /employee/customer/interests/${user_id}/`);
            const interestsResponse = await getData(`/employee/customer/interests/${user_id}/`);
            setCustomerInterests(interestsResponse.data);
            console.log("Interests response (raw):", interestsResponse.data); // This is where you expect your provided JSON

            console.log("Fetching all customers for dropdown: /customers/");
            const allCustomersResponse = await getData('/customers/');
            const otherCustomers = allCustomersResponse.data.filter(cust => cust.user_id !== user_id);
            setAllOtherCustomers(otherCustomers);
            console.log("All other customers response:", otherCustomers);

        } catch (err) {
            console.error('Error fetching customer data:', err.response?.data || err.message); // Log full error
            setError(`Failed to load customer data. ${err.response?.status ? `Status: ${err.response.status}. ` : ''}${err.response?.data?.detail || err.message}`);
            setCustomerInterests({ sent_interests: [], received_interests: [], matched_interests: [], rejected_interests: [] });
            setCurrentCustomerDetails(null);
            setAllOtherCustomers([]);
        } finally {
            setLoading(false);
            console.log("fetchCustomerData finished. Loading state:", false);
        }
    }, [user_id, employeeUserId]); // Dependencies for useCallback

    useEffect(() => {
        fetchCustomerData();
    }, [fetchCustomerData]); // Dependency for useEffect

    // --- API Action Handlers ---

    // Generic handler for POST actions
    const handleAction = async (actionUrl, payload = {}, successMessage = "Action successful!") => {
        setLoading(true);
        setError(null); // Clear previous errors
        console.log(`Attempting action: ${actionUrl} with payload:`, payload); // Log action
        try {
            await postData(actionUrl, payload);
            console.log(successMessage);
            // Refresh all customer data after a successful action to reflect changes
            await fetchCustomerData();
        } catch (err) {
            console.error(`Error performing action ${actionUrl}:`, err.response?.data || err.message);
            setError(`Action failed: ${err.response?.status ? `Status: ${err.response.status}. ` : ''}${err.response?.data?.detail || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handler for sending interest (triggered by the inline form)
    const handleSendInterestSubmit = async (e) => {
        e.preventDefault();
        setSendInterestError(''); // Clear previous errors for the send form

        if (!selectedTargetCustomer) {
            setSendInterestError('Please select a customer to send interest to.');
            return;
        }

        const payload = {
            customer_id: user_id, // The current customer's ID (who is sending the interest)
            target_customer_id: selectedTargetCustomer, // The customer to send interest to
        };
        console.log("Sending interest with payload:", payload); // Log payload

        try {
            await postData('/interest/send/', payload);
            console.log("Interest sent successfully!");
            setIsSendInterestFormOpen(false); // Close the form
            setSelectedTargetCustomer(''); // Reset selection
            await fetchCustomerData(); // Refresh data
        } catch (err) {
            const errMessage = err.response?.data?.detail || err.message;
            setSendInterestError(`Failed to send interest: ${errMessage}`);
            console.error("Error sending interest:", err.response?.data || err.message);
        }
    };

    const handleDeleteSentInterest = async (targetUserId) => {
        if (window.confirm(`Are you sure you want to delete the interest sent to ${targetUserId}?`)) {
            // Note: The API endpoint was previously `/interest/delete/${targetUserId}/`
            // and took customer_id and target_customer_id in payload.
            // Ensure this matches your backend's expected DELETE interest logic.
            const payload = { customer_id: user_id, target_customer_id: targetUserId };
            await handleAction(`/interest/delete/`, payload, "Sent interest deleted!"); // Assuming delete takes payload in body
        }
    };

    const handleAcceptInterest = async (senderUserId) => {
        if (window.confirm(`Are you sure you want to accept the interest from ${senderUserId}?`)) {
            const payload = { customer_id: user_id, sender_id: senderUserId };
            await handleAction(`/interest/accept/`, payload, "Interest accepted!"); // Assuming accept takes payload in body
        }
    };

    const handleRejectInterest = async (senderUserId) => {
        if (window.confirm(`Are you sure you want to reject the interest from ${senderUserId}?`)) {
            const payload = { customer_id: user_id, sender_id: senderUserId };
            await handleAction(`/interest/reject/`, payload, "Interest rejected!"); // Assuming reject takes payload in body
        }
    };

    const handleUnmatch = async (matchedUserId) => {
        if (window.confirm(`Are you sure you want to unmatch with ${matchedUserId}?`)) {
            const payload = { customer_id: user_id, matched_customer_id: matchedUserId };
            await handleAction(`/interest/unmatch/`, payload, "Unmatched successfully!"); // Assuming unmatch takes payload in body
        }
    };

    // --- Render Helper for Interest Cards ---
    const renderInterestCard = (interest, type) => {
        let otherParty;
        let statusText = '';
        let statusColor = 'text-gray-500';
        let actions = [];

        // Determine 'otherParty' based on the interest type and structure
        if (type === 'rejected_interests') {
            // For rejected_interests, 'customer' is the other party, 'profile' is the current customer
            otherParty = interest.customer;

            if (!otherParty) {
                console.warn(`Rejected interest item missing 'customer' details:`, interest);
                return null;
            }

            // Determine rejection status based on whose profile matches the current user_id
            if (interest.profile && interest.profile.user_id === user_id) {
                statusText = `You rejected ${otherParty.name || otherParty.user_id}`;
                statusColor = 'text-red-600'; // Current user rejected
            } else {
                statusText = `${otherParty.name || otherParty.user_id} rejected you`;
                statusColor = 'text-gray-500'; // Other party rejected the current user
            }

        } else {
            // For sent, received, matched, 'customer' is always the other party
            otherParty = interest.customer;
            if (!otherParty) {
                console.warn(`Interest item (type: ${type}) missing 'customer' details:`, interest);
                return null;
            }

            switch (type) {
                case 'sent_interests':
                    statusText = `Sent to ${otherParty.name || otherParty.user_id}`;
                    statusColor = 'text-blue-600';
                    actions.push(
                        <button
                            key="delete"
                            onClick={() => handleDeleteSentInterest(otherParty.user_id)}
                            className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                            title="Delete Sent Interest"
                        >
                            <IconTrash size={20} />
                        </button>
                    );
                    break;
                case 'received_interests':
                    statusText = `Received from ${otherParty.name || otherParty.user_id}`;
                    statusColor = 'text-purple-600';
                    actions.push(
                        <button
                            key="accept"
                            onClick={() => handleAcceptInterest(otherParty.user_id)}
                            className="p-1 rounded-full text-green-500 hover:bg-green-100 transition-colors"
                            title="Accept Interest"
                        >
                            <IconCheck size={20} />
                        </button>,
                        <button
                            key="reject"
                            onClick={() => handleRejectInterest(otherParty.user_id)}
                            className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                            title="Reject Interest"
                        >
                            <IconX size={20} />
                        </button>
                    );
                    break;
                case 'matched_interests':
                    statusText = `Matched with ${otherParty.name || otherParty.user_id}`;
                    statusColor = 'text-green-600';
                    actions.push(
                        <button
                            key="unmatch"
                            onClick={() => handleUnmatch(otherParty.user_id)}
                            className="p-1 rounded-full text-orange-500 hover:bg-orange-100 transition-colors"
                            title="Unmatch"
                        >
                            <IconLinkOff size={20} />
                        </button>
                    );
                    break;
                default:
                    statusText = 'Interest Detail';
                    break;
            }
        }

        const [bgColorClass, textColorClass] = getAvatarColor(otherParty);
        const createdAt = new Date(interest.created_at).toLocaleString();

        return (
            <div key={`${interest.id || otherParty.user_id}-${type}`} className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 transition-all duration-200 ease-in-out hover:shadow-md">
                <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold ${bgColorClass} ${textColorClass}`}>
                    {getInitials(otherParty)}
                </div>
                <div className="flex-grow">
                    <p className="text-base font-semibold text-gray-800 leading-tight">
                        {otherParty.name || otherParty.full_name} ({otherParty.user_id})
                    </p>
                    {otherParty.gender && <p className="text-sm text-gray-600">Gender: {otherParty.gender}</p>}
                    {otherParty.age && <p className="text-sm text-gray-600">Age: {otherParty.age}</p>}
                    <p className={`text-sm mt-2 ${statusColor}`}>{statusText}</p>
                    <p className="text-xs text-gray-500">Date: {createdAt}</p>
                </div>
                <div className="flex flex-col gap-1.5 absolute top-3 right-3">
                    {actions}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-4 text-center">
                <p className="text-lg text-red-600 mb-4">{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 text-base font-semibold shadow-lg transition-all duration-300"
                >
                    <IconArrowLeft size={22} /> Go Back
                </button>
            </div>
        );
    }

    return (
        <main className="p-4 sm:p-6 bg-gray-50 min-h-screen selection:bg-indigo-600 selection:text-white">
            <div className="max-w-6xl mx-auto py-8">
                {/* Header with Back Button and Add Interest Button */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
                            aria-label="Go back"
                        >
                            <IconArrowLeft size={24} stroke={1.5} className="text-gray-700" />
                        </button>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
                            Interests for <span className="text-indigo-600">
                                {currentCustomerDetails?.full_name || currentCustomerDetails?.user_id || user_id || "Customer"}
                            </span>
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsSendInterestFormOpen(!isSendInterestFormOpen)} // Toggle form visibility
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-700 hover:from-blue-700 hover:to-sky-800 text-white rounded-xl px-5 py-2.5 text-base font-semibold shadow-lg transform transition-all duration-300 hover:scale-105"
                    >
                        <IconSend size={20} /> {isSendInterestFormOpen ? 'Close Form' : 'Send New Interest'}
                    </button>
                </div>

                {/* Inline Send Interest Form (conditionally rendered) */}
                {isSendInterestFormOpen && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 animate-fade-in">
                        <h3 className="font-bold text-2xl text-gray-900 mb-6 flex items-center gap-2">
                            <IconSend size={24} className="text-blue-500" /> Send Interest from {user_id || "current customer"}
                        </h3>
                        <form onSubmit={handleSendInterestSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-6 items-end">
                            <div>
                                <label htmlFor="target_customer" className="block text-sm font-semibold mb-1 text-gray-700">
                                    Select Customer to Send Interest To:
                                </label>
                                <select
                                    id="target_customer"
                                    value={selectedTargetCustomer}
                                    onChange={(e) => {
                                        setSelectedTargetCustomer(e.target.value);
                                        setSendInterestError(''); // Clear error on change
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none"
                                    required
                                >
                                    <option value="">Select a customer</option>
                                    {allOtherCustomers.length > 0 ? (
                                        allOtherCustomers.map((customer) => (
                                            <option key={customer.user_id} value={customer.user_id}>
                                                {customer.full_name || customer.user_id}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No other customers available</option>
                                    )}
                                </select>
                                {sendInterestError && <p className="text-sm text-red-600 mt-1">{sendInterestError}</p>}
                            </div>
                            <div className="flex justify-start md:justify-end">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 shadow-lg transform hover:scale-105 w-full md:w-auto"
                                >
                                    <IconSend size={20} /> Send Interest
                                </button>
                            </div>
                        </form>
                    </div>
                )}


                {/* Sent Interests Section */}
                <section className="mb-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <IconSend size={24} className="text-blue-500" /> Sent Interests ({customerInterests.sent_interests.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customerInterests.sent_interests.length > 0 ? (
                            customerInterests.sent_interests.map(interest => renderInterestCard(interest, 'sent_interests'))
                        ) : (
                            <p className="col-span-full text-gray-600 text-center py-4">No interests sent by this customer yet.</p>
                        )}
                    </div>
                </section>

                {/* Received Interests Section */}
                <section className="mb-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <IconPlus size={24} className="text-purple-500" /> Received Interests ({customerInterests.received_interests.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customerInterests.received_interests.length > 0 ? (
                            customerInterests.received_interests.map(interest => renderInterestCard(interest, 'received_interests'))
                        ) : (
                            <p className="col-span-full text-gray-600 text-center py-4">No interests received by this customer yet.</p>
                        )}
                    </div>
                </section>

                {/* Matched Interests Section */}
                <section className="mb-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <IconCheck size={24} className="text-green-500" /> Matched Interests ({customerInterests.matched_interests.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customerInterests.matched_interests.length > 0 ? (
                            customerInterests.matched_interests.map(interest => renderInterestCard(interest, 'matched_interests'))
                        ) : (
                            <p className="col-span-full text-gray-600 text-center py-4">No matched interests for this customer yet.</p>
                        )}
                    </div>
                </section>

                {/* Rejected Interests Section */}
                <section className="mb-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <IconX size={24} className="text-red-500" /> Rejected Interests ({customerInterests.rejected_interests.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customerInterests.rejected_interests.length > 0 ? (
                            customerInterests.rejected_interests.map(interest => renderInterestCard(interest, 'rejected_interests'))
                        ) : (
                            <p className="col-span-full text-gray-600 text-center py-4">No rejected interests for this customer yet.</p>
                        )}
                    </div>
                </section>

            </div>
            {/* CSS Animations */}
            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes fadeIn { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
            `}</style>
        </main>
    );
}

export default EmployeeCustomerInterests;