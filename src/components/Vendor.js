// Updated Vendor.js with better error handling and edit functionality
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
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVehicleName, setEditVehicleName] = useState("");
  const [editVehiclePrice, setEditVehiclePrice] = useState("");
  const [editVehicleBrand, setEditVehicleBrand] = useState("");

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

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setEditVehicleName(vehicle.model);
    setEditVehiclePrice(vehicle.price);
    setEditVehicleBrand(vehicle.brand);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editVehicleName || !editVehiclePrice || !editVehicleBrand) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    const updatedVehicle = {
      brand: editVehicleBrand,
      model: editVehicleName,
      price: parseFloat(editVehiclePrice)
    };

    try {
      await axios.put(`http://localhost:5000/api/vehicles/${editingId}`, updatedVehicle);
      alert("Vehicle updated successfully!");
      setShowEditModal(false);
      setEditingId(null);
      setEditVehicleName("");
      setEditVehiclePrice("");
      setEditVehicleBrand("");
      fetchVehicles(); // Refresh the list
    } catch (error) {
      console.error("Error updating vehicle:", error);
      const errorMessage = error.response?.data?.error || "Error updating vehicle";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowEditModal(false);
    setEditingId(null);
    setEditVehicleName("");
    setEditVehiclePrice("");
    setEditVehicleBrand("");
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
                  onClick={() => handleEdit(vehicle)}
                  className="edit-btn"
                >
                  Edit
                </button>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Vehicle</h3>
            <div className="modal-form">
              <select
                value={editVehicleBrand}
                onChange={(e) => setEditVehicleBrand(e.target.value)}
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
                value={editVehicleName}
                onChange={(e) => setEditVehicleName(e.target.value)}
              />
              
              <input
                type="number"
                placeholder="Vehicle Price *"
                value={editVehiclePrice}
                onChange={(e) => setEditVehiclePrice(e.target.value)}
                min="0"
                step="0.01"
              />
              
              <div className="modal-buttons">
                <button onClick={handleUpdate} className="update-btn" disabled={loading}>
                  {loading ? "Updating..." : "Update"}
                </button>
                <button onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendor;