import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getData, patchData, postData } from '../../../store/httpService';
import { toast } from 'sonner';

function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [genderOptions, setGenderOptions] = useState([]);
  const [genderLoading, setGenderLoading] = useState(true);
  const [genderError, setGenderError] = useState(null);
  const [adminOptions, setAdminOptions] = useState([]);
  const [isChangingAdmin, setIsChangingAdmin] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState('');

  // Editable fields for employee_details
  const editableFields = [
    'full_name',
    'email',
    'mobile_number',
    'dob',
    'gender',
    'address',
    'emergency_contact',
    'education',
    'district',
    'state',
    'is_active',
  ];

  // Fetch employee details, gender options, and admin options
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch employee details
        const response = await getData(`/employee/${id}/`);
        setEmployeeData(response.data);
        setFormData(response.data.employee_details || {});

        // Fetch gender options
        const genderResponse = await getData('/gender');
        setGenderOptions(genderResponse.data.results || []);

        // Fetch admin options
        const adminResponse = await getData('/admins');
        setAdminOptions(adminResponse.data || []);
        setGenderError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response && err.response.status === 404) {
          setError('Employee not found. The provided ID might be invalid.');
        } else if (err.response && err.response.data && err.response.data.detail) {
          setError(`Error: ${err.response.data.detail}`);
        } else {
          setError('Failed to load employee details. Please try again.');
        }
        setEmployeeData(null);
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

  // Handle Save for employee details
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Identify changed fields
      const changedData = {};
      for (const key of editableFields) {
        if (formData[key] !== employeeData.employee_details[key]) {
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
      await patchData(`/employee/${id}/`, changedData);
      toast.success('Employee details updated successfully.');

      // Update employeeData state with new data
      setEmployeeData((prev) => ({
        ...prev,
        employee_details: { ...prev.employee_details, ...changedData },
      }));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating employee details:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(`Error: ${err.response.data.detail}`);
        toast.error(`Error: ${err.response.data.detail}`);
      } else {
        setError('Failed to update employee details. Please try again.');
        toast.error('Failed to update employee details.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel for employee details
  const handleCancel = () => {
    setFormData(employeeData.employee_details || {});
    setIsEditing(false);
  };

  // Handle Change Admin
  const handleChangeAdmin = async () => {
    if (!selectedAdmin) {
      toast.error('Please select an admin.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Send POST request to assign admin
      const payload = {
        employee_user_id: employeeData.employee_details.user_id,
        admin_user_id: selectedAdmin,
      };
      await postData('/assign/employee-to-admin/', payload);
      toast.success('Admin assigned successfully.');

      // Fetch updated employee data to reflect new admin details
      const response = await getData(`/employee/${id}/`);
      setEmployeeData(response.data);
      setIsChangingAdmin(false);
      setSelectedAdmin('');
    } catch (err) {
      console.error('Error assigning admin:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(`Error: ${err.response.data.detail}`);
        toast.error(`Error: ${err.response.data.detail}`);
      } else {
        setError('Failed to assign admin. Please try again.');
        toast.error('Failed to assign admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel for admin change
  const handleCancelAdminChange = () => {
    setIsChangingAdmin(false);
    setSelectedAdmin('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto py-6">
        {/* Buttons */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/dashboard/superadmin/all-employees')}
            className="flex items-center gap-2 px-6 py-2 bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
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
            Back to All Employees
          </button>
          {!isEditing && !isChangingAdmin && (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
              >
                Edit Employee
              </button>
              <button
                onClick={() => setIsChangingAdmin(true)}
                className="px-6 py-2 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2"
              >
                Change Admin
              </button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div
            className="bg-red-50 border border-red-300 text-red-700 px-5 py-4 rounded-lg shadow-md mb-6"
            role="alert"
          >
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {/* Conditional Rendering */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500"></div>
            <p className="mt-5 text-gray-600 text-lg">Loading employee details...</p>
          </div>
        ) : (
          employeeData ? (
            <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200 transform hover:scale-[1.005] transition-transform duration-300 ease-in-out">
              <h2 className="text-3xl text-gray-800 mb-6 pb-4 border-b border-gray-200 text-center sm:text-left">
                Employee Profile
              </h2>

              {/* Employee Details */}
              <section className="mb-10">
                <h3 className="text-xl text-blue-600 mb-6 pb-2 border-b border-blue-100">Personal Details</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="flex justify-end gap-3 col-span-2">
                      <button
                        onClick={handleCancel}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md hover:bg-gray-200 transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all duration-300"
                      >
                        Save
                      </button>
                    </div>
                    {editableFields.map((key) => (
                      <div key={key}>
                        <label className="block text-gray-700 font-medium mb-2">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                        </label>
                        {key === 'is_active' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name={key}
                              checked={formData[key] || false}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-200 rounded"
                            />
                            <span className="text-gray-700 font-medium">
                              {formData[key] ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ) : key === 'gender' ? (
                          genderLoading ? (
                            <p className="text-gray-600">Loading gender options...</p>
                          ) : genderError ? (
                            <p className="text-red-600">{genderError}</p>
                          ) : (
                            <select
                              name={key}
                              value={formData[key] || ''}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                            >
                              <option value="">Select Gender</option>
                              {genderOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          )
                        ) : (
                          <input
                            type={key === 'dob' ? 'date' : 'text'}
                            name={key}
                            value={formData[key] || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg text-base">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">User ID:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.user_id}</td>
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">Full Name:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.full_name}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">Email:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.email}</td>
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">Mobile Number:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.mobile_number}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">Date of Birth:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.dob}</td>
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">Address:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.address}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">Emergency Contact:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.emergency_contact}</td>
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">Gender:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.gender || 'N/A'}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">Education:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.education || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">District:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.district || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">State:</td>
                          <td className="px-4 py-3 text-gray-800">{employeeData.employee_details.state || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600 bg-gray-50">Active:</td>
                          <td className="px-4 py-3 text-gray-800">
                            <span className={`${employeeData.employee_details.is_active ? 'text-green-600' : 'text-red-600'} font-medium`}>
                              {employeeData.employee_details.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Admin Details (if available) */}
              {employeeData.admin_details && (
                <section className="mb-10">
                  <h3 className="text-xl text-blue-600 mb-6 pb-2 border-b border-blue-100">Managed By Admin</h3>
                  {isChangingAdmin ? (
                    <div className="mb-6">
                      <div className="flex justify-end gap-3 mb-4">
                        <button
                          onClick={handleCancelAdminChange}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md hover:bg-gray-200 transition-all duration-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleChangeAdmin}
                          className="px-6 py-2 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all duration-300"
                        >
                          Save
                        </button>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Select Admin</label>
                        <select
                          value={selectedAdmin}
                          onChange={(e) => setSelectedAdmin(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                        >
                          <option value="">Select Admin</option>
                          {adminOptions.map((admin) => (
                            <option key={admin.user_id} value={admin.user_id}>
                              {admin.full_name} ({admin.user_id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg text-base">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="px-4 py-3 text-gray-600 bg-gray-50">Admin ID:</td>
                            <td className="px-4 py-3 text-gray-800">{employeeData.admin_details.user_id}</td>
                            <td className="px-4 py-3 text-gray-600 bg-gray-50">Admin Name:</td>
                            <td className="px-4 py-3 text-gray-800">{employeeData.admin_details.full_name}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-gray-600 bg-gray-50">Admin Email:</td>
                            <td className="px-4 py-3 text-gray-800">{employeeData.admin_details.email}</td>
                            <td className="px-4 py-3 text-gray-600 bg-gray-50">Admin Mobile:</td>
                            <td className="px-4 py-3 text-gray-800">{employeeData.admin_details.mobile_number}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {/* Assigned Customers */}
              <section>
                <h3 className="text-xl text-blue-600 mb-6 pb-2 border-b border-blue-100">Assigned Customers</h3>
                {employeeData.assigned_customers && employeeData.assigned_customers.length > 0 ? (
                  <div className="overflow-x-auto shadow-md rounded-lg">
                    <table className="min-w-full bg-white rounded-lg text-base">
                      <thead>
                        <tr className="bg-blue-50 border-b border-blue-200">
                          <th className="px-4 py-3 text-left text-gray-700">Customer ID</th>
                          <th className="px-4 py-3 text-left text-gray-700">Full Name</th>
                          <th className="px-4 py-3 text-left text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-gray-700">Mobile</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeData.assigned_customers.map((customer) => (
                          <tr
                            key={customer.user_id}
                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200"
                          >
                            <td className="px-4 py-3 text-gray-700">{customer.user_id}</td>
                            <td className="px-4 py-3 text-gray-700">{customer.full_name}</td>
                            <td className="px-4 py-3 text-gray-700">{customer.email || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-700">{customer.mobile_number || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 italic p-5 bg-yellow-50 rounded-lg border border-yellow-200 text-base">
                    No customers currently assigned to this employee.
                  </p>
                )}
              </section>
            </div>
          ) : (
            <div
              className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-5 py-4 rounded-lg shadow-md text-base mb-6"
              role="alert"
            >
              <span className="block sm:inline ml-2">
                No employee data found for the provided ID. It might have been removed or the ID is incorrect.
              </span>
            </div>
          )
        )}

        <style>{`
          /* Custom spin animation for loading state */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    </main>
  );
}

export default EmployeeDetail;