# Landing Design QA

- Source visual truth: `public/images/landing-page-concept-v1.png`
- Hero comparison: `tmp/landing-audit/qa-hero-comparison.png`
- Implementation contact sheet: `tmp/landing-audit/qa-final-sections-contact-sheet.png`
- Desktop viewport: 1440 x 900
- Mobile viewport: 390 x 844
- State: public landing, guided example on default and cleaning cases, mobile menu open, FAQ open

## Full-view comparison evidence

The hero comparison places the approved landing concept and the rendered implementation side by side. The implementation keeps the warm service-business photography, editorial headline, green/cream palette, restrained card radius, comment-to-action story, and two primary entry points. Social proof, score claims, and extra dashboard widgets were intentionally removed based on later user direction. The primary action is named "Probar experiencia" because it opens the existing feedback demo rather than a sales form.

## Focused region comparison evidence

The contact sheet includes the final hero, workflow photo, guided example, plan options, FAQ, CTA, and footer at the same desktop viewport. Separate mobile captures verify the hero, menu, guided example, plans, FAQ, and CTA. No focused crop beyond these section views was needed because text, controls, imagery, and spacing are legible at the captured scale.

## Findings

- No remaining P0, P1, or P2 findings.
- Typography now uses the configured Iowan/Palatino serif stack for display headings and the Avenir/Helvetica sans stack for operational copy.
- Section rhythm, 8px radii, green/cream tokens, image treatment, and restrained shadows remain consistent with the selected concept.
- The supporting photograph is sharp, correctly cropped on desktop and mobile, and contains no baked-in UI or text.
- Product copy distinguishes available QR capture, triage, alerts, reports, and multi-sucursal management from unavailable WhatsApp/SMS automation and automatic compensation.

## Interaction and accessibility checks

- Guided example switches between Espera, Atención, and Limpieza and updates the operational result.
- FAQ disclosure opens and exposes its answer.
- Mobile navigation opens, closes, and exposes all landing anchors.
- Desktop and mobile widths have no horizontal document overflow.
- Focus-visible styling and reduced-motion handling are present.
- Browser console reported no errors during the checked flows.

## Comparison history

1. P2: Anchor offsets exposed content from the previous section on mobile. Removed unnecessary scroll margins and re-captured plans and FAQ.
2. P2: Display headings inherited the sans stack despite the visual source using serif. Applied the display font explicitly and re-captured desktop/mobile states.
3. P2: Hero copy implied a WhatsApp capture channel not supported by the current system. Replaced it with the implemented QR origin and added explicit FAQ limits.

## Residual P3 polish

- Final commercial prices and a real sales-contact destination remain intentionally unpublished.
- Plan limits are working proposals and should be updated after pilot usage data is available.

final result: passed
