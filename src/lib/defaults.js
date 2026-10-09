import { SCENES } from './scenes.js';
import { CARDS } from './cards.js';

export const DEFAULT_TEAMS = [
  {
    id: 't1',
    name: 'Bhakti',
    tagline: "Hanuman's Devotion",
    emoji: '🐒',
    color: '#f97316',
    meaning: 'Bhakti means loving devotion. Hanuman served Rama with his whole heart and asked for nothing in return.',
  },
  {
    id: 't2',
    name: 'Dhairya',
    tagline: "Jatayu's Courage",
    emoji: '🦅',
    color: '#0ea5e9',
    meaning: 'Dhairya means courage. Old Jatayu fought mighty Ravana to save Sita, even though he knew he could not win.',
  },
  {
    id: 't3',
    name: 'Shraddha',
    tagline: "Shabari's Faith",
    emoji: '🫐',
    color: '#8b5cf6',
    meaning: 'Shraddha means steady faith. Shabari waited for Rama her whole life, sure that he would come one day.',
  },
  {
    id: 't4',
    name: 'Seva',
    tagline: "Lakshmana's Service",
    emoji: '🏹',
    color: '#16a34a',
    meaning: 'Seva means selfless service. Lakshmana left every comfort behind to serve Rama and Sita in the forest.',
  },
];

export const DEFAULT_AGENDA = [
  { id: 'a1', title: 'Welcome & Opening Prayer', minutes: 5, notes: 'Light the lamp, chant Om 3 times, Ganesha prayer.', link: '' },
  { id: 'a2', title: 'Meet the Teams', minutes: 5, notes: 'Show the four team names and what each one means. Ask one child per team to explain theirs.', link: '#/teams' },
  { id: 'a3', title: 'The Toss: Lucky Number', minutes: 3, notes: 'One child from each team picks a number from 1 to 10. Closest to the lucky number plays first.', link: '#/toss' },
  { id: 'a4', title: 'Activity 1: Chitra Katha (Picture Puzzle)', minutes: 26, notes: '20 Ramayana scenes in story order, 5 per team. Kids call out the numbers to swap and the host drags.', link: '#/puzzle' },
  { id: 'a5', title: 'Bhajan Break', minutes: 4, notes: 'A short Rama bhajan, e.g. "Rama Rama Rama Sita".', link: '' },
  { id: 'a6', title: 'Activity 2: Main Kaun Hoon? (Who Am I?)', minutes: 12, notes: '2 turns per team. Clues are revealed one at a time, and guessing earlier earns more points. Wrong answers can be stolen.', link: '#/whoami' },
  { id: 'a7', title: 'Results, Values Recap & Closing Prayer', minutes: 5, notes: 'Announce the winners, recap one value from each team name, Samastha Lokah Sukhino Bhavantu.', link: '#/leaderboard' },
];

export const DEFAULT_SETTINGS = {
  eventTitle: 'Ramayana Utsav',
  subtitle: 'Sri Sathya Sai Balvikas',
  adminPin: '1234',
  startTime: '10:00',
  // Activity 1
  puzzleRoundsPerTeam: 5,
  puzzleDefaultTime: 120,
  puzzleDefaultGrid: 3,
  startingHearts: 3,
  solvePoints: 10,
  timeBonusEvery: 15, // +1 point per N seconds left
  peekCost: 2,
  peekSeconds: 3,
  nameBonus: 5,
  timeoutCostsHeart: true,
  heartBonus: 5, // per heart left at end of Activity 1
  showCorrectGlow: true,
  // Activity 2
  whoamiTurnsPerTeam: 2,
  whoamiClueTime: 30,
  whoamiPoints: [40, 30, 20, 10],
  stealPoints: 10,
  sound: true,
};

export function defaultConfig() {
  return structuredClone({
    teams: DEFAULT_TEAMS,
    agenda: DEFAULT_AGENDA,
    scenes: SCENES,
    cards: CARDS,
    settings: DEFAULT_SETTINGS,
  });
}

export function defaultGame(teams) {
  return {
    log: [], // { id, team, act, pts, reason, at }
    hearts: Object.fromEntries(teams.map((t) => [t.id, null])), // null = use startingHearts
    puzzle: { order: teams.map((t) => t.id), turn: 0, results: [], heartBonusGiven: false },
    whoami: { order: teams.map((t) => t.id), turn: 0, results: [] },
    toss: null,
  };
}
