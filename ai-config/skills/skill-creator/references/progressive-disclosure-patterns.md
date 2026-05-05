<overview>
Advanced progressive disclosure strategies for organizing skill content efficiently across multiple files.
</overview>

<principle>
SKILL.md serves as an overview that points to detailed materials as needed. This keeps context window usage efficient while providing access to comprehensive documentation.
</principle>

<three_level_system>
Skills use a three-level loading system:

**Level 1: Metadata (always in context)**
- Name + description from YAML frontmatter
- ~100 words
- Always loaded for skill discovery

**Level 2: SKILL.md body (loaded when skill triggers)**
- Core concepts and quick start
- Essential procedures
- Pointers to level 3 resources
- Target: <500 lines ideal, <1000 max

**Level 3: Bundled resources (loaded as needed)**
- Detailed references (unlimited size)
- Examples and templates
- Scripts (may execute without loading)
</three_level_system>

<what_goes_where>
<skill_md_content>
**Include in SKILL.md** (always loaded when skill triggers):

- Core concepts and overview
- Essential procedures and workflows
- Quick reference tables
- Most common use cases
- Pointers to references/examples/scripts

**Keep under 500 lines, ideally 300-400 lines**
</skill_md_content>

<references_content>
**Move to references/** (loaded as needed):

- Detailed patterns and advanced techniques
- Comprehensive API documentation
- Migration guides
- Edge cases and troubleshooting
- Extensive examples and walkthroughs
- Domain-specific knowledge

**Each reference file can be large (2,000-5,000+ words)**
</references_content>

<examples_content>
**Move to examples/**:

- Complete, runnable scripts
- Configuration files
- Template files
- Real-world usage examples

**Users can copy and adapt these directly**
</examples_content>

<scripts_content>
**Move to scripts/**:

- Validation tools
- Testing helpers
- Parsing utilities
- Automation scripts

**Should be executable and documented**
</scripts_content>
</what_goes_where>

<organization_patterns>
<pattern name="high_level_guide">
**Use case**: Simple skill with some advanced features

Quick start in SKILL.md, details in reference files:

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, and merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---

<objective>
Extract text and tables from PDF files, fill forms, and merge documents using Python libraries.
</objective>

<quick_start>
Extract text with pdfplumber:

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
</quick_start>

<advanced_features>
**Form filling**: See [references/forms.md](references/forms.md)
**API reference**: See [references/api-reference.md](references/api-reference.md)
**Troubleshooting**: See [references/troubleshooting.md](references/troubleshooting.md)
</advanced_features>

<success_criteria>
- Text extracted successfully from PDF
- Output is clean and properly formatted
</success_criteria>
```

Claude loads forms.md or api-reference.md only when needed.
</pattern>

<pattern name="domain_organization">
**Use case**: Multiple domains within one skill

Organize by domain to avoid loading irrelevant context:

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── references/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

In SKILL.md:

```xml
<domain_references>
Query different domains with specialized references:

- **Finance data**: See [references/finance.md](references/finance.md)
- **Sales data**: See [references/sales.md](references/sales.md)
- **Product data**: See [references/product.md](references/product.md)
- **Marketing data**: See [references/marketing.md](references/marketing.md)
</domain_references>
```

When user asks about revenue, Claude reads only finance.md. Other files stay on filesystem consuming zero tokens.
</pattern>

<pattern name="conditional_details">
**Use case**: Different levels of expertise needed

Show basic content in SKILL.md, link to advanced in reference files:

```xml
<objective>
Process DOCX files with creation and editing capabilities.
</objective>

<quick_start>
<creating_documents>
Use docx-js for new documents. See [references/docx-js.md](references/docx-js.md).
</creating_documents>

<editing_documents>
For simple edits, modify XML directly.

**For tracked changes**: See [references/redlining.md](references/redlining.md)
**For OOXML details**: See [references/ooxml.md](references/ooxml.md)
</editing_documents>
</quick_start>
```

Claude reads redlining.md or ooxml.md only when the user needs those features.
</pattern>

<pattern name="progressive_complexity">
**Use case**: Beginner to advanced workflows

Layer complexity across multiple files:

```
skill-name/
├── SKILL.md (beginner quick start)
└── references/
    ├── intermediate.md (common patterns)
    ├── advanced.md (complex scenarios)
    └── expert.md (edge cases, optimizations)
```

In SKILL.md:

```xml
<quick_start>
Basic usage for common cases...
</quick_start>

<next_steps>
**Ready for more?**
- [Intermediate patterns](references/intermediate.md) - Common use cases
- [Advanced techniques](references/advanced.md) - Complex scenarios
- [Expert guide](references/expert.md) - Edge cases and optimizations
</next_steps>
```
</pattern>

<pattern name="feature_based">
**Use case**: Multiple independent features

Organize by feature:

```
skill-name/
├── SKILL.md (overview of all features)
└── references/
    ├── feature-a.md
    ├── feature-b.md
    └── feature-c.md
```

In SKILL.md:

```xml
<features>
This skill supports multiple features:

- **Feature A**: See [references/feature-a.md](references/feature-a.md)
- **Feature B**: See [references/feature-b.md](references/feature-b.md)
- **Feature C**: See [references/feature-c.md](references/feature-c.md)
</features>
```
</pattern>
</organization_patterns>

<critical_rules>
<one_level_deep>
**Keep references one level deep**: All reference files should link directly from SKILL.md.

❌ **Avoid nested references**:
```
SKILL.md → advanced.md → details.md → examples.md
```

✅ **Prefer flat structure**:
```
SKILL.md → advanced-details.md
SKILL.md → advanced-examples.md
```

**Why**: Claude may only partially read deeply nested files.
</one_level_deep>

<table_of_contents>
**Add table of contents to long files**: For reference files over 100 lines, include a table of contents at the top.

```xml
<contents>
- [Overview](#overview)
- [Basic Patterns](#basic-patterns)
- [Advanced Patterns](#advanced-patterns)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
</contents>
```
</table_of_contents>

<xml_in_references>
**Use pure XML in reference files**: Reference files should also use pure XML structure (no markdown headings in body).

This maintains consistency and parseability across all skill files.
</xml_in_references>
</critical_rules>

<practical_guidance>
<line_count_targets>
- **SKILL.md**: 300-500 lines ideal, <1000 max
- **Reference files**: 100-500 lines each (can be larger if needed)
- **Split when approaching limits**: Don't wait until files are huge
</line_count_targets>

<reference_linking>
Always use relative paths from SKILL.md:

```xml
See [references/patterns.md](references/patterns.md)
```

Not absolute paths:

```xml
See [~/.claude/skills/skill-name/references/patterns.md]
```
</reference_linking>

<descriptive_names>
Name reference files descriptively:

✅ `references/api-authentication.md`
✅ `references/error-handling-patterns.md`
✅ `references/database-schema.md`

❌ `references/doc1.md`
❌ `references/misc.md`
❌ `references/stuff.md`
</descriptive_names>
</practical_guidance>

<examples>
<example name="minimal_skill">
**When to use**: Simple, focused skills

```
skill-name/
└── SKILL.md (300 lines)
```

Good for: File format conversion, simple API calls, basic utilities
</example>

<example name="standard_skill">
**When to use**: Most skills

```
skill-name/
├── SKILL.md (400 lines)
├── references/
│   ├── patterns.md (300 lines)
│   └── advanced.md (400 lines)
└── examples/
    └── example.sh
```

Good for: API integrations, document processing, data analysis
</example>

<example name="complex_skill">
**When to use**: Multi-domain or security-critical skills

```
skill-name/
├── SKILL.md (500 lines)
├── references/
│   ├── domain-a.md (500 lines)
│   ├── domain-b.md (500 lines)
│   ├── security.md (300 lines)
│   └── troubleshooting.md (400 lines)
├── examples/
│   ├── basic.py
│   └── advanced.py
└── scripts/
    └── validate.sh
```

Good for: Payment processing, authentication, multi-step workflows
</example>
</examples>

<decision_tree>
**When to split content to references/**:

1. Is SKILL.md approaching 500 lines? → Split to references/
2. Does this section serve a specific subset of use cases? → Split to references/
3. Is this advanced/expert content? → Split to references/
4. Is this domain-specific knowledge? → Split to references/
5. Would most users skip this section? → Split to references/
6. Is this troubleshooting/edge cases? → Split to references/

**When to keep in SKILL.md**:

1. Is this core to understanding the skill? → Keep in SKILL.md
2. Would most users need this immediately? → Keep in SKILL.md
3. Is this part of the quick start? → Keep in SKILL.md
4. Is this a pointer to references? → Keep in SKILL.md
</decision_tree>
