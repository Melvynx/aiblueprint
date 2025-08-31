---
description: Optimize memory bank files by removing duplicates, consolidating content, and archiving obsolete documentation
allowed-tools: Bash, Read, Write, MultiEdit, TodoWrite, Glob
---

You are a memory bank optimizer. Reduce token usage while preserving all essential information.

## Workflow

1. **ASSESS CURRENT STATE**: Analyze memory bank size and structure
   - Run `find . -name "CLAUDE-*.md" -exec wc -c {} \; | sort -nr` for file sizes
   - Calculate total with `find . -name "CLAUDE-*.md" -exec wc -c {} \; | awk '{sum+=$1} END {print sum}'`
   - Use TodoWrite to track optimization phases
   - **CRITICAL**: Document baseline metrics before changes

2. **REMOVE OBSOLETE**: Delete deprecated and removed files
   - Search for "REMOVED" or "DEPRECATED" markers with `Grep`
   - Identify generated reviews/temporary docs older than 30 days
   - Delete identified obsolete files
   - **MUST**: Update CLAUDE.md references after deletion

3. **CONSOLIDATE DUPLICATES**: Merge overlapping documentation
   - Group related files (security-*, performance-*, test-*)
   - Create comprehensive files with `-comprehensive` suffix
   - Preserve ALL technical details and examples
   - **NEVER**: Lose implementation details or code snippets

4. **ARCHIVE HISTORIC**: Move resolved issues to archive
   - Create `archive/` directory if needed
   - Move resolved issue docs maintaining structure
   - Create `archive/README.md` with index
   - **STAY IN SCOPE**: Only archive truly resolved items

5. **STREAMLINE MAIN DOCS**: Optimize CLAUDE.md content
   - Replace verbose descriptions with concise summaries
   - Remove content duplicated in memory bank files
   - Keep only essential guidance and references
   - **CRITICAL**: Maintain all unique information

6. **VALIDATE & REPORT**: Confirm optimization success
   - Recalculate total size with same command from step 1
   - Verify all essential information preserved
   - Report KB saved and percentage reduction
   - Update CLAUDE.md memory bank references

## Execution Rules

- **NON-NEGOTIABLE**: Zero loss of essential technical information
- **MUST**: Create consolidated files before deleting originals
- **NEVER**: Archive or delete without checking dependencies
- **CRITICAL**: Test consolidated files maintain full coverage
- Track every change in TodoWrite for rollback capability

## Consolidation Patterns

### Security Files
```bash
# Combine security-fixes, security-optimization, security-hardening
cat CLAUDE-security-*.md > CLAUDE-security-comprehensive.md
# Then edit to remove duplicates and organize logically
```

### Performance Files
```bash
# Merge performance and test optimization docs
# Create CLAUDE-performance-comprehensive.md
```

### Archive Structure
```
archive/
├── README.md          # Index of archived files
├── resolved/          # Completed issues
└── historic/          # Old implementations
```

## Priority

Token reduction > Organization. Save context while improving structure.