---
description: Generate GDPR-compliant Privacy Policy and Terms of Service based on product and data practices
---

<objective>
Generate comprehensive, GDPR-compliant legal documentation for a SaaS application.

Create a Privacy Policy and Terms of Service that are understandable by regular users while being legally sound. These documents protect both the business and users while building trust.
</objective>

<process>
## Phase 1: Locate PRD

1. **Ask for PRD location**:
   > "Where is your PRD? Please provide the file path."

2. **Extract from PRD**:
   - Product name and company name
   - What data is collected (user input, analytics, files)
   - Third-party integrations (Stripe, analytics, email)
   - Target regions (EU, US, global)
   - User account features

3. **Save output path** - Legal docs go in same directory as PRD

## Phase 2: Information Gathering

4. **Collect required information** (ask in batches, not all at once):

**Company Information**:
- Legal company name and structure (LLC, Inc, SARL)
- Jurisdiction (State/Country)
- Registration number (EIN for US, SIRET for France)
- Complete legal address
- Contact email for legal/privacy matters

**For French Companies** (CGV required):
- Numéro SIRET
- Numéro de TVA intracommunautaire
- Capital social (if SARL/SAS)
- RCS (Registre du Commerce et des Sociétés)

**Data Collection**:
- Account data: email, name, profile info?
- Payment data: credit cards via Stripe/LemonSqueezy?
- Content data: what user-created content is stored?
- Usage data: analytics, logs, interaction data?
- Cookies: essential only, or analytics/marketing too?

**Third-Party Services** (check which apply):
- Payment: Stripe / LemonSqueezy / Other
- Analytics: PostHog / Plausible / Google Analytics
- Email: Resend / SendGrid / Other
- Hosting: Vercel / AWS / Other
- AI: OpenAI / Anthropic / Other
- Error tracking: Sentry / Other

**Data Practices**:
- Data retention: How long is data kept?
- Data deletion: Can users delete their account/data?
- Data export: Can users export their data?
- Data sharing: Shared with anyone beyond service providers?

**Terms Specifics**:
- Free tier available? Limitations?
- Paid tiers? Refund policy?
- User-generated content? Moderation?
- API access? Rate limits?
- Prohibited uses? (spam, illegal, abuse)

**Dispute Resolution**:
- Preferred governing law? (Delaware common for US)
- Mandatory arbitration? (faster, cheaper than court)
- Class action waiver? (individual claims only)

**Languages Needed**:
- English version?
- French version (CGV)?
- Both?

## Phase 3: Generate Privacy Policy

5. **Create PRIVACY_POLICY.md** with these sections:

- **Introduction**: Company name, what the policy covers
- **Information We Collect**:
  - Information provided (account, payment, content)
  - Information collected automatically (usage, device, cookies)
- **How We Use Information**: Provide service, process payments, improve, legal compliance
- **Data Sharing**: Service providers listed by name, legal requirements, business transfers
- **Data Retention**: How long for each data type
- **Your Rights**:
  - All users: access, correct, delete, export
  - EU users (GDPR): erasure, portability, restrict, object
  - California users (CCPA): know, delete, opt-out, non-discrimination
- **Data Security**: Encryption, access controls, limitations
- **International Transfers**: Where data stored, safeguards
- **Cookies**: Essential, analytics, marketing - with opt-out info
- **Children's Privacy**: Not for under 16
- **Changes to Policy**: How updates are communicated
- **Contact**: Privacy email and address

## Phase 4: Generate Terms of Service

6. **Create TERMS_OF_SERVICE.md** with these sections:

- **Agreement to Terms**: Using service = agreeing
- **Description of Service**: What the product does
- **Accounts**: Creation, security, termination
- **Subscription and Payment** (if paid):
  - Pricing and billing
  - Refund policy
  - Cancellation
  - Free tier limitations
- **Acceptable Use**: What users must NOT do
- **Intellectual Property**: Company owns service, user owns their content, limited license
- **Third-Party Services**: Not responsible for integrations
- **Disclaimer of Warranties**: AS IS, no guarantees
- **Limitation of Liability**: No indirect damages, liability cap
- **Indemnification**: User holds company harmless
- **Governing Law**: Jurisdiction
- **Dispute Resolution**: Informal first, then arbitration/courts
- **Changes to Terms**: How updates work
- **Miscellaneous**: Entire agreement, severability, waiver, assignment
- **Contact**: Legal email

## Phase 5: Generate French CGV (if needed)

7. **Create CGV.md** if French market - includes:
- Required company information (SIRET, RCS, TVA)
- Article structure required by French law
- Droit de rétractation (14-day withdrawal right)
- Exception for digital content accessed immediately
- Médiation de la consommation (required mediator info)
- Garantie légale de conformité
</process>

<output>
**Files created**:
- `PRIVACY_POLICY.md` - Complete privacy policy
- `TERMS_OF_SERVICE.md` - Complete terms of service
- `CGV.md` - French conditions générales de vente (if requested)

All saved in same directory as PRD.
</output>

<constraints>
**CRITICAL NOTES**:
- These are templates, NOT legal advice
- Recommend professional legal review before production use
- Adapt based on actual business practices and jurisdiction
- Keep language understandable to regular users

**DO NOT**:
- Generate with placeholders - fill in ALL details from gathered info
- Skip GDPR requirements if serving EU users
- Omit required disclosures for third-party services
- Generate without asking for required company information first
- Skip French-specific requirements if CGV requested

**LEGAL PROTECTION PRIORITY**:
- Include liability caps and disclaimers
- Clearly define prohibited uses
- Specify governing law and venue
- Include arbitration clause if requested
</constraints>

<success_criteria>
- All company and product details filled in (no [brackets])
- All third-party services disclosed in privacy policy
- Data practices match actual product features
- User rights section complete (GDPR, CCPA if applicable)
- Terms cover payment, refunds, acceptable use
- Documents saved in same directory as PRD
- Clear recommendation for professional legal review included
</success_criteria>
