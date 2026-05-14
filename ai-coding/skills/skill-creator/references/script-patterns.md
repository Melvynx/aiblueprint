<overview>
Executable code patterns for skill scripts including error handling, package dependencies, and best practices.
</overview>

<when_to_use_scripts>
Even if Claude could write a script, pre-made scripts offer advantages:

- More reliable than generated code
- Save tokens (no need to include code in context)
- Save time (no code generation required)
- Ensure consistency across uses

<execution_vs_reference>
Make clear whether Claude should:

- **Execute the script** (most common): "Run `analyze_form.py` to extract fields"
- **Read it as reference** (for complex logic): "See `analyze_form.py` for the extraction algorithm"

For most utility scripts, execution is preferred.
</execution_vs_reference>

<how_scripts_work>
When Claude executes a script via bash:

1. Script code never enters context window
2. Only script output consumes tokens
3. Far more efficient than having Claude generate equivalent code
</how_scripts_work>
</when_to_use_scripts>

<directory_organization>
<best_practice>
Place all executable scripts in a `scripts/` subdirectory within the skill folder:

```
skill-name/
├── SKILL.md
├── scripts/
│   ├── main_utility.py
│   ├── helper_script.py
│   └── validator.py
└── references/
    └── api-docs.md
```

**Benefits**:
- Keeps skill root clean and organized
- Clear separation between documentation and executable code
- Consistent pattern across all skills
- Easy to reference: `python scripts/script_name.py`
</best_practice>

<reference_pattern>
In SKILL.md, reference scripts using the `scripts/` path:

```bash
python ~/.claude/skills/skill-name/scripts/analyze.py input.har
```
</reference_pattern>
</directory_organization>

<documentation_pattern>
<example>
In SKILL.md:

```xml
<utility_scripts>
**analyze_form.py**: Extract all form fields from PDF

```bash
python scripts/analyze_form.py input.pdf > fields.json
```

Output format:
```json
{
  "field_name": { "type": "text", "x": 100, "y": 200 },
  "signature": { "type": "sig", "x": 150, "y": 500 }
}
```

**validate_boxes.py**: Check for overlapping bounding boxes

```bash
python scripts/validate_boxes.py fields.json
# Returns: "OK" or lists conflicts
```

**fill_form.py**: Apply field values to PDF

```bash
python scripts/fill_form.py input.pdf fields.json output.pdf
```
</utility_scripts>
```
</example>
</documentation_pattern>

<error_handling>
<solve_dont_punt>
Handle error conditions rather than punting to Claude.

<good_example>
```python
def process_file(path):
    """Process a file, creating it if it doesn't exist."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        print(f"File {path} not found, creating default")
        with open(path, 'w') as f:
            f.write('')
        return ''
    except PermissionError:
        print(f"Cannot access {path}, using default")
        return ''
```
</good_example>

<bad_example>
```python
def process_file(path):
    # Just fail and let Claude figure it out
    return open(path).read()
```
</bad_example>
</solve_dont_punt>

<graceful_degradation>
**Principle**: Scripts should handle edge cases and fail gracefully with helpful error messages.

```python
def validate_config(config_path):
    """Validate configuration file."""
    if not os.path.exists(config_path):
        print(f"ERROR: Config file not found: {config_path}")
        print("Create it with: cp config.example.json {config_path}")
        sys.exit(1)

    try:
        with open(config_path) as f:
            config = json.load(f)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in {config_path}")
        print(f"Line {e.lineno}: {e.msg}")
        sys.exit(1)

    return config
```
</graceful_degradation>
</error_handling>

<configuration_values>
<document_constants>
Document configuration parameters to avoid "voodoo constants":

<good_example>
```python
# HTTP requests typically complete within 30 seconds
REQUEST_TIMEOUT = 30

# Three retries balances reliability vs speed
MAX_RETRIES = 3

# Rate limit: 100 requests per minute
RATE_LIMIT = 100
RATE_WINDOW = 60  # seconds
```
</good_example>

<bad_example>
```python
TIMEOUT = 47  # Why 47?
RETRIES = 5   # Why 5?
```
</bad_example>
</document_constants>
</configuration_values>

<package_dependencies>
<runtime_constraints>
Skills run in code execution environment with platform-specific limitations:

- **claude.ai**: Can install packages from npm and PyPI
- **Anthropic API**: No network access and no runtime package installation
</runtime_constraints>

<guidance>
List required packages in your SKILL.md and verify they're available.

<good_example>
In SKILL.md:

```xml
<requirements>
Install required package: `pip install pypdf`

Then use it:

```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```
</requirements>
```
</good_example>

<bad_example>
"Use the pdf library to process the file."
</bad_example>
</guidance>
</package_dependencies>

<script_templates>
<setup_script>
**Purpose**: Initialize project structure atomically

**Pattern**:
```bash
#!/bin/bash
# Setup Script - Creates all required files
# Usage: ./setup.sh <project-path> [options]

set -e  # Exit on error

PROJECT_PATH="${1:-.}"
OPTION="${2:-default}"

# Resolve absolute path
PROJECT_PATH=$(cd "$PROJECT_PATH" && pwd)
OUTPUT_DIR="$PROJECT_PATH/output"

echo "🚀 Setting up project in: $PROJECT_PATH"

# Create directory structure
mkdir -p "$OUTPUT_DIR"

# Create files with heredocs
cat > "$OUTPUT_DIR/config.json" << 'EOF'
{
  "version": "1.0.0",
  "created": "$(date +%Y-%m-%d)"
}
EOF

chmod +x "$OUTPUT_DIR/script.sh"
echo "✅ Setup complete"
```

**Key features**:
- Set -e for error handling
- Default values for arguments
- Absolute path resolution
- Heredocs for file creation
- Clear user feedback
</setup_script>

<validation_script>
**Purpose**: Validate data or configuration

**Pattern**:
```python
#!/usr/bin/env python3
"""Validate configuration file."""
import sys
import json
from pathlib import Path

def validate_config(config_path: Path) -> bool:
    """Validate configuration file structure."""
    if not config_path.exists():
        print(f"❌ Config not found: {config_path}")
        return False

    try:
        with open(config_path) as f:
            config = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: Line {e.lineno}: {e.msg}")
        return False

    # Validate required fields
    required = ["name", "version"]
    missing = [field for field in required if field not in config]

    if missing:
        print(f"❌ Missing required fields: {', '.join(missing)}")
        return False

    print("✅ Configuration valid")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: validate_config.py <config-file>")
        sys.exit(1)

    config_path = Path(sys.argv[1])
    success = validate_config(config_path)
    sys.exit(0 if success else 1)
```

**Key features**:
- Type hints for clarity
- Comprehensive error messages
- Exit codes for success/failure
- Usage instructions
</validation_script>

<transformation_script>
**Purpose**: Transform data from one format to another

**Pattern**:
```python
#!/usr/bin/env python3
"""Transform markdown to JSON structure."""
import sys
import json
import re
from pathlib import Path

def parse_markdown(content: str) -> dict:
    """Parse markdown and extract structure."""
    sections = {}
    current_section = None

    for line in content.split('\n'):
        if line.startswith('## '):
            current_section = line[3:].strip()
            sections[current_section] = []
        elif current_section and line.strip():
            sections[current_section].append(line.strip())

    return sections

def transform(input_path: Path, output_path: Path):
    """Transform markdown file to JSON."""
    with open(input_path) as f:
        content = f.read()

    structure = parse_markdown(content)

    with open(output_path, 'w') as f:
        json.dump(structure, f, indent=2)

    print(f"✅ Transformed {input_path} → {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: transform.py <input.md> <output.json>")
        sys.exit(1)

    transform(Path(sys.argv[1]), Path(sys.argv[2]))
```

**Key features**:
- Clear transformation logic
- Path objects for file handling
- Success feedback
</transformation_script>
</script_templates>

<best_practices>
- Use `set -e` in bash scripts to exit on error
- Provide default values for arguments
- Use absolute paths to avoid directory confusion
- Include usage instructions in script docstring
- Return meaningful exit codes (0 for success, 1+ for errors)
- Print clear success/error messages with emojis
- Document configuration values
- Handle errors gracefully
- Use type hints in Python scripts
- Make scripts idempotent (safe to run multiple times)
</best_practices>

<anti_patterns>
- ❌ Hardcoded paths without configuration
- ❌ Silent failures without error messages
- ❌ Magic numbers without documentation
- ❌ Assuming files exist without checking
- ❌ No usage instructions
- ❌ Platform-specific commands without alternatives
- ❌ Scripts that fail on re-run (not idempotent)
</anti_patterns>
