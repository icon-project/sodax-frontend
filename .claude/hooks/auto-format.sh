#!/bin/bash
# PostToolUse hook: Auto-format files after Edit/Write with Biome
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only format JS/TS/JSON files
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json)
    cd "$CLAUDE_PROJECT_DIR" && npx biome format --write "$FILE_PATH" 2>/dev/null
    ;;
esac

exit 0
