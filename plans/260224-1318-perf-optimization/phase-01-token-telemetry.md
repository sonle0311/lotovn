# Phase 01: Token Telemetry

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: None (first phase)
- Research: [researcher-01-token-metrics.md](./research/researcher-01-token-metrics.md)
- Docs: [hooks README](../../.claude/hooks/README.md), [system architecture](../../docs/system-architecture.md)

## Overview
- **Date:** 2026-02-24
- **Description:** PostToolUse hook logging tool invocations to JSONL for session-level token/cost estimation
- **Priority:** P0 (foundation for phases 2-3)
- **Implementation Status:** PLANNED
- **Review Status:** PENDING

## Key Insights (from research)
- Hook payload contains: `session_id`, `transcript_path`, `tool_name`, `tool_input` -- NOT token counts
- Token estimation: `input_size_bytes / 4` approximates token count
- Phase classification by tool pattern: Glob/Grep=planning, Read=analysis, Write/Edit=implementation, Bash=testing
- JSONL append-only is optimal -- no read-modify-write, low I/O overhead
- Single .cjs file sufficient (no platform-specific split needed -- only fs operations)

## Requirements
1. Log every tool invocation with timestamp, session_id, tool_name, phase estimate, input_size_bytes
2. Write to `.claude/telemetry/{session_id}.jsonl` (append-only)
3. Auto-create `.claude/telemetry/` directory if missing
4. Phase estimation: map tool_name to phase label
5. Non-blocking: exit 0 always (fail-open)
6. <200 LOC total

## Architecture

### Files to Create
| File | Description |
|------|-------------|
| `.claude/hooks/token-telemetry.cjs` | PostToolUse hook -- logs tool usage to JSONL |

### Files to Modify
| File | Change |
|------|--------|
| `.claude/settings.json` | Add PostToolUse hook entry for all tools |
| `.claude/.gitignore` | Add `telemetry/` to gitignore |

### settings.json Addition
```json
"PostToolUse": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "node .claude/hooks/token-telemetry.cjs"
      }
    ]
  }
]
```

## Related Code Files
- `.claude/hooks/dev-rules-reminder.cjs` -- reference for stdin parsing, `additionalContext` output
- `.claude/hooks/scout-block.cjs` -- reference for cross-platform hook pattern
- `.claude/settings.json` -- hook registration

## Implementation Steps

1. **Create telemetry hook file** `.claude/hooks/token-telemetry.cjs`
   - Read JSON from stdin (same pattern as dev-rules-reminder.cjs)
   - Extract: `session_id`, `tool_name`, `tool_input`
   - Classify phase: `{Glob:'planning', Grep:'planning', Read:'analysis', Write:'implementation', Edit:'implementation', Bash:'testing', Task:'orchestration'}`
   - Compute `input_size_bytes`: `JSON.stringify(tool_input).length`
   - Build log entry: `{ts: Date.now(), sid: session_id, tool: tool_name, phase: phase_label, bytes: input_size_bytes}`
   - Ensure `.claude/telemetry/` exists (`fs.mkdirSync(dir, {recursive:true})`)
   - Append JSON line to `.claude/telemetry/{session_id}.jsonl` via `fs.appendFileSync`
   - Exit 0 always (wrap in try/catch, fail-open)

2. **Register hook in settings.json**
   - Add `PostToolUse` array alongside existing `UserPromptSubmit` and `PreToolUse`
   - No matcher needed (triggers on all tools)

3. **Update .gitignore**
   - Add `.claude/telemetry/` to prevent committing session logs

4. **Manual test**
   - Pipe sample JSON to hook: `echo '{"session_id":"test-123","tool_name":"Read","tool_input":{"file_path":"test.md"}}' | node .claude/hooks/token-telemetry.cjs`
   - Verify `.claude/telemetry/test-123.jsonl` contains expected line
   - Verify exit code 0

5. **Error handling test**
   - Pipe invalid JSON -- verify exit 0 (fail-open)
   - Pipe empty stdin -- verify exit 0

## Todo List
- [ ] Create `.claude/hooks/token-telemetry.cjs`
- [ ] Register PostToolUse hook in `.claude/settings.json`
- [ ] Add `.claude/telemetry/` to gitignore
- [ ] Manual test with sample payloads
- [ ] Verify fail-open behavior with bad input

## Success Criteria
- Hook runs after every tool use without blocking
- JSONL file created per session with correct format
- No performance impact (append-only, sync write <1ms)
- Existing hooks unaffected

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Disk space from JSONL accumulation | Medium | Low | Session files small (~10KB); user can periodically delete `.claude/telemetry/` |
| appendFileSync blocking event loop | Low | Low | Hook is short-lived process, not long-running server |
| Invalid session_id in filename | Low | Medium | Sanitize session_id: replace non-alphanumeric with `_` |

## Security Considerations
- Telemetry is local-only (never transmitted)
- JSONL files in gitignored directory
- No secrets logged -- only tool_name and input size
- Session IDs sanitized before use in filesystem paths

## Next Steps
- Phase 2 (Report Size Enforcer) can reuse this PostToolUse pattern
- Phase 3 (Context Budget) can read telemetry JSONL for cumulative byte tracking
- Consider adding a `/telemetry` command to summarize session stats (future scope)

## Unresolved Questions
1. Should telemetry auto-clean old sessions? (YAGNI says no for now)
2. Multiple PostToolUse hooks -- do they all receive same payload? (Assumed yes per Claude Code docs)
3. Is `fs.appendFileSync` fast enough under heavy tool usage? (Likely yes -- sub-millisecond for small writes)
