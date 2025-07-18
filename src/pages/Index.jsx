
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bureau-50 to-bureau-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <header className="w-full p-4 border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" />
            <span className="font-bold text-xl">Marriage Bureau</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-12 px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-bureau-900 dark:text-white mb-4">
            Gouds Marriage Bureau Siddipet
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Connecting hearts, creating futures, and building families with our comprehensive 
            matching system designed for success.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 hover:shadow-lg transition-all hover:scale-105">
            <div className="flex flex-col items-center text-center">
              <div className="bg-bureau-100 p-3 rounded-full mb-4">
                <Heart className="h-10 w-10 text-bureau-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Employee Access</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                For bureau employees to manage client profiles and handle daily operations.
              </p>
              <Link to="/login/employee">
                <Button variant="default" className="bg-bureau-600 hover:bg-bureau-700">
                  Employee Login
                </Button>
              </Link>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-all hover:scale-105">
            <div className="flex flex-col items-center text-center">
              <div className="bg-rose-100 p-3 rounded-full mb-4">
                <Shield className="h-10 w-10 text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                For managers and team leads to oversee operations and employees.
              </p>
              <Link to="/login/admin">
                <Button variant="default" className="bg-rose-600 hover:bg-rose-700">
                  Admin Login
                </Button>
              </Link>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-all hover:scale-105">
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-100 p-3 rounded-full mb-4">
                <ShieldCheck className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Super Admin Access</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                For organizational leaders with full system control and oversight.
              </p>
              <Link to="/login/superadmin">
                <Button variant="default" className="bg-purple-600 hover:bg-purple-700">
                  Super Admin Login
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      
      <footer className="bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 py-6 border-t">
        <div className="container text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 Marriage Bureau Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
