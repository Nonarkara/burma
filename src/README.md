# `src/` — Future frontend scaffold

This directory holds the **next-phase** frontend scaffold. It is **not** in the deploy path today.

The currently deployed site is the static landing page in `../web/`, served at `burma.nonarkara.org`.

When the team is ready to ship the actual surfaces (Rooms, Digest, Listening, Atlas, Career Navigator), this codebase is where that work starts. The stack pin (`package.json`), i18n config (`lib/i18n/`), types (`lib/quest/`, `lib/atlas/`, `lib/mentor/`), and Burmese safety layer (`lib/mentor/escalation.ts`) are already in place.

Until then, do not `pnpm install`. The build will fail. That's a known TBD — the deployable artifact right now is the static landing page.
