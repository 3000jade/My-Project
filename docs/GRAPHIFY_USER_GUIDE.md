# Graphify Complete User Guide for Antigravity & AI Assistants

> **Package:** `graphifyy` (v0.9.101)  
> **Binary:** `graphify` (`C:\Users\Win11x64\.local\bin\graphify.exe`)  
> **Integration Status:** Native Antigravity Skill, Rule, and Workflow Installed  

---

## 1. What is Graphify?

**Graphify** analyzes your codebase AST (Abstract Syntax Tree), dependencies, services, models, and routes locally without sending source code to any cloud servers. It constructs a **queryable knowledge graph** that:

1. **Powers AI Agents:** Allows Antigravity, Claude Code, and Cursor to understand deep cross-file dependencies and architecture in seconds.
2. **Visualizes Architecture:** Generates an interactive 2D/3D visual web graph (`graph.html`) you can open in any browser.
3. **Produces Architecture Summaries:** Creates `GRAPH_REPORT.md` summarizing high-level architectural clusters and component boundaries.

---

## 2. Installed Components & Paths

| Component | Path / Location | Purpose |
| :--- | :--- | :--- |
| **CLI Binary** | `C:\Users\Win11x64\.local\bin\graphify.exe` | Main analysis engine |
| **Antigravity Rule** | `.agents/rules/graphify.md` | Tells Antigravity to consult the knowledge graph before answering questions |
| **Antigravity Workflow** | `.agents/workflows/graphify.md` | Adds the `/graphify` workflow command |
| **Global Agent Skill** | `~/.gemini/config/skills/graphify/SKILL.md` | Skill definition and execution instructions |
| **User PATH** | `C:\Users\Win11x64\.local\bin` | Added to user environment for direct `graphify` command access |

---

## 3. How to Build Your First Codebase Graph

Run the following command from your project root:

```powershell
graphify .
```

*Or within an Antigravity chat turn:*
```text
/graphify .
```

### What Happens During Generation:
1. Tree-sitter parsers scan all TypeScript, JavaScript, SQL, Python, and JSON files.
2. Extracts imports, exports, class definitions, function calls, and data relationships.
3. Performs community clustering to group related modules (e.g., Auth, Properties, Invitations, Gmail, Database).
4. Generates output in the `graphify-out/` directory.

---

## 4. Generated Artifacts (`graphify-out/`)

After running `graphify .`, three key files are created in your project:

```
graphify-out/
├── graph.html          # Interactive visual graph (open in your browser)
├── GRAPH_REPORT.md     # Architectural report for AI agents & documentation
└── graph.json          # Machine-readable graph database (nodes & edges)
```

### 1. `graph.html` (Interactive Browser Explorer)
Open this file directly in Chrome or Edge:
```powershell
Start-Process graphify-out/graph.html
```
- Click on nodes (files, functions, classes) to highlight connected callers and dependencies.
- Use the search bar to find any service, controller, or route.
- Filter by community (Backend, Frontend, Services, Tests).

### 2. `GRAPH_REPORT.md` (Agent Architecture Blueprint)
Antigravity automatically reads this document whenever you ask architectural questions like:
- *"Where is the invitation token validated?"*
- *"What depends on `gmail.service.ts`?"*
- *"Show all components connected to the Broker Dashboard."*

### 3. `graph.json`
The raw graph containing nodes, edges, weights, and community clusters.

---

## 5. Querying the Graph via Terminal

You can query relationships directly without opening any files:

### Find the Shortest Path Between Two Files or Components
```powershell
graphify path "BrokerAgents.jsx" "invitation.service.ts"
```

### Explain a Node and Its Neighbors
```powershell
graphify explain "GmailService"
```

### Query Questions in Plain English
```powershell
graphify query "How are agent invitations sent and tracked?"
```

---

## 6. Keeping the Graph in Sync

### Incremental Updates (Fast, No Full Rebuild)
Whenever you add or modify files, update the graph in seconds:
```powershell
graphify update .
```

### Automatic Git Pre-Commit Hook
Install automatic tracking so every git commit keeps the graph updated:
```powershell
graphify hook install
```
*(To remove: `graphify hook uninstall`)*

### Live Watch Mode
Watch your project folder and automatically refresh the graph on file save:
```powershell
graphify watch .
```

---

## 7. Optional: Enabling the Antigravity MCP Server

To let Antigravity query the graph using native MCP tool calls, add the following entry to your `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "graphify": {
      "command": "python",
      "args": [
        "-m", "uv", "run", "--with", "graphifyy", "--with", "mcp",
        "-m", "graphify.serve",
        "${workspace.path}/graphify-out/graph.json"
      ]
    }
  }
}
```

---

## 8. Summary of Quick Commands

```powershell
graphify .                # Generate complete codebase graph
graphify update .         # Incremental update after code edits
graphify explain "<Name>" # Explain a component and its connections
graphify path "A" "B"     # Trace dependency path between two components
graphify hook install     # Keep graph in sync on git commit
```
