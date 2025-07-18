import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import api from "../store/axios"; // Your Axios instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore auth state on app load
  useEffect(() => {
    const token = Cookies.get("accessToken");
    const savedUser = Cookies.get("user");
    const savedRole = Cookies.get("role");

    if (token && savedUser && savedRole) {
      setIsAuthenticated(true);
      setUserRole(savedRole);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password, role, otp = null) => {
    const endpoint = `/login/${role.toLowerCase()}/`;

    try {
      const payload = {
        identifier,
        password,
        ...(otp && { otp }),
      };

      const res = await api.post(endpoint, payload);
      const data = res.data;
      console.log("Login Response:", data); // Debugging log

      if (!otp && data.otp_id && data.expires_at) {
        return {
          requiresOtp: true,
          otp_id: data.otp_id,
          expires_at: data.expires_at,
        };
      }

      if (data.access) {
        const userInfo = {
          id: data.user_id,
          type: data.user_type,
          profile: data.profile,
          dashboardUrl: data.dashboard_url,
          lastLoggedIn: data.last_logged_in,
        };

        // ✅ Log tokens in console
        console.log("Access Token:", data.access);
        console.log("Refresh Token:", data.refresh);

        setIsAuthenticated(true);
        setUserRole(role);
        setUser(userInfo);

        // Save to cookies
        Cookies.set("accessToken", data.access, { secure: true, sameSite: 'Lax' });
        Cookies.set("refreshToken", data.refresh, { secure: true, sameSite: 'Lax' });
        Cookies.set("user", JSON.stringify(userInfo), { secure: true, sameSite: 'Lax' });
        Cookies.set("role", role, { secure: true, sameSite: 'Lax' });

        // Set Authorization header for Axios
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

        return { success: true };
      }

      throw new Error("Unexpected login response");
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    console.log("Attempting real-time logout...");
    try {
      const refreshToken = Cookies.get("refreshToken");
      const accessToken = Cookies.get("accessToken");

      console.log("Access Token:", accessToken); // Debugging log

      const response = await api.post(
        '/logout/',
        { refresh: refreshToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Backend Logout Response:", response.data);

      if (response.status === 200 || response.status === 204) {
        console.log("Logout successful on backend. Clearing client-side data.");
      } else {
        console.warn("Backend logout responded with non-success status:", response.status, response.data);
      }
    } catch (error) {
      console.error("Error during real-time logout API call:", error);
      if (error.response) {
        console.error("Logout API Error Response Data:", error.response.data);
        console.error("Logout API Error Response Status:", error.response.status);
        console.error("Logout API Error Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("Logout API Error Request:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
      console.warn("Proceeding with client-side cleanup despite API error.");
    } finally {
      setIsAuthenticated(false);
      setUserRole("");
      setUser(null);

      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      Cookies.remove("user");
      Cookies.remove("role");

      delete api.defaults.headers.common['Authorization'];

      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
