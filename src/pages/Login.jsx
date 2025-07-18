
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Heart, Check, User, Key, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password, role);
      // Redirect based on role
      navigate(`/dashboard/${role.toLowerCase()}`);
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Failed to login");
      toast.error("Login Failed", {
        description: error.message || "Please check your credentials and try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Left side - Illustration */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-bureau-500 to-bureau-700">
        <div className="max-w-2xl text-center">
          <Heart className="mx-auto h-20 w-20 text-white fill-rose-500 animate-pulse-gentle" />
          <h1 className="mt-6 text-3xl md:text-4xl font-bold text-white">
            Welcome to the Marriage Bureau Management System
          </h1>
          <p className="mt-4 text-xl text-white/90">
            Connecting hearts, creating futures, and building families.
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg hover:bg-white/20 transition-all">
              <Check className="mx-auto h-8 w-8 text-white" />
              <h3 className="mt-2 text-lg font-medium text-white">Verified Profiles</h3>
              <p className="mt-1 text-sm text-white/80">
                All profiles are thoroughly verified for authenticity
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg hover:bg-white/20 transition-all">
              <Check className="mx-auto h-8 w-8 text-white" />
              <h3 className="mt-2 text-lg font-medium text-white">Smart Matching</h3>
              <p className="mt-1 text-sm text-white/80">
                Advanced algorithms to find perfect matches
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg hover:bg-white/20 transition-all">
              <Check className="mx-auto h-8 w-8 text-white" />
              <h3 className="mt-2 text-lg font-medium text-white">Privacy Focused</h3>
              <p className="mt-1 text-sm text-white/80">
                Robust privacy controls for personal information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Login to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the management system
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center text-sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <RadioGroup value={role} onValueChange={setRole} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Employee" id="employee" />
                    <Label htmlFor="employee" className="cursor-pointer">Employee</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Admin" id="admin" />
                    <Label htmlFor="admin" className="cursor-pointer">Admin</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SuperAdmin" id="superadmin" />
                    <Label htmlFor="superadmin" className="cursor-pointer">Super Admin</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col">
              <Button
                type="submit"
                className="w-full bg-bureau-600 hover:bg-bureau-700"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}
              </Button>
              <div className="mt-4 text-center">
                <a href="#" className="text-sm text-bureau-600 hover:text-bureau-800">
                  Forgot your password?
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
