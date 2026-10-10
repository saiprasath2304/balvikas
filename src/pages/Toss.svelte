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
  let mode = $state('lucky'); // lucky | manual
  let manual = $state([]); // team ids in the order the host taps them

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

  function apply(which, order) {
    if (which !== 'whoami') game.puzzle.order = [...order];
    if (which !== 'puzzle') game.whoami.order = [...order];
    game.toss = mode === 'lucky'
      ? { mode, lucky, picks: { ...picks }, winner: winner.id, at: Date.now() }
      : { mode, order: [...order], at: Date.now() };
    applied = which;
    sfx.reveal();
  }

  function setMode(m) {
    mode = m;
    applied = '';
  }

  function tapTeam(id) {
    applied = '';
    manual = manual.includes(id) ? manual.filter((x) => x !== id) : [...manual, id];
    sfx.click();
  }

  function reset() {
    picks = Object.fromEntries(config.teams.map((t) => [t.id, null]));
    lucky = null;
    shown = null;
    manual = [];
    applied = '';
  }
</script>

{#snippet applyButtons(order)}
  <div class="mt-5 grid w-full gap-2">
    <button class="btn-primary" onclick={() => apply('both', order)}>Use for both activities</button>
    <div class="grid grid-cols-2 gap-2">
      <button class="btn-ghost text-sm" onclick={() => apply('puzzle', order)}>🧩 Puzzle only</button>
      <button class="btn-ghost text-sm" onclick={() => apply('whoami', order)}>❓ Who Am I only</button>
    </div>
    {#if applied}<p class="font-bold text-emerald-600">✓ Turn order saved</p>{/if}
  </div>
{/snippet}

<div class="mb-6 flex justify-center">
  <div class="inline-flex rounded-2xl bg-white p-1 shadow ring-1 ring-maroon/10">
    <button class="rounded-xl px-4 py-2 font-bold transition {mode === 'lucky' ? 'bg-maroon text-white' : 'text-maroon hover:bg-orange-50'}" onclick={() => setMode('lucky')}>🎲 Lucky Number Toss</button>
    <button class="rounded-xl px-4 py-2 font-bold transition {mode === 'manual' ? 'bg-maroon text-white' : 'text-maroon hover:bg-orange-50'}" onclick={() => setMode('manual')}>✋ Set order myself</button>
  </div>
</div>

{#if mode === 'manual'}
  <div class="text-center">
    <h1 class="title-font text-5xl text-maroon">✋ Set the Team Order</h1>
    <p class="mt-1 text-lg text-ink/70">Tap the teams in the order they will play. Tap a team again to remove it.</p>
  </div>

  <div class="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
    <div class="grid grid-cols-2 gap-3">
      {#each config.teams as t (t.id)}
        {@const pos = manual.indexOf(t.id)}
        <button
          class="card relative flex flex-col items-center p-6 transition hover:-translate-y-1 {pos >= 0 ? 'ring-4' : ''}"
          style="--tw-ring-color: {t.color}"
          onclick={() => tapTeam(t.id)}
        >
          {#if pos >= 0}
            <span class="animate-pop absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-xl font-extrabold text-white shadow" style="background: {t.color}">{pos + 1}</span>
          {/if}
          <span class="text-6xl">{t.emoji}</span>
          <span class="title-font mt-2 text-3xl" style="color: {t.color}">{t.name}</span>
          <span class="text-sm text-ink/60">{t.tagline}</span>
        </button>
      {/each}
    </div>

    <div class="card flex flex-col p-6 text-center">
      <div class="text-sm font-bold uppercase tracking-widest text-ink/50">Playing order</div>
      <ol class="mt-4 space-y-2">
        {#each config.teams as _, i}
          {@const id = manual[i]}
          <li class="flex items-center gap-3 rounded-2xl px-3 py-2 {id ? 'bg-orange-50' : 'border-2 border-dashed border-maroon/15'}">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-maroon font-bold text-white">{i + 1}</span>
            {#if id}<TeamBadge team={team(id)} />{:else}<span class="text-ink/30">Tap a team…</span>{/if}
          </li>
        {/each}
      </ol>
      {#if manual.length === config.teams.length}
        {@render applyButtons(manual)}
      {:else}
        <p class="mt-4 text-sm text-ink/50">Choose all {config.teams.length} teams to save the order.</p>
      {/if}
      {#if manual.length}<button class="btn-ghost mt-2 text-sm" onclick={() => { manual = []; applied = ''; }}>↺ Clear</button>{/if}
    </div>
  </div>
{:else}
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
      {@render applyButtons(rotationFrom(winner.id))}
      <button class="btn-ghost mt-2 w-full text-sm" onclick={reset}>↺ Toss again</button>
    {/if}
  </div>
</div>
{/if}
