import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Button,
  Text,
  Group,
  Badge,
  Image,
  Divider,
  Modal,
  TextInput,
  Textarea,
  LoadingOverlay,
  ActionIcon,
  Switch,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { getData, postData, putData, deleteData } from '../../../store/httpService';
import { toast } from 'sonner';
import { FaPhone, FaMapMarkerAlt } from 'react-icons/fa';   
import { useAuth } from '../../../contexts/AuthContext'; // Import useAuth to get user role

const Incharges = () => {
  const [incharges, setIncharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opened, setOpened] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_id: '',
    employee_type: 'Incharge',
    contact_number: '',
    area_state: '',
    area: '',
    special_note: '',
    email_id: '',
    employee_image: null,
    is_active: true,
  });
  const [editingInchargeId, setEditingInchargeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(true);
  const [deleteConfirmationOpened, setDeleteConfirmationOpened] = useState(false);
  const [toggleConfirmationOpened, setToggleConfirmationOpened] = useState(false);
  const [currentInchargeId, setCurrentInchargeId] = useState(null);

  // Get user role from AuthContext
  const { userRole } = useAuth();

  // Fetch incharges
  useEffect(() => {
    const fetchIncharges = async () => {
      try {
        setLoading(true);
        const response = await getData('/incharges/admin/');
        if (response.data && response.data.results) {
          setIncharges(response.data.results);
        }
      } catch (err) {
        setError('Failed to load incharges. Please try again later.');
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIncharges();
  }, []);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle file input changes
  const handleFileChange = (file) => {
    setFormData((prev) => ({ ...prev, employee_image: file }));
  };

  // Add or update incharge
  const handleSubmit = async () => {
    const url = editingInchargeId ? `/incharges/admin/${editingInchargeId}/` : '/incharges/admin/';
    const method = editingInchargeId ? putData : postData;

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        formDataToSend.append(key, value);
      }
    });

    try {
      const response = await method(url, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 200 || response.status === 201) {
        if (editingInchargeId) {
          setIncharges(
            incharges.map((incharge) =>
              incharge.incharge_id === editingInchargeId ? response.data : incharge
            )
          );
        } else {
          setIncharges((prev) => [...prev, response.data]);
        }
        setOpened(false);
        resetForm();
        toast.success(editingInchargeId ? 'Incharge updated successfully!' : 'Incharge added successfully!');
      }
    } catch (err) {
      toast.error(editingInchargeId ? 'Failed to update incharge.' : 'Failed to add incharge.');
      console.error(err);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      employee_name: '',
      employee_id: '',
      employee_type: 'Incharge',
      contact_number: '',
      area_state: '',
      area: '',
      special_note: '',
      email_id: '',
      employee_image: null,
      is_active: true,
    });
    setEditingInchargeId(null);
  };

  // Delete incharge
  const handleDelete = async () => {
    try {
      const response = await deleteData(`/incharges/admin/${currentInchargeId}/`);
      if (response.status === 204) {
        setIncharges(incharges.filter((incharge) => incharge.incharge_id !== currentInchargeId));
        toast.success('Incharge deleted successfully!');
      }
    } catch (err) {
      toast.error('Failed to delete incharge.');
      console.error(err);
    } finally {
      setDeleteConfirmationOpened(false);
    }
  };

  // Toggle is_active status
  const handleToggleStatus = async () => {
    const updatedStatus = !formData.is_active;
    const updatedData = { ...formData, is_active: updatedStatus };

    try {
      const response = await putData(`/incharges/admin/${currentInchargeId}/`, updatedData);
      if (response.status === 200) {
        setIncharges(
          incharges.map((incharge) =>
            incharge.incharge_id === currentInchargeId ? response.data : incharge
          )
        );
        toast.success(updatedStatus ? 'Incharge activated successfully!' : 'Incharge deactivated successfully!');
      }
    } catch (err) {
      toast.error('Failed to update incharge status.');
      console.error(err);
    } finally {
      setToggleConfirmationOpened(false);
    }
  };

  // Filter incharges based on is_active status
  const filteredIncharges = incharges.filter((incharge) => incharge.is_active === filterActive);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const defaultImage =
    'https://images.pexels.com/photos/2955376/pexels-photo-2955376.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260';

  if (loading) {
    return (
      <Container size="lg" className="py-12 text-center">
        <LoadingOverlay visible={true} />
        <Text className="text-2xl font-bold text-maroon-500">Loading incharges...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" className="py-12 text-center">
        <Text className="text-2xl font-bold text-red-500">{error}</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <Title order={1} className="text-3xl md:text-4xl font-bold text-maroon-600 mb-4">
          Incharges
        </Title>
        <Divider my="sm" color="maroon" className="w-24 h-1 mx-auto mb-6" />
        <Text className="text-gray-700 max-w-2xl mx-auto">
          Meet our dedicated incharges who are here to assist you with your needs.
        </Text>
      </motion.div>

      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div className="flex space-x-4 mb-4 md:mb-0">
          {/* Conditionally render Add Incharge button only for Admin and SuperAdmin */}
          {userRole === 'Admin' || userRole === 'SuperAdmin' ? (
            <Button
              variant="gradient"
              gradient={{ from: 'maroon', to: 'red', deg: 45 }}
              onClick={() => {
                setOpened(true);
                resetForm();
              }}
            >
              Add Incharge
            </Button>
          ) : null}
          <Button
            variant="outline"
            color={filterActive ? 'gray' : 'green'}
            onClick={() => setFilterActive(true)}
          >
            Online Incharges
          </Button>
          <Button
            variant="outline"
            color={!filterActive ? 'gray' : 'red'}
            onClick={() => setFilterActive(false)}
          >
            Offline Incharges
          </Button>
          <Button
            variant="outline"
            color="blue"
            onClick={() => {
              setFilterActive(true);
              setSearchTerm('');
            }}
          >
            All Incharges
          </Button>
        </div>
        <TextInput
          placeholder="Search by ID, Name, Mobile, Area, State, Type"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {filteredIncharges.length === 0 ? (
          <Text className="text-center text-lg font-semibold">No Incharges Found</Text>
        ) : (
          filteredIncharges
            .filter((incharge) =>
              incharge.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              incharge.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              incharge.contact_number.includes(searchTerm) ||
              incharge.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
              incharge.area_state.toLowerCase().includes(searchTerm.toLowerCase()) ||
              incharge.employee_type.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((incharge) => (
              <motion.div
                key={incharge.incharge_id}
                className="bg-white rounded-xl shadow-lg overflow-hidden card-hover"
                variants={itemVariants}
              >
                <div className="h-64 relative">
                  {incharge.employee_image ? (
                    <Image
                      src={incharge.employee_image}
                      height={256}
                      alt={incharge.employee_name}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.src = defaultImage)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200">
                      <span className="text-4xl font-bold text-gray-500">
                        {incharge.employee_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="font-bold text-2xl mb-2">{incharge.employee_name}</h3>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center text-orange-200">
                          <FaPhone className="mr-1" />
                          <span className="text-sm">{incharge.contact_number}</span>
                        </div>
                        <div className="flex items-center text-orange-200">
                          <FaMapMarkerAlt className="mr-1" />
                          <span className="text-sm">{incharge.area}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <Text size="sm" color="dimmed" className="mb-2">
                    <span className="font-semibold">Type:</span> {incharge.employee_type}
                  </Text>
                  <Text size="sm" color="dimmed" className="mb-2">
                    <span className="font-semibold">State:</span> {incharge.area_state}
                  </Text>
                  <Text size="sm" color="dimmed" className="mb-2">
                    <span className="font-semibold">Special Note:</span> {incharge.special_note || '-'}
                  </Text>
                  <Group position="apart" mt="md">
                    <Badge color={incharge.is_active ? 'teal' : 'red'} variant="light">
                      {incharge.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {/* Conditionally render Edit and Delete icons only for Admin and SuperAdmin */}
                    {userRole === 'Admin' || userRole === 'SuperAdmin' ? (
                      <div className="flex items-center">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => {
                            setEditingInchargeId(incharge.incharge_id);
                            setFormData({
                              employee_name: incharge.employee_name,
                              employee_id: incharge.employee_id,
                              employee_type: incharge.employee_type,
                              contact_number: incharge.contact_number,
                              area_state: incharge.area_state,
                              area: incharge.area,
                              special_note: incharge.special_note,
                              email_id: incharge.email_id,
                              employee_image: null,
                              is_active: incharge.is_active,
                            });
                            setOpened(true);
                          }}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => {
                            setCurrentInchargeId(incharge.incharge_id);
                            setDeleteConfirmationOpened(true);
                          }}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </div>
                    ) : null}
                  </Group>
                </div>
              </motion.div>
            ))
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteConfirmationOpened}
        onClose={() => setDeleteConfirmationOpened(false)}
        title="Confirm Deletion"
      >
        <Text>Are you sure you want to delete this incharge? This action cannot be undone.</Text>
        <Group position="right" mt="md">
          <Button variant="outline" onClick={() => setDeleteConfirmationOpened(false)}>Cancel</Button>
          <Button color="red" onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>

      {/* Toggle Status Confirmation Modal */}
      <Modal
        opened={toggleConfirmationOpened}
        onClose={() => setToggleConfirmationOpened(false)}
        title="Confirm Status Change"
      >
        <Text>This incharge will be marked as {formData.is_active ? 'inactive' : 'active'}. Are you sure?</Text>
        <Group position="right" mt="md">
          <Button variant="outline" onClick={() => setToggleConfirmationOpened(false)}>Cancel</Button>
          <Button color="green" onClick={handleToggleStatus}>Confirm</Button>
        </Group>
      </Modal>

      {/* Add/Edit Incharge Modal - Only shown for Admin and SuperAdmin due to button condition above */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={editingInchargeId ? 'Edit Incharge' : 'Add Incharge'}
        size="lg"
        centered
      >
        <LoadingOverlay visible={loading} />
        <div className="space-y-4">
          <TextInput
            label="Employee Name"
            value={formData.employee_name}
            onChange={(e) => handleInputChange('employee_name', e.target.value)}
            required
          />
          <TextInput
            label="Employee ID"
            value={formData.employee_id}
            onChange={(e) => handleInputChange('employee_id', e.target.value)}
            required
          />
          <TextInput
            label="Employee Type"
            value={formData.employee_type}
            onChange={(e) => handleInputChange('employee_type', e.target.value)}
            required
          />
          <TextInput
            label="Contact Number"
            value={formData.contact_number}
            onChange={(e) => handleInputChange('contact_number', e.target.value)}
            required
          />
          <TextInput
            label="Area State"
            value={formData.area_state}
            onChange={(e) => handleInputChange('area_state', e.target.value)}
            required
          />
          <TextInput
            label="Area"
            value={formData.area}
            onChange={(e) => handleInputChange('area', e.target.value)}
            required
          />
          <Textarea
            label="Special Note"
            value={formData.special_note}
            onChange={(e) => handleInputChange('special_note', e.target.value)}
          />
          <TextInput
            label="Email ID"
            value={formData.email_id}
            onChange={(e) => handleInputChange('email_id', e.target.value)}
            required
          />
          <TextInput
            label="Employee Image"
            type="file"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />
          <Group position="apart" mt="md">
            <Text>Is Active:</Text>
            <Switch
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.currentTarget.checked)}
            />
          </Group>
          <Button
            variant="gradient"
            gradient={{ from: 'maroon', to: 'red', deg: 45 }}
            onClick={handleSubmit}
          >
            {editingInchargeId ? 'Update' : 'Add'} Incharge
          </Button>
        </div>
      </Modal>
    </Container>
  );
};

export default Incharges;
