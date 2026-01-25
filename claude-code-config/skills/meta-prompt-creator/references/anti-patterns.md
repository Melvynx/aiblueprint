<overview>
Common prompt mistakes and how to avoid them.
</overview>

<anti_patterns>
<pitfall name="vague_instructions">
BAD: "Help with the data"
GOOD: "Extract emails from CSV, remove duplicates, output as JSON array"
</pitfall>

<pitfall name="negative_prompting">
BAD: "Don't use technical jargon"
GOOD: "Write in plain language for non-technical readers"

Negative instructions can backfire - state what to do instead.
</pitfall>

<pitfall name="no_examples">
BAD: Describing format in words only
GOOD: Showing 2-3 concrete input/output examples

Examples communicate nuances words cannot.
</pitfall>

<pitfall name="missing_edge_cases">
BAD: "Process the file"
GOOD: "Process the file. If empty, return []. If malformed, return error with line number."
</pitfall>

<pitfall name="ambiguous_language">
BAD: "Try to keep it short", "Maybe add examples"
GOOD: "Maximum 3 paragraphs", "Include 2 examples"
</pitfall>

<pitfall name="no_success_criteria">
BAD: "Analyze the data"
GOOD: "Analyze the data. Success: identify top 3 trends with supporting metrics."
</pitfall>

<pitfall name="too_many_options">
BAD: "You can use library A, B, C, D, or E..."
GOOD: "Use library A. For edge case X, use B instead."

Provide one default with escape hatch.
</pitfall>

<pitfall name="inconsistent_terminology">
BAD: Mixing "API endpoint", "URL", "route", "path"
GOOD: Pick one term and use consistently throughout
</pitfall>
</anti_patterns>

<testing>
Ask: "Could I hand these instructions to someone with no context and expect correct results?"

If unclear to a human, it's unclear to the model.
</testing>
