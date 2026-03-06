// src/assets/routes/DashboardRoutes.jsx
// Example: How to use Dashboard with different user types in your routes

import Dashboard from "../pages/StudentHome";
import { USER_TYPES } from "../../config/dashboardConfig";

// Example 1: Simple routing based on user type
export function StudentDashboard() {
  return <Dashboard userType={USER_TYPES.STUDENT} />;
}

export function TrainerDashboard() {
  return <Dashboard userType={USER_TYPES.TRAINER} />;
}

export function InstituteDashboard() {
  return <Dashboard userType={USER_TYPES.INSTITUTE} />;
}

// Example 2: Using with React Router
// import { Routes, Route } from "react-router-dom";

/*
export function DashboardRoutes() {
  return (
    <Routes>
      <Route path="/student" element={<Dashboard userType={USER_TYPES.STUDENT} />} />
      <Route path="/trainer" element={<Dashboard userType={USER_TYPES.TRAINER} />} />
      <Route path="/admin" element={<Dashboard userType={USER_TYPES.ADMIN} />} />
    </Routes>
  );
}
*/

// Example 3: Using with user context/state
// Assuming you have a useAuth hook or context

/*
import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { userType } = useAuth();
  
  return <Dashboard userType={userType} />;
}
*/

// Example 4: Conditional Dashboard based on authentication
/*
export function ProtectedDashboard() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Fetch user data and determine type
    const userData = fetchUserData();
    setUser(userData);
  }, []);
  
  if (!user) return <div>Loading...</div>;
  
  return <Dashboard userType={user.userType} />;
}
*/

// Example 5: With theme props (you can extend Dashboard further)
/*
export function ThemedDashboard({ userType, theme = 'light' }) {
  return (
    <div className={`${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <Dashboard userType={userType} />
    </div>
  );
}
*/
