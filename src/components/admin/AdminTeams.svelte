<script>
  import { config } from '../../lib/store.svelte.js';
</script>

<div class="grid gap-4 md:grid-cols-2">
  {#each config.teams as t, i (t.id)}
    <div class="card space-y-3 p-5" style="border-top: 6px solid {t.color}">
      <div class="flex items-center gap-3">
        <span class="text-4xl">{t.emoji}</span>
        <span class="title-font text-2xl" style="color: {t.color}">Team {i + 1}</span>
      </div>
      <div class="grid grid-cols-[1fr_80px_80px] gap-2">
        <label><span class="label">Name</span><input class="input" bind:value={t.name} /></label>
        <label><span class="label">Emoji</span><input class="input text-center" bind:value={t.emoji} /></label>
        <label><span class="label">Colour</span><input class="input h-[42px] p-1" type="color" bind:value={t.color} /></label>
      </div>
      <label><span class="label">Tagline</span><input class="input" bind:value={t.tagline} /></label>
      <label><span class="label">Meaning (shown on the Teams page)</span><textarea class="input" rows="3" bind:value={t.meaning}></textarea></label>
    </div>
  {/each}
</div>
