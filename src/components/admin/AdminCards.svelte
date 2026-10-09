<script>
  import { config } from '../../lib/store.svelte.js';
  let open = $state(null);
  const used = $derived(Math.min(config.teams.length * config.settings.whoamiTurnsPerTeam, config.cards.length));

  function add() {
    const id = 'c' + Date.now();
    config.cards.push({ id, answer: 'New character', emoji: '❓', clues: ['', '', '', ''], value: '' });
    open = id;
  }
  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= config.cards.length) return;
    [config.cards[i], config.cards[j]] = [config.cards[j], config.cards[i]];
  }
</script>

<div class="card mb-4 p-4 text-sm text-ink/80">
  <b>{config.cards.length} cards</b>, of which the first <b>{used}</b> will be played ({config.teams.length} teams × {config.settings.whoamiTurnsPerTeam} turns). Write the clues from hardest to easiest.
</div>

<div class="grid gap-3 md:grid-cols-2">
  {#each config.cards as c, i (c.id)}
    <div class="card p-4 {i >= used ? 'opacity-60' : ''}">
      <div class="flex items-center gap-3">
        <span class="text-3xl">{c.emoji}</span>
        <span class="flex-1 text-lg font-extrabold">{i + 1}. {c.answer}</span>
        <button class="btn-ghost px-2 py-1" onclick={() => move(i, -1)}>↑</button>
        <button class="btn-ghost px-2 py-1" onclick={() => move(i, 1)}>↓</button>
        <button class="btn-primary px-3 py-1" onclick={() => (open = open === c.id ? null : c.id)}>{open === c.id ? 'Close' : 'Edit'}</button>
      </div>
      {#if open === c.id}
        <div class="mt-3 space-y-2">
          <div class="grid grid-cols-[1fr_80px] gap-2">
            <label><span class="label">Answer</span><input class="input" bind:value={c.answer} /></label>
            <label><span class="label">Emoji</span><input class="input text-center" bind:value={c.emoji} /></label>
          </div>
          {#each c.clues as _, k}
            <label><span class="label">Clue {k + 1} ({config.settings.whoamiPoints[k] ?? '?'} pts)</span><input class="input" bind:value={c.clues[k]} /></label>
          {/each}
          <label><span class="label">Value</span><input class="input" bind:value={c.value} /></label>
          <button class="btn-ghost text-red-600" onclick={() => { if (confirm(`Delete "${c.answer}"?`)) config.cards.splice(i, 1); }}>🗑 Delete</button>
        </div>
      {/if}
    </div>
  {/each}
</div>
<button class="btn-ghost mt-4" onclick={add}>＋ Add card</button>
