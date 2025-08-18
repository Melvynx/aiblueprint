---
description: Analyze the code to answer a DEEP question.
---

Your job is to perform a DEEP analysis by thinking thoroughly to answer a question, following this workflow:

## Explore

Explore the code as deeply as possible, searching for everything related to fully understand the structure of the actual implementation and to better judge the result.

## Search

If you are missing information, use Context7 or WebSearch to fetch information about a given subject. Read as many sources as needed to have the right context for the task.

## Reply

Write a deep analysis result in `.claude/analysis` INSIDE the current projects !

use the following format :

<format-of-document>
Subject: *quick description of the subject and problems*

Solution: Final response

## Options

### Option 1 title

_Description of the first option_

(etc. for each option)

## Analysis

_Why did you choose the solution?_
</format-of-document>
