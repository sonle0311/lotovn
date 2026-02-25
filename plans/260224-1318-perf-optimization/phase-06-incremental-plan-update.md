# Phase 06: Incremental Plan Update Command

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 4 (file ownership format convention for `files_owned:`)
- Research: [researcher-02-compression-incremental.md](./research/researcher-02-compression-incremental.md)
- Docs: [plan command](../../.claude/commands/plan.md), [code command](../../.claude/commands/code.md)

## Overview
- **Date:** 2026-02-24
- **Description:** New `/plan:update` command that diffs codebase changes against plan phases, only replanning stale phases
- **Priority:** P2 (efficiency gain for long-running multi-phase plans)
- **Implementation Status:** PLANNED
- **Review Status:** PENDING

## Key Insights (from research)
- Current `/plan` regenerates entire plan even for minor changes -- wasteful
- Diff-based approach: `git diff --name-only` since plan creation, cross-reference against phase file ownership
- Checkpoint pattern: plan.md tracks `DONE/IN_PROGRESS/PLANNED` per phase
- Preserve DONE phases, re-plan only PLANNED/IN_PROGRESS phases whose owned files changed
- ~3h effort; reuses Phase 4 ownership parsing logic

## Requirements
1. New command `/plan:update` (maps to `.claude/commands/plan-update.md`)
2. Read active plan from `.claude/active-plan`
3. Parse plan.md status table: extract phase statuses (DONE, IN_PROGRESS, PLANNED)
4. For non-DONE phases: identify owned files (from phase files)
5. Run `git diff --name-only {plan_creation_commit}..HEAD` to find changed files
6. Cross-reference changed files against phase ownership
7. Mark phases as "stale" if any owned file changed
8. Output: list of stale phases needing replan, skip DONE phases
9. Agent then replans only stale phases

## Architecture

### Files to Create
| File | Description |
|------|-------------|
| `.claude/commands/plan-update.md` | Command definition for `/plan:update` |

### Files to Modify
None. Command delegates to agent logic.

### Command Flow
```
/plan:update
  -> Read .claude/active-plan -> get plan directory
  -> Parse plan.md -> extract phase statuses
  -> Parse each non-DONE phase file -> extract files_owned
  -> git diff --name-only -> get changed files
  -> Cross-reference -> identify stale phases
  -> Output stale phases list
  -> Agent replans stale phases only
```

## Related Code Files
- `.claude/commands/plan.md` -- existing plan command, reference for command format
- `.claude/active-plan` -- active plan path
- `.claude/scripts/validate-file-ownership.py` -- Phase 4 ownership parsing (reusable logic)
- `plans/*/plan.md` -- status table format

## Implementation Steps

1. **Create command file** `.claude/commands/plan-update.md`

2. **Command frontmatter**
   ```yaml
   ---
   description: Incrementally update active plan, replanning only stale phases
   argument-hint: [options]
   ---
   ```

3. **Command body -- step-by-step agent instructions**

   **Step 1: Locate active plan**
   - Read `.claude/active-plan` to get plan directory
   - If not found: error "No active plan. Run /plan first."
   - Read `plan.md` from that directory

   **Step 2: Parse plan status table**
   - Extract status for each phase from the markdown table
   - Build map: `{phase_name: status}` where status in {DONE, IN_PROGRESS, PLANNED}
   - Skip DONE phases entirely

   **Step 3: Extract file ownership for non-DONE phases**
   - For each IN_PROGRESS or PLANNED phase file:
     - Parse `files_owned:` YAML frontmatter (preferred)
     - Fallback: parse `### Files to Create` and `### Files to Modify` markdown tables
   - Build map: `{phase_name: [owned_files]}`

   **Step 4: Detect changed files**
   - Run: `git log --format=%H --diff-filter=d -- plan.md | head -1` to find commit when plan was created
   - If no git history: use file modification timestamps as fallback
   - Run: `git diff --name-only {plan_commit}..HEAD`
   - Collect set of changed files

   **Step 5: Identify stale phases**
   - For each non-DONE phase: check if any owned file appears in changed files set
   - Also mark as stale if phase file itself was modified externally
   - Output report:
     ```
     ## Plan Update Analysis
     Active plan: {plan_path}

     | Phase | Status | Stale? | Changed Files |
     |-------|--------|--------|---------------|
     | phase-01-... | DONE | - (skipped) | - |
     | phase-02-... | IN_PROGRESS | YES | settings.json |
     | phase-03-... | PLANNED | NO | - |
     ```

   **Step 6: Replan stale phases**
   - For each stale phase:
     - Read the existing phase file
     - Identify what changed (diff summary for each changed owned file)
     - Rewrite only the affected sections (Implementation Steps, Todo List)
     - Preserve: Context Links, Overview, Key Insights, Architecture, Success Criteria
   - Update plan.md status table timestamps

   **Step 7: Summary**
   - Report: "{N} phases updated, {M} phases unchanged, {K} phases completed (skipped)"

4. **Git fallback for non-git repos**
   - If `git` not available: compare file mtimes against plan.md mtime
   - Files modified after plan.md creation date are considered "changed"

5. **Manual test**
   - Modify a file owned by a PLANNED phase
   - Run `/plan:update`
   - Verify only that phase is flagged stale
   - Verify DONE phases are untouched

## Todo List
- [ ] Create `.claude/commands/plan-update.md`
- [ ] Write step-by-step agent instructions for plan detection
- [ ] Write instructions for status parsing and file ownership extraction
- [ ] Write instructions for git diff and staleness detection
- [ ] Write instructions for selective replan
- [ ] Test with modified owned file -> stale detection
- [ ] Test with DONE phase -> skip behavior

## Success Criteria
- Only stale phases are replanned; DONE phases never touched
- Correct detection of changed files via git diff
- Graceful fallback when git unavailable
- Command output clear enough for user to understand what will be replanned
- No modification to existing `/plan` or `/plan:fast` commands

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Git not initialized in project | Medium | Medium | Fallback to mtime comparison |
| Phase files lack structured ownership data | Medium | Medium | Parse markdown tables as fallback; warn about missing YAML frontmatter |
| Plan commit detection fails | Low | Medium | Fallback: diff against last 7 days of changes |
| Replan overwrites manual edits in phase files | Low | High | Only rewrite Implementation Steps and Todo; preserve all other sections |

## Security Considerations
- Read-only git operations (diff, log)
- No network access
- Only modifies files within the plan directory
- No secrets exposed

## Next Steps
- Consider adding `--dry-run` flag to show what would be replanned without making changes
- Consider auto-triggering on `/code` start (check if plan is stale before implementation)
- Phase 4 ownership validator could be called as pre-check before update

## Unresolved Questions
1. How to detect plan creation commit reliably? (Best approach: `git log` on plan.md, take first commit)
2. Should PLANNED phases with no file ownership be marked stale if codebase changed significantly? (No -- YAGNI; only stale if owned files changed)
3. Should `/plan:update` auto-run `/validate-ownership` first? (Nice-to-have; not required for MVP)
