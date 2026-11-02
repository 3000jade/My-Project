# Ponytail Manual & Operator Guide

> **Core Philosophy:** *"The best code is the code you never wrote."*  
> Ponytail trains AI coding assistants to think and act like the **laziest senior developer in the room**—delivering the smallest complete change that solves the problem while aggressively eliminating over-engineering, code bloat, unnecessary packages, and speculative abstractions.

---

## 1. Overview & Core Decision Ladder

Before writing any code, Ponytail evaluates tasks against a strict decision ladder:

1. **Does it need to exist?**
   Skip unrequested features, speculative options, and premature flexibility. If a request is vague, build the minimal version that fulfills the core requirement.
2. **Is it already in the codebase?**
   Reuse existing components, utility functions, services, and patterns. Follow surrounding conventions.
3. **Can the standard library or platform do it?**
   Prefer native runtime/standard library features over pulling in new helper packages (e.g. native `fetch`, standard `Array` methods, built-in Crypto).
4. **Does an installed dependency already handle it?**
   Never add a new npm/pip package for functionality that takes a few lines or that an existing dependency already covers.
5. **Can it be written in a single clear line?**
   If a single readable line solves the problem without convoluted logic, keep it as one line.
6. **Otherwise:**
   Write the absolute minimum code required to fulfill the requirements.

### Non-Negotiable Boundaries (What Ponytail Never Cuts)
Ponytail is lazy about unnecessary complexity, **never** about safety or correctness:
* **Validation at trust boundaries** (user input, external APIs).
* **Error handling** that prevents crashes or data loss.
* **Security & access controls** (auth checks, secrets management, injection protection).
* **Accessibility** standards.
* **Callers and tests broken by a change** (always grep and update callers).

---

## 2. Intensity Modes

| Mode | Behavior |
| :--- | :--- |
| **`lite`** | Builds what was requested, but explicitly names the simpler/smaller alternative in one line and prompts the user to choose. |
| **`full`** *(Default)* | Strictly enforces the minimal decision ladder. Discards unrequested abstractions and chooses the shortest robust implementation. |
| **`ultra`** | Actively challenges the task: before building, pushes back on any part of the request not justified by the core need. |
| **`off`** | Suspends Ponytail rules and restores default assistant behavior. |

**Mode Switching:**
You can switch modes in any prompt by asking:
* `/ponytail lite`
* `/ponytail full`
* `/ponytail ultra`
* `/ponytail off`

---

## 3. Installed Skills & Commands

All 6 official Ponytail skills are installed in `.agents/skills/`:

### 1. `ponytail` (Main Skill)
* **Path:** `.agents/skills/ponytail/SKILL.md`
* **Trigger:** Active automatically or via `"ponytail"`, `"be lazy"`, `"simplest solution"`, `"yagni"`.
* **Action:** Guides code generation to produce the shortest working diff and attaches an accountability summary.

### 2. `ponytail-review`
* **Path:** `.agents/skills/ponytail-review/SKILL.md`
* **Trigger:** `/ponytail-review`, `"review this"`, `"is this over-engineered"`.
* **Action:** Deep review of uncommitted changes, staged diffs, or PRs. Evaluates:
  * Bugs and edge-case errors.
  * Security and data-loss risks.
  * Scale and concurrency issues (races, N+1 queries).
  * Missing tests on critical branches.
  * Opportunities to delete speculative code or reuse existing helpers.

### 3. `ponytail-audit`
* **Path:** `.agents/skills/ponytail-audit/SKILL.md`
* **Trigger:** `/ponytail-audit`, `"audit this codebase"`, `"find bloat"`, `"what can I delete"`.
* **Action:** Scans the whole repo or specified directory to surface dead code, redundant packages, architecture rot, and risky paths.

### 4. `ponytail-debt`
* **Path:** `.agents/skills/ponytail-debt/SKILL.md`
* **Trigger:** `/ponytail-debt`, `"list the shortcuts"`, `"what did ponytail defer"`.
* **Action:** Scans repository for `shortcut:` and `ponytail:` comments and produces a clean debt ledger.

### 5. `ponytail-gain`
* **Path:** `.agents/skills/ponytail-gain/SKILL.md`
* **Trigger:** `/ponytail-gain`, `"ponytail impact"`, `"what does ponytail save"`.
* **Action:** Displays the benchmark scoreboard comparing code reduction, token savings, and speed improvements.

### 6. `ponytail-help`
* **Path:** `.agents/skills/ponytail-help/SKILL.md`
* **Trigger:** `/ponytail-help`.
* **Action:** Quick command reference and cheatsheet.

---

## 4. How to "Tail" Ponytail (Observing & Tracking Behavior)

"Tailing" Ponytail refers to actively tracking its decisions, observing deferred shortcuts, and monitoring code impact:

### A. Tailing the Response "Accountability Footer"
Every substantive code response generated under Ponytail ends with a mandatory 1-2 line accountability note:
* **What was skipped or omitted** (e.g., extra configuration options not asked for).
* **What was not checked** (e.g., edge-case load testing outside stated scope).
* **Residual risks** that the user or QA should verify.

### B. Tailing Shortcut Debt (`/ponytail-debt`)
When Ponytail implements a pragmatic shortcut, it requires leaving a standard inline marker:
```typescript
// shortcut: in-memory token cache, upgrade to Redis when clustering multiple pods
```
To "tail" accumulated debt across the repository at any time, run:
```text
/ponytail-debt
```
The agent scans all files and returns a structured table:
```text
<file>:<line> | What was simplified | Ceiling limit | Trigger to upgrade
```
Items lacking an explicit upgrade trigger are flagged with `no-trigger` to prevent silent rot.

### C. Tailing Impact & Code Reductions (`/ponytail-gain`)
Run `/ponytail-gain` to inspect measured benchmark impacts:
* **Lines of code:** ~53% reduction.
* **Output tokens:** ~45% reduction.
* **Generation cost:** ~26% savings.
* **Execution time:** ~41% faster turns.

---

## 5. Configuration & Environment Variables

To configure Ponytail globally on Windows:

* **Config File:** `%APPDATA%\ponytail\config.json`
  ```json
  {
    "defaultMode": "full"
  }
  ```
* **Environment Variables:**
  * `PONYTAIL_DEFAULT_MODE`: Set default session level (`lite`, `full`, `ultra`, `off`).
  * `PONYTAIL_SUBAGENT_MATCHER`: Regex to control which subagents receive Ponytail rules (e.g. `^general$` or `explore|general`).
