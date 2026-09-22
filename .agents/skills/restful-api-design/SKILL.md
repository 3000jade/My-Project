---
name: restful-api-design
description: Use when designing, scaffolding, implementing, or testing RESTful API endpoints, Express controllers, services, middleware, and Axios client integrations.
---

# RESTful API Design & Full-Stack Integration Standards

A comprehensive reference and pattern guide for engineering enterprise-grade, secure, and type-safe RESTful APIs within decoupled monorepos.

---

## 1. The 3-Tier Layered Architecture

All backend and frontend API code must strictly honor layer boundaries. No single layer may perform duties belonging to another layer.

```text
[ Presentation Tier ]  React 19 Views -> Domain Services (propertyService.js)
         │
         ▼ (HTTP / JSON)
[ Transport Tier ]     Axios apiClient (Bearer Interceptors, Base URL, Error Unwrapping)
         │
         ▼ (Network Boundary)
[ Gateway / Router ]   Express 5 Routers (/api/properties, /api/auth) + Middlewares (requireAuth)
         │
         ▼
[ Controller Tier ]    HTTP Handlers (Request parsing, input validation, status dispatch)
         │             ⚠️ NO SQL, NO ORM, NO DIRECT DATABASE ACCESS IN CONTROLLERS
         ▼
[ Service Tier ]       Domain Business Logic & Calculations
         │
         ▼
[ Persistence Tier ]   Database Queries (Supabase, PostgreSQL)
```

### Layer Responsibilities & Hard Rules

| Layer | Location | Allowed Operations | Forbidden Operations |
| :--- | :--- | :--- | :--- |
| **Routes** | `backend/src/routes/` | Endpoint mapping, attaching middleware (`requireAuth`). | Business logic, handling response formatting directly. |
| **Controllers** | `backend/src/controllers/` | Extract `req.query`/`req.body`, validate parameters, invoke Services, return `res.status().json(envelope)`. | Direct SQL/ORM calls, raw database drivers, complex mathematical business logic. |
| **Services** | `backend/src/services/` | Pure business logic, pricing heuristics, database queries. Returns raw domain data or throws domain errors. | Accessing Express `req`, `res`, or HTTP status codes. |
| **Middlewares** | `backend/src/middleware/` | Bearer token verification, authorization guards, global error handling. | Domain calculations or endpoint-specific data manipulation. |
| **Client Transport**| `frontend/src/services/` | Axios instance, interceptors, domain fetchers (`propertyService.js`). | Direct database queries, exposing database secrets to browser. |

---

## 2. Universal API Envelope Contract

Every endpoint in the system MUST wrap its payload in the standardized contract defined in `shared/types/api.ts`:

### Standard Envelope (`ApiResponse<T>`)
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
```

### Paginated Envelope (`PaginatedResponse<T>`)
```typescript
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

### HTTP Status Code Conventions
* **`200 OK`**: Successful `GET`, `PUT`, `PATCH`, or `DELETE`.
* **`201 Created`**: Successful resource creation (`POST`).
* **`400 Bad Request`**: Malformed body, missing required fields, or failed validation.
* **`401 Unauthorized`**: Missing or invalid Bearer authentication token.
* **`403 Forbidden`**: Authenticated user lacks permission (e.g. non-admin editing another agent's listing).
* **`404 Not Found`**: Resource does not exist.
* **`500 Internal Server Error`**: Unhandled exception (caught by global error middleware).

---

## 3. RESTful Resource Conventions

Always model endpoints as plural nouns representing resources:

### Resource: `/api/properties`
* `GET /api/properties`: Retrieve list with filtering & pagination:
  * Query parameters: `?page=1&limit=20&city=Muntinlupa&minPrice=10000000&status=available`
* `GET /api/properties/:id`: Retrieve single property detail.
* `POST /api/properties`: Create new property listing (`requireAuth`).
* `PUT /api/properties/:id`: Full update of property listing (`requireAuth`).
* `PATCH /api/properties/:id`: Partial update of property (e.g. status change).
* `DELETE /api/properties/:id`: Delete property listing (`requireAuth`).

### Resource: `/api/valuations`
* `POST /api/valuations/estimate`: Calculate property market estimate based on input specs.

### Resource: `/api/inquiries`
* `POST /api/inquiries`: Submit lead capture or private tour request.
* `GET /api/inquiries`: Retrieve agent inquiries (`requireAuth`).

---

## 4. Frontend Axios Engine & Interceptor Standard

The frontend must never execute direct database calls or scattered `fetch` requests inside React components. All network traffic routes through a centralized Axios client.

### Standard `apiClient.js` Implementation
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer JWT
apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('cp_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // Ignore storage errors in non-browser environments
  }
  return config;
});

// Response Interceptor: Unwrap data & centralize 401 handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cp_auth_token');
      // Trigger redirect or auth state cleanup
    }
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
```

### Domain Service Abstraction Example (`propertyService.js`)
```javascript
import apiClient from './apiClient';

export const propertyService = {
  async getProperties(params = {}) {
    const response = await apiClient.get('/properties', { params });
    return response.data || [];
  },

  async getPropertyById(id) {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  async createProperty(propertyData) {
    const response = await apiClient.post('/properties', propertyData);
    return response.data;
  },

  async updateProperty(id, propertyData) {
    const response = await apiClient.put(`/properties/${id}`, propertyData);
    return response.data;
  },

  async deleteProperty(id) {
    const response = await apiClient.delete(`/properties/${id}`);
    return response.data;
  },
};
```

---

## 5. Test-Driven Development (TDD) with Vitest

Every API endpoint must be accompanied by unit and integration tests verifying:
1. Valid inputs return expected data and HTTP status.
2. Missing or invalid parameters return `400 Bad Request`.
3. Protected endpoints reject requests without a Bearer token with `401 Unauthorized`.
4. Domain services gracefully handle database exceptions.
