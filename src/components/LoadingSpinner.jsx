// src/components/LoadingSpinner.jsx
import React from 'react';
import './LoadingSpinner.css'; // Ensure this path is correct

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      {/* This div acts as a clean, continuous line animation */}
      <div className="loading-line-animation"></div>
      <p className="loading-text">Just a moment, we're preparing your experience...</p>
    </div>
  );
};

export default LoadingSpinner;