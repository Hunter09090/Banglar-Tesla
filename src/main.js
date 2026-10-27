import { Game } from "./game.js";
import { InputController } from "./input.js";

const $ = (id) => document.getElementById(id);
const ui = {
  canvas: $("game-canvas"),
  start: $("start-screen"),
  startButton: $("start-button"),
  pause: $("pause-screen"),
  pauseButton: $("pause-button"),
  resumeButton: $("resume-button"),
  gameover: $("gameover-screen"),
  gameoverTitle: $("gameover-title"),
  gameoverCopy: $("gameover-copy"),
  restartButton: $("restart-button"),
  message: $("message-banner"),
  score: $("score-value"),
  cash: $("cash-value"),
  battery: $("battery-value"),
  batteryMeter: $("battery-meter"),
  chaos: $("chaos-value"),
  chaosMeter: $("chaos-meter"),
  missionTitle: $("mission-title"),
  missionCopy: $("mission-copy"),
  missionState: $("mission-state"),
  bestScore: $("best-score"),
  trips: $("trips-value"),
  totalCash: $("total-cash"),
  missionIntro: $("mission-intro")
};

const input = new InputController();
let game;
let messageTimer;
const money = (value) => "৳" + Math.max(0, Math.floor(value)).toLocaleString("en-US");

function flashMessage(text) {
  ui.message.textContent = text;
  ui.message.classList.add("show");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => ui.message.classList.remove("show"), 1800);
}
function setOverlay(which) {
  ui.start.classList.toggle("hidden", which !== "start");
  ui.pause.classList.toggle("hidden", which !== "pause");
  ui.gameover.classList.toggle("hidden", which !== "gameover");
}
function updateUI(state) {
  ui.score.textContent = Math.floor(state.score).toLocaleString("en-US");
  ui.cash.textContent = money(state.cash);
  ui.battery.textContent = Math.round(state.battery) + "%";
  ui.batteryMeter.style.width = Math.max(0, state.battery) + "%";
  ui.chaos.textContent = Math.round(state.chaos) + "%";
  ui.chaosMeter.style.width = Math.max(0, state.chaos) + "%";
  ui.missionTitle.textContent = state.missionTitle;
  ui.missionCopy.textContent = state.missionCopy;
  ui.missionState.textContent = state.missionState;
  ui.bestScore.textContent = Math.floor(state.bestScore).toLocaleString("en-US");
  ui.trips.textContent = state.trips.toLocaleString("en-US");
  ui.totalCash.textContent = money(state.totalCash);
}
function startGame() {
  setOverlay("none");
  document.body.classList.add("is-playing");
  game.start();
}
function pauseGame() {
  if (!game || !game.running) return;
  game.pause();
  setOverlay("pause");
}
function resumeGame() {
  setOverlay("none");
  game.resume();
}
function restartGame() {
  setOverlay("none");
  game.reset();
  game.start();
}

game = new Game(ui.canvas, input, {
  onUpdate: updateUI,
  onMessage: flashMessage,
  onGameOver: (reason, state) => {
    setOverlay("gameover");
    ui.gameoverTitle.textContent = reason.title;
    ui.gameoverCopy.textContent = reason.copy;
    updateUI(state);
  },
  onStart: () => { setOverlay("none"); document.body.classList.add("is-playing"); },
  onPause: () => setOverlay("pause")
});

ui.startButton.addEventListener("click", startGame);
ui.resumeButton.addEventListener("click", resumeGame);
ui.restartButton.addEventListener("click", restartGame);
ui.pauseButton.addEventListener("click", pauseGame);
$("sound-toggle").addEventListener("click", () => flashMessage("সাউন্ড সিস্টেম পরের ধাপে যোগ হবে।"));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && game.running) pauseGame();
  if ((event.key === "Enter") && !game.running && !game.ended) startGame();
});
updateUI(game.getState());
