<overview>
XML tags provide consistent parsing and semantic meaning for Claude.
</overview>

<benefits>
- Clear section boundaries
- Semantic meaning built-in
- Lower token usage than markdown
- Programmatically parseable
</benefits>

<common_tags>
- `<context>` - Background information
- `<objective>` - What to accomplish
- `<instructions>` - Step-by-step task
- `<constraints>` - Rules and limitations
- `<document>` - Content to process
- `<example>` - Input/output pairs
- `<output>` - Expected format
- `<success_criteria>` - Verification criteria
</common_tags>

<nesting>
```xml
<examples>
<example number="1">
<input>User input</input>
<output>Expected output</output>
</example>
</examples>
```
</nesting>

<reference_pattern>
Reference tags by name: "Using the schema in `<schema>` tags..."
</reference_pattern>
