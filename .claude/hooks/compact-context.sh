#!/bin/bash
# SessionStart hook: Re-inject critical context after compaction
# Claude forgets architecture details when context is compacted in long conversations

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "MONOREPO REMINDER (post-compaction):\n- Package manager: pnpm 9.8.0\n- Dependency chain: types → sdk → wallet-sdk-core → wallet-sdk-react → dapp-kit → apps/web\n- After editing any package: run `pnpm build:packages` before testing in apps/web\n- Hub chain: Sonic (chainId 146). Hub-and-spoke architecture.\n- Linter: Biome only (no ESLint/Prettier). Run `pnpm lint` to auto-fix.\n- Commits: conventional commits enforced by commitlint.\n- No `any` types, no non-null assertions, use `import type` for type-only imports.\n- SDK pattern: isAllowanceValid() → approve() → createXxxIntent() → SpokeService.deposit() → relay\n- SDK returns Result<T,E> — never throws, always check result.ok\n- Web app features: app/(apps)/[feature]/ with _stores/ (zustand/vanilla) + _components/\n- dapp-kit hooks: useSodaxContext() to get SDK, useQuery for reads, useMutation for writes\n- Wallet: useXAccount, useXConnect, useXBalances from @sodax/wallet-sdk-react"
  }
}
EOF
