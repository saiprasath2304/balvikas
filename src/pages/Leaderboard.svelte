<script>
  import { config, game, ranking, score, undoLast, team } from '../lib/store.svelte.js';
  import { celebrate } from '../lib/confetti.js';
  import TeamBadge from '../components/TeamBadge.svelte';

  const rows = $derived(ranking());
  const max = $derived(Math.max(1, ...rows.map((r) => r.score)));
  let revealed = $state(false);
  const medals = ['🥇', '🥈', '🥉', '🎖️'];

  function reveal() {
    revealed = true;
    celebrate(rows[0]?.color);
  }
</script>

<div class="text-center">
  <h1 class="title-font text-5xl text-maroon">🏆 Scoreboard</h1>
</div>

<div class="mx-auto mt-8 max-w-3xl space-y-4">
  {#each rows as r, i (r.id)}
    <div class="card flex items-center gap-4 p-4 {revealed && i === 0 ? 'ring-4 ring-gold' : ''}">
      <span class="w-12 text-center text-4xl">{revealed ? medals[i] : r.emoji}</span>
      <div class="flex-1">
        <div class="flex items-baseline justify-between">
          <span class="title-font text-2xl" style="color: {r.color}">{r.name}</span>
          <span class="text-3xl font-extrabold tabular-nums">{r.score}</span>
        </div>
        <div class="mt-1 h-4 overflow-hidden rounded-full bg-black/5">
          <div class="h-full rounded-full transition-all duration-1000" style="width: {(r.score / max) * 100}%; background: {r.color}"></div>
        </div>
        <div class="mt-1 flex gap-4 text-sm text-ink/60">
          <span>🧩 {score(r.id, 'puzzle')}</span>
          <span>❓ {score(r.id, 'whoami')}</span>
          {#if score(r.id, 'general')}<span>⭐ {score(r.id, 'general')}</span>{/if}
        </div>
      </div>
    </div>
  {/each}

  <div class="flex flex-wrap justify-center gap-3 pt-2">
    <button class="btn-primary text-xl" onclick={reveal}>🎉 Announce Winner</button>
  </div>

  {#if revealed && rows[0]}
    <div class="card animate-pop p-8 text-center">
      <div class="text-7xl">{rows[0].emoji}</div>
      <div class="title-font mt-2 text-5xl" style="color: {rows[0].color}">Team {rows[0].name} wins!</div>
      <p class="mt-3 text-xl text-ink/70">But every team showed Bhakti, Dhairya, Shraddha and Seva today. Jai Sri Ram! 🙏</p>
    </div>
  {/if}

  <details class="card p-4">
    <summary class="cursor-pointer font-bold text-maroon">Points history ({game.log.length})</summary>
    <div class="mt-3 max-h-80 space-y-1 overflow-auto">
      {#each [...game.log].reverse() as e (e.id)}
        <div class="flex items-center gap-2 text-sm">
          <TeamBadge team={team(e.team)} size="sm" />
          <span class="flex-1">{e.reason}</span>
          <span class="font-bold {e.pts > 0 ? 'text-emerald-600' : 'text-red-600'}">{e.pts > 0 ? '+' : ''}{e.pts}</span>
        </div>
      {:else}
        <p class="text-ink/50">No points yet.</p>
      {/each}
    </div>
    {#if game.log.length}
      <button class="btn-ghost mt-3 text-sm" onclick={undoLast}>↩ Undo last entry</button>
    {/if}
  </details>
</div>
