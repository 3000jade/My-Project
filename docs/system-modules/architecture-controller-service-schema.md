# Architecture Note: Controller, Service, and Schema Pattern

> **Directory**: `docs/system-modules/`  
> **Topic**: The 3-Tier Backend Architecture (Controller, Service, Schema) in CP_kerby  

---

### 1. High-Level Summary

In the CP_kerby backend, every API feature is cleanly divided into three distinct responsibilities:

```text
HTTP Request
     │
     ▼
┌──────────────┐
│    SCHEMA    │  1. Gatekeeper: Validates data structure & types (Zod / SQL)
└──────┬───────┘
       │ Valid data
       ▼
┌──────────────┐
│  CONTROLLER  │  2. Receptionist: Handles HTTP status codes, headers & responses
└──────┬───────┘
       │ Calls logic
       ▼
┌──────────────┐
│   SERVICE    │  3. Engine / Worker: Executes core business logic, DB, & AI/APIs
└──────────────┘
```

---

### 2. The Three Layers Explained

#### 🛡️ 1. SCHEMA (The Gatekeeper)
* **What it is**: The contract and validator for incoming and outgoing data.
* **Technology**: Written with **Zod** in `backend/src/schemas/` and SQL constraints in `backend/src/models/`.
* **Primary Role**:
  - Checks if the user sent required fields (e.g., `messages` is an array; `email` is valid).
  - Rejects malformed requests **before** any heavy processing or database queries occur.
  - Automatically infers TypeScript types for type safety.
* **Analogy**: The security guard checking tickets at the gate. If your ticket is invalid, you cannot enter.

---

#### 🎮 2. CONTROLLER (The Receptionist)
* **What it is**: The entry point for HTTP requests in `backend/src/controllers/` (e.g., [chat.controller.ts](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/backend/src/controllers/chat.controller.ts)).
* **Primary Role**:
  - Receives Express `req` (Request) and `res` (Response).
  - Extracts parameters from `req.body`, `req.query`, or `req.params`.
  - Invokes the corresponding **Service** method.
  - Returns standard JSON responses with appropriate HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `500 Server Error`).
* **Rule**: Controllers should be **thin** — they do not perform raw calculations, complex database queries, or third-party AI calls.
* **Analogy**: The receptionist at a hotel front desk. They take your request, hand it to the concierge or chef, and return the final answer to you.

---

#### ⚙️ 3. SERVICE (The Engine & Worker)
* **What it is**: The core business logic layer in `backend/src/services/` (e.g., [chat.service.ts](file:///c:/Users/Win11x64/Desktop/My%20code%20space/CP_kerby/backend/src/services/chat.service.ts)).
* **Primary Role**:
  - Contains domain rules, calculations, and external API integrations (Groq/xAI, Google Drive, Nominatim).
  - Communicates with Supabase / PostgreSQL.
  - Independent of Express HTTP (`req`/`res`) — services can be reused by background scripts, CLI tools, or automated cron jobs without modification.
* **Analogy**: The chef or engineering engine behind closed doors doing the actual heavy lifting.

---

### 3. Concrete Example: Chat Concierge Module

Here is how the three layers work together in the **AI Chat Concierge**:

| Layer | File | Exact Responsibility in Chat |
| :--- | :--- | :--- |
| **Schema** | Validation / DTO | Ensures `req.body.messages` exists, is an array, and contains objects with `role` and `content`. |
| **Controller** | `chat.controller.ts` | Checks `!messages || !Array.isArray(messages)`. If invalid, sends `400 Bad Request`. If valid, awaits `chatService` and returns `{ success: true, data: { message } }`. |
| **Service** | `chat.service.ts` | Prepends the CP_kerby luxury concierge system prompt, inspects API keys (`GROQ_API_KEY` / `XAI_API_KEY`), executes `fetch` against the AI endpoint, and extracts the AI response text. |

---

### 4. Why Use This Separation?

1. **Maintainability**: If we switch our AI provider from Groq to Anthropic or OpenAI, we **only modify `chat.service.ts`**. The controller and schemas remain untouched.
2. **Testability**: Services can be unit tested without having to mock Express `Request` and `Response` objects.
3. **Reusability**: Different controllers or internal jobs can call the same service methods.
