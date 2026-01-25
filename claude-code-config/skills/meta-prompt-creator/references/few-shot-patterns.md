<overview>
Few-shot prompting uses input/output examples to guide model behavior.
</overview>

<when_to_use>
- Output format has nuances text can't capture
- Pattern recognition easier than rule following
- Edge cases need demonstration
- Consistency across outputs matters
</when_to_use>

<structure>
```xml
<examples>
<example number="1">
<input>Added user authentication</input>
<output>feat(auth): implement user authentication</output>
</example>

<example number="2">
<input>Fixed date display bug</input>
<output>fix(ui): correct date formatting</output>
</example>

<example number="3">
<input>Updated README</input>
<output>docs: update README with setup instructions</output>
</example>
</examples>
```
</structure>

<best_practices>
- Use 2-4 examples (usually sufficient)
- Cover common cases AND edge cases
- Ensure examples match desired behavior exactly
- Show variety in inputs
- Keep examples consistent in format
</best_practices>

<example_selection>
Choose examples that demonstrate:
1. Typical/common case
2. Edge case or exception
3. Format nuances (spacing, capitalization)
4. Boundary conditions
</example_selection>
