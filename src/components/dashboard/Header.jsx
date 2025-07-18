import React, { useState, useMemo, useEffect } from "react";
import { Bell, Menu, User, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ProfileModal from "./ProfileModal";
import { getData } from "../../store/httpservice";
import {
  IconUserCircle,
  IconNotes,
  IconHeart,
  IconFileDescription, // For basic profile
  IconFileInvoice, // For full profile
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

// Define a list of vibrant, "glassy" color pairs for avatars
const AVATAR_COLOR_PALETTE = [
  ["bg-gradient-to-br from-purple-600 to-indigo-600", "text-white"],
  ["bg-gradient-to-br from-pink-500 to-rose-500", "text-white"],
  ["bg-gradient-to-br from-blue-500 to-cyan-500", "text-white"],
  ["bg-gradient-to-br from-green-500 to-emerald-500", "text-white"],
  ["bg-gradient-to-br from-yellow-500 to-amber-500", "text-gray-900"],
  ["bg-gradient-to-br from-red-600 to-orange-600", "text-white"],
  ["bg-gradient-to-br from-teal-500 to-sky-500", "text-white"],
  ["bg-gradient-to-br from-fuchsia-600 to-purple-600", "text-white"],
  ["bg-gradient-to-br from-lime-500 to-green-600", "text-gray-900"],
  ["bg-gradient-to-br from-indigo-500 to-blue-500", "text-white"],
];

// Color mapping for profile completion badge
const PROFILE_COMPLETION_COLORS = {
  red: [
    "bg-gradient-to-r from-red-500 to-red-600",
    "text-white",
    "border-red-700",
    "shadow-red-500/50",
  ], // 0-30%
  orange: [
    "bg-gradient-to-r from-orange-500 to-orange-600",
    "text-white",
    "border-orange-700",
    "shadow-orange-500/50",
  ], // 30-60%
  pink: [
    "bg-gradient-to-r from-pink-500 to-pink-600",
    "text-white",
    "border-pink-700",
    "shadow-pink-500/50",
  ], // 60-80%
  green: [
    "bg-gradient-to-r from-green-500 to-green-600",
    "text-white",
    "border-green-700",
    "shadow-green-500/50",
  ], // Above 80%
};

// Base URL for images
const BASE_URL = import.meta.env.VITE_BASE_MEDIA_URL;


// Custom Hook for Theme Management
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === "dark";

    root.classList.remove(isDark ? "light" : "dark");
    root.classList.add(isDark ? "dark" : "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return [theme, toggleTheme];
};

const Header = ({
  toggleMobileNav,
  customerName,
  customerProfilePic,
  profileCompletion,
  accountStatus,
  paymentStatus,
  onOpenBasicProfileModal,
  onOpenFullProfileModal,
  onSetActiveTab,
  currentActiveTab,
  notifications,
}) => {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Use the passed notifications prop directly, default to empty array if undefined
  const displayNotifications = notifications || [];

  // Debug props
  useEffect(() => {
    console.log("Header Props:", {
      customerName,
      customerProfilePic,
      profileCompletion,
      accountStatus,
      paymentStatus,
      onOpenBasicProfileModal,
      notifications,
    });
  }, [
    customerName,
    customerProfilePic,
    profileCompletion,
    accountStatus,
    paymentStatus,
    onOpenBasicProfileModal,
    notifications,
  ]);

  const handleProfileClick = async () => {
    try {
      const response = await getData("/profile/");
      setProfileData(response.data);
      setProfileModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  // Helper to get initials, always returns at least one character
  const getInitials = (fullName) => {
    if (!fullName) return "U";

    const parts = fullName.trim().split(" ");
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return "U";
  };

  // Construct full image URL
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `${BASE_URL}${imagePath}`;
  };

  // Memoize random color assignment based on the first letter of the user's name
  const userAvatarColors = useMemo(() => {
    const initialForColor = getInitials(user?.profile?.full_name);
    const firstLetter = initialForColor.charAt(0).toUpperCase();

    const charCode = firstLetter.charCodeAt(0) - 65;
    const validCharCode = charCode >= 0 && charCode <= 25 ? charCode : 0;
    const colorIndex = validCharCode % AVATAR_COLOR_PALETTE.length;

    return AVATAR_COLOR_PALETTE[colorIndex] || ["bg-gray-400", "text-gray-900"];
  }, [user?.profile?.full_name]);

  const [bgColorClass, textColorClass] = userAvatarColors;

  // Determine badge colors based on profileCompletion
  const getProfileCompletionBadgeClasses = (completion) => {
    if (completion >= 80) {
      return PROFILE_COMPLETION_COLORS.green;
    } else if (completion >= 60) {
      return PROFILE_COMPLETION_COLORS.pink;
    } else if (completion >= 30) {
      return PROFILE_COMPLETION_COLORS.orange;
    } else {
      return PROFILE_COMPLETION_COLORS.red;
    }
  };

  const [badgeBg, badgeText, badgeBorder, badgeShadow] = useMemo(() => {
    if (profileCompletion !== undefined) {
      return getProfileCompletionBadgeClasses(profileCompletion);
    }
    return ["bg-gray-200", "text-gray-800", "border-gray-300", "shadow-none"];
  }, [profileCompletion]);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-border px-4 py-3 flex flex-wrap items-center justify-between shadow-sm sticky top-0 z-40 animate-fade-in-down">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleMobileNav}
        className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 mr-2"
        aria-label="Toggle mobile navigation"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Left Section: Customer Info / Main Title */}
      <div className="flex items-center space-x-4 flex-grow">
        {customerName ? (
          <>
            {customerProfilePic ? (
              <img
                src={`${BASE_URL}${customerProfilePic}`}
                alt="Customer Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-400 dark:border-blue-600 shadow-sm"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/40x40/e0e0e0/808080?text=Image+Error";
                  e.target.alt = "Image not available";
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <IconUserCircle size={24} className="text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div className="flex flex-col space-y-1">
              <span className="font-normal text-lg text-gray-800 dark:text-gray-200 truncate max-w-40 sm:max-w-60">
                {customerName}
              </span>
              {profileCompletion !== undefined && (
                <Badge
                  className={`text-xs font-medium ${badgeBg} ${badgeText} border ${badgeBorder} shadow-lg ${badgeShadow} transition-all duration-300 ease-in-out transform hover:scale-105`}
                >
                  {Math.round(profileCompletion)}% Completion
                </Badge>
              )}
              {accountStatus !== undefined && (
                <Badge
                  className={`text-xs font-medium ${
                    accountStatus
                      ? "bg-green-500 text-white border-green-700 shadow-green-500/50"
                      : "bg-red-500 text-white border-red-700 shadow-red-500/50"
                  } transition-all duration-300 ease-in-out transform hover:scale-105`}
                >
                  Account is {accountStatus ? "Active" : "Not Active"}
                </Badge>
              )}
              {paymentStatus && (
                <Badge
                  className={`text-xs font-medium ${
                    paymentStatus.toLowerCase() === "paid"
                      ? "bg-green-500 text-white border-green-700 shadow-green-500/50"
                      : "bg-red-500 text-white border-red-700 shadow-red-500/50"
                  } transition-all duration-300 ease-in-out transform hover:scale-105`}
                >
                  Payment: {paymentStatus}
                </Badge>
              )}
            </div>
          </>
        ) : (
          <h1 className="text-2xl font-normal text-gray-900 dark:text-white">
            Dashboard
          </h1>
        )}
      </div>

      {/* Middle Section: Customer-specific actions (conditionally rendered) */}
      {customerName && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2 sm:mt-0 md:flex-nowrap md:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetActiveTab("CustomerDetails")}
            className={`flex items-center gap-1 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 border-2 ${
              currentActiveTab === "CustomerDetails"
                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 shadow-md"
                : "text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            }`}
          >
            <IconUserCircle size={18} />
            <span className="hidden sm:inline">Details</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetActiveTab("Followups")}
            className={`flex items-center gap-1 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 border-2 ${
              currentActiveTab === "Followups"
                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 shadow-md"
                : "text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            }`}
          >
            <IconNotes size={18} />
            <span className="hidden sm:inline">Follow-ups</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetActiveTab("Interests")}
            className={`flex items-center gap-1 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 border-2 ${
              currentActiveTab === "Interests"
                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 shadow-md"
                : "text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            }`}
          >
            <IconHeart size={18} />
            <span className="hidden sm:inline">Interests</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenBasicProfileModal}
            className="flex items-center gap-1 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-800/70 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            title="Forward Basic Profile"
          >
            <IconFileDescription size={18} />
            <span className="hidden sm:inline">Basic</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenFullProfileModal}
            className="flex items-center gap-1 text-xs sm:text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/70 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            title="Forward Full Profile"
          >
            <IconFileInvoice size={18} />
            <span className="hidden sm:inline">Full</span>
          </Button>
        </div>
      )}

      {/* Right Actions: Theme, Notifications, User Menu */}
      <div className="flex items-center space-x-3 ml-auto">
        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="transition-transform duration-200 hover:scale-105"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          )}
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative transition-transform duration-200 hover:scale-105"
            >
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              {displayNotifications.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500 text-white animate-pulse-once">
                  {displayNotifications.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0 shadow-lg rounded-lg overflow-hidden animate-popover-in"
            align="end"
          >
            <div className="p-4 border-b border-border bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                Notifications
              </h3>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {displayNotifications.length > 0 ? (
                displayNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b border-border last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-tight">
                        {notification.text}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No new notifications.
                </div>
              )}
            </div>
            <div className="p-2 border-t border-border bg-gray-50 dark:bg-gray-800">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 rounded-full pr-3 pl-2 transition-transform duration-200 hover:scale-105 group"
            >
              <Avatar
                className={`h-9 w-9 text-lg font-bold shadow-md ring-2 ring-offset-2 ring-offset-background ring-transparent group-hover:ring-indigo-400 transition-all duration-200 ${bgColorClass} ${textColorClass}`}
              >
                {user?.profile?.image && (
                  <AvatarImage
                    src={getProfileImageUrl(user.profile.image)}
                    alt={user?.profile?.full_name || "User Avatar"}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/40x40/e0e0e0/808080?text=Image+Error";
                      e.target.alt = "Image not available";
                    }}
                  />
                )}
                <AvatarFallback>
                  {getInitials(user?.profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate max-w-32">
                  {user?.profile?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">{user?.type}</p>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-60 p-0 shadow-lg rounded-lg overflow-hidden animate-popover-in"
            align="end"
          >
            <div className="p-4 border-b border-border bg-gray-50 dark:bg-gray-800">
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {user?.profile?.full_name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user?.profile?.email}
              </p>
            </div>
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                onClick={handleProfileClick}
              >
                <User className="h-4 w-4 mr-2 text-indigo-500" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 mt-1"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profileData}
      />

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out forwards;
        }

        @keyframes popoverIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-popover-in {
          animation: popoverIn 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes pulseOnce {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse-once {
          animation: pulseOnce 0.8s ease-in-out;
        }

        /* Custom scrollbar for notifications */
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

        /* Dark mode scrollbar */
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
    </header>
  );
};

export default Header;