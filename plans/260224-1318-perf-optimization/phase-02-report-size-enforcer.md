# Phase 02: Report Size Enforcer

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: None (independent of Phase 1, but follows same PostToolUse pattern)
- Research: [researcher-02-compression-incremental.md](./research/researcher-02-compression-incremental.md)
- Docs: [hooks README](../../.claude/hooks/README.md)

## Overview
- **Date:** 2026-02-24
- **Description:** PostToolUse hook that warns when plan/report markdown files exceed 150 lines
- **Priority:** P0 (prevents context bloat from oversized reports)
- **Implementation Status:** PLANNED
- **Review Status:** PENDING

## Key Insights (from research)
- Rule-based size enforcement (line count check) is lowest effort, highest value
- PostToolUse on `Write` tool; check `file_path` matches `plans/**/*.md`
- Inject warning via `additionalContext` -- agent sees it but user doesn't
- No LLM call needed; line count is O(1) after file write
- 150-line threshold aligns with existing plan format conventions

## Requirements
1. Trigger on PostToolUse for `Write` tool only
2. Check if `tool_input.file_path` matches `plans/**/*.md` pattern
3. Count lines of the written file
4. If >150 lines: output `additionalContext` warning to compress
5. Non-blocking: exit 0 always
6. <100 LOC

## Architecture

### Files to Create
| File | Description |
|------|-------------|
| `.claude/hooks/report-size-enforcer.cjs` | PostToolUse hook -- checks report line counts |

### Files to Modify
| File | Change |
|------|--------|
| `.claude/settings.json` | Add PostToolUse entry with `Write` matcher |

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
  },
  {
    "matcher": "Write",
    "hooks": [
      {
        "type": "command",
        "command": "node .claude/hooks/report-size-enforcer.cjs"
      }
    ]
  }
]
```

## Related Code Files
- `.claude/hooks/dev-rules-reminder.cjs` -- reference for `additionalContext` injection via stdout
- `.claude/settings.json` -- current hook config
- Existing plan files in `plans/` -- reference for typical line counts

## Implementation Steps

1. **Create enforcer hook** `.claude/hooks/report-size-enforcer.cjs`
   - Read JSON from stdin
   - Extract `tool_input.file_path`
   - Early exit if `file_path` doesn't contain `plans/` or doesn't end with `.md`
   - Use `path.resolve()` to normalize path, then check pattern
   - Read file and count lines: `fs.readFileSync(filePath, 'utf-8').split('\n').length`
   - If >150 lines: output warning to stdout
   - Warning text:
     ```
     REPORT_SIZE_WARNING: File "{filename}" is {N} lines (limit: 150).
     Compress: remove verbose prose, use tables, shorten bullet points.
     Split into sub-files if content is genuinely needed.
     ```
   - Exit 0 always

2. **Path matching logic**
   ```javascript
   const normalized = filePath.replace(/\\/g, '/');
   const isReport = normalized.includes('/plans/') && normalized.endsWith('.md');
   ```
   - Handles both Windows backslash and Unix forward slash paths

3. **Register in settings.json**
   - Add to PostToolUse array with `"matcher": "Write"` (alongside telemetry hook which has no matcher)

4. **Manual test**
   - Create a 160-line test markdown: `node -e "console.log(Array(160).fill('line').join('\n'))" > /tmp/test-report.md`
   - Pipe payload: `echo '{"tool_name":"Write","tool_input":{"file_path":"plans/test/test-report.md","content":"..."}}' | node .claude/hooks/report-size-enforcer.cjs`
   - Verify warning output
   - Test with 100-line file -- verify no output

5. **Edge case tests**
   - Non-plans path (e.g., `docs/readme.md`) -- should not trigger
   - Windows path with backslashes -- should still match
   - File doesn't exist (post-write race) -- fail silently, exit 0

## Todo List
- [ ] Create `.claude/hooks/report-size-enforcer.cjs`
- [ ] Register PostToolUse hook in `.claude/settings.json` with Write matcher
- [ ] Manual test: oversized report triggers warning
- [ ] Manual test: normal-sized report is silent
- [ ] Edge case: non-plans path ignored

## Success Criteria
- Warning injected for any `plans/**/*.md` file >150 lines
- No false positives on non-plan files
- Zero impact on non-Write tool operations
- Existing hooks unaffected

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Reading file that was just written (timing) | Low | Low | PostToolUse fires after write completes |
| False positive on non-report .md files in plans/ | Low | Low | Warning is advisory; agent can ignore if splitting isn't needed |
| Large file read blocking | Low | Low | Reports rarely exceed a few hundred lines |

## Security Considerations
- Only reads files already written by the agent
- No external I/O, no network calls
- Path traversal mitigated by checking `includes('/plans/')` pattern

## Next Steps
- Consider making the 150-line threshold configurable via `.claude/.env` (future scope, YAGNI for now)
- Could extend to check `docs/**/*.md` if needed

## Unresolved Questions
1. Should the threshold be configurable or hardcoded? (KISS: hardcode 150, configurable later if needed)
2. Should it also check Edit tool? (No -- Edit modifies existing content, Write creates/overwrites full file)
