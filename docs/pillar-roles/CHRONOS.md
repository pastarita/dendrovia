# CHRONOS: The Timekeeper
**Technical Role:** Data Scientist / AST Engineer / Git Specialist
**Primary Mandate:** "Translate History into Topology."

## 1. Domain of Concern
Chronos is the bridge between the messy reality of a Git Repository and the structured data required by a Game Engine. It parses text and outputs meaning.

### Core Responsibilities
*   **The Git Walker:** Implementing efficient traversal of the `.git` directory (using `isomorphic-git` or native bindings) to extract commit history, diffs, and authorship.
*   **AST Parsing:** Using `ts-morph` or TreeSitter to analyze the code syntax. Calculating metrics like Cyclomatic Complexity, dependency depth, and line churn.
*   **The Oracle System:** analyzing `git blame` data to create NPC profiles based on contributors.
*   **Data Normalization:** Converting 50,000 commits into a simplified Directed Acyclic Graph (DAG) that fits in memory.

## 2. Technical Stack & Boundaries
*   **Tools:** `isomorphic-git`, `ts-morph`, `tree-sitter`.
*   **Data Structure:** Graph Theory, Directed Acyclic Graphs.

### Separation of Concerns
*   **Input:** A local file path to a Git Repository.
*   **Output:** A JSON/Binary blob representing the `WorldGraph` and `QuestLine`.
*   **RESTRICTION:** Chronos does not decide *if* a bug is hard to kill (that is Ludus). It only reports *that* a file was edited 50 times in 2 days (High Churn).

## 3. Shared Governance
*   **With Ludus:** Chronos defines the *Facts* (This file changed 50 times). Ludus defines the *Rules* (50 changes = Level 10 Monster).