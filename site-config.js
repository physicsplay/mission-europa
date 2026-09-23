/* =========================================================================
   MISSION EUROPA — SITE CONFIG
   -------------------------------------------------------------------------
   This is the only file you normally edit. On GitHub: open this file,
   click the pencil icon, change the text, then "Commit changes".

   Four rules that keep the site working
   1. Dates are written "YYYY-MM-DD", inside quotes.
   2. Every entry in a list ends with a comma. Keep the quotes and commas.
   3. Leave a field as "" (empty text) or null when you do not know it yet.
   4. If the homepage shows a red notice, a comma or quote is missing here.
      Undo your last edit (GitHub "History") and try again.

   Preview another date: add ?today=2026-12-10 to the address.
   ========================================================================= */

window.MISSION_EUROPA = {

  /* One line in Mission Control on the homepage. Change it every week. */
  thisWeek: "Partner schools are joining now. Kick-off in World Space Week, from 5 October.",

  project: {
    start: "2026-10-05",
    end: "2027-04-30",
    joinBy: "2026-09-30",
    lateJoinBy: "2026-10-16",
    setupBy: "2026-10-02",       // teachers: pupil accounts, consent, holidays
    coordinator: "Anastasios (Tasos) Gkinis",
    coordinatorSchool: "2nd General Lyceum of Moschato",
    coordinatorPlace: "Athens, Greece"
  },

  links: {
    twinspace: "",      // paste the project's TwinSpace address when it exists
    esepProfile: "",    // optional: the coordinator's profile on the European School Education Platform
    partnerInfo: "docs/Mission_Europa_Partner_Information_EN.pdf",
    atlas: "https://physicsplay.github.io/Astrojourneys/"
  },

  /* The six phases of the shared timetable (see the partner information). */
  phases: [
    { n: 1, title: "Launch and first playtest", start: "2026-10-05", end: "2026-10-30", core: 2, full: 3,
      text: "Kick-off in World Space Week: call signs, roles, crew mission patches, and your twin crew. Then play both games in tester mode and file your first reports." },
    { n: 2, title: "Patch and retest", start: "2026-11-02", end: "2026-11-20", core: 1, full: 2,
      text: "Play the patched versions against the old ones and decide what stays. Meet your studio, read the mission rules and vote on the physics for Game 1." },
    { n: 3, title: "Game 1", start: "2026-11-23", end: "2027-01-29", core: 4, full: 6,
      text: "Your studio writes the brief (locked 15 Dec). The Greek team builds versions A and B over the winter break. January: blind playtest, decision, carry-over vote." },
    { n: 4, title: "Game 2", start: "2027-02-01", end: "2027-03-19", core: 3, full: 5,
      text: "New studio mix, new brief (locked 19 Feb). Retest the improved Game 1 while Game 2 is built. Blind playtest and decision by 19 March." },
    { n: 5, title: "Final polish", start: "2027-03-22", end: "2027-04-16", core: 1, full: 2,
      text: "Last test round on your school's devices: instructions, difficulty, feedback, accessibility. Final fixes, translations and credits." },
    { n: 6, title: "Launch and review", start: "2027-04-19", end: "2027-04-30", core: 1, full: 2,
      text: "Launch Week, 19–23 April: your crew presents the games to new players. Then look back at what changed because of you." }
  ],

  /* Key dates. precision "month" = only the month is known. */
  keyDates: [
    { date: "2026-10-04", end: "2026-10-10", label: "World Space Week: project kick-off", kind: "launch" },
    { date: "2026-11-01", precision: "month", label: "ESA's Hera arrives at the asteroid pair Didymos and Dimorphos", kind: "space" },
    { date: "2026-12-03", label: "NASA's Europa Clipper swings past Earth on its way to Jupiter", kind: "space" },
    { date: "2026-12-15", label: "Game 1 briefs locked", kind: "deadline" },
    { date: "2027-01-29", display: "End of January", label: "Progress checkpoint: scope of Game 2 confirmed", kind: "deadline" },
    { date: "2027-02-19", label: "Game 2 briefs locked", kind: "deadline" },
    { date: "2027-03-19", label: "Game 2 decision", kind: "deadline" },
    { date: "2027-04-19", end: "2027-04-23", label: "Launch Week", kind: "launch" },
    { date: "2027-04-30", label: "Mission complete", kind: "launch" }
  ],

  /* -----------------------------------------------------------------------
     GAMES
     state: "planned" → "design" → "building" → "ab-test" → "live"
     file:  the STABLE address. To release a new version:
            1) copy the current file into games/archive/ with its version
               in the name, 2) overwrite the stable file, 3) add a line to
               "versions" below and one to "patchNotes".
     testerMode: set to true once the game supports ?test=1.
     ----------------------------------------------------------------------- */
  games: [
    {
      id: "asteroid", kind: "starting", state: "live",
      title: "Asteroid Deflection", subtitle: "The 31.5 Rule",
      tag: "Mission ATLAS #06 · planetary defence",
      pitch: "An asteroid is heading for Earth. Panic-thrusting fails. One small push, years early, works. How small can it be?",
      physics: "d = 31.5 · Δv · t",
      file: "games/asteroid-deflection.html",
      image: "assets/img/asteroid-deflection.jpg",
      version: "3.0", testerMode: false, thread: "",
      versions: [
        { v: "3.0", date: "2026-10-05", file: "games/archive/asteroid-deflection-v3.0.html", note: "Starting version" }
      ]
    },
    {
      id: "comet", kind: "starting", state: "live",
      title: "Comet Lander", subtitle: "Rosetta's Philae",
      tag: "Mission ATLAS #09 · free fall",
      pitch: "Drop a lander onto comet 67P, where gravity is ten thousand times weaker than on Earth. Compute the fall first, then face Philae's real bounce.",
      physics: "h = v₀t + ½gt²",
      file: "games/comet-lander.html",
      image: "assets/img/comet-lander.jpg",
      version: "2.0", testerMode: false, thread: "",
      versions: [
        { v: "2.0", date: "2026-10-05", file: "games/archive/comet-lander-v2.0.html", note: "Starting version" }
      ]
    },
    {
      id: "game-1", kind: "new", state: "planned",
      title: "Game 1", subtitle: "Designed by two international studios",
      pitch: "Two studios, two versions, one winner chosen by new players in every school. The best idea from the other version still makes it in.",
      physics: "Chosen by vote in November",
      decideBy: "2027-01-29",
      file: "games/game-1.html",
      image: "", version: "", testerMode: false, thread: "",
      studios: [],          // e.g. { name: "Studio Hera", crews: ["c01", "c02", "c03"], version: "A" }
      revealed: false,      // true after the A/B reveal: shows which studio made which version
      results: {},          // one result per school, e.g. { c01: "A", c02: "B" }
      decision: "",         // "A" or "B" once decided
      carryOver: "",        // the feature carried over from the other version
      versions: []
    },
    {
      id: "game-2", kind: "new", state: "planned",
      title: "Game 2", subtitle: "New studio mix",
      pitch: "Same process, different teammates. If time runs short, it becomes one version with a level from every school.",
      physics: "Chosen by vote in February",
      decideBy: "2027-03-19",
      file: "games/game-2.html",
      image: "", version: "", testerMode: false, thread: "",
      studios: [], revealed: false, results: {}, decision: "", carryOver: "",
      versions: []
    },
    {
      id: "quiet", kind: "bonus", state: "live",
      title: "The Quiet One", subtitle: "Mission Europa 01 · bonus",
      tag: "Crew-link mission · optional",
      pitch: "Five stations, five sealed measurements. No station can weigh the asteroid alone, so crews have to pool their evidence before choosing a spacecraft.",
      physics: "M = ρ · πD³⁄6",
      file: "games/mission-europa-01.html",
      image: "assets/img/the-quiet-one.jpg",
      version: "4.0", testerMode: false, thread: "",
      versions: [
        { v: "4.0", date: "2026-09-07", file: "games/archive/mission-europa-01-v4.0.html", note: "Current version" }
      ]
    }
  ],

  /* -----------------------------------------------------------------------
     CREWS (one per school, up to six)
     status: "confirmed" or "open".  twin: the id of the twin crew.
     patch: an image in media/patches/ once the crew has designed it.
     ----------------------------------------------------------------------- */
  crews: [
    { id: "c01", code: "01", status: "confirmed", name: "", school: "2nd General Lyceum of Moschato", place: "Athens", country: "Greece", cc: "GR", accent: "#5E49FF", twin: "", patch: "" },
    { id: "c02", code: "02", status: "open", name: "", school: "", place: "", country: "", cc: "", accent: "#00BFA3", twin: "", patch: "" },
    { id: "c03", code: "03", status: "open", name: "", school: "", place: "", country: "", cc: "", accent: "#FF4F91", twin: "", patch: "" },
    { id: "c04", code: "04", status: "open", name: "", school: "", place: "", country: "", cc: "", accent: "#F2A900", twin: "", patch: "" },
    { id: "c05", code: "05", status: "open", name: "", school: "", place: "", country: "", cc: "", accent: "#00A8FF", twin: "", patch: "" },
    { id: "c06", code: "06", status: "open", name: "", school: "", place: "", country: "", cc: "", accent: "#7ACC29", twin: "", patch: "" }
  ],

  /* Newest first. type: "fix", "feature", "physics", "balance" or "text".
     credit: crew ids, e.g. ["c03"].
     Example: { date: "2026-10-22", game: "asteroid", version: "3.1", type: "fix",
                text: "The drift graph now labels its axes.", credit: ["c02"] }, */
  patchNotes: [],

  /* Confirmed bugs and physics errors. The leaderboard adds up the points.
     Example: { date: "2026-10-16", crew: "c04", game: "comet", points: 3,
                text: "A hint showed the answer in Stage 3." }, */
  bugBounty: [],

  /* Crash landings worth remembering (GIF or JPG in media/bloopers/).
     Example: { title: "Philae, but worse", crew: "c05", file: "media/bloopers/bounce.gif" }, */
  bloopers: []
};
