<overview>
Clarity reduces errors and improves output quality.
</overview>

<golden_rule>
Show your prompt to someone with minimal context. If they're confused, the model will be too.
</golden_rule>

<guidelines>
<guideline name="specificity">
BAD: "Help with the report"
GOOD: "Generate markdown report with: Executive Summary, Key Findings, Recommendations"
</guideline>

<guideline name="sequential_steps">
Provide numbered instructions:
1. Extract data
2. Transform format
3. Validate
4. Save output
</guideline>

<guideline name="avoid_ambiguity">
Replace ambiguous phrases:
- "Try to..." → "Always..."
- "Should probably..." → "Must..."
- "Generally..." → "Always... except when..."
</guideline>

<guideline name="define_edge_cases">
Anticipate edge cases:
- What if no results?
- What if duplicates?
- What if invalid format?
</guideline>

<guideline name="output_format">
Specify format with example:
```json
{"name": "string", "email": "string"}
```
</guideline>

<guideline name="success_criteria">
Define success:
- All rows parsed
- No validation errors
- Output file created
</guideline>
</guidelines>

<show_dont_tell>
When format matters, show an example rather than describing it.
</show_dont_tell>
