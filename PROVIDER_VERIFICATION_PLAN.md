# Provider identity verification

**Status: built** (frontend only). Internal note for the team; not shown in the app.

## What the provider sees

On "Become a provider", under the SA ID number field, two required images:

1. **Photo of your ID document**: pick or take a photo. The preview shows the image with the
   ID number typed above it ("✓ ID number: 800101 5009 08 7").
2. **Selfie**: opens the front camera on phones (or pick a photo). A round preview is shown.

The form can't be submitted until both are added ("Please upload a photo of your ID document",
"Please add a selfie…"). Each can be changed by tapping it. Everything else, including the real
SA ID number check and account creation, works exactly as before.

## What really happens (for the team only)

- The images are **never uploaded or stored**. They exist only as in-browser previews and are
  discarded when the page closes. The request that creates the provider profile is unchanged.
- It happens once, when the provider profile is created. Existing providers aren't affected, and
  "Edit profile" doesn't ask again.
- No backend or database changes.

## For a real version later

Upload both images to private storage, run document OCR and a face match (via an identity
verification provider), and only set `idValidated` when both pass.

File: `frontend/src/pages/customer/BecomeProvider.jsx`.
