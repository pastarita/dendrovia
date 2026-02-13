#!/usr/bin/env python3
"""
Tier 2: LLM-Based Gatekeeper — Castle Walls Permission Engine
Dendrovia Monorepo

Hook type: PermissionRequest
Timeout: 30 seconds
Dependencies: anthropic SDK (optional — falls back to YELLOW)

Classifies ambiguous tool requests using Claude Haiku with
compiled policy corpus. Falls back to YELLOW on any error.
"""

import json
import os
import sys
import traceback
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CORPUS_PATH = os.path.join(SCRIPT_DIR, "..", "policies", "corpus", "compiled-policy.md")
LOGS_DIR = os.path.join(SCRIPT_DIR, "logs")
DECISIONS_LOG = os.path.join(LOGS_DIR, "decisions.jsonl")
ERROR_LOG = os.path.join(LOGS_DIR, "tier2-errors.log")


def log_error(msg: str) -> None:
    """Append error to tier2-errors.log."""
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
        with open(ERROR_LOG, "a") as f:
            ts = datetime.now(timezone.utc).isoformat()
            f.write(f"[{ts}] {msg}\n")
    except Exception:
        pass


def log_decision(entry: dict) -> None:
    """Append decision to decisions.jsonl."""
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
        with open(DECISIONS_LOG, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        log_error(f"Failed to log decision: {e}")


def load_corpus() -> str:
    """Load compiled policy corpus for LLM context."""
    try:
        with open(CORPUS_PATH, "r") as f:
            return f.read()
    except FileNotFoundError:
        log_error(f"Corpus not found: {CORPUS_PATH}")
        return ""
    except Exception as e:
        log_error(f"Error loading corpus: {e}")
        return ""


def get_active_mode() -> str:
    """Read active policy mode."""
    mode_file = os.path.join(SCRIPT_DIR, "..", "policies", ".active-mode")
    try:
        with open(mode_file, "r") as f:
            return f.read().strip()
    except Exception:
        return "default"


def classify_with_llm(tool_name: str, tool_input_summary: str, corpus: str) -> dict:
    """
    Classify request using Claude Haiku.
    Returns {"classification": "GREEN|YELLOW|RED", "reason": "...", "source": "..."}
    """
    try:
        import anthropic
    except ImportError:
        log_error("anthropic SDK not installed — falling back to YELLOW")
        return {
            "classification": "YELLOW",
            "reason": "anthropic SDK not installed — passthrough to human",
            "source": "fallback"
        }

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        log_error("ANTHROPIC_API_KEY not set — falling back to YELLOW")
        return {
            "classification": "YELLOW",
            "reason": "API key not configured — passthrough to human",
            "source": "fallback"
        }

    system_prompt = f"""You are a codebase policy classifier for the Dendrovia monorepo.
Given a tool invocation request, classify it as GREEN, YELLOW, or RED.

Policy corpus:
{corpus}

Respond with ONLY a JSON object (no markdown, no code fences):
{{"classification": "GREEN|YELLOW|RED", "reason": "brief explanation", "source": "policy section reference"}}

GREEN: Safe, routine, well-understood operations
YELLOW: Ambiguous, needs human judgment, first-time patterns
RED: Destructive, irreversible, violates documented policy"""

    user_prompt = f"Tool: {tool_name}\nRequest: {tool_input_summary}"

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )

        result_text = response.content[0].text.strip()

        # Parse JSON response
        result = json.loads(result_text)
        if "classification" not in result:
            raise ValueError("Missing 'classification' field")
        if result["classification"] not in ("GREEN", "YELLOW", "RED"):
            raise ValueError(f"Invalid classification: {result['classification']}")

        return result

    except json.JSONDecodeError as e:
        log_error(f"LLM response not valid JSON: {e}")
        return {
            "classification": "YELLOW",
            "reason": "LLM response parse error — passthrough to human",
            "source": "fallback"
        }
    except Exception as e:
        log_error(f"LLM classification error: {e}")
        return {
            "classification": "YELLOW",
            "reason": f"Classification error: {str(e)[:100]} — passthrough to human",
            "source": "fallback"
        }


def main():
    """Main entry point. Reads hook input, classifies, outputs decision."""
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({}))
            return

        hook_input = json.loads(raw_input)
        tool_name = hook_input.get("tool_name", "unknown")
        tool_input = hook_input.get("tool_input", {})

        # Summarize tool input (truncate for LLM efficiency)
        if tool_name == "Bash":
            summary = tool_input.get("command", "")[:500]
        elif tool_name in ("Edit", "Write"):
            summary = f"file: {tool_input.get('file_path', 'unknown')}"
        else:
            summary = json.dumps(tool_input)[:300]

        corpus = load_corpus()
        mode = get_active_mode()

        result = classify_with_llm(tool_name, summary, corpus)

        # Log decision
        log_decision({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tier": 2,
            "tool_name": tool_name,
            "tool_input_summary": summary[:200],
            "classification": result.get("classification", "YELLOW"),
            "reason": result.get("reason", ""),
            "source_policy": result.get("source", ""),
            "mode": mode,
            "session_id": hook_input.get("session_id", "")
        })

        classification = result.get("classification", "YELLOW")

        if classification == "GREEN":
            print(json.dumps({
                "decision": "allow",
                "reason": f"[Tier 2/{mode}] {result.get('reason', 'Classified as safe')}"
            }))
        elif classification == "RED":
            print(json.dumps({
                "decision": "block",
                "reason": f"[Tier 2/{mode}] {result.get('reason', 'Classified as destructive')}"
            }))
        else:
            # YELLOW — passthrough to human (Tier 3)
            print(json.dumps({}))

    except json.JSONDecodeError as e:
        log_error(f"JSON decode error: {e}")
        print(json.dumps({}))
    except Exception as e:
        log_error(f"Unexpected error: {traceback.format_exc()}")
        # On any error, passthrough to human
        print(json.dumps({}))


if __name__ == "__main__":
    main()
