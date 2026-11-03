# Contributing to Mini4WD Track Planner

Thanks for wanting to help! This is a community project: ideas, bug reports, measurements of real
printed pieces and pull requests are all welcome. You don't need to be a programmer to contribute.

The app's interface is in Italian. Issues and pull requests can be written in **English or Italian**.

## Ways to help

- **Report a bug** or **suggest an idea**: open an [issue](../../issues/new/choose).
- **Send measurements** of real pieces (curve radius at the centre wall, lane change length…):
  use the *New track piece or real measurements* form. Exact numbers make the planner much better.
- **Add a printable piece** from MakerWorld or other sites: same form, with the link and measurements.
- **Write code**: fix a bug, add a feature, a new element for the 3D engine, translations…

## How a change gets in

The official version is maintained by [@filippocobelli](https://github.com/filippocobelli).
Nobody pushes directly to `main`: every change goes through a pull request.

1. **Fork** the repository and create a branch (`fix-curve-radius`, `feature-banked-curve`…).
2. Make your change and run the tests (see below).
3. Open a **pull request**. Explain what it does and how you tested it.
4. GitHub runs the automatic tests on your pull request.
5. The maintainer reviews and tries it. It is **approved and merged** (it goes into the next release)
   or **closed with an explanation** (nothing changes in the app).

For bigger changes, open an issue first so we can agree on the approach before you spend time on it.

## Project structure

```
app/index.html       the whole app: planner, 3D view, inventory, generators, Officina (UI)
app/engine3d.js      3D engine: generates printable pieces (STL/OBJ) with Manifold
app/vendor/          Manifold (WASM) prepared by `npm run vendor` — don't edit by hand
electron/main.js     desktop app window
scripts/             build, versioning, release notes, macOS ad-hoc signing
tests/run.mjs        automatic tests (engine in Node, app in Chromium)
```

## Running it locally

```bash
npm install
npm test             # builds and runs all tests
npm start            # opens the desktop app
```

You can also open `app/index.html` directly in a browser.

## Guidelines

- **Keep it simple.** The app is a single HTML page with plain JavaScript, no framework and no build step
  needed to run it. Please keep it that way.
- **Don't break saved data.** Users keep circuits and inventory in their browser and in exported JSON.
  New settings need a default value in `defaults()` and, if needed, a step in `migrate()`.
- **Every piece must close.** If you add a track element, add it to the tests: closed loops, equal lanes,
  watertight solids that fit the bed.
- **Measurements in millimetres**, geometry in the 3D engine documented in a comment
  (the reference profile is the 200 mm straight of the MINI4WD 2 LANE DIY TRACK set).
- **Licences.** Code is MIT. Never commit STL files or other models you didn't create: link them instead.
  Respect the licence of every model you reference (many MakerWorld models are non-commercial).
- **AI-written code is welcome**, as long as you have read it, run it and tested it yourself.
  This project itself is written with AI (Claude) and reviewed by a human.

## Versions

Versions follow [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.
You don't need to bump the version in your pull request: the maintainer does it when releasing.
A release is published automatically when a new version reaches `main` (see `README.md`).
