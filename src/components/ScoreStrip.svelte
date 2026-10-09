<script>
  import { config, score, hearts } from '../lib/store.svelte.js';
  import Hearts from './Hearts.svelte';
  let { active = null, showHearts = false } = $props();
</script>

<div class="border-b border-maroon/10 bg-white/60">
  <div class="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-2 md:grid-cols-4">
    {#each config.teams as t (t.id)}
      <div
        class="flex items-center gap-2 rounded-2xl px-3 py-1.5 transition-all {active === t.id ? 'scale-[1.03] shadow-lg ring-4' : 'ring-1 ring-black/5'}"
        style="background: {t.color}1f; --tw-ring-color: {active === t.id ? t.color : ''}"
      >
        <span class="text-2xl">{t.emoji}</span>
        <div class="min-w-0 flex-1 leading-tight">
          <div class="truncate font-extrabold" style="color: {t.color}">{t.name}</div>
          {#if showHearts}<Hearts count={hearts(t.id)} max={config.settings.startingHearts} size="text-sm" />{/if}
        </div>
        <div class="text-2xl font-extrabold tabular-nums text-ink">{score(t.id)}</div>
      </div>
    {/each}
  </div>
</div>
