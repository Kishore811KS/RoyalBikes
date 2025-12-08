import React from "react";
import "../styles/Footer.css"; // Ensure correct path

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} V4 Sure IT Solution. All rights reserved.</p>
      
    </footer>
  );
}

export default Footer;
