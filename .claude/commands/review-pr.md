# PR Review

Review a pull request against Sodax project conventions and patterns.

**PR to review: $ARGUMENTS**

## Instructions

You are reviewing a PR for the sodax-frontend monorepo. Be thorough but practical — focus on real issues, not style nitpicks (Biome handles formatting).

### Step 0: Parse input

1. Parse PR number or URL from: `$ARGUMENTS`
2. If empty, print usage and STOP:
   ```
   Usage: /project:review-pr <PR number or URL>
   Examples:
     /project:review-pr 962
     /project:review-pr https://github.com/icon-project/sodax-frontend/pull/962
   ```
3. Extract the PR number.

---

### Step 1: Gather PR context

Run these in parallel:

```bash
gh pr view <number> --repo icon-project/sodax-frontend
gh pr diff <number> --repo icon-project/sodax-frontend
gh pr view <number> --repo icon-project/sodax-frontend --json files --jq '.files[].path'
gh pr view <number> --repo icon-project/sodax-frontend --json baseRefName,headRefName,mergeable,mergeStateStatus
```

Note:
- Total files changed and lines changed
- Which packages are affected (types, sdk, wallet-sdk-core, wallet-sdk-react, dapp-kit, apps/web, apps/demo)
- PR description and linked issues
- Whether branch is up-to-date with base (mergeable status)
- If behind base branch, flag "Please rebase or merge latest main" at top of review

---

### Step 2: Read relevant CLAUDE.md files

Based on which packages are affected, read the corresponding CLAUDE.md:
- If `apps/web/` changed → read `apps/web/CLAUDE.md`
- If `packages/sdk/` changed → read `packages/sdk/CLAUDE.md`
- If `packages/dapp-kit/` changed → read `packages/dapp-kit/CLAUDE.md`
- If `packages/wallet-sdk-react/` changed → read `packages/wallet-sdk-react/CLAUDE.md`
- Always read root `CLAUDE.md`

---

### Step 3: Review checklist

For each changed file, check against these categories:

#### Architecture & Patterns
- [ ] SDK services follow constructor pattern (hubProvider + configService)
- [ ] SDK methods return `Result<T, E>`, never throw
- [ ] Spoke services are static-only classes with private constructor
- [ ] New spoke chain: added type guard in `guards.ts` + dispatch in `SpokeService.ts`
- [ ] dapp-kit hooks use `useSodaxContext()`, not direct SDK instantiation
- [ ] dapp-kit query hooks have `enabled` guard and appropriate `refetchInterval`
- [ ] dapp-kit mutation hooks handle `result.ok` check
- [ ] Web app features follow folder structure: `page.tsx` + `_stores/` + `_components/`
- [ ] Zustand stores use `zustand/vanilla` with `createStore`
- [ ] Store providers export `useFeatureState()` and `useFeatureActions()`
- [ ] Page components have animation wrapper (`motion.div` + `listVariants`)
- [ ] Page components reset store on unmount

#### Code Quality
- [ ] No `any` types (Biome catches this, but check type assertions)
- [ ] No non-null assertions (`!`)
- [ ] No `as unknown` casts to bypass type checking
- [ ] Uses `import type` for type-only imports
- [ ] No `bigint` in types passed to `JSON.stringify`
- [ ] Wallet/chain-specific code uses type guards, not type assertions
- [ ] Error messages are descriptive
- [ ] No magic numbers — extract named constants (addresses, lengths, retries, prefixes)
- [ ] Comments match actual code behavior (e.g., comment says "16-byte buffer" but code allocates 8 bytes)

#### Performance & Bundle
- [ ] No heavy top-level imports that bloat bundle — use dynamic `import()` for chain-specific SDKs
- [ ] No redundant instantiation — reuse/cache instances instead of `new` in every static method
- [ ] On-chain addresses/program names in config, not hardcoded in service logic

#### Cross-Package Consistency
- [ ] If types changed → downstream packages updated accordingly
- [ ] If SDK service API changed → dapp-kit hooks updated
- [ ] If new exports added → package `index.ts` updated
- [ ] Dependency chain respected: types → sdk → wallet-sdk-core → wallet-sdk-react → dapp-kit → web
- [ ] All switch/dispatch points updated (e.g., `constructRawSpokeProvider`, `SpokeService`, `guards.ts`)

#### Security
- [ ] No hardcoded private keys, mnemonics, or API secrets
- [ ] No hardcoded staging/dev API endpoints — use env vars or config
- [ ] API routes validate input
- [ ] No sensitive data in console.log

#### Unrelated Changes
- [ ] Code deletions unrelated to the PR's purpose — politely ask for context ("Could you clarify the reason for removing X? Want to make sure it's intentional")
- [ ] No formatter-only changes mixed with feature code (should be separate commit)
- [ ] Branch is up-to-date with main (check `git log <branch>..origin/main`)

#### Missing Files
- [ ] New feature has corresponding test file
- [ ] New exports added to package index
- [ ] New chain: all layers implemented (spoke service, wallet provider, XService, XConnector, hooks)
- [ ] Placeholder/empty values (`''`, zero address) flagged — either fill or document why

---

### Step 4: Read key changed files

For files with significant changes (not just formatting), read the full file to understand context. Focus on:
- New service classes or hooks
- Modified public API signatures
- Chain-specific logic changes
- Store structure changes

---

### Step 5: Generate review

Present the review in this format:

```
## PR #<number> Review: <title>

### Summary
<1-2 sentences about what this PR does>

### Affected packages
<list of affected packages>

### Issues Found

#### 🔴 Critical (must fix)
<issues that will cause bugs or break the build>

#### 🟡 Important (should fix)
<issues that deviate from conventions or could cause problems>

#### 🔵 Suggestions (nice to have)
<improvements that aren't blocking>

### ✅ What looks good
<things the PR does well — important for positive feedback>

### Checklist summary
- Architecture & Patterns: X/Y passed
- Code Quality: X/Y passed
- Cross-Package: X/Y passed
- Security: X/Y passed
```

---

### Step 6: Ask about posting

Ask the user: "Would you like me to post this review as a comment on the PR?"

Options: "Post review" / "Just show me"

If "Post review":
```bash
gh pr review <number> --repo icon-project/sodax-frontend --comment --body "<review content>"
```

---

## Important notes

- Do NOT approve or request changes — only comment. Let the user decide.
- Be specific: reference file paths and line numbers.
- Compare against existing implementations in the codebase when pointing out inconsistencies.
- If the PR is very large (>50 files), focus on the most important files first and note which files were skipped.
- Giải thích bằng tiếng Việt nếu user dùng tiếng Việt.
