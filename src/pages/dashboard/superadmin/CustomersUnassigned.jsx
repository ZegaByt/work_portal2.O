import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData, postData } from '../../../store/httpService';

const CustomersUnassigned = () => {
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '', success: false });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch unassigned customers
    getData('customers/unassigned/')
      .then(response => {
        setCustomers(response.data.results);
      })
      .catch(error => console.error('Error fetching customers:', error));

    // Fetch employees
    getData('employees/')
      .then(response => {
        setEmployees(response.data);
      })
      .catch(error => console.error('Error fetching employees:', error));
  }, []);

  const handleCardClick = (customerId) => {
    navigate(`/dashboard/superadmin/customer/${customerId}`);
  };

  const handleAssignClick = (customer, e) => {
    e.stopPropagation(); // Prevent card click navigation
    setSelectedCustomer(customer);
    setShowDropdown(true);
  };

  const handleSubmit = () => {
    if (!selectedEmployee) return;

    const data = {
      employee_user_id: selectedEmployee,
      customer_user_id: selectedCustomer.user_id
    };

    postData('assign/customer-to-employee/', data)
      .then(() => {
        setPopup({ show: true, message: 'Assigned successfully', success: true });
        setCustomers(customers.filter(c => c.user_id !== selectedCustomer.user_id));
        setShowDropdown(false);
        setSelectedCustomer(null);
        setSelectedEmployee('');
      })
      .catch(() => {
        setPopup({ show: true, message: 'Failed to assign', success: false });
      });

    setTimeout(() => setPopup({ show: false, message: '', success: false }), 3000);
  };

  const handleCancel = () => {
    setShowDropdown(false);
    setSelectedCustomer(null);
    setSelectedEmployee('');
  };

  const getInitials = (name) => {
    return name.split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Unassigned Customers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(customer => (
          <div
            key={customer.user_id}
            className="border rounded-lg p-4 shadow-md hover:shadow-lg cursor-pointer"
            onClick={() => handleCardClick(customer.user_id)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {customer.profile_photos ? (
                  <img src={customer.profile_photos} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(customer.full_name)
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{customer.full_name}</h2>
                <p className="text-sm text-gray-600">ID: {customer.user_id}</p>
                <p className="text-sm text-gray-600">Gender: {customer.gender}</p>
                <p className="text-sm text-gray-600">Age: N/A</p>
              </div>
            </div>
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={(e) => handleAssignClick(customer, e)}
            >
              Assign Employee
            </button>
          </div>
        ))}
      </div>

      {showDropdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Assign Employee to {selectedCustomer?.full_name}</h2>
            <select
              className="w-full p-2 border rounded mb-4"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Select an employee</option>
              {employees.map(employee => (
                <option key={employee.user_id} value={employee.user_id}>
                  {employee.full_name} ({employee.user_id})
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleSubmit}
                disabled={!selectedEmployee}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {popup.show && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg text-white ${popup.success ? 'bg-green-500' : 'bg-red-500'}`}>
          {popup.message}
        </div>
      )}
    </div>
  );
};

export default CustomersUnassigned;