<overview>
System prompts establish persistent behavior, role, and constraints.
</overview>

<structure>
```xml
<role>
You are an expert [domain] assistant specializing in [specific area].
</role>

<behavior>
- Always [key behavior]
- Never [prohibited action]
- When uncertain, [fallback behavior]
</behavior>

<output_style>
- Tone: [professional/casual/technical]
- Format: [structured/conversational]
- Length: [concise/detailed]
</output_style>

<constraints>
- Do not [limitation]
- Always verify [requirement]
- Prioritize [priority]
</constraints>
```
</structure>

<patterns>
<pattern name="expert_role">
"You are a senior software engineer with 10+ years of experience in distributed systems. You prioritize code quality, maintainability, and performance."
</pattern>

<pattern name="task_specific">
"You are a code reviewer. Analyze code for bugs, security issues, and performance problems. Provide specific, actionable feedback with code examples."
</pattern>

<pattern name="constrained">
"You are a technical writer. Write documentation in plain language. Avoid jargon. Use examples liberally. Keep paragraphs under 3 sentences."
</pattern>
</patterns>

<placement>
- System message: Role, persistent behavior, high-level context
- User message: Specific task, details, data to process
</placement>
