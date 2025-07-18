import React from "react";
import LoginForm from "../../components/login/LoginForm";
import AnimatedBackground from "../../components/login/AnimatedBackground";
import { ShieldCheck, Check } from "lucide-react";
import { Link } from "react-router-dom";

const SuperAdminLogin = () => {
  return (
    <AnimatedBackground role="SuperAdmin">
      {/* Left Section */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="max-w-2xl text-center">
          <ShieldCheck className="mx-auto h-20 w-20 text-white fill-purple-300 animate-pulse-gentle" />
          <h1 className="mt-6 text-3xl md:text-4xl font-normal text-white">
            Super Admin Portal
          </h1>
          <p className="mt-4 text-xl text-white/90">
            Complete system access to manage all aspects of the Marriage Bureau.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Feature
              title="System Management"
              description="Complete control over system settings and configurations"
            />
            <Feature
              title="Organization Control"
              description="Manage all admins, employees, and organizational structure"
            />
          </div>

          <div className="mt-8 text-white/80">
            <p>Not a super admin?</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link
                to="/login/employee"
                className="text-white underline hover:text-white/90"
              >
                Employee Login
              </Link>
              <Link
                to="/login/admin"
                className="text-white underline hover:text-white/90"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <LoginForm defaultRole="SuperAdmin" />
      </div>
    </AnimatedBackground>
  );
};

const Feature = ({ title, description }) => (
  <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg hover:bg-white/20 transition-all">
    <Check className="mx-auto h-8 w-8 text-white" />
    <h3 className="mt-2 text-lg font-medium text-white">{title}</h3>
    <p className="mt-1 text-sm text-white/80">|
    {description}</p>
  </div>
);

export default SuperAdminLogin;