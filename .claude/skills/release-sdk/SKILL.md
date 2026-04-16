# SDK Release Automation

Release all 5 SDK packages with a synchronized version bump.

**Version to release: $ARGUMENTS**

## Instructions

You are performing an SDK release for the sodax-frontend monorepo. Follow these steps precisely and in order. Stop and report errors at any step rather than continuing.

### Package list

All 5 packages must be updated to the same version:
- `@sodax/types` — `packages/types/package.json`
- `@sodax/sdk` — `packages/sdk/package.json`
- `@sodax/wallet-sdk-core` — `packages/wallet-sdk-core/package.json`
- `@sodax/wallet-sdk-react` — `packages/wallet-sdk-react/package.json`
- `@sodax/dapp-kit` — `packages/dapp-kit/package.json`

Additionally, `CONFIG_VERSION` in `packages/types/src/constants/index.ts` must be incremented by 1.

---

### Step 0: Parse and validate version

1. Parse the version from: `$ARGUMENTS`
2. Trim whitespace. If empty, print this usage message and STOP:
   ```
   Usage: /project:release-sdk <version>

   Examples:
     /project:release-sdk 1.2.5
     /project:release-sdk 1.2.5-beta
     /project:release-sdk 1.2.5-rc.1

   The version is applied to all 5 SDK packages.
   Versions containing "rc" are marked as pre-releases on GitHub.
   ```
3. Validate the version looks like a valid semver (digits.digits.digits with optional pre-release suffix like `-beta`, `-rc.1`, `-beta-rc1`). If invalid, print an error with the usage examples above and STOP.
4. Determine if this is a **pre-release**: the version contains `rc` (case-insensitive). Save this as IS_PRERELEASE (true/false). This controls the `--prerelease` flag when creating GitHub releases.

---

### Step 1: Pre-flight safety checks

Run ALL of these checks before making any changes:

1. **gh auth check**: Run `gh auth status`. If not authenticated, tell the user to run `gh auth login` and STOP.

2. **Branch check**: Run `git branch --show-current`. Must be `release/sdk`. If not, ask the user: "You are on branch X. Switch to release/sdk?" If they say yes, run `git checkout release/sdk`. If they decline, STOP.

3. **Clean working tree**: Run `git status --porcelain`. If there is ANY output, show it to the user and say "Working tree must be clean before releasing. Please commit or stash your changes." and STOP.

4. **Fetch latest**: Run `git fetch origin`.

5. **Check main has been merged**: Run `git log release/sdk..origin/main --oneline`. If there are commits, save this fact — a `git pull --no-ff origin main` will be needed in Step 3. Show the user how many commits from main are not yet in release/sdk.

6. **Read current version**: Read `packages/sdk/package.json` and extract the current `"version"` value. Save this as `CURRENT_VERSION`.

7. **Read current CONFIG_VERSION**: Read `packages/types/src/constants/index.ts` and find the line with `CONFIG_VERSION = <number>`. Extract the number. Save as `CURRENT_CONFIG_VERSION`.

8. **Tag conflict check**: Run `git tag -l "@sodax/sdk@$ARGUMENTS"`. If a tag already exists, say "Tag @sodax/sdk@$ARGUMENTS already exists. This version has already been released." and STOP.

9. **Version sanity**: If `$ARGUMENTS` equals `CURRENT_VERSION`, warn "New version is the same as current version" and ask the user to confirm they want to proceed.

---

### Step 2: Confirm with user

Present this summary using AskUserQuestion and ask for explicit confirmation:

```
SDK Release Plan:
  Current version:   {CURRENT_VERSION}
  New version:       {$ARGUMENTS}
  CONFIG_VERSION:    {CURRENT_CONFIG_VERSION} -> {CURRENT_CONFIG_VERSION + 1}
  Pre-release:       {Yes/No based on IS_PRERELEASE}
  Branch:            release/sdk
  Main merge needed: {Yes/No based on step 1.5}

  Files to modify:
    - packages/types/package.json
    - packages/sdk/package.json
    - packages/wallet-sdk-core/package.json
    - packages/wallet-sdk-react/package.json
    - packages/dapp-kit/package.json
    - packages/types/src/constants/index.ts
```

Options: "Proceed with release" / "Abort"

If they choose Abort, STOP.

---

### Step 3: Merge from main (if needed)

If step 1.5 found commits on main not in release/sdk:

```bash
git pull --no-ff origin main
```

If this results in merge conflicts, tell the user to resolve them manually and STOP. Do not attempt to resolve conflicts automatically.

---

### Step 4: Bump versions

Edit these 6 files using the Edit tool. For each package.json, change only the `"version"` field. For the constants file, change only the `CONFIG_VERSION` number.

1. Edit `packages/types/package.json`: change `"version": "{CURRENT_VERSION}"` to `"version": "$ARGUMENTS"`
2. Edit `packages/sdk/package.json`: change `"version": "{CURRENT_VERSION}"` to `"version": "$ARGUMENTS"`
3. Edit `packages/wallet-sdk-core/package.json`: change `"version": "{CURRENT_VERSION}"` to `"version": "$ARGUMENTS"`
4. Edit `packages/wallet-sdk-react/package.json`: change `"version": "{CURRENT_VERSION}"` to `"version": "$ARGUMENTS"`
5. Edit `packages/dapp-kit/package.json`: change `"version": "{CURRENT_VERSION}"` to `"version": "$ARGUMENTS"`
6. Edit `packages/types/src/constants/index.ts`: change `CONFIG_VERSION = {CURRENT_CONFIG_VERSION}` to `CONFIG_VERSION = {CURRENT_CONFIG_VERSION + 1}`

After all edits, run `git diff` and show the user the changes to verify correctness.

---

### Step 5: Commit

Stage only the 6 changed files and create a commit:

```bash
git add packages/sdk/package.json packages/dapp-kit/package.json packages/types/package.json packages/wallet-sdk-core/package.json packages/wallet-sdk-react/package.json packages/types/src/constants/index.ts
git commit -m "chore(sdks): bump versions to $ARGUMENTS"
```

---

### Step 6: Push

Ask the user using AskUserQuestion: "Ready to push to origin/release/sdk. This will push the version bump commit (and any merge commits from main). Proceed?"

Options: "Push" / "Abort"

If confirmed:
```bash
git push -u origin release/sdk
```

If the push fails, report the error and STOP. NEVER force push.

---

### Step 7: Create GitHub releases

Ask the user using AskUserQuestion: "Ready to create 5 GitHub releases. Each tag creation triggers an npm publish CI workflow. Proceed?"

Options: "Create releases" / "Abort"

If confirmed, create releases in dependency order. Use `CURRENT_VERSION` (the version BEFORE the bump) for `--notes-start-tag`. If IS_PRERELEASE is true, add `--prerelease` to each command.

```bash
gh release create "@sodax/types@$ARGUMENTS" \
  --repo icon-project/sodax-frontend \
  --target release/sdk \
  --title "@sodax/types@$ARGUMENTS" \
  --generate-notes \
  --notes-start-tag "@sodax/types@{CURRENT_VERSION}" \
  [--prerelease]

gh release create "@sodax/sdk@$ARGUMENTS" \
  --repo icon-project/sodax-frontend \
  --target release/sdk \
  --title "@sodax/sdk@$ARGUMENTS" \
  --generate-notes \
  --notes-start-tag "@sodax/sdk@{CURRENT_VERSION}" \
  [--prerelease]

gh release create "@sodax/wallet-sdk-core@$ARGUMENTS" \
  --repo icon-project/sodax-frontend \
  --target release/sdk \
  --title "@sodax/wallet-sdk-core@$ARGUMENTS" \
  --generate-notes \
  --notes-start-tag "@sodax/wallet-sdk-core@{CURRENT_VERSION}" \
  [--prerelease]

gh release create "@sodax/wallet-sdk-react@$ARGUMENTS" \
  --repo icon-project/sodax-frontend \
  --target release/sdk \
  --title "@sodax/wallet-sdk-react@$ARGUMENTS" \
  --generate-notes \
  --notes-start-tag "@sodax/wallet-sdk-react@{CURRENT_VERSION}" \
  [--prerelease]

gh release create "@sodax/dapp-kit@$ARGUMENTS" \
  --repo icon-project/sodax-frontend \
  --target release/sdk \
  --title "@sodax/dapp-kit@$ARGUMENTS" \
  --generate-notes \
  --notes-start-tag "@sodax/dapp-kit@{CURRENT_VERSION}" \
  [--prerelease]
```

If any release creation fails, report which ones succeeded and which failed. Provide the exact command to retry the failed one(s). Do NOT retry automatically.

---

### Step 8: Summary

After all releases are created, print:

```
Release $ARGUMENTS complete!

GitHub Releases:
  - https://github.com/icon-project/sodax-frontend/releases/tag/@sodax/types@$ARGUMENTS
  - https://github.com/icon-project/sodax-frontend/releases/tag/@sodax/sdk@$ARGUMENTS
  - https://github.com/icon-project/sodax-frontend/releases/tag/@sodax/wallet-sdk-core@$ARGUMENTS
  - https://github.com/icon-project/sodax-frontend/releases/tag/@sodax/wallet-sdk-react@$ARGUMENTS
  - https://github.com/icon-project/sodax-frontend/releases/tag/@sodax/dapp-kit@$ARGUMENTS

npm packages (available after CI completes ~3-5 min):
  - https://www.npmjs.com/package/@sodax/types/v/$ARGUMENTS
  - https://www.npmjs.com/package/@sodax/sdk/v/$ARGUMENTS
  - https://www.npmjs.com/package/@sodax/wallet-sdk-core/v/$ARGUMENTS
  - https://www.npmjs.com/package/@sodax/wallet-sdk-react/v/$ARGUMENTS
  - https://www.npmjs.com/package/@sodax/dapp-kit/v/$ARGUMENTS

CONFIG_VERSION: {CURRENT_CONFIG_VERSION + 1}

Monitor CI: gh run list --repo icon-project/sodax-frontend --limit 10
```

Then remind the user: "Next step: Share release info (npm links + changelog) in Discord channels per packages/RELEASE_INSTRUCTIONS.md (step 8)."

---

## Error recovery notes

- If the process fails **after committing but before pushing**: the commit is local only and can be reset with `git reset HEAD~1`.
- If the process fails **after pushing but before creating all releases**: re-run the command — it will detect the version is the same as current and you can skip to release creation.
- If **some releases are created but others fail**: use the exact retry commands printed in the error output.
- **NEVER** force push, delete tags, or delete releases.
