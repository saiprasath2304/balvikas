import { defaultConfig, defaultGame, DEFAULT_SETTINGS } from './defaults.js';

const CONFIG_KEY = 'ramayana-utsav:config:v1';
const GAME_KEY = 'ramayana-utsav:game:v1';

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback();
  } catch {
    return fallback();
  }
}

const initialConfig = load(CONFIG_KEY, defaultConfig);
// Pick up any settings added in newer versions of the app.
initialConfig.settings = { ...DEFAULT_SETTINGS, ...initialConfig.settings };

export const config = $state(initialConfig);
export const game = $state(load(GAME_KEY, () => defaultGame(initialConfig.teams)));

$effect.root(() => {
  $effect(() => {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch {}
  });
  $effect(() => {
    try { localStorage.setItem(GAME_KEY, JSON.stringify(game)); } catch {}
  });
});

export const team = (id) => config.teams.find((t) => t.id === id);

export function score(teamId, act) {
  return game.log
    .filter((e) => e.team === teamId && (!act || e.act === act))
    .reduce((s, e) => s + e.pts, 0);
}

export function award(teamId, pts, reason, act = 'general') {
  if (!pts) return;
  game.log.push({ id: crypto.randomUUID(), team: teamId, act, pts, reason, at: Date.now() });
}

export function undoLast() {
  game.log.pop();
}

export function hearts(teamId) {
  return game.hearts[teamId] ?? config.settings.startingHearts;
}

export function loseHeart(teamId) {
  game.hearts[teamId] = Math.max(0, hearts(teamId) - 1);
}

export function resetGame() {
  Object.assign(game, defaultGame(config.teams));
}

export function resetConfig() {
  Object.assign(config, defaultConfig());
}

export function exportJSON() {
  return JSON.stringify({ config, game }, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (data.config) Object.assign(config, data.config);
  if (data.game) Object.assign(game, data.game);
}

export function ranking() {
  return [...config.teams]
    .map((t) => ({ ...t, score: score(t.id) }))
    .sort((a, b) => b.score - a.score);
}
