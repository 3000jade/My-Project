---
name: be-ambitious
description: Elevates a task or prompt across Altitude (the goal beyond the goal), Depth (expert instruments and raw data), and Range (cross-disciplinary methods). Generates a 3-rung ladder, answers depth heuristics, and rewrites the prompt with an outside verification judge and an explicit approval gate before execution. Use when the user types /be-ambitious, says "be more ambitious", "aim higher", "go deeper on this", "what's the goal beyond the goal", "what would a top expert do here", or asks to elevate a prompt.
license: MIT
metadata:
  author: Felix Rieseberg / adapted by RoboNuggets
  hardened: true
---

# Be Ambitious

This skill operationalizes Felix Rieseberg's framework (*"How to be more ambitious: a tutorial for humans with models"*). It raises the ambition of tasks and prompts across three axes: **Altitude**, **Depth**, and **Range**, backed by an outside verification judge and a strict approval gate.

---

## Core Rules

1. **Better, not bigger.** Each type raises the standard, the outcome, or the perspective—not the volume of unrequested features or side quests. If a suggestion expands scope without making the core result better, reject it.
2. **Do what the expert does, not how they talk.** Use the actual methods, tools, and instruments of the relevant domain. Changing vocabulary without changing tools is mere role-play.
3. **An outside judge decides if it worked.** Never grade your own work. The result must be proven by an objective check: a passing test suite, benchmark numbers, a reproducible trace, or compiler verification.
4. **Treat the hard target as reasonable.** Assume ambitious goals are solvable. A missed hard target reported honestly with real metrics is a success; a faked or watered-down target is a failure.
5. **Get the access, don't invent data.** Ambition requires real data and real tools. If required data, access, or tooling is missing, identify the gap explicitly rather than hallucinating inputs.
6. **Approval Gate before Rungs > 1.** Ambition raises the standard, not autonomous authority. The agent must halt and obtain user approval before executing infrastructure, multi-file refactoring, or systemic changes.

---

## Input Evaluation

Identify the user's intent:
- **A prompt to improve** (rewrite request or prompt for another agent/tool): Output the plan and the rewritten prompt, then **stop**.
- **A task to do** (fix, build, analyze): Output the plan, the rewritten prompt, and ask the user which rung to execute. If the task is simple and clear, the agent may execute **Rung 1** immediately with tests, but must pause at the **Approval Gate** before proceeding to **Rungs 2 or 3**.

---

## The Three Types of Ambition

### 1. Altitude: Aim at the Outcome
Identify the *goal beyond the goal*—what the user or organization ultimately wants to achieve. Construct a 3-rung ladder:
- **Rung 1 (Direct Task)**: Solve the immediate request with rigor, clean tests, and zero unnecessary bloat.
- **Rung 2 (Systemic Cause)**: Address the underlying pattern, class of issues, or workflow friction that caused the task.
- **Rung 3 (Durable Transformation)**: Eliminate the need for the human ritual entirely (e.g. automated regression gates, self-healing pipelines, performance budgets).

*Ceiling Guard*: If a rung lacks an objective outside judge or requires organizational authority beyond the codebase, step down one rung.

### 2. Depth: Work Like the Field's Best
Dig beneath digested summaries to the underlying raw material and specialized instruments.

Answer these 4 questions directly:
1. **Expert Action**: What would a top-tier domain specialist do here that was not explicitly requested?
2. **Raw Material**: What raw, un-summarized data should be inspected instead of pre-chewed summaries (e.g. raw logs, profiler traces, database schemas)?
3. **Instruments & Methods**: What specific specialized tools, statistical models, or diagnostic frameworks should be applied?
4. **Outside Verification**: What deterministic external check proves the result is correct?

### 3. Range: Cross-Disciplinary Perspectives
Examine the problem through different professional lenses:
- **Nouns to Verbs**: Convert static deliverables into active verbs (e.g. turning "a status report" into "communicating risk and enabling high-stakes decisions under uncertainty").
- **The Crew**: Identify 2–3 distinct disciplines that offer non-obvious leverage (e.g. security auditor, performance engineer, data journalist, UX psychologist).
- **Subagent Coordination**: If dispatching subagents for cross-disciplinary research:
  - Subagents must be designated as **Read-Only Researchers**.
  - Subagents report findings back to the primary agent; they do not write to or edit the workspace directly.
  - The primary coordinator synthesizes findings before any code changes occur.

---

## Output Structure

Format the response in this exact order:

1. **Goal Beyond the Goal**: One clear sentence stating the ultimate outcome.
2. **Types Selected**: State which of Altitude, Depth, or Range apply and why (skip unneeded types).
3. **The Ambitious Plan**:
   - *Altitude*: The 3-rung ladder with required setup.
   - *Depth*: Answers to the 4 expert questions and the specific hard target.
   - *Range*: Cross-disciplinary verbs, selected crew roles, and their specific methods.
4. **Prerequisites & Tooling**: Required data, tools, or MCP servers (marked as available or missing).
5. **Rewritten Prompt**: A standalone markdown code block containing the elevated prompt, written in the user's voice, ending with the outside judge and criteria for a pass.
6. **Approval Gate / Next Step**:
   - For a prompt rewrite: Stop here.
   - For a task: Explicitly ask the user: *"Would you like to execute Rung 1 now, or should we align on Rung 2/3 first?"* (Never autonomously execute Rung 2 or 3 without user confirmation).
