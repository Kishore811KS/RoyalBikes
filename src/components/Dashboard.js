import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css";
import { FaFileInvoice, FaClipboardCheck, FaPhoneAlt } from "react-icons/fa";

const Dashboard = () => {
  const [stats, setStats] = useState({
    Totalquotations: 0,
    Totalbooking: 0,
    
  });

  useEffect(() => {
    const fetchData = () => {
      axios
        .get("http://localhost:5000/dashboard")
        .then((res) => {
          setStats({
            Totalquotations: res.data.Totalquotations,
            Totalbooking: res.data.Totalbooking,
           
          });
        })
        .catch((err) => {
          console.error("Error fetching dashboard data:", err);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { color: "purple", icon: <FaFileInvoice />, label: "Total Quotations", value: stats.Totalquotations },
    { color: "orange", icon: <FaClipboardCheck />, label: "Total booking", value: stats.Totalbooking },
    
  ];

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">RoyalBikes Showroom Dashboard</h2>
      <div className="dashboard-boxes">
        {cards.map((card, i) => (
          <div key={i} className={`box ${card.color}`}>
            <div className="icon">{card.icon}</div>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
