import React, { useEffect, useState } from 'react';
import { getData } from '../../../store/httpService';
import { format } from 'date-fns';
import { IconHistory, IconChevronLeft, IconChevronRight, IconSearch, IconX } from '@tabler/icons-react';

const PAGE_SIZE = 10;

// Helper function to parse User Agent string for browser and OS information
const parseUserAgent = (userAgentString) => {
  if (!userAgentString) return { browser: 'Unknown Browser', os: 'Unknown OS', device: 'Unknown Device' };

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Detect OS
  if (/Windows NT/.test(userAgentString)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/.test(userAgentString)) {
    os = 'macOS';
  } else if (/Android/.test(userAgentString)) {
    os = 'Android';
    device = 'Mobile';
  } else if (/iPhone|iPad|iPod/.test(userAgentString)) {
    os = 'iOS';
    device = 'Mobile';
  } else if (/Linux/.test(userAgentString)) {
    os = 'Linux';
  } else if (/CrOS/.test(userAgentString)) {
    os = 'Chrome OS';
  }

  // Detect Browser (order matters: check more specific first)
  if (/Edg\//.test(userAgentString)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//.test(userAgentString)) {
    browser = 'Google Chrome';
  } else if (/Safari\//.test(userAgentString) && !/Chrome|Edg/.test(userAgentString)) {
    browser = 'Safari';
  } else if (/Firefox\//.test(userAgentString)) {
    browser = 'Mozilla Firefox';
  } else if (/Opera|OPR\//.test(userAgentString)) {
    browser = 'Opera';
  } else if (/MSIE|Trident\//.test(userAgentString)) {
    browser = 'Internet Explorer';
  }

  // Basic mobile/tablet detection
  if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgentString)) {
    device = 'Mobile/Tablet';
  }

  return { browser, os, device };
};


function MyEmpLoginHistory() {
  const [allLoginHistory, setAllLoginHistory] = useState([]);
  const [filteredLoginHistory, setFilteredLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    const fetchAllLoginHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getData(`/login-history/?user_type=EmployeeProfile&page_size=9999`);

        if (!response || !response.data || !Array.isArray(response.data.results)) {
          throw new Error('Invalid API response format.');
        }
        setAllLoginHistory(response.data.results);

      } catch (err) {
        console.error('Error fetching all employee login history:', err);
        setError('Failed to load all employee login history. Please try again. ' + (err.message || ''));
        setAllLoginHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllLoginHistory();
  }, []);

  // Client-side Filtering and Pagination
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    // Ensure allLoginHistory is an array before filtering
    const dataToFilter = Array.isArray(allLoginHistory) ? allLoginHistory : [];

    const searchedData = dataToFilter.filter(entry => {
      // Safely access nested properties for search
      const userId = String(entry.user_details?.user_id || '').toLowerCase();
      const fullName = String(entry.user_details?.full_name || '').toLowerCase();
      const email = String(entry.user_details?.email || '').toLowerCase();
      const ipAddress = String(entry.ip_address || '').toLowerCase();
      const location = String(entry.location || '').toLowerCase();
      const loginStatus = String(entry.login_status || '').toLowerCase();

      // Parse user agent for searchability (and later display)
      const { browser, os } = parseUserAgent(entry.user_agent);
      const browserLower = browser.toLowerCase();
      const osLower = os.toLowerCase();

      return (
        userId.includes(lowerCaseQuery) ||
        fullName.includes(lowerCaseQuery) ||
        email.includes(lowerCaseQuery) ||
        ipAddress.includes(lowerCaseQuery) ||
        location.includes(lowerCaseQuery) ||
        loginStatus.includes(lowerCaseQuery) ||
        browserLower.includes(lowerCaseQuery) ||
        osLower.includes(lowerCaseQuery)
      );
    }).map(entry => ({ // Map to add userAgentInfo to each entry for display
        ...entry,
        userAgentInfo: parseUserAgent(entry.user_agent)
    }));

    const newTotalCount = searchedData.length;
    const newTotalPages = Math.ceil(newTotalCount / PAGE_SIZE) || 1;

    const validCurrentPage = Math.min(currentPage, newTotalPages);
    if (currentPage !== validCurrentPage) {
      setCurrentPage(validCurrentPage);
      return;
    }

    const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const pagedData = searchedData.slice(startIndex, endIndex);

    setFilteredLoginHistory(pagedData);
    setTotalCount(newTotalCount);
    setTotalPages(newTotalPages);

  }, [allLoginHistory, searchQuery, currentPage]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      return format(new Date(dateTimeString), 'dd MMM, hh:mm:ss a');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateTimeString;
    }
  };

  return (
    <main className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <IconHistory size={48} className="text-indigo-600" />
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Employee Login History
          </h2>
        </div>

        {/* Search Bar Section */}
        <div className="bg-white rounded-lg shadow-inner border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-grow w-full">
              <input
                type="text"
                id="globalSearch"
                className="block w-full pl-10 pr-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by User ID, Name, Email, IP, Location, Browser, or OS..."
              />
              <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors w-full justify-center sm:w-auto"
              >
                <IconX size={20} className="mr-2" /> Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
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
          {!loading && !error && filteredLoginHistory.length === 0 && (
            <div className="p-8 text-center bg-blue-50 border border-blue-200 text-blue-700 rounded-lg shadow-sm">
              <p className="font-semibold text-lg mb-2">No Login History Available</p>
              <p>It looks like there's no login activity recorded for employees matching your search criteria.</p>
            </div>
          )}

          {/* Data Table */}
          {!loading && !error && filteredLoginHistory.length > 0 && (
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
                <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLoginHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{entry.id}</td>
                      {/* Using optional chaining for safe access */}
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{entry.user_details?.user_id || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{entry.user_details?.full_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{entry.user_details?.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {formatDateTime(entry.login_time)}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {entry.logout_time ? formatDateTime(entry.logout_time) : <span className="text-yellow-600 font-semibold italic">Active</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{entry.ip_address || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{entry.location || 'N/A'}</td>
                      {/* Using optional chaining for safe access to userAgentInfo properties */}
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{entry.userAgentInfo?.browser || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{entry.userAgentInfo?.os || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> entries
              </span>
              <ul className="inline-flex -space-x-px text-sm h-8">
                <li>
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconChevronLeft size={16} className="mr-2" /> Previous
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <IconChevronRight size={16} className="ml-2" />
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}

export default MyEmpLoginHistory;