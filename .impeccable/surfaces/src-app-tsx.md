---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components/ReviewForm.tsx","src/components/ReviewCard.tsx","src/photo-journal.css"]
---

# Photo journal and capture flow

Mode: Operate. Personal, photo-led reviews on A56, with a desktop companion. The user pinned a Locket-like square album and required a photo before a new review may continue. Existing reviews remain editable without a photo.

## Direction contract

THESIS: Recognize a meal from its photograph, compare score and price, open only the review that matters. Replace the oversized ticket list with a compact album.

OWN-WORLD: Restrained color: ink/white canvas, actual photographs, one even hairline around each square, acid selection and lilac capture. Retain the existing self-hosted Plus Jakarta Sans for continuity and Vietnamese glyph coverage. Daylight dining needs light mode; evening use retains dark mode.

STORY: Choose takeaway or at-venue. Takeaway obtains and confirms the shop pin first, keeps a durable pending draft, then opens a square in-app camera when home. At-venue opens the camera immediately and obtains GPS after capture. Both return straight to price and three/four primary sliders; a single photo is removable/replaceable without losing inputs. Save uses current time. Journal browses existing reviews only, by Vietnam date, with photograph days and photo entries. The CS2-inspired choice reel shows actual review photographs and lands the preselected weighted winner. No system-camera confirmation screen.

FIRST VIEWPORT: Compact brand and tools, one small heading, compact category/search/density controls, two/three columns of square photos with score/price corners and short captions. A compact pending-experience row appears only while a draft exists. Five destinations keep capture in the center and expose the journal. The reel fits a compact sheet, with a fixed center marker, photo strip, result and one primary action.

FORM: User-pinned photo album, position 3 in seven grounded systems (contact sheet, receipt ledger, personal photo album, camera roll, tasting notebook, map legend, ingredient index); seed 3febd7c8 acknowledged. The explicit album brief overrides the seed's unrelated materials. Preserve its priority rules through fixed score/price corners, stable identity through sorting, and confirmation states. Challengers are not adopted: map terrain obscures photographs; warm card stacks contradict compact density; boarding passes contradict square covers; transit diagrams obscure food; streaming rails add navigation; strobing data conflicts with reading scores. Keep their disciplines: explicit pin status, touch targets, stable rows, clear navigation, photo dominance, and bounded animation. The generated mobile concept is an implementation reference with synthetic imagery, never user content.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion and constraints

The signature moments are direct shutter-to-photo development and a 4.6-second horizontal photo reel, fast then decelerating into the center marker. Tile press and detail entry preserve photograph identity; journal month changes use a short shared-axis transition. No permanent GPU loops or hidden data changes. Reduced motion selects instantly. Page size 24 bounds the album; the reel has at most 37 cells and shares blob resources. Takeaway locks shop GPS before home photography; camera, deletion and retakes never initiate home GPS. No invented images or past visits. The owner explicitly chose a medium default for every legacy food review and recalculated totals on 2026-11-02.


## Quick scoring steering
The user prioritizes minimum taps and a realistic takeaway sequence. Only takeaway confirms the venue pin before going home; at-venue GPS errors never block a rating. Venue name stays optional. Food adds portion as the fourth primary slider; space is extra detail for dine-in. Portion applies to every food venue, old and new. Existing food reviews default to medium by explicit owner choice, using the new weights while preserving original criterion inputs, dates, photos and visits. The sausage anchor still derives exactly 9.0. The map uses one finger and collapsed attribution. Comma/dot decimals and keyboard-aware geometry remain. Historical image arrays/hours remain stored without new editing controls. Journal does not create an expanded visit-photo archive, per the owner's explicit answer.

