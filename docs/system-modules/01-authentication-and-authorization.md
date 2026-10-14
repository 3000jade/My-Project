# Module 01: Authentication & Authorization

### Module 01: Authentication & Authorization

**📌 PURPOSE**
- Secures the system by verifying user identity and granting role-specific access to system portals and endpoints. It ensures that sensitive operations (like approving listings or managing team sales) are restricted strictly to authorized personnel.

**👥 USERS**
- **Client** (Default buyer/renter account)
- **Agent** (Licensed sales representative)
- **Broker** (Managing executive / firm principal)
- **Administrator** (Global superuser)

**⚙️ KEY FEATURES**
- **Dual Sign-In Methods**: Supports both standard email/password credentials and fast **Google One-Tap OAuth**.
- **Role-Based Access Control (RBAC)**: Automatically checks user roles before opening protected routes or executing backend actions.
- **Session Token Verification**: Issues and validates secure **JWT tokens** on every authenticated request.
- **Role Hierarchy & Superuser Bypass**: Grants full access across all operations to **Administrators**, while partitioning portals between Brokers, Agents, and Clients.

**🔄 SIMPLE PROCESS**
- User Enters Credentials → System Verifies Identity → System Issues Token with Role → User Accesses Authorized Portal

> **Realistic Example:**  
> An Agent visits the login page and submits their email and password. The system checks the credentials, confirms their role is `agent`, generates a secure token, and redirects them directly to the **Agent Dashboard** while locking out administrative broker controls.

**🚫 LIMITATIONS**
- **No Self-Assigned Privileges**: Clients and Agents cannot change their own roles to `broker` or `admin`.
- **Role Upgrades Require Authority**: Direct publishing and broker-level listing approvals cannot be performed by an Agent without Broker/Admin authorization.
- **Single-Role Per Session**: A user operates under one primary active role per session; multi-tenant switching across accounts requires re-authentication.
