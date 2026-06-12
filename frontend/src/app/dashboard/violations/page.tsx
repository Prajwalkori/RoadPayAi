"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  Download,
  BookOpen,
  QrCode,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader,
  X,
  UserCheck,
  CheckCircle,
  Clock,
  Sparkles,
  HelpCircle,
  FileCheck
} from "lucide-react";
import { apiRequest, getToken, getFileUrl, UserToken } from "../../utils/api";
import Link from "next/link";

export default function ViolationsPage() {
  const [token, setToken] = useState<UserToken | null>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [detailModal, setDetailModal] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<any>(null);
  
  // Payment Simulation Modal state
  const [simPaymentModal, setSimPaymentModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  // Unassigned Manual Plate Assignment state
  const [vehicleNumberOverride, setVehicleNumberOverride] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Preloaded vehicle numbers for easy autocomplete dropdown
  const [registeredNumbers, setRegisteredNumbers] = useState<string[]>([]);

  const loadViolations = async () => {
    setLoading(true);
    try {
      const activeToken = getToken();
      setToken(activeToken);

      let query = `/violations?page=${page}&limit=${limit}`;
      if (statusFilter) query += `&status_filter=${statusFilter}`;
      if (typeFilter) query += `&violation_type=${typeFilter}`;
      if (search) query += `&vehicle_number=${encodeURIComponent(search)}`;

      const res = await apiRequest(query);
      setViolations(res.violations || []);
      setTotal(res.total || 0);

      // Fetch registered vehicle numbers for assignment
      if (activeToken && activeToken.role === "ADMIN") {
        const numbers = await apiRequest("/vehicles/all-numbers");
        setRegisteredNumbers(numbers || []);
      }
    } catch (e) {
      console.log("Error loading violations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViolations();
  }, [page, statusFilter, typeFilter, search]);

  const openDetails = (violation: any) => {
    setSelectedViolation(violation);
    setVehicleNumberOverride("");
    setDetailModal(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedViolation) return;
    setAssigning(true);
    try {
      const formData = new FormData();
      formData.append("vehicle_number", vehicleNumberOverride);
      
      const res = await apiRequest(`/violations/${selectedViolation.id}/assign`, {
        method: "POST",
        body: formData
      });
      
      alert(res.message || "Violation assigned successfully.");
      setDetailModal(false);
      loadViolations();
    } catch (err: any) {
      alert(err.message || "Failed to assign vehicle mapping.");
    } finally {
      setAssigning(false);
    }
  };

  const handlePaymentInit = async (violationId: number) => {
    setPaying(true);
    try {
      const order = await apiRequest(`/payments/create-order?violation_id=${violationId}`, {
        method: "POST"
      });
      setPaymentOrder(order);

      if (order.mode === "simulation") {
        // Trigger simulated modal screen
        setSimPaymentModal(true);
      } else {
        // Load official Razorpay checkout script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          const options = {
            key: order.key_id,
            amount: order.amount * 100,
            currency: "INR",
            name: "RoadPay AI",
            description: `Traffic Challan Settlement`,
            order_id: order.order_id,
            handler: async function (response: any) {
              try {
                await apiRequest("/payments/verify", {
                  method: "POST",
                  body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    violation_id: violationId
                  })
                });
                alert("Payment settled successfully!");
                setDetailModal(false);
                loadViolations();
              } catch (e: any) {
                alert(e.message || "Verification failed.");
              }
            },
            prefill: {
              email: token?.email || ""
            },
            theme: {
              color: "#f43f5e"
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      }
    } catch (err: any) {
      alert(err.message || "Payment initiation failed.");
    } finally {
      setPaying(false);
    }
  };

  const handleSimulatedPaymentSubmit = async (success: boolean) => {
    setSimPaymentModal(false);
    if (!success) {
      alert("Simulated Payment Cancelled/Failed.");
      return;
    }
    
    setPaying(true);
    try {
      await apiRequest("/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_payment_id: `pay_sim_${Math.random().toString(36).substr(2, 9)}`,
          razorpay_order_id: paymentOrder.order_id,
          razorpay_signature: `sig_sim_${Math.random().toString(36).substr(2, 9)}`,
          violation_id: selectedViolation.id
        })
      });
      alert("Simulated payment verified successfully! Receipt recorded.");
      setDetailModal(false);
      loadViolations();
    } catch (err: any) {
      alert(err.message || "Failed to record simulated payment.");
    } finally {
      setPaying(false);
    }
  };

  const triggerDownloadPDF = (violation: any) => {
    // Open pdf in new tab
    const url = getFileUrl(violation.pdf_challans?.[0]?.pdf_path || `app/data/challans/challan_${violation.challan_id}.pdf`);
    window.open(url, "_blank");
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const isOwner = token?.role === "VEHICLE_OWNER";
  const isAdmin = token?.role === "ADMIN";

  return (
    <div className="space-y-8 text-[var(--text-primary)]">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Violations Feed</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Review captured traffic violations and issue payments.</p>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel-static p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vehicle number plate..."
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 md:flex-initial py-2.5 px-4 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] text-sm focus:outline-none transition-all"
          >
            <option value="">All Violations</option>
            <option value="HELMET_VIOLATION">Helmet Violation</option>
            <option value="TRIPLE_RIDING">Triple Riding</option>
            <option value="WRONG_DIRECTION">Wrong Direction</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-initial py-2.5 px-4 bg-[var(--background)] border border-[var(--border-color)] focus:border-rose-500 rounded-xl text-[var(--text-primary)] text-sm focus:outline-none transition-all"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="UNASSIGNED">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Violations Table */}
      <div className="glass-panel-static overflow-hidden">
        {loading ? (
          <div className="h-60 flex items-center justify-center text-[var(--text-secondary)]">
            <Loader className="w-6 h-6 text-rose-500 animate-spin mr-2" />
            <span>Loading violations...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold bg-[var(--hover-bg)]">
                  <th className="p-4">Challan ID</th>
                  <th className="p-4">Vehicle Number</th>
                  <th className="p-4">Violation Type</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4 text-right">Fine Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {violations.length > 0 ? (
                  violations.map((v) => (
                    <tr key={v.id} className="border-b border-[var(--border-color)] table-row-hover text-[var(--text-secondary)]">
                      <td className="p-4 font-mono font-bold text-[var(--text-primary)]">{v.challan_id}</td>
                      <td className="p-4">
                        {v.vehicle_number === "VEHICLE_NOT_FOUND" ? (
                          <span className="text-yellow-500 font-bold text-xs">Vehicle Not Found</span>
                        ) : (
                          <span className="font-mono font-semibold">{v.vehicle_number}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                          {v.violation_type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[var(--text-secondary)]">
                        {new Date(v.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-bold text-[var(--text-primary)]">₹{v.final_amount}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                            v.status === "PAID"
                              ? "bg-emerald-505/10 border-emerald-500/20 text-emerald-500"
                              : v.status === "OVERDUE"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse"
                              : v.status === "UNASSIGNED"
                              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                              : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openDetails(v)}
                          className="px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] rounded-lg text-[var(--text-secondary)] font-semibold text-xs transition-all active:scale-98 shadow-sm"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[var(--text-tertiary)] italic">
                      No violations recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 bg-[var(--hover-bg)] border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} violations total)
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

      {/* VIOLATION DETAIL MODAL */}
      {detailModal && selectedViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel-static p-6 max-w-2xl w-full my-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Challan Summary: {selectedViolation.challan_id}</h3>
              <button onClick={() => setDetailModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--hover-bg)] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Evidence Media & Details */}
              <div className="space-y-4">
                <div className="bg-[var(--background)] border border-[var(--border-color)] rounded-xl overflow-hidden aspect-video flex items-center justify-center relative">
                  {selectedViolation.violation_image_path ? (
                    <img
                      src={getFileUrl(selectedViolation.violation_image_path)}
                      alt="Violation Evidence"
                      className="w-full h-full object-cover"
                    />
                  ) : selectedViolation.violation_type === "HELMET_VIOLATION" ? (
                    <img
                      src="/traffic_evidence_mockup.png"
                      alt="Helmet Violation Mockup"
                      className="w-full h-full object-cover"
                    />
                  ) : selectedViolation.violation_type === "TRIPLE_RIDING" ? (
                    <img
                      src="/triple_riding_mockup.png"
                      alt="Triple Riding Mockup"
                      className="w-full h-full object-cover"
                    />
                  ) : selectedViolation.violation_type === "WRONG_DIRECTION" ? (
                    <img
                      src="/wrong_direction_mockup.png"
                      alt="Wrong Direction Mockup"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-[var(--text-tertiary)]">No Capture Evidence Available</span>
                  )}
                  {/* Bounding box marker label overlay */}
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-rose-600/90 text-white rounded text-[10px] font-bold uppercase">
                    AI CLASSIFIED: {selectedViolation.violation_type.replace("_", " ")}
                  </div>
                </div>

                <div className="bg-[var(--hover-bg)] p-4 border border-[var(--border-color)] rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Plate Number</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">
                      {selectedViolation.vehicle_number === "VEHICLE_NOT_FOUND" ? "Unassigned" : selectedViolation.vehicle_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Base Fine</span>
                    <span className="font-semibold text-[var(--text-primary)]">₹{selectedViolation.base_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Late Penalty Fee</span>
                    <span className="font-semibold text-rose-500">+ ₹{selectedViolation.late_penalty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Mitigation Savings</span>
                    <span className="font-semibold text-emerald-500">- ₹{selectedViolation.discount_earned}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border-color)] pt-2 font-bold text-sm">
                    <span className="text-[var(--text-primary)]">Final Outstanding</span>
                    <span className="text-[var(--text-primary)]">₹{selectedViolation.final_amount}</span>
                  </div>
                </div>
              </div>

              {/* AI explanations & actions */}
              <div className="flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">AI Safety Diagnosis</h4>
                  <p className="text-[var(--text-primary)] text-sm leading-relaxed mb-6 bg-[var(--hover-bg)] p-4 border border-[var(--border-color)] rounded-xl">
                    {selectedViolation.explanation || "Please follow standard road safety protocols to safeguard lives."}
                  </p>

                  {/* Date information */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-[var(--text-secondary)] mb-6">
                    <div>
                      <span className="block text-[var(--text-tertiary)]">Timestamp</span>
                      <strong className="text-[var(--text-primary)]">{new Date(selectedViolation.timestamp).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="block text-[var(--text-tertiary)]">Due Date</span>
                      <strong className="text-[var(--text-primary)]">{new Date(selectedViolation.due_date).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>

                {/* ADMIN Override for Unassigned plates */}
                {selectedViolation.status === "UNASSIGNED" && isAdmin && (
                  <form onSubmit={handleAssign} className="border-t border-[var(--border-color)] pt-4 mt-4 space-y-3">
                    <label className="block text-xs font-bold text-yellow-500 uppercase tracking-wider">
                      ⚠️ Vehicle Not Found. Resolve manually:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={vehicleNumberOverride}
                        onChange={(e) => setVehicleNumberOverride(e.target.value)}
                        required
                        className="flex-1 py-2 px-3 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-xs outline-none focus:border-rose-500"
                      >
                        <option value="">Select vehicle number...</option>
                        {registeredNumbers.map((num) => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={assigning}
                        className="px-4 py-2 bg-gradient-success text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
                      >
                        {assigning ? "Assigning..." : "Assign"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Standard buttons */}
                {selectedViolation.status !== "UNASSIGNED" && (
                  <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                    {/* PDF Invoice Button */}
                    <button
                      onClick={() => triggerDownloadPDF(selectedViolation)}
                      className="w-full py-2.5 px-4 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
                    >
                      <Download className="w-4 h-4 text-cyan-500" />
                      <span>Download Challan Invoice (PDF)</span>
                    </button>

                    {/* Owner Action Buttons (Pay / Quiz) */}
                    {isOwner && selectedViolation.status !== "PAID" && (
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href={`/dashboard/learning?violation_id=${selectedViolation.id}`}
                          className="py-3 px-3 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-emerald-500 hover:text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all text-center shadow-sm"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Earn Discount</span>
                        </Link>
                        
                        <button
                          onClick={() => handlePaymentInit(selectedViolation.id)}
                          disabled={paying}
                          className="py-3 px-3 bg-gradient-primary text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{paying ? "Processing..." : "Scan & Pay"}</span>
                        </button>
                      </div>
                    )}
                    
                    {/* Receipt print if PAID */}
                    {selectedViolation.status === "PAID" && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Challan Settle Complete</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAZORPAY SIMULATION CHECKOUT SCREEN MODAL */}
      {simPaymentModal && paymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel-static max-w-sm w-full relative overflow-hidden animate-fade-in">
            {/* Header bar */}
            <div className="bg-[var(--hover-bg)] p-4 border-b border-[var(--border-color)] text-center relative">
              <span className="text-[10px] bg-rose-600 text-white font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                Razorpay Test Mode (Simulated)
              </span>
              <h4 className="text-[var(--text-primary)] font-black text-sm mt-2">RoadPay AI Secure Checkout</h4>
              <p className="text-[10px] text-[var(--text-secondary)]">Order ID: {paymentOrder.order_id}</p>
            </div>

            {/* Price list */}
            <div className="p-6 text-center space-y-4">
              <div className="text-4xl font-black text-[var(--text-primary)]">₹{paymentOrder.amount}</div>
              <p className="text-xs text-[var(--text-secondary)]">Merchant Reference: Challan Ref {selectedViolation?.challan_id}</p>
              
              <div className="p-4 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-left text-[10px] text-[var(--text-secondary)] space-y-1.5">
                <div className="flex justify-between"><span className="font-semibold">UPI/Wallet:</span><span className="text-[var(--text-primary)]">Active</span></div>
                <div className="flex justify-between"><span className="font-semibold">Secure Socket Layer:</span><span className="text-emerald-500">Enabled</span></div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-[var(--hover-bg)] border-t border-[var(--border-color)] flex gap-2">
              <button
                onClick={() => handleSimulatedPaymentSubmit(false)}
                className="flex-1 py-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Decline
              </button>
              <button
                onClick={() => handleSimulatedPaymentSubmit(true)}
                className="flex-1 py-2.5 bg-gradient-success text-white font-bold rounded-xl text-xs shadow-lg hover:brightness-110 active:scale-98 transition-all"
              >
                Approve Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
