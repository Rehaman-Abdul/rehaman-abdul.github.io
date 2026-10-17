// Bootstrap and routing between the start screen, the game and the debrief.
import { loadRole } from "../content/roles/index.js";
import { parseSeed, seedFromTime } from "./engine/rng.js";
import { recordRun } from "./progress.js";
import { load } from "./storage.js";
import { initLiveRegions } from "./ui/a11y.js";
import { renderDebrief } from "./ui/debrief.js";
import { renderGame } from "./ui/gameScreen.js";
import { applySettings } from "./ui/settings.js";
import { renderStartScreen } from "./ui/startScreen.js";
import strings from "../content/strings.js";

load();
applySettings();
initLiveRegions();

const root = document.getElementById("app");
let last = { roleId: null, name: "", difficulty: "standard" };
let firstScreen = true;

function showStart(focus) {
  document.title = strings.app.title + ": " + strings.app.subtitle.toLowerCase();
  renderStartScreen(root, { initial: last, focus, onStart: startGame });
  // After leaving a game, move focus to the new screen. On first load, leave it
  // alone so the skip link is the first Tab stop.
  if (!firstScreen && !focus) document.getElementById("main").focus({ preventScroll: true });
  firstScreen = false;
}

async function startGame({ roleId, name, difficulty }) {
  last = { roleId, name, difficulty };
  const role = await loadRole(roleId);
  const seed = parseSeed(globalThis.location.search) ?? seedFromTime();
  document.title = `${role.title} · ${strings.app.title}`;
  const screen = renderGame(root, {
    role,
    options: { difficulty, name, seed },
    onQuit: () => showStart(),
    onEnd: (ending) => {
      document.title = `${ending.title} · ${strings.app.title}`;
      renderDebrief(root, {
        game: screen.game,
        ending,
        progress: recordRun({ snapshot: screen.game.snapshot(), role }),
        onAgain: () => startGame(last),
        onAnother: () => showStart(),
        onDifficulty: () => showStart("difficulty"),
      });
    },
  });
}

showStart();
