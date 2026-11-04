# MISSION EUROPA — website

The project hub for the eTwinning project **Mission Europa** (October 2026 to April 2027).
Founding schools: 2nd General Lyceum of Moschato (Athens, Greece), Liceo Scientifico Statale
Renato Caccioppoli (Naples, Italy) and IES Las Espeñetas (Orihuela, Spain).
It is a static site for GitHub Pages: no framework, no build step, no server, no cookies,
no analytics and no external requests. It also works offline: open `index.html`.

## What is in the folder

```text
mission-europa-site/
├─ index.html              the homepage (students first, teachers at the end)
├─ site-config.js          ← the only file you normally edit
├─ 404.html                "Lost in space" page for broken links
├─ assets/
│  ├─ styles.css
│  ├─ app.js               reads site-config.js and builds the dynamic parts
│  ├─ img/                 game screenshots
│  └─ vendor/qrcode.min.js QR code generator (MIT, Kazuhiko Arase), stored locally
├─ games/                  stable game addresses (see games/README.txt)
│  └─ archive/             old versions, kept for before/after comparisons
├─ docs/                   Partner information (PDF)
└─ media/
   ├─ patches/             crew mission patches
   └─ bloopers/            crash-landing GIFs
```

## Publish on GitHub Pages with missioneuropa.eu

1. Upload the **contents** of this folder to the repository root and commit.
2. Repository → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Settings → Pages → Custom domain: `missioneuropa.eu`, then tick *Enforce HTTPS* when it appears.
4. At the domain registrar, add four `A` records for `missioneuropa.eu`:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`,
   and a `CNAME` record for `www` pointing to `<your-github-username>.github.io`.

If the site lives somewhere else first (for example `username.github.io/mission-europa/`),
everything still works except the social-media preview image: change the two
`missioneuropa.eu` addresses in the `og:` lines at the top of `index.html`.

## Weekly routine (2 minutes)

Open `site-config.js` on GitHub → pencil icon → change `thisWeek` → *Commit changes*.
The phase marker, the countdowns and the key dates move by themselves.

## Common jobs, all in `site-config.js`

| Job | What to change |
|---|---|
| A partner school joins | In `crews`: delete the `//` in front of a spare line, fill `school`, `place`, `country`, `cc` (two letters, e.g. `"PT"`), and add its id to the `twin` list of the crews it works with. Mission Control rearranges itself for 3–6 crews. |
| Twin crews are paired | Set `twin` on one of the two crews, e.g. `twin: "c04"`. The other side updates itself. |
| A crew sends its mission patch | Put the image in `media/patches/` and set `patch: "media/patches/c01.png"`. |
| Tester mode is ready in a game | Set `testerMode: true` for that game. A *Tester mode* button appears. |
| A game gets a new version | Follow `games/README.txt`, then add the version to `versions` and a line to `patchNotes`. |
| Studios are formed | For Game 1 or 2, fill `studios`, e.g. `{ name: "Studio Hera", crews: ["c01","c02"], version: "A" }`. |
| Blind playtests start | Set the game's `state: "ab-test"` and upload `games/game-1.html` (both versions in one file, switched by `?v=A` / `?v=B`). |
| A school reports its result | Add it to `results`, e.g. `results: { c01: "A", c02: "B" }`. The Decision Room counts it. |
| The decision is made | Set `decision: "A"`, `carryOver: "…"`, and `revealed: true` to show which studio made which version. Then `state: "live"`. |
| A bug is confirmed | Add a line to `bugBounty` with the crew and the points. The leaderboard adds them up. |
| A crash landing is worth keeping | Put the GIF in `media/bloopers/` and add it to `bloopers`. No faces, no names. |
| A school joins (Crew Debrief) | Also add its choice to "Your crew" in the Google Form, written exactly `Crew 04 · City (CC)`, so the pre-filled link selects it. |
| The Crew Debrief form is rebuilt | Paste the new form address and the new `entry.` codes (from the form's pre-filled link) into `debrief` in `site-config.js`. Never paste the responses spreadsheet's address: this repository is public. |
| The TwinSpace exists | Paste its address in `links.twinspace`. Per-game forum threads go in each game's `thread`. |

Game states: `planned` → `design` → `building` → `ab-test` → `live`.

## Check a date before it happens

Add `?today=2026-12-10` to the address to see the site as it will look on that day.

## If something breaks

A red notice at the top of the page means `site-config.js` has a missing comma or quote.
Open the file's *History* on GitHub, compare with the previous version, and fix or revert the last change.

## The Quiet One

`games/mission-europa-01.html` is kept as an optional bonus mission (five stations, one
shared decision). Teacher switches: `?station=echo` assigns a station, `?crews=echo,drift,auriga`
runs with fewer schools. To hide it, delete its entry from `games` in `site-config.js`.

## Licences

Games: MIT. Student contributions (patches, text, sound, translations): CC BY, credited to the crew.
QR code generator: MIT (see the header of `assets/vendor/qrcode.min.js`).
