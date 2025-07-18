// src/components/SkeletonLoader.jsx
import React from 'react';

const SkeletonLoader = ({ count = 8 }) => { // Default to 8 skeleton cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-0">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative bg-white rounded-xl p-6 flex items-start min-h-[140px] border border-gray-100
                     shadow-md animate-pulse overflow-hidden" // animate-pulse for the shimmer effect
        >
          {/* Skeleton Avatar */}
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-200 mr-4"></div>

          {/* Skeleton Text Content */}
          <div className="flex-grow">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div> {/* User ID */}
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div> {/* Full Name */}
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div> {/* Email */}
            <div className="h-4 bg-gray-200 rounded w-1/3"></div> {/* Mobile Number */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;