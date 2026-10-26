import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import {
  IconUserCheck,
  IconSearch,
  IconShieldLock,
  IconBan,
  IconCheck,
  IconRefresh,
} from '@tabler/icons-react';
import AuthFeedback from './AuthFeedback';

/**
 * Modern SaaS RolePermissionEditor
 * Administrative interface for reviewing accounts, updating roles, and managing suspension.
 */
export default function RolePermissionEditor() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/users');
      if (res && res.data && res.data.users) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load user accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setActionLoadingId(userId);
      setFeedback(null);
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setFeedback({ type: 'success', message: `User role successfully updated to ${newRole}.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update user role.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      setActionLoadingId(userId);
      setFeedback(null);
      await apiClient.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
      );
      setFeedback({
        type: 'success',
        message: `User status changed to ${nextStatus}.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#0F766E]/10 rounded-lg text-[#0F766E]">
            <IconShieldLock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">User & Role Administration</h3>
            <p className="text-xs text-[#64748B]">Manage platform authority and account lifecycle</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] transition-colors self-start sm:self-auto"
        >
          <IconRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <AuthFeedback type={feedback.type} message={feedback.message} />
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-[40px] pl-9 pr-3 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-[40px] px-3 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F766E]"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="broker">Broker</option>
          <option value="agent">Agent</option>
          <option value="client">Client</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-xs text-[#64748B]">
          <IconRefresh className="w-5 h-5 animate-spin text-[#0F766E] mb-2" />
          Loading user directory...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#64748B]">
          No users match the criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredUsers.map((u) => {
                const isSuspended = u.status === 'suspended';
                const isWorking = actionLoadingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#1E293B]">{u.fullName || 'Unnamed'}</div>
                      <div className="text-[11px] text-[#64748B]">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role || 'client'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={isWorking}
                        className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-xs text-[#1E293B] font-medium focus:outline-none focus:border-[#0F766E] disabled:opacity-50"
                      >
                        <option value="client">Client</option>
                        <option value="agent">Agent</option>
                        <option value="broker">Broker</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isSuspended
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(u.id, u.status)}
                        disabled={isWorking}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-50 ${
                          isSuspended
                            ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </>
                        ) : (
                          <>
                            <IconBan className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
