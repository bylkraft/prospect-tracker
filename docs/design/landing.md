```markdown
# ProspectTracker — landing page brief

Design the public landing page of ProspectTracker, a prospecting tracker for French freelance
developers looking for their next mission. Everything in this brief is decided; where something
is not listed, keep it out rather than invent it.

## Materials in this project

| File | What it is |
| --- | --- |
| `tokens.css` | The product's real tokens (light + dark). Use them as-is — the dashboard shares them. |
| `assets/logo.svg` | App icon (violet tile). The wordmark is the text `ProspectTracker` in Bricolage Grotesque, semibold. |
| `assets/tracker-light.jpg`, `assets/tracker-dark.jpg` | The real tracker (KPI band + table) on fictional data. This is the visual truth of the product. |
| `assets/current-landing-hero.jpg` | The current landing, for reference only — it is what we are replacing. |

Fonts (Google Fonts): **Bricolage Grotesque** for headings, **Geist** for body, UI and numbers.
No third font.

## Audience and goal

- **Primary audience:** French-speaking freelance developers prospecting for missions through
  ESNs, recruiters and platforms (LinkedIn, Malt, Free-Work…).
- **Secondary:** work-study students and job seekers — addressed in the FAQ only.
- **Primary conversion:** create an account. **Secondary:** watch the video / explore the demo.
- In one scan, a visitor must understand: it's a tracker for freelance mission prospecting;
  contacts, missions, stages and follow-ups live in one place; it shows who to follow up today;
  it's free.

Tone: clear, practical, encouraging. A freelancer comparing tools between two calls should feel
organized, not pressured.

## What the product does today (only these may be shown as available)

- **Tracker table:** last contact, contact, ESN, end client, daily rate (TJM), stage, location.
  Accent-insensitive search, sort on every column, pin to top, archive, pagination.
- **Follow-ups:** each stage has a follow-up delay; past it, the last-contact date turns red and
  the opportunity counts in "À relancer aujourd'hui". **The user sends the message themselves** —
  the app never emails recruiters.
- **Kanban view:** one column per stage, drag a card to move it.
- **Contacts:** recruiters and ESN managers as their own records, linked to opportunities.
- **Customization:** rename, recolor, reorder and archive stages, set each stage's follow-up
  delay, set a reference TJM (rates above it show green, below it red).
- **KPI band:** à relancer aujourd'hui · sans réponse +7j · entretiens à venir · taux de réponse.
- FR/EN interface, light and dark themes.
- Sign-up by **email + password or Google**.

**Never show or imply:** email reminders, automatic messages, imports or integrations
(LinkedIn/Malt/… are where people *find* missions, not integrations), a Chrome extension, AI,
a paid plan or a price, testimonials, user counts, customer logos, "free forever", time-saved
claims, compliance/hosting claims.

## Page structure

Each section answers one visitor question. Nothing else is added.

1. **Header** — logo · `Le produit` · `Comment ça marche` · `Questions` · FR/EN switch ·
   `Se connecter` · primary CTA. Solid, theme-aware sticky bar with a subtle border; no big
   floating glass pill. Mobile: logo, compact CTA, menu.
2. **Hero + video** — "Is this for me?"
3. **Guided demo** (3 tabs) — "What does using it change?"
4. **Before / after** — "Why leave my spreadsheet?"
5. **First use** (3 steps) — "How much work is starting?"
6. **Offer** — "What does it cost?"
7. **FAQ** (5 questions, accordion) — objections.
8. **Final CTA** — reminder, no new argument.
9. **Footer** — wordmark, one-line positioning, product anchors, sign-in. Legal links are
   placeholders for now: show "Mentions légales" and "Confidentialité" as plain text.

Desktop pacing target: 6–8 viewport heights at 1440×900, footer included.

### 2. Hero with a video slot

Centered composition.

- Eyebrow: **Le suivi de prospection des freelances**
- H1 (2 lines at 1440, emphasize one phrase in solid primary violet — no gradient text):
  **Vos prochaines missions, une relance à la fois.**
- Lead (2–3 short lines): **Regroupez vos contacts, suivez vos échanges et repérez qui relancer
  pour faire avancer votre recherche de mission.**
- Primary CTA: **Commencer gratuitement** · secondary text link: **Voir la démo** (scrolls to
  section 3).
- Reassurance under the CTAs: **Compte gratuit · Sans carte bancaire**

**Video frame** directly under the CTAs — the hero's visual:

- 16:9, about 960–1080px wide on desktop, full width minus gutters on mobile.
- Same frame treatment as the demo below (border, radius, shadow) so the two feel related.
- **Default state = poster**: a real product capture (use `tracker-light.jpg` / `tracker-dark.jpg`,
  cropped) with a centered play button and a duration chip: **Voir en 1 min 30**.
- Click-to-play with controls, no autoplay, no sound by default. French captions.
- The page must look complete with the poster alone — the video may not exist at launch.
- At 1440×900, H1, lead, CTAs and the **top of the video frame** are above the fold.

The video tells the story end to end; the demo below lets visitors touch it. Don't make the two
look like the same thing twice: the video frame is a single cinematic object, the demo is a
working interface with tabs.

### 3. Guided demo — the centerpiece

H2: **Votre prospection, enfin au même endroit.** Three tabs over one stable frame (fixed
height, no jump between tabs). No autoplay, the visitor switches tabs.

| Tab | Shows | One-line takeaway under the tabs |
| --- | --- | --- |
| **Tout retrouver** (default) | The tracker table, 6–8 rows | Contact, ESN, client, TJM et étape sur une seule ligne. |
| **Savoir qui relancer** | Same table filtered to 3 due rows, dates in red, "À relancer aujourd'hui" KPI highlighted | Le délai de l'étape est dépassé : c'est votre liste du jour. |
| **Suivre le pipeline** | Kanban: 4–5 stage columns with 2–3 cards each | Glissez une carte d'une étape à l'autre — vos étapes, vos couleurs. |

- Rebuild the UI from the screenshots and tokens — same density, type and stage colors. Do not
  redesign the product; trim chrome (no sidebar) so it stays readable at landing scale.
- Label inside the frame: **Démo interactive · Données fictives**.
- Mobile: a focused crop (fewer columns, or the kanban as one scrollable column); tabs stay
  fully readable; any horizontal scroll stays inside the frame.

### 4. Before / after

H2: **Moins d'informations éparpillées. Plus de suivi.**
Two states side by side (stacked on mobile), **same fictional opportunity on both sides**
(Camille Ferrand · Devoteam · Société Générale · 620 € · Entretien):

- **Aujourd'hui:** a note, a spreadsheet fragment and a message thread — the info is split.
- **Avec ProspectTracker:** the same opportunity as one table row with its stage and its next
  follow-up.

Three short differences max. Don't claim spreadsheets can't do things — the point is less manual
organizing.

### 5. First use

H2: **Votre suivi commence avec une première opportunité.**
Three compact steps, each with a small real-UI fragment, not three big icon cards:

1. **Créez votre compte** — email ou Google.
2. **Ajoutez une opportunité** — contact, ESN, mission, TJM, étape.
3. **Repérez votre prochaine action** — the row in the tracker, its date turning red when due.

### 6. Offer

One block, slightly more prominent surface. H2: **Commencez gratuitement.**
Up to four included capabilities (tracker & kanban · relances par étape · contacts ·
étapes personnalisables), the primary CTA, and **Sans carte bancaire**. No price, no plan
comparison, no "à vie".

### 7. FAQ

1. **Est-ce adapté à ma recherche de mission freelance ?** — ESN, recruteur, client final, TJM:
   the fields are made for it.
2. **Comment savoir qui relancer ?** — Each stage has a delay; past it, the opportunity is due.
   You send the message yourself.
3. **Puis-je importer mes contacts depuis LinkedIn ou Malt ?** — Not yet: you add them by hand,
   in a few fields.
4. **Faut-il créer un compte ?** — The demo on this page needs none; your own tracker does.
5. **Et si je cherche une alternance ou un emploi ?** — Rename stages and delays to fit your
   search.

### 8. Final CTA

H2: **Gardez le fil de votre prochaine mission.** One sentence, same primary CTA. A
primary-violet-accented band is welcome here.

## Art direction

- Light theme is the primary composition; deliver an equally intentional dark version.
- Spacious, product-led, strong typography, precise interface crops, restrained violet.
- Section rhythm: light hero + demo → quiet neutral before/after → compact first use → more
  prominent offer → quiet FAQ → violet-accented final CTA. In dark mode, keep surfaces visibly
  separated without turning everything into identical dark cards.
- One subtle graphic derived from the logo's loop may link hero and demo — secondary to the
  product.
- **Avoid:** large generic glows, gradient text, stock photos, repeated
  icon-title-description card grids, emoji, a third font.

Layout: content up to 1160px (demo and video up to 1240px), 20px mobile gutters, section spacing
~80–112px desktop / ~48–64px mobile. H1 ~56–64px desktop / 36–42px mobile, H2 ~32–40px /
26–32px, body 14px (Geist), lead 16px. Prose 55–70 characters per line. Touch targets ≥ 44px,
WCAG AA contrast, visible focus states.

## Deliverables

1. `Landing.dc.html` — the full page, desktop-first and fluid down to 390px, with a light/dark
   switch.
2. A canvas with the **hero** in 2–3 variations (layout of headline + video frame) at 1440×900
   and 390×844, so we can pick one before polishing the rest.

All on-page copy in French, exactly as written above (small adjustments OK — flag them).

```