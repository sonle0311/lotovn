# Phase 05: Scout Search Cache

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: None (extends existing scout-block.cjs pattern)
- Research: [researcher-02-compression-incremental.md](./research/researcher-02-compression-incremental.md)
- Docs: [hooks README](../../.claude/hooks/README.md), [.ckignore](../../.claude/.ckignore)

## Overview
- **Date:** 2026-02-24
- **Description:** PreToolUse hook caching Glob/Grep results to avoid redundant filesystem searches
- **Priority:** P2 (optimization; saves tokens on repeated searches)
- **Implementation Status:** PLANNED
- **Review Status:** PENDING

## Key Insights (from research)
- Cache key: hash of `{pattern + directory + git_HEAD_hash}`
- Git HEAD hash ensures cache invalidates on any commit
- JSON file per cache key in `.claude/scout-cache/`
- Significant speedup for repeated glob/grep patterns (common in multi-agent workflows)
- Must not interfere with scout-block.cjs (runs after blocking check)

## Requirements
1. PreToolUse hook on Glob and Grep tools
2. Compute cache key from tool_input pattern + path + git HEAD hash
3. If cache hit: output cached result via `additionalContext`, suggest skipping
4. If cache miss: allow tool to proceed (exit 0, no output)
5. PostToolUse companion: store result in cache after tool executes
6. Cache dir: `.claude/scout-cache/`, auto-created
7. TTL: until git HEAD changes (hash-based invalidation)
8. <150 LOC total across both hooks

## Architecture

### Files to Create
| File | Description |
|------|-------------|
| `.claude/hooks/scout-cache.cjs` | PreToolUse hook -- checks cache, injects cached results |
| `.claude/hooks/scout-cache-store.cjs` | PostToolUse hook -- stores tool results in cache |

### Files to Modify
| File | Change |
|------|--------|
| `.claude/settings.json` | Add PreToolUse entry for Glob\|Grep with scout-cache, PostToolUse entry for scout-cache-store |
| `.claude/.gitignore` | Add `scout-cache/` |

### settings.json Changes
```json
"PreToolUse": [
  {
    "matcher": "Bash|Glob|Grep|Read|Edit|Write",
    "hooks": [
      {
        "type": "command",
        "command": "node .claude/hooks/scout-block.cjs"
      }
    ]
  },
  {
    "matcher": "Glob|Grep",
    "hooks": [
      {
        "type": "command",
        "command": "node .claude/hooks/scout-cache.cjs"
      }
    ]
  }
]
```

PostToolUse addition:
```json
{
  "matcher": "Glob|Grep",
  "hooks": [
    {
      "type": "command",
      "command": "node .claude/hooks/scout-cache-store.cjs"
    }
  ]
}
```

## Related Code Files
- `.claude/hooks/scout-block.cjs` -- existing PreToolUse hook, runs before cache check
- `.claude/hooks/scout-block.sh` / `.claude/hooks/scout-block.ps1` -- platform scripts
- `.claude/settings.json` -- hook registration order matters

## Implementation Steps

1. **Cache key computation** (shared utility in both hooks)
   ```javascript
   const crypto = require('crypto');
   const { execSync } = require('child_process');

   function getGitHead() {
     try {
       return execSync('git rev-parse HEAD', { encoding: 'utf-8', timeout: 2000 }).trim();
     } catch { return 'no-git'; }
   }

   function cacheKey(toolInput) {
     const pattern = toolInput.pattern || toolInput.command || '';
     const dir = toolInput.path || toolInput.file_path || '.';
     const head = getGitHead();
     const raw = `${pattern}:${dir}:${head}`;
     return crypto.createHash('md5').update(raw).digest('hex');
   }
   ```

2. **Create PreToolUse cache hook** `.claude/hooks/scout-cache.cjs`
   - Read JSON from stdin
   - Compute cache key
   - Check if `.claude/scout-cache/{key}.json` exists
   - If exists: read cached data, output as `additionalContext`:
     ```
     SCOUT_CACHE_HIT: Results for "{pattern}" in "{dir}" (cached from {timestamp}).
     Cached results: {result_summary}
     Consider skipping this search if results are sufficient.
     ```
   - Exit 0 (non-blocking -- cannot actually skip tool, but agent can decide)

3. **Create PostToolUse cache store hook** `.claude/hooks/scout-cache-store.cjs`
   - Read JSON from stdin
   - Extract tool_input and tool_output (if available in PostToolUse payload)
   - Compute cache key
   - Write to `.claude/scout-cache/{key}.json`:
     ```json
     {
       "key": "abc123",
       "pattern": "*.md",
       "dir": ".",
       "git_head": "a1b2c3",
       "timestamp": 1708...,
       "result_summary": "Found 15 files matching *.md"
     }
     ```
   - Note: PostToolUse payload may not include full tool output; store what's available
   - Exit 0 always

4. **Cache directory management**
   - Auto-create `.claude/scout-cache/` on first use
   - Stale cache cleanup: on PreToolUse, if git HEAD differs from cached HEAD, delete all cache files
   - Simple approach: check any one cache file's `git_head`; if different, `rm -rf` cache dir contents

5. **Register hooks in settings.json**
   - PreToolUse: add scout-cache.cjs with `Glob|Grep` matcher (after scout-block)
   - PostToolUse: add scout-cache-store.cjs with `Glob|Grep` matcher

6. **Update .gitignore**
   - Add `.claude/scout-cache/`

7. **Manual test**
   - Run a Glob search, verify cache file created
   - Run same search again, verify cache hit message
   - Make a git commit, run again, verify cache miss (invalidated)

## Todo List
- [ ] Create `.claude/hooks/scout-cache.cjs` (PreToolUse cache checker)
- [ ] Create `.claude/hooks/scout-cache-store.cjs` (PostToolUse cache writer)
- [ ] Implement cache key hashing (pattern + dir + git HEAD)
- [ ] Implement stale cache cleanup on git HEAD change
- [ ] Register both hooks in `.claude/settings.json`
- [ ] Add `scout-cache/` to `.claude/.gitignore`
- [ ] Manual test: cache miss -> cache hit -> invalidation

## Success Criteria
- Repeated Glob/Grep with same pattern returns cache hit signal
- Cache auto-invalidates on git commit
- No interference with scout-block.cjs blocking behavior
- Cache files are small (<10KB each) and gitignored
- Fail-open: cache errors don't block tool execution

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `git rev-parse` slow or unavailable | Low | Medium | 2s timeout; fallback to `'no-git'` (cache still works, just never invalidates by commit) |
| Cache hit with stale data | Low | Low | Agent sees "cached from {timestamp}" and can choose to re-run |
| PostToolUse payload lacks tool output | Medium | Medium | Store only input metadata + timestamp; cache hit signals "same query was run before" |
| Hook ordering: scout-block before scout-cache | Low | High | Explicit ordering in settings.json; scout-block runs first, blocks if needed; scout-cache runs second |

## Security Considerations
- Cache files contain search patterns only, no file contents
- Local-only storage, gitignored
- MD5 hash for cache key is non-cryptographic but sufficient for dedup
- No code execution from cached data

## Next Steps
- Monitor cache hit rate; if low, consider expanding to Read tool (cache file contents by hash)
- Consider LRU eviction if cache dir grows large (YAGNI for now)

## Unresolved Questions
1. Does PostToolUse payload include `tool_output`? (Need to verify -- if not, cache stores metadata only, which is still useful as "this search was already done" signal)
2. Hook execution order: are multiple PreToolUse hooks with different matchers run in array order? (Assumed yes based on settings.json structure)
3. Non-git repos: should cache work without git? (Yes -- fallback to `'no-git'` key means cache never auto-invalidates, user must manually delete)
