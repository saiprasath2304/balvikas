<script>
  import { config, game, team } from '../lib/store.svelte.js';
  import { sfx } from '../lib/sound.js';
  import { celebrate } from '../lib/confetti.js';
  import TeamBadge from '../components/TeamBadge.svelte';

  const MAX = 10;
  let picks = $state(Object.fromEntries(config.teams.map((t) => [t.id, null])));
  let rolling = $state(false);
  let shown = $state(null);
  let lucky = $state(null);
  let applied = $state('');

  const allPicked = $derived(config.teams.every((t) => picks[t.id] != null));
  const takenBy = (n) => config.teams.find((t) => picks[t.id] === n);

  const ranked = $derived(
    lucky == null
      ? []
      : [...config.teams]
          .map((t) => ({ ...t, pick: picks[t.id], diff: Math.abs(picks[t.id] - lucky) }))
          // Closest wins; if two are equally close, the higher number wins.
          .sort((a, b) => a.diff - b.diff || b.pick - a.pick),
  );
  const winner = $derived(ranked[0]);

  function choose(teamId, n) {
    if (rolling || lucky != null) return;
    const other = takenBy(n);
    if (other && other.id !== teamId) return;
    picks[teamId] = picks[teamId] === n ? null : n;
    sfx.click();
  }

  function roll() {
    rolling = true;
    lucky = null;
    applied = '';
    const final = 1 + Math.floor(Math.random() * MAX);
    let delay = 50;
    const step = () => {
      shown = 1 + Math.floor(Math.random() * MAX);
      sfx.drum();
      delay *= 1.12;
      if (delay < 420) setTimeout(step, delay);
      else {
        shown = final;
        lucky = final;
        rolling = false;
        sfx.win();
        setTimeout(() => celebrate(winner?.color), 100);
      }
    };
    step();
  }

  // Winner starts, then the normal 1 → 2 → 3 → 4 rotation continues.
  function rotationFrom(id) {
    const ids = config.teams.map((t) => t.id);
    const i = ids.indexOf(id);
    return [...ids.slice(i), ...ids.slice(0, i)];
  }

  function apply(which) {
    const order = rotationFrom(winner.id);
    if (which !== 'whoami') game.puzzle.order = order;
    if (which !== 'puzzle') game.whoami.order = order;
    game.toss = { lucky, picks: { ...picks }, winner: winner.id, at: Date.now() };
    applied = which;
    sfx.reveal();
  }

  function reset() {
    picks = Object.fromEntries(config.teams.map((t) => [t.id, null]));
    lucky = null;
    shown = null;
    applied = '';
  }
</script>

<div class="text-center">
  <h1 class="title-font text-5xl text-maroon">🎲 The Lucky Number Toss</h1>
  <p class="mt-1 text-lg text-ink/70">
    One child from each team picks a number from 1 to {MAX}. The team closest to the lucky number plays first!
    <span class="block text-sm text-ink/50">If two teams are equally close, the higher number wins.</span>
  </p>
</div>

<div class="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
  <div class="space-y-3">
    {#each config.teams as t (t.id)}
      <div class="card flex flex-wrap items-center gap-3 p-4 {winner?.id === t.id ? 'ring-4 ring-gold' : ''}">
        <div class="w-40"><TeamBadge team={t} size="md" /></div>
        <div class="flex flex-1 flex-wrap gap-1.5">
          {#each Array(MAX) as _, i}
            {@const n = i + 1}
            {@const owner = takenBy(n)}
            <button
              class="h-11 w-11 rounded-xl text-lg font-extrabold transition
                {picks[t.id] === n ? 'scale-110 text-white shadow-lg' : owner ? 'cursor-not-allowed bg-black/5 text-black/20' : 'bg-white ring-1 ring-black/10 hover:bg-orange-50'}"
              style={picks[t.id] === n ? `background:${t.color}` : ''}
              disabled={(owner && owner.id !== t.id) || lucky != null}
              onclick={() => choose(t.id, n)}
            >{n}</button>
          {/each}
        </div>
        {#if lucky != null}
          {@const r = ranked.findIndex((x) => x.id === t.id)}
          <div class="w-20 text-right text-sm font-bold text-ink/60">#{r + 1} · off by {ranked[r].diff}</div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="card flex flex-col items-center justify-center p-6 text-center">
    <div class="text-sm font-bold uppercase tracking-widest text-ink/50">Lucky number</div>
    <div
      class="my-4 flex h-44 w-44 items-center justify-center rounded-full border-8 text-8xl font-extrabold tabular-nums shadow-inner transition
        {lucky != null ? 'animate-pop border-gold bg-amber-50 text-maroon' : 'border-maroon/20 bg-white text-ink/70'}"
    >{shown ?? '?'}</div>

    {#if lucky == null}
      <button class="btn-primary w-full text-xl" disabled={!allPicked || rolling} onclick={roll}>
        {rolling ? 'Rolling…' : '🥁 Roll!'}
      </button>
      {#if !allPicked}<p class="mt-2 text-sm text-ink/50">Every team needs to pick a number first.</p>{/if}
    {:else}
      <div class="animate-pop">
        <div class="text-lg font-semibold">plays first:</div>
        <div class="mt-1"><TeamBadge team={winner} size="lg" /></div>
        <div class="mt-3 text-sm text-ink/60">
          Order: {rotationFrom(winner.id).map((id) => team(id).name).join(' → ')}
        </div>
      </div>
      <div class="mt-5 grid w-full gap-2">
        <button class="btn-primary" onclick={() => apply('both')}>Use for both activities</button>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn-ghost text-sm" onclick={() => apply('puzzle')}>🧩 Puzzle only</button>
          <button class="btn-ghost text-sm" onclick={() => apply('whoami')}>❓ Who Am I only</button>
        </div>
        {#if applied}<p class="font-bold text-emerald-600">✓ Turn order saved</p>{/if}
        <button class="btn-ghost text-sm" onclick={reset}>↺ Toss again</button>
      </div>
    {/if}
  </div>
</div>
