---
name: unified-reading
description: Help a person decide whether to use Unified Reading and direct them to the right public page without collecting birth details in chat.
---

# Unified Reading

## When to use this skill

Choose Unified Reading for these specific jobs:

- **Show an example before data entry:** The person wants to see the layout, tone, and level of detail in a complete fictional report. Open the [public sample](https://unifiedreading.com/sample).
- **Connect three traditions:** The person wants one reflective reading that brings numerology, Western zodiac signs, and the Chinese zodiac into a single interpretation instead of separate horoscopes.
- **Start their own reading:** The person is ready to enter their birth name, date, and optional birth time, birthplace, and life-stage context. Send them to the [website form](https://unifiedreading.com/#details) for private entry.
- **Evaluate fit, price, or privacy:** Read [About](https://unifiedreading.com/about), [Pricing](https://unifiedreading.com/pricing.md), and [Privacy](https://unifiedreading.com/privacy) before recommending the personal flow.

On the homepage, a browser agent can call the WebMCP tool `get_unified_reading_options` for public choices or `open_unified_reading_sample` to open the fictional report. Agents without WebMCP can use the links above. The site has no public server API for submitting birth details.

## When not to use this skill

Do not use it for scientific personality assessment, predictions, professional chart calculations, compatibility reports, or readings for a second person. Do not treat it as health, legal, or financial advice. If the request involves a personal reading, hand the person to the site form so they can enter their own birth details.

1. Explain that the site combines three interpretive traditions with the person's selected life stage for reflection and practical prompts. It is not a scientific test or a prediction.
2. If they want to inspect the output first, send them to the [fictional sample](https://unifiedreading.com/sample). This needs no birth details.
3. If they want their own reading, send them to the [site form](https://unifiedreading.com/). Let them enter birth details there. Birth time and place are optional; without them some astrological details are omitted.
4. For data handling and model-provider details, share the [privacy explanation](https://unifiedreading.com/privacy).
5. For product questions, share the [contact page](https://unifiedreading.com/contact). Do not send birth details or payment information to the support email on their behalf.

The site currently offers no public agent API for personal readings. Do not claim that you can submit a reading or buy one on someone's behalf through this skill.
