# The arena rubric

Every match in the arena is scored against this page. The judge scores both solutions, `bracket.py`
does the arithmetic, and the higher weighted total goes through. The loser is out.

## The five criteria

Each criterion is scored 0 to 10. The weight is how much of the 100-point total it is worth.

| criterion | weight | the question |
| --- | --- | --- |
| Correctness | 30 | Is it right? No false claims, no logic errors, no bugs, nothing that would mislead the user. |
| Completeness | 25 | Does it meet every requirement the task actually states? Judged against the task text, not against what the judge would have liked. |
| Specificity | 15 | Could the user act on it right now without guessing? Exact steps, values, names, code. |
| Robustness | 20 | Does it hold up against the attacks raised in this match? Fixed, correctly rebutted, or still standing. |
| Clarity | 10 | Is it easy to read and use, at a length that fits the task? |

Weighted total = (correctness x 30 + completeness x 25 + specificity x 15 + robustness x 20 + clarity x 10) / 10.
That gives a number from 0 to 100.

## Anchors

Use the whole scale. A 7 is not a polite default.

**Correctness**
- 10: nothing wrong that you can find after checking it yourself.
- 7: minor slips that do not change the outcome for the user.
- 4: at least one real error the user would trip on.
- 0 to 2: wrong at the core, or it would cause harm if used.

**Completeness**
- 10: every stated requirement is met, fully.
- 7: every requirement is touched, one is thin.
- 4: a stated requirement is missing.
- 0 to 2: it answers a different question from the one asked.

**Specificity**
- 10: the user can act on every part of it immediately.
- 7: mostly concrete, with one or two places that need a guess.
- 4: a lot of "consider", "ensure" and "it depends" without the actual answer.
- 0 to 2: generic advice that would fit any task.

**Robustness**
- 10: every attack in this match is fixed in the revised solution or correctly rebutted, and nothing new is broken.
- 7: one MINOR attack still standing.
- 4: a MAJOR attack still standing, or a fix that broke something else.
- 0 to 2: a FATAL attack still standing.

A missing attack file means the opponent raised nothing. Score robustness on the flaws you found yourself.

**Clarity**
- 10: the shape makes it obvious how to use it. No padding.
- 7: fine, with some padding or one confusing section.
- 4: the user has to dig for the answer.
- 0 to 2: hard to follow at all.

## The fatal rule

Mark a solution `fatal` only when you have verified a flaw that makes it wrong or unusable for the
task: code that cannot work, a false central claim, a hard constraint broken, the wrong question
answered. A fatal solution cannot beat a solution that is not fatal, whatever the totals say. If both
are fatal, the totals decide.

## Ties

There are no draws. On an exact tie, the solution with fewer attacks still standing wins. If that is
also level, the higher correctness score wins. If that is also level, pick the one you would hand to
the user, and say why in the reason.

## What the judge does not reward

- **Length.** Longer is not better. A tight answer that meets every requirement beats a long one
  that meets the same requirements.
- **Confidence.** A defense that says "fixed" is not proof. Check the revised solution.
- **The approach.** The judge never sees the strategy cards and does not guess at them. It scores
  the work, not the method that produced it.
- **Talking about quality.** "This robust, comprehensive solution" earns nothing. The solution has to
  be robust and comprehensive.
- **Agreement with the judge's own taste** where the task does not ask for it.
