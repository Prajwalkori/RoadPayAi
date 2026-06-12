"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Loader,
  X,
  UserCheck,
  UserX,
  UserPlus
} from "lucide-react";
import { apiRequest, getToken, UserToken } from "../../utils/api";

export default function UsersPage() {
  const [token, setToken] = useState<UserToken | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [passModal, setPassModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VEHICLE_OWNER");
  const [status, setStatus] = useState("ACTIVE");
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const activeToken = getToken();
      setToken(activeToken);
      
      const res = await apiRequest("/users");
      setUsersList(res || []);
    } catch (e) {
      console.log("Error loading users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role, status })
      });
      setAddModal(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to create user.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await apiRequest(`/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ name, email, role, status })
      });
      setEditModal(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user details.");
    }
  };

  const handleDelete = async (id: number, uName: string) => {
    if (id === token?.id) {
      alert("You cannot delete your own admin account.");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete user account "${uName}"?`)) return;
    
    try {
      await apiRequest(`/users/${id}`, { method: "DELETE" });
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user.");
    }
  };

  const handleStatusToggle = async (user: any) => {
    if (user.id === token?.id) {
      alert("You cannot suspend your own admin account.");
      return;
    }
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await apiRequest(`/users/${user.id}/status?status_in=${nextStatus}`, {
        method: "POST"
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Status change failed.");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await apiRequest(`/users/${selectedUser.id}/reset-password?new_password=${newPassword}`, {
        method: "POST"
      });
      setPassModal(false);
      setNewPassword("");
      alert(`Password updated for user ${selectedUser.name}.`);
    } catch (err: any) {
      alert(err.message || "Password reset failed.");
    }
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setEditModal(true);
  };

  const openPassReset = (user: any) => {
    setSelectedUser(user);
    setNewPassword("");
    setPassModal(true);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("VEHICLE_OWNER");
    setStatus("ACTIVE");
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">User Management</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Configure user accounts and access roles.</p>
        </div>
        
        <button
          onClick={() => { resetForm(); setAddModal(true); }}
          className="px-4 py-2.5 bg-gradient-primary text-white rounded-xl flex items-center gap-2 font-bold text-xs shadow-lg hover:brightness-110 active:scale-98 transition-all shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="glass-panel-static overflow-hidden">
        {loading ? (
          <div className="h-60 flex items-center justify-center text-[var(--text-secondary)]">
            <Loader className="w-6 h-6 text-[var(--primary)] animate-spin mr-2" />
            <span>Retrieving accounts directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold bg-[var(--hover-bg)]">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-xs text-[var(--text-tertiary)]">Date Created</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length > 0 ? (
                  usersList.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--border-color)] table-row-hover text-[var(--text-secondary)]">
                      <td className="p-4 font-bold text-[var(--text-primary)]">{u.name}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleStatusToggle(u)}
                          disabled={u.id === token?.id}
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 cursor-pointer ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20"
                          }`}
                        >
                          {u.status === "ACTIVE" ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
                              <span>Suspended</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-xs text-[var(--text-tertiary)]">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                            title="Edit details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => openPassReset(u)}
                            className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-cyan-500 transition-all"
                            title="Reset password"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            disabled={u.id === token?.id}
                            className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all disabled:opacity-30"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[var(--text-tertiary)] italic">No users seeded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD USER MODAL */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel-static p-6 max-w-md w-full !bg-[var(--sidebar-bg)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Create User Profile</h3>
              <button onClick={() => setAddModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Officer Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--primary)] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="sharma@roadpay.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--primary)] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--primary)] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Access Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none text-xs transition-all"
                  >
                    <option value="VEHICLE_OWNER">Vehicle Owner</option>
                    <option value="TRAFFIC_OFFICER">Traffic Officer</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none text-xs transition-all"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-primary text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER DETAILS MODAL */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel-static p-6 max-w-md w-full !bg-[var(--sidebar-bg)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Modify User details</h3>
              <button onClick={() => setEditModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEdit} className="space-y-4 text-sm">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--primary)] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--primary)] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Access Role</label>
                  <select
                    value={role}
                    disabled={selectedUser?.id === token?.id}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none text-xs disabled:opacity-50 transition-all"
                  >
                    <option value="VEHICLE_OWNER">Vehicle Owner</option>
                    <option value="TRAFFIC_OFFICER">Traffic Officer</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Status</label>
                  <select
                    value={status}
                    disabled={selectedUser?.id === token?.id}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none text-xs disabled:opacity-50 transition-all"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-primary text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {passModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel-static p-6 max-w-sm w-full !bg-[var(--sidebar-bg)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-[var(--primary)]" />
                <span>Reset User Password</span>
              </h3>
              <button onClick={() => setPassModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordReset} className="space-y-4 text-sm">
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                Provide a new password for account holder <strong>{selectedUser?.name}</strong>.
              </p>
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--primary)] outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPassModal(false)}
                  className="px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
