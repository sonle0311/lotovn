# Phase 03: Context Budget Awareness

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: None (independent, but can benefit from Phase 1 telemetry data)
- Research: [researcher-01-token-metrics.md](./research/researcher-01-token-metrics.md)
- Docs: [hooks README](../../.claude/hooks/README.md), [.env.example](../../.claude/.env.example)

## Overview
- **Date:** 2026-02-24
- **Description:** UserPromptSubmit hook estimating context window usage from transcript size and injecting budget warnings
- **Priority:** P1 (self-regulation prevents context overflow mid-session)
- **Implementation Status:** PLANNED
- **Review Status:** PENDING

## Key Insights (from research)
- Claude Code context window ~200K tokens; practical budget ~180K input tokens
- Transcript file size / 4 approximates token count (1 token ~ 4 bytes)
- Industry pattern (AutoGPT/LangChain): warn at 70%, critical at 85%
- Injection via `additionalContext` in UserPromptSubmit -- agent sees signal before processing user prompt
- Must run alongside existing `dev-rules-reminder.cjs` without conflict

## Requirements
1. New UserPromptSubmit hook (separate from dev-rules-reminder.cjs -- separation of concerns)
2. Read transcript file, estimate token usage from file size
3. Inject `CONTEXT_BUDGET_WARNING` at >70% or `CONTEXT_BUDGET_CRITICAL` at >85%
4. Thresholds configurable via `.claude/.env`: `CONTEXT_BUDGET_WARN=70`, `CONTEXT_BUDGET_CRITICAL=85`
5. Total budget configurable: `CONTEXT_BUDGET_TOTAL=180000` (tokens)
6. Non-blocking: exit 0 always
7. <120 LOC

## Architecture

### Files to Create
| File | Description |
|------|-------------|
| `.claude/hooks/context-budget-reminder.cjs` | UserPromptSubmit hook -- estimates context usage, injects warnings |

### Files to Modify
| File | Change |
|------|--------|
| `.claude/settings.json` | Add second UserPromptSubmit hook entry |
| `.claude/.env.example` | Add context budget threshold variables |

### settings.json Change
```json
"UserPromptSubmit": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "node .claude/hooks/dev-rules-reminder.cjs"
      }
    ]
  },
  {
    "hooks": [
      {
        "type": "command",
        "command": "node .claude/hooks/context-budget-reminder.cjs"
      }
    ]
  }
]
```

### .env.example Additions
```bash
# Context Budget Awareness (Phase 03)
CONTEXT_BUDGET_TOTAL=180000
CONTEXT_BUDGET_WARN=70
CONTEXT_BUDGET_CRITICAL=85
```

## Related Code Files
- `.claude/hooks/dev-rules-reminder.cjs` -- same hook type, reference for transcript reading + stdout output
- `.claude/.env.example` -- env var documentation pattern
- `.claude/scripts/resolve_env.py` -- env resolution hierarchy (not used directly; hook reads .env manually)

## Implementation Steps

1. **Create budget reminder hook** `.claude/hooks/context-budget-reminder.cjs`

2. **Load config from .env** (simple key=value parser, no dependency)
   ```javascript
   function loadEnvConfig() {
     const defaults = { CONTEXT_BUDGET_TOTAL: 180000, CONTEXT_BUDGET_WARN: 70, CONTEXT_BUDGET_CRITICAL: 85 };
     try {
       const envPath = path.join(__dirname, '..', '.env');
       if (!fs.existsSync(envPath)) return defaults;
       const content = fs.readFileSync(envPath, 'utf-8');
       const vars = {};
       content.split('\n').forEach(line => {
         const trimmed = line.trim();
         if (!trimmed || trimmed.startsWith('#')) return;
         const [key, ...rest] = trimmed.split('=');
         vars[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
       });
       return {
         CONTEXT_BUDGET_TOTAL: parseInt(vars.CONTEXT_BUDGET_TOTAL) || defaults.CONTEXT_BUDGET_TOTAL,
         CONTEXT_BUDGET_WARN: parseInt(vars.CONTEXT_BUDGET_WARN) || defaults.CONTEXT_BUDGET_WARN,
         CONTEXT_BUDGET_CRITICAL: parseInt(vars.CONTEXT_BUDGET_CRITICAL) || defaults.CONTEXT_BUDGET_CRITICAL,
       };
     } catch { return defaults; }
   }
   ```

3. **Estimate context usage**
   ```javascript
   function estimateTokens(transcriptPath) {
     if (!transcriptPath || !fs.existsSync(transcriptPath)) return 0;
     const stats = fs.statSync(transcriptPath);
     return Math.round(stats.size / 4); // 1 token ~ 4 bytes
   }
   ```

4. **Signal injection logic**
   - Compute `usagePercent = (estimatedTokens / TOTAL) * 100`
   - If `>= CRITICAL`: output `CONTEXT_BUDGET_CRITICAL` signal with instructions to use Grep/Glob only, compress outputs, avoid Read on large files
   - Else if `>= WARN`: output `CONTEXT_BUDGET_WARNING` signal with instructions to shorten responses, prefer summaries over full content
   - Else: exit silently (no output = no additionalContext)

5. **Warning message format**
   ```
   ## CONTEXT_BUDGET_WARNING ({percent}% used, ~{tokens}K/{total}K tokens)
   - Shorten responses; prefer summaries over full content
   - Avoid reading large files; use Grep for targeted search
   - Compress report outputs
   ```
   ```
   ## CONTEXT_BUDGET_CRITICAL ({percent}% used, ~{tokens}K/{total}K tokens)
   - LIGHTWEIGHT MODE: Use only Grep/Glob for search
   - Do NOT Read large files
   - Maximum 50 lines per response
   - Consider archiving context or starting new session
   ```

6. **Register in settings.json**
   - Add as second entry in `UserPromptSubmit` array

7. **Update .env.example**
   - Add budget threshold variables with documentation comments

8. **Manual test**
   - Create mock transcript file of known size (e.g., 500KB = ~125K tokens = 69%)
   - Pipe payload: `echo '{"transcript_path":"/tmp/mock-transcript.txt"}' | node .claude/hooks/context-budget-reminder.cjs`
   - Verify no warning at 69%
   - Create 600KB file (150K tokens = 83%) -- verify WARNING
   - Create 700KB file (175K tokens = 97%) -- verify CRITICAL

## Todo List
- [ ] Create `.claude/hooks/context-budget-reminder.cjs`
- [ ] Add env config loading with defaults
- [ ] Implement transcript size estimation
- [ ] Implement threshold-based signal injection
- [ ] Register second UserPromptSubmit hook in `.claude/settings.json`
- [ ] Update `.claude/.env.example` with budget variables
- [ ] Manual test at each threshold boundary

## Success Criteria
- Warning appears when context usage exceeds configured thresholds
- No false warnings on small/new sessions
- dev-rules-reminder.cjs continues working independently
- Configurable via .env without code changes

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Token estimation inaccuracy (4 bytes/token assumption) | Medium | Low | Conservative threshold; 70% warn gives 30% safety margin |
| Transcript path not provided in payload | Low | Low | Return 0 tokens if missing (fail-open) |
| Two UserPromptSubmit hooks causing latency | Low | Low | Both hooks are <10ms; run sequentially by Claude Code |
| .env file parsing edge cases | Low | Low | Fallback to defaults on any parse error |

## Security Considerations
- Reads only transcript file (already accessible to the agent)
- No external network calls
- Env config is local-only
- No secrets in warning messages

## Next Steps
- If Phase 1 telemetry is implemented, context budget could also sum JSONL byte totals for more accurate tracking (future enhancement)
- Consider adding `CONTEXT_BUDGET_ARCHIVE` threshold at 95% that auto-suggests session restart

## Unresolved Questions
1. Do multiple UserPromptSubmit hooks accumulate `additionalContext`? (Assumed yes -- each hook's stdout is appended)
2. Is `fs.statSync` fast enough on the transcript file? (Yes -- stat is metadata-only, no file read)
3. Does transcript_path exist in UserPromptSubmit payload? (Research confirms yes for all hook types)
