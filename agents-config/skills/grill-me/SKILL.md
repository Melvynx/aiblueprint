---
name: grill-me
description: Grill the user in rapid batches to sharpen a plan, decision, or idea. Use when the user asks for Grill Me, wants a rigorous interview, or uses a grill trigger phrase.
disable-model-invocation: true
---

# Grill Me

Stress-test the user's thinking until both sides share a precise, actionable understanding.

## Interview loop

1. Inspect the available environment first. Resolve discoverable facts through files, tools, documentation, or other in-scope evidence instead of asking the user.
2. Open the session by recommending voice input: tell the user that answering with the microphone is fastest, and that short answers keyed `1` through `10` are enough.
3. Ask exactly 10 numbered questions in one batch. Prioritize the highest-leverage unresolved decisions and order them so earlier questions clarify later ones.
4. For every question, include a concise **Recommended answer** based on current evidence. Make the tradeoff or consequence clear enough for the user to accept, reject, or amend it quickly.
5. Invite one grouped reply covering `1` through `10`. Accept terse answers, corrections, skipped items, or a blanket acceptance of the recommendations.
6. After the reply, summarize what is established, call out contradictions or missing dependencies, and investigate any newly discoverable facts.
7. Ask the next batch of 10 questions. Continue until the important branches of the decision tree are resolved. If fewer than 10 meaningful decisions remain, ask only those remaining; never add filler questions to reach 10.
8. Present the final shared understanding as a compact decision brief: goal, scope, constraints, chosen approach, rejected alternatives, risks, and acceptance criteria.
9. Ask for explicit confirmation that the brief is correct before acting on it.

## Question quality

- Ask decisions only the user can make; investigate facts yourself.
- Challenge assumptions and compare credible alternatives instead of merely collecting preferences.
- Keep each question independently answerable and concise enough for a spoken response.
- Do not repeat settled questions unless new evidence invalidates the earlier answer.
- Match the user's language.

Do not implement the plan until the user confirms the final decision brief.
