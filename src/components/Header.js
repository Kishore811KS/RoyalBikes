import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react"; // Importing logout icon
import "../styles/Header.css"; // Ensure the path is correct

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("User logged out");
    localStorage.clear(); // Clears all localStorage data
    navigate("/login"); // Redirect using react-router-dom
  };

  return (
    <header className="header">


      {/* Logout Icon Only */}
      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={22} className="logout-icon" />
      </button>
    </header>
  );
}

export default Header;
