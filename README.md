# Utility Hub

A frontend-only React, Vite and TypeScript workspace with a responsive smartphone-style launcher. The first app is Renewal Calculator. No backend, accounts, API keys, or database are required.

## Setup and development

Use Node.js 22 LTS (or a supported newer LTS release) and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite (normally http://127.0.0.1:5173).

```sh
npm run build     # TypeScript check and production output in dist/
npm run preview   # Serve the production build locally
npm test          # Calculator logic tests
npx playwright install chromium
npm run test:e2e  # Desktop and mobile browser checks
```

## Structure and adding apps

- `src/hub/`: shared launcher, navigation, global base styles and app registry.
- `src/apps/renewal/`: calculator UI, scoped CSS module, pure calculation/formatting logic and tests.
- `tests/`: browser interaction checks.

Add each future application under `src/apps/<id>/`, export its root component, then register its unique ID, name, category, icon and lazy-loaded component in `src/hub/registry.ts`. The shared shell supplies the Home control. Give future apps their own CSS modules and logic. The initial version includes only the functioning calculator; there are no misleading placeholder apps.

Hash navigation supports browser Back/Forward, reloads and static hosting without server rewrites. Vite uses relative asset paths. Serve `dist/` with a static host; the included GitHub Actions workflow builds and publishes the site after Pages is enabled.

## Migration

Inspected and migrated from [Nivix047/React-Renewal-Calculator](https://github.com/Nivix047/React-Renewal-Calculator), commit `29ac664772a12b64f43884f209797d3ac0aba4c1`. The source repository is unchanged.

The over-threshold flow now collects client last/first names, policy number, effective date and producer name, followed by optional Coverage A, deductible, property and company details. The rate increase message is generated from the entered premiums and details.

- Add clients to producer lists, then download one PDF per producer. All PDF generation, including embedded fonts, runs in the browser; no client information is uploaded.
- Producer names are grouped ignoring case and repeated spaces. The same producer, policy number and effective date updates an existing entry instead of duplicating it.
- “Next client” clears the calculator and current form, keeping saved lists. Changing premiums clears the unsaved client form; add the client first.
- Remove a saved entry with Undo available for the latest removal.
- **Clear all renewal data** prompts Yes/No and clears all saved renewal lists, unsaved form values and removal/Undo state for this tab. It does not touch other apps, other browser tabs, or downloaded PDFs. Existing saved message snapshots are unchanged by formatting updates; re-add the policy to replace an older message.
- Saved lists use `sessionStorage`: retained across refresh and Home navigation in the same tab, normally cleared when that tab is closed. Browser session restoration can retain them. This is not a durable database or cross-device sync. Download PDFs before closing the tab. Storage failures are shown in the UI.
- The rate company has a separate optional effective date; the policy effective date is used only for client information and duplicate matching. Messages end with `Emailed [producer name].` Producer name replaces “Emailed who.” Adding or exporting clients does not send emails. The separate diary/email generator forms have been replaced by this producer review workflow.
- Below-threshold calculations still generate and copy the original note. Clipboard access requires localhost or HTTPS; selectable results remain available when copying is denied.

Date formatting avoids timezone shifts, zero expiring baselines and negative amounts are rejected, and the exact 10% plus $100 threshold is preserved. The only external UI request is Google Fonts, with local system-font fallbacks. PDF fonts are bundled and loaded only when exporting; the large PDF library is a separate lazy-loaded chunk.

## Verification

`npm run build` and all 13 tests pass, covering calculation boundaries, record validation, producer grouping, duplicate updates, storage parsing and multi-page PDF rendering. A five-page stress PDF was visually checked and all 24 sample policy IDs and accented names were verified in its extracted text. Browser interaction tests are included in `tests/`; standalone Playwright browser launch was blocked by this Mac's sandbox, so interactive verification uses the built-in browser instead.

## GitHub Pages

After pushing to `Nivix047/Utility-Hub`, open repository **Settings → Pages**, choose **GitHub Actions** as the source, then run **Publish Utility Hub** from the **Actions** tab if the first push ran before Pages was enabled. Subsequent pushes to `main` test, build and publish automatically. The expected URL is https://nivix047.github.io/Utility-Hub/ once deployment succeeds.
