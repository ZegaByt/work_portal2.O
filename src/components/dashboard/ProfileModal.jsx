import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, PencilIcon } from "lucide-react";
import { getData, patchData } from '../../store/httpService';

const AVATAR_COLOR_PALETTE = [
  ['bg-red-500', 'text-white'],
  ['bg-pink-500', 'text-white'],
  ['bg-purple-500', 'text-white'],
  ['bg-indigo-500', 'text-white'],
  ['bg-blue-500', 'text-white'],
  ['bg-cyan-500', 'text-gray-900'],
  ['bg-teal-500', 'text-white'],
  ['bg-green-500', 'text-white'],
  ['bg-lime-500', 'text-gray-900'],
  ['bg-yellow-500', 'text-gray-900'],
  ['bg-amber-500', 'text-gray-900'],
  ['bg-orange-500', 'text-white'],
  ['bg-fuchsia-500', 'text-white'],
  ['bg-emerald-500', 'text-white'],
  ['bg-sky-500', 'text-gray-900'],
];

const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL;



const ProfileModal = ({ open, onClose, profile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [genders, setGenders] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(profile?.image || "");
  const [isLoadingGenders, setIsLoadingGenders] = useState(false);
  const [genderError, setGenderError] = useState(null);

  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const parts = fullName.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].charAt(0).toUpperCase();
    }
    return "U";
  };

  const profileAvatarColors = React.useMemo(() => {
    const initialForColor = getInitials(profile?.full_name);
    const firstLetter = initialForColor.charAt(0).toUpperCase();
    const charCode = firstLetter.charCodeAt(0) - 65;
    const validCharCode = (charCode >= 0 && charCode <= 25) ? charCode : 0;
    const colorIndex = validCharCode % AVATAR_COLOR_PALETTE.length;
    return AVATAR_COLOR_PALETTE[colorIndex] || ['bg-gray-400', 'text-gray-900'];
  }, [profile?.full_name]);

  const [bgColorClass, textColorClass] = profileAvatarColors;

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        mobile_number: profile.mobile_number || "",
        dob: profile.dob ? new Date(profile.dob) : null,
        gender: profile.gender ? profile.gender.toString() : "", // Convert to string for Select
        address: profile.address || "",
        education: profile.education || "",
        emergency_contact: profile.emergency_contact || "",
      });
      setImagePreview(profile.image ? `${BASE_URL}${profile.image}` : ""); // Append base URL
    }
  }, [profile]);

  useEffect(() => {
    const fetchGenders = async () => {
      setIsLoadingGenders(true);
      try {
        const response = await getData('/gender');
        console.log(response)
        console.log('Fetched genders:', response.results); // Debugging
        setGenders(response.data.results || []);
        setGenderError(null);
      } catch (error) {
        console.error('Failed to fetch genders:', error);
        setGenderError('Failed to load gender options');
      } finally {
        setIsLoadingGenders(false);
      }
    };
    fetchGenders();
  }, []);

  const getGenderName = (genderId) => {
    if (!genderId) return "N/A";
    const gender = genders.find(g => g.id === parseInt(genderId));
    return gender ? gender.name : "N/A";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
  try {
    const patchPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'dob' && value) {
        patchPayload.append(key, format(value, 'yyyy-MM-dd'));
      } else if (value !== "" && value !== null) {
        patchPayload.append(key, value);
      }
    });
    if (imageFile) {
      console.log('Appending image:', imageFile.name); // Debugging
      patchPayload.append('image', imageFile);
    }
    console.log('Patch payload:', Object.fromEntries(patchPayload)); // Debugging
    await patchData('/profile/', patchPayload); // Note the trailing slash
    setIsEditing(false);
    setImageFile(null); // Reset image file after save
  } catch (error) {
    console.error('Failed to update profile:', error);
    alert('Failed to save profile. Please try again.');
  }
};


  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: profile.full_name || "",
      email: profile.email || "",
      mobile_number: profile.mobile_number || "",
      dob: profile.dob ? new Date(profile.dob) : null,
      gender: profile.gender ? profile.gender.toString() : "",
      address: profile.address || "",
      education: profile.education || "",
      emergency_contact: profile.emergency_contact || "",
    });
    setImageFile(null);
    setImagePreview(profile.image || "");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl animate-scale-in">
        <DialogHeader className="flex flex-col items-center pt-6 pb-4 border-b border-border relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => setIsEditing(true)}
            disabled={isEditing}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Avatar className={`h-24 w-24 mb-4 text-4xl font-bold border-4 border-white dark:border-gray-900 shadow-lg ${bgColorClass} ${textColorClass}`}>
            <AvatarImage src={imagePreview} alt={formData.full_name || "User Avatar"} />
            <AvatarFallback>{getInitials(formData.full_name)}</AvatarFallback>
          </Avatar>
          {isEditing && (
            <div className="mb-4">
              <Label htmlFor="image-upload" className="text-sm font-medium">
                Upload Image
              </Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1"
              />
            </div>
          )}
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {formData.full_name || "Profile Details"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {isEditing ? "Edit your personal information." : "View and manage your personal information."}
          </DialogDescription>
        </DialogHeader>

        {profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 p-6 overflow-y-auto max-h-[calc(80vh-200px)] custom-scrollbar">
            {/* Full Name Field */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</p>
              {isEditing ? (
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="font-semibold text-gray-800 dark:text-gray-200 break-words">{formData.full_name || "N/A"}</p>
              )}
            </div>
            {/* Email Field */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</p>
              {isEditing ? (
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="font-semibold text-gray-800 dark:text-gray-200 break-words">{formData.email || "N/A"}</p>
              )}
            </div>
            {/* Mobile Number Field */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mobile:</p>
              {isEditing ? (
                <Input
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="font-semibold text-gray-800 dark:text-gray-200">{formData.mobile_number || "N/A"}</p>
              )}
            </div>
            {/* DOB Field */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">DOB:</p>
              {isEditing ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!formData.dob && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dob ? format(formData.dob, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dob}
                      onSelect={(date) => setFormData(prev => ({ ...prev, dob: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <p className="font-semibold text-gray-800 dark:text-gray-200">{formData.dob ? format(formData.dob, "PPP") : "N/A"}</p>
              )}
            </div>
            {/* Gender Field */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gender:</p>
              {isEditing ? (
                isLoadingGenders ? (
                  <p className="text-sm text-muted-foreground">Loading genders...</p>
                ) : genderError ? (
                  <p className="text-sm text-red-500">{genderError}</p>
                ) : genders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No gender options available</p>
                ) : (
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map(gender => (
                        <SelectItem key={gender.id} value={gender.id.toString()}>
                          {gender.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              ) : (
                <p className="font-semibold text-gray-800 dark:text-gray-200">{getGenderName(formData.gender)}</p>
              )}
            </div>
            {/* Address Field */}
            <div className="space-y-1 col-span-full">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Address:</p>
              {isEditing ? (
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="font-semibold text-gray-800 dark:text-gray-200 break-words">{formData.address || "N/A"}</p>
              )}
            </div>
            {/* Education Field */}
            <div className="space-y-1 col-span-full">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Education:</p>
              {isEditing ? (
                <Input
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="font-semibold text-gray-800 dark:text-gray-200 break-words">{formData.education || "N/A"}</p>
              )}
            </div>
            {/* Emergency Contact Field */}
            <div className="space-y-1 col-span-full">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Emergency Contact:</p>
              {isEditing ? (
                <Input
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="font-semibold text-gray-800 dark:text-gray-200">{formData.emergency_contact || "N/A"}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            Loading profile...
          </div>
        )}

        {isEditing && (
          <div className="flex justify-end gap-2 p-4 border-t border-border">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        )}

        <style>{`
          @keyframes scaleIn {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-scale-in {
            animation: scaleIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;