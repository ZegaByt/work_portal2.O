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
  FileInput,
  Switch,
  ActionIcon,
  LoadingOverlay,
} from '@mantine/core';
import { IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaHeart, FaCalendarAlt, FaMapMarkerAlt, FaQuoteLeft, FaQuoteRight } from 'react-icons/fa';
import { getData, postData, putData } from '../../../store/httpService';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext'; // Import useAuth to get user role

const SuccessStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opened, setOpened] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    groom_name: '',
    groom_id: '',
    groom_mobile_number: '',
    bride_name: '',
    bride_id: '',
    bride_mobile_number: '',
    marriage_date: '',
    marriage_done_by: '',
    groom_address: '',
    bride_address: '',
    marriage_photo1: null,
    marriage_photo2: null,
    marriage_photo3: null,
    success_story: '',
    special_note: '',
    type: '',
    marriage_location: '',
    marriage_profile_approval: false, // Default to false for all, will be overridden based on role
  });
  const [editingId, setEditingId] = useState(null);
  const { userRole } = useAuth(); // Get user role from AuthContext

  // Determine if the user is an Employee
  const isEmployee = userRole === 'Employee';

  // Fetch success stories
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const response = await getData('/married-profiles/all/');
        if (response.data && response.data.results) {
          setStories(response.data.results);
        }
      } catch (err) {
        setError('Failed to load success stories. Please try again later.');
        toast.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  // Filter stories based on selected category
  const filteredStories = filter === 'all'
    ? stories.filter(story => story.marriage_profile_approval)
    : filter === 'unapproved'
    ? stories.filter(story => !story.marriage_profile_approval)
    : stories.filter(story => story.type.toLowerCase() === filter);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle file input changes
  const handleFileChange = (field, file) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  // Add or update story
  const handleSubmit = async () => {
    const url = editingId
      ? `/married-profiles/admin/get-update/${editingId}/`
      : '/married-profiles/create/';
    const method = editingId ? putData : postData;

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        if (key.includes('marriage_photo')) {
          if (value instanceof File) formDataToSend.append(key, value);
        } else if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      }
    });

    try {
      const response = await method(url, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status === 200 || response.status === 201) {
        const updatedStories = editingId
          ? stories.map((story) =>
              story.married_profile_id === editingId ? response.data : story
            )
          : [...stories, response.data];
        setStories(updatedStories);
        setOpened(false);
        setEditingId(null);
        setFormData({
          groom_name: '',
          groom_id: '',
          groom_mobile_number: '',
          bride_name: '',
          bride_id: '',
          bride_mobile_number: '',
          marriage_date: '',
          marriage_done_by: '',
          groom_address: '',
          bride_address: '',
          marriage_photo1: null,
          marriage_photo2: null,
          marriage_photo3: null,
          success_story: '',
          special_note: '',
          type: '',
          marriage_location: '',
          marriage_profile_approval: isEmployee ? false : true, // Default based on role
        });
        toast.success(`Success story ${editingId ? 'updated' : 'added'} successfully!`);
      }
    } catch (err) {
      toast.error(`Failed to ${editingId ? 'update' : 'add'} success story.`);
      console.error(err);
    }
  };

  // Toggle approval status (only for Admin/SuperAdmin)
  const handleToggleApproval = async (id, currentApproval) => {
    try {
      const response = await putData(`/married-profiles/admin/get-update/${id}/`, {
        marriage_profile_approval: !currentApproval,
      });
      if (response.status === 200) {
        setStories(
          stories.map((story) =>
            story.married_profile_id === id
              ? { ...story, marriage_profile_approval: !currentApproval }
              : story
          )
        );
        toast.success('Approval status updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to update approval status.');
      console.error(err);
    }
  };

  // Edit story
  const handleEdit = (story) => {
    setEditingId(story.married_profile_id);
    setFormData({
      groom_name: story.groom_name,
      groom_id: story.groom_id,
      groom_mobile_number: story.groom_mobile_number,
      bride_name: story.bride_name,
      bride_id: story.bride_id,
      bride_mobile_number: story.bride_mobile_number,
      marriage_date: story.marriage_date,
      marriage_done_by: story.marriage_done_by,
      groom_address: story.groom_address,
      bride_address: story.bride_address,
      marriage_photo1: null,
      marriage_photo2: null,
      marriage_photo3: null,
      success_story: story.success_story,
      special_note: story.special_note,
      type: story.type,
      marriage_location: story.marriage_location,
      marriage_profile_approval: story.marriage_profile_approval,
    });
    setOpened(true);
  };

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

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
  };

  const defaultImage = `${import.meta.env.VITE_BASE_MEDIA_URL}/media/assets/ai_marriage.png`;


  if (loading) {
    return (
      <Container size="lg" className="py-12 text-center">
        <LoadingOverlay visible={true} />
        <Text className="text-2xl font-bold text-maroon-500">Loading stories...</Text>
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
          Success Stories
        </Title>
        <Divider my="sm" color="maroon" className="w-24 h-1 mx-auto mb-6" />
        <Text className="text-gray-700 max-w-2xl mx-auto">
          Hundreds of couples have found their perfect match through our services.
          Read their heartwarming stories and be inspired by their journey to marital bliss.
        </Text>
      </motion.div>

      <div className="flex justify-between mb-6">
        <Button
          variant="gradient"
          gradient={{ from: 'maroon', to: 'red', deg: 45 }}
          onClick={() => {
            setEditingId(null);
            setFormData({
              groom_name: '',
              groom_id: '',
              groom_mobile_number: '',
              bride_name: '',
              bride_id: '',
              bride_mobile_number: '',
              marriage_date: '',
              marriage_done_by: '',
              groom_address: '',
              bride_address: '',
              marriage_photo1: null,
              marriage_photo2: null,
              marriage_photo3: null,
              success_story: '',
              special_note: '',
              type: '',
              marriage_location: '',
              marriage_profile_approval: isEmployee ? false : true, // Default based on role
            });
            setOpened(true);
          }}
        >
          Add Success Story
        </Button>
        <Button
          variant="outline"
          color="red"
          onClick={() => setFilter('unapproved')}
        >
          Show Unapproved
        </Button>
      </div>

      {/* Filter Navbar */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-white rounded-lg shadow-md p-1">
          <Button
            variant={filter === 'all' ? 'gradient' : 'default'}
            gradient={filter === 'all' ? { from: 'maroon', to: 'red', deg: 45 } : undefined}
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
              filter === 'all' ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Live Stories
          </Button>
          <Button
            variant={filter === 'arranged' ? 'gradient' : 'default'}
            gradient={filter === 'arranged' ? { from: 'maroon', to: 'red', deg: 45 } : undefined}
            onClick={() => setFilter('arranged')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
              filter === 'arranged' ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Traditional Matches
          </Button>
          <Button
            variant={filter === 'nri' ? 'gradient' : 'default'}
            gradient={filter === 'nri' ? { from: 'maroon', to: 'red', deg: 45 } : undefined}
            onClick={() => setFilter('nri')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
              filter === 'nri' ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            NRI Success
          </Button>
          <Button
            variant={filter === 'doctor' ? 'gradient' : 'default'}
            gradient={filter === 'doctor' ? { from: 'maroon', to: 'red', deg: 45 } : undefined}
            onClick={() => setFilter('doctor')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
              filter === 'doctor' ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Doctor Couples
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        key={filter}
      >
        {filteredStories.map((story) => {
          const photos = [];
          if (story.marriage_photo1) photos.push(story.marriage_photo1);
          if (story.marriage_photo2) photos.push(story.marriage_photo2);
          if (story.marriage_photo3) photos.push(story.marriage_photo3);

          return (
            <motion.div
              key={story.married_profile_id}
              className="bg-white rounded-xl shadow-lg overflow-hidden card-hover"
              variants={itemVariants}
            >
              <div className="h-64 relative">
                {photos.length > 0 ? (
                  <Slider {...carouselSettings} className="w-full h-full">
                    {photos.map((photo, index) => (
                      <div key={index} className="w-full h-64">
                        <Image
                          src={photo}
                          height={256}
                          alt={`${story.groom_name} & ${story.bride_name} Wedding`}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.src = defaultImage)}
                        />
                      </div>
                    ))}
                  </Slider>
                ) : (
                  <Image
                    src={defaultImage}
                    height={256}
                    alt={`${story.groom_name} & ${story.bride_name}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6 text-white">
                    <h3 className="font-bold text-2xl mb-2">{`${story.groom_name} & ${story.bride_name}`}</h3>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center text-orange-200">
                        <FaCalendarAlt className="mr-1" />
                        <span className="text-sm">{story.marriage_date}</span>
                      </div>
                      <div className="flex items-center text-orange-200">
                        <FaMapMarkerAlt className="mr-1" />
                        <span className="text-sm">{story.marriage_location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center">
                    <FaHeart className="text-red-500 mr-1.5" />
                    <span className="text-xs font-medium">Happily Married</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex mb-4">
                  <FaQuoteLeft className="text-yellow-500 mr-2 flex-shrink-0 transform -translate-y-2" />
                  <p className="text-gray-700">{story.success_story}</p>
                  <FaQuoteRight className="text-yellow-500 ml-2 self-end flex-shrink-0" />
                </div>
                <div className="mt-2 text-gray-700">
                  <span className="font-medium">Marriage Done By: </span>
                  <span>{story.marriage_done_by}</span>
                </div>
                <Group position="apart" mt="md">
                  <Badge
                    color={
                      story.type.toLowerCase() === 'nri'
                        ? 'teal'
                        : story.type.toLowerCase() === 'arranged'
                        ? 'violet'
                        : 'indigo'
                    }
                    variant="light"
                  >
                    {story.type}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {!isEmployee && (
                      <Switch
                        checked={story.marriage_profile_approval}
                        onChange={() =>
                          handleToggleApproval(story.married_profile_id, story.marriage_profile_approval)
                        }
                        color={story.marriage_profile_approval ? 'teal' : 'red'}
                        size="md"
                        thumbIcon={
                          story.marriage_profile_approval ? (
                            <IconCheck size={12} />
                          ) : (
                            <IconX size={12} />
                          )
                        }
                      />
                    )}
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleEdit(story)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </div>
                </Group>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {filteredStories.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-800 mb-2">No stories found</h3>
          <p className="text-gray-600">Please try selecting a different category.</p>
        </div>
      )}

      <motion.div
        className="mt-16 bg-white rounded-xl shadow-lg p-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="        text-2xl font-bold text-maroon-500 mb-4">Share Your Success Story</h2>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          Found your perfect match through Goud's Marriage Bureau? We'd love to hear your story!
          Share your experience and inspire others on their journey to finding love.
        </p>
        <Button
          variant="gradient"
          gradient={{ from: 'maroon', to: 'red', deg: 45 }}
          onClick={() => setOpened(true)}
          className="inline-block"
        >
          Submit Your Story
        </Button>
      </motion.div>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={editingId ? 'Edit Success Story' : 'Add Success Story'}
        size="lg"
        centered
      >
        <LoadingOverlay visible={loading} />
        <div className="space-y-4">
          <TextInput
            label="Groom Name"
            value={formData.groom_name}
            onChange={(e) => handleInputChange('groom_name', e.target.value)}
            required
          />
          <TextInput
            label="Groom ID"
            value={formData.groom_id}
            onChange={(e) => handleInputChange('groom_id', e.target.value)}
            required
          />
          <TextInput
            label="Groom Mobile Number"
            value={formData.groom_mobile_number}
            onChange={(e) => handleInputChange('groom_mobile_number', e.target.value)}
            required
          />
          <TextInput
            label="Bride Name"
            value={formData.bride_name}
            onChange={(e) => handleInputChange('bride_name', e.target.value)}
            required
          />
          <TextInput
            label="Bride ID"
            value={formData.bride_id}
            onChange={(e) => handleInputChange('bride_id', e.target.value)}
            required
          />
          <TextInput
            label="Bride Mobile Number"
            value={formData.bride_mobile_number}
            onChange={(e) => handleInputChange('bride_mobile_number', e.target.value)}
            required
          />
          <TextInput
            label="Marriage Date"
            type="date"
            value={formData.marriage_date}
            onChange={(e) => handleInputChange('marriage_date', e.target.value)}
            required
          />
          <TextInput
            label="Marriage Done By"
            value={formData.marriage_done_by}
            onChange={(e) => handleInputChange('marriage_done_by', e.target.value)}
            required
          />
          <TextInput
            label="Groom Address"
            value={formData.groom_address}
            onChange={(e) => handleInputChange('groom_address', e.target.value)}
            required
          />
          <TextInput
            label="Bride Address"
            value={formData.bride_address}
            onChange={(e) => handleInputChange('bride_address', e.target.value)}
            required
          />
          <FileInput
            label="Marriage Photo 1"
            accept="image/jpeg,image/jpg"
            value={formData.marriage_photo1}
            onChange={(file) => handleFileChange('marriage_photo1', file)}
          />
          <FileInput
            label="Marriage Photo 2"
            accept="image/jpeg,image/jpg"
            value={formData.marriage_photo2}
            onChange={(file) => handleFileChange('marriage_photo2', file)}
          />
          <FileInput
            label="Marriage Photo 3"
            accept="image/jpeg,image/jpg"
            value={formData.marriage_photo3}
            onChange={(file) => handleFileChange('marriage_photo3', file)}
          />
          <Textarea
            label="Success Story"
            value={formData.success_story}
            onChange={(e) => handleInputChange('success_story', e.target.value)}
            required
          />
          <TextInput
            label="Special Note"
            value={formData.special_note}
            onChange={(e) => handleInputChange('special_note', e.target.value)}
          />
          <TextInput
            label="Type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            placeholder="e.g., NRI, Arranged, Doctor"
            required
          />
          <TextInput
            label="Marriage Location"
            value={formData.marriage_location}
            onChange={(e) => handleInputChange('marriage_location', e.target.value)}
            required
          />
          {!isEmployee && (
            <Switch
              label="Marriage Profile Approval"
              checked={formData.marriage_profile_approval}
              onChange={(e) => handleInputChange('marriage_profile_approval', e.target.checked)}
            />
          )}
          <Button
            variant="gradient"
            gradient={{ from: 'maroon', to: 'red', deg: 45 }}
            onClick={handleSubmit}
          >
            {editingId ? 'Update' : 'Add'} Story
          </Button>
        </div>
      </Modal>
    </Container>
  );
};

export default SuccessStories;
