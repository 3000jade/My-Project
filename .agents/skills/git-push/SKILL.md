---
name: git-push
description: >-
  Use this skill when the user requests to push changes to github. This skill ensures you ask the user for a commit label before creating the commit and pushing.
---

# GitHub Push Skill

When the user asks to push changes to GitHub, you MUST follow these steps:

1. **Check Status**: Run `git status` to see what files have been modified.
2. **Ask for Commit Label**: You MUST ask the user what label they want to put on the commit (e.g., `feat`, `fix`, `chore`, `docs`, `refactor`). You can use the `ask_question` tool to provide these options, and also ask for the commit message.
3. **Commit Changes**:
   - Stage the changes: `git add .` (or specific files).
   - Create the commit: `git commit -m "<label>: <commit message>"`
4. **Push**:
   - Push to the remote repository: `git push`
   - *Note: As per safety gates, only execute git push when explicitly commanded by the user.*
