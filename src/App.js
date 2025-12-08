import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

// Components
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BillingPage from "./components/BillingPage";
import Vendor from "./components/Vendor";  // Vendor page

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated") === "true";
    const storedSidebar = localStorage.getItem("sidebarOpen") === "true";

    setIsAuthenticated(storedAuth);
    setIsSidebarOpen(storedSidebar);
    setIsCheckingAuth(false);
  }, []);

  if (isCheckingAuth) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        {isAuthenticated ? (
          <>
            <Route path="/" element={<Navigate to="/login" />} />

            <Route
              element={
                <ProtectedLayout
                  isSidebarOpen={isSidebarOpen}
                  setIsSidebarOpen={setIsSidebarOpen}
                />
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/BillingPage" element={<BillingPage />} />
              <Route path="/Vendor" element={<Vendor />} />
            </Route>
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
};

// Protected layout with header / sidebar / footer
const ProtectedLayout = ({ isSidebarOpen, setIsSidebarOpen }) => (
  <div className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
    <Header />
    <div className="content-container">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <main className={`main-content ${isSidebarOpen ? "shifted" : ""}`}>
        <Outlet />
      </main>
    </div>
    <Footer />
  </div>
);

export default App;
