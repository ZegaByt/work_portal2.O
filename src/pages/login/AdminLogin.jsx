
import React from "react";
import LoginForm from "../../components/login/LoginForm";
import AnimatedBackground from "../../components/login/AnimatedBackground";
import { Shield, Check } from "lucide-react";
import { Link } from "react-router-dom";

const AdminLogin = () => {
  return (
    <AnimatedBackground role="Admin">
      {/* Left side - Illustration */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="max-w-2xl text-center">
          <Shield className="mx-auto h-20 w-20 text-white fill-rose-300 animate-pulse-gentle" />
          <h1 className="mt-6 text-3xl md:text-4xl font-normal text-white">
            Admin Portal
          </h1>
          <p className="mt-4 text-xl text-white/90">
            Manage your team, review reports and handle client requests.
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg hover:bg-white/20 transition-all">
              <Check className="mx-auto h-8 w-8 text-white" />
              <h3 className="mt-2 text-lg font-medium text-white">Team Management</h3>
              <p className="mt-1 text-sm text-white/80">
                Oversee your team's performance and task allocation
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg hover:bg-white/20 transition-all">
              <Check className="mx-auto h-8 w-8 text-white" />
              <h3 className="mt-2 text-lg font-medium text-white">Request Approval</h3>
              <p className="mt-1 text-sm text-white/80">
                Review and approve requests from employees
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-white/80">
            <p>Not an admin?</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link to="/login/employee" className="text-white underline hover:text-white/90">Employee Login</Link>
              <Link to="/login/superadmin" className="text-white underline hover:text-white/90">Super Admin Login</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <LoginForm defaultRole="Admin" />
      </div>
    </AnimatedBackground>
  );
};

export default AdminLogin;
