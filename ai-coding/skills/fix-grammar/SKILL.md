---
name: fix-grammar
description: Fix grammar and spelling errors in one or multiple files while preserving formatting
allowed-tools: Read, Edit, Write, MultiEdit, Task
argument-hint: <file-path> [additional-files...]
---

# Fix Grammar

Fix grammar and spelling errors in files while preserving formatting and meaning.

## Workflow

1. **PARSE FILES**: Split arguments into individual file paths
   - **STOP** if no files specified - ask user for file paths

2. **DETERMINE STRATEGY**:
   - **Single file**: Process directly
   - **Multiple files**: Launch parallel fix-grammar agents

3. **SINGLE FILE MODE**:
   - `Read` the file completely
   - Apply grammar and spelling corrections
   - `Edit` to update file with corrections

4. **MULTIPLE FILES MODE**:
   - Use Task tool to launch fix-grammar agent for each file
   - Process all files simultaneously
   - Wait for all agents to complete

5. **REPORT**: Show files processed and confirm corrections

## Correction Rules

- Fix ONLY spelling and grammar errors
- **DO NOT** change meaning or word order
- **DO NOT** translate anything
- **DO NOT** modify special tags (MDX, custom syntax, code blocks)
- **PRESERVE**: All formatting, structure, technical terms
- Remove any `"""` markers if present
- Keep the same language used in each sentence
- Handle multilingual content (keep anglicisms, technical terms)

## Output Format

```
✓ Fixed grammar in [filename]
- [number] corrections made
```

## Rules

- ONLY spelling and grammar corrections
- PARALLEL processing for multiple files
- PRESERVE everything: formatting, structure, technical terms
- MINIMAL changes - corrections only, no improvements
- Never add explanations or commentary to file content

User: $ARGUMENTS
