// import React, { useState } from "react";
// import { Outlet } from "react-router-dom";
// import { useAuth } from "../../contexts/AuthContext";
// import Sidebar from "./Sidebar";
// import Header from "./Header";
// import { useIsMobile } from "@/hooks/use-mobile";
// import { cn } from "@/lib/utils"; // Assuming you have a cn utility for conditional classes

// const DashboardLayout = () => {
//   const { currentUser } = useAuth();
//   const isMobile = useIsMobile();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   const toggleMobileNav = () => {
//     setMobileOpen(!mobileOpen);
//   };

//   return (
//     <div
//       className={cn(
//         "flex h-screen overflow-hidden", // Prevent overall scroll and enable overflow on main content
//         "bg-gray-100 dark:bg-gray-950", // Base background for layout
//         "transition-colors duration-500 ease-in-out" // Smooth background transition for dark mode
//       )}
//     >
//       {/* Sidebar - Conditional rendering based on mobileOpen and isMobile */}
//       {(mobileOpen || !isMobile) && (
//         <Sidebar
//           isMobile={isMobile}
//           setMobileOpen={setMobileOpen}
//           mobileOpen={mobileOpen} // Pass mobileOpen state to Sidebar for internal animations
//         />
//       )}

//       {/* Mobile overlay - Now with a subtle fade and blur */}
//       {isMobile && mobileOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ease-in-out backdrop-blur-sm animate-fade-in-overlay"
//           onClick={() => setMobileOpen(false)}
//         />
//       )}

//       {/* Main content area */}
//       <div
//         className={cn(
//           "flex flex-col flex-1 overflow-hidden", // Ensures header + main content fill remaining space
//           "transform transition-transform duration-500 ease-in-out", // For potential content shift
//           isMobile && mobileOpen && "translate-x-64" // Shift content when sidebar is open on mobile
//         )}
//       >
//         <Header toggleMobileNav={toggleMobileNav} />

//         {/* Dashboard content */}
//         <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 ease-in-out custom-scrollbar">
//           <Outlet />
//         </main>
//       </div>

//       {/* Global CSS for animations (could be in a global CSS file or <style> tag) */}
//       <style>{`
//         /* Overlay fade-in animation */
//         @keyframes fadeInOverlay {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }
//         .animate-fade-in-overlay {
//           animation: fadeInOverlay 0.3s ease-out forwards;
//         }

//         /* Custom scrollbar styles */
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 8px; /* Thicker for better visibility */
//           height: 8px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: var(--tw-bg-gray-200, #e5e7eb); /* Tailwind gray-200 equivalent */
//           border-radius: 10px;
//         }

//         .dark .custom-scrollbar::-webkit-scrollbar-track {
//           background: var(--tw-bg-gray-800, #1f2937); /* Tailwind gray-800 equivalent */
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: var(--tw-bg-gray-400, #9ca3af); /* Tailwind gray-400 equivalent */
//           border-radius: 10px;
//         }

//         .dark .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: var(--tw-bg-gray-600, #4b5563); /* Tailwind gray-600 equivalent */
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: var(--tw-bg-gray-500, #6b7280); /* Tailwind gray-500 equivalent */
//         }
//       `}</style>
//     </div>
//   );
// };

// export default DashboardLayout;

// import React, { useState } from "react";
// import { Outlet } from "react-router-dom";
// import { useAuth } from "../../contexts/AuthContext";
// import Sidebar from "./Sidebar";
// import Header from "./Header";
// import { useIsMobile } from "@/hooks/use-mobile";
// import { cn } from "@/lib/utils"; // Assuming you have a cn utility for conditional classes

// const DashboardLayout = () => {
//   const { currentUser } = useAuth();
//   const isMobile = useIsMobile();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   // NEW: State to hold customer data for the header
//   const [currentCustomerHeaderInfo, setCurrentCustomerHeaderInfo] = useState(null);

//   const toggleMobileNav = () => {
//     setMobileOpen(!mobileOpen);
//   };

//   return (
//     <div
//       className={cn(
//         "flex h-screen overflow-hidden",
//         "bg-gray-100 dark:bg-gray-950",
//         "transition-colors duration-500 ease-in-out"
//       )}
//     >
//       {/* Sidebar - Conditional rendering based on mobileOpen and isMobile */}
//       {(mobileOpen || !isMobile) && (
//         <Sidebar
//           isMobile={isMobile}
//           setMobileOpen={setMobileOpen}
//           mobileOpen={mobileOpen}
//         />
//       )}

//       {/* Mobile overlay - Now with a subtle fade and blur */}
//       {isMobile && mobileOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ease-in-out backdrop-blur-sm animate-fade-in-overlay"
//           onClick={() => setMobileOpen(false)}
//         />
//       )}

//       {/* Main content area */}
//       <div
//         className={cn(
//           "flex flex-col flex-1 overflow-hidden",
//           "transform transition-transform duration-500 ease-in-out",
//           isMobile && mobileOpen && "translate-x-64"
//         )}
//       >
//         {/* NEW: Pass customer-related props to Header */}
//         <Header
//           toggleMobileNav={toggleMobileNav}
//           customerName={currentCustomerHeaderInfo?.full_name}
//           customerProfilePic={currentCustomerHeaderInfo?.profile_photos}
//           profileCompletion={currentCustomerHeaderInfo?.completion_percentage}
//         />

//         {/* Dashboard content */}
//         {/* NEW: Pass setCurrentCustomerHeaderInfo via context to Outlet */}
//         <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 ease-in-out custom-scrollbar">
//           <Outlet context={{ setCurrentCustomerHeaderInfo }} />
//         </main>
//       </div>

//       {/* Global CSS for animations (could be in a global CSS file or <style> tag) */}
//       <style>{`
//         /* Overlay fade-in animation */
//         @keyframes fadeInOverlay {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }
//         .animate-fade-in-overlay {
//           animation: fadeInOverlay 0.3s ease-out forwards;
//         }

//         /* Custom scrollbar styles */
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 8px; /* Thicker for better visibility */
//           height: 8px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: var(--tw-bg-gray-200, #e5e7eb); /* Tailwind gray-200 equivalent */
//           border-radius: 10px;
//         }

//         .dark .custom-scrollbar::-webkit-scrollbar-track {
//           background: var(--tw-bg-gray-800, #1f2937); /* Tailwind gray-800 equivalent */
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: var(--tw-bg-gray-400, #9ca3af); /* Tailwind gray-400 equivalent */
//           border-radius: 10px;
//         }

//         .dark .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: var(--tw-bg-gray-600, #4b5563); /* Tailwind gray-600 equivalent */
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: var(--tw-bg-gray-500, #6b7280); /* Tailwind gray-500 equivalent */
//         }
//       `}</style>
//     </div>
//   );
// };

// export default DashboardLayout;

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility for conditional classes

const DashboardLayout = () => {
  const { currentUser } = useAuth(); // Assuming currentUser is used elsewhere, kept for context
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // State to hold customer data and action callbacks for the header
  const [currentCustomerHeaderInfo, setCurrentCustomerHeaderInfo] = useState(null);

  const toggleMobileNav = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden",
        "bg-gray-100 dark:bg-gray-950",
        "transition-colors duration-500 ease-in-out"
      )}
    >
      {/* Sidebar - Conditional rendering based on mobileOpen and isMobile */}
      {(mobileOpen || !isMobile) && (
        <Sidebar
          isMobile={isMobile}
          setMobileOpen={setMobileOpen}
          mobileOpen={mobileOpen}
        />
      )}

      {/* Mobile overlay - Now with a subtle fade and blur */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ease-in-out backdrop-blur-sm animate-fade-in-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-col flex-1 overflow-hidden",
          "transform transition-transform duration-500 ease-in-out",
          isMobile && mobileOpen && "translate-x-64"
        )}
      >
        {/* Pass customer-related props (data and callbacks) to Header */}
        <Header
          toggleMobileNav={toggleMobileNav}
          customerName={currentCustomerHeaderInfo?.full_name}
          customerProfilePic={currentCustomerHeaderInfo?.profile_photos}
          profileCompletion={currentCustomerHeaderInfo?.completion_percentage}
          // Pass the callback functions for modals and tab changes directly from state
          onOpenBasicProfileModal={currentCustomerHeaderInfo?.onOpenBasicProfileModal}
          onOpenFullProfileModal={currentCustomerHeaderInfo?.onOpenFullProfileModal}
          onSetActiveTab={currentCustomerHeaderInfo?.onSetActiveTab}
          currentActiveTab={currentCustomerHeaderInfo?.currentActiveTab}
          // IMPORTANT: Pass the notifications array to the Header
          notifications={currentCustomerHeaderInfo?.notifications || []}
        />

        {/* Dashboard content */}
        {/* Pass setCurrentCustomerHeaderInfo via context to Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 ease-in-out custom-scrollbar">
          <Outlet context={{ setCurrentCustomerHeaderInfo }} />
        </main>
      </div>

      {/* Global CSS for animations (could be in a global CSS file or <style> tag) */}
      <style>{`
        /* Overlay fade-in animation */
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-overlay {
          animation: fadeInOverlay 0.3s ease-out forwards;
        }

        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px; /* Thicker for better visibility */
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--tw-bg-gray-200, #e5e7eb); /* Tailwind gray-200 equivalent */
          border-radius: 10px;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--tw-bg-gray-800, #1f2937); /* Tailwind gray-800 equivalent */
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--tw-bg-gray-400, #9ca3af); /* Tailwind gray-400 equivalent */
          border-radius: 10px;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--tw-bg-gray-600, #4b5563); /* Tailwind gray-600 equivalent */
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--tw-bg-gray-500, #6b7280); /* Tailwind gray-500 equivalent */
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;