# Researcher 01 — Token Metrics & Context Budget Awareness
**Date:** 2026-02-24 | **Status:** Complete

## Executive Summary

Claude Code hooks receive **minimal token/context data** directly. Payload contains `session_id`, `transcript_path`, `tool_name`, `tool_input` — **NOT** token counts or context window state. Token tracking requires post-hoc transcript analysis + indirect signals.

---

## Key Findings

### 1. Hook Payload Data
- ✅ `session_id`, `transcript_path`, `tool_name`, `tool_input` — available
- ❌ Token count, context remaining, model usage — NOT available
- **Workaround:** Estimate via transcript file size ≈ 4 bytes/token

### 2. PostToolUse Telemetry Pattern
Phase classification by tool pattern:
- Planning: Glob/Grep → ~5–10 tokens/call
- Analysis: Read → 10 + file_size/4
- Implementation: Write/Edit → 20 + diff_size/4
- Testing: Bash → 100–200 + output/4

**Storage:** JSONL append-only log per session
```
.claude/telemetry/{session_id}.jsonl
{"ts":1708...,"tool":"Read","phase":"analysis","bytes":4200}
```

### 3. Context Budget Self-Regulation
Industry standard (AutoGPT/LangChain):
- Total budget: ~180k input tokens available
- Warn: 70% → compress outputs
- Critical: 85% → lightweight mode (Grep/Glob only)
- Archive: transcript >2000 lines

**Injection via `additionalContext`:**

| Signal | Trigger | Agent Action |
|--------|---------|-------------|
| `CONTEXT_BUDGET_WARNING` | >70% | Compress reports |
| `CONTEXT_BUDGET_CRITICAL` | >85% | Grep/Glob only |
| `TRANSCRIPT_TOO_LONG` | >2000 lines | Archive context |

### 4. Implementation Roadmap
- **Phase A** (2h): PostToolUse hook → JSONL telemetry
- **Phase B** (3h): Budget estimation + `additionalContext` signal injection
- **Phase C** (4h): Agent instruction updates for self-regulation

---

## Unresolved Questions
1. Accuracy of bytes÷4 token estimation across file types?
2. Can multiple PostToolUse hooks accumulate `additionalContext`?
3. Async vs. sync file append performance impact?
