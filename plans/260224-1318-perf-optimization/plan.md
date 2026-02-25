# Performance & Optimization Plan

**Project:** ClaudeKit Engineering Fork v1.18.0
**Date:** 2026-02-24
**Status:** PLANNED
**Plan ID:** 260224-1318-perf-optimization

---

## Overview

Six targeted improvements to reduce token waste, enforce report discipline, and add self-regulation capabilities to ClaudeKit's hook/command system. Each phase is independent; phases 1-3 share PostToolUse/UserPromptSubmit hook infrastructure. No breaking changes to existing hooks.

---

## Phases

| # | Phase | Status | Priority | Est. | File |
|---|-------|--------|----------|------|------|
| 1 | Token Telemetry | PLANNED | P0 | 2h | [phase-01-token-telemetry.md](./phase-01-token-telemetry.md) |
| 2 | Report Size Enforcer | PLANNED | P0 | 1h | [phase-02-report-size-enforcer.md](./phase-02-report-size-enforcer.md) |
| 3 | Context Budget Awareness | PLANNED | P1 | 3h | [phase-03-context-budget-awareness.md](./phase-03-context-budget-awareness.md) |
| 4 | File Ownership Validator | PLANNED | P1 | 2h | [phase-04-file-ownership-validator.md](./phase-04-file-ownership-validator.md) |
| 5 | Scout Search Cache | PLANNED | P2 | 2h | [phase-05-scout-search-cache.md](./phase-05-scout-search-cache.md) |
| 6 | Incremental Plan Update | PLANNED | P2 | 3h | [phase-06-incremental-plan-update.md](./phase-06-incremental-plan-update.md) |

**Total estimated effort:** ~13h

---

## Dependencies

- Phase 2 reuses JSONL logging pattern from Phase 1 (but no hard dep)
- Phase 3 reads transcript like Phase 1; can share utility functions
- Phase 6 depends on Phase 4 ownership format convention (YAML frontmatter)
- All other phases are independent

## Research

- [Token Metrics Research](./research/researcher-01-token-metrics.md)
- [Compression & Incremental Research](./research/researcher-02-compression-incremental.md)

## Constraints

- Files <200 LOC, kebab-case names
- YAGNI/KISS/DRY
- Cross-platform: Windows + macOS + Linux
- Node.js >=18 for hooks, Python 3 for scripts
- No breaking changes to existing scout-block.cjs or dev-rules-reminder.cjs
