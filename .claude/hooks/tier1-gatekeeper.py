#!/usr/bin/env python3
"""
Tier 1: Deterministic Gatekeeper — Castle Walls Permission Engine
Dendrovia Monorepo

Hook type: PreToolUse
Timeout: 5 seconds
Dependencies: None (pure Python 3)

Reads active policy mode, matches tool input against blocked/grants patterns.
Deny takes priority over allow. On any error, passthrough (never block on failure).
"""

import json
import os
import re
import sys
import traceback

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
POLICIES_DIR = os.path.join(SCRIPT_DIR, "..", "policies")
LOGS_DIR = os.path.join(SCRIPT_DIR, "logs")
ERROR_LOG = os.path.join(LOGS_DIR, "tier1-errors.log")


def log_error(msg: str) -> None:
    """Append error to tier1-errors.log."""
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
        with open(ERROR_LOG, "a") as f:
            from datetime import datetime, timezone
            ts = datetime.now(timezone.utc).isoformat()
            f.write(f"[{ts}] {msg}\n")
    except Exception:
        pass


def parse_yaml_minimal(filepath: str) -> dict:
    """
    Minimal YAML parser for policy files. Falls back to line-by-line
    parsing if pyyaml is not installed. Handles the subset of YAML
    used in policy mode files (string keys, string values, lists).
    """
    try:
        import yaml
        with open(filepath, "r") as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        pass

    # Minimal parser for our policy YAML subset
    result = {}
    current_section = None
    current_subsection = None
    current_list = None

    try:
        with open(filepath, "r") as f:
            for line in f:
                stripped = line.rstrip()

                # Skip comments and empty lines
                if not stripped or stripped.startswith("#"):
                    continue

                # Top-level key (no indent)
                if not line.startswith(" ") and not line.startswith("\t"):
                    if ":" in stripped:
                        key, _, value = stripped.partition(":")
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if value:
                            result[key] = value
                        else:
                            result[key] = []
                            current_section = key
                            current_subsection = None
                            current_list = result[key]
                    continue

                indent = len(line) - len(line.lstrip())

                # List item
                if stripped.startswith("- "):
                    item_content = stripped[2:].strip()
                    if ":" in item_content and not item_content.startswith('"'):
                        # Start of a dict in a list
                        k, _, v = item_content.partition(":")
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        new_item = {k: v}
                        if isinstance(current_list, list):
                            current_list.append(new_item)
                    else:
                        val = item_content.strip('"').strip("'")
                        if isinstance(current_list, list):
                            current_list.append(val)
                    continue

                # Sub-key
                if ":" in stripped:
                    key, _, value = stripped.partition(":")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")

                    if indent == 2 and current_section:
                        if isinstance(result.get(current_section), list):
                            # This is a key in the last dict item of the list
                            if result[current_section] and isinstance(result[current_section][-1], dict):
                                result[current_section][-1][key] = value
                        elif isinstance(result.get(current_section), dict):
                            if value:
                                result[current_section][key] = value
                            else:
                                result[current_section][key] = []
                                current_subsection = key
                                current_list = result[current_section][key]
                        else:
                            result[current_section] = {}
                            if value:
                                result[current_section][key] = value
                            else:
                                result[current_section][key] = []
                                current_subsection = key
                                current_list = result[current_section][key]
                    elif indent == 4 and current_section and current_subsection:
                        parent = result.get(current_section, {})
                        if isinstance(parent, dict) and current_subsection in parent:
                            lst = parent[current_subsection]
                            if isinstance(lst, list) and lst and isinstance(lst[-1], dict):
                                lst[-1][key] = value
                    continue

    except Exception as e:
        log_error(f"YAML parse error in {filepath}: {e}")
        return {}

    return result


def get_active_mode() -> str:
    """Read active policy mode from .claude/policies/.active-mode."""
    mode_file = os.path.join(POLICIES_DIR, ".active-mode")
    try:
        with open(mode_file, "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "default"
    except Exception as e:
        log_error(f"Error reading active mode: {e}")
        return "default"


def load_policy(mode: str) -> dict:
    """Load policy YAML for the given mode."""
    policy_file = os.path.join(POLICIES_DIR, "modes", f"{mode}.yaml")
    if not os.path.exists(policy_file):
        log_error(f"Policy file not found: {policy_file}")
        return {}
    return parse_yaml_minimal(policy_file)


def extract_command(tool_name: str, tool_input: dict) -> str:
    """Extract the effective command string from tool input."""
    if tool_name == "Bash":
        return tool_input.get("command", "")
    elif tool_name in ("Edit", "Write"):
        return tool_input.get("file_path", "")
    elif tool_name == "Read":
        return tool_input.get("file_path", "")
    elif tool_name == "NotebookEdit":
        return tool_input.get("notebook_path", "")
    return json.dumps(tool_input)[:200]


def check_blocked(command: str, policy: dict) -> tuple:
    """Check if command matches any blocked pattern. Returns (blocked, reason)."""
    blocked_rules = policy.get("blocked", [])
    if not isinstance(blocked_rules, list):
        return False, ""

    for rule in blocked_rules:
        if not isinstance(rule, dict):
            continue
        pattern = rule.get("pattern", "")
        if not pattern:
            continue
        try:
            if re.search(pattern, command):
                reason = rule.get("reason", "Matches blocked pattern")
                return True, reason
        except re.error:
            log_error(f"Invalid regex in blocked pattern: {pattern}")
            continue

    return False, ""


def check_grants(tool_name: str, command: str, policy: dict) -> tuple:
    """Check if command matches any grant pattern. Returns (granted, reason)."""
    grants = policy.get("grants", {})
    if not isinstance(grants, dict):
        return False, ""

    # Map tool names to grant categories
    tool_category = tool_name.lower()
    if tool_category not in grants:
        # Try bash as fallback for Bash tool
        if tool_name == "Bash" and "bash" in grants:
            tool_category = "bash"
        else:
            return False, ""

    rules = grants[tool_category]
    if not isinstance(rules, list):
        return False, ""

    for rule in rules:
        if not isinstance(rule, dict):
            continue
        pattern = rule.get("pattern", "")
        if not pattern:
            continue
        try:
            if re.search(pattern, command):
                reason = rule.get("reason", "Matches grant pattern")
                return True, reason
        except re.error:
            log_error(f"Invalid regex in grant pattern: {pattern}")
            continue

    return False, ""


def main():
    """Main entry point. Reads hook input from stdin, outputs decision."""
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            # No input — passthrough
            print(json.dumps({}))
            return

        hook_input = json.loads(raw_input)

        tool_name = hook_input.get("tool_name", "")
        tool_input = hook_input.get("tool_input", {})

        if not tool_name:
            print(json.dumps({}))
            return

        command = extract_command(tool_name, tool_input)
        if not command:
            print(json.dumps({}))
            return

        mode = get_active_mode()
        policy = load_policy(mode)

        if not policy:
            # No policy loaded — passthrough
            print(json.dumps({}))
            return

        # Check blocked FIRST (deny takes priority)
        blocked, reason = check_blocked(command, policy)
        if blocked:
            result = {
                "decision": "block",
                "reason": f"[Tier 1/{mode}] BLOCKED: {reason}"
            }
            print(json.dumps(result))
            return

        # Check grants
        granted, reason = check_grants(tool_name, command, policy)
        if granted:
            result = {
                "decision": "allow",
                "reason": f"[Tier 1/{mode}] ALLOWED: {reason}"
            }
            print(json.dumps(result))
            return

        # No match — passthrough to Tier 2
        print(json.dumps({}))

    except json.JSONDecodeError as e:
        log_error(f"JSON decode error: {e}")
        print(json.dumps({}))
    except Exception as e:
        log_error(f"Unexpected error: {traceback.format_exc()}")
        # On any error, passthrough — never block on hook failure
        print(json.dumps({}))


if __name__ == "__main__":
    main()
