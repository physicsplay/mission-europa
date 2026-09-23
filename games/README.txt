GAMES FOLDER
============

Stable addresses (never rename these; links and QR codes point to them):

  asteroid-deflection.html   Asteroid Deflection (starting game)
  comet-lander.html          Comet Lander (starting game)
  game-1.html                Game 1 (upload when the studios' versions are built)
  game-2.html                Game 2
  mission-europa-01.html     The Quiet One (bonus mission)

Releasing a new version of a game
  1. Copy the CURRENT file into archive/ and put its version in the name,
     for example archive/asteroid-deflection-v3.0.html. It stays online, so
     crews can compare the old and the new version.
  2. Overwrite the stable file (for example asteroid-deflection.html) with
     the new version. Keep the stable name.
  3. In site-config.js, add the version to "versions" and a line to
     "patchNotes" that credits the crew behind the change.

New games (Game 1, Game 2)
  Both versions live in ONE file. The site opens them as game-1.html?v=A and
  game-1.html?v=B during the blind playtests. After the decision, the chosen
  version is the one players get without ?v.

Tester mode
  Once a game understands ?test=1 (version number, stage select, progress
  reset, mission report), set testerMode: true for it in site-config.js and
  the site shows a Tester mode button.
