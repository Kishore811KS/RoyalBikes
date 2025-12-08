import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import "../styles/BillingPage.css";
import logo from "../assets/royalbikes.jpg";
import defaultBikeImage from "../assets/logo.jpg";

const BillingPage = () => {
  const [vehicles, setVehicles] = useState({});
  const [formData, setFormData] = useState({
    customer_name: "",
    address: "",
    phone: "",
    vehicleBrand: "",
    vehicleName: "",
    vehicleCost: "",
    manualVehicleName: "",
    manualVehicleCost: "",
    fittingCost: "",
    documentationCharges: "",
    initial: "",
    rateOfInterest: "",
    totalCost: "",
    rtoCost: "",
    documentation: {
      aadharcard: false,
      rationcard: false,
      photo: false,
      pancard: false,
      passbook: false,
      atmcard: false,
    },
  });

  const quotationRef = useRef();
  const printQuotationsRef = useRef();
  const [bills, setBills] = useState([]);
  const [bookedVehicles, setBookedVehicles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [billNo, setBillNo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [activeMenu, setActiveMenu] = useState("quotations");

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Fetch vehicles from database
  const fetchVehicles = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/vehicles");
      const vehiclesData = response.data.vehicles || [];
      
      // Convert array to the required object structure
      const vehiclesObj = {};
      vehiclesData.forEach(vehicle => {
        if (!vehiclesObj[vehicle.brand]) {
          vehiclesObj[vehicle.brand] = {};
        }
        vehiclesObj[vehicle.brand][vehicle.model] = vehicle.price;
      });
      
      setVehicles(vehiclesObj);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      // Fallback to empty object if API fails
      setVehicles({});
    }
  };

  // Print handlers
  const handlePrintAllQuotations = useReactToPrint({
    content: () => printQuotationsRef.current,
    documentTitle: "Quotations Report",
  });

  const handlePrint = () => window.print();

  const generateNextBillNo = (existingBills) => {
    if (!existingBills || existingBills.length === 0) {
      return "RB-01";
    }

    const billNumbers = existingBills
      .map(bill => bill.billNo)
      .filter(billNo => billNo && billNo.startsWith("RB-"))
      .map(billNo => {
        const numberPart = billNo.replace("RB-", "");
        return parseInt(numberPart, 10);
      })
      .filter(number => !isNaN(number));

    if (billNumbers.length === 0) {
      return "RB-01";
    }

    const highestNumber = Math.max(...billNumbers);
    const nextNumber = highestNumber + 1;
    
    return `RB-${nextNumber.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchVehicles();
    fetchBills();
    fetchBookedVehicles();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/billing");
      setBills(res.data.bills || []);
      
      const nextBillNo = generateNextBillNo(res.data.bills || []);
      setBillNo(nextBillNo);
    } catch (err) {
      console.error("Fetch bills error:", err);
      setBillNo("RB-01");
    }
  };

  const fetchBookedVehicles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/booked-vehicles");
      setBookedVehicles(res.data.bookedVehicles || []);
    } catch (err) {
      console.error("Fetch booked vehicles error:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name in formData.documentation) {
      setFormData((prev) => ({
        ...prev,
        documentation: { ...prev.documentation, [name]: checked },
      }));
      return;
    }

    if (name === "vehicleBrand" && !useManualEntry) {
      setFormData((prev) => ({ 
        ...prev, 
        vehicleBrand: value,
        vehicleName: "",
        vehicleCost: ""
      }));
      return;
    }

    if (name === "vehicleName" && !useManualEntry) {
      const selectedBrand = formData.vehicleBrand;
      const price = vehicles[selectedBrand]?.[value] || "";
      setFormData((prev) => ({ ...prev, vehicleName: value, vehicleCost: price }));
      return;
    }

    if (name === "manualVehicleName" && useManualEntry) {
      setFormData((prev) => ({ ...prev, manualVehicleName: value }));
      return;
    }

    if (name === "manualVehicleCost" && useManualEntry) {
      setFormData((prev) => ({ ...prev, manualVehicleCost: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateEMI = (balance, months, rate, documentationCharges) => {
    const years = months / 12;
    const totalInterest = balance * (rate / 100) * years;
    const total = balance + totalInterest + documentationCharges;
    const emi = total / months;
    return parseFloat(emi.toFixed(2));
  };

  const calculateValues = () => {
    const vehicleCost = useManualEntry 
      ? parseFloat(formData.manualVehicleCost) || 0 
      : parseFloat(formData.vehicleCost) || 0;

    const fittingCost = parseFloat(formData.fittingCost) || 0;
    const rtoCost = parseFloat(formData.rtoCost) || 0;
    const documentationCharges = parseFloat(formData.documentationCharges) || 0;
    const initial = parseFloat(formData.initial) || 0;
    const rate = parseFloat(formData.rateOfInterest) || 0;

    // Step 1: Total cost
    const totalCost = vehicleCost + rtoCost + fittingCost;

    // Step 2: Balance after initial payment
    const balance = Math.max(0, totalCost - initial);

    // Step 3: EMI breakdown for different tenures
    const emiBreakdown = {
      12: calculateEMI(balance, 12, rate, documentationCharges),
      18: calculateEMI(balance, 18, rate, documentationCharges),
      24: calculateEMI(balance, 24, rate, documentationCharges),
      30: calculateEMI(balance, 30, rate, documentationCharges),
      36: calculateEMI(balance, 36, rate, documentationCharges)
    };

    // Step 4: Return safely
    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
      rate: parseFloat(rate.toFixed(2)),
      documentationCharges: parseFloat(documentationCharges.toFixed(2)),
      emiBreakdown
    };
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) {
      alert("Customer name is required");
      return false;
    }

    if (useManualEntry) {
      if (!formData.manualVehicleName.trim()) {
        alert("Vehicle name is required for manual entry");
        return false;
      }
      if (!formData.manualVehicleCost || parseFloat(formData.manualVehicleCost) <= 0) {
        alert("Valid vehicle cost is required for manual entry");
        return false;
      }
    } else {
      if (!formData.vehicleBrand) {
        alert("Vehicle brand is required");
        return false;
      }
      if (!formData.vehicleName) {
        alert("Vehicle model is required");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const { totalCost, balance, emiBreakdown, documentationCharges } = calculateValues();
    
    const vehicleName = useManualEntry ? formData.manualVehicleName : formData.vehicleName;
    const vehicleCost = useManualEntry ? parseFloat(formData.manualVehicleCost) || 0 : parseFloat(formData.vehicleCost) || 0;
    const vehicleBrand = useManualEntry ? "Other" : formData.vehicleBrand;

    const billData = {
      billNo: billNo,
      date: today,
      customer_name: formData.customer_name,
      address: formData.address || "",
      phone: formData.phone || "",
      vehicleBrand: vehicleBrand,
      vehicleName: vehicleName,
      vehicleCost: vehicleCost,
      fittingCost: parseFloat(formData.fittingCost) || 0,
      rtoCost: parseFloat(formData.rtoCost) || 0,
      documentationCharges: documentationCharges,
      totalCost: totalCost,
      initial: parseFloat(formData.initial) || 0,
      balance: balance,
      rateOfInterest: parseFloat(formData.rateOfInterest) || 0,
      emiBreakdown: emiBreakdown,
      documentation: formData.documentation
    };

    console.log("Sending data:", billData);

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/billing/${editingId}`, billData);
        alert("✅ Quotation Updated");
        setEditingId(null);
      } else {
        await axios.post("http://localhost:5000/api/billing", billData);
        alert("✅ New Quotation Created");
        
        const nextBillNo = generateNextBillNo([...bills, billData]);
        setBillNo(nextBillNo);
      }
      resetForm();
      fetchBills();
      setShowForm(false);
    } catch (err) {
      console.error("Save error:", err);
      if (err.response) {
        console.error("Server response:", err.response.data);
        alert(`❌ Error: ${err.response.data.error}`);
      } else {
        alert("❌ Error saving quotation");
      }
    }
  };

  const handleMarkAsBooked = async (bill) => {
    try {
      const bookedVehicleData = {
        ...bill,
        bookingDate: today,
        status: "booked"
      };

      await axios.post("http://localhost:5000/api/booked-vehicles", bookedVehicleData);
      
      // Remove the quotation from the bills list after marking as booked
      await axios.delete(`http://localhost:5000/api/billing/${bill.id}`);
      
      alert("✅ Vehicle marked as booked and quotation removed");
      
      // Refresh both lists
      fetchBills();
      fetchBookedVehicles();
    } catch (err) {
      console.error("Mark as booked error:", err);
      alert("❌ Error marking vehicle as booked");
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: "",
      address: "",
      phone: "",
      vehicleBrand: "",
      vehicleName: "",
      vehicleCost: "",
      manualVehicleName: "",
      manualVehicleCost: "",
      fittingCost: "",
      documentationCharges: "",
      initial: "",
      rateOfInterest: "",
      totalCost: "",
      rtoCost: "",
      documentation: {
        aadharcard: false,
        rationcard: false,
        photo: false,
        pancard: false,
        passbook: false,
        atmcard: false,
      },
    });
    setUseManualEntry(false);
  };

  const handleEdit = (bill) => {
    let vehicleBrand = "";
    let useManual = true;
    
    // Check if vehicle exists in our database
    for (const brand in vehicles) {
      if (vehicles[brand][bill.vehicleName]) {
        vehicleBrand = brand;
        useManual = false;
        break;
      }
    }

    if (bill.vehicleBrand === "Other" || useManual) {
      useManual = true;
    }

    setFormData({
      customer_name: bill.customer_name || "",
      address: bill.address || "",
      phone: bill.phone || "",
      vehicleBrand: vehicleBrand,
      vehicleName: useManual ? "" : bill.vehicleName,
      vehicleCost: useManual ? "" : bill.vehicleCost,
      manualVehicleName: useManual ? bill.vehicleName : "",
      manualVehicleCost: useManual ? bill.vehicleCost.toString() : "",
      fittingCost: bill.fittingCost?.toString() || "",
      documentationCharges: bill.documentationCharges?.toString() || "",
      initial: bill.initial?.toString() || "",
      rateOfInterest: bill.rateOfInterest?.toString() || "",
      totalCost: bill.totalCost?.toString() || "",
      rtoCost: bill.rtoCost?.toString() || "",
      documentation: bill.documentation || {
        aadharcard: false,
        rationcard: false,
        photo: false,
        pancard: false,
        passbook: false,
        atmcard: false,
      },
    });
    setUseManualEntry(useManual);
    setEditingId(bill.id);
    setBillNo(bill.billNo || billNo);
    setShowForm(true);
  };

  const handleView = (bill) => {
    handleEdit(bill);
  };

  const handleViewBooked = (vehicle) => {
    setFormData({
      customer_name: vehicle.customer_name || "",
      address: vehicle.address || "",
      phone: vehicle.phone || "",
      vehicleBrand: vehicle.vehicleBrand || "",
      vehicleName: vehicle.vehicleName || "",
      vehicleCost: vehicle.vehicleCost?.toString() || "",
      manualVehicleName: vehicle.vehicleName || "",
      manualVehicleCost: vehicle.vehicleCost?.toString() || "",
      fittingCost: vehicle.fittingCost?.toString() || "",
      documentationCharges: vehicle.documentationCharges?.toString() || "",
      initial: vehicle.initial?.toString() || "",
      rateOfInterest: vehicle.rateOfInterest?.toString() || "",
      totalCost: vehicle.totalCost?.toString() || "",
      rtoCost: vehicle.rtoCost?.toString() || "",
      documentation: vehicle.documentation || {
        aadharcard: false,
        rationcard: false,
        photo: false,
        pancard: false,
        passbook: false,
        atmcard: false,
      },
    });
    setUseManualEntry(true);
    setBillNo(vehicle.billNo || billNo);
    setShowForm(true);
  };

  const handleClear = () => {
    resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        await axios.delete(`http://localhost:5000/api/billing/${id}`);
        alert("🗑 Quotation Deleted");
        fetchBills();
      } catch (err) {
        console.error("Delete error:", err);
        alert("❌ Error deleting quotation");
      }
    }
  };

  const handleDeleteBooked = async (id) => {
    if (window.confirm("Are you sure you want to delete this booked vehicle?")) {
      try {
        await axios.delete(`http://localhost:5000/api/booked-vehicles/${id}`);
        alert("🗑 Booked Vehicle Deleted");
        fetchBookedVehicles();
      } catch (err) {
        console.error("Delete booked vehicle error:", err);
        alert("❌ Error deleting booked vehicle");
      }
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.phone?.includes(searchTerm) ||
      bill.billNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookedVehicles = bookedVehicles.filter(
    (vehicle) =>
      vehicle.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.phone?.includes(searchTerm) ||
      vehicle.billNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { totalCost, balance, emiBreakdown, documentationCharges } = calculateValues();

  const documentationChecklist = [
    { key: "aadharcard", label: "Aadhar Card" },
    { key: "pancard", label: "PAN Card" },
    { key: "rationcard", label: "Ration Card" },
    { key: "passbook", label: "Bank Pass Book" },
    { key: "photo", label: "Photo" },
    { key: "atmcard", label: "ATM Card" }
  ];

  const renderQuotationsTable = () => (
    <>
      <h3>Total Quotations: {bills.length}</h3>

      <div className="billing-buttons">
        <button onClick={() => setShowForm(true)} className="billing-btn">
          ➕ Create New Quotation
        </button>
      </div>

      <input
        type="text"
        placeholder="🔍 Search by Name, Phone or Bill No"
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div ref={printQuotationsRef} style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center" }}>Quotation List</h2>

        <table className="bills-table">
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Total Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill) => (
              <tr key={bill.id}>
                <td>{bill.billNo}</td>
                <td>{bill.customer_name}</td>
                <td>{bill.phone}</td>
                <td>{bill.vehicleName}</td>
                <td>₹{bill.totalCost?.toLocaleString()}</td>
                <td>
                  <button onClick={() => handleView(bill)} className="action-btn view-btn">
                    🔄
                  </button>
                  <button 
                    onClick={() => handleMarkAsBooked(bill)} 
                    className="billing-btn booked-btn"
                  >
                    ✅ 
                  </button>
                  <button 
                    onClick={() => handleDelete(bill.id)} 
                    className="billing-btn delete-btn"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderBookedVehiclesTable = () => (
    <>
      <h3>Total Booked Vehicles: {bookedVehicles.length}</h3>

      <input
        type="text"
        placeholder="🔍 Search by Name, Phone, Bill No or Vehicle"
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table className="bills-table">
        <thead>
          <tr>
            <th>Bill No</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Vehicle</th>
            <th>Total Cost</th>
            <th>Booking Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBookedVehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td>{vehicle.billNo}</td>
              <td>{vehicle.customer_name}</td>
              <td>{vehicle.phone}</td>
              <td>{vehicle.vehicleName}</td>
              <td>₹{vehicle.totalCost?.toLocaleString()}</td>
              <td>{vehicle.bookingDate || vehicle.date}</td>
              <td>
                <button onClick={() => handleViewBooked(vehicle)} className="action-btn view-btn">
                  🔄 
                </button>
                <button 
                  onClick={() => handleDeleteBooked(vehicle.id)} 
                  className="billing-btn delete-btn"
                >
                  🗑 
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  return (
    <div className="billing-container">
      <div className="menu-navigation">
        <button 
          className={`menu-btn ${activeMenu === "quotations" ? "active" : ""}`}
          onClick={() => setActiveMenu("quotations")}
        >
          📋 Quotations
        </button>
        <button 
          className={`menu-btn ${activeMenu === "booked" ? "active" : ""}`}
          onClick={() => setActiveMenu("booked")}
        >
          🚗 Booked Vehicles
        </button>
      </div>

      {!showForm ? (
        <>
          {activeMenu === "quotations" ? renderQuotationsTable() : renderBookedVehiclesTable()}
        </>
      ) : (
        <>
          <div id="quotation" className="bill-a4" ref={quotationRef}>
            <div className="billing-header">
              <img src={logo} alt="Royal Bikes Logo" className="billing-logo" />
              <div className="billing-company">
                <h1>ROYAL BIKES</h1>
                <p>104/1, Erukkanchery High Road, Sharma Nagar, Vyasarpadi</p>
                <p>Chennai - 600039 (Annai Digital Opposite), ★📍★ No 52 Bharathiyar street,Manali,Chennai-600068(Near SRF School)</p>
                <p>Email: royalbikes2021@gmail.com</p>
                <div className="billing-contacts">
                  <div>📞Sales(1) 6369308779</div>
                  <div>📞Sales(2) 7550241681</div>
                  <div>📞RTO 8925270575</div>
                  <div>📞CustomerCare 9677037270</div>
                </div>
              </div>
            </div>

            <div className="billing-meta">
              <p>
                <strong>Bill No:</strong> {billNo}
              </p>
              <p>
                <strong>Date:</strong> {today}
              </p>
            </div>

            <h2 className="billing-title">QUOTATION</h2>

            <div className="customer-bike-wrapper">
              <div className="billing-section">
                <h3>Customer Details</h3>
                <input
                  name="customer_name"
                  placeholder="Name *"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                />
                <input
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                />
                
                <input
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="bike-section">
                <img src={defaultBikeImage} alt="Default Bike" className="bike-img" />
              </div>
            </div>

            <div className="billing-details-wrapper">
              <div className="billing-section">
                <h3>Vehicle & Finance Details</h3>

                <div className="no-print">
                  <label>
                    <input
                      type="radio"
                      checked={!useManualEntry}
                      onChange={() => setUseManualEntry(false)}
                    />{" "}
                    Select from List
                  </label>
                  <label style={{ marginLeft: '15px' }}>
                    <input
                      type="radio"
                      checked={useManualEntry}
                      onChange={() => setUseManualEntry(true)}
                    />{" "}
                    Manual Entry
                  </label>
                </div>

                {!useManualEntry ? (
                  <>
                    <div className="no-print">
                      <label>
                        Vehicle Brand:
                        <select
                          name="vehicleBrand"
                          value={formData.vehicleBrand}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Brand *</option>
                          {Object.keys(vehicles).map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    
                    {formData.vehicleBrand && (
                      <label>
                        Vehicle Model:
                        <select
                          name="vehicleName"
                          value={formData.vehicleName}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Model *</option>
                          {Object.keys(vehicles[formData.vehicleBrand] || {}).map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label>
                      Vehicle Cost:
                      <input
                        name="vehicleCost"
                        type="number"
                        value={formData.vehicleCost}
                        readOnly
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Vehicle Name:
                      <input
                        name="manualVehicleName"
                        type="text"
                        placeholder="Enter vehicle name *"
                        value={formData.manualVehicleName}
                        onChange={handleChange}
                        required
                      />
                    </label>

                    <label>
                      Vehicle Cost:
                      <input
                        name="manualVehicleCost"
                        type="number"
                        placeholder="Enter vehicle cost *"
                        value={formData.manualVehicleCost}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </label>
                  </>
                )}

                <label>
                  Fitting Cost:
                  <input
                    name="fittingCost"
                    type="number"
                    value={formData.fittingCost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </label>
                               
                  <label>
                    RTO Cost:
                    <input
                      name="rtoCost"
                      type="number"
                      value={formData.rtoCost}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </label>
                
                <label>
                  Total Cost:
                  <input
                    name="totalCost"
                    type="number"
                    value={totalCost}
                    readOnly
                  />
                </label>

                <label>
                  Initial Payment:
                  <input
                    name="initial"
                    type="number"
                    value={formData.initial}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </label>

                <div className="no-print">
                  <label>
                    Rate of Interest (% per annum):
                    <input
                      name="rateOfInterest"
                      type="number"
                      value={formData.rateOfInterest}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                    />
                  </label>
                </div>
                <div className="no-print">
                <label>
                  Documentation Charges:
                  <input
                    name="documentationCharges"
                    type="number"
                    value={formData.documentationCharges}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Enter document charges"
                  />
                </label>
                </div>

              </div>

              <div className="billing-summary">
                <h3>EMI Summary</h3>
                <div className="emi-breakdown-grid">
                  <div className="emi-option">
                    <div className="emi-months">12 Months</div>
                    <div className="emi-amount">₹{emiBreakdown[12]?.toFixed(2)}</div>
                  </div>
                  <div className="emi-option">
                    <div className="emi-months">18 Months</div>
                    <div className="emi-amount">₹{emiBreakdown[18]?.toFixed(2)}</div>
                  </div>
                  <div className="emi-option">
                    <div className="emi-months">24 Months</div>
                    <div className="emi-amount">₹{emiBreakdown[24]?.toFixed(2)}</div>
                  </div>
                  <div className="emi-option">
                    <div className="emi-months">30 Months</div>
                    <div className="emi-amount">₹{emiBreakdown[30]?.toFixed(2)}</div>
                  </div>
                  <div className="emi-option">
                    <div className="emi-months">36 Months</div>
                    <div className="emi-amount">₹{emiBreakdown[36]?.toFixed(2)}</div>
                  </div>
                </div>
                
              </div>
            </div>

            <div className="docs-terms-wrapper">
              <div className="billing-terms">
                <h3>TERMS & CONDITIONS :</h3>
                <ol>
                  <li>Cheque/DD to be on Royal Bikes Payable at Chennai.</li>
                  <li>The Price is Subject to Change without period notice.</li>
                  <li>
                    Vehicle delivery within 2–3 days after payment.   
                  </li>
                  <li>Cheque payments are subject to clearance before delivery.</li>
                </ol>
              </div>

              <div className="billing-documents">
                <h3>Documentation Checklist</h3>
                <div className="doc-grid">
                  {documentationChecklist.map((doc) => (
                    <label key={doc.key}>
                      <input
                        type="checkbox"
                        name={doc.key}
                        checked={formData.documentation[doc.key]}
                        onChange={handleChange}
                      />{" "}
                      {doc.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="billing-footer">
              <p>For ROYAL BIKES</p>
              
            </div>
          </div>

          <div className="billing-buttons no-print">
            <button onClick={handleSave} className="billing-btn save-btn">
              💾 Save
            </button>

            <button onClick={handlePrint} className="billing-btn print-btn">
              🖨 Print
            </button>

            <button onClick={handleClear} className="billing-btn clear-btn">
              🗑 Clear
            </button>
            <button onClick={() => setShowForm(false)} className="billing-btn">
              🔙 Back
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BillingPage;