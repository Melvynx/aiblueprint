<overview>
GPT-specific prompting techniques from OpenAI's official documentation.
</overview>

<six_strategies>
<strategy name="clear_instructions">
Be specific about format, length, style:
- Include details for relevant answers
- Ask model to adopt a persona
- Use delimiters for distinct parts
- Specify steps required
- Provide examples (few-shot)
</strategy>

<strategy name="reference_text">
Ground answers with reference material:
- Instruct to answer using reference
- Reduces hallucinations
</strategy>

<strategy name="split_tasks">
Break complex tasks into subtasks:
- Use intent classification
- Summarize long documents piecewise
</strategy>

<strategy name="time_to_think">
Let the model reason step-by-step:
- Instruct to work out solution first
- Ask if it missed anything
</strategy>

<strategy name="external_tools">
Offload to specialized systems:
- Code execution for calculations
- Embeddings for retrieval
</strategy>

<strategy name="test_systematically">
Iterate and evaluate:
- Test against gold-standard answers
- A/B test variations
</strategy>
</six_strategies>

<additional>
- Few-shot: Include input/output examples
- Temperature 0 for factual tasks
- Markdown headers for structure (GPT-4+)
</additional>
