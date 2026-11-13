import React, { useState, useEffect, useContext, useRef } from 'react';
import apiClient from '../../services/apiClient';
import AuthContext from '../../context/AuthContext';
import {
  IconSearch,
  IconShieldLock,
  IconBan,
  IconCheck,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconCertificate,
  IconFilter,
  IconEye,
} from '@tabler/icons-react';
import AuthFeedback from './AuthFeedback';
import UserMetricsStrip from './UserMetricsStrip';
import UserActionConfirmationModal from './UserActionConfirmationModal';
import AgentCredentialDrawer from './AgentCredentialDrawer';

/**
 * Modern SaaS RolePermissionEditor
 * Executive administrative interface for reviewing accounts, updating roles, and managing suspension.
 * Features:
 * - Executive 4-card KPI summary strip with reactive click-to-filter
 * - ⌘K / Ctrl+K keyboard shortcut focus
 * - Multi-facet filtering (Search, Role, Status) and quick reset
 * - Two-step confirmation modal with mandatory justification for suspensions
 * - Slide-out Agent Credential Drawer for PRC/DHSUD compliance audits
 * - Self-lockout prevention (disables role changes & suspension for current admin)
 */
export default function RolePermissionEditor({ currentUserId: propUserId }) {
  const auth = useContext(AuthContext);
  const activeUser = auth?.user || null;
  const activeUserId = propUserId || activeUser?.id;
  const activeUserEmail = activeUser?.email;

  const searchInputRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modal & Drawer States
  const [modalState, setModalState] = useState({
    isOpen: false,
    actionType: 'suspend',
    user: null,
    newRole: null,
  });
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [drawerAgent, setDrawerAgent] = useState(null);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await apiClient.get('/admin/users/stats');
      const statsPayload = res?.data?.totalUsers !== undefined ? res.data : (res?.data?.data || res);
      if (statsPayload && typeof statsPayload.totalUsers === 'number') {
        setStats(statsPayload);
      }
    } catch {
      // Gracefully fall back to local counts if stats endpoint unavailable
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/users', {
        params: {
          page,
          limit,
          search: search.trim() || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });

      if (res && res.data) {
        const data = res.data;
        const fetchedUsers = data.users || [];
        setUsers(fetchedUsers);
        const resolvedTotal = data.total ?? fetchedUsers.length;
        setTotal(resolvedTotal);
        setTotalPages(data.totalPages ?? Math.max(1, Math.ceil(resolvedTotal / limit)));
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load user accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Debounced fetch when search, roleFilter, statusFilter, or page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);

    return () => clearTimeout(timer);
  }, [page, roleFilter, statusFilter, search]);

  // Global Hotkey ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const isSelfAccount = (u) => {
    if (activeUserId && u.id === activeUserId) return true;
    if (activeUserEmail && u.email && u.email.toLowerCase() === activeUserEmail.toLowerCase()) return true;
    return false;
  };

  const handleRoleSelectChange = (u, targetRole) => {
    if (targetRole === u.role) return;
    setModalState({
      isOpen: true,
      actionType: 'role_change',
      user: u,
      newRole: targetRole,
    });
  };

  const isUserSuspended = (u) => {
    const raw = String(u?.verification_status || u?.status || '').toUpperCase();
    return raw === 'SUSPENDED';
  };

  const getUserDisplayName = (u) => u?.fullName || u?.full_name || 'Unnamed';

  const handleOpenActionModal = (u, isCurrentlySuspended) => {
    setModalState({
      isOpen: true,
      actionType: isCurrentlySuspended ? 'activate' : 'suspend',
      user: u,
      newRole: null,
    });
  };

  const handleConfirmActionModal = async (reason) => {
    const targetUser = modalState.user;
    if (!targetUser) return;

    if (modalState.actionType === 'role_change') {
      const newRole = modalState.newRole;
      try {
        setIsModalSubmitting(true);
        setFeedback(null);
        await apiClient.patch(`/admin/users/${targetUser.id}/role`, { role: newRole });
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        setFeedback({ type: 'success', message: `User role successfully updated to ${newRole}.` });
        setModalState({ isOpen: false, actionType: 'suspend', user: null, newRole: null });
        fetchStats();
      } catch (err) {
        setFeedback({ type: 'error', message: err.message || 'Failed to update user role.' });
      } finally {
        setIsModalSubmitting(false);
      }
      return;
    }

    const isSuspend = modalState.actionType === 'suspend';
    const nextApiStatus = isSuspend ? 'SUSPENDED' : 'VERIFIED';
    const nextUiLabel = isSuspend ? 'suspended' : 'active';

    try {
      setIsModalSubmitting(true);
      setFeedback(null);
      await apiClient.patch(`/admin/users/${targetUser.id}/status`, {
        status: nextApiStatus,
        reason: reason || undefined,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, status: nextUiLabel, verification_status: nextApiStatus }
            : u
        )
      );

      setFeedback({
        type: 'success',
        message: `User status changed to ${nextUiLabel}.`,
      });

      setModalState({ isOpen: false, actionType: 'suspend', user: null, newRole: null });
      fetchStats();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' });
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const hasActiveFilters = search || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Executive KPI Metrics Strip */}
      <UserMetricsStrip
        stats={stats}
        loading={statsLoading}
        activeFilter={{ role: roleFilter, status: statusFilter }}
        onSelectFilter={(role, status) => {
          setRoleFilter(role);
          setStatusFilter(status);
          setPage(1);
        }}
      />

      {/* Main Table Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
        {/* Header */}
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#0F766E] hover:bg-teal-50 transition-colors"
              >
                Reset Filters
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                fetchUsers();
                fetchStats();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
            >
              <IconRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {feedback && (
          <AuthFeedback type={feedback.type} message={feedback.message} />
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name or email... (⌘K / Ctrl+K)"
              className="w-full h-[40px] pl-9 pr-14 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            />
            <div className="absolute right-3 top-2.5 pointer-events-none hidden sm:inline-block">
              <span className="text-[10px] font-mono text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </span>
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={handleRoleFilterChange}
            className="h-[40px] px-3 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F766E]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="broker">Broker</option>
            <option value="agent">Agent</option>
            <option value="client">Client</option>
          </select>

          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="h-[40px] px-3 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F766E]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-xs text-[#64748B]">
            <IconRefresh className="w-5 h-5 animate-spin text-[#0F766E] mb-2" />
            Loading user directory...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B] space-y-2">
            <IconFilter className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No users match the criteria.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#0F766E] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="py-2.5 px-3">User & Accreditation</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {users.map((u) => {
                  const isSuspended = isUserSuspended(u);
                  const isWorking = actionLoadingId === u.id;
                  const isSelf = isSelfAccount(u);

                  return (
                    <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-[#1E293B]">{getUserDisplayName(u)}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
                              Your account
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{u.email}</div>
                        {u.role === 'agent' && (
                          <div className="mt-1 flex items-center gap-2">
                            {u.prc_license_no ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                <IconCertificate className="w-3 h-3" />
                                <span>PRC #{u.prc_license_no}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                <span>PRC: Unregistered</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setDrawerAgent(u)}
                              className="inline-flex items-center gap-0.5 text-[10px] text-[#0F766E] hover:underline font-medium"
                            >
                              <IconEye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={u.role || 'client'}
                          onChange={(e) => handleRoleSelectChange(u, e.target.value)}
                          disabled={isWorking || isSelf}
                          title={isSelf ? 'Cannot modify your own administrative role' : undefined}
                          className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-xs text-[#1E293B] font-medium focus:outline-none focus:border-[#0F766E] disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                          onClick={() => handleOpenActionModal(u, isSuspended)}
                          disabled={isWorking || isSelf}
                          title={isSelf ? 'Cannot suspend your own account' : undefined}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed ${
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

        {/* Pagination Footer */}
        {!loading && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B]">
            <div>
              Showing <span className="font-semibold text-[#1E293B]">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-[#1E293B]">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-[#1E293B]">{total}</span> accounts
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E2E8F0] text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <IconChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-2 py-1 text-xs font-medium text-[#1E293B]">
                Page {page} of {Math.max(1, totalPages)}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E2E8F0] text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Two-Step Action Confirmation Modal */}
      <UserActionConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, actionType: 'suspend', user: null, newRole: null })}
        onConfirm={handleConfirmActionModal}
        actionType={modalState.actionType}
        userName={modalState.user ? getUserDisplayName(modalState.user) : 'User'}
        userEmail={modalState.user?.email || ''}
        currentRole={modalState.user?.role || 'client'}
        newRole={modalState.newRole || ''}
        isSubmitting={isModalSubmitting}
      />

      {/* Slide-out Agent Credential Drawer */}
      <AgentCredentialDrawer
        isOpen={Boolean(drawerAgent)}
        onClose={() => setDrawerAgent(null)}
        agent={drawerAgent}
      />
    </div>
  );
}
