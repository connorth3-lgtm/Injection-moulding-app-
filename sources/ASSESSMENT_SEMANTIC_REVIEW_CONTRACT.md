# Assessment semantic review contract

This contract complements deterministic assessment QA with a human semantic-review checklist for all 157 keyed learner decisions. It does not alter answer keys or claim external validation.

Every reviewed item must satisfy all of the following:

- **Unambiguous stem:** the prompt supplies enough context for one defensible best answer and does not depend on hidden assumptions.
- **Technically defensible key:** the keyed choice follows from the stated evidence and respects machine-, mould-, material-, site- and grade-specific boundaries.
- **Plausible distractors:** wrong choices represent credible misconceptions or weaker reasoning, not jokes, obvious absolutes, unsafe instructions or grammatical giveaways.
- **Explanation quality:** feedback states why the keyed choice is stronger and, where a near competitor exists, why that competitor is weaker.
- **Evidence dependency:** safety/legal claims use the applicable jurisdiction source; technical claims use approved evidence and do not turn research findings into universal production settings.
- **Safety boundary:** distractors are assessment contrasts, never authorised procedures; safeguard bypass, unsafe intervention and unverified universal recipes remain rejected.
- **Readable language:** wording is concise enough for the target level, defines unavoidable specialist terminology through context, and avoids unnecessary double negatives.
- **Identity and duplication:** the item tests a distinct decision under its stable ID and is not a paraphrased duplicate of another keyed item.
- **Measurement discipline:** unresolved units, signal reference, timing, provenance or measurement adequacy must not support a confident quantitative conclusion.
- **UI fit:** stem, choices and explanation remain understandable on narrow mobile layouts without relying on colour, hover, answer position or option length.

## Coverage

The governed review population is 157 keyed decisions:

- 57 live exam questions: 30 technical and 27 regional safety/compliance.
- 40 shop-floor scenario drills.
- 36 Diagnostic Learning Lab decisions.
- 24 Material Behaviour Lab decisions.

Release automation continues to enforce structural, key, cue, evidence and source gates. This semantic contract records the additional pedagogical standard that automated heuristics cannot prove by themselves. Question wording or answer-key changes still require the repository's normal content review and version-control process.
