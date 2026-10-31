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

STORY: Camera opens on creating a review. A successful photo starts GPS. Photo returns directly to price and three/four scoring sliders; GPS runs in the background. Pin correction and venue name are optional. Save records current time. One image, no date/hours controls. Tab changes retain the draft. Cancelled capture stays before location; edits never relocate automatically.

FIRST VIEWPORT: Compact brand and tools, one small heading, compact category/search/density controls, two columns of square photos with score/price corners and short captions. At least four entries fit on an A56-sized viewport. Three-column density is optional. A four-slot dock anchors capture.

FORM: User-pinned photo album, position 3 in seven grounded systems (contact sheet, receipt ledger, personal photo album, camera roll, tasting notebook, map legend, ingredient index); seed 3febd7c8 acknowledged. The explicit album brief overrides the seed's unrelated materials. Preserve its priority rules through fixed score/price corners, stable identity through sorting, and confirmation states. Challengers are not adopted: map terrain obscures photographs; warm card stacks contradict compact density; boarding passes contradict square covers; transit diagrams obscure food; streaming rails add navigation; strobing data conflicts with reading scores. Keep their disciplines: explicit pin status, touch targets, stable rows, clear navigation, photo dominance, and bounded animation. The generated mobile concept is an implementation reference with synthetic imagery, never user content.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion and constraints

The signature moment is shutter-to-photo development into the quick scoring screen, with a small GPS spinner running in the background. Pin confirmation is optional in the location editor. Tile press and detail entry preserve the photograph's identity; density changes replay a bounded entrance without per-tile layout projection. No permanent GPU loops or hidden data changes. Reduced motion removes the effects, not the steps. Page size 24 bounds DOM and image decoding. No GPS lookup or external reverse geocoding before the photo. No invented images for old reviews.


## Quick scoring steering
The user explicitly prioritized minimum taps: camera -> one photo -> price -> three/four sliders -> Save. Do not introduce a mandatory location confirmation or venue-name field. GPS errors never block a rating. The optional pin editor uses one finger and starts with collapsed attribution. Input accepts comma/dot decimals and uses stable keyboard-aware geometry. Historical image arrays/hours remain in stored data without new editing controls.
