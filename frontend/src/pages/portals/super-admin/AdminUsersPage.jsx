import React, { useState } from 'react';
import {
  RolePermissionEditor,
  SessionManagementPanel,
} from '../../../components/auth';
import { IconUsers, IconDevices, IconShield } from '@tabler/icons-react';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#0F766E] mb-1">
            <IconShield className="w-4 h-4" />
            <span>Super Administrator Control</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            Platform Administration & Access Controls
          </h1>
          <p className="text-sm text-[#64748B]">
            Manage user roles, account suspension status, and active security sessions across the organization.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-white text-[#0F766E] shadow-sm font-semibold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <IconUsers className="w-4 h-4" />
            <span>Users & Roles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'sessions'
                ? 'bg-white text-[#0F766E] shadow-sm font-semibold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <IconDevices className="w-4 h-4" />
            <span>Active Sessions</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'users' ? (
        <RolePermissionEditor />
      ) : (
        <SessionManagementPanel />
      )}
    </div>
  );
}
