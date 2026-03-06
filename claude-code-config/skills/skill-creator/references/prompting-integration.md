<overview>
How to integrate expert prompting techniques from the create-prompt skill into skill creation. Every skill should apply proven prompting principles for maximum effectiveness.
</overview>

<core_principle>
Skills are specialized prompts that get loaded on-demand. All prompting best practices from create-prompt apply to skill creation, with emphasis on:

- Clear, specific instructions
- XML tags for structure
- Examples when format matters
- Success criteria defined
- Context management for long-running tasks
</core_principle>

<prompting_techniques_for_skills>
<technique name="be_clear_and_direct">
**Apply to skills by**:

- State exactly what Claude should do
- Avoid ambiguous language ("try to", "maybe", "generally")
- Use "Always..." or "Never..." instead of "Should probably..."
- Provide specific output format requirements

**Example in SKILL.md**:

❌ **Vague**:
```xml
<workflow>
Try to extract the data from the PDF. If it works, save it somewhere.
</workflow>
```

✅ **Clear**:
```xml
<workflow>
1. **Extract data**: Use `pdfplumber.open()` to read PDF
2. **Parse content**: Call `extract_text()` on each page
3. **Save output**: Write to JSON file with UTF-8 encoding
</workflow>
```
</technique>

<technique name="use_xml_tags">
**Apply to skills by**:

- Use pure XML structure (no markdown headings)
- Separate sections with semantic tags
- Wrap data in descriptive tags
- Define clear boundaries

Skills already enforce this through required structure. See [xml-tag-guide.md](xml-tag-guide.md).
</technique>

<technique name="few_shot_examples">
**Apply to skills by**:

Provide 2-4 input/output pairs when output format matters:

**Example in SKILL.md**:
```xml
<examples>
<example number="1">
<task>Extract product names from invoice PDF</task>
<code>
```python
with pdfplumber.open("invoice.pdf") as pdf:
    text = pdf.pages[0].extract_text()
    products = re.findall(r'Product: (.+)', text)
```
</code>
<output>
['Widget A', 'Gadget B', 'Tool C']
</output>
</example>

<example number="2">
<task>Extract table from financial report</task>
<code>
```python
with pdfplumber.open("report.pdf") as pdf:
    table = pdf.pages[1].extract_table()
```
</code>
<output>
[['Quarter', 'Revenue'],
 ['Q1', '$1.2M'],
 ['Q2', '$1.5M']]
</output>
</example>
</examples>
```
</technique>

<technique name="chain_of_thought">
**Apply to skills by**:

For complex tasks, add explicit reasoning steps:

**Example in SKILL.md**:
```xml
<workflow>
<step_1>
**Analyze PDF structure**: First, inspect the PDF to understand layout and content type. Use `pdfplumber.open()` to examine pages.
</step_1>

<step_2>
**Determine extraction method**: Based on structure, choose between:
- `extract_text()` for plain text
- `extract_table()` for tabular data
- Custom parsing for complex layouts
</step_2>

<step_3>
**Extract content**: Apply chosen method to each page, handling errors gracefully.
</step_3>

<step_4>
**Validate output**: Check for encoding issues, missing data, or formatting problems before saving.
</step_4>
</workflow>
```
</technique>

<technique name="success_criteria">
**Apply to skills by**:

Always include `<success_criteria>` tag with specific, measurable criteria:

**Example in SKILL.md**:
```xml
<success_criteria>
The extraction is successful when:

- All pages processed without errors
- Text encoding is correct (no mojibake)
- Output file created with expected structure
- Data completeness verified (no missing sections)
- File size is reasonable (not empty or corrupted)
</success_criteria>
```
</technique>

<technique name="context_management">
**Apply to skills by**:

For long-running tasks, add state tracking guidance:

**Example in SKILL.md**:
```xml
<workflow>
<state_tracking>
For large batches, track progress:

```python
import json
from pathlib import Path

progress_file = Path("progress.json")

# Load previous progress
if progress_file.exists():
    progress = json.loads(progress_file.read_text())
else:
    progress = {"processed": [], "failed": []}

# Process files
for pdf_file in pdf_files:
    if str(pdf_file) in progress["processed"]:
        continue  # Skip already processed

    try:
        extract_pdf(pdf_file)
        progress["processed"].append(str(pdf_file))
    except Exception as e:
        progress["failed"].append({"file": str(pdf_file), "error": str(e)})

    # Save progress after each file
    progress_file.write_text(json.dumps(progress, indent=2))
```
</state_tracking>
</workflow>
```
</technique>
</prompting_techniques_for_skills>

<skill_specific_patterns>
<pattern name="explicit_workflow">
**When to use**: Multi-step processes

Instead of vague instructions, provide explicit numbered steps:

❌ **Vague**:
```xml
<objective>
Process PDFs to extract data and save results.
</objective>
```

✅ **Explicit**:
```xml
<objective>
Extract structured data from PDF files through a 4-step process: analyze, extract, validate, save.
</objective>

<workflow>
1. **Analyze PDF structure**: Inspect layout and content type
2. **Extract content**: Apply appropriate extraction method
3. **Validate output**: Check completeness and encoding
4. **Save results**: Write to structured format (JSON/CSV)
</workflow>
```
</pattern>

<pattern name="anti_patterns_section">
**When to use**: Common mistakes exist

Help Claude avoid mistakes by showing bad vs good examples:

```xml
<anti_patterns>
<pitfall name="incorrect_encoding">
❌ **Bad**: Assuming UTF-8 encoding

```python
text = pdf.pages[0].extract_text()
file.write(text)  # May fail with encoding errors
```

**Why bad**: PDFs may use various encodings

✅ **Good**: Specify encoding explicitly

```python
text = pdf.pages[0].extract_text()
file.write(text, encoding='utf-8', errors='replace')
```
</pitfall>
</anti_patterns>
```
</pattern>

<pattern name="validation_guidance">
**When to use**: Output verification is important

Provide specific validation steps:

```xml
<validation>
<output_verification>
Verify extracted data quality:

1. **Completeness**: Check all expected sections present
2. **Accuracy**: Sample-check values against PDF
3. **Encoding**: Verify special characters preserved
4. **Structure**: Confirm JSON/CSV structure valid
</output_verification>

<automated_checks>
```python
def validate_output(output_file):
    """Validate extracted data."""
    with open(output_file) as f:
        data = json.load(f)

    assert "text" in data, "Missing text field"
    assert len(data["text"]) > 0, "Empty text"
    assert data["page_count"] > 0, "Invalid page count"

    return True
```
</automated_checks>
</validation>
```
</pattern>

<pattern name="progressive_examples">
**When to use**: Skills have multiple complexity levels

Start simple, build complexity:

```xml
<examples>
<example number="1" difficulty="beginner">
<task>Extract text from single page</task>
<code>
```python
import pdfplumber
with pdfplumber.open("simple.pdf") as pdf:
    text = pdf.pages[0].extract_text()
    print(text)
```
</code>
</example>

<example number="2" difficulty="intermediate">
<task>Extract all pages and save to file</task>
<code>
```python
with pdfplumber.open("document.pdf") as pdf:
    all_text = []
    for page in pdf.pages:
        all_text.append(page.extract_text())

    with open("output.txt", "w") as f:
        f.write("\n\n".join(all_text))
```
</code>
</example>

<example number="3" difficulty="advanced">
<task>Extract tables with custom settings and error handling</task>
<code>
```python
with pdfplumber.open("report.pdf") as pdf:
    tables = []
    for i, page in enumerate(pdf.pages):
        try:
            table = page.extract_table({
                "vertical_strategy": "lines",
                "horizontal_strategy": "text"
            })
            if table:
                tables.append({"page": i+1, "data": table})
        except Exception as e:
            print(f"Page {i+1} failed: {e}")

    with open("tables.json", "w") as f:
        json.dump(tables, f, indent=2)
```
</code>
</example>
</examples>
```
</pattern>
</skill_specific_patterns>

<integration_checklist>
When creating a skill, ensure you've applied these prompting techniques:

- [ ] **Clarity**: Instructions are specific and unambiguous
- [ ] **Structure**: Pure XML structure used throughout
- [ ] **Examples**: Included when output format matters
- [ ] **Success criteria**: Specific, measurable criteria defined
- [ ] **Workflow**: Multi-step processes broken down explicitly
- [ ] **Anti-patterns**: Common mistakes shown and avoided
- [ ] **Validation**: Output verification guidance provided
- [ ] **Context management**: State tracking for long-running tasks
- [ ] **Progressive complexity**: Examples range from simple to advanced
- [ ] **Error handling**: Edge cases and failures addressed
</integration_checklist>

<reference_create_prompt>
For detailed prompting techniques, consult the create-prompt skill:

- Clarity principles
- XML structure patterns
- Few-shot examples
- Chain of thought reasoning
- Context management strategies
- Anti-patterns to avoid

Use create-prompt when writing SKILL.md content to ensure expert-level prompting quality.
</reference_create_prompt>
