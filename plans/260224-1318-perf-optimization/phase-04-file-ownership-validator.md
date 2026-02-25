# Phase 04: File Ownership Validator

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: None (uses existing plan file conventions)
- Research: [researcher-02-compression-incremental.md](./research/researcher-02-compression-incremental.md)
- Docs: [commands reference](../../guide/COMMANDS.md), [development rules](../../.claude/workflows/development-rules.md)

## Overview
- **Date:** 2026-02-24
- **Description:** Python script + command to detect file ownership conflicts across parallel plan phases
- **Priority:** P1 (prevents merge conflicts in parallel agent work)
- **Implementation Status:** PLANNED
- **Review Status:** PENDING

## Key Insights (from research)
- Parallel phases may claim ownership of same files, causing conflicts
- YAML frontmatter `files_owned:` is easier to parse than prose markdown
- Support both YAML frontmatter and markdown `## Related code files` section parsing
- Python script preferred (existing scripts in `.claude/scripts/` are Python)
- New `/validate-ownership` command wraps the script

## Requirements
1. Parse all `phase-XX-*.md` files in the active plan directory
2. Extract file ownership from YAML frontmatter (`files_owned:`) or markdown sections
3. Build map: `{filepath -> [phase1, phase2, ...]}`
4. Report conflicts (file owned by 2+ phases) to stdout
5. Exit 0 if no conflicts, exit 1 if conflicts found
6. Command `/validate-ownership` invokes the script
7. <200 LOC for script, <30 lines for command

## Architecture

### Files to Create
| File | Description |
|------|-------------|
| `.claude/scripts/validate-file-ownership.py` | Parses phase files, detects ownership conflicts |
| `.claude/commands/validate-ownership.md` | Command wrapper invoking the script |

### Files to Modify
None. This is additive only.

### Ownership Format Convention (to standardize)

**Option A: YAML frontmatter** (preferred for new phase files)
```yaml
---
files_owned:
  - .claude/hooks/token-telemetry.cjs
  - .claude/settings.json
---
```

**Option B: Markdown section** (for existing phase files)
```markdown
## Architecture
### Files to Create
| File | Description |
|------|-------------|
| `.claude/hooks/token-telemetry.cjs` | ... |

### Files to Modify
| File | Change |
|------|--------|
| `.claude/settings.json` | ... |
```

Script must handle both formats.

## Related Code Files
- `.claude/scripts/resolve_env.py` -- reference for Python script patterns in this project
- `.claude/commands/scout.md` -- reference for command markdown format
- `.claude/active-plan` -- used to locate the active plan directory
- Existing `plans/*/phase-*.md` files -- test data

## Implementation Steps

1. **Create validation script** `.claude/scripts/validate-file-ownership.py`

2. **Plan directory detection**
   ```python
   def find_plan_dir():
       active_plan_file = Path('.claude/active-plan')
       if active_plan_file.exists():
           plan_path = active_plan_file.read_text().strip()
           plan_dir = Path(plan_path)
           if plan_dir.exists():
               return plan_dir
       # Fallback: find latest plan dir
       plans = sorted(Path('plans').glob('*/plan.md'), key=lambda p: p.stat().st_mtime, reverse=True)
       return plans[0].parent if plans else None
   ```

3. **YAML frontmatter parser**
   ```python
   def parse_yaml_frontmatter(content):
       if not content.startswith('---'):
           return {}
       end = content.find('---', 3)
       if end == -1:
           return {}
       frontmatter = content[3:end].strip()
       # Simple YAML list parser (no pyyaml dependency)
       files = []
       in_files_owned = False
       for line in frontmatter.split('\n'):
           if line.strip().startswith('files_owned:'):
               in_files_owned = True
               continue
           if in_files_owned:
               if line.strip().startswith('- '):
                   files.append(line.strip()[2:].strip())
               else:
                   in_files_owned = False
       return {'files_owned': files}
   ```

4. **Markdown table parser**
   - Scan for `### Files to Create` and `### Files to Modify` sections
   - Extract file paths from table rows: `| \`path\` | ... |`
   - Regex: `` r'\|\s*`?([^`|]+)`?\s*\|' ``

5. **Ownership map builder**
   ```python
   def build_ownership_map(plan_dir):
       ownership = {}  # {filepath: [phase_names]}
       for phase_file in sorted(plan_dir.glob('phase-*.md')):
           phase_name = phase_file.stem
           content = phase_file.read_text(encoding='utf-8')
           files = extract_owned_files(content)  # tries YAML first, then markdown
           for f in files:
               ownership.setdefault(f, []).append(phase_name)
       return ownership
   ```

6. **Conflict detection and reporting**
   ```python
   def report_conflicts(ownership):
       conflicts = {f: phases for f, phases in ownership.items() if len(phases) > 1}
       if not conflicts:
           print("No file ownership conflicts found.")
           return 0
       print(f"CONFLICTS FOUND: {len(conflicts)} file(s) owned by multiple phases\n")
       for filepath, phases in sorted(conflicts.items()):
           print(f"  {filepath}")
           for phase in phases:
               print(f"    - {phase}")
       return 1
   ```

7. **CLI entry point**
   - Accept optional `--plan-dir` argument
   - Accept `--format json` for machine-readable output
   - Default: human-readable table

8. **Create command** `.claude/commands/validate-ownership.md`
   ```markdown
   ---
   description: Validate file ownership across plan phases
   ---
   Run file ownership validation for the active plan:
   ```bash
   python .claude/scripts/validate-file-ownership.py
   ```
   Report any conflicts to the user and suggest resolution.
   ```

9. **Manual test**
   - Run against current plan (this one): should detect `.claude/settings.json` owned by phases 1, 2, 3
   - Create test plan with deliberate conflict -- verify detection

## Todo List
- [ ] Create `.claude/scripts/validate-file-ownership.py`
- [ ] Implement YAML frontmatter parser
- [ ] Implement markdown table file extraction
- [ ] Implement ownership map + conflict detection
- [ ] Create `.claude/commands/validate-ownership.md`
- [ ] Test against current plan directory
- [ ] Test with no-conflict scenario

## Success Criteria
- Detects files owned by 2+ phases
- Parses both YAML frontmatter and markdown table formats
- Works on Windows + macOS + Linux (Python 3, pathlib)
- Exit code 0 = clean, 1 = conflicts
- Output clear enough for agent or human to resolve

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Phase files don't follow expected format | Medium | Medium | Graceful fallback; log warning for unparseable files |
| No pyyaml installed | Low | Low | Custom simple YAML parser for frontmatter only |
| Path normalization across OS | Low | Medium | Use forward slashes consistently; normalize on comparison |

## Security Considerations
- Read-only script; no file modifications
- Operates only within project directory
- No external dependencies
- No network access

## Next Steps
- Phase 6 (Incremental Plan Update) uses ownership data to determine which phases need replanning
- Consider adding ownership validation as a PreToolUse hook on Write (future scope)

## Unresolved Questions
1. Should `files_owned` YAML frontmatter be mandatory in new phase files? (Recommend: yes for new, optional for legacy)
2. Is `.claude/settings.json` a legitimate shared file across phases? (Yes -- multiple phases modify it; not a conflict but a coordination point. Consider adding `shared_files:` list)
3. Should the command auto-run during `/plan` execution? (YAGNI for now; manual invocation via `/validate-ownership`)
