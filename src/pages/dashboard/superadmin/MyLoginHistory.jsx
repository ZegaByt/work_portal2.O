import React, { useEffect, useState, useCallback } from 'react';
import { getData } from '../../../store/httpService'; // Assuming this path is correct
import { format } from 'date-fns'; // For better date formatting
import { IconHistory, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'; // For icons

// Define a default page size. This should ideally match what your backend API uses.
const PAGE_SIZE = 10;

// Helper function to parse User Agent string for browser and OS information
const parseUserAgent = (userAgentString) => {
  if (!userAgentString) return { browser: 'Unknown Browser', os: 'Unknown OS' };

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect OS
  if (userAgentString.includes('Windows NT')) {
    os = 'Windows';
  } else if (userAgentString.includes('Macintosh') || userAgentString.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgentString.includes('Android')) {
    os = 'Android';
  } else if (userAgentString.includes('iOS')) {
    os = 'iOS';
  } else if (userAgentString.includes('Linux')) {
    os = 'Linux';
  }

  // Detect Browser
  if (userAgentString.includes('Edg')) {
    browser = 'Microsoft Edge';
  } else if (userAgentString.includes('Chrome') && !userAgentString.includes('Edg')) {
    browser = 'Google Chrome';
  } else if (userAgentString.includes('Safari') && !userAgentString.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgentString.includes('Firefox')) {
    browser = 'Mozilla Firefox';
  } else if (userAgentString.includes('MSIE') || userAgentString.includes('Trident')) {
    browser = 'Internet Explorer';
  } else if (userAgentString.includes('Opera') || userAgentString.includes('OPR')) {
    browser = 'Opera';
  }

  return { browser, os };
};


function MyLoginHistory() {
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Default to page 1
  const [totalCount, setTotalCount] = useState(0); // Total number of items
  const [totalPages, setTotalPages] = useState(1); // Total number of pages

  const fetchLoginHistory = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getData(`/my-login-history/?page=${page}&page_size=${PAGE_SIZE}`);

      // Process user agent for each entry
      const processedHistory = response.data.results.map(entry => ({
        ...entry,
        userAgentInfo: parseUserAgent(entry.user_agent)
      }));

      setLoginHistory(processedHistory);
      setTotalCount(response.data.count);

      const calculatedTotalPages = Math.ceil(response.data.count / PAGE_SIZE);
      setTotalPages(calculatedTotalPages === 0 ? 1 : calculatedTotalPages); // Ensure at least 1 page
      setCurrentPage(page);

    } catch (err) {
      console.error('Error fetching login history:', err);
      setError('Failed to load login history. Please try again. If the problem persists, contact support.');
      setLoginHistory([]); // Clear previous data on error
      setTotalCount(0); // Reset total count
      setTotalPages(1); // Reset total pages
      setCurrentPage(1); // Reset to first page
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies for fetchLoginHistory itself, as currentPage is passed as argument

  useEffect(() => {
    fetchLoginHistory(currentPage);
  }, [currentPage, fetchLoginHistory]); // Dependency array: re-run when currentPage changes or fetchLoginHistory changes (due to useCallback)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Helper function to format dates
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      // Adjusted format to be more consistent: "07 Jul, 05:05:28 PM"
      return format(new Date(dateTimeString), 'dd MMM, hh:mm:ss a');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateTimeString; // Return original if formatting fails
    }
  };

  return (
    <main className="p-0 sm:p-0 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-2 sm:p-2">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <IconHistory size={48} className="text-indigo-600" />
          <h2 className="text-3xl font-normal tracking-tight text-gray-900">
            My Login History
          </h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-indigo-600 border-solid"></div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm">
            <p className="font-semibold text-lg mb-2">Error Loading Data</p>
            <p>{error}</p>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && loginHistory.length === 0 && (
          <div className="p-8 text-center bg-blue-50 border border-blue-200 text-blue-700 rounded-lg shadow-sm">
            <p className="font-semibold text-lg mb-2">No Login History Available</p>
            <p>It looks like there's no login activity recorded for your account yet.</p>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && loginHistory.length > 0 && (
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">ID</th>
                  <th scope="col" className="px-6 py-3">User ID</th>
                  <th scope="col" className="px-6 py-3">Full Name</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Login Time</th>
                  <th scope="col" className="px-6 py-3">Logout Time</th>
                  <th scope="col" className="px-6 py-3">IP Address</th>
                  <th scope="col" className="px-6 py-3">Location</th>
                  <th scope="col" className="px-6 py-3">Browser</th>
                  <th scope="col" className="px-6 py-3">OS</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((entry) => (
                  <tr key={entry.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{entry.id}</td>
                    <td className="px-6 py-4">{entry.user_details.user_id}</td>
                    <td className="px-6 py-4">{entry.user_details.full_name}</td>
                    <td className="px-6 py-4">{entry.user_details.email}</td>
                    <td className="px-6 py-4">{formatDateTime(entry.login_time)}</td>
                    <td className="px-6 py-4">
                      {entry.logout_time ? formatDateTime(entry.logout_time) : <span className="text-yellow-600 font-semibold italic">Active</span>}
                    </td>
                    <td className="px-6 py-4">{entry.ip_address}</td>
                    <td className="px-6 py-4">{entry.location}</td>
                    <td className="px-6 py-4">{entry.userAgentInfo.browser}</td>
                    <td className="px-6 py-4">{entry.userAgentInfo.os}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          entry.login_status === 'login'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {entry.login_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <nav className="flex flex-col md:flex-row justify-between items-center pt-4" aria-label="Table navigation">
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * PAGE_SIZE + 1}</span>-
              <span className="font-semibold text-gray-900 dark:text-white">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>
            </span>
            <ul className="inline-flex -space-x-px text-sm h-8">
              <li>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconChevronLeft size={16} /> Previous
                </button>
              </li>
              {/* Optional: Render page numbers if you have many pages, but for now, just prev/next */}
              {/* {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                <li key={pageNumber}>
                  <button
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`flex items-center justify-center px-3 h-8 leading-tight ${
                      currentPage === pageNumber
                        ? 'text-blue-600 bg-blue-50 border border-blue-300 hover:bg-blue-100 hover:text-blue-700'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    {pageNumber}
                  </button>
                </li>
              ))} */}
              <li>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <IconChevronRight size={16} />
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </main>
  );
}

export default MyLoginHistory;