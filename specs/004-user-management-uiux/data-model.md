# Data & UI State Model: Stakeholder User Management

**Feature**: `004-user-management-uiux`  
**Date**: 2026-11-11

## 1. Executive Metrics DTO (`UserManagementStats`)

```typescript
interface UserManagementStats {
  totalUsers: number;
  activeToday: number;
  pendingAccreditation: number;
  suspendedAccounts: number;
}
```

## 2. Table Filter & Pagination State (`UserFilterState`)

```typescript
interface UserFilterState {
  search: string;          // debounced text filter (name, email)
  role: string;            // 'all' | 'admin' | 'broker' | 'agent' | 'client'
  status: string;          // 'all' | 'active' | 'suspended' | 'pending'
  page: number;            // 1-indexed current page
  limit: number;           // default 10, range: [10, 50]
}
```

## 3. Two-Step Action Modal State (`ActionModalState`)

```typescript
interface ActionModalState {
  isOpen: boolean;
  type: 'suspend' | 'role_change' | 'activate';
  targetUser: {
    id: string;
    fullName: string;
    email: string;
    currentRole: string;
    currentStatus: string;
  } | null;
  newRole?: string;
  reason: string;
  isSubmitting: boolean;
  validationError?: string;
}
```

## 4. Agent Credential Drawer State (`CredentialDrawerState`)

```typescript
interface CredentialDrawerState {
  isOpen: boolean;
  agent: {
    id: string;
    fullName: string;
    email: string;
    prcLicenseNo?: string;
    prcValidity?: string;
    dhsudAccreditationNo?: string;
    dhsudValidity?: string;
    verificationStatus: string;
    experienceYears?: number;
    brokerageName?: string;
  } | null;
}
```
