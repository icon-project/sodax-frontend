---
name: pr-description
description: Writes pull request descriptions for SODAX frontend work. Use when creating a PR, writing a PR description, summarizing changes for a pull request, or when asked to describe what a branch does.
---

You are writing a PR description for a SODAX frontend developer working with React, TypeScript, and Tailwind CSS.

Run `git diff main...HEAD` to see all changes. Also run `git log main...HEAD --oneline` to understand the commit history.

Write the PR description following this exact structure:

---

## Description
One or two sentences explaining what this PR does. If it closes a ticket, write:
"This PR closes __[Ticket Title]__."
If there are bonus improvements beyond the ticket scope, add a second sentence mentioning them.

## Key Changes

Group changes into relevant sections. Common sections for this codebase:

### Feature: [Main Feature Name]
Use ✅ bullets for the primary deliverables of the ticket — things that were explicitly required.

* ✅ [Main thing added or implemented]
* ✅ [Key behavior or default state]
* ✅ [Scope/isolation note if relevant, e.g. "only affects X, not Y"]

### Data Improvements (if applicable)
Use ✅ for data-layer changes that unblock the feature. Use plain bullets for supporting tweaks.

* ✅ [What data was enabled or fixed]
* ✅ [What file or util was updated and why]

### UI/UX Enhancements (if applicable)
Use plain bullets (no ✅) for UI polish that wasn't explicitly in the ticket scope.

* [Visual or layout improvement]
* [Component refactor or styling fix]
* [Accessibility or consistency fix]

### Technical Improvements (if applicable)
Use plain bullets for internal code quality changes.

* [State management change]
* [Type safety improvement]
* [Removed duplication or fixed architecture issue]

---

## Testing Notes
Bullet list of what was manually tested. Be specific — mention component names, variants, and behaviors.

* Verified [main feature] works correctly
* Confirmed [edge case or variant] appears/behaves as expected
* Tested [related component] is not affected
* Validated [no regression] in [related area]
* Checked responsive behavior if UI was changed

---

## Checklist
* I have performed a self-review of my own code
* My changes generate no new warnings
* UI matches design specifications
* All acceptance criteria from ticket met

---

## Screenshots

---

**Rules to follow:**
- Use ✅ only for changes that were explicitly required by the ticket. Use plain bullets for everything else.
- Group changes logically — don't dump everything in one list.
- Keep the Description short. Details go in Key Changes.
- Don't invent ticket names — if you don't know the ticket title, write `__[Ticket Title]__` as a placeholder.
- Keep Testing Notes concrete and specific, not generic.
- Always end with the Checklist and Screenshots sections, even if Screenshots is empty.

---

## After writing the PR description

Once the description is written, do the following:

1. Suggest a short PR title (under 70 characters) based on the branch name and changes. Show it to the user and ask: "Does this title look good, or would you like to change it?"

2. Once the user confirms the title (or provides a new one), check if the branch has been pushed to the remote:
   - Run `git status` to check tracking status
   - If not pushed, run `git push -u origin HEAD`

3. Then create the PR automatically using the `gh` CLI:

```
gh pr create --base main --title "<confirmed title>" --body "<the full PR description you wrote>"
```

4. Output the PR URL when done so the user can open it directly.

**Important:** Always ask the user to confirm the title before running `gh pr create`. Never create the PR without confirmation.
