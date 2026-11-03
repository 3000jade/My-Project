# Graphify Installation & Quickstart Guide

> **Repository:** [`Graphify-Labs/graphify`](https://github.com/Graphify-Labs/graphify)  
> **PyPI Package Name:** `graphifyy` *(two 'y's on PyPI; binary command is `graphify`)*  
> **Type:** Local Codebase Knowledge Graph Generator & AI Assistant Memory Engine

---

## 1. What is Graphify?

**Graphify** turns codebases and documentation into queryable, local knowledge graphs. It analyzes relationships across classes, functions, files, dependencies, and architecture patterns, generating:
- `graph.json` — Raw structured knowledge graph
- `GRAPH_REPORT.md` — High-level architecture and component mapping for AI assistants
- `graph.html` — Interactive visual graph explorer for your browser

Graphify processes all code **locally** without sending your source files to any third-party servers.

---

## 2. Prerequisites
- **Python:** 3.10+
- **Tooling:** `uv` (recommended) or standard `pip` / `pipx`

---

## 3. Installation

> [!NOTE]
> Due to a naming conflict on PyPI, the official package is published as **`graphifyy`** (with two `y`s), but the CLI command you run is **`graphify`**.

### Method A: Via `uv` (Recommended)
```bash
uv tool install graphifyy
```

*To install with all optional document and multimedia parsers (PDF, audio, markdown, etc.):*
```bash
uv tool install "graphifyy[all]"
```

### Method B: Via `pip`
```bash
pip install graphifyy
```

*Or with all extras:*
```bash
pip install "graphifyy[all]"
```

---

## 4. Registering with AI Coding Assistants

Graphify integrates natively with coding tools and agents by installing its custom skill or prompt rule:

| Platform / Assistant | Registration Command |
| :--- | :--- |
| **Claude Code** | `graphify install` |
| **Cursor** | `graphify cursor install` |
| **VS Code (GitHub Copilot)** | `graphify vscode install` |
| **Gemini CLI** | `graphify install --platform gemini` |
| **Codex CLI** | `graphify install --platform codex` |

---

## 5. Building the Knowledge Graph

1. **Navigate to your project root:**
   ```bash
   cd /path/to/your/project
   ```

2. **Generate the graph:**
   - In terminal:
     ```bash
     graphify .
     ```
   - In Claude Code / Cursor / Gemini Chat:
     ```text
     /graphify .
     ```

3. **Output Files Created in `graphify-out/`:**
   - `graphify-out/GRAPH_REPORT.md` — Architecture breakdown that agents automatically read for instant architectural context.
   - `graphify-out/graph.json` — Structured node and edge database.
   - `graphify-out/graph.html` — Open in your browser to view the interactive 3D/2D dependency visualizer.

---

## 6. Keeping the Graph in Sync

To keep the knowledge graph updated automatically whenever you commit code:
```bash
# Install git pre-commit hook
graphify hook install
```

Or manually update changed files incrementally:
```bash
graphify . --update
```
