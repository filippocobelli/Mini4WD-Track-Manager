# Changelog

Versions follow [Semantic Versioning](https://semver.org/): MAJOR.MINOR.PATCH.
- PATCH: fixes that don't change how things work (e.g. 1.0.1)
- MINOR: new compatible features (e.g. 1.1.0)
- MAJOR: changes that break tracks or saved data (e.g. 2.0.0)

## [2.7.0] - 2026-11-10

**Drawings: the fewest pieces that still look like your drawing.**

- The scale of a drawing (by hand, or a line drawing in a picture) is no longer taken from its tightest bend, which made
  small wobbles blow the track up to hundreds of pieces. The planner now tries the drawing at increasing sizes, from a
  kit-oval-sized track upwards, and keeps the **first size that is faithful**: closed, within 3% of the drawing (relative
  to its size) and with the same crossings. It then refines between that size and the previous one.
  Drawings made too big are shrunk too. Tests: figure-eight 54 → 27 pieces, blob 34 → 17, 12 m oval → 18 pieces.
- When no size is faithful (bends or details too small for the kit pieces) it picks the best balance between few pieces
  and closeness, and says so.
- A fit that can't follow the drawing is stopped instead of adding pieces up to 400.

## [2.6.1] - 2026-11-10

- Made-to-measure pieces longer than the printer bed (set in the Workshop, 256×256 by default) are counted in *Parts*
  as the number of prints they need (e.g. a 415 mm ramp = 2 parts of ~208 mm, each with its tabs), and the bridge
  report says so.

## [2.6.0] - 2026-11-10

**Bridges where the track crosses itself.**

- If a drawn or imported layout runs over itself, the planner now **builds the bridge**: one pass is lifted over the
  other, the straights just before and after the crossing become a made-to-measure ramp up and ramp down (★) of the
  same length, so the track stays closed, and the supports underneath are counted.
  It picks the pass with the gentlest ramps and the shortest raised section, and avoids lifting the lane change.
- Then it **checks** and tells you: clearance under the bridge, ramp slope, track still closed.
- **🌉 Build bridges** in *Summary* for any crossing at the same level (also on tracks built by hand);
  option *Where the layout crosses itself build a bridge* in *Ideas* (on by default).
- The plan draws raised pieces over the ones below them.

## [2.5.0] - 2026-11-10

**Pictures of layouts from track editors.**

- New image tracer: it finds the whole track band even when it is light grey on a light background, with a grid,
  coloured sections and text around it (e.g. exports from online Mini4WD track editors), and follows its centre line
  as one loop, straight on through crossings and bridges.
- **Automatic scale**: the planner measures the track width in the picture and counts the lanes (2, or 3 like the
  Tamiya Japan Cup Jr. circuit, 115 mm lanes): a 3-lane layout is rebuilt at its real size as a 2-lane track.
  The lanes and a manual width can still be set in *Ideas*.
- **Drawings get a scale too**: if the bends of a hand drawing (or of a line drawing in a picture) are tighter than
  the kit curves (radius 48 cm), the drawing is enlarged as needed; a few nearby scales are tried and the one that
  follows the drawing best wins. The drawing under the track is scaled the same way, so they line up.
  Option *Fit the drawing's scale to the kit curves* in *Ideas* (on by default).
- Crossings are reported: where the layout runs over itself it needs a bridge (ramps and supports).
- The rebuild never starts on a crossing and refuses closings that stray far from the picture.
- Pictures are processed at up to 900 px (was 500) for more detail.

## [2.4.0] - 2026-11-10

**Re-close the track following its shape.**

- New **🔁 Close it following the drawing / keeping the shape** in *Summary* whenever the track is open or offset:
  the whole track is rebuilt along the original drawing (or along its current shape if it wasn't drawn), with kit pieces,
  and closed exactly. The **special pieces you added** — lane change, jumps, saddles, hills, walls, ramps, spirals —
  are kept, in the same order and roughly at the same point of the lap.
  It fixes cases the local suggestions can't, e.g. a lane change inserted by hand in a drawn track.
- **Swap piece** uses it on its own when moving straights is not enough to close the track again.
- The drawing is now saved with the track (it survives a reload, Undo restores it); loading a ready-made track,
  a generated layout or **🗑 Clear** removes it.

## [2.3.1] - 2026-11-09

- New **🗑 Clear** button in the toolbar: removes the whole track (the starting kit oval too), the drawing and the imported
  picture in one tap; **↶ Undo** brings everything back.
- While drawing, the track already in the plan is shown faded, so the new line stays visible.

## [2.3.0] - 2026-11-09

**Swap a piece and the track closes again by itself.**

- Select a piece in the plan and press **⇆ Swap piece** (or look at the top of *Summary*):
  - a straight becomes a jump, a saddle, a hill, a wall, the lane change or another straight;
  - a curve becomes a **raised curve**: the planner puts the rainbow ramps before and after the whole turn
    (and can bring it back to the ground).
- If the new piece has a different length, the planner **closes the track again** by adding or removing straights
  along one or two directions, never touching the piece you chose. It prefers removing pieces on the same side
  (same footprint); the other solutions stay one tap away ("Alternatively: added …").
  When kit straights can't make the exact length, it uses one made-to-measure piece (★) from the Workshop.

## [2.2.1] - 2026-11-09

- Web version: the GitHub Pages workflow now builds and deploys in two separate jobs, as GitHub recommends
  (the single job kept failing with "No artifacts named github-pages").

## [2.2.0] - 2026-11-09

**Draw a track or start from a picture, and close every loop exactly.**

- **Draw** (✏️ in the toolbar or in *Ideas*): draw the lap in the plan with the mouse or a finger, at real scale.
  The planner rebuilds it with kit pieces, puts the lane change on a straight stretch and closes the loop.
- **Image** (🖼): upload a drawing or a plan of a layout. The planner finds the track in the picture, scales it to the
  real width you enter and rebuilds it the same way; the picture stays under the plan as a guide.
- **Closing suggestions** in *Summary*: the planner now checks position, heading **and height**, and proposes ready-to-apply fixes:
  swapping, inserting or removing one piece anywhere (e.g. "Piece 2: 215 → 200", "Insert Ramp ↓ after piece 9"),
  completing the loop from the end, or a made-to-measure piece (★) from the Workshop when kit pieces can't do it.
- A track that closes only within the clip tolerance is now shown as **"Closed, but offset"**, with the offset
  sideways, lengthwise and in degrees, instead of plain "Closed".
- **Parts**: every piece to print has a **MakerWorld** link and a **Make STL** button that opens it in the Workshop;
  new **STL ZIP of the missing ones** with only the pieces you don't have in stock.
- New geometry module `app/trace.js` (solver, sketch fitting, image tracing) with its own tests.

## [2.1.1] - 2026-11-04

- New project page at lab.cobelli.uk/Mini4WD-Track-Manager/ (English, with Italian at /it/), in the same style as the
  other lab.cobelli.uk projects: what it does, screenshots, how to start, Ko-fi and links to GitHub.
- The web app moves to lab.cobelli.uk/Mini4WD-Track-Manager/app/.

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
