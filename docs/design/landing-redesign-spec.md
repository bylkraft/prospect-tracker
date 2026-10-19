# ProspectTracker landing page redesign specification

Status: proposed brief for owner review, not an implementation request.
Prepared: 18 October 2026.

This specification is written in English to follow the repository's documentation rule.
Proposed end-user copy is in French. Requirements marked **MUST** are acceptance criteria;
dimensions and copy marked **proposed** may be refined during design review.

## 1. Assignment and outcome

Redesign the public landing page at `/`, using [Ekklo](https://www.ekklo.com/) as the
reference for product storytelling, visual rhythm and guided demonstrations. Preserve
ProspectTracker's logo, name, violet palette, typography and relationship to its dashboard.

The desired experience is a confident, approachable product presentation: a visitor recognizes
their prospecting problem, sees how the tracker helps, and understands the next step without
learning the entire interface first.

Primary audience: French-speaking freelance developers looking for their next mission.
Secondary audience: work-study students and job seekers. Address them in the FAQ rather than
making the main headline serve three different audiences.

Primary conversion: starting account creation. Secondary conversion: exploring the on-page
demo. Do not promise an account-free personal workspace unless guest mode actually exists.

Within a short first scan, visitors should understand:

- This is a tracker for freelance mission prospecting.
- Contacts, missions, stages and next follow-ups belong together.
- They can inspect a demonstration before creating an account.
- The next action and current commercial terms are explicit.

## 2. Evidence and diagnosis

### Sources inspected

- [Ekklo homepage](https://www.ekklo.com/), opened in Orca on 18 October 2026. The inspected
  session displayed the English version; structure and visual mechanisms inform this brief.
- [Current local landing](http://localhost:3000/), inspected in Orca at a 1271 × 838 CSS-pixel
  viewport, plus its section structure and implementation.
- `docs/PRD.md`, `docs/reference/design-tokens.md`, `docs/reference/guest-mode.md`,
  `docs/reference/landing-page.md`, current landing components and `src/styles/globals.css`.

### Findings on the current page

These are UX observations and design hypotheses, not results from user testing.

| Finding | Consequence | Required response |
| --- | --- | --- |
| The hero is followed by a full, dense tracker with many controls. | Visitors must work out what matters before understanding the benefit. | Start with a focused demonstration and a clear scenario selector. |
| The page has 13 main sections and measures approximately 9563 CSS pixels at the inspected viewport. | Follow-ups, KPIs, columns, customization and spreadsheet comparisons repeat parts of the same argument. | Consolidate the narrative; each section must answer a new visitor question. |
| Large headings often explain implementation details at sentence length. | Scanning takes effort and weakens the visual hierarchy. | Use short benefit headings and supporting explanations. |
| The demo mixes working controls with decorative controls resembling buttons. | Visitors cannot predict what they can actually try. | Make supported actions work; remove or clearly distinguish illustrative controls. |
| “Lancer les 13 relances” empties a simulated list; other copy describes a morning email. | It can imply automatic outbound messages to recruiters. | Separate identifying a follow-up, reminding the user, and sending a message. |
| Guest mode is documented as not implemented; `/app` currently requires authentication. | An account-free trial promise would conflict with the real journey. | Route the main CTA through the existing sign-up flow. |

Preserve the strengths: recognizable branding, concrete freelance vocabulary, existing product
components in the demo, configurable stages, and a useful central promise about next actions.

## 3. How to use Ekklo as the model

| Observed reference mechanism | Adaptation for ProspectTracker |
| --- | --- |
| Large centered hero with a clear audience and benefit. | Short French headline, a specific freelance use case, one dominant CTA. |
| Product demonstration organized into selectable scenarios. | Three scenarios explaining centralization, follow-up prioritization and pipeline customization. |
| Before/after comparison. | Show scattered prospecting versus one organized working view. |
| Product visuals accompanying benefits. | Use authentic tracker fragments, with fictional data, to prove each claim. |
| Alternation between large demonstrations and shorter sections. | Vary layout density and section backgrounds while keeping a consistent content grid. |
| Reassurance, onboarding steps and FAQ. | Explain account creation, available features and realistic first use. |

Do not transplant Ekklo's lime palette, handwritten typography, coaching imagery, testimonials,
customer logos, user counts, AI positioning, pricing or support promises. Its many sections are
not a required sitemap. The adaptation should be shorter and appropriate to this product's maturity.

## 4. Scope and product truth

### Included

Information architecture, French marketing copy, public-page composition, responsive layouts,
demo presentation, motion, navigation, metadata and visual quality checks.

### Excluded

Dashboard redesign, database changes, authentication changes, new reminder infrastructure,
guest-mode implementation, Chrome extension, AI scoring, billing implementation and a new brand.
Reuse existing features; an unavailable capability must not be implemented merely to support
a landing-page claim.

### Mandatory claim review before implementation

The PRD describes a roadmap, not proof that a feature ships. Claude Code MUST check each
claim against working behavior before exposing it as available.

| Topic | Rule for this redesign |
| --- | --- |
| Tracker, search, sorting, pins and configurable stages | Demonstrate existing behavior using the current components and verified interactions. |
| Follow-ups | The main benefit may describe identifying contacts to follow up. Show email reminders only after verifying a working delivery feature. |
| Automated messages to recruiters | Do not imply these exist. “Relance” must state who acts and who receives any email. |
| Exact delivery at 08:00 or automatic reply detection | Omit unless verified in the application and its operating configuration. |
| LinkedIn, Malt, Freework, Collective | Mention where visitors find missions. Do not imply an integration, synchronization or automatic import. |
| Guest mode | On-page fictional demo is allowed; a personal account-free trial remains outside scope. |
| Kanban, editable columns, Pro, AI, CSV and extension | Omit from the available-feature list unless separately verified. Stages being editable does not prove columns are editable. |
| Free offer and future pricing | Keep commercial claims provisional until the owner confirms the offer. Never invent limits or promise lifetime availability. |
| Privacy and security | Describe only documented behavior. Avoid blanket claims about hosting, compliance or data never leaving the browser. |
| Social proof | Use genuine, authorized evidence only. Omit the section if none is available. |

The default design MUST remain coherent without testimonials, email reminders or a Pro plan.

## 5. Proposed page structure

Reading sequence: understand → inspect → recognize the difference → see first use → resolve
cost and objections → start.

```text
Header: logo / Le produit / Comment ça marche / Questions / Se connecter / CTA
Hero: audience + benefit + short explanation + primary CTA + demo link
Guided demo: [Centraliser] [Prioriser les relances] [Personnaliser]
Before / after: scattered information → actionable prospecting view
First use: create account → add opportunity → identify next action
Offer: current verified terms + included capabilities + CTA
FAQ: five concrete questions
Final CTA: short benefit reminder
Footer: product, account access, real legal links
```

Do not append separate KPI, column catalogue, Notion objection, minor-feature trio or roadmap
sections. Incorporate relevant information into the demo or FAQ.

### 5.1 Header

Desktop: logo on the left; three short anchor links; a visible “Se connecter” link and the
primary CTA on the right. Proposed height: 72–80px. Sticky behavior may use a solid theme-aware
surface and a subtle border, without a large floating glass treatment.

Mobile: logo, compact primary action when space permits, and an accessible menu. Opening the
menu exposes navigation and sign-in. Anchor selection closes it. The header must not obscure
anchor destinations or keyboard focus. Preserve existing locale support if exposed; do not
remove it because the PRD predates its implementation.

### 5.2 Hero

**Visitor question:** “Is this for me, and why should I care?”

Proposed French copy:

> Le suivi de prospection des freelances
>
> Vos prochaines missions,\nune relance à la fois.
>
> Regroupez vos contacts, suivez vos échanges et repérez qui relancer pour faire avancer
> votre recherche de mission.

Primary CTA: **“Commencer gratuitement”**, conditional on the confirmed free offer.
Fallback if commercial terms remain undecided: **“Créer mon compte”**.
Secondary text link: **“Explorer la démo”**, targeting the guided demo.
Reassurance: **“Compte gratuit · Sans carte bancaire”**, only when confirmed.

Use a two-line headline at 1440px where practical, up to three lines on small screens. Emphasize
one phrase with solid brand violet. Keep the description to two or three short lines and avoid
listing platforms in the hero. No invented usage badge.

At a 1440 × 900 viewport, the headline, explanation and CTA MUST be visible without scrolling;
the beginning of the demo should be visible. On mobile, prioritize readable text and CTA rather
than forcing the demonstration above the fold.

### 5.3 Guided product demo: the centerpiece

**Visitor question:** “What does using it actually change?”

Three manually selectable scenarios, sharing one stable frame:

| Scenario label | Visual content | Visitor takeaway |
| --- | --- | --- |
| “Tout retrouver” | Real tracker with 4–6 fictional opportunities; emphasize recruiter, client, TJM and stage. | My prospecting information has one home. |
| “Savoir qui relancer” | Existing due filter or current follow-up view with 2–3 due contacts and a visible reason. | I can identify the next useful action. |
| “Adapter mon suivi” | Authentic stage settings fragment, showing stage names, colors and follow-up delays where supported. | The pipeline fits how I work. |

Default: “Tout retrouver”. One short benefit sentence accompanies each scenario. Reuse
existing real product components where possible. A cropped capture of the real interface is
acceptable for an explicitly illustrative settings panel; do not invent a redesigned product.

Required behavior:

- Scenario switching MUST work by mouse, touch and keyboard, using an existing tab primitive.
- A scenario change updates the panel and its explanation; it does not navigate or modify accounts.
- No autoplay or automatic tab changes. Visitors control the reading pace.
- Search, sorting and pins may remain interactive where supported. Expose a small, intentional
  set of actions instead of every dashboard control.
- Include “Démo interactive · Données fictives” for interactive panels. Use “Aperçu du produit ·
  Données fictives” for static captures.
- Simulated interactions must explain their result. A replay/reset control restores the initial state.
- No email, server mutation or real account data may be involved.
- Do not show a send button if the demonstrated behavior only marks a contact or filters a list.
- Preserve frame dimensions between scenarios to avoid content jumping.

Desktop proposed frame width: up to 1240px; panel height approximately 440–560px. Remove
decorative sidebar chrome if it makes the central action unreadable. Keep the interface at a
readable scale rather than shrinking an entire dashboard into the frame.

Mobile: use a focused real-interface crop or reduced column composition. Keep the scenario
selector usable without cutting off labels. If a table needs horizontal scrolling, confine it
to the frame and provide a visible cue. The rest of the page must never overflow horizontally.

### 5.4 Before / after

**Visitor question:** “Why change my spreadsheet habit?”

Proposed heading: **“Moins d’informations éparpillées. Plus de suivi.”**

Two compact states visible together on desktop and stacked on mobile:

- “Aujourd’hui” shows a note, a spreadsheet fragment and a message reference: contact details,
  mission and last exchange are separated.
- “Avec ProspectTracker” brings the same fictional opportunity into one coherent row or record,
  with its stage and next action.

Use the same contact and mission on both sides so the transformation is immediately legible.
Limit supporting copy to three differences. Do not claim that a spreadsheet cannot store notes,
links or dates. The benefit is an adapted workflow and less manual organization.
Platform names may appear in supporting copy as prospecting sources, without partnership logos.

### 5.5 First use

**Visitor question:** “How much work is starting?”

Proposed heading: **“Votre suivi commence avec une première opportunité.”**

Three short steps, using small authentic product fragments rather than three large cards:

1. **“Créez votre compte”**: use only currently available sign-up methods.
2. **“Ajoutez une opportunité”**: recruiter, mission and stage; no invented automatic import.
3. **“Repérez votre prochaine action”**: show the corresponding opportunity in the tracker.

Do not promise completion in seconds or a minute without validating the real onboarding journey.
No fake editable sign-up form inside a decorative illustration.

### 5.6 Current offer

**Visitor question:** “What can I use, and what will it cost?”

One simple offer block. Proposed heading if confirmed: **“Commencez gratuitement.”**
List no more than four verified capabilities. Repeat the primary CTA and explain whether an
account is required. Do not build a pricing comparison against an unavailable paid plan.

Do not expose the PRD's provisional €10/month as a live price. Do not promise that current
features will remain free forever. If the owner has not settled the offer, keep price-specific
copy flagged for review rather than inventing a business decision.

### 5.7 FAQ

Use the existing accessible accordion. Five questions, with short factual answers:

1. **“Est-ce adapté à ma recherche de mission freelance ?”** Explain recruiter, ESN, client and TJM.
2. **“Comment savoir qui relancer ?”** Explain verified dates, stage delays and due state.
   State explicitly if sending the message remains the user's action.
3. **“Puis-je importer mes contacts depuis LinkedIn ou Malt ?”** Explain current manual entry;
   do not advertise the future extension as available.
4. **“Faut-il créer un compte ?”** Distinguish the fictional on-page demo from the personal tracker.
5. **“Et si je cherche une alternance ou un emploi ?”** Explain supported adaptation without
   claiming arbitrary column editing.

Link to a real privacy page near the offer/footer when available. Unresolved legal content must
be listed as a launch dependency, not published as “[À COMPLÉTER]”.

### 5.8 Final CTA and footer

Proposed closing heading: **“Gardez le fil de votre prochaine mission.”**
One supporting sentence and the same primary CTA. No new argument or feature here.

Footer: current wordmark, concise positioning, product anchors, sign-in and real legal links.
Do not add a newsletter, contact form, social links or a support channel without a working destination.

## 6. Art direction and brand constraints

Physical context: a freelancer compares tools on a laptop between prospecting sessions and
wants to feel organized rather than pressured. Use the existing light surface as the primary
marketing composition; provide an equally intentional dark version through the current theme system.

Brand voice: clear, practical, encouraging. Proposed visual character: spacious product-led
composition, strong typography, precise interface crops and restrained violet emphasis.

### Locked identity

- Wordmark: `ProspectTracker`, from `src/lib/config.ts`; reuse `BrandMark`.
- Primary violet: existing `--primary`, currently `oklch(0.58 0.204 277.1)`.
- Background: existing `--background`, currently `oklch(0.97 0.001 286.4)` in light mode.
- Text hierarchy: existing `foreground`, `secondary-foreground`, `muted-foreground` tokens.
- Headings: Bricolage Grotesque. Body, product UI and numbers: Geist.
- Status colors remain semantic product colors. Violet remains the marketing accent.

Do not globally retune tokens to achieve the landing composition. The dashboard shares them.
The repository's existing colors and fonts take precedence over generic design-skill preferences.

### Proposed layout parameters

| Element | Desktop | Mobile |
| --- | --- | --- |
| Main content width | Up to 1160px | Available width with 20px gutters |
| Demo width | Up to 1240px | Available width; overflow contained inside the preview |
| Main section spacing | Approximately 80–112px | Approximately 48–64px |
| Hero headline | Approximately 56–64px, fluid | Approximately 36–42px, fluid |
| Section heading | Approximately 32–40px | Approximately 26–32px |
| Body | Existing `text-sm` (14px) | Existing `text-sm` (14px) |
| Promoted lead | Existing `text-md` (16px), used selectively | Same token |

Use a shared alignment grid. Keep prose around 55–70 characters per line. Avoid applying the
same oversized padding to every section. A proposed desktop page-length budget is 6–8 viewport
heights at 1440 × 900, including the footer; this is a pacing target, not a reason to compress text.

Background sequence: light hero and demo → quiet neutral comparison → compact first-use section
→ a more prominent offer surface → quiet FAQ → a final violet-accented CTA. In dark mode,
maintain visible surface separation without turning every block into the same dark card.

One subtle brand-derived graphic may connect the hero and demo, inspired by the logo's tracking
motif. It must remain secondary to the product. Do not add a large generic glow, gradient text,
stock freelancer photography, a third font, or repeated icon-title-description card grids.

## 7. Interaction, accessibility and motion

- Target WCAG 2.2 AA. Verify text contrast, control contrast, keyboard access and visible focus.
- Touch targets should be at least 44 × 44 CSS pixels where practical; retain sufficient spacing.
- Use semantic landmarks, one H1 and ordered H2/H3 sections. Provide a skip link.
- Use existing Base UI/shadcn primitives for tabs, buttons, menus and accordions.
- Main and secondary CTAs must remain distinguishable in light, dark, hover, focus and disabled states.
- Use brief opacity/transform transitions: approximately 160–240ms for controls and 300–500ms
  for panel changes. No scroll locking, parallax requirement, animated layout height or looping cursor.
- Honor `prefers-reduced-motion`; all information remains available with animations disabled.
- Server-rendered heading, explanation and CTA MUST remain visible if animations or JavaScript fail.
- Preserve user zoom. Verify 200% zoom, long labels, and narrow layouts.

## 8. CTA and navigation contract

Before wiring links, inspect `APP_ROUTES` and the actual login screen's sign-up parameters.
Use the supported route and mode rather than inventing query values.

| Action | Logged-out visitor | Logged-in visitor |
| --- | --- | --- |
| Primary CTA | Existing sign-up entry point | Existing dashboard |
| “Se connecter” | Existing sign-in entry point | Dashboard, with an appropriate label |
| “Explorer la démo” | Scroll to on-page demo | Same |
| Header anchors | Scroll to matching real section | Same |

The on-page demo MUST never borrow the current user's private opportunities. Refreshing it,
changing a scenario or clicking a pin must not mutate the real tracker.

## 9. Implementation constraints for Claude Code

Read `CLAUDE.md`/`AGENTS.md` and the referenced product/design docs first. Keep TanStack Start,
SSR, existing auth, i18n and module boundaries. New landing-only components belong in
`src/modules/landing/`. Reuse the current tracker composition before introducing another one.

Inspect `git status` first: this workspace already contains unfinished landing and opportunity
changes. Do not revert them or assume the branch starts clean. Do not rewrite
`docs/reference/landing-page.md` until the actual composition changes.

Use existing dependencies, aliases, type scale and Tailwind utilities. Never write `text-base`
in new project code. Keep docs and code in English and user-facing copy in French, using the
existing message system. Preserve any already-supported locale behavior.

Do not refactor dashboard components solely for cosmetic landing requirements. If a shared
component needs a focused extension, identify its dashboard impact and verify both consumers.
No schema change, new integration or package installation is expected for this redesign.

For metadata, provide a factual French title and description aligned with the final hero,
canonical URL from the real deployment configuration, and a valid social image when available.
Optimize product captures and reserve their dimensions. Lazy-load below-fold assets; do not
lazy-load the primary visible visual. No additional font download is needed.

## 10. Delivery sequence

This brief deliberately separates design agreement from implementation.

1. **Clarify product claims.** Produce a short verified list of current features, commercial
   terms and any remaining owner decisions. Do not redesign the product to remove uncertainty.
2. **Present the composition.** Provide desktop and mobile wireframes, final section order,
   French hero/CTA copy and the three demo states. These must be reviewable without changing
   the live landing. Identify any change to this specification.
3. **Obtain design approval.** Wait for the owner's explicit approval of that concrete
   composition before implementation. This is an intentional project checkpoint.
4. **Implement the approved page.** Limit scope to the landing and justified shared extensions.
5. **Verify and report.** Supply screenshots, journey checks and gate results; identify launch
   dependencies and any unverified items explicitly. No commit or push without a separate request.

## 11. Acceptance checklist

### UX and content

- [ ] The first screen identifies freelance prospecting, gives a benefit and exposes the main CTA.
- [ ] Each section answers a different question; the three demo scenarios carry feature detail.
- [ ] A visitor can understand the core benefit without interacting with the demo.
- [ ] Demonstrated actions and fictional data are explicitly identified.
- [ ] No available-feature claim relies only on the roadmap or current marketing text.
- [ ] Reminder copy identifies who receives an email and who contacts the recruiter.
- [ ] Offer, free access and account requirements match verified behavior and owner decisions.
- [ ] No invented testimonials, integration badges, legal links, metrics or time-saving claims.

### Visual and functional verification

- [ ] Capture and inspect 390 × 844 and 1440 × 900 layouts in light and dark modes in Orca.
- [ ] Check reflow at 360, 768, 1024 and 1920px widths, and at 200% zoom.
- [ ] No page-level horizontal overflow, clipped labels or overlap with the sticky header.
- [ ] Demo scenarios, supported search/sort/pin actions, reset, menu and FAQ work by keyboard.
- [ ] Logged-out sign-up, sign-in and logged-in dashboard CTA destinations are correct.
- [ ] Demo actions do not write to the database, send email or expose authenticated data.
- [ ] Reduced-motion and JavaScript-disabled content remain readable and usable as appropriate.
- [ ] Shared tracker behavior still works in `/app` if shared components were changed.

### Engineering verification after implementation

Run the repository gates: `pnpm typecheck && pnpm lint:ci && pnpm format:check && pnpm test`.
Run `pnpm build` to check the production SSR build. Record failures caused by existing changes
separately from new regressions; never silently fix unrelated work.

Target a mobile Lighthouse performance and accessibility score of at least 90 on a production
build. Report the tested environment and limitations. Check LCP ≤ 2.5s and CLS ≤ 0.1 in that
lab run; field Core Web Vitals require post-launch measurements and cannot be claimed from it.

Primary post-launch measure: landing visit → completed account creation → first opportunity.
Secondary measures: CTA use and demo scenario selection. Reuse configured analytics if available;
adding analytics or consent infrastructure is a separate decision. Do not invent a conversion target
without a baseline.

## 12. Copy-ready instruction for Claude Code

> Read `docs/design/landing-redesign-spec.md` and the repository instructions. Start with steps
> 1 and 2 of the delivery sequence: verify claims and present a desktop/mobile composition with
> French copy and three guided demo states. Use https://www.ekklo.com/ as a reference for
> storytelling and product demonstration while retaining ProspectTracker's logo, violet colors,
> Bricolage Grotesque and Geist. Account for the existing unfinished changes. Do not modify the
> landing or implement the redesign before I approve the proposed composition. After approval,
> implement the specification and verify the acceptance checklist in Orca.
