<overview>
Ready-to-use prompt templates for common tasks.
</overview>

<templates>
<template name="analysis">
```xml
<context>
[Background information]
</context>

<objective>
Analyze [subject] to identify [what to find].
</objective>

<data>
[Content to analyze]
</data>

<output_format>
## Key Findings
- Finding 1 with evidence
- Finding 2 with evidence

## Recommendations
1. Action item
2. Action item
</output_format>
```
</template>

<template name="transformation">
```xml
<objective>
Transform [input type] to [output type].
</objective>

<input>
[Data to transform]
</input>

<rules>
1. [Transformation rule]
2. [Transformation rule]
</rules>

<edge_cases>
- If [condition], then [action]
- If [condition], then [action]
</edge_cases>

<example>
<input>[Sample input]</input>
<output>[Expected output]</output>
</example>
```
</template>

<template name="generation">
```xml
<context>
[Background and purpose]
</context>

<task>
Generate [what to create] for [audience/purpose].
</task>

<requirements>
- [Requirement 1]
- [Requirement 2]
</requirements>

<style>
- Tone: [formal/casual/technical]
- Length: [specific constraints]
- Format: [structure requirements]
</style>

<example>
[Sample of desired output]
</example>
```
</template>

<template name="code_review">
```xml
<objective>
Review code for [bugs/security/performance/style].
</objective>

<code>
[Code to review]
</code>

<focus_areas>
- [Area 1]
- [Area 2]
</focus_areas>

<output_format>
For each issue:
- Location: [file:line]
- Severity: [critical/warning/suggestion]
- Issue: [description]
- Fix: [code example]
</output_format>
```
</template>
</templates>
