
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-7xl font-bold text-bureau-600">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Please check the URL or go back to the home page.
        </p>
        <div className="pt-4">
          <Button onClick={() => navigate("/")} className="bg-bureau-600 hover:bg-bureau-700">
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
