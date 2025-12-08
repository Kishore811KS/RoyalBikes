// Updated Vendor.js with better error handling
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Vendor.css";

const Vendor = () => {
  const [vehicleName, setVehicleName] = useState("");
  const [vehiclePrice, setVehiclePrice] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const brands = [
    "Honda", "Bajaj", "KTM", "Husqvarna", "Hero", 
    "TVS", "Royal Enfield", "Others"
  ];

  // Fetch vehicles from backend
  const fetchVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("http://localhost:5000/api/vehicles");
      setList(response.data.vehicles || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setError("Failed to fetch vehicles. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSave = async () => {
    if (!vehicleName || !vehiclePrice || !vehicleBrand) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    const newVehicle = {
      brand: vehicleBrand,
      model: vehicleName,
      price: parseFloat(vehiclePrice)
    };

    try {
      await axios.post("http://localhost:5000/api/vehicles", newVehicle);
      alert("Vehicle saved successfully!");
      setVehicleName("");
      setVehiclePrice("");
      setVehicleBrand("");
      fetchVehicles(); // Refresh the list
    } catch (error) {
      console.error("Error saving vehicle:", error);
      const errorMessage = error.response?.data?.error || "Error saving vehicle";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
        alert("Vehicle deleted successfully!");
        fetchVehicles(); // Refresh the list
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        alert("Error deleting vehicle");
      }
    }
  };

  return (
    <div className="page-container">
      <h2>Vendor Page</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-container">
        <select
          value={vehicleBrand}
          onChange={(e) => setVehicleBrand(e.target.value)}
          required
        >
          <option value="">Select Brand *</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Vehicle Model *"
          value={vehicleName}
          onChange={(e) => setVehicleName(e.target.value)}
        />
        
        <input
          type="number"
          placeholder="Vehicle Price *"
          value={vehiclePrice}
          onChange={(e) => setVehiclePrice(e.target.value)}
          min="0"
          step="0.01"
        />
        
        <button onClick={handleSave} className="save-btn" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {loading && <div>Loading vehicles...</div>}

      <table className="table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Brand</th>
            <th>Vehicle Model</th>
            <th>Vehicle Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((vehicle, index) => (
            <tr key={vehicle.id}>
              <td>{index + 1}</td>
              <td>{vehicle.brand}</td>
              <td>{vehicle.model}</td>
              <td>₹{vehicle.price?.toLocaleString()}</td>
              <td>
                <button 
                  onClick={() => handleDelete(vehicle.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Vendor;