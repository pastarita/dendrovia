#!/usr/bin/env python3
"""
Decision Logger — Castle Walls Permission Engine
Dendrovia Monorepo

Hook type: PostToolUse
Timeout: 5 seconds
Dependencies: None (pure Python 3)

Logs all tool invocations to decisions.jsonl for audit trail.
This hook is observation-only — it never blocks or modifies behavior.
"""

import json
import os
import sys
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(SCRIPT_DIR, "logs")
DECISIONS_LOG = os.path.join(LOGS_DIR, "decisions.jsonl")


def main():
    """Log tool invocation to audit trail."""
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({}))
            return

        hook_input = json.loads(raw_input)
        tool_name = hook_input.get("tool_name", "unknown")
        tool_input = hook_input.get("tool_input", {})
        tool_output = hook_input.get("tool_output", "")

        # Summarize input
        if tool_name == "Bash":
            summary = tool_input.get("command", "")[:200]
        elif tool_name in ("Edit", "Write"):
            summary = f"file: {tool_input.get('file_path', 'unknown')}"
        elif tool_name == "Read":
            summary = f"read: {tool_input.get('file_path', 'unknown')}"
        else:
            summary = json.dumps(tool_input)[:200]

        # Summarize output
        output_summary = ""
        if isinstance(tool_output, str):
            output_summary = tool_output[:200]
        elif isinstance(tool_output, dict):
            output_summary = json.dumps(tool_output)[:200]

        # Read active mode
        mode = "default"
        mode_file = os.path.join(SCRIPT_DIR, "..", "policies", ".active-mode")
        try:
            with open(mode_file, "r") as f:
                mode = f.read().strip()
        except Exception:
            pass

        # Write audit entry
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tier": "post",
            "tool_name": tool_name,
            "tool_input_summary": summary,
            "tool_output_summary": output_summary,
            "mode": mode,
            "session_id": hook_input.get("session_id", "")
        }

        os.makedirs(LOGS_DIR, exist_ok=True)
        with open(DECISIONS_LOG, "a") as f:
            f.write(json.dumps(entry) + "\n")

    except Exception:
        # Never fail — this is observation only
        pass

    # Always passthrough
    print(json.dumps({}))


if __name__ == "__main__":
    main()
