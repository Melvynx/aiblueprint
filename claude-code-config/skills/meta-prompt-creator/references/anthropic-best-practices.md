<overview>
Claude-specific prompting techniques from Anthropic's official documentation.
</overview>

<techniques>
<technique name="xml_tags">
Claude was trained with XML tags. Use them for structure:
- `<context>` - Background information
- `<instructions>` - Task description
- `<document>` - Content to process
- `<example>` - Input/output pairs
</technique>

<technique name="be_explicit">
State exactly what you want:
- Use "Always..." or "Never..." instead of "try to"
- Specify format, length, style explicitly
- Add context about WHY (helps Claude make better decisions)
</technique>

<technique name="extended_thinking">
For complex reasoning:
- Add "Think step by step"
- Guide: "First analyze X, then consider Y, finally conclude Z"
</technique>

<technique name="prefilling">
Start Claude's response to enforce format:
- Begin with `{"result":` for JSON
- Prevents preamble text
</technique>

<technique name="positive_framing">
State what TO DO, not what NOT to do:
- BAD: "Don't use jargon"
- GOOD: "Write in plain language for non-technical readers"
</technique>

<technique name="prompt_chaining">
Break complex tasks into steps:
- Output of one prompt becomes input for next
- Each step has clear, focused objective
</technique>
</techniques>

<claude_4_specific>
<extended_thinking>
- Leverage extended thinking for complex tasks
- Use trigger phrases: "Thoroughly analyze...", "Consider multiple approaches..."
- Extended thinking tokens count toward context but are auto-stripped from subsequent turns
</extended_thinking>

<parallel_tools>
- Direct parallel tool calls explicitly
- "Invoke all independent operations simultaneously"
- Improves performance for file reads, searches, API calls
</parallel_tools>

<investigation_first>
- Instruct to investigate/read files BEFORE answering
- "Read existing implementation before proposing changes"
- Prevents hallucination and ensures context-aware responses
</investigation_first>

<context_awareness>
**Claude Sonnet 4.5 and Haiku 4.5** have built-in context awareness:
- Track remaining token budget throughout conversation
- Receive periodic updates on capacity
- Manage long-running tasks more effectively

For systems with automatic context compaction (like Claude Code):
```xml
<context>
Your context window will be automatically compacted as it approaches
its limit, allowing you to continue working indefinitely from where
you left off.
</context>
```

This prevents Claude from stopping work prematurely.
</context_awareness>

<long_horizon_tasks>
For tasks spanning multiple context windows:

**State tracking:**
- Use structured formats (JSON) for task status
- Use unstructured notes (progress.txt) for context
- Leverage git for work logs and checkpoints

**Instructions pattern:**
```xml
<instructions>
Work systematically through all tasks. Track progress in:
- progress.json (structured status)
- progress.txt (session notes)
- git commits (implementation history)

If context refreshes, review these files to resume.
</instructions>
```

**Test-first pattern:**
```xml
<requirements>
Create all tests in tests.json first. It is unacceptable to
remove or edit tests - they are the source of truth.
</requirements>
```

See: [context-management.md](context-management.md) for comprehensive patterns.
</long_horizon_tasks>

<context_window_management>
**Size limits:**
- Standard: 200K tokens
- Enterprise: 500K tokens
- Sonnet 4/4.5 (beta): 1M tokens

**Best practices:**
- Plan for context accumulation
- Use token counting API for estimates
- Consider premium pricing (>200K = 2x input, 1.5x output)
- Images count toward budget
</context_window_management>
</claude_4_specific>
