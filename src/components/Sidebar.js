import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaBars, FaHome, FaFileInvoice, FaStore } from "react-icons/fa";
import axios from "axios";
import "../styles/Sidebar.css";

// Sidebar menu items
export const menuItems = [
  { id: 1, name: "Home", path: "/dashboard", icon: <FaHome /> },
  { id: 2, name: "Billing", path: "/BillingPage", icon: <FaFileInvoice /> },
  { id: 3, name: "Vendor", path: "/Vendor", icon: <FaStore /> }, // ✅ Added Vendor
];

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [allowedModules, setAllowedModules] = useState([]);
  const location = useLocation();
  const userType = localStorage.getItem("user_type");

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", newState);
    document.body.classList.toggle("sidebar-open", newState);
  };

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarOpen") === "true";
    setIsSidebarOpen(savedState);
    document.body.classList.toggle("sidebar-open", savedState);

    // Fetch user permissions
    if (userType) {
      axios
        .get("http://localhost:5000/api/permissions")
        .then((res) => {
          const userPermissions = res.data.filter(
            (p) => p.user_type === userType && p.has_access
          );
          const moduleIds = userPermissions.map((p) => p.module_id);
          setAllowedModules(moduleIds);
        })
        .catch((err) => {
          console.error("Failed to fetch permissions:", err);
        });
    }
  }, [userType]);

  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        <FaBars />
      </button>

      {isSidebarOpen && <h2 className="sidebar-title">Admin Panel</h2>}

      <ul className="menu-list">
        {menuItems
          .filter((item) => allowedModules.length === 0 || allowedModules.includes(item.id))
          .map((item) => (
            <li key={item.id} className="menu-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => `menu-link ${isActive ? "active-link" : ""}`}
              >
                {item.icon}
                {isSidebarOpen && <span className="menu-text">{item.name}</span>}
              </NavLink>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Sidebar;
