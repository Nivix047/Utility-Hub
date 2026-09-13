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

All three original tools are included:

1. **Rate calculator:** premium difference, percentage change, original message wording and rounding rules, and a threshold requiring both a 10% increase and a $100 increase.
2. **Rate increase:** optional premium, Coverage A, deductible, year built, square footage, company, effective date and emailed recipient details, assembled into the original note format. Coverage A takes precedence when choosing the company's rate-change direction.
3. **Email subject:** optional last/first name, policy number and effective date, with the original threshold tag.

Generation copies the result automatically, with explicit feedback, a retry button, and selectable output if clipboard permission is denied. Clipboard access requires localhost or HTTPS.

Intentional fixes: calendar dates no longer shift a day in western time zones; invalid/negative numeric amounts and zero expiring baselines produce errors instead of invalid percentages; reset clears output and status. Premium differences are rounded to cents to avoid floating-point noise. Original detailed-note signed decrease percentages are preserved.

Drafts are held only in memory while the calculator is open. Returning Home or reloading clears them; policy details are not sent to a backend or saved in browser storage. Google Fonts is the only external UI request and has system-font fallbacks.

## Verification in the build environment

Production build and all six logic tests pass. The built-in browser verified launcher opening, threshold results, clipboard contents, invalid baseline feedback, reset, detailed notes, and subject generation. The mobile form was inspected at 390px with no horizontal overflow. The standalone Playwright suite is included but could not execute here: macOS sandbox restrictions prevent Chromium from registering its process service. Run `npm run test:e2e` outside that sandbox to complete automated browser verification. Native date entry could not be fully driven by the built-in browser automation; date formatting is covered by the logic tests.

## GitHub Pages

After pushing to `Nivix047/Utility-Hub`, open repository **Settings → Pages**, choose **GitHub Actions** as the source, then run **Publish Utility Hub** from the **Actions** tab if the first push ran before Pages was enabled. Subsequent pushes to `main` test, build and publish automatically. The expected URL is https://nivix047.github.io/Utility-Hub/ once deployment succeeds.
