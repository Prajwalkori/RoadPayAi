"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  Check,
  X,
  FileSpreadsheet
} from "lucide-react";
import { apiRequest, getToken, UserToken } from "../../utils/api";

export default function RegistryPage() {
  const [token, setToken] = useState<UserToken | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  // Form values
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [vehicleType, setVehicleType] = useState("MOTORCYCLE");
  const [status, setStatus] = useState("ACTIVE");
  const [regDate, setRegDate] = useState("");

  // Bulk options
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const activeToken = getToken();
      setToken(activeToken);
      
      let query = `/vehicles?page=${page}&limit=${limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status_filter=${statusFilter}`;
      if (typeFilter) query += `&vehicle_type=${typeFilter}`;
      
      const res = await apiRequest(query);
      setVehicles(res.vehicles || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.log("Error loading vehicles:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [page, search, statusFilter, typeFilter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          vehicle_number: vehicleNumber,
          owner_name: ownerName,
          email,
          phone,
          address,
          vehicle_type: vehicleType,
          registration_date: regDate || null,
          status
        })
      });
      setAddModal(false);
      resetForm();
      loadVehicles();
    } catch (err: any) {
      alert(err.message || "Failed to create vehicle.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      await apiRequest(`/vehicles/${selectedVehicle.id}`, {
        method: "PUT",
        body: JSON.stringify({
          owner_name: ownerName,
          email,
          phone,
          address,
          vehicle_type: vehicleType,
          registration_date: regDate || null,
          status
        })
      });
      setEditModal(false);
      resetForm();
      loadVehicles();
    } catch (err: any) {
      alert(err.message || "Failed to edit vehicle details.");
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;
    try {
      await apiRequest(`/vehicles/${selectedVehicle.id}`, {
        method: "DELETE"
      });
      setDeleteModal(false);
      loadVehicles();
    } catch (err: any) {
      alert(err.message || "Failed to delete vehicle.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} vehicles?`)) return;
    try {
      await apiRequest("/vehicles/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedIds)
      });
      setSelectedIds([]);
      loadVehicles();
    } catch (err: any) {
      alert(err.message || "Failed to delete vehicles.");
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setCsvUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiRequest("/vehicles/import", {
        method: "POST",
        body: formData
      });
      alert(`Import complete: ${res.success} vehicles loaded successfully. Errors: ${res.failed}`);
      loadVehicles();
    } catch (err: any) {
      alert(err.message || "Failed to parse CSV.");
    } finally {
      setCsvUploading(false);
    }
  };

  const handleExport = () => {
    // Redirect browser directly to export URL to trigger download stream
    const activeToken = getToken();
    if (activeToken) {
      window.open(`http://localhost:8000/api/vehicles/export?token=${activeToken.access_token}`, "_blank");
    }
  };

  const openEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setVehicleNumber(vehicle.vehicle_number);
    setOwnerName(vehicle.owner_name);
    setEmail(vehicle.email);
    setPhone(vehicle.phone);
    setAddress(vehicle.address || "");
    setVehicleType(vehicle.vehicle_type);
    setStatus(vehicle.status);
    setRegDate(vehicle.registration_date || "");
    setEditModal(true);
  };

  const openDelete = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setDeleteModal(true);
  };

  const resetForm = () => {
    setVehicleNumber("");
    setOwnerName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setVehicleType("MOTORCYCLE");
    setStatus("ACTIVE");
    setRegDate("");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === vehicles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(vehicles.map((v) => v.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const isAdmin = token?.role === "ADMIN";

  return (
    <div className="space-y-8 text-[var(--text-primary)]">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Vehicle Registry</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Manage vehicles database and lookup parameters.</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 max-sm:flex-wrap">
          {isAdmin && (
            <>
              <button
                onClick={handleExport}
                className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl flex items-center gap-2 font-bold text-xs transition-all active:scale-98 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              
              <label className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl flex items-center gap-2 font-bold text-xs cursor-pointer transition-all active:scale-98 shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                <span>{csvUploading ? "Importing..." : "Import CSV"}</span>
                <input type="file" onChange={handleCsvUpload} accept=".csv" className="hidden" />
              </label>

              <button
                onClick={() => { resetForm(); setAddModal(true); }}
                className="px-4 py-2.5 bg-gradient-primary text-white rounded-xl flex items-center gap-2 font-bold text-xs shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters & search panel */}
      <div className="glass-panel-static p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vehicle number, owner name, phone, email..."
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 md:flex-initial py-2.5 px-4 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] text-sm focus:outline-none transition-all"
          >
            <option value="">All Types</option>
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="CAR">Car</option>
            <option value="TRUCK">Truck</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-initial py-2.5 px-4 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] text-sm focus:outline-none transition-all"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>
        </div>
      </div>

      {/* Bulk action selection banner */}
      {selectedIds.length > 0 && isAdmin && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 rounded-xl flex items-center justify-between animate-fade-in">
          <span className="text-sm font-semibold">{selectedIds.length} vehicle(s) selected</span>
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all hover:bg-rose-500 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="glass-panel-static overflow-hidden">
        {loading ? (
          <div className="h-60 flex items-center justify-center text-[var(--text-secondary)]">
            <Loader className="w-6 h-6 text-rose-500 animate-spin mr-2" />
            <span>Loading registry...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold bg-[var(--hover-bg)]">
                  {isAdmin && (
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={vehicles.length > 0 && selectedIds.length === vehicles.length}
                        onChange={toggleSelectAll}
                        className="rounded border-[var(--border-color)] accent-rose-500 focus:ring-0 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="p-4">Vehicle Number</th>
                  <th className="p-4">Owner Details</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Reg Date</th>
                  <th className="p-4 text-center">Status</th>
                  {isAdmin && <th className="p-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vehicles.length > 0 ? (
                  vehicles.map((v) => (
                    <tr key={v.id} className="border-b border-[var(--border-color)] table-row-hover text-[var(--text-secondary)]">
                      {isAdmin && (
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(v.id)}
                            onChange={() => toggleSelect(v.id)}
                            className="rounded border-[var(--border-color)] accent-rose-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="p-4 font-mono font-bold text-[var(--text-primary)]">{v.vehicle_number}</td>
                      <td className="p-4 text-left">
                        <div className="font-semibold text-[var(--text-primary)]">{v.owner_name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{v.email}</div>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">{v.phone}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                          {v.vehicle_type}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[var(--text-secondary)]">{v.registration_date}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            v.status === "ACTIVE"
                              ? "bg-emerald-505/10 border-emerald-500/20 text-emerald-500"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEdit(v)}
                              className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openDelete(v)}
                              className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-rose-500 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[var(--text-tertiary)] italic">
                      No vehicles found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="p-4 bg-[var(--hover-bg)] border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} vehicles total)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] rounded-lg border border-[var(--border-color)] disabled:opacity-40 transition-all cursor-pointer shadow-sm text-[var(--text-primary)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] rounded-lg border border-[var(--border-color)] disabled:opacity-40 transition-all cursor-pointer shadow-sm text-[var(--text-primary)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ADD VEHICLE MODAL */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel-static p-6 max-w-md w-full animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Registered Vehicle</h3>
              <button onClick={() => setAddModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--hover-bg)] transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-4 text-sm text-left">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Vehicle Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH12AB1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-tertiary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-tertiary)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Owner Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-tertiary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Owner Email</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-tertiary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Home Address</label>
                <textarea
                  placeholder="Street details..."
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-tertiary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all"
                  >
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="CAR">Car</option>
                    <option value="TRUCK">Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="BLACKLISTED">Blacklisted</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-primary text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                >
                  Save Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel-static p-6 max-w-md w-full animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] text-left">Edit Registered Vehicle: {vehicleNumber}</h3>
              <button onClick={() => setEditModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--hover-bg)] transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEdit} className="space-y-4 text-sm text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Owner Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Owner Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all"
                  >
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="CAR">Car</option>
                    <option value="TRUCK">Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] outline-none transition-all"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="BLACKLISTED">Blacklisted</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-primary text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel-static p-6 max-w-sm w-full text-center animate-fade-in">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Confirm Deletion</h3>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-6">
              Are you sure you want to delete vehicle registration <strong>{selectedVehicle?.vehicle_number}</strong>? This soft-deletes the record from active queries.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteModal(false)}
                className="flex-1 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
