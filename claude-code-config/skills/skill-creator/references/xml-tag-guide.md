<overview>
Complete guide to XML tags and structure for Claude Code skills. Skills must use pure XML structure (no markdown headings) for consistent parsing and efficient token usage.
</overview>

<critical_rule>
**Remove ALL markdown headings (#, ##, ###) from skill body content.**

Replace with semantic XML tags. Keep markdown formatting WITHIN content (bold, italic, lists, code blocks, links).

❌ **Bad**:

```markdown
# PDF Processing

## Quick start

Extract text...

## Advanced features

Form filling...
```

✅ **Good**:

```xml
<objective>
PDF processing with text extraction, form filling, and merging.
</objective>

<quick_start>
Extract text...
</quick_start>

<advanced_features>
Form filling...
</advanced_features>
```

</critical_rule>

<required_tags>
Every skill MUST have these three tags:

<tag name="objective">
**Purpose**: What the skill does and why it matters

**Content**: 1-3 paragraphs explaining the skill's purpose and value

**Example**:

```xml
<objective>
Extract text and tables from PDF files, fill forms, and merge documents using Python libraries.

This skill provides comprehensive PDF processing capabilities for data extraction, form automation, and document manipulation tasks.
</objective>
```

</tag>

<tag name="quick_start">
**Purpose**: Immediate, actionable guidance

**Content**: Minimal working example to get started quickly

**Example**:

````xml
<quick_start>
Extract text with pdfplumber:

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
````

Extract tables:

```python
with pdfplumber.open("file.pdf") as pdf:
    tables = pdf.pages[0].extract_tables()
```

</quick_start>

````
</tag>

<tag name="success_criteria">
**Purpose**: How to know the task was completed correctly

**Content**: Specific, measurable criteria for success

**Alternative**: Can use `<when_successful>` instead

**Example**:
```xml
<success_criteria>
- Text extracted successfully from PDF
- Output is clean and properly formatted
- No encoding errors
- Tables parsed into structured data
</success_criteria>
````

Or:

```xml
<when_successful>
The task is successful when:
- All pages processed without errors
- Output matches expected format
- Data is complete and accurate
</when_successful>
```

</tag>
</required_tags>

<conditional_tags>
Add based on skill complexity and domain requirements:

<tag name="context">
**When to use**: Background information needed to understand the skill

**Content**: Situational context, domain background, prerequisites

**Example**:

```xml
<context>
PDF files use the Portable Document Format standard, which encapsulates fonts, images, and layout information. Text extraction requires parsing this structure while preserving meaning.

Modern PDF libraries like pdfplumber provide high-level APIs for extraction while handling the underlying complexity.
</context>
```

</tag>

<tag name="workflow">
**When to use**: Step-by-step procedures needed

**Content**: Numbered or ordered steps to complete a task

**Alternative**: Can use `<process>` instead

**Example**:

```xml
<workflow>
1. **Analyze PDF structure**: Use `pdfplumber.open()` to inspect pages
2. **Extract content**: Call `extract_text()` or `extract_tables()`
3. **Process data**: Clean and structure extracted content
4. **Validate output**: Verify completeness and accuracy
5. **Save results**: Write to JSON, CSV, or database
</workflow>
```

</tag>

<tag name="advanced_features">
**When to use**: Deep-dive topics for experienced users

**Content**: Complex features, optimizations, edge cases

**Example**:

````xml
<advanced_features>
<form_filling>
Fill PDF forms programmatically:

```python
from pdfrw import PdfReader, PdfWriter

template_pdf = PdfReader('template.pdf')
# Modify form fields
PdfWriter('filled.pdf', trailer=template_pdf).write()
````

See [references/form-filling.md](references/form-filling.md) for complete guide.
</form_filling>

<performance_optimization>
For large PDFs, process pages in parallel. See [references/performance.md](references/performance.md).
</performance_optimization>
</advanced_features>

````
</tag>

<tag name="validation">
**When to use**: Output verification is critical

**Content**: How to verify outputs are correct

**Example**:
```xml
<validation>
<text_extraction>
Verify extracted text:
- Check character count matches expected range
- Ensure no mojibake (encoding issues)
- Validate special characters preserved
</text_extraction>

<table_extraction>
Verify extracted tables:
- Row count matches PDF
- Column alignment preserved
- Numeric values unchanged
</table_extraction>
</validation>
````

</tag>

<tag name="examples">
**When to use**: Multiple examples help understanding

**Content**: Multi-shot learning examples with input/output pairs

**Example**:

````xml
<examples>
<example number="1">
<task>Extract text from simple PDF</task>
<code>
```python
import pdfplumber
with pdfplumber.open("simple.pdf") as pdf:
    text = pdf.pages[0].extract_text()
    print(text)
````

</code>
<output>
This is the text from the PDF...
</output>
</example>

<example number="2">
<task>Extract tables with custom settings</task>
<code>
```python
with pdfplumber.open("tables.pdf") as pdf:
    table = pdf.pages[0].extract_table({
        "vertical_strategy": "lines",
        "horizontal_strategy": "lines"
    })
```
</code>
</example>
</examples>
```
</tag>

<tag name="anti_patterns">
**When to use**: Common mistakes should be avoided

**Content**: Bad practices with explanations and alternatives

**Example**:

````xml
<anti_patterns>
<pitfall name="reading_entire_pdf">
❌ **Bad**: Reading entire PDF into memory at once

```python
text = "".join([page.extract_text() for page in pdf.pages])
````

**Why bad**: Large PDFs cause memory issues

✅ **Good**: Process page by page

```python
for page in pdf.pages:
    text = page.extract_text()
    process(text)
```

</pitfall>
</anti_patterns>
```
</tag>

<tag name="security_checklist">
**When to use**: Security is critical (APIs, auth, payments)

**Content**: Non-negotiable security patterns and checks

**Example**:

```xml
<security_checklist>
**Before deploying**:

- [ ] API keys stored in environment variables (never hardcoded)
- [ ] Input validation for all user-provided data
- [ ] Rate limiting implemented
- [ ] Error messages don't leak sensitive information
- [ ] HTTPS used for all API calls
- [ ] Authentication tokens refreshed properly
</security_checklist>
```

</tag>

<tag name="testing">
**When to use**: Testing workflows are important

**Content**: How to test the skill's functionality

**Example**:

````xml
<testing>
<unit_tests>
Test individual functions:

```python
def test_extract_text():
    with pdfplumber.open("test.pdf") as pdf:
        text = pdf.pages[0].extract_text()
        assert len(text) > 0
        assert "expected content" in text
````

</unit_tests>

<integration_tests>
Test full workflow:

```python
def test_full_extraction():
    result = extract_pdf_to_json("input.pdf")
    assert result["page_count"] == 5
    assert len(result["text"]) > 1000
```

</integration_tests>
</testing>

````
</tag>

<tag name="common_patterns">
**When to use**: Reusable code patterns exist

**Content**: Code examples and recipes for common tasks

**Example**:
```xml
<common_patterns>
<pattern name="batch_processing">
Process multiple PDFs:

```python
from pathlib import Path

pdf_dir = Path("pdfs/")
for pdf_file in pdf_dir.glob("*.pdf"):
    with pdfplumber.open(pdf_file) as pdf:
        text = pdf.pages[0].extract_text()
        output_file = pdf_file.with_suffix(".txt")
        output_file.write_text(text)
````

</pattern>

<pattern name="error_handling">
Handle corrupted PDFs gracefully:

```python
try:
    with pdfplumber.open(pdf_path) as pdf:
        text = pdf.pages[0].extract_text()
except Exception as e:
    print(f"Failed to process {pdf_path}: {e}")
    continue
```

</pattern>
</common_patterns>
```
</tag>

<tag name="reference_guides">
**When to use**: Detailed content exists in reference files

**Content**: Links to reference files with descriptions

**Alternative**: Can use `<detailed_references>` instead

**Example**:

```xml
<reference_guides>
For deeper topics, see reference files:

- **`references/form-filling.md`** - Complete guide to PDF form filling
- **`references/performance.md`** - Performance optimization techniques
- **`references/troubleshooting.md`** - Common issues and solutions
- **`references/api-reference.md`** - Complete API documentation
</reference_guides>
```

</tag>
</conditional_tags>

<xml_nesting>
<principle>
Properly nest XML tags for hierarchical content. Always close tags.
</principle>

<examples>
<simple_nesting>
```xml
<objective>
Content here
</objective>
```
</simple_nesting>

<nested_structure>

```xml
<examples>
<example number="1">
<input>User input here</input>
<output>Expected output here</output>
</example>

<example number="2">
<input>Another input</input>
<output>Another output</output>
</example>
</examples>
```

</nested_structure>

<deep_nesting>

````xml
<advanced_features>
<feature_a>
<overview>Feature A overview</overview>
<usage>
```python
# Code example
````

</usage>
</feature_a>

<feature_b>
<overview>Feature B overview</overview>
<usage>

```python
# Code example
```

</usage>
</feature_b>
</advanced_features>
```
</deep_nesting>
</examples>
</xml_nesting>

<tag_naming_conventions>
<use_descriptive_names>
Use descriptive, semantic names:

✅ `<workflow>` not `<steps>`
✅ `<success_criteria>` not `<done>`
✅ `<anti_patterns>` not `<dont_do>`
✅ `<reference_guides>` not `<links>`
</use_descriptive_names>

<be_consistent>
Be consistent within your skill. If you use `<workflow>`, don't also use `<process>` for the same purpose (unless they serve different roles).
</be_consistent>

<use_underscores>
For multi-word tag names, use underscores:

✅ `<success_criteria>`
✅ `<advanced_features>`
✅ `<reference_guides>`

Not hyphens or camelCase:

❌ `<success-criteria>`
❌ `<successCriteria>`
</use_underscores>
</tag_naming_conventions>

<markdown_within_xml>
<allowed_formatting>
Markdown formatting is allowed WITHIN XML tag content:

✅ **Bold**: `**text**`
✅ **Italic**: `*text*`
✅ **Lists**: `- item`
✅ **Code blocks**: ` ```python `
✅ **Links**: `[text](url)`
✅ **Inline code**: `` `code` ``

**Example**:

````xml
<quick_start>
Extract text with **pdfplumber**:

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
````

For _advanced_ usage, see [references/advanced.md](references/advanced.md).
</quick_start>

````
</allowed_formatting>

<not_allowed>
❌ **Markdown headings**: `# Heading`
❌ **Horizontal rules**: `---`
❌ **HTML tags**: `<div>` (unless they're semantic XML tags)
</not_allowed>
</markdown_within_xml>

<intelligence_rules>
<simple_skills>
**Use**: Required tags only

**Example domains**: Text extraction, file format conversion, simple API calls

```xml
<objective>...</objective>
<quick_start>...</quick_start>
<success_criteria>...</success_criteria>
````

</simple_skills>

<medium_skills>
**Use**: Required tags + workflow/examples as needed

**Example domains**: Document processing with steps, API integration with configuration

```xml
<objective>...</objective>
<quick_start>...</quick_start>
<workflow>...</workflow>
<examples>...</examples>
<success_criteria>...</success_criteria>
```

</medium_skills>

<complex_skills>
**Use**: Required tags + conditional tags as appropriate

**Example domains**: Payment processing, authentication systems, multi-step workflows with validation

```xml
<objective>...</objective>
<context>...</context>
<quick_start>...</quick_start>
<workflow>...</workflow>
<validation>...</validation>
<security_checklist>...</security_checklist>
<anti_patterns>...</anti_patterns>
<reference_guides>...</reference_guides>
<success_criteria>...</success_criteria>
```

</complex_skills>

<principle>
Don't over-engineer simple skills. Don't under-specify complex skills. Match tag selection to actual complexity and user needs.
</principle>
</intelligence_rules>

<validation_checklist>
Before finalizing, verify:

- [ ] No markdown headings in body (#, ##, ###)
- [ ] All required tags present (objective, quick_start, success_criteria)
- [ ] All XML tags properly closed
- [ ] Conditional tags appropriate for complexity
- [ ] Nested tags have correct indentation
- [ ] Tag names are descriptive and consistent
- [ ] Markdown formatting used only within tags
- [ ] Reference links use relative paths
</validation_checklist>
