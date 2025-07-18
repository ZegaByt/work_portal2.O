import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Ensure correct path
import {
  ChevronLeft, ChevronRight, LayoutDashboard, Search, Users,
  PieChart, FileText, Briefcase, BookOpen, Award, Heart,
  Plus, Edit, MessageSquare, User, Bell, Settings,
  LogOut, Shield, ShieldCheck, FileImage, FileText as FileTextIcon,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Home, FolderKanban, MessageCircle, ShieldAlert, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming 'cn' is a utility that combines class names

const Sidebar = ({ isMobile, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState(new Set());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { userRole, logout } = useAuth(); // Destructure logout from useAuth

  useEffect(() => {
    const initialOpenSections = new Set();
    getMenuItemsByRole(userRole).forEach((section) => {
      initialOpenSections.add(section.title);
    });
    setOpenSections(initialOpenSections);
  }, [userRole]);

  const handleToggleSidebar = () => {
    setCollapsed(!collapsed);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const toggleSection = (sectionTitle) => {
    setOpenSections(prevOpenSections => {
      const newOpenSections = new Set(prevOpenSections);
      if (newOpenSections.has(sectionTitle)) {
        newOpenSections.delete(sectionTitle);
      } else {
        newOpenSections.add(sectionTitle);
      }
      return newOpenSections;
    });
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true); // Show confirmation popup
  };

  const confirmLogout = () => {
    // This now directly calls the `logout` function from AuthContext
    // which handles the API call and redirection.
    logout();
    setShowLogoutConfirm(false); // Close popup after initiating logout
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false); // Close popup if canceled
  };

  const menuItems = getMenuItemsByRole(userRole);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gray-800 text-gray-200 shadow-lg transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64",
        isMobile && "fixed inset-y-0 left-0 z-40 bg-gray-800"
      )}
    >
      {/* Logo and toggle */}
      <div
        className={cn(
          "flex items-center p-4 border-b border-gray-700",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-rose-500 fill-current" />
            <span className="font-extrabold text-lg tracking-wide text-white">GMB</span>
          </div>
        )}
        <button
          onClick={handleToggleSidebar}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200 text-gray-400 hover:text-white"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-grow overflow-y-auto py-4 custom-scrollbar">
        {menuItems.map((section, idx) => {
          const isSectionOpen = openSections.has(section.title);
          return (
            <div key={idx} className="mb-4">
              {/* Section Header with Icon and Toggle Button */}
              <div
                className={cn(
                  "flex items-center",
                  !collapsed ? "justify-between px-5" : "justify-center"
                )}
              >
                {!collapsed && (
                  <h4
                    className="flex items-center gap-x-2 text-xs uppercase tracking-wider text-gray-400 font-semibold cursor-pointer select-none"
                    onClick={() => toggleSection(section.title)}
                  >
                    {section.icon && <section.icon className="h-3.5 w-3.5" />}
                    {section.title}
                  </h4>
                )}
                <button
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    "p-1 hover:bg-gray-700 rounded-md transition-colors duration-200 text-gray-400 hover:text-white",
                    collapsed && "mx-auto"
                  )}
                  title={isSectionOpen ? "Collapse section" : "Expand section"}
                >
                  {isSectionOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isSectionOpen && (
                <div className="mt-2">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={`/dashboard/${userRole.toLowerCase()}${item.path}`}
                      onClick={closeMobileSidebar}
                      end={item.path === ""}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                          collapsed ? "justify-center w-16 mx-auto" : "px-5 mx-3",
                          isActive
                            ? "bg-rose-600 text-white shadow-md"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="ml-3">{item.name}</span>}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User and Logout */}
      <div className="p-4 border-t border-gray-700 mt-auto">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <>
              <button
                onClick={handleLogoutClick}
                className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium group"
              >
                <LogOut className="h-4 w-4 mr-2 group-hover:text-rose-500 transition-colors" />
                <span>Logout</span>
              </button>
              <button
                className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200 text-gray-400 hover:text-white"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={handleLogoutClick}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200 text-gray-400 hover:text-white"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <button
                className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200 text-gray-400 hover:text-white"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all scale-100 opacity-100 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <LogOut className="h-5 w-5 text-rose-600 mr-2" /> Confirm Logout
            </h3>
            <p className="text-gray-700 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-75 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get menu items based on user role (remains unchanged)
function getMenuItemsByRole(role) {
    const common = [
      {
        title: "Main",
        icon: Home, // Added icon for Main section
        items: [
          { name: "My Dashboard", path: "", icon: LayoutDashboard },
          { name: "Bureau Dashboard", path: "/dashboard2", icon: PieChart },
          { name: "Key to Search", path: "/key-search", icon: Search },
          { name: "Special Search", path: "/special-search", icon: Search },
          // { name: "Adv Search", path: "/adv-search", icon: Search },
        ],
      },
      {
        title: "Profiles",
        icon: FolderKanban, // Added icon for Profiles section
        items: [
          { name: "All Customers", path: "/all-customers", icon: Plus },
          
          // { name: "Edit My Profile", path: "/edit-profile", icon: Edit },
           { name: "Offline Customers", path: "/offline-customers", icon: BookOpen },
          { name: "Live Customers", path: "/live-customers", icon: BookOpen },
        ],
      },
      {
        title: "Communication",
        icon: MessageCircle, // Added icon for Communication section
        items: [
                    
          { name: "My Login History", path: "/my-login-history", icon: MessageSquare },
          
          { name: "Success Stories", path: "/success-stories", icon: Award },
          { name: "Match Making App", path: "/match-making", icon: Award },
          { name: "Telugu Calendar", path: "/telugu-calendar", icon: Award },
        ],
      },
    ];

    const employeeItems = [
      ...common,
      {
        title: "My Work",
        icon: Briefcase, // Added icon for My Work section
        items: [
          { name: "My Customers", path: "/my-customers", icon: User },
          // { name: "Profile Report", path: "/profile-report", icon: FileText },
          // { name: "Emp Report", path: "/emp-report", icon: FileText },
          // { name: "Buckets/Notepad", path: "/buckets", icon: BookOpen },
          // { name: "Alloted Profiles", path: "/alloted-profiles", icon: User },
          // { name: "Paid Profiles", path: "/paid-profiles", icon: User },
          // { name: "Viewed Profiles", path: "/viewed-profiles", icon: User },
          // { name: "Customer Interests", path: "/customers-interests", icon: User },
          { name: "UnAssigned Customers", path: "/unassigned-customers", icon: User },
          { name: "My Work Report", path:"/my-work", icon: User },
          { name: "Action Today", path:"/action-today", icon: User },
          { name: "My Pinned Customers", path:"/pinned-customers", icon: User },
         
          // { name: "My Offline Customers", path: "/my-offline-customers", icon: BookOpen },

        ],
      },
    ];

    const adminItems = [
      ...common,
      {
        title: "Management",
        icon: Briefcase, // Added icon for Management section
        items: [
          { name: "My Employees", path: "/my-employees", icon: Users },
          { name: "My Emp Follow-ups", path: "/emp-followups", icon: Users },
          {name: "My Emp Daily Work Report", path: "/my-emp-daily-work-report", icon: FileText},
          {name: "My Employee Login Data", path: "/employee-logins", icon: FileText},
          { name: "Customer Unassigned", path: "/customer-unas", icon: MessageSquare },
          { name: "My Emp Actions", path: "/my-emp-actions", icon: MessageSquare },
          // { name: "Employee Report", path: "/employee-report", icon: FileText },
          // { name: "Profile Report by Emp", path: "/profile-report-by-emp", icon: FileTextIcon },
          // { name: "Emp Management", path: "/emp-management", icon: Briefcase },
          // { name: "Bucket/Notepad Mgmt", path: "/bucket-management", icon: BookOpen },
        ],
      },
      {
        title: "Requests",
        icon: Bell, // Added icon for Requests section
        items: [
          { name: "All Requests", path: "/emp-requests", icon: Bell },
          // { name: "Profile Live Request", path: "/profile-live-requests", icon: Bell },
          { name: "Payment Approval", path: "/payment-admin", icon: Bell },
          // { name: "Profile Status Change", path: "/profile-status-change", icon: Bell },
          // { name: "Viewed Profiles by Emp", path: "/viewed-profiles-by-emp", icon: Bell },
        ],
      },
    ];

    const superAdminItems = [
      ...common,
      {
        title: "Super Management",
        icon: ShieldAlert, // Added icon for Super Management section
        items: [
          { name: "All Admins", path: "/all-admins", icon: Shield },
          { name: "All Employees", path: "/all-employees", icon: Users },
          // { name: "Admin Reports", path: "/admin-reports", icon: FileText },
          // { name: "Employee Reports", path: "/employee-reports", icon: FileText },
          // { name: "Profile Report by Emp", path: "/profile-report-by-emp", icon: FileTextIcon },
          // { name: "Emp Management", path: "/emp-management", icon: Briefcase },
          // { name: "Bucket/Notepad Mgmt", path: "/bucket-management", icon: BookOpen },
          //{ name: "Offline Customers", path: "/offline-customers", icon: BookOpen },
          { name: "Live Customers", path: "/live-customers", icon: BookOpen },
          { name: "Emp Lead Follow-up", path: "/lead-followups", icon: FileText },
          { name: "Daily Work Report", path: "/daily-work-report", icon: FileText },
          // { name: "Preferred Matches", path: "/preferred-matches", icon: MessageSquare },
          { name: "Customer Unassigned", path: "/customer-unas", icon: MessageSquare },
        ],
      },
      {
        title: "System Management",
        icon: Wrench, // Added icon for System Management section
        items: [
          { name: "Incharges", path: "/incharges", icon: Edit },
          { name: "My Emp Login History", path: "/my-emp-login-history", icon: MessageSquare },
          
          // { name: "Website Edit", path: "/website-edit", icon: Edit },
          // { name: "Customer Portal", path: "/customer-portal", icon: Users },
          // { name: "Bureau Data Update", path: "/bureau-data", icon: FileText },
          // { name: "Import Customer Data", path: "/import-data", icon: FileImage },
          // { name: "Privacy & Policy", path: "/privacy-policy", icon: ShieldCheck },
          // { name: "Enquiry", path: "/enquiry", icon: MessageSquare },
          // { name: "Careers", path: "/careers", icon: Briefcase },
        ],
      },
      {
        title: "Requests",
        icon: Bell, // Added icon for Requests section
        items: [
          { name: "All Requests", path: "/all-requests", icon: Bell },
          // { name: "Profile Live Request", path: "/profile-live-requests", icon: Bell },
          { name: "Payment Approval", path: "/payment-approval", icon: Bell },
          // { name: "Profile Status Change", path: "/profile-status-change", icon: Bell },
          // { name: "Viewed Profiles", path: "/viewed-profiles-admin", icon: Bell },
        ],
      },
    ];

    switch (role) {
      case "Employee":
        return employeeItems;
      case "Admin":
        return adminItems;
      case "SuperAdmin":
        return superAdminItems;
      default:
        return common;
    }
  }

export default Sidebar;