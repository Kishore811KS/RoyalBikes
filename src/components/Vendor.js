// Updated Vendor.js with better error handling, edit functionality, custom brand/model support, and search
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Vendor.css";

const Vendor = () => {
  const [vehicleName, setVehicleName] = useState("");
  const [vehiclePrice, setVehiclePrice] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVehicleName, setEditVehicleName] = useState("");
  const [editVehiclePrice, setEditVehiclePrice] = useState("");
  const [editVehicleBrand, setEditVehicleBrand] = useState("");
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("all"); // all, brand, model, price
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("none"); // none, price-asc, price-desc, brand-asc, brand-desc
  
  // New state for custom brand and model
  const [showCustomBrandInput, setShowCustomBrandInput] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  const [brands, setBrands] = useState([
    "Honda", "Bajaj", "KTM", "Husqvarna", "Hero", 
    "TVS", "Royal Enfield", "Others"
  ]);
  
  // New state for custom model suggestions
  const [modelSuggestions, setModelSuggestions] = useState({});
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);
  const [customModel, setCustomModel] = useState("");

  // Fetch vehicles from backend
  const fetchVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("http://localhost:5000/api/vehicles");
      setList(response.data.vehicles || []);
      setFilteredList(response.data.vehicles || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setError("Failed to fetch vehicles. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    
    // Load saved brands from localStorage
    const savedBrands = localStorage.getItem('vehicleBrands');
    if (savedBrands) {
      setBrands(JSON.parse(savedBrands));
    }
    
    // Load saved model suggestions from localStorage
    const savedModels = localStorage.getItem('vehicleModels');
    if (savedModels) {
      setModelSuggestions(JSON.parse(savedModels));
    }
  }, []);

  // Save brands to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vehicleBrands', JSON.stringify(brands));
  }, [brands]);

  // Save model suggestions to localStorage
  useEffect(() => {
    localStorage.setItem('vehicleModels', JSON.stringify(modelSuggestions));
  }, [modelSuggestions]);

  // Filter and search logic
  useEffect(() => {
    let results = [...list];

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(vehicle => {
        switch(searchBy) {
          case "brand":
            return vehicle.brand.toLowerCase().includes(term);
          case "model":
            return vehicle.model.toLowerCase().includes(term);
          case "price":
            return vehicle.price.toString().includes(term);
          case "all":
          default:
            return vehicle.brand.toLowerCase().includes(term) ||
                   vehicle.model.toLowerCase().includes(term) ||
                   vehicle.price.toString().includes(term);
        }
      });
    }

    // Apply price range filter
    if (priceRange.min) {
      results = results.filter(vehicle => vehicle.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      results = results.filter(vehicle => vehicle.price <= parseFloat(priceRange.max));
    }

    // Apply sorting
    switch(sortBy) {
      case "price-asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        results.sort((a, b) => b.price - a.price);
        break;
      case "brand-asc":
        results.sort((a, b) => a.brand.localeCompare(b.brand));
        break;
      case "brand-desc":
        results.sort((a, b) => b.brand.localeCompare(a.brand));
        break;
      default:
        // Keep original order
        break;
    }

    setFilteredList(results);
  }, [searchTerm, searchBy, priceRange, sortBy, list]);

  const handleAddCustomBrand = () => {
    if (customBrand && !brands.includes(customBrand)) {
      setBrands([...brands, customBrand]);
      setVehicleBrand(customBrand);
      setCustomBrand("");
      setShowCustomBrandInput(false);
    }
  };

  const handleAddCustomModel = () => {
    if (customModel && vehicleBrand) {
      // Add model suggestion for the selected brand
      const updatedSuggestions = { ...modelSuggestions };
      if (!updatedSuggestions[vehicleBrand]) {
        updatedSuggestions[vehicleBrand] = [];
      }
      if (!updatedSuggestions[vehicleBrand].includes(customModel)) {
        updatedSuggestions[vehicleBrand].push(customModel);
        setModelSuggestions(updatedSuggestions);
      }
      setVehicleName(customModel);
      setCustomModel("");
      setShowCustomModelInput(false);
    }
  };

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
      
      // Add model to suggestions if it's new
      const updatedSuggestions = { ...modelSuggestions };
      if (!updatedSuggestions[vehicleBrand]) {
        updatedSuggestions[vehicleBrand] = [];
      }
      if (!updatedSuggestions[vehicleBrand].includes(vehicleName)) {
        updatedSuggestions[vehicleBrand].push(vehicleName);
        setModelSuggestions(updatedSuggestions);
      }
      
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
      
      // Add updated model to suggestions
      const updatedSuggestions = { ...modelSuggestions };
      if (!updatedSuggestions[editVehicleBrand]) {
        updatedSuggestions[editVehicleBrand] = [];
      }
      if (!updatedSuggestions[editVehicleBrand].includes(editVehicleName)) {
        updatedSuggestions[editVehicleBrand].push(editVehicleName);
        setModelSuggestions(updatedSuggestions);
      }
      
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

  const removeBrand = (brandToRemove) => {
    if (window.confirm(`Are you sure you want to remove "${brandToRemove}" from brands?`)) {
      setBrands(brands.filter(brand => brand !== brandToRemove));
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchBy("all");
    setPriceRange({ min: "", max: "" });
    setSortBy("none");
  };

  const exportFilteredData = () => {
    const dataStr = JSON.stringify(filteredList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `vehicles_export_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="page-container">
      <h2>Vendor Page</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Search Section */}
      <div className="search-section">
        <div className="search-header">
          <div className="search-main">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              onClick={() => setShowSearchFilters(!showSearchFilters)}
              className="filter-toggle-btn"
            >
              <span className="filter-icon">🔍</span>
              {showSearchFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button onClick={clearSearch} className="clear-search-btn">
              Clear
            </button>
          </div>
        </div>

        {showSearchFilters && (
          <div className="search-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Search By:</label>
                <select 
                  value={searchBy} 
                  onChange={(e) => setSearchBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Fields</option>
                  <option value="brand">Brand Only</option>
                  <option value="model">Model Only</option>
                  <option value="price">Price Only</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Sort By:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="none">Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="brand-asc">Brand: A to Z</option>
                  <option value="brand-desc">Brand: Z to A</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Min Price (₹):</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  placeholder="Min"
                  min="0"
                  className="price-filter-input"
                />
              </div>

              <div className="filter-group">
                <label>Max Price (₹):</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  placeholder="Max"
                  min="0"
                  className="price-filter-input"
                />
              </div>
            </div>

            <div className="filter-stats">
              <span>Showing {filteredList.length} of {list.length} vehicles</span>
              <button onClick={exportFilteredData} className="export-btn">
                📥 Export Results
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="form-container">
        <div className="brand-section">
          <label>Brand</label>
          <div className="brand-select-container">
            <select
              value={vehicleBrand}
              onChange={(e) => {
                setVehicleBrand(e.target.value);
                setShowCustomBrandInput(false);
              }}
              required
              className="brand-select"
            >
              <option value="">Select Brand *</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <button 
              type="button" 
              onClick={() => setShowCustomBrandInput(!showCustomBrandInput)}
              className="add-custom-btn"
            >
              {showCustomBrandInput ? "Cancel" : "+ Add New Brand"}
            </button>
          </div>
        </div>

        {showCustomBrandInput && (
          <div className="custom-input-container">
            <input
              type="text"
              placeholder="Enter custom brand name"
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              className="custom-input"
            />
            <button 
              onClick={handleAddCustomBrand}
              className="add-btn"
              disabled={!customBrand}
            >
              Add Brand
            </button>
          </div>
        )}

        <div className="model-section">
          <label>Model</label>
          <div className="model-input-container">
            {vehicleBrand && modelSuggestions[vehicleBrand] && modelSuggestions[vehicleBrand].length > 0 ? (
              <>
                <select
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="model-select"
                >
                  <option value="">Select Model *</option>
                  {modelSuggestions[vehicleBrand].map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => setShowCustomModelInput(!showCustomModelInput)}
                  className="add-custom-btn"
                >
                  {showCustomModelInput ? "Cancel" : "+ Add New Model"}
                </button>
              </>
            ) : (
              <button 
                type="button" 
                onClick={() => setShowCustomModelInput(true)}
                className="add-custom-btn full-width"
              >
                + Add New Model
              </button>
            )}
          </div>
        </div>

        {showCustomModelInput && (
          <div className="custom-input-container">
            <input
              type="text"
              placeholder="Enter custom model name"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              className="custom-input"
            />
            <button 
              onClick={handleAddCustomModel}
              className="add-btn"
              disabled={!customModel || !vehicleBrand}
            >
              Add Model
            </button>
          </div>
        )}
        
        <div className="price-section">
          <label>Price (₹)</label>
          <input
            type="number"
            placeholder="Vehicle Price *"
            value={vehiclePrice}
            onChange={(e) => setVehiclePrice(e.target.value)}
            min="0"
            step="0.01"
            className="price-input"
          />
        </div>
        
        <button onClick={handleSave} className="save-btn" disabled={loading}>
          {loading ? "Saving..." : "Save Vehicle"}
        </button>
      </div>

      {loading && <div className="loading-indicator">Loading vehicles...</div>}

      {filteredList.length === 0 && !loading && (
        <div className="empty-state">
          {searchTerm || priceRange.min || priceRange.max ? 
            "No vehicles match your search criteria" : 
            "No vehicles added yet"}
        </div>
      )}

      {filteredList.length > 0 && (
        <div className="table-container">
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
              {filteredList.map((vehicle, index) => (
                <tr key={vehicle.id}>
                  <td>{index + 1}</td>
                  <td>{vehicle.brand}</td>
                  <td>{vehicle.model}</td>
                  <td>₹{vehicle.price?.toLocaleString('en-IN')}</td>
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
        </div>
      )}

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