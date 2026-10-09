<script>
  import { config, game, score, award, hearts, resetGame, team } from '../../lib/store.svelte.js';
  import TeamBadge from '../TeamBadge.svelte';

  let custom = $state(Object.fromEntries(config.teams.map((t) => [t.id, 5])));
  const S = $derived(config.settings);
  const puzzleTotal = $derived(Math.min(game.puzzle.order.length * S.puzzleRoundsPerTeam, config.scenes.length));
  const whoTotal = $derived(Math.min(game.whoami.order.length * S.whoamiTurnsPerTeam, config.cards.length));

  function setHearts(id, d) {
    game.hearts[id] = Math.max(0, Math.min(S.startingHearts, hearts(id) + d));
  }
  function rotate(which, id) {
    const ids = config.teams.map((t) => t.id);
    const i = ids.indexOf(id);
    game[which].order = [...ids.slice(i), ...ids.slice(0, i)];
  }
</script>

<div class="grid gap-4 lg:grid-cols-2">
  <div class="card p-5 lg:col-span-2">
    <h2 class="title-font text-2xl text-maroon">Scores, hearts & bonus points</h2>
    <p class="text-sm text-ink/60">Give extra points for good behaviour, teamwork or a lovely answer.</p>
    <div class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {#each config.teams as t (t.id)}
        <div class="rounded-2xl p-4 ring-1 ring-black/5" style="background: {t.color}14">
          <div class="flex items-center justify-between"><TeamBadge team={t} /><span class="text-3xl font-extrabold">{score(t.id)}</span></div>
          <div class="mt-3 flex items-center gap-2">
            <input class="input w-20" type="number" bind:value={custom[t.id]} />
            <button class="btn-success px-3 py-1.5" onclick={() => award(t.id, Number(custom[t.id]), 'Bonus from host', 'general')}>+</button>
            <button class="btn-danger px-3 py-1.5" onclick={() => award(t.id, -Number(custom[t.id]), 'Deducted by host', 'general')}>−</button>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <span class="text-sm font-semibold">Hearts:</span>
            <button class="btn-ghost px-2 py-0.5" onclick={() => setHearts(t.id, -1)}>−</button>
            <span class="font-bold">{'❤️'.repeat(hearts(t.id)) || '—'}</span>
            <button class="btn-ghost px-2 py-0.5" onclick={() => setHearts(t.id, 1)}>+</button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  {#each [['puzzle', '🧩 Picture Puzzle', puzzleTotal], ['whoami', '❓ Who Am I?', whoTotal]] as [key, name, total]}
    <div class="card space-y-3 p-5">
      <h2 class="title-font text-2xl text-maroon">{name}</h2>
      <div class="flex items-center gap-3">
        <span class="label m-0">Current turn</span>
        <button class="btn-ghost px-3 py-1" onclick={() => (game[key].turn = Math.max(0, game[key].turn - 1))}>−</button>
        <span class="text-xl font-extrabold">{Math.min(game[key].turn + 1, total)} / {total}</span>
        <button class="btn-ghost px-3 py-1" onclick={() => (game[key].turn = Math.min(total, game[key].turn + 1))}>+</button>
      </div>
      <div>
        <span class="label">Turn order (set automatically by the Toss)</span>
        <div class="flex flex-wrap items-center gap-1">
          {#each game[key].order as id, i}
            <TeamBadge team={team(id)} size="sm" />{#if i < game[key].order.length - 1}<span class="text-ink/40">→</span>{/if}
          {/each}
        </div>
        <div class="mt-2 flex flex-wrap gap-1 text-sm">
          <span class="text-ink/60">Start with:</span>
          {#each config.teams as t (t.id)}
            <button class="rounded-full px-2 py-0.5 font-bold text-white" style="background: {t.color}" onclick={() => rotate(key, t.id)}>{t.name}</button>
          {/each}
        </div>
      </div>
    </div>
  {/each}

  <div class="card p-5 lg:col-span-2">
    <h2 class="title-font text-2xl text-maroon">New game</h2>
    <p class="text-sm text-ink/60">Clears all scores, hearts and progress. Your teams, scenes, cards and settings are kept.</p>
    <button class="btn-danger mt-3" onclick={() => confirm('Reset all scores and progress?') && resetGame()}>↺ Reset game</button>
  </div>
</div>
