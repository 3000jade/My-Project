# OmniRoute Installation & Quickstart Guide

> **Repository:** [`cheaper-inference/OmniRoute`](https://github.com/cheaper-inference/OmniRoute)  
> **Type:** Open-Source Unified AI Gateway & Quota-Aware Router  
> **Default Port:** `20128` (Dashboard: `http://localhost:20128` | Endpoint: `http://localhost:20128/v1`)

---

## 1. What is OmniRoute?

**OmniRoute** is an open-source AI proxy and router that sits between your developer tools (Antigravity, Cursor, Claude Code, Cline, Copilot) and AI providers (Anthropic, OpenAI, Groq, xAI, Google, DeepSeek, Ollama, etc.).

### Core Capabilities:
- **Unified Endpoint:** Provides a standard OpenAI-compatible API (`http://localhost:20128/v1`).
- **Quota-Aware Auto-Fallback:** If your primary provider hits a rate limit or runs out of credits, OmniRoute cascades automatically to secondary accounts or free tiers.
- **Token Compression:** Built-in prompt compression algorithms (RTK, Caveman) reduce token consumption and costs.
- **Provider Aggregator:** Supports dozens of cloud providers, self-hosted LLMs, and free-tier pools.

---

## 2. Installation Methods

### Method A: One-Shot Execution via `npx` (No Install Required)
If you have Node.js 18+ installed and want to run it immediately without global packages:
```bash
npx omniroute@latest
```

---

### Method B: Global Installation via `npm` (Recommended for Local Dev)
Install the CLI globally on your system:
```bash
npm install -g omniroute
```

Start the OmniRoute gateway:
```bash
omniroute
```

*(For headless servers, CI/CD, or automated background runs, use:)*
```bash
omniroute setup --non-interactive
```

---

### Method C: Docker Deployment (Containerized)
Run with volume persistence for settings and provider keys:
```bash
docker run -d \
  --name omniroute-gateway \
  -p 127.0.0.1:20128:20128 \
  -v ~/.omniroute:/root/.omniroute \
  --restart unless-stopped \
  diegosouzapw/omniroute:latest
```

---

## 3. Configuration & Initial Setup

1. **Open the Web Dashboard:**
   Visit [`http://localhost:20128`](http://localhost:20128) in your browser.
2. **First Login / Security:**
   On initial startup, check the console output for the generated admin credentials or set `INITIAL_PASSWORD` in your environment.
3. **Connect Providers:**
   Go to **Providers** in the dashboard:
   - Add your API keys (e.g. Groq, Anthropic, OpenAI, xAI, DeepSeek, Google Gemini).
   - Configure fallback priorities (Primary -> Secondary -> Free-Tier Fallback).

---

## 4. Connecting Your Coding Assistants / IDEs

OmniRoute exposes an OpenAI-compatible endpoint. Point your IDE extension or CLI to:

| Setting | Value |
| :--- | :--- |
| **API Base URL** | `http://localhost:20128/v1` |
| **API Key** | Your OmniRoute Gateway Master Key (configured in Dashboard) |
| **Model Name** | Set to `auto` (to use automatic quota-aware routing) or any specific model alias (e.g. `claude-3-5-sonnet`, `deepseek-chat`, `gpt-4o`) |

---

## 5. Typical Windows PowerShell Workflow

```powershell
# 1. Install globally
npm install -g omniroute

# 2. Start the gateway
omniroute

# 3. Open dashboard in default browser
Start-Process "http://localhost:20128"
```
