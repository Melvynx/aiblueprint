<overview>
Complete examples of well-structured skills demonstrating best practices, progressive disclosure, and expert prompting techniques.
</overview>

<example name="simple_skill">
**Type**: Simple skill with required tags only

**Directory structure**:
```
process-pdfs/
└── SKILL.md
```

**SKILL.md**:
```yaml
---
name: process-pdfs
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---

<objective>
Extract text and tables from PDF files, fill forms, and merge documents using Python libraries.

This skill provides comprehensive PDF processing capabilities for data extraction, form automation, and document manipulation tasks.
</objective>

<quick_start>
Extract text with pdfplumber:

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    # Extract text from first page
    text = pdf.pages[0].extract_text()
    print(text)

    # Extract tables
    tables = pdf.pages[0].extract_tables()
    for table in tables:
        print(table)
```

Install required package:
```bash
pip install pdfplumber
```
</quick_start>

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
```
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

<success_criteria>
- Text extracted successfully from PDF
- Output is clean and properly formatted
- No encoding errors
- Tables parsed into structured data
</success_criteria>
```
</example>

<example name="standard_skill">
**Type**: Standard skill with progressive disclosure

**Directory structure**:
```
manage-stripe/
├── SKILL.md
├── references/
│   ├── payments.md
│   ├── subscriptions.md
│   └── webhooks.md
└── scripts/
    └── validate-webhook.py
```

**SKILL.md**:
```yaml
---
name: manage-stripe
description: This skill should be used when the user asks to "manage Stripe", "create Stripe payment", "handle subscriptions", "process webhooks", or mentions Stripe API, payment processing, or subscription management.
---

<objective>
Manage Stripe payments, subscriptions, and webhooks using the Stripe API. This skill provides comprehensive Stripe integration patterns with security best practices.
</objective>

<quick_start>
<setup>
Install Stripe SDK:

```bash
pip install stripe
```

Set API key:

```python
import stripe
stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
```
</setup>

<create_payment>
Create a payment intent:

```python
intent = stripe.PaymentIntent.create(
    amount=1000,  # Amount in cents
    currency="usd",
    payment_method_types=["card"]
)

print(intent.client_secret)
```
</create_payment>
</quick_start>

<security_checklist>
**Before deploying**:

- [ ] API keys stored in environment variables (never hardcoded)
- [ ] Webhook signatures validated (prevent tampering)
- [ ] Amounts in cents to avoid decimal precision issues
- [ ] Idempotency keys used for critical operations
- [ ] Error messages don't leak sensitive information
- [ ] Test mode vs live mode clearly separated
</security_checklist>

<reference_guides>
For detailed guidance on specific features:

- **`references/payments.md`** - Payment intents, charges, refunds
- **`references/subscriptions.md`** - Subscription creation, management, billing
- **`references/webhooks.md`** - Webhook handling, signature validation

For webhook validation, use:

```bash
python scripts/validate-webhook.py payload.json signature
```
</reference_guides>

<success_criteria>
- Payment processed successfully
- Webhook signatures validated
- Errors handled gracefully
- Security checklist items verified
- Idempotency maintained
</success_criteria>
```

**references/payments.md**:
```xml
<overview>
Complete guide to Stripe payment processing including payment intents, charges, and refunds.
</overview>

<payment_intents>
<create_intent>
Create a payment intent for one-time payments:

```python
import stripe

intent = stripe.PaymentIntent.create(
    amount=2000,
    currency="usd",
    payment_method_types=["card"],
    metadata={"order_id": "123"}
)
```
</create_intent>

<confirm_intent>
Confirm a payment intent:

```python
intent = stripe.PaymentIntent.confirm(
    intent.id,
    payment_method="pm_card_visa"
)
```
</confirm_intent>
</payment_intents>

<refunds>
<create_refund>
Issue a full refund:

```python
refund = stripe.Refund.create(
    payment_intent=intent.id
)
```
</create_refund>

<partial_refund>
Issue a partial refund:

```python
refund = stripe.Refund.create(
    payment_intent=intent.id,
    amount=500  # Partial amount in cents
)
```
</partial_refund>
</refunds>
```

**scripts/validate-webhook.py**:
```python
#!/usr/bin/env python3
"""Validate Stripe webhook signature."""
import sys
import stripe
import os

def validate_webhook(payload, signature):
    """Validate webhook signature."""
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        print("❌ STRIPE_WEBHOOK_SECRET not set")
        return False

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, webhook_secret
        )
        print(f"✅ Valid webhook: {event['type']}")
        return True
    except ValueError:
        print("❌ Invalid payload")
        return False
    except stripe.error.SignatureVerificationError:
        print("❌ Invalid signature")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: validate-webhook.py <payload-file> <signature>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        payload = f.read()

    signature = sys.argv[2]
    success = validate_webhook(payload, signature)
    sys.exit(0 if success else 1)
```
</example>

<example name="complex_skill">
**Type**: Complex skill with multiple domains

**Directory structure**:
```
manage-bigquery/
├── SKILL.md
├── references/
│   ├── finance.md
│   ├── sales.md
│   ├── product.md
│   └── authentication.md
├── examples/
│   ├── finance-query.sql
│   └── sales-query.sql
└── scripts/
    └── validate-query.py
```

**SKILL.md**:
```yaml
---
name: manage-bigquery
description: This skill should be used when the user asks to "query BigQuery", "analyze data warehouse", "run SQL queries", or mentions BigQuery, data analysis, or specific data domains (finance, sales, product).
---

<objective>
Query and analyze data from BigQuery across multiple domains (finance, sales, product) with proper authentication, query optimization, and cost management.
</objective>

<quick_start>
<setup>
Install BigQuery client:

```bash
pip install google-cloud-bigquery
```

Set up authentication:

```python
from google.cloud import bigquery
import os

# Set credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path/to/credentials.json"

# Create client
client = bigquery.Client(project="your-project-id")
```
</setup>

<simple_query>
Run a basic query:

```python
query = """
SELECT user_id, created_at
FROM `project.dataset.users`
WHERE created_at >= '2024-01-01'
LIMIT 100
"""

results = client.query(query).result()
for row in results:
    print(row.user_id, row.created_at)
```
</simple_query>
</quick_start>

<domain_references>
Query different business domains with specialized references:

- **Finance data**: See [references/finance.md](references/finance.md) for revenue, billing, and payment metrics
- **Sales data**: See [references/sales.md](references/sales.md) for opportunities, pipeline, and conversion metrics
- **Product data**: See [references/product.md](references/product.md) for usage, features, and engagement metrics
- **Authentication**: See [references/authentication.md](references/authentication.md) for credential setup

**Working examples**:
- `examples/finance-query.sql` - Revenue analysis query
- `examples/sales-query.sql` - Pipeline analysis query
</domain_references>

<cost_management>
<query_validation>
Validate queries before running to avoid high costs:

```bash
python scripts/validate-query.py query.sql
# Estimates: 2.3 GB processed, ~$0.01 cost
```
</query_validation>

<best_practices>
- Use `LIMIT` for exploratory queries
- Partition tables by date for cost efficiency
- Use `_TABLE_SUFFIX` for date range queries
- Cache results when possible
- Use query parameters to avoid recompilation
</best_practices>
</cost_management>

<security_checklist>
- [ ] Credentials stored securely (not in code)
- [ ] Row-level security policies applied
- [ ] Query parameterization used (prevent injection)
- [ ] Audit logging enabled
- [ ] Access controls validated
</security_checklist>

<success_criteria>
- Query executes successfully
- Results match expected schema
- Cost is within budget
- Performance is acceptable (<30s for most queries)
- Security checklist verified
</success_criteria>
```

**references/finance.md**:
```xml
<overview>
Finance domain queries for revenue, billing, and payment metrics.
</overview>

<table_schemas>
<revenue_table>
**Table**: `project.finance.revenue`

Schema:
- `revenue_id` (STRING) - Unique revenue record ID
- `user_id` (STRING) - Customer ID
- `amount` (FLOAT64) - Revenue amount in USD
- `created_at` (TIMESTAMP) - Transaction timestamp
- `payment_method` (STRING) - Payment type (card, bank, etc)
</revenue_table>
</table_schemas>

<common_queries>
<monthly_revenue>
Monthly recurring revenue (MRR):

```sql
SELECT
  DATE_TRUNC(created_at, MONTH) as month,
  SUM(amount) as mrr
FROM `project.finance.revenue`
WHERE payment_method = 'subscription'
GROUP BY month
ORDER BY month DESC
```
</monthly_revenue>

<churn_analysis>
Revenue churn rate:

```sql
WITH monthly_cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC(MIN(created_at), MONTH) as cohort_month,
    DATE_TRUNC(created_at, MONTH) as revenue_month,
    SUM(amount) as revenue
  FROM `project.finance.revenue`
  GROUP BY user_id, revenue_month
)

SELECT
  cohort_month,
  revenue_month,
  COUNT(DISTINCT user_id) as active_users,
  SUM(revenue) as revenue
FROM monthly_cohorts
GROUP BY cohort_month, revenue_month
ORDER BY cohort_month, revenue_month
```
</churn_analysis>
</common_queries>
```
</example>

<key_patterns>
<pattern name="minimal_simple">
**When to use**: Simple, focused skills

**Structure**:
- SKILL.md only
- Required tags only
- 200-400 lines

**Example**: File format conversion, text extraction
</pattern>

<pattern name="standard_progressive">
**When to use**: Most skills

**Structure**:
- SKILL.md (400-500 lines)
- references/ for detailed content
- scripts/ for utilities
- examples/ for working code

**Example**: API integrations, document processing
</pattern>

<pattern name="complex_multi_domain">
**When to use**: Multiple domains or security-critical

**Structure**:
- SKILL.md (500 lines max)
- references/ organized by domain
- scripts/ for validation and utilities
- examples/ for each domain
- Comprehensive security checklist

**Example**: Payment processing, data warehouse queries
</pattern>
</key_patterns>

<success_indicators>
A well-structured skill demonstrates:

- **Clear purpose**: Objective states exactly what the skill does
- **Quick start**: User can begin immediately with working example
- **Progressive disclosure**: Detailed content in references/
- **Security awareness**: Checklist for sensitive operations
- **Validation**: Scripts and examples are tested and working
- **Domain organization**: Multi-domain skills separated clearly
- **Cost awareness**: Resource usage considerations documented
- **Error handling**: Edge cases and failures addressed
- **Best practices**: Anti-patterns shown and avoided
- **Success criteria**: Specific, measurable outcomes defined
</success_indicators>
