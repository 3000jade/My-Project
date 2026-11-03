# Agent Skills Installation & Ecosystem Guide

> **Specification:** [Open Agent Skills Standard (`agentskills/agentskills`)](https://github.com/agentskills/agentskills)  
> **Documentation:** [agentskills.io](https://agentskills.io)  
> **Format:** Folders containing standard markdown `SKILL.md` with YAML frontmatter

---

## 1. What are Agent Skills?

**Agent Skills** are portable capability packages for AI coding assistants (Antigravity, Claude Code, Cursor, Copilot CLI, Codex, Gemini CLI).

A skill teaches an agent:
- When to activate (via YAML description triggers)
- Best practices, architectural invariants, and domain rules
- Optional helper scripts, reference documentation, and execution templates

### Directory Hierarchy:
```text
.agents/skills/<skill-name>/
├── SKILL.md          # Primary instruction file with YAML metadata (Required)
├── scripts/          # Helper CLI scripts or automation utilities (Optional)
├── references/       # In-depth architectural references & docs (Optional)
└── examples/         # Canonical usage examples (Optional)
```

---

## 2. Installation Methods

### Method A: Using GitHub CLI (`gh skill`)
If you have GitHub CLI (`gh`) v2.90.0+ installed:

```bash
# 1. Search and install interactively from a repository:
gh skill install owner/repo

# 2. Install a specific named skill:
gh skill install owner/repo skill-name

# 3. Specify target scope (project-level vs global user):
# Project scope (.agents/skills/ in current repo):
gh skill install owner/repo skill-name --scope project

# User global scope (~/.agents/skills/ for all projects):
gh skill install owner/repo skill-name --scope user
```

---

### Method B: Using the Open Skills CLI (`npx skills`)
You can use the open-source cross-agent skills manager via `npx` (or `npm install -g agent-skills-cli`):

```bash
# Install a skill from a GitHub repo:
npx skills add <github-user>/<repo-name>

# Install a skill to all detected AI agents on your machine:
npx skills add <source> --all

# Search the skills registry:
npx skills search <keyword>
```

---

### Method C: Manual Installation (Git Clone or Direct Download)
Because Agent Skills are pure filesystem directories with a `SKILL.md`, you can install any skill directly using Git:

#### 1. In Your Current Project (Project Scope)
```powershell
# Navigate to your project's .agents/skills directory:
cd "C:\Users\Win11x64\Desktop\My code space\CP_kerby\.agents\skills"

# Clone or copy the skill directory:
git clone https://github.com/<owner>/<skill-repo>.git <skill-name>
```

#### 2. Globally on Your Machine (User Scope)
```powershell
# For Windows:
mkdir -p "$HOME\.agents\skills"
cd "$HOME\.agents\skills"
git clone https://github.com/<owner>/<skill-repo>.git <skill-name>
```

---

## 3. Creating Your Own Agent Skill

Create a folder in `.agents/skills/<your-skill-name>` and add `SKILL.md`:

```markdown
---
name: my-skill
description: Use when [specific task, framework, or trigger conditions occur]
---

# My Skill Instructions

## When to Use
- Trigger 1
- Trigger 2

## Step-by-Step Guidance
1. Inspect ...
2. Verify ...
```
Once saved, any compatible AI assistant will discover and activate the skill when relevant.
