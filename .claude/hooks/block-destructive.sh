#!/bin/bash
# PreToolUse hook: Block destructive bash commands
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block dangerous patterns
if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+(/|~|\.|\.\.|\$HOME)'; then
  echo "Blocked: destructive rm -rf on root/home/project directory." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force'; then
  echo "Blocked: force push. Use --force-with-lease if needed." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  echo "Blocked: git reset --hard. Stash or commit changes first." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qE 'DROP\s+(TABLE|DATABASE)'; then
  echo "Blocked: destructive SQL command." >&2
  exit 2
fi

exit 0
