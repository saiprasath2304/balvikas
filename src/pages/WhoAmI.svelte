<script>
  import { config, game, team, award, score } from '../lib/store.svelte.js';
  import { sfx } from '../lib/sound.js';
  import { celebrate } from '../lib/confetti.js';
  import ScoreStrip from '../components/ScoreStrip.svelte';
  import TeamBadge from '../components/TeamBadge.svelte';

  const S = $derived(config.settings);
  const t = $derived(game.whoami.turn);
  const nTeams = $derived(game.whoami.order.length);
  const total = $derived(Math.min(nTeams * S.whoamiTurnsPerTeam, config.cards.length));
  const teamId = $derived(game.whoami.order[t % nTeams]);
  const tm = $derived(team(teamId));
  const card = $derived(config.cards[t]);
  const done = $derived(t >= total);
  const pts = (k) => S.whoamiPoints[k] ?? S.whoamiPoints.at(-1) ?? 0;

  let phase = $state('ready'); // ready | playing | steal | reveal
  let shown = $state(1); // number of clues revealed
  let timeLeft = $state(0);
  let result = $state(null); // { team, pts } | null
  let wrongFlash = $state(false);

  $effect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return;
    const iv = setTimeout(() => {
      timeLeft -= 1;
      if (timeLeft <= 5 && timeLeft > 0) sfx.tick();
      if (timeLeft === 0) sfx.fail();
    }, 1000);
    return () => clearTimeout(iv);
  });

  function start() {
    shown = 1;
    result = null;
    timeLeft = S.whoamiClueTime;
    phase = 'playing';
    sfx.reveal();
  }

  function nextClue() {
    if (shown >= card.clues.length) return;
    shown += 1;
    timeLeft = S.whoamiClueTime;
    sfx.reveal();
  }

  function correct() {
    const p = pts(shown - 1);
    award(teamId, p, `Guessed ${card.answer} (clue ${shown})`, 'whoami');
    result = { team: teamId, pts: p };
    reveal();
    sfx.win();
    celebrate(tm.color);
  }

  function wrong() {
    wrongFlash = true;
    setTimeout(() => (wrongFlash = false), 600);
    sfx.fail();
    if (shown < card.clues.length) nextClue();
    else phase = 'steal';
  }

  function steal(id) {
    award(id, S.stealPoints, `Stole ${card.answer}`, 'whoami');
    result = { team: id, pts: S.stealPoints, stolen: true };
    reveal();
    sfx.win();
    celebrate(team(id).color);
  }

  function reveal() {
    phase = 'reveal';
    game.whoami.results[t] = { team: teamId, card: card.id, winner: result?.team ?? null, pts: result?.pts ?? 0 };
  }

  function next() {
    game.whoami.turn += 1;
    phase = 'ready';
  }
</script>

<div class="-mx-4 -mt-6 mb-6"><ScoreStrip active={done ? null : teamId} /></div>

{#if done}
  <div class="text-center">
    <div class="text-7xl">🌟</div>
    <h1 class="title-font text-5xl text-maroon">Main Kaun Hoon? complete!</h1>
    <div class="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-4">
      {#each config.teams as tt (tt.id)}
        <div class="card p-5"><TeamBadge team={tt} /><div class="mt-2 text-4xl font-extrabold">{score(tt.id, 'whoami')}</div></div>
      {/each}
    </div>
    <a href="#/leaderboard" class="btn-primary mt-8 text-2xl">🏆 Final Scores</a>
  </div>
{:else if phase === 'ready'}
  <div class="mx-auto max-w-2xl">
    <div class="card animate-pop overflow-hidden text-center">
      <div class="p-3 text-sm font-bold uppercase tracking-widest text-white" style="background: {tm.color}">
        Activity 2 · Turn {t + 1} of {total}
      </div>
      <div class="p-8">
        <div class="text-8xl">{tm.emoji}</div>
        <div class="mt-2 text-xl font-semibold text-ink/60">Two players from</div>
        <div class="title-font text-6xl" style="color: {tm.color}">Team {tm.name}</div>
        <div class="mt-1 text-xl font-semibold text-ink/60">please come forward!</div>
        <button class="btn-primary mt-8 px-10 py-4 text-2xl" onclick={start}>❓ Show first clue</button>
      </div>
    </div>
    <div class="mt-4 flex justify-between text-sm">
      <button class="btn-ghost px-3 py-1" disabled={t === 0} onclick={() => game.whoami.turn--}>← Previous turn</button>
      <button class="btn-ghost px-3 py-1" onclick={next}>Skip turn →</button>
    </div>
    <details class="card mt-4 p-4 text-sm" open>
      <summary class="cursor-pointer font-bold text-maroon">How to play</summary>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-ink/80">
        <li>Two players from the team talk it over and give <b>one answer per clue</b>.</li>
        <li>Clues get easier each time. Guess on clue 1: <b>{pts(0)}</b>, clue 2: <b>{pts(1)}</b>, clue 3: <b>{pts(2)}</b>, clue 4: <b>{pts(3)}</b> points.</li>
        <li>Wrong answer? The next clue appears. After the last clue, any other team can raise their hand and <b>steal</b> for {S.stealPoints} points!</li>
        <li>{S.whoamiClueTime} seconds to think for each clue.</li>
      </ul>
    </details>
  </div>
{:else}
  <div class="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h1 class="title-font text-4xl text-maroon">Main Kaun Hoon? 🤔</h1>
        <span class="font-bold text-ink/50">Card {t + 1}</span>
      </div>
      {#each card.clues.slice(0, shown) as clue, i (i)}
        <div class="card animate-pop flex items-center gap-4 p-5 {i === shown - 1 && phase === 'playing' ? 'ring-4' : 'opacity-80'} {wrongFlash && i === shown - 2 ? 'animate-shake' : ''}" style="--tw-ring-color: {tm.color}">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-extrabold text-white" style="background: {tm.color}">{i + 1}</span>
          <p class="flex-1 text-2xl font-semibold leading-snug sm:text-3xl">{clue}</p>
          <span class="rounded-full bg-amber-100 px-3 py-1 font-extrabold text-maroon">{pts(i)}</span>
        </div>
      {/each}
      {#each card.clues.slice(shown) as _, i}
        <div class="flex items-center gap-4 rounded-3xl border-2 border-dashed border-maroon/15 p-5 text-ink/30">
          <span class="flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-xl font-extrabold">{shown + i + 1}</span>
          <span class="text-xl">Hidden clue…</span>
        </div>
      {/each}

      {#if phase === 'reveal'}
        <div class="card animate-pop mt-4 p-8 text-center">
          <div class="text-8xl">{card.emoji}</div>
          <div class="title-font mt-2 text-5xl text-maroon">I am {card.answer}!</div>
          {#if card.value}<div class="mt-3 inline-block rounded-full bg-amber-100 px-4 py-2 text-lg font-bold text-maroon">🌟 {card.value}</div>{/if}
        </div>
      {/if}
    </div>

    <aside class="space-y-4">
      <div class="card p-4 text-center">
        <TeamBadge team={tm} size="lg" />
        {#if phase === 'playing'}
          <div class="mt-4 text-6xl font-extrabold tabular-nums {timeLeft <= 5 ? 'animate-pulse text-red-600' : ''}">{timeLeft}</div>
          <div class="text-sm text-ink/50">{timeLeft === 0 ? 'Time! Your answer?' : 'seconds to think'}</div>
          <div class="mt-2 text-lg">Worth <b class="text-2xl" style="color: {tm.color}">{pts(shown - 1)}</b> points now</div>
        {/if}
      </div>

      {#if phase === 'playing'}
        <div class="grid gap-2">
          <button class="btn-success py-4 text-xl" onclick={correct}>✓ Correct!</button>
          <button class="btn-danger py-4 text-xl" onclick={wrong}>✗ Wrong</button>
          <button class="btn-ghost" disabled={shown >= card.clues.length} onclick={nextClue}>Next clue (no answer) →</button>
        </div>
      {:else if phase === 'steal'}
        <div class="card animate-pop space-y-2 p-4 text-center">
          <div class="title-font text-2xl text-maroon">🙋 Steal!</div>
          <p class="text-sm text-ink/60">Who raised their hand first and got it right?</p>
          {#each config.teams.filter((x) => x.id !== teamId) as o (o.id)}
            <button class="btn w-full text-white" style="background: {o.color}" onclick={() => steal(o.id)}>{o.emoji} {o.name} +{S.stealPoints}</button>
          {/each}
          <button class="btn-ghost w-full" onclick={reveal}>Nobody, reveal the answer</button>
        </div>
      {:else}
        <div class="card animate-pop space-y-3 p-4 text-center">
          {#if result}
            <div class="text-lg">{result.stolen ? 'Stolen by' : 'Points to'}</div>
            <TeamBadge team={team(result.team)} size="lg" />
            <div class="text-4xl font-extrabold">+{result.pts}</div>
          {:else}
            <div class="text-lg text-ink/60">No points this time</div>
          {/if}
          <button class="btn-primary w-full text-xl" onclick={next}>{t + 1 >= total ? 'Finish 🌟' : 'Next turn →'}</button>
        </div>
      {/if}
    </aside>
  </div>
{/if}
