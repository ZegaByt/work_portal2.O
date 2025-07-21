import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Ensure this path is correct
import { User, Key, AlertTriangle, LockKeyhole, Eye, EyeOff, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // Import Dialog components for the modal

// Define the animation keyframes within a string
const getDynamicStyles = (roleAccentColor) => `
  @keyframes floatEffect {
    0% {
      transform: translate(0, 0) scale(1) rotate(0deg);
      opacity: 0.05;
    }
    25% {
      transform: translate(5vw, 5vh) scale(1.05) rotate(15deg);
      opacity: 0.1;
    }
    50% {
      transform: translate(0, 10vh) scale(1) rotate(0deg);
      opacity: 0.08;
    }
    75% {
      transform: translate(-5vw, 5vh) scale(0.95) rotate(-15deg);
      opacity: 0.1;
    }
    100% {
      transform: translate(0, 0) scale(1) rotate(0deg);
      opacity: 0.05;
    }
  }

  @keyframes driftX {
    0% { transform: translateX(0); }
    50% { transform: translateX(10vw); }
    100% { transform: translateX(0); }
  }

  @keyframes driftY {
    0% { transform: translateY(0); }
    50% { transform: translateY(10vh); }
    100% { transform: translateY(0); }
  }

  .floating-element {
    animation: floatEffect 18s ease-in-out infinite, driftX var(--drift-duration-x) ease-in-out infinite alternate, driftY var(--drift-duration-y) ease-in-out infinite alternate;
    box-shadow: 0 0 10px ${roleAccentColor}, inset 0 0 5px ${roleAccentColor};
    filter: blur(2px);
  }

  /* Microsoft-style Loader Dots Animation */
  @keyframes loaderDots {
    0%, 80%, 100% { transform: scale(0); opacity: 0; }
    40% { transform: scale(1); opacity: 1; }
  }

  .loader-dot {
    animation: loaderDots 1.4s infinite ease-in-out both;
  }
  .loader-dot:nth-child(1) { animation-delay: -0.32s; }
  .loader-dot:nth-child(2) { animation-delay: -0.16s; }
  .loader-dot:nth-child(3) { animation-delay: 0s; }


  /* Blinking Border Animation */
  @keyframes pulseBorder {
    0% { border-color: rgba(255, 255, 255, 0.18); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); }
    50% { border-color: ${roleAccentColor.replace(/,\s*\d\.\d+\)$/, ', 0.6)')}; box-shadow: 0 0 20px ${roleAccentColor}; }
    100% { border-color: rgba(255, 255, 255, 0.18); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); }
  }

  .blink-border {
    animation: pulseBorder 1.5s infinite ease-in-out;
  }


  /* Media queries for responsiveness */
  @media (max-width: 768px) {
    @keyframes floatEffect {
      0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.03; }
      50% { transform: translate(7vw, 7vh) scale(1.02) rotate(10deg); opacity: 0.06; }
      100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.03; }
    }
    @keyframes driftX {
      0% { transform: translateX(0); }
      50% { transform: translateX(15vw); }
      100% { transform: translateX(0); }
    }
    @keyframes driftY {
      0% { transform: translateY(0); }
      50% { transform: translateY(15vh); }
      100% { transform: translateY(0); }
    }
    .floating-element {
      animation: floatEffect 25s ease-in-out infinite, driftX var(--drift-duration-x) ease-in-out infinite alternate, driftY var(--drift-duration-y) ease-in-out infinite alternate;
      filter: blur(1px);
    }
  }
`;

// --- OTP Input Component ---
const OtpInput = ({ length = 6, value, onChange, disabled }) => {
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    const newValueArray = value.split("");

    // If a digit is entered or the input is cleared by backspace (val is empty)
    if (val.length === 1 && /^\d$/.test(val)) { // Digit entered
      newValueArray[index] = val;
      onChange(newValueArray.join(""));
      // Move focus to the next input if a digit is entered
      if (index < length - 1) {
        inputRefs.current[index + 1].focus();
      }
    } else if (val.length === 0) { // Input cleared (e.g., by backspace or delete)
      newValueArray[index] = "";
      onChange(newValueArray.join(""));
      // Focus on the current input, or the previous one if it was cleared via backspace
      if (index > 0 && e.nativeEvent.inputType === 'deleteContentBackward') {
          inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    // If backspace is pressed and the current input is empty, move focus to the previous input
    // If backspace is pressed and the current input is NOT empty, handleChange will clear it.
    if (e.key === "Backspace" && value[index] === "" && index > 0) {
      e.preventDefault(); // Prevent default backspace behavior (e.g., browser navigation)
      inputRefs.current[index - 1].focus();
      // Optionally, clear the previous input when moving back with backspace on an empty field
      const newValue = value.split("");
      if (newValue[index - 1] !== "") {
          newValue[index - 1] = "";
          onChange(newValue.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length === length && /^\d+$/.test(pasteData)) {
      onChange(pasteData);
      inputRefs.current[length - 1].focus(); // Focus on last input after pasting
    } else {
      toast.error(`Please paste a ${length}-digit numeric OTP.`);
    }
  };

  useEffect(() => {
    // Focus the first empty input field when the component mounts or value changes
    const firstEmptyIndex = value.split("").findIndex(char => char === "");
    if (firstEmptyIndex !== -1 && inputRefs.current[firstEmptyIndex]) {
      inputRefs.current[firstEmptyIndex].focus();
    } else if (inputRefs.current[0] && value.length === 0) {
        inputRefs.current[0].focus();
    } else if (value.length === length && inputRefs.current[length - 1]) {
        // If all fields are filled, ensure focus is on the last one
        inputRefs.current[length - 1].focus();
    }
  }, [value, length]);


  return (
    <div className="flex justify-center space-x-2">
      {Array.from({ length }, (_, index) => (
        <Input
          key={index}
          type="text" // Use text to allow paste and then validate
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined} // Only handle paste on the first input
          ref={(el) => (inputRefs.current[index] = el)}
          className="w-10 h-12 text-center text-lg font-bold bg-white/5 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-offset-background font-inter"
          disabled={disabled}
        />
      ))}
    </div>
  );
};

// --- LoginForm Component ---
const LoginForm = ({ defaultRole }) => {
  // State for regular login flow
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // States for general loading and error display
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State for OTP flow (both login and forgot password)
  const [otp, setOtp] = useState(""); // Stores the 6-digit OTP string
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState(null); // 'login' or 'forgotPassword'

  // State for 2FA login specific data
  const [otpLoginIdentifier, setOtpLoginIdentifier] = useState(""); // Store identifier for 2FA step
  const [otpLoginPassword, setOtpLoginPassword] = useState(""); // Store password for 2FA step

  // States for forgot password flow
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordIdentifier, setForgotPasswordIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // States for OTP resend functionality
  const [resendCooldown, setResendCooldown] = useState(0); // Countdown in seconds
  const [canResend, setCanResend] = useState(false); // Whether resend is allowed

  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);


  const { login } = useAuth();
  const navigate = useNavigate();
 const API_BASE_URL = import.meta.env.VITE_BASE_URL;


  // Effect to handle resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer); // Cleanup on unmount or when cooldown changes
  }, [resendCooldown]);

  // Start the resend cooldown timer (60 seconds)
  const startResendCooldown = () => {
    setResendCooldown(60);
    setCanResend(false);
  };

  // Effect to inject Google Fonts
  useEffect(() => {
    const fontLinkInter = document.createElement('link');
    fontLinkInter.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    fontLinkInter.rel = 'stylesheet';
    document.head.appendChild(fontLinkInter);

    const fontLinkPoppins = document.createElement('link');
    fontLinkPoppins.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap';
    fontLinkPoppins.rel = 'stylesheet';
    document.head.appendChild(fontLinkPoppins);

    // Apply default font to body (or a higher-level container if appropriate)
    document.body.classList.add('font-inter');

    return () => {
      // Clean up on component unmount if necessary (though usually not for global fonts)
      document.body.classList.remove('font-inter');
      fontLinkInter.remove();
      fontLinkPoppins.remove();
    };
  }, []);

  // Determine the primary color class based on the defaultRole
  let primaryColorClass = "";
  let hoverPrimaryColorClass = "";
  let textColorClass = "";
  let accentColorForGlow = ""; // This is now a state-derived value needed for dynamic styles

  if (defaultRole === "Employee") {
    primaryColorClass = "bg-blue-600";
    hoverPrimaryColorClass = "hover:bg-blue-700";
    textColorClass = "text-blue-400 hover:text-blue-300"; // Lighter for visibility
    accentColorForGlow = "rgba(59, 130, 246, 0.2)"; // Blue-500 equivalent with alpha
  } else if (defaultRole === "Admin") {
    primaryColorClass = "bg-rose-600";
    hoverPrimaryColorClass = "hover:bg-rose-700";
    textColorClass = "text-rose-400 hover:text-rose-300"; // Lighter for visibility
    accentColorForGlow = "rgba(244, 63, 94, 0.2)"; // Rose-500 equivalent with alpha
  } else if (defaultRole === "SuperAdmin") {
    primaryColorClass = "bg-purple-600";
    hoverPrimaryColorClass = "hover:bg-purple-700";
    textColorClass = "text-purple-400 hover:text-purple-300"; // Lighter for visibility
    accentColorForGlow = "rgba(168, 85, 247, 0.2)"; // Purple-500 equivalent with alpha
  } else { // Default to a neutral color
    primaryColorClass = "bg-gray-600";
    hoverPrimaryColorClass = "hover:bg-gray-700";
    textColorClass = "text-gray-400 hover:text-gray-300"; // Lighter for visibility
    accentColorForGlow = "rgba(107, 114, 128, 0.2)"; // Gray-500 equivalent with alpha
  }

  // Effect to inject dynamic styles (including new animations) based on accent color
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = getDynamicStyles(accentColorForGlow);
    styleTag.id = 'login-form-dynamic-styles'; // Use a distinct ID for LoginForm's styles

    // Remove existing style tag if accent color changes, to update keyframes
    const existingStyleTag = document.getElementById('login-form-dynamic-styles');
    if (existingStyleTag) {
      existingStyleTag.remove();
    }
    document.head.appendChild(styleTag);

    // Cleanup: remove the style tag when the component unmounts
    return () => {
      const currentStyleTag = document.getElementById('login-form-dynamic-styles');
      if (currentStyleTag) {
        currentStyleTag.remove();
      }
    };
  }, [accentColorForGlow]); // Re-inject if accent color changes (i.e., role changes)

  /**
   * Helper function to check if the error is a network error based on the error string
   * This is a client-side check based on expected backend error messages.
   */
  const isNetworkError = (err) => {
    // Check if it's an Axios network error (no response from server)
    if (axios.isAxiosError(err) && !err.response) {
      return true;
    }
    // Check for specific substrings in the error detail/message from the backend
    const errorMessage = err?.response?.data?.detail || err?.message || "";
    const lowerCaseError = errorMessage.toLowerCase();

    return (
      lowerCaseError.includes("getaddrinfo failed") ||
      lowerCaseError.includes("max retries exceeded") ||
      lowerCaseError.includes("nameresolutionerror") ||
      lowerCaseError.includes("failed to send email") ||
      lowerCaseError.includes("failed to send sms") ||
      lowerCaseError.includes("network error") || // Generic Axios network error
      lowerCaseError.includes("connection refused") ||
      lowerCaseError.includes("enotfound") || // DNS lookup failed
      lowerCaseError.includes("econnrefused") // Connection refused
    );
  };

  /**
   * Handles form submission for initial login (before OTP if 2FA) or initial forgot password request
   */
  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (isForgotPasswordMode) {
      // Request OTP for password reset
      if (!forgotPasswordIdentifier) {
        setError("Please enter your ID to request an OTP.");
        setIsLoading(false);
        return;
      }

      try {
        const payload = {
          user_id: forgotPasswordIdentifier,
          user_type: defaultRole.toLowerCase(),
        };

        console.log("Posting to forgot-password/", payload);
        const response = await axios.post(`${API_BASE_URL}/forgot-password/`, payload);

        if (response.status === 200) {
          toast.success("OTP sent!", {
            description: "Check your registered contact for the OTP.",
          });
          setOtpPurpose('forgotPassword');
          setIsOtpModalOpen(true); // Open OTP modal
          startResendCooldown();
        }
      } catch (err) {
        console.error("Request OTP error:", err);
        if (isNetworkError(err)) {
          setError("Failed to send OTP. Please check your internet connection.");
        } else {
          setError(err?.response?.data?.detail || "Failed to send OTP. Please check your ID and user type.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Regular login attempt
      if (!identifier || !password) {
        setError("Please enter both ID and password.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await login(identifier, password, defaultRole, null); // Pass null for OTP initially

        if (response?.requiresOtp) {
          // Store identifier and password for the next step (OTP verification)
          setOtpLoginIdentifier(identifier);
          setOtpLoginPassword(password);
          setOtpPurpose('login');
          setIsOtpModalOpen(true); // Open OTP modal
          toast.info("OTP sent", {
            description: "Check your mobile/email for the OTP.",
          });
          startResendCooldown();
        } else if (response?.success) {
          toast.success("Login successful!", { description: `Welcome, ${identifier}.` });
          navigate(`/dashboard/${defaultRole.toLowerCase()}`);
        }
      } catch (err) {
        console.error("Login error:", err);
        if (isNetworkError(err)) {
          setError("Failed to connect. Please check your internet connection and try again.");
        } else {
          setError(err?.response?.data?.detail || "Login failed. Please check your credentials.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Handles OTP submission from the modal
   */
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear error from main form
    setIsLoading(true);

    if (otp.length !== 6) {
        setError("Please enter a 6-digit OTP.");
        setIsLoading(false);
        return;
    }

    if (otpPurpose === 'forgotPassword') {
      // Password reset: Verify OTP & change password
      if (!newPassword || !confirmNewPassword) {
        setError("Please fill in new password fields.");
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setError("New password and confirm password do not match.");
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        setIsLoading(false);
        return;
      }

      try {
        const payload = {
          user_id: forgotPasswordIdentifier,
          user_type: defaultRole.toLowerCase(),
          otp: otp,
          new_password: newPassword,
        };

        console.log("Posting to verify-otp-and-change-password/", payload);
        const response = await axios.post(`${API_BASE_URL}/verify-otp-and-change-password/`, payload);

        if (response.status === 200) {
          toast.success("Password changed successfully!", {
            description: "You can now log in with your new password.",
          });
          resetFormStates();
          setIsForgotPasswordMode(false);
          setIsOtpModalOpen(false); // Close modal on success
        }
      } catch (err) {
        console.error("Password reset error:", err);
        if (isNetworkError(err)) {
          setError("Failed to connect. Please check your internet connection and try again.");
        } else {
          setError(err?.response?.data?.detail || "Failed to reset password. Invalid OTP or server error.");
        }
      } finally {
        setIsLoading(false);
      }
    } else if (otpPurpose === 'login') {
      // Login with OTP
      try {
        const response = await login(otpLoginIdentifier, otpLoginPassword, defaultRole, otp);

        if (response?.success) {
          toast.success("Login successful!", { description: `Welcome, ${otpLoginIdentifier}.` });
          setIsOtpModalOpen(false); // Close modal on success
          resetFormStates(); // Reset login specific states too
          navigate(`/dashboard/${defaultRole.toLowerCase()}`);
        }
      } catch (err) {
        console.error("OTP login error:", err);
        if (isNetworkError(err)) {
          setError("Failed to connect. Please check your internet connection and try again.");
        } else {
          setError(err?.response?.data?.detail || "OTP verification failed. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };


  /**
   * Handles resending OTP for either login 2FA or password reset
   */
  const handleResendOtp = async () => {
    if (!canResend) return; // Prevent resend if cooldown is active
    setError("");
    setIsLoading(true);

    try {
      if (otpPurpose === 'forgotPassword') {
        // Resend OTP for password reset
        const payload = {
          user_id: forgotPasswordIdentifier,
          user_type: defaultRole.toLowerCase(),
        };

        console.log("Posting to forgot-password/ for resend", payload);
        const response = await axios.post(`${API_BASE_URL}/forgot-password/`, payload);

        if (response.status === 200) {
          toast.success("OTP resent!", {
            description: "Check your registered contact for the new OTP.",
          });
          startResendCooldown(); // Restart cooldown
        }
      } else if (otpPurpose === 'login') {
        // Resend OTP for login 2FA using the login function (with null OTP to trigger new OTP send)
        if (!otpLoginIdentifier || !otpLoginPassword) {
          setError("Cannot resend OTP: Please re-enter your credentials.");
          setIsOtpModalOpen(false); // Close modal if credentials are lost
          setIsLoading(false);
          return;
        }

        console.log("Calling login function for OTP resend", { user_id: otpLoginIdentifier, user_type: defaultRole.toLowerCase() });
        const response = await login(otpLoginIdentifier, otpLoginPassword, defaultRole, null);

        if (response?.requiresOtp) {
          toast.success("OTP resent!", {
            description: "Check your mobile/email for the new OTP.",
          });
          startResendCooldown(); // Restart cooldown
        } else {
          // Unexpected success (login completed without OTP, this case should ideally not happen if 2FA is set)
          toast.success("Login successful!", { description: `Welcome, ${otpLoginIdentifier}.` });
          setIsOtpModalOpen(false);
          navigate(`/dashboard/${defaultRole.toLowerCase()}`);
        }
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      if (isNetworkError(err)) {
        setError("Failed to resend OTP. Please check your internet connection.");
      } else {
        setError(err?.response?.data?.detail || "Failed to resend OTP. Please try again.");
      }
      if (otpPurpose === 'login') {
        setIsOtpModalOpen(false); // Close modal if resend fails unexpectedly for login
      }
    } finally {
      setIsLoading(false);
    }
  };


  /**
   * Toggles between login and forgot password modes
   */
  const toggleForgotPasswordMode = () => {
    setIsForgotPasswordMode(!isForgotPasswordMode);
    resetFormStates();
    setError(""); // Clear error when switching modes
  };

  /**
   * Resets all relevant form states
   */
  const resetFormStates = () => {
    setIdentifier("");
    setPassword("");
    setOtp("");
    setIsOtpModalOpen(false);
    setOtpPurpose(null);
    setOtpLoginIdentifier("");
    setOtpLoginPassword("");
    setError("");
    setForgotPasswordIdentifier("");
    setNewPassword("");
    setConfirmNewPassword("");
    setIsLoading(false);
    setResendCooldown(0);
    setCanResend(false);
    setShowPassword(false);
  };

  return (
    <>
      <Card
        className={`w-full max-w-sm sm:max-w-md backdrop-blur-md bg-white/10 text-white border-white/20 shadow-lg p-4 sm:p-6 ${isLoading ? 'blink-border' : ''}`}
        style={{
          boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37)`,
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '16px',
        }}
      >
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-poppins font-normal text-white text-center">
            {isForgotPasswordMode ? "Reset Password" : `Login as ${defaultRole}`}
          </CardTitle>
          <CardDescription className="text-white/70 text-center font-inter text-sm sm:text-base mt-2">
            {isForgotPasswordMode
              ? `Enter your ${defaultRole} ID to receive a password reset OTP.`
              : `Enter your credentials to access the ${defaultRole} panel.`}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleInitialSubmit}>
          <CardContent className="space-y-4 sm:space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 text-red-300 p-3 rounded-md flex items-center text-sm border border-red-700/50">
                {error.includes("internet connection") ? (
                  <WifiOff className="h-4 w-4 mr-2 text-red-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
                )}
                {error}
              </div>
            )}

            {/* Regular Login Fields */}
            {!isForgotPasswordMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-white/90 font-inter">ID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="Enter your ID"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-offset-background font-inter"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 font-inter">Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-offset-background font-inter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-white/60 hover:text-white/80"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Forgot Password: Identifier Field */}
            {isForgotPasswordMode && (
              <div className="space-y-2">
                <Label htmlFor="forgotPasswordIdentifier" className="text-white/90 font-inter">{defaultRole} ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
                  <Input
                    id="forgotPasswordIdentifier"
                    type="text"
                    placeholder={`Enter your ${defaultRole} ID`}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-offset-background font-inter"
                    value={forgotPasswordIdentifier}
                    onChange={(e) => setForgotPasswordIdentifier(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col pt-4 sm:pt-6">
            <Button
              type="submit"
              className={`w-full ${primaryColorClass} ${hoverPrimaryColorClass} text-white font-poppins text-base sm:text-lg py-2.5`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-1">
                  <span className="loader-dot w-2 h-2 bg-white rounded-full"></span>
                  <span className="loader-dot w-2 h-2 bg-white rounded-full"></span>
                  <span className="loader-dot w-2 h-2 bg-white rounded-full"></span>
                  <span className="sr-only">Processing...</span>
                </span>
              ) : isForgotPasswordMode
                ? "Request OTP"
                : "Log in"}
            </Button>

            <div className="mt-4 text-center">
              <a
                href="#"
                onClick={toggleForgotPasswordMode}
                className={`text-sm font-inter font-medium ${textColorClass}`}
              >
                {isForgotPasswordMode ? "Back to Login" : "Forgot your password?"}
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* OTP Modal */}
      <Dialog
        open={isOtpModalOpen}
        onOpenChange={(open) => {
          // You might still want to allow closing via the 'x' button or Escape key
          // if not isLoading, but block outside clicks using onPointerDownOutside.
          // This keeps the Dialog component controllable.
          if (!open && !isLoading) {
            setIsOtpModalOpen(false);
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent the dialog from closing when clicking outside of it.
          e.preventDefault();
        }}
      >
        <DialogContent className="sm:max-w-[425px] backdrop-blur-md bg-white/10 text-white border-white/20 shadow-lg"
          style={{
            boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37)`,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '16px',
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-poppins font-normal text-white text-center">Enter OTP</DialogTitle>
            <DialogDescription className="text-white/70 text-center font-inter text-sm mt-2">
              An OTP has been sent to your registered contact. Please enter it below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOtpSubmit}>
            <div className="grid gap-4 py-4">
              {error && ( // Display modal-specific errors
                <div className="bg-red-900/20 text-red-300 p-3 rounded-md flex items-center text-sm border border-red-700/50">
                  {error.includes("internet connection") ? (
                    <WifiOff className="h-4 w-4 mr-2 text-red-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
                  )}
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp-input" className="sr-only">OTP</Label>
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                />
              </div>

              {otpPurpose === 'forgotPassword' && (
                <>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="modal-newPassword" className="text-white/90 font-inter">New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
                      <Input
                        id="modal-newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-offset-background font-inter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-white/60 hover:text-white/80"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-confirmNewPassword" className="text-white/90 font-inter">Confirm New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
                      <Input
                        id="modal-confirmNewPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-offset-background font-inter"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-white/60 hover:text-white/80"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Resend OTP Button or Countdown */}
              <div className="text-sm text-center pt-2">
                {resendCooldown > 0 ? (
                  <span className="text-white/60 font-inter">
                    Resend OTP in {resendCooldown} seconds
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className={`font-inter font-medium ${textColorClass} ${!canResend ? "cursor-not-allowed opacity-50" : ""}`}
                    disabled={!canResend || isLoading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className={`w-full ${primaryColorClass} ${hoverPrimaryColorClass} text-white font-poppins text-base sm:text-lg py-2.5`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-1">
                    <span className="loader-dot w-2 h-2 bg-white rounded-full"></span>
                    <span className="loader-dot w-2 h-2 bg-white rounded-full"></span>
                    <span className="loader-dot w-2 h-2 bg-white rounded-full"></span>
                    <span className="sr-only">Processing...</span>
                  </span>
                ) : otpPurpose === 'forgotPassword' ? "Reset Password" : "Verify OTP"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginForm;