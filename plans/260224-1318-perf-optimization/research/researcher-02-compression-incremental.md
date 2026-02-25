# Researcher 02 — Report Compression, Incremental Planning & File Ownership Validation
**Date:** 2026-02-24 | **Status:** Complete

## Executive Summary

Three distinct gaps require different approaches: (1) report compression is achievable via rule-based size enforcement; (2) incremental planning is best done as a new command with diff detection; (3) file ownership validation is a straightforward static-analysis script.

---

## Key Findings

### 1. Report Compression Strategies

**Rule-based (KISS-first):**
- Enforce max 150 lines per report via PostToolUse hook on `Write` to `plans/**/*.md`
- Hook emits `additionalContext` warning when line count exceeded
- No LLM call needed — line count check is O(1)

**Template-based truncation:**
- Structured report templates with section budgets (e.g., Summary ≤10 lines, Findings ≤80 lines)
- Template enforcement in agent definitions (already partially done via "≤150 lines" rule)

**Verdict:** PostToolUse hook checking line count is lowest effort, highest value.

### 2. Incremental Planning Patterns

**Problem:** `/plan` regenerates full plan even for minor changes.

**Diff-based approach:**
1. New command `/plan:update` reads existing plan
2. Compares against current codebase state (git diff or file timestamps)
3. Identifies stale phases (files changed since plan written)
4. Only re-plans stale phases, preserves others

**Checkpoint pattern** (from OpenAI Agents):
- Save phase completion state to `plan.md` front-matter
- Detect completed phases, skip in re-run
- Already partially done: plan.md tracks `DONE/IN_PROGRESS/PLANNED` status

**Verdict:** New `/plan:update` command reading git diff + plan status — ~3h effort.

### 3. File Ownership Auto-Validation

**Problem:** Parallel phases document file ownership in markdown, but no machine checks.

**Simple approach:**
- Python/Node script: parse all `phase-XX-*.md` files
- Extract `### File Ownership` or `### Files` sections
- Build ownership map `{file → [phases]}`
- Report conflicts where file appears in 2+ phases

**Integration:** New command `/validate-ownership` or hook trigger on plan writes.

**Sample ownership block (standard to adopt):**
```yaml
# In phase-XX file header
files_owned:
  - src/components/Button.tsx
  - src/hooks/useButton.ts
```
Structured YAML front-matter easier to parse than prose markdown.

### 4. Search Scope Optimization

**Scout cache:** Store Glob/Grep results keyed by `{pattern}:{dir}:{git_hash}`
- Cache dir: `.claude/scout-cache/`
- Invalidate on git commit (hash change)
- JSON file per search key
- ~1h effort, significant speedup for repeated searches

---

## Implementation Priority

| Feature | Effort | Value | Approach |
|---------|--------|-------|----------|
| Report size enforcer | 1h | Medium | PostToolUse hook on Write |
| File ownership validator | 2h | Medium | Script + `/validate-ownership` command |
| Incremental plan update | 3h | High | `/plan:update` + git diff |
| Scout cache | 2h | Medium | JSON cache keyed by pattern+hash |

---

## Unresolved Questions
1. Should file ownership be in YAML frontmatter or parsed from markdown prose?
2. Should `/plan:update` require git to be initialized?
3. Scout cache invalidation: git hash vs. timestamp-based?
