import React, { useState, useEffect, useCallback, Component, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext"; // Re-introducing this import
import { getData, postData } from "../../../store/httpService"; // Re-introducing this import
import { toast } from "sonner";
import Cookies from "js-cookie";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid"; // Re-introducing this import

// Inline SVG definitions for icons (as external imports might cause issues)
const IconNotes = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"></path><line x1="9" y1="9" x2="10" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>;
const IconPhoneCall = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5-2.5l5 2l4 4V5a2 2 0 0 0-2-2c-1.8 0-3 0.5-4 1.5L9 9L5 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10"></path></svg>;
const IconUserScan = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12a2 0 1 0 0-4a2 0 0 0 0 4Z"/><path d="M8 21v-1a2 0 0 1 2-2h4a2 0 0 1 2 2v1"/><path d="M15 1v4"/><path d="M18 3l2 2"/><path d="M21 8h-4"/><path d="M20 15l2 2"/><path d="M15 23v-4"/><path d="M8 3l-2 2"/><path d="M3 8h4"/><path d="M4 15l-2 2"/></svg>;
const IconCurrencyRupee = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 7.5V3H6v18h12V10.5"/><path d="M10 12h6"/><path d="M10 16h6"/><path d="M10 8h6"/></svg>;
const IconArrowForward = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14l4-4l-4-4"/><path d="M19 10H5"/></svg>;
const IconMessageCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1.01 6.76 2.84L21 3v6h-6"></path></svg>;
const IconClockHour12 = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"/><path d="M12 7v5l2 2"/></svg>;
const IconArrowsShuffle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 4l3 3l-3 3"/><path d="M18 7H3"/><path d="M6 20l-3-3l3-3"/><path d="M6 17h15"/></svg>;
const IconHeartFilled = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19.5 12.572l-7.5 7.5l-7.5-7.5a5 5 0 1 1 7.5-6.566a5 5 0 1 1 7.5 6.566Z"/></svg>;
const IconGift = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8H21V12C21 13.1046 20.1046 14 19 14H5C3.89543 14 3 13.1046 3 12V8Z"/><path d="M12 14V21"/><path d="M19 12V21"/><path d="M5 12V21"/><path d="M17 8H21V5C21 3.89543 20.1046 3 19 3H17V8Z"/><path d="M7 8H3V5C3 3.89543 3.89543 3 5 3H7V8Z"/></svg>;
const IconUserOff = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a3 0 1 1-6 0a3 0 0 1 6 0Z"/><path d="M12 14a7 0 0 0-7 7v1h14v-1a7 0 0 0-7-7Z"/><path d="M19 19L21 21M21 19L19 21"/></svg>;
const IconAlertCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>;
const IconSearch = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M21 21l-6-6"/></svg>;
const IconCalendarEvent = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5m0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M8 15h2"/><path d="M12 15h2"/><path d="M16 15h2"/><path d="M8 19h2"/><path d="M12 19h2"/><path d="M16 19h2"/></svg>;
const IconFile = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 0 0 0 1 1h4"/><path d="M17 21H7a2 0 0 1-2-2V5a2 0 0 1 2-2h7l5 5v11a2 0 0 1-2 2z"/></svg>;


// Error Boundary Component
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    console.error("ErrorBoundary Caught Error:", error);
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <p className="text-red-600 font-normal">Error: {this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// AudioPlayer Component
const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const togglePlay = () => setIsPlaying(!audio.paused);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', togglePlay);
    audio.addEventListener('pause', togglePlay);
    audio.addEventListener('ended', () => setIsPlaying(false)); // Reset play state on end

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('play', togglePlay);
      audio.removeEventListener('pause', togglePlay);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [src]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = e.target.value;
      setCurrentTime(e.target.value);
    }
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-inner w-full">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <div className="flex items-center w-full justify-center space-x-3 mb-2">
        <button
          onClick={() => skip(-5)}
          className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors shadow-md"
          aria-label="Skip backward 5 seconds"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7l7-7"/></svg>
        </button>
        <button
          onClick={togglePlayPause}
          className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors transform scale-105 shadow-lg"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
        <button
          onClick={() => skip(5)}
          className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors shadow-md"
          aria-label="Skip forward 5 seconds"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7l-7 7"/></svg>
        </button>
      </div>
      <div className="flex items-center w-full space-x-2">
        <span className="text-xs text-gray-600 dark:text-gray-300">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-blue-500"
          style={{
            backgroundSize: `${(currentTime / duration) * 100}% 100%`,
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'linear-gradient(to right, var(--tw-gradient-stops))',
            '--tw-gradient-from': '#3b82f6', // blue-500
            '--tw-gradient-to': '#3b82f6',   // blue-500
          }}
        />
        <span className="text-xs text-gray-600 dark:text-gray-300">{formatTime(duration)}</span>
      </div>
    </div>
  );
};

// Image Zoom Modal Component
const ImageZoomModal = ({ src, onClose }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (src) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl transform transition-all duration-300 ease-out scale-100 animate-zoom-in"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
      >
        <img
          src={src}
          alt="Zoomed image"
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/600x400/cccccc/000000?text=Image+Load+Error";
          }}
        />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 bg-white bg-opacity-30 text-white rounded-full hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200"
          aria-label="Close image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
};

// Define the fixed order of stages for tracking
const STAGE_ORDER = [
  { name: "General Note", icon: IconNotes },
  { name: "Call Status", icon: IconPhoneCall },
  { name: "Profile Status", icon: IconUserScan },
  { name: "Payment Details", icon: IconCurrencyRupee },
  { name: "Future Match Status", icon: IconArrowForward },
  { name: "Communication Status", icon: IconMessageCircle },
  { name: "Past Match Status", icon: IconClockHour12 },
  { name: "Match Process Status", icon: IconArrowsShuffle },
  { name: "Marriage Progress Status", icon: IconHeartFilled },
  { name: "Marriage Outcome Status", icon: IconGift },
  { name: "Profile Closed Status", icon: IconUserOff },
];

// Helper to get the index of a stage in the defined order
const getStageIndex = (stageName) => STAGE_ORDER.findIndex(s => s.name === stageName);

// Customer Selection Modal Component
const CustomerSelectionModal = ({
  allCustomers,
  notes, // Pass notes for duplicate checking
  selectedCustomerIdsState,
  setSelectedCustomerIdsState,
  customerSearchInput,
  setCustomerSearchInput,
  customerCurrentPage,
  setCustomerCurrentPage,
  customersPerPage,
  onClose,
  onPasteSelected,
}) => {
  const [duplicateSelectedCustomers, setDuplicateSelectedCustomers] = useState([]);

  // Filtered customers for the selection modal with pagination
  const filteredCustomers = allCustomers.filter(customer => {
    const query = customerSearchInput.toLowerCase();
    return (
      customer.user_id?.toLowerCase().includes(query) ||
      customer.full_name?.toLowerCase().includes(query)
    );
  });

  // Calculate customers to display for the current page
  const indexOfLastCustomer = customerCurrentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  // Calculate total pages for customers
  const totalCustomerPages = Math.ceil(filteredCustomers.length / customersPerPage);

  // Toggle customer selection and check for duplicates
  const toggleCustomerSelection = useCallback((customerId) => {
    setSelectedCustomerIdsState((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  }, [setSelectedCustomerIdsState]);

  // Effect to update duplicateSelectedCustomers whenever selectedCustomerIdsState or notes change
  useEffect(() => {
    const newDuplicateCustomers = [];
    const selectedIdsArray = Array.from(selectedCustomerIdsState);

    for (const customerId of selectedIdsArray) {
      const customer = allCustomers.find(c => c.user_id === customerId);
      const customerName = customer ? customer.full_name : customerId;

      const hasBeenSharedBefore = notes.some(note =>
        note.section_heading === "Profile Status" &&
        note.profile_status === "profiles_shared" &&
        Array.isArray(note.associated_customer_ids) &&
        note.associated_customer_ids.includes(customerId)
      );

      if (hasBeenSharedBefore) {
        newDuplicateCustomers.push(customerName);
      }
    }
    setDuplicateSelectedCustomers(newDuplicateCustomers);
  }, [selectedCustomerIdsState, notes, allCustomers]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl w-full border border-gray-200 dark:border-gray-700 animate-zoom-in">
        <h3 className="text-xl font-normal text-gray-900 dark:text-gray-100 mb-4">Select Customers</h3>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={customerSearchInput}
            onChange={(e) => {
              setCustomerSearchInput(e.target.value);
              setCustomerCurrentPage(1); // Reset to first page on search
            }}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {duplicateSelectedCustomers.length > 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded relative mb-4 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200" role="alert">
            <strong className="font-bold">Warning!</strong>
            <span className="block sm:inline ml-2">The following selected profiles have been shared before: </span>
            <span className="font-medium">{duplicateSelectedCustomers.join(", ")}</span>
            <span className="block sm:inline ml-2">. Do you wish to proceed?</span>
          </div>
        )}

        <div className="h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-2">
          {currentCustomers.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-sm">No customers found.</p>
          ) : (
            currentCustomers.map(customer => (
              <div
                key={customer.user_id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${selectedCustomerIdsState.has(customer.user_id) ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => toggleCustomerSelection(customer.user_id)}
              >
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  <p className="font-medium">{customer.full_name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">ID: {customer.user_id} | Gender: {customer.gender === 1 ? 'Male' : 'Female'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedCustomerIdsState.has(customer.user_id)}
                  onChange={() => toggleCustomerSelection(customer.user_id)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                />
              </div>
            ))
          )}
        </div>
        {totalCustomerPages > 1 && (
          <div className="flex justify-center items-center mt-4 space-x-2">
            <button
              type="button"
              onClick={() => setCustomerCurrentPage(customerCurrentPage - 1)}
              disabled={customerCurrentPage === 1}
              className="px-3 py-1 rounded-lg text-sm font-normal bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {customerCurrentPage} of {totalCustomerPages}
            </span>
            <button
              type="button"
              onClick={() => setCustomerCurrentPage(customerCurrentPage + 1)}
              disabled={customerCurrentPage === totalCustomerPages}
              className="px-3 py-1 rounded-lg text-sm font-normal bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        )}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-normal bg-gray-300 text-gray-700 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onPasteSelected}
            disabled={selectedCustomerIdsState.size === 0}
            className={`px-4 py-2 rounded-lg text-sm font-normal transition-all duration-150 ${
              selectedCustomerIdsState.size === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
            }`}
          >
            Paste Selected Customers ({selectedCustomerIdsState.size})
          </button>
        </div>
      </div>
    </div>
  );
};


const FollowUpNotes = ({ user_id }) => {
  console.log("FollowUpNotes Rendered with user_id:", user_id);

  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [formData, setFormData] = useState({
    note: "",
    // Consolidated reminder fields
    reminder_date: "",
    reminder_note: "",

    call_status: "",
    call_status_note: "",
    call_status_other_note: "", // Added this field

    profile_status: "",
    profile_status_note: "",

    future_match_status: "",
    future_match_status_note: "",

    communication_status: "",
    communication_status_note: "",

    past_match_status: "",
    past_match_status_note: "",

    match_process_status: "",
    match_process_status_note: "",

    marriage_progress_status: "",
    marriage_progress_status_note: "",

    marriage_outcome_status: "",
    marriage_outcome_status_note: "",

    profile_closed_status: "",
    profile_closed_status_note: "",

    payment_amount: "",
    payment_note: "",
  });
  const [fileUploads, setFileUploads] = useState({
    image: null, // General image upload
    file_upload: null, // General file upload (e.g., audio)
    call_status_image: null,
    profile_status_image: null,
    future_match_status_image: null,
    communication_status_image: null,
    past_match_status_image: null,
    match_process_status_image: null,
    marriage_progress_status_image: null,
    marriage_outcome_status_image: null,
    profile_closed_status_image: null,
    payment_image: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLeadStage, setCurrentLeadStage] = useState("General Note"); // The latest stage with a note
  const [completedStages, setCompletedStages] = new useState(new Set()); // Set of stages that have at least one note
  const [shownNotifications, setShownNotifications] = useState(new Set()); // Track shown notifications
  const [selectedImageForZoom, setSelectedImageForZoom] = useState(null); // State for image zoom modal

  // New states for customer selection feature
  const [showCustomerSelectionModal, setShowCustomerSelectionModal] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [selectedCustomerIdsState, setSelectedCustomerIdsState] = useState(new Set()); // State to hold the Set

  // Pagination states for customer selection
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1);
  const [customersPerPage] = useState(5); // Fixed size for customer list pagination

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  // const CUSTOMERS_API_URL = "http://127.0.0.1:8000/api/customers/";

  

  // Color map for note backgrounds
  const sectionColorMap = {
    "General Note": "bg-gray-50 dark:bg-gray-800",
    "Call Status": "bg-blue-50 dark:bg-blue-950",
    "Profile Status": "bg-green-50 dark:bg-green-950",
    "Future Match Status": "bg-yellow-50 dark:bg-yellow-950",
    "Communication Status": "bg-purple-50 dark:bg-purple-950",
    "Past Match Status": "bg-orange-50 dark:bg-orange-950",
    "Match Process Status": "bg-pink-50 dark:bg-pink-950",
    "Marriage Progress Status": "bg-teal-50 dark:bg-teal-950",
    "Marriage Outcome Status": "bg-indigo-50 dark:bg-indigo-950",
    "Profile Closed Status": "bg-red-50 dark:bg-red-950",
    "Payment Details": "bg-lime-50 dark:bg-lime-950",
  };

  // Badge color map for section headings
  const badgeColorMap = {
    "General Note": "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    "Call Status": "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
    "Profile Status": "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200",
    "Future Match Status": "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200",
    "Communication Status": "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200",
    "Past Match Status": "bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200",
    "Match Process Status": "bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200",
    "Marriage Progress Status": "bg-teal-200 text-teal-800 dark:bg-teal-800 dark:text-teal-200",
    "Marriage Outcome Status": "bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200",
    "Profile Closed Status": "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200",
    "Payment Details": "bg-lime-200 text-lime-800 dark:bg-lime-800 dark:text-lime-200",
  };

  // First field highlight color map
  const firstFieldColorMap = {
    "General Note": "text-gray-900 dark:text-gray-100",
    "Call Status": "text-blue-700 dark:text-blue-300",
    "Profile Status": "text-green-700 dark:text-green-300",
    "Future Match Status": "text-yellow-700 dark:text-yellow-300",
    "Communication Status": "text-purple-700 dark:text-purple-300",
    "Past Match Status": "text-orange-700 dark:text-orange-300",
    "Match Process Status": "text-pink-700 dark:text-pink-300",
    "Marriage Progress Status": "text-teal-700 dark:text-teal-300",
    "Marriage Outcome Status": "text-indigo-700 dark:text-indigo-300",
    "Profile Closed Status": "text-red-700 dark:text-red-300",
    "Payment Details": "text-lime-700 dark:text-lime-300",
  };


  // Status options
  const CALL_STATUS_OPTIONS = [
    { value: "", label: "Select Status" },
    { value: "not_answered", label: "Call Not Answered" },
    { value: "not_reachable", label: "Not Reachable" },
    { value: "switch_off", label: "Switch Off" },
    { value: "call_back_requested", label: "Call Back Requested" },
    { value: "call_busy", label: "Call Busy" },
    { value: "call_completed", label: "Call Completed" },
    { value: "not_interested", label: "Not Interested" },
    { value: "other", label: "Other" }, // Keep 'other'
  ];

  const PROFILE_STATUS_OPTIONS = [
    { value: "", label: "Select Status" },
    { value: "success_story_photos", label: "Success Story & Office Photos Sent" },
    { value: "partner_details_added", label: "Partner & Profile Details Added" },
    { value: "profile_verified", label: "Profile Verification Screenshots Submitted" },
    { value: "credentials_shared", label: "Username & Password Shared with Customer" },
    { value: "photo_uploaded", label: "Profile Photo Uploaded (Good Looking)" },
    { value: "verified_screenshots", label: "Profile Verified & Screenshots Uploaded" },
    { value: "profiles_shortlisted", label: "Profiles Shortlisted by Customer" },
    { value: "service_explained", label: "Service Comparison Explained to Customer" },
    { value: "fees_explained", label: "Fees & Commitment Explained" },
    { value: "payment_pending", label: "Payment Pending from Customer" },
    { value: "fees_recorded", label: "Fees Recorded by Employee" },
    { value: "receipt_sent", label: "Receipt Sent to Customer (WhatsApp & Post)" },
    { value: "commitment_pending", label: "Commitment Pending from Customer" },
    { value: "commitment_recorded", label: "Commitment Recorded by Employee" },
    { value: "package_activated", label: "Package Activated" },
    { value: "profiles_shared", label: "Profiles Shared" }, // This is the trigger value
    { value: "not_interested_shared", label: "Customer Not Interested in Shared Profiles (Reason Provided)" },
    { value: "requested_new_profiles", label: "Requested New Profiles" },
    { value: "new_profile_submitted", label: "New Profile Submitted by Customer" },
    { value: "other", label: "Other" }, // Keep 'other'
  ];

  const FUTURE_MATCH_STATUS_OPTIONS = [
    { value: "", label: "Select Status" },
    { value: "interested", label: "Interested for Future Match – Date Fixed" },
    { value: "not_interested", label: "Not Interested for Future Match – Date Fixed" },
    { value: "future_fixed", label: "Future Match Date Fixed" },
    { value: "postponed", label: "Future Match Postponed" },
    { value: "rejected", label: "Future Match Rejected" },
    // Removed "other"
  ];

  const COMMUNICATION_STATUS_OPTIONS = [
    { value: "", label: "Select Status" },
    { value: "audio_completed", label: "Audio Conference Completed" },
    { value: "number_given", label: "Number Given" },
    { value: "other", label: "Other" }, // Keep 'other'
  ];

  const PAST_MATCH_STATUS_OPTIONS = [
    { value: "", label: "Select Status" },
    { value: "completed", label: "Past Match Completed" },
    { value: "interested", label: "Past Match Interested" },
    { value: "rejected", label: "Past Match Rejected" },
    // Removed "other"
  ];

  const MATCH_PROCESS_STATUS_OPTIONS = [
    { value: "", label: "Select Status" },
    { value: "both_ok_process", label: "Both Side OK – In Process" },
    { value: "both_ok_rejected", label: "Both Side OK – Process Rejected" },
    // Removed "other"
  ];

  const MARRIAGE_PROGRESS_STATUS_OPTIONS = [
    { value: "", label: "Select Status" },
    { value: "matamuchata_fixed", label: "Matamuchata Date Fixed" },
    { value: "engagement_fixed", label: "Engagement Date Fixed" },
    { value: "marriage_fixed", label: "Marriage Date Fixed" },
    // Removed "other"
  ];

  const MARRIAGE_OUTCOME_STATUS_OPTIONS = [
    { value: "", label: "Select Status" },
    { value: "settled_us", label: "Marriage Settled By Us" },
    { value: "settled_other", label: "Marriage Settled By Other Bureau / Relation" },
    { value: "completed_other", label: "Marriage Completed By Other Bureau / Relation" },
    { value: "other", label: "Other" }, // Keep 'other'
  ];

  const PROFILE_CLOSED_STATUS_OPTIONS = [
    { value: "", label: "Select Status" },
    { value: "disable_customer_profile", label: "Customer Requested To Close Account" },
    { value: "inactive_customer_profile", label: "Inactive Customer Account" },
    { value: "other", label: "Other" }, // Keep 'other' - assuming this was implicitly meant to be kept
  ];

  // Form sections configuration
  const formSections = [
    {
      heading: "General Note",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 3, id: "note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_general" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_general" },
        { name: "image", label: "Upload Image", type: "file", id: "image", accept: "image/*" }, // General image
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_general", accept: "audio/*" }, // General audio file
      ],
    },
    {
      heading: "Call Status",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_call" },
        { name: "call_status", label: "Call Status", type: "select", options: CALL_STATUS_OPTIONS, id: "call_status" },
        { name: "call_status_note", label: "Note Details", type: "textarea", rows: 2, id: "call_status_note" },
        { name: "call_status_other_note", label: "Other Note", type: "textarea", rows: 2, id: "call_status_other_note" }, // Added this field
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_call" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_call" },
        { name: "call_status_image", label: "Call Status Image", type: "file", id: "call_status_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_call", accept: "audio/*" },
      ],
    },
    {
      heading: "Profile Status",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_profile" },
        { name: "profile_status", label: "Profile Status", type: "select", options: PROFILE_STATUS_OPTIONS, id: "profile_status" },
        { name: "profile_status_note", label: "Note Details", type: "textarea", rows: 2, id: "profile_status_note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_profile" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_profile" },
        { name: "profile_status_image", label: "Profile Status Image", type: "file", id: "profile_status_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_profile", accept: "audio/*" },
      ],
    },
    {
      heading: "Future Match Status",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_future_match" },
        { name: "future_match_status", label: "Future Match Status", type: "select", options: FUTURE_MATCH_STATUS_OPTIONS, id: "future_match_status" },
        { name: "future_match_status_note", label: "Note Details", type: "textarea", rows: 2, id: "future_match_status_note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_future_match" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_future_match" },
        { name: "future_match_status_image", label: "Future Match Image", type: "file", id: "future_match_status_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_future_match", accept: "audio/*" },
      ],
    },
    {
      heading: "Communication Status",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_communication" },
        { name: "communication_status", label: "Communication Status", type: "select", options: COMMUNICATION_STATUS_OPTIONS, id: "communication_status" },
        { name: "communication_status_note", label: "Note Details", type: "textarea", rows: 2, id: "communication_status_note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_communication" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_communication" },
        { name: "communication_status_image", label: "Communication Image", type: "file", id: "communication_status_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_communication", accept: "audio/*" },
      ],
    },
    {
      heading: "Past Match Status",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_past_match" },
        { name: "past_match_status", label: "Past Match Status", type: "select", options: PAST_MATCH_STATUS_OPTIONS, id: "past_match_status" },
        { name: "past_match_status_note", label: "Note Details", type: "textarea", rows: 2, id: "past_match_status_note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_past_match" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_past_match" },
        { name: "past_match_status_image", label: "Past Match Image", type: "file", id: "past_match_status_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_past_match", accept: "audio/*" },
      ],
    },
    {
      heading: "Match Process Status",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_match_process" },
        { name: "match_process_status", label: "Match Process Status", type: "select", options: MATCH_PROCESS_STATUS_OPTIONS, id: "match_process_status" },
        { name: "match_process_status_note", label: "Note Details", type: "textarea", rows: 2, id: "match_process_status_note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_match_process" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_match_process" },
        { name: "match_process_status_image", label: "Match Process Image", type: "file", id: "match_process_status_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_match_process", accept: "audio/*" },
      ],
    },
    {
      heading: "Marriage Progress Status",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_marriage_progress" },
        { name: "marriage_progress_status", label: "Marriage Progress Status", type: "select", options: MARRIAGE_PROGRESS_STATUS_OPTIONS, id: "marriage_progress_status" },
        { name: "marriage_progress_status_note", label: "Note Details", type: "textarea", rows: 2, id: "marriage_progress_status_note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_marriage_progress" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_marriage_progress" },
        { name: "marriage_progress_status_image", label: "Marriage Progress Image", type: "file", id: "marriage_progress_status_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_marriage_progress", accept: "audio/*" },
      ],
    },
    {
      heading: "Marriage Outcome Status",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_marriage_outcome" },
        { name: "marriage_outcome_status", label: "Marriage Outcome Status", type: "select", options: MARRIAGE_OUTCOME_STATUS_OPTIONS, id: "marriage_outcome_status" },
        { name: "marriage_outcome_status_note", label: "Note Details", type: "textarea", rows: 2, id: "marriage_outcome_status_note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_marriage_outcome" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_marriage_outcome" },
        { name: "marriage_outcome_status_image", label: "Marriage Outcome Image", type: "file", id: "marriage_outcome_status_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_marriage_outcome", accept: "audio/*" },
      ],
    },
    {
      heading: "Profile Closed Status",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_profile_closed" },
        { name: "profile_closed_status", label: "Profile Closed Status", type: "select", options: PROFILE_CLOSED_STATUS_OPTIONS, id: "profile_closed_status" },
        { name: "profile_closed_status_note", label: "Note Details", type: "textarea", rows: 2, id: "profile_closed_status_note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_profile_closed" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_profile_closed" },
        { name: "profile_closed_status_image", label: "Profile Closed Image", type: "file", id: "profile_closed_status_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_profile_closed", accept: "audio/*" },
      ],
    },
    {
      heading: "Payment Details",
      fields: [
        { name: "note", label: "Follow-Up Note", type: "textarea", rows: 2, id: "note_payment" },
        { name: "payment_amount", label: "Payment Amount", type: "number", id: "payment_amount" },
        { name: "payment_note", label: "Note Details", type: "textarea", rows: 2, id: "payment_note" },
        { name: "reminder_date", label: "Reminder Date (Date)", type: "datetime", id: "reminder_date_payment" },
        { name: "reminder_note", label: "Reminder Note", type: "textarea", rows: 2, id: "reminder_note_payment" },
        { name: "payment_image", label: "Payment Image", type: "file", id: "payment_image", accept: "image/*" },
        { name: "file_upload", label: "Upload Audio File", type: "file", id: "file_upload_payment", accept: "audio/*" },
      ],
    },
  ];

  // Infer section_heading from note status fields
  const inferSectionHeading = (note) => {
    if (note.section_heading && STAGE_ORDER.some(s => s.name === note.section_heading)) {
      return note.section_heading;
    }
    // Prioritize specific status fields over general note if they exist
    if (note.call_status || note.call_status_note || note.call_status_other_note || note.call_status_image) return "Call Status";
    if (note.profile_status || note.profile_status_note || note.profile_status_image) return "Profile Status";
    if (note.payment_amount || note.payment_note || note.payment_image) return "Payment Details";
    if (note.future_match_status || note.future_match_status_note || note.future_match_status_image) return "Future Match Status";
    if (note.communication_status || note.communication_status_note || note.communication_status_image) return "Communication Status";
    if (note.past_match_status || note.past_match_status_note || note.past_match_status_image) return "Past Match Status";
    if (note.match_process_status || note.match_process_status_note || note.match_process_status_image) return "Match Process Status";
    if (note.marriage_progress_status || note.marriage_progress_status_note || note.marriage_progress_status_image) return "Marriage Progress Status";
    if (note.marriage_outcome_status || note.marriage_outcome_status_note || note.marriage_outcome_status_image) return "Marriage Outcome Status";
    if (note.profile_closed_status || note.profile_closed_status_note || note.profile_closed_status_image) return "Profile Closed Status";
    return "General Note"; // Default if no specific status fields are populated
  };

  // Determine the first field to highlight for display
  const getFirstFieldToHighlight = (note) => {
    const section = formSections.find(s => s.heading === note.section_heading);
    if (!section) return null;

    // Ordered list of fields to check for highlighting
    const fieldCheckOrder = [
      'note',
      'call_status', 'profile_status', 'future_match_status', 'communication_status',
      'past_match_status', 'match_process_status', 'marriage_progress_status',
      'marriage_outcome_status', 'profile_closed_status', 'payment_amount',
      'call_status_note', 'call_status_other_note', 'profile_status_note', 'future_match_status_note',
      'communication_status_note', 'past_match_status_note',
      'match_process_status_note', 'marriage_progress_status_note',
      'marriage_outcome_status_note', 'profile_closed_status_note', 'payment_note',
      'reminder_date', 'reminder_note', // Consolidated reminder fields
    ];

    for (const fieldName of fieldCheckOrder) {
      // Check if the field exists in the note and has a value
      if (note[fieldName] !== undefined && note[fieldName] !== null && note[fieldName] !== "") {
        // Find the label from formSections configuration
        const fieldConfig = section.fields.find(f => f.name === fieldName);
        const label = fieldConfig ? fieldConfig.label : fieldName;

        // Special handling for select options to display label
        if (fieldName.includes('_status') && !fieldName.includes('_note')) {
          const optionsMap = {
            call_status: CALL_STATUS_OPTIONS,
            profile_status: PROFILE_STATUS_OPTIONS,
            future_match_status: FUTURE_MATCH_STATUS_OPTIONS,
            communication_status: COMMUNICATION_STATUS_OPTIONS,
            past_match_status: PAST_MATCH_STATUS_OPTIONS,
            match_process_status: MATCH_PROCESS_STATUS_OPTIONS,
            marriage_progress_status: MARRIAGE_PROGRESS_STATUS_OPTIONS,
            marriage_outcome_status: MARRIAGE_OUTCOME_STATUS_OPTIONS,
            profile_closed_status: PROFILE_CLOSED_STATUS_OPTIONS,
          };
          const options = optionsMap[fieldName];
          const selectedOption = options?.find(opt => opt.value === note[fieldName]);
          return {
            label: label,
            value: selectedOption ? selectedOption.label : note[fieldName],
          };
        }
        // Special handling for payment_amount
        if (fieldName === 'payment_amount') {
          return {
            label: label,
            value: `₹${parseFloat(note[fieldName]).toLocaleString('en-IN')}`,
          };
        }
        // Special handling for datetime fields (reminder dates)
        if (fieldName === 'reminder_date') {
          try {
            // Format for display without time
            const formattedDate = moment(note[fieldName]).tz("Asia/Kolkata").format("DD-MM-YYYY");
            return {
              label: label,
              value: formattedDate,
            };
          } catch (e) {
            console.warn(`Could not format date for ${fieldName}:`, note[fieldName], e);
            return {
              label: label,
              value: note[fieldName], // Fallback to raw value if formatting fails
            };
          }
        }
        return {
          label: label,
          value: note[fieldName],
        };
      }
    }
    return null; // Fallback if no relevant field found
  };


  // Handle notification dismissal
  const handleDismissNotification = (notificationId) => {
    setShownNotifications((prev) => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      return newSet;
    });
    console.log(`Notification dismissed: ${notificationId}`);
  };

  // Check if a note has a reminder date for today or tomorrow and queue notifications
  const queueReminderNotifications = useCallback((notesToProcess) => {
    const today = moment().tz("Asia/Kolkata").startOf('day');
    const tomorrow = moment().tz("Asia/Kolkata").add(1, 'days').startOf('day');
    const notificationQueue = [];

    notesToProcess.forEach((note) => {
      if (note.reminder_date) {
        try {
          // Parse reminderDate without time for comparison
          const reminderDate = moment(note.reminder_date).tz("Asia/Kolkata").startOf('day');
          if (!reminderDate.isValid()) {
            console.warn(`Invalid date for reminder_date in note ${note.id}: ${note.reminder_date}`);
            return;
          }
          const isToday = reminderDate.isSame(today, 'day');
          const isTomorrow = reminderDate.isSame(tomorrow, 'day');
          if (isToday || isTomorrow) {
            const notificationId = `${note.id}-reminder-${reminderDate.format("YYYY-MM-DD")}`;
            if (!shownNotifications.has(notificationId)) {
              notificationQueue.push({
                id: notificationId,
                section: note.section_heading,
                label: "Reminder Date",
                date: reminderDate.format("DD-MM-YYYY"), // Format for display without time
                urgency: isToday ? "today" : "tomorrow",
                noteId: note.id,
              });
            }
          }
        } catch (err) {
          console.error(`Error processing reminder_date for note ${note.id}:`, err);
        }
      }
    });

    // Process notification queue
    notificationQueue.forEach(({ id, section, label, date, urgency, noteId }) => {
      toast.custom(
        (t) => (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md w-full dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start">
              <IconAlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                  <strong>Reminder:</strong> {section} - {label} is scheduled {urgency} on {date}
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => {
                      toast.dismiss(t);
                      handleDismissNotification(id);
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded-md text-sm font-normal hover:bg-red-600"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      // Scroll to the note
                      const noteElement = document.getElementById(`note-${noteId}`);
                      if (noteElement) {
                        noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                      toast.dismiss(t);
                      handleDismissNotification(id);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-normal hover:bg-blue-600"
                  >
                    View Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          duration: 10000, // 10 seconds
          position: "top-center",
          id, // Unique ID for deduplication
        }
      );
      console.log(`Queued notification: ${id} for ${section} (${urgency})`);
    });
  }, [shownNotifications]); // Only depends on shownNotifications

  // Check if a note has a reminder date for today or tomorrow
  const isUrgentReminder = (note) => {
    if (note.reminder_date) {
      try {
        // Parse reminderDate without time for comparison
        const reminderDate = moment(note.reminder_date).tz("Asia/Kolkata").startOf('day');
        const today = moment().tz("Asia/Kolkata").startOf('day');
        const tomorrow = moment().tz("Asia/Kolkata").add(1, 'days').startOf('day');
        return reminderDate.isValid() && (reminderDate.isSame(today, 'day') || reminderDate.isSame(tomorrow, 'day'));
      } catch (err) {
        console.warn(`Invalid date for reminder_date in note ${note.id}: ${note.reminder_date}`);
        return false;
      }
    }
    return false;
  };

  // Fetch follow-up notes and queue reminders
  const fetchNotes = useCallback(async () => {
    console.log("Fetching Notes for user_id:", user_id);
    try {
      setLoading(true);
      setError(null);
      const response = await getData(`/followup/${user_id}/`);
      console.log("GET Response:", {
        status: response.status,
        data: response.data,
      });
      const fetchedNotes = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      // Sort notes by creation date descending to easily find the latest stage
      fetchedNotes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const updatedNotes = fetchedNotes.map(note => ({
        ...note,
        section_heading: inferSectionHeading(note),
        is_re_shared_profile_note: false, // Initialize re-shared status
      }));

      // After initial mapping, determine re-shared status
      for (let i = 0; i < updatedNotes.length; i++) {
          const currentNote = updatedNotes[i];
          // Only check for 'Profiles Shared' notes that have associated customer IDs
          if (currentNote.section_heading === "Profile Status" && currentNote.profile_status === "profiles_shared" && Array.isArray(currentNote.associated_customer_ids) && currentNote.associated_customer_ids.length > 0) {
              // Check against all notes created BEFORE the current note
              const previousSharedNotes = updatedNotes.slice(i + 1).filter(prevNote =>
                  prevNote.section_heading === "Profile Status" &&
                  prevNote.profile_status === "profiles_shared" &&
                  Array.isArray(prevNote.associated_customer_ids) &&
                  prevNote.associated_customer_ids.length > 0
              );

              // Determine if any customer in the current note was previously shared in an older note
              const isReShared = currentNote.associated_customer_ids.some(currentCustomerId =>
                  previousSharedNotes.some(prevNote =>
                      prevNote.associated_customer_ids.includes(currentCustomerId)
                  )
              );

              if (isReShared) {
                  currentNote.is_re_shared_profile_note = true;
              }
          }
      }

      setNotes(updatedNotes);

      // Determine completed stages and current lead stage
      const newCompletedStages = new Set();
      let latestNoteStage = null;
      let latestNoteTimestamp = 0;

      for (const note of updatedNotes) {
        newCompletedStages.add(note.section_heading);
        const noteTimestamp = new Date(note.created_at).getTime();
        if (noteTimestamp > latestNoteTimestamp) {
          latestNoteTimestamp = noteTimestamp;
          latestNoteStage = note.section_heading;
        }
      }

      setCompletedStages(newCompletedStages); // New state to track explicitly completed stages
      setCurrentLeadStage(latestNoteStage || "General Note"); // Default if no notes yet

      queueReminderNotifications(updatedNotes);

    } catch (err) {
      console.error("GET Error:", {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage = err.response?.data?.detail || "Failed to load follow-up notes.";
      setError(errorMessage);
      setNotes([]);
      setCompletedStages(new Set()); // Reset completed stages on error
      setCurrentLeadStage("General Note");
    } finally {
      setLoading(false);
      console.log("Fetch Notes Completed");
    }
  }, [user_id, queueReminderNotifications]); // Removed notes and allCustomers from dependency array

  // Fetch all customers for the "Profiles Shared" feature
  const fetchAllCustomers = useCallback(async () => {
    try {
      // Assume authentication is handled by `useAuth` and `getData` uses it internally
      const response = await getData('/customers/');
      if (response && Array.isArray(response.data)) {
        setAllCustomers(response.data);
        console.log("Fetched All Customers:", response.data);
      } else {
        console.error("Failed to fetch customers: Invalid response format", response);
        toast.error("Failed to fetch customer list.", { duration: 3000 });
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      toast.error("Error fetching customer list. Please check network and API.", { duration: 3000 });
    }
  }, ['/customers/']); // Dependencies for fetchAllCustomers

  useEffect(() => {
    console.log("useEffect Triggered: user:", user?.username, "user_id:", user_id);
    if (user && user_id) {
      fetchNotes();
    }
  }, [user, user_id, fetchNotes]);

  // Handle section selection
  const handleSectionChange = (e) => {
    const selectedHeading = e.target.value;
    console.log("Selected Section:", selectedHeading);
    setSelectedSection(selectedHeading);
    // Reset all form data fields related to statuses/notes/payments/files
    setFormData({
      note: "",
      reminder_date: "",
      reminder_note: "",
      call_status: "",
      call_status_note: "",
      call_status_other_note: "",
      profile_status: "",
      profile_status_note: "",
      future_match_status: "",
      future_match_status_note: "",
      communication_status: "",
      communication_status_note: "",
      past_match_status: "",
      past_match_status_note: "",
      match_process_status: "",
      match_process_status_note: "",
      marriage_progress_status: "",
      marriage_progress_status_note: "",
      marriage_outcome_status: "",
      marriage_outcome_status_note: "",
      profile_closed_status: "",
      profile_closed_status_note: "",
      payment_amount: "",
      payment_note: "",
    });
    setFileUploads({
      image: null, // General image upload
      file_upload: null, // General file upload (e.g., audio)
      call_status_image: null,
      profile_status_image: null,
      future_match_status_image: null,
      communication_status_image: null,
      past_match_status_image: null,
      match_process_status_image: null,
      marriage_progress_status_image: null,
      marriage_outcome_status_image: null,
      profile_closed_status_image: null,
      payment_image: null,
    });
    // Hide customer selection modal when section changes
    setShowCustomerSelectionModal(false);
    setSelectedCustomerIdsState(new Set()); // Clear selected customers
    setCustomerSearchInput(""); // Clear customer search
    setCustomerCurrentPage(1); // Reset customer pagination
  };

  // Handle form input changes, including the special case for Profile Status
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input Changed - ${name}:`, value);
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Logic for showing customer selection modal based on status changes
    const shouldShowCustomerSelection = (statusName, statusValue) => {
      switch (statusName) {
        case "profile_status":
          return statusValue === "profiles_shared";
        case "future_match_status":
        case "communication_status":
        case "past_match_status":
        case "match_process_status":
        case "marriage_progress_status":
          return value !== "" && value !== "other"; // Only show if a specific status is selected, not "other" or empty
        case "marriage_outcome_status":
          return statusValue === "settled_us";
        default:
          return false;
      }
    };

    if (shouldShowCustomerSelection(name, value)) {
      setShowCustomerSelectionModal(true);
      fetchAllCustomers(); // Fetch customers when a relevant status is selected
    } else if (name.includes("_status") && name !== "reminder_date" && name !== "reminder_note") { // If it's a status field but not triggering the modal
      setShowCustomerSelectionModal(false);
      setSelectedCustomerIdsState(new Set()); // Clear selected customers
      setCustomerSearchInput("");
      setCustomerCurrentPage(1); // Reset customer pagination
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    console.log(`File Selected - ${name}:`, file?.name || "None");
    setFileUploads((prev) => ({ ...prev, [name]: file }));
  };

  // Handle date picker change
  const handleDateChange = (name, momentObj) => {
    // Format for submission without time
    const formattedDate = momentObj.format ? momentObj.format("YYYY-MM-DD") : "";
    console.log(`Date Selected - ${name}: ${formattedDate}`);
    setFormData((prev) => ({ ...prev, [name]: formattedDate }));
  };

  // Handle button click
  const handleButtonClick = (e) => {
    console.log("Add Note Button Clicked at:", new Date().toISOString());
    console.log("Button Event Target:", e.target.tagName, e.target.type);
    e.stopPropagation();
  };

  // Handle search input change for existing notes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    console.log("Search Query:", query);
    setSearchQuery(query);
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase();
    return (
      note.note?.toLowerCase().includes(query) ||
      note.call_status?.toLowerCase().includes(query) ||
      note.call_status_note?.toLowerCase().includes(query) ||
      note.call_status_other_note?.toLowerCase().includes(query) || // Added
      note.profile_status?.toLowerCase().includes(query) ||
      note.profile_status_note?.toLowerCase().includes(query) ||
      note.future_match_status?.toLowerCase().includes(query) ||
      note.future_match_status_note?.toLowerCase().includes(query) ||
      note.communication_status?.toLowerCase().includes(query) ||
      note.communication_status_note?.toLowerCase().includes(query) ||
      note.past_match_status?.toLowerCase().includes(query) ||
      note.past_match_status_note?.toLowerCase().includes(query) ||
      note.match_process_status?.toLowerCase().includes(query) ||
      note.match_process_status_note?.toLowerCase().includes(query) ||
      note.marriage_progress_status?.toLowerCase().includes(query) ||
      note.marriage_progress_status_note?.toLowerCase().includes(query) ||
      note.marriage_outcome_status?.toLowerCase().includes(query) ||
      note.marriage_outcome_status_note?.toLowerCase().includes(query) ||
      note.profile_closed_status?.toLowerCase().includes(query) ||
      note.profile_closed_status_note?.toLowerCase().includes(query) ||
      String(note.payment_amount || '').toLowerCase().includes(query) ||
      note.payment_note?.toLowerCase().includes(query) ||
      note.section_heading?.toLowerCase().includes(query) ||
      note.reminder_date?.toLowerCase().includes(query) || // Consolidated reminder field
      note.reminder_note?.toLowerCase().includes(query) // Consolidated reminder field
    );
  });

  // Handle creating a new note
  const handleCreateNote = async (event, forceSubmit = false) => {
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }
    console.log("handleCreateNote Called at:", new Date().toISOString());
    console.log("Form Target:", event?.target?.tagName, event?.target?.id);

    const selectedSectionObj = formSections.find((section) => section.heading === selectedSection);
    const relevantFieldsForSubmission = selectedSectionObj ? selectedSectionObj.fields.map((field) => field.name) : [];

    if (!selectedSection) {
      console.log("Validation Failed: No section selected");
      toast.error("Please select a section to add a note.", {
        duration: 4000, position: "top-center",
        style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
      });
      return;
    }

    const hasGeneralNoteField = relevantFieldsForSubmission.includes("note");
    const trimmedGeneralNote = formData.note?.trim() || "";

    if (!trimmedGeneralNote && hasGeneralNoteField) {
      console.log("Validation Failed: General note is empty or invalid", formData.note);
      toast.error("Follow-up note is required and cannot be empty for this section.", {
        duration: 4000, position: "top-center",
        style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
      });
      return;
    }

    if (selectedSection === "Payment Details") {
      const paymentAmount = parseFloat(formData.payment_amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        toast.error("Please enter a valid positive payment amount.", {
          duration: 4000, position: "top-center",
          style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
        });
        return;
      }
    }

    // Validate consolidated reminder date and note fields
    const hasReminderDate = !!formData.reminder_date;
    const hasReminderNote = !!formData.reminder_note?.trim();

    if (hasReminderDate && !hasReminderNote) {
      toast.error("Reminder note is mandatory when a reminder date is selected.", {
        duration: 6000, position: "top-center",
        style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
      });
      return;
    }

    if (!hasReminderDate && hasReminderNote) {
      toast.error("Reminder date is mandatory when a reminder note is entered.", {
        duration: 6000, position: "top-center",
        style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
      });
      return;
    }

    if (hasReminderDate) { // Only validate date range if a date is actually selected
      try {
        const selectedDate = moment(formData.reminder_date, "YYYY-MM-DD").tz("Asia/Kolkata").startOf('day');
        const now = moment().tz("Asia/Kolkata").startOf('day');
        const fiveDaysFromNow = moment().tz("Asia/Kolkata").add(5, 'days').startOf('day');

        if (!selectedDate.isValid() || selectedDate.isSameOrBefore(now) || selectedDate.isAfter(fiveDaysFromNow)) {
          toast.error(`Reminder date must be within the next 5 days from today.`, {
            duration: 6000, position: "top-center",
            style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
          });
          return;
        }
      } catch (e) {
        toast.error(`Invalid date format for Reminder Date.`, {
          duration: 6000, position: "top-center",
          style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
        });
        return;
      }
    }

    // --- Duplicate Profile Sharing Check (Final Gate before submission) ---
    if (selectedSection === "Profile Status" && formData.profile_status === "profiles_shared" && selectedCustomerIdsState.size > 0 && !forceSubmit) {
        const alreadySharedCustomerDetails = [];
        const selectedCustomerIdsArray = Array.from(selectedCustomerIdsState);

        // Use the already fetched notes state for checking
        const allFetchedNotesForCheck = notes;

        for (const customerId of selectedCustomerIdsArray) {
            const customer = allCustomers.find(c => c.user_id === customerId);
            const customerName = customer ? customer.full_name : customerId;

            const hasBeenSharedBefore = allFetchedNotesForCheck.some(note =>
                note.section_heading === "Profile Status" &&
                note.profile_status === "profiles_shared" &&
                Array.isArray(note.associated_customer_ids) && // Ensure it's an array
                note.associated_customer_ids.includes(customerId)
            );

            if (hasBeenSharedBefore) {
                alreadySharedCustomerDetails.push(customerName);
            }
        }

        if (alreadySharedCustomerDetails.length > 0) {
            // Show warning modal/toast
            toast.custom((t) => (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-md w-full dark:bg-yellow-900/20 dark:border-yellow-800">
                    <div className="flex items-start">
                        <IconAlertCircle className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                                <strong>Warning:</strong> Profiles for the following customers have been shared before:
                                <br />
                                <span className="font-medium">{alreadySharedCustomerDetails.join(", ")}</span>
                            </p>
                            <div className="mt-3 flex space-x-2">
                                <button
                                    onClick={() => {
                                        toast.dismiss(t);
                                        // Re-call handleCreateNote with forceSubmit = true
                                        handleCreateNote(event, true); // Pass original event and force flag
                                    }}
                                    className="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm font-normal hover:bg-yellow-700"
                                >
                                    Send Again
                                </button>
                                <button
                                    onClick={() => {
                                        toast.dismiss(t);
                                        setIsSubmitting(false); // Ensure submission state is reset
                                    }}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm font-normal hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ), {
                duration: Infinity, // Keep open until dismissed
                position: "top-center",
            });
            setIsSubmitting(false); // Prevent immediate submission
            return; // Stop the function here
        }
    }
    // --- End Duplicate Profile Sharing Check ---


    setIsSubmitting(true);
    console.log("Submission Started");
    toast.info("Submitting note...", {
      duration: 4000, position: "top-center",
      style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
    });

    try {
      const token = Cookies.get("accessToken");
      console.log("Access Token:", token ? `Present (${token.substring(0, 10)}...)` : "Missing");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const payload = new FormData();
      payload.append("note_type", "employee_customer");
      payload.append("customer_user_id", user_id);
      payload.append("note", trimmedGeneralNote);
      payload.append("section_heading", selectedSection);

      // Append consolidated reminder fields
      if (formData.reminder_date) {
        // Ensure it's formatted as YYYY-MM-DD for backend
        const dateMoment = moment(formData.reminder_date, "YYYY-MM-DD").tz("Asia/Kolkata");
        if (dateMoment.isValid()) {
            payload.append("reminder_date", dateMoment.format("YYYY-MM-DD"));
        } else {
            payload.append("reminder_date", ""); // Send empty string if invalid
        }
      } else {
        payload.append("reminder_date", ""); // Send empty string if not set
      }

      if (formData.reminder_note) {
        payload.append("reminder_note", formData.reminder_note);
      } else {
        payload.append("reminder_note", ""); // Send empty string if not set
      }

      // Add associated_customer_ids to payload if relevant
      if (selectedSection === "Profile Status" && formData.profile_status === "profiles_shared" && selectedCustomerIdsState.size > 0) {
          payload.append("associated_customer_ids", JSON.stringify(Array.from(selectedCustomerIdsState)));
      } else {
          payload.append("associated_customer_ids", JSON.stringify([])); // Always send an empty array if not relevant
      }


      const formDataFieldsLogged = [];
      Object.keys(formData).forEach((key) => {
        // Only append if the field is relevant for the selected section and has a non-empty value
        // And exclude the consolidated reminder fields here, as they are handled above
        if (relevantFieldsForSubmission.includes(key) && key !== "note" && key !== "reminder_date" && key !== "reminder_note") {
          if (key === "payment_amount") {
            const amount = parseFloat(formData[key]);
            if (!isNaN(amount)) {
              payload.append(key, amount);
              formDataFieldsLogged.push(`${key}: ${amount}`);
            } else {
              console.log(`Skipping ${key}: Invalid number (${formData[key]})`);
            }
          } else {
            // Append the value, sending empty string if it's explicitly empty
            payload.append(key, formData[key] || "");
            formDataFieldsLogged.push(`${key}: ${formData[key] || "(empty)"}`);
          }
        }
      });

      const fileUploadFieldsLogged = [];
      Object.keys(fileUploads).forEach((key) => {
        // Check if a field with this name exists in the current section's fields
        const fieldExistsInCurrentSection = selectedSectionObj.fields.some(field => field.name === key);

        if (fieldExistsInCurrentSection) {
          if (fileUploads[key] instanceof File) {
            // If a file is selected, append the File object
            payload.append(key, fileUploads[key]);
            fileUploadFieldsLogged.push(`${key}: ${fileUploads[key].name}`);
          } else if (fileUploads[key] === null) {
            // If no file is selected (or it was cleared), append an empty string
            // This is crucial for Django Rest Framework's file field handling when no file is provided
            payload.append(key, '');
            fileUploadFieldsLogged.push(`${key}: (no file selected, sending empty string)`);
          }
          // If fileUploads[key] is undefined (e.g., field not in state), it won't be appended, which is fine.
        }
      });

      console.log("--- Payload Details ---");
      console.log("Selected Section:", selectedSection);
      console.log("Note Value:", trimmedGeneralNote);
      console.log("Reminder Date:", formData.reminder_date);
      console.log("Reminder Note:", formData.reminder_note);
      console.log("Form Data Fields (excluding main note and reminders):", formDataFieldsLogged.join(", ") || "None");
      console.log("File Uploads:", fileUploadFieldsLogged.join(", ") || "None");
      console.log("Full Payload (FormData entries):");
      for (let [key, value] of payload.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      console.log("Request URL:", `${BASE_URL}${user_id}/`);
      console.log("Request Headers:", { Authorization: `Bearer ${token}` });

      const response = await postData(`/followup/${user_id}/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data', // Explicitly setting Content-Type
        },
      });

      console.log("--- POST Response ---");
      console.log("Status:", response.status);
      console.log("Data:", response.data);

      await fetchNotes();

      setSelectedSection("");
      setSearchQuery("");
      // Reset form data completely after submission
      setFormData({
        note: "",
        reminder_date: "",
        reminder_note: "",
        call_status: "", call_status_note: "", call_status_other_note: "",
        profile_status: "", profile_status_note: "",
        future_match_status: "", future_match_status_note: "",
        communication_status: "", communication_status_note: "",
        past_match_status: "", past_match_status_note: "",
        match_process_status: "", match_process_status_note: "",
        marriage_progress_status: "", marriage_progress_status_note: "",
        marriage_outcome_status: "", marriage_outcome_status_note: "",
        profile_closed_status: "", profile_closed_status_note: "",
        payment_amount: "", payment_note: "",
      });
      setFileUploads({
        image: null, // General image upload
        file_upload: null, // General file upload (e.g., audio)
        call_status_image: null, profile_status_image: null,
        future_match_status_image: null, communication_status_image: null,
        past_match_status_image: null, match_process_status_image: null,
        marriage_progress_status_image: null, marriage_outcome_status_image: null,
        profile_closed_status_image: null, payment_image: null,
      });
      setShowCustomerSelectionModal(false); // Hide modal
      setSelectedCustomerIdsState(new Set()); // Clear selected customers
      setCustomerSearchInput(""); // Clear customer search
      setCustomerCurrentPage(1); // Reset customer pagination

      toast.success(`Note created successfully! ${formDataFieldsLogged.length > 0 ? `Fields: ${formDataFieldsLogged.join(", ")}` : "No additional fields"}`, {
        duration: 6000, position: "top-center",
        style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
      });
    } catch (err) {
      console.error("--- POST Error ---");
      console.error("Message:", err.message);
      console.error("Response:", err.response || "No response");
      console.error("Status:", err.response?.status || "N/A");
      console.error("Data:", err.response?.data || "No data");
      console.error("Headers:", err.response?.headers || "No headers");
      console.error("Stack:", err.stack);

      const errorDetails = err.response?.data
        ? Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join("; ")
        : err.message || "Unknown error";

      toast.error(`Failed to create note. Status: ${err.response?.status || "N/A"}. Details: ${errorDetails}`, {
        duration: 6000, position: "top-center",
        style: { background: "var(--bg-toast)", color: "var(--text-toast)", border: "1px solid var(--border-toast)", boxShadow: "var(--shadow-toast)" },
      });
    } finally {
      console.log("Submission Completed at:", new Date().toISOString());
      setIsSubmitting(false);
    }
  };

  // Render form field
  const renderField = ({ name, label, type, options = [], rows, id, accept }) => {
    const commonClasses =
      "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150";
    const labelClasses = "font-normal text-gray-700 dark:text-gray-300 mb-1.5 block text-sm";

    const isNoteField = name === "note";
    const currentSectionFields = formSections.find(s => s.heading === selectedSection)?.fields || [];
    const shouldRenderNoteField = isNoteField && currentSectionFields.some(f => f.name === "note");

    // Determine if the field should have a mandatory asterisk
    const isMandatoryReminderField = (name === "reminder_date" || name === "reminder_note");

    if (type === "textarea") {
      if (isNoteField && !shouldRenderNoteField) return null; // Don't render if it's the general note field but not explicitly in section

      return (
        <div key={id}>
          <label htmlFor={id} className={labelClasses}>
            {label}
            {isMandatoryReminderField && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            id={id}
            name={name}
            value={formData[name] || ""}
            onChange={handleChange}
            rows={rows || 3}
            className={`${commonClasses} resize-y`}
            disabled={isSubmitting}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      );
    }

    if (type === "select") {
      return (
        <div key={id}>
          <label htmlFor={id} className={labelClasses}>
            {label}
          </label>
          <select
            id={id}
            name={name}
            value={formData[name] || ""}
            onChange={handleChange}
            className={commonClasses}
            disabled={isSubmitting}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === "file") {
      return (
        <div key={id}>
          <label htmlFor={id} className={labelClasses}>
            {label}
          </label>
          <input
            id={id}
            name={name}
            type="file"
            accept={accept} // Use the accept prop
            onChange={handleFileChange}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-normal file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
            disabled={isSubmitting}
          />
          {fileUploads[name] && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selected: {fileUploads[name].name}
            </p>
          )}
        </div>
      );
    }

    if (type === "number") {
      return (
        <div key={id}>
          <label htmlFor={id} className={labelClasses}>
            {label}
          </label>
          <input
            id={id}
            name={name}
            type="number"
            value={formData[name] || ""}
            onChange={handleChange}
            className={commonClasses}
            disabled={isSubmitting}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      );
    }

    if (type === "datetime") {
      // Custom validation for react-datetime: only allow dates within the next 5 days from today
      const isValidDate = (current) => {
        const today = moment().tz("Asia/Kolkata").startOf('day');
        const fiveDaysFromNow = moment().tz("Asia/Kolkata").add(5, 'days').startOf('day');
        // Allow selection only if the date is after today and on or before 5 days from now
        return current.isAfter(today) && current.isSameOrBefore(fiveDaysFromNow);
      };

      return (
        <div key={id}>
          <label htmlFor={id} className={labelClasses}>
            {label}
            {isMandatoryReminderField && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Datetime
            id={id}
            value={formData[name] ? moment(formData[name]) : ""} // Pass moment object to Datetime
            onChange={(momentObj) => handleDateChange(name, momentObj)}
            inputProps={{
              className: commonClasses,
              disabled: isSubmitting,
              placeholder: "Select date",
              readOnly: true, // Strictly disable manual entry
            }}
            dateFormat="YYYY-MM-DD" // Only date format
            timeFormat={false} // No time component
            utc={false} // Use local time
            isValidDate={isValidDate} // Apply the validation function
            className="w-full"
          />
        </div>
      );
    }

    return null;
  };

  // Paste selected customers into the note field
  const pasteSelectedCustomers = () => {
    let newNoteContent = formData.note;
    const selectedCustomerDetails = [];

    selectedCustomerIdsState.forEach(id => {
      const customer = allCustomers.find(c => c.user_id === id);
      if (customer) {
        selectedCustomerDetails.push(
          `User ID: ${customer.user_id}, Name: ${customer.full_name}, Gender: ${customer.gender === 1 ? 'Male' : 'Female'}`
        );
      }
    });

    if (selectedCustomerDetails.length > 0) {
      const formattedText = selectedCustomerDetails.join("\n");
      newNoteContent = newNoteContent ? `${newNoteContent}\n\n${formattedText}` : formattedText;
      setFormData(prev => ({ ...prev, note: newNoteContent }));
      toast.success("Selected customer details pasted into note.", { duration: 3000 });
    } else {
      toast.info("No customers selected to paste.", { duration: 3000 });
    }

    setShowCustomerSelectionModal(false); // Close modal after pasting
    setSelectedCustomerIdsState(new Set()); // Clear selection
    setCustomerSearchInput(""); // Clear customer search
    setCustomerCurrentPage(1); // Reset pagination
  };


  // Handle loading and error states
  if (loading) {
    console.log("Rendering Loading State");
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <p className="text-gray-500 dark:text-gray-400 font-normal">Loading follow-up notes...</p>
      </div>
    );
  }

  if (error) {
    console.log("Rendering Error State:", error);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <p className="text-red-600 font-normal">{error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto p-4 bg-gray-50 dark:bg-gray-800 min-h-screen">
        <h2 className="text-2xl font-normal text-gray-900 dark:text-gray-100 mb-6">Customer Journey Tracker</h2>

        {/* Lead Stage Tracking Display */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 pb-4 pt-2 mb-8 select-none">
          {STAGE_ORDER.map((stageObj, index) => {
            const stageName = stageObj.name;
            const currentStageIndex = getStageIndex(currentLeadStage);
            const thisStageIndex = getStageIndex(stageName);

            let stageStatus;
            let stageBgClasses;
            let stageShadow = 'shadow-md hover:shadow-lg';
            let stagePulseClass = '';
            let strikeThroughClass = '';

            if (completedStages.has(stageName)) {
              stageStatus = 'completed';
              stageBgClasses = 'bg-gradient-to-r from-green-600 to-teal-700 text-white border-green-700 dark:from-green-700 dark:to-teal-800 dark:border-green-800';
            } else if (thisStageIndex < currentStageIndex && !completedStages.has(stageName)) { // This stage was skipped
              stageStatus = 'skipped';
              stageBgClasses = 'bg-gradient-to-r from-orange-400 to-amber-500 text-white border-orange-500 dark:from-orange-700 dark:to-amber-800 dark:border-orange-800';
              strikeThroughClass = 'line-through'; // Apply strike-through
            } else if (stageName === currentLeadStage) {
              stageStatus = 'current';
              stageBgClasses = 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-700 dark:from-blue-700 dark:to-indigo-800 dark:border-blue-800';
              stageShadow = 'shadow-xl hover:shadow-2xl';
              stagePulseClass = 'animate-pulse-stage';
            } else { // Pending stage
              stageStatus = 'pending';
              stageBgClasses = 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
            }

            const IconComponent = stageObj.icon;

            return (
              <div
                key={stageObj.name}
                className={`
                  relative flex items-center justify-center
                  px-5 py-3 rounded-xl
                  text-sm font-normal whitespace-nowrap z-10 cursor-default
                  transition-all duration-300 ease-in-out transform
                  border-2
                  ${stageBgClasses} ${stageShadow} ${stagePulseClass}
                  ${stageStatus === 'current' ? 'scale-105' : ''}
                  ${index < STAGE_ORDER.length - 1 ? 'pipeline-stage-arrow' : ''}
                `}
                data-status={stageStatus}
              >
                {IconComponent && <IconComponent size={20} className="mr-2 flex-shrink-0" />}
                <span className={`relative z-10 ${strikeThroughClass}`}>{stageObj.name}</span>
              </div>
            );
          })}
        </div>

        <h2 className="text-2xl font-normal text-gray-900 dark:text-gray-100 mb-6">Add Follow-Up Note</h2>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <form
            id="follow-up-form"
            onSubmit={handleCreateNote}
            noValidate
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="section-select"
                className="font-normal text-gray-700 dark:text-gray-300 mb-1.5 block text-sm"
              >
                Select Section
              </label>
              <select
                id="section-select"
                value={selectedSection}
                onChange={handleSectionChange}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                disabled={isSubmitting}
              >
                <option value="">Select a section</option>
                {formSections.map((section) => (
                  <option key={section.heading} value={section.heading}>
                    {section.heading}
                  </option>
                ))}
              </select>
            </div>

            {selectedSection && (
              <div className="bg-gray-100 dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
                <h3 className="text-lg font-normal text-gray-800 dark:text-gray-100 mb-4">
                  {selectedSection}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  {formSections
                    .find((section) => section.heading === selectedSection)
                    ?.fields.map((field) => renderField(field))}
                </div>
              </div>
            )}

            {/* Customer Selection Modal */}
            {showCustomerSelectionModal && (
              <CustomerSelectionModal
                allCustomers={allCustomers}
                notes={notes} // Pass notes for duplicate checking
                selectedCustomerIdsState={selectedCustomerIdsState}
                setSelectedCustomerIdsState={setSelectedCustomerIdsState}
                customerSearchInput={customerSearchInput}
                setCustomerSearchInput={setCustomerSearchInput}
                customerCurrentPage={customerCurrentPage}
                setCustomerCurrentPage={setCustomerCurrentPage}
                customersPerPage={customersPerPage}
                onClose={() => {
                  setShowCustomerSelectionModal(false);
                  setSelectedCustomerIdsState(new Set()); // Clear selected customers on close
                  setCustomerSearchInput("");
                  setCustomerCurrentPage(1);
                }}
                onPasteSelected={pasteSelectedCustomers}
              />
            )}

            <button
              type="submit"
              onClick={handleButtonClick}
              disabled={isSubmitting || !selectedSection}
              className={`px-6 py-2.5 rounded-lg font-normal text-sm transition-all duration-150 ${
                isSubmitting || !selectedSection
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Add Note"}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-xl font-normal text-gray-900 dark:text-gray-100 mb-4">
            Existing Notes
          </h3>
          <div className="mb-6 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            />
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {filteredNotes.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 italic font-normal">
              {searchQuery ? "No notes match your search." : "No follow-up notes found."}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note, index) => {
                const isUrgent = isUrgentReminder(note);
                const urgencyLabel = isUrgent ? (
                  moment(note.reminder_date)
                    .tz("Asia/Kolkata")
                    .isSame(moment().tz("Asia/Kolkata").startOf('day'), 'day')
                    ? "Due Today"
                    : "Due Tomorrow"
                ) : null;
                const firstField = getFirstFieldToHighlight(note);
                const noteNumber = filteredNotes.length - index; // Calculate note count

                return (
                  <div
                    key={note.id}
                    id={`note-${note.id}`}
                    className={`
                      relative rounded-xl p-6 shadow-md border
                      ${isUrgent ? 'border-red-500 highlight-urgent' : 'border-gray-200 dark:border-gray-700'}
                      ${sectionColorMap[note.section_heading] || "bg-gray-50 dark:bg-gray-800"}
                      transition-all duration-200 hover:shadow-lg
                      ${note.is_re_shared_profile_note ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}
                    `}
                  >
                    <span
                      className={`absolute top-4 right-4 px-3 py-1.5 text-xs font-normal rounded-full ${badgeColorMap[note.section_heading] || "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                    >
                      {note.section_heading}
                    </span>
                    <span className="absolute top-4 left-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
                      #{noteNumber}
                    </span>
                    {isUrgent && (
                      <>
                        <IconAlertCircle size={20} className="absolute top-4 left-14 h-5 w-5 text-red-500" />
                        <span className="absolute top-4 right-28 px-3 py-1.5 text-xs font-normal rounded-full bg-red-500 text-white animate-pulse-urgent">
                          {urgencyLabel}
                        </span>
                      </>
                    )}
                    {note.is_re_shared_profile_note && (
                        <span className="absolute top-4 right-28 px-3 py-1.5 text-xs font-normal rounded-full bg-yellow-500 text-white animate-pulse-urgent">
                            Multiple Times Shared
                        </span>
                    )}
                    {firstField && (
                      <p className={`text-base mb-2 leading-snug pt-8 ${firstFieldColorMap[note.section_heading] || "text-gray-900 dark:text-gray-100"}`}>
                        <span className="font-normal">{firstField.label}:</span> <span className="font-medium">{firstField.value}</span>
                      </p>
                    )}
                    <div className="space-y-1 text-gray-700 dark:text-gray-300">
                      {note.note && !firstField?.label.includes("Note") && ( // Only show if not the primary highlighted field
                        <p className="text-sm font-normal">
                          <span className="font-normal">Follow-Up Note:</span> {note.note}
                        </p>
                      )}
                      {note.call_status && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Call Status:</span> {CALL_STATUS_OPTIONS.find(opt => opt.value === note.call_status)?.label || note.call_status}
                        </p>
                      )}
                      {note.call_status_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.call_status_note}
                        </p>
                      )}
                      {note.call_status_other_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Other Note:</span> {note.call_status_other_note}
                        </p>
                      )}
                      {note.profile_status && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Profile Status:</span> {PROFILE_STATUS_OPTIONS.find(opt => opt.value === note.profile_status)?.label || note.profile_status}
                        </p>
                      )}
                      {note.profile_status_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.profile_status_note}
                        </p>
                      )}
                      {note.future_match_status && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Future Match Status:</span> {FUTURE_MATCH_STATUS_OPTIONS.find(opt => opt.value === note.future_match_status)?.label || note.future_match_status}
                        </p>
                      )}
                      {note.future_match_status_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.future_match_status_note}
                        </p>
                      )}
                      {note.communication_status && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Communication Status:</span> {COMMUNICATION_STATUS_OPTIONS.find(opt => opt.value === note.communication_status)?.label || note.communication_status}
                        </p>
                      )}
                      {note.communication_status_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.communication_status_note}
                        </p>
                      )}
                      {note.past_match_status && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Past Match Status:</span> {PAST_MATCH_STATUS_OPTIONS.find(opt => opt.value === note.past_match_status)?.label || note.past_match_status}
                        </p>
                      )}
                      {note.past_match_status_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.past_match_status_note}
                        </p>
                      )}
                      {note.match_process_status && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Match Process Status:</span> {MATCH_PROCESS_STATUS_OPTIONS.find(opt => opt.value === note.match_process_status)?.label || note.match_process_status}
                        </p>
                      )}
                      {note.match_process_status_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.match_process_status_note}
                        </p>
                      )}
                      {note.marriage_progress_status && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Marriage Progress Status:</span> {MARRIAGE_PROGRESS_STATUS_OPTIONS.find(opt => opt.value === note.marriage_progress_status)?.label || note.marriage_progress_status}
                        </p>
                      )}
                      {note.marriage_progress_status_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.marriage_progress_status_note}
                        </p>
                      )}
                      {note.marriage_outcome_status && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Marriage Outcome Status:</span> {MARRIAGE_OUTCOME_STATUS_OPTIONS.find(opt => opt.value === note.marriage_outcome_status)?.label || note.marriage_outcome_status}
                        </p>
                      )}
                      {note.marriage_outcome_status_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.marriage_outcome_status_note}
                        </p>
                      )}
                      {note.profile_closed_status && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Profile Closed Status:</span> {PROFILE_CLOSED_STATUS_OPTIONS.find(opt => opt.value === note.profile_closed_status)?.label || note.profile_closed_status}
                        </p>
                      )}
                      {note.profile_closed_status_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.profile_closed_status_note}
                        </p>
                      )}
                      {note.payment_amount && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Payment Amount:</span> ₹{note.payment_amount.toLocaleString('en-IN')}
                        </p>
                      )}
                      {note.payment_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Note Details:</span> {note.payment_note}
                        </p>
                      )}
                      {note.reminder_date && (
                        <p className="text-sm font-normal flex items-center gap-1">
                          <IconCalendarEvent size={16} className="text-blue-500" />
                          <span className="font-normal">Reminder Date:</span> {moment(note.reminder_date).tz("Asia/Kolkata").format("DD-MM-YYYY")}
                        </p>
                      )}
                      {note.reminder_note && (
                        <p className="text-sm font-normal">
                          <span className="font-normal">Reminder Note:</span> {note.reminder_note}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 font-normal border-t border-gray-200 dark:border-gray-700 pt-3">
                      <span className="font-normal">Created:</span> {moment(note.created_at).tz("Asia/Kolkata").format("DD-MM-YYYY h:mm A")}
                    </p>
                    {(note.image || note.file_upload || note.call_status_image || note.profile_status_image || note.future_match_status_image || note.communication_status_image || note.past_match_status_image || note.match_process_status_image || note.marriage_progress_status_image || note.marriage_outcome_status_image || note.profile_closed_status_image || note.payment_image) && (
                      <div className="mt-3 flex flex-wrap gap-3 items-center">
                        {note.image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.image)}>
                            <img
                              src={note.image}
                              alt="Note image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">General Image</span>
                          </div>
                        )}
                        {note.file_upload && (
                          <div className="flex flex-col items-center">
                            <AudioPlayer src={note.file_upload} />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">General Audio</span>
                          </div>
                        )}
                        {note.call_status_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.call_status_image)}>
                            <img
                              src={note.call_status_image}
                              alt="Call Status image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Call Status Image</span>
                          </div>
                        )}
                        {note.profile_status_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.profile_status_image)}>
                            <img
                              src={note.profile_status_image}
                              alt="Profile Status image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Profile Status Image</span>
                          </div>
                        )}
                        {note.future_match_status_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.future_match_status_image)}>
                            <img
                              src={note.future_match_status_image}
                              alt="Future Match Status image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Future Match Image</span>
                          </div>
                        )}
                        {note.communication_status_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.communication_status_image)}>
                            <img
                              src={note.communication_status_image}
                              alt="Communication Status image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Communication Image</span>
                          </div>
                        )}
                        {note.past_match_status_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.past_match_status_image)}>
                            <img
                              src={note.past_match_status_image}
                              alt="Past Match Status image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Past Match Image</span>
                          </div>
                        )}
                        {note.match_process_status_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.match_process_status_image)}>
                            <img
                              src={note.match_process_status_image}
                              alt="Match Process Status image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Match Process Image</span>
                          </div>
                        )}
                        {note.marriage_progress_status_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.marriage_progress_status_image)}>
                            <img
                              src={note.marriage_progress_status_image}
                              alt="Marriage Progress Status image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Marriage Progress Image</span>
                          </div>
                        )}
                        {note.marriage_outcome_status_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.marriage_outcome_status_image)}>
                            <img
                              src={note.marriage_outcome_status_image}
                              alt="Marriage Outcome Status image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Marriage Outcome Image</span>
                          </div>
                        )}
                        {note.profile_closed_status_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.profile_closed_status_image)}>
                            <img
                              src={note.profile_closed_status_image}
                              alt="Profile Closed Status image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Profile Closed Image</span>
                          </div>
                        )}
                        {note.payment_image && (
                          <div className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImageForZoom(note.payment_image)}>
                            <img
                              src={note.payment_image}
                              alt="Payment image"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Payment Image</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {selectedImageForZoom && (
        <ImageZoomModal src={selectedImageForZoom} onClose={() => setSelectedImageForZoom(null)} />
      )}
      <style>{`
        /* Tailwind CSS custom properties for toast */
        :root {
          --bg-toast: #fff;
          --text-toast: #333;
          --border-toast: #e2e8f0;
          --shadow-toast: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .dark {
          --bg-toast: #1f2937; /* gray-800 */
          --text-toast: #e5e7eb; /* gray-200 */
          --border-toast: #374151; /* gray-700 */
          --shadow-toast: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @keyframes pulse-stage {
          0% { transform: scale(1.05); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { transform: scale(1.08); box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
          100% { transform: scale(1.05); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        @keyframes pulse-urgent {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-pulse-stage {
          animation: pulse-stage 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-pulse-urgent {
          animation: pulse-urgent 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .pipeline-stage-arrow {
          clip-path: polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%);
          margin-right: 10px;
        }
        .flex-wrap > .pipeline-stage-arrow:last-child {
          margin-right: 0;
          clip-path: none;
        }

        /* React-Datetime overrides for dark mode */
        .rdtPicker {
          width: 100%;
          border: 1px solid #d1d5db; /* gray-300 */
          border-radius: 0.5rem;
          background: #fff;
          font-family: 'Inter', sans-serif; /* Ensure consistent font */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 1000; /* Ensure it appears above other content */
        }

        .dark .rdtPicker {
          background: #1f2937; /* gray-800 */
          border-color: #374151; /* gray-700 */
          color: #e5e7eb; /* gray-200 */
        }

        .rdtPicker td.rdtDay,
        .rdtPicker th.rdtSwitch,
        .rdtPicker th.rdtNext,
        .rdtPicker th.rdtPrev,
        .rdtPicker .rdtTimeToggle,
        .rdtPicker .rdtCount {
          color: #4b5563; /* gray-700 */
        }

        .dark .rdtPicker td.rdtDay,
        .dark .rdtPicker th.rdtSwitch,
        .dark .rdtPicker th.rdtNext,
        .dark .rdtPicker th.rdtPrev,
        .dark .rdtPicker .rdtTimeToggle,
        .dark .rdtPicker .rdtCount {
          color: #d1d5db; /* gray-300 */
        }

        .rdtPicker td.rdtDay:hover,
        .rdtPicker td.rdtHour:hover,
        .rdtPicker td.rdtMinute:hover,
        .rdtPicker td.rdtDay.rdtToday:hover {
          background: #e5e7eb; /* gray-200 */
          color: #1f2937; /* gray-900 */
        }

        .dark .rdtPicker td.rdtDay:hover,
        .dark .rdtPicker td.rdtHour:hover,
        .dark .rdtPicker td.rdtMinute:hover,
        .dark .rdtPicker td.rdtDay.rdtToday:hover {
          background: #374151; /* gray-700 */
          color: #e5e7eb; /* gray-200 */
        }

        .rdtPicker td.rdtActive,
        .rdtPicker td.rdtActive:hover {
          background: #3b82f6; /* blue-500 */
          color: #fff;
          text-shadow: none; /* Remove default text-shadow */
        }

        .dark .rdtPicker td.rdtActive,
        .dark .rdtPicker td.rdtActive:hover {
          background: #2563eb; /* blue-600 */
        }

        .rdtPicker td.rdtToday {
          background-color: #eff6ff; /* blue-50 */
          color: #2563eb; /* blue-600 */
        }

        .dark .rdtPicker td.rdtToday {
          background-color: #1e3a8a; /* blue-900 */
          color: #93c5fd; /* blue-300 */
        }

        .rdtPicker th.rdtSwitch:hover,
        .rdtPicker th.rdtPrev:hover,
        .rdtPicker th.rdtNext:hover {
          background-color: #e5e7eb; /* gray-200 */
          border-radius: 0.25rem;
        }

        .dark .rdtPicker th.rdtSwitch:hover,
        .dark .rdtPicker th.rdtPrev:hover,
        .dark .rdtPicker th.rdtNext:hover {
          background-color: #374151; /* gray-700 */
        }

        .rdtPicker .rdtTime {
          border-top: 1px solid #e5e7eb; /* gray-200 */
        }

        .dark .rdtPicker .rdtTime {
          border-color: #374151; /* gray-700 */
        }

        .rdtPicker .rdtTime ul {
          border: none;
        }

        .rdtPicker .rdtTime ul li {
          color: #4b5563; /* gray-700 */
        }

        .dark .rdtPicker .rdtTime ul li {
          color: #d1d5db; /* gray-300 */
        }

        .rdtPicker .rdtTime ul li.rdtActive {
          background-color: #3b82f6; /* blue-500 */
          color: #fff;
        }

        .dark .rdtPicker .rdtTime ul li.rdtActive {
          background-color: #2563eb; /* blue-600 */
        }

        .rdtPicker .rdtTime ul li.rdtActive:hover {
          background-color: #2563eb; /* blue-600 */
        }

        .dark .rdtPicker .rdtTime ul li.rdtActive:hover {
          background-color: #1d4ed8; /* blue-700 */
        }

        .rdtPicker .rdtTime ul li:hover {
          background-color: #e5e7eb; /* gray-200 */
        }

        .dark .rdtPicker .rdtTime ul li:hover {
          background-color: #374151; /* gray-700 */
        }

        /* Custom range input styling for progress bar */
        input[type="range"]::-webkit-slider-runnable-track {
          background: linear-gradient(to right, #3b82f6 var(--progress-width), #d1d5db var(--progress-width));
          border-radius: 0.5rem;
          height: 8px; /* Increased height */
        }

        input[type="range"]::-moz-range-track {
          background: linear-gradient(to right, #3b82f6 var(--progress-width), #d1d5db var(--progress-width));
          border-radius: 0.5rem;
          height: 8px; /* Increased height */
        }

        .dark input[type="range"]::-webkit-slider-runnable-track {
          background: linear-gradient(to right, #2563eb var(--progress-width), #4b5563 var(--progress-width));
        }

        .dark input[type="range"]::-moz-range-track {
          background: linear-gradient(to right, #2563eb var(--progress-width), #4b5563 var(--progress-width));
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px; /* Increased thumb size */
          width: 16px; /* Increased thumb size */
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          margin-top: -4px; /* Adjust to center thumb vertically */
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
        }

        .dark input[type="range"]::-webkit-slider-thumb {
          background: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.4);
        }

        input[type="range"]::-moz-range-thumb {
          height: 16px; /* Increased thumb size */
          width: 16px; /* Increased thumb size */
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
        }

        .dark input[type="range"]::-moz-range-thumb {
          background: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.4);
        }

        /* Animations for modal */
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoom-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .animate-zoom-in {
          animation: zoom-in 0.3s ease-out forwards;
        }
      `}</style>
    </ErrorBoundary>
  );
};

export default FollowUpNotes;
