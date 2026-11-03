# Changelog

Versions follow [Semantic Versioning](https://semver.org/): MAJOR.MINOR.PATCH.
- PATCH: fixes that don't change how things work (e.g. 1.0.1)
- MINOR: new compatible features (e.g. 1.1.0)
- MAJOR: changes that break tracks or saved data (e.g. 2.0.0)

## [2.1.0] - 2026-11-03

**English and Italian.**

- The app starts in English. The **IT / EN** button at the top right switches to Italian and remembers the choice.
  Every text is translated: panes, messages, generated layouts, Workshop, file names and the README inside the track ZIP.
- The 3D engine labels pieces in the current language (e.g. `straight 200mm` / `rettilineo 200mm`).
- README in English, with an Italian copy (`README.it.md`) and screenshots in both languages. Changelog and code comments in English.
- ☕ Ko-fi link in the app and in the README, and a Sponsor button on GitHub (`.github/FUNDING.yml`).
- GitHub Actions updated to the Node 24 versions (no more "Node.js 20 is deprecated" warning).
- Phones: the page no longer comes out wider than the screen (the layout column now shrinks to the screen width).
- New tests for the language switch.

## [2.0.2] - 2026-11-03

- The web version on GitHub Pages is published on every change to `main` (separate workflow),
  not only together with a release: fixes the 404 at lab.cobelli.uk/Mini4WD-Track-Manager/.

## [2.0.1] - 2026-11-03

- Workshop in the claude.ai preview: downloads go through Claude's save feature
  (STL and OBJ delivered inside a zip, the format accepted there). Web and desktop app unchanged.

## [2.0.0] - 2026-11-03

**Workshop: a 3D engine to make printable track pieces.**

- New **Workshop** tab: builds pieces as STL and OBJ, with a 3D preview. Elements: straight, curve (angle and radius),
  ramp, hill, jump, saddle, washboard, support for raised sections.
- Profile measured on the set's 200 mm straight (115 mm lanes, 2.5 mm walls and floor, 50 mm walls, fillets,
  slots, Tamiya connector tabs): the generated piece matches the original. The profile can be changed.
- Selectable printer bed: pieces that are too big are rotated or split into equal parts with their own tabs.
- Pieces you make can be added to the planner's bar; ZIP with every piece of the track, the supports and a README.
- Planner track width updated to the real sizes (238 mm, lanes 59 mm from the centre).
- Project open to contributions: CONTRIBUTING.md, templates for bugs, ideas and new pieces, pull request template.
- Automated tests (3D engine and app) on every pull request and before every release.

## [1.0.5] - 2026-11-03

- The project becomes open source under the MIT licence (`LICENSE` file, `package.json`, README).

## [1.0.4] - 2026-11-03

- macOS: the app is ad-hoc signed after merging Intel + Apple Silicon, so Apple-silicon Macs no longer reject it as "damaged".
- Web version published to GitHub Pages on every release (lab.cobelli.uk/Mini4WD-Track-Manager/), with real icons for Dock and Home screen.
- README: first-launch instructions for Mac.

## [1.0.3] - 2026-11-02

- Inventory: the table with + and − always keeps its full height; the history no longer shrinks it.
- History in a fixed 5-row box that scrolls inside, with the number of changes.
- The same bug (blocks shrinking) is fixed in every tab of the pane.

## [1.0.2] - 2026-11-02

- Inventory: pressing + or − no longer scrolls the page up because of the history.
- Repeated clicks on the same piece within 2 minutes become a single history row (e.g. "+5 Curve 45°").
- Compact history: last 8 rows, with "Show all".
- Switching tab starts from the top; staying on the same tab keeps the position.

## [1.0.1] - 2026-11-02

- README with a project description, explanation of the inventory, layout generators and extra elements.
- Screenshots of every section in `docs/screenshots/`.

## [1.0.0] - 2026-11-02

First version published as a release, with desktop apps.

- Desktop apps for macOS (universal Intel/Apple Silicon .dmg) and Windows (installer and portable), working offline too.
- Single HTML file with embedded icons, to upload to a static site.
- Version number shown next to the title.

Features already in the earlier test versions:
- 2D plan editor with the pieces of the MINI4WD 2 LANE DIY TRACK set (MakerWorld 542904), closing check, lane lengths, footprint.
- 3D view with walls, raised lane change and supports.
- Extra elements from MakerWorld: jump, saddle, hill, rainbow ramp, spiral, wall, modular 240 straight.
- Parts list with print hours and clips.
- Inventory with a history of changes.
- Ideas: sorted alternatives for the available space and a random generator (lane change, jump, jump track, speed, technical, raised, spiral, compact).
