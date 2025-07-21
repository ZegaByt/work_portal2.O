import React from "react";
import LoginForm from "../../components/login/LoginForm";
import AnimatedBackground from "../../components/login/AnimatedBackground";
import { Fingerprint, Check } from "lucide-react";
import { Link } from "react-router-dom";

const EmployeeLogin = () => {
  return (
    <AnimatedBackground role="Employee">
      {/* Left side - Illustration */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="max-w-2xl text-center">
          <Fingerprint className="mx-auto h-20 w-20 text-white animate-pulse-gentle" />
          <h1 className="mt-6 text-3xl md:text-4xl font-normal text-white">
            Employee Portal
          </h1>
          <p className="mt-4 text-xl text-white/90">
            Access your dashboard to manage profiles and follow up with clients.
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg hover:bg-white/20 transition-all">
              <Check className="mx-auto h-8 w-8 text-white" />
              <h3 className="mt-2 text-lg font-medium text-white">Profile Management</h3>
              <p className="mt-1 text-sm text-white/80">
                Manage client profiles and track your performance
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg hover:bg-white/20 transition-all">
              <Check className="mx-auto h-8 w-8 text-white" />
              <h3 className="mt-2 text-lg font-medium text-white">Client Follow-up</h3>
              <p className="mt-1 text-sm text-white/80">
                Keep track of client communications and follow-ups
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-white/80">
            <p>Not an employee?</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link to="/login/admin" className="text-white underline hover:text-white/90">Admin Login</Link>
              <Link to="/login/superadmin" className="text-white underline hover:text-white/90">Super Admin Login</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <LoginForm defaultRole="Employee" />
      </div>
    </AnimatedBackground>
  );
};

export default EmployeeLogin;