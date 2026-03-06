<overview>
Chain of thought and reasoning techniques improve performance on complex tasks.
</overview>

<chain_of_thought>
**Basic**: Add "Think step by step before answering"

**Guided**: Structure the reasoning process:
"First analyze the requirements, then identify potential approaches, evaluate trade-offs, and finally recommend a solution."
</chain_of_thought>

<extended_thinking>
For Claude, use thinking tags:
```xml
<thinking>
Analyze the problem...
Consider options...
Evaluate trade-offs...
</thinking>

<answer>
Based on analysis, the recommendation is...
</answer>
```
</extended_thinking>

<when_to_use>
- Math and logic problems
- Multi-step analysis
- Complex decisions with trade-offs
- Code debugging
- Comparative evaluation
</when_to_use>

<structured_reasoning>
For specific domains:

```xml
<analysis_framework>
1. Identify the core problem
2. List constraints and requirements
3. Generate 2-3 potential solutions
4. Evaluate each against criteria
5. Recommend with justification
</analysis_framework>
```
</structured_reasoning>

<inner_monologue>
Hide reasoning from final output when needed:
"Work through your reasoning internally, then provide only the final answer."
</inner_monologue>
