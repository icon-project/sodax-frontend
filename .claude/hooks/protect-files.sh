#!/bin/bash
# PreToolUse hook: Block writes to protected files
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.new_file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Protected patterns
case "$FILE_PATH" in
  *.env|*.env.*)
    echo "Blocked: cannot write to env files ($FILE_PATH). Add env vars manually." >&2
    exit 2
    ;;
  */dist/*)
    echo "Blocked: cannot write to dist/ ($FILE_PATH). These are build artifacts." >&2
    exit 2
    ;;
  */node_modules/*)
    echo "Blocked: cannot write to node_modules/ ($FILE_PATH)." >&2
    exit 2
    ;;
  */.next/*)
    echo "Blocked: cannot write to .next/ ($FILE_PATH). This is a build cache." >&2
    exit 2
    ;;
  */pnpm-lock.yaml)
    echo "Blocked: cannot write to pnpm-lock.yaml. Run 'pnpm i' instead." >&2
    exit 2
    ;;
esac

exit 0
