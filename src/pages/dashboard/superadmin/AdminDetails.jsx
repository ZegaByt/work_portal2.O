import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getData, patchData } from '../../../store/httpService';
import { toast } from 'sonner';

// Helper function to format keys into readable labels
const formatKey = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

function AdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [genderOptions, setGenderOptions] = useState([]);
  const [genderLoading, setGenderLoading] = useState(true);
  const [genderError, setGenderError] = useState(null);

  // Editable fields
  const editableFields = [
    'full_name',
    'email',
    'mobile_number',
    'dob',
    'gender',
    'address',
    'education',
    'emergency_contact',
    'is_active',
  ];

  // Admin detail keys for display order
  const adminDetailKeys = [
    'user_id',
    'full_name',
    'email',
    'mobile_number',
    'dob',
    'gender',
    'address',
    'education',
    'emergency_contact',
    'is_active',
    'created_at',
    'updated_at',
    'created_by',
    'last_updated_by',
  ];

  // Employee detail keys for display order
  const employeeDetailKeys = [
    'user_id',
    'full_name',
    'email',
    'mobile_number',
  ];

  // Fetch admin details and gender options
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch admin details
        const adminResponse = await getData(`/admin/${id}/`);
        setAdmin(adminResponse.data.admin_details);
        setAssignedEmployees(adminResponse.data.assigned_employees || []);
        setFormData(adminResponse.data.admin_details || {});

        // Fetch gender options
        const genderResponse = await getData('/gender');
        setGenderOptions(genderResponse.data.results || []);
        setGenderError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response && err.response.status === 404) {
          setError('Admin not found. The provided ID might be invalid.');
        } else if (err.response && err.response.data && err.response.data.detail) {
          setError(`Error: ${err.response.data.detail}`);
        } else {
          setError('Failed to load admin details. Please try again.');
        }
        setAdmin(null);
        setAssignedEmployees([]);
        setGenderError('Failed to load gender options.');
      } finally {
        setLoading(false);
        setGenderLoading(false);
      }
    }

    fetchData();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle Save
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Identify changed fields
      const changedData = {};
      for (const key of editableFields) {
        if (formData[key] !== admin[key]) {
          if (key === 'gender') {
            // Send gender as ID (number)
            changedData[key] = parseInt(formData[key], 10);
          } else {
            changedData[key] = formData[key];
          }
        }
      }

      if (Object.keys(changedData).length === 0) {
        toast.info('No changes to save.');
        setIsEditing(false);
        return;
      }

      // Send PATCH request
      await patchData(`/admin/${id}/`, changedData);
      toast.success('Admin details updated successfully.');

      // Update admin state with new data
      setAdmin((prev) => ({ ...prev, ...changedData }));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating admin details:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(`Error: ${err.response.data.detail}`);
        toast.error(`Error: ${err.response.data.detail}`);
      } else {
        setError('Failed to update admin details. Please try again.');
        toast.error('Failed to update admin details.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel
  const handleCancel = () => {
    setFormData(admin || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold text-lg">
        {error}
        <button
          onClick={() => navigate('/dashboard/superadmin/all-admins')}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="p-6 text-center text-gray-700 text-lg">
        Admin details not found.
        <button
          onClick={() => navigate('/dashboard/superadmin/all-admins')}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <main className="p-0 sm:p-0 min-h-screen selection:text-white">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 sm:p-8 mt-0">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/dashboard/superadmin/all-admins')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Back to All Admins
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 shadow-md"
            >
              Edit Admin
            </button>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
          Admin Profile
        </h2>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-10">
            <div className="col-span-full">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Edit Personal Information</h3>
              <div className="flex justify-end gap-3 mb-4">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
              </div>
              <div className="space-y-4">
                {editableFields.map((key) => {
                  if (key === 'is_active') {
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={key}
                          checked={formData[key] || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="font-semibold text-gray-900 dark:text-gray-100">{formatKey(key)}</label>
                      </div>
                    );
                  }
                  if (key === 'gender') {
                    return (
                      <div key={key}>
                        <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-1">{formatKey(key)}</label>
                        {genderLoading ? (
                          <p className="text-gray-600 dark:text-gray-400">Loading gender options...</p>
                        ) : genderError ? (
                          <p className="text-red-600">{genderError}</p>
                        ) : (
                          <select
                            name={key}
                            value={formData[key] || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                          >
                            <option value="">Select Gender</option>
                            {genderOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={key}>
                      <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-1">{formatKey(key)}</label>
                      <input
                        type={key === 'dob' ? 'date' : 'text'}
                        name={key}
                        value={formData[key] || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Personal Information</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-base">
                <tbody>
                  {/* Pair up two items per row for better layout */}
                  {adminDetailKeys.reduce((rows, key, index) => {
                    if (index % 2 === 0) {
                      rows.push([]);
                    }
                    rows[rows.length - 1].push(key);
                    return rows;
                  }, []).map((rowKeys, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                      {rowKeys.map((key) => {
                        const value = admin[key];
                        if (value === null || value === undefined || key === 'image') {
                          return null; // Skip rendering if value is null/undefined or it's the image key
                        }

                        let displayValue;
                        if (typeof value === 'boolean') {
                          displayValue = (
                            <span className={`${value ? 'text-green-600' : 'text-red-600'} font-medium`}>
                              {value ? 'Active' : 'Inactive'}
                            </span>
                          );
                        } else if (key.endsWith('_at') && value) {
                          try {
                            const date = new Date(value);
                            displayValue = date.toLocaleString();
                          } catch (e) {
                            displayValue = value; // Fallback if date parsing fails
                          }
                        } else {
                          displayValue = value || 'N/A';
                        }

                        return (
                          <React.Fragment key={key}>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 font-medium whitespace-nowrap">
                              {formatKey(key)}:
                            </td>
                            <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                              {displayValue}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      {/* Add empty cells if the last row has only one item */}
                      {rowKeys.length === 1 && (
                        <>
                          <td className="px-4 py-3 bg-gray-50 dark:bg-gray-800"></td>
                          <td className="px-4 py-3"></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        ---

        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Assigned Employees</h3>
          {assignedEmployees.length > 0 ? (
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="min-w-full bg-white dark:bg-gray-700 rounded-lg text-base">
                <thead>
                  <tr className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700">
                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Employee ID</th>
                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Full Name</th>
                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Email</th>
                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedEmployees.map((employee) => (
                    <tr
                      key={employee.user_id}
                      className="border-b border-gray-100 dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{employee.user_id}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{employee.full_name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{employee.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{employee.mobile_number || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-5 py-4 rounded-lg shadow-md text-base"
              role="alert"
            >
              <span className="block sm:inline ml-2">
                No employees currently assigned to this admin.
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default AdminDetail;