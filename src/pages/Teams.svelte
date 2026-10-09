<script>
  import { config } from '../lib/store.svelte.js';
  let flipped = $state({});
</script>

<div class="text-center">
  <h1 class="title-font text-5xl text-maroon">Meet the Teams</h1>
  <p class="mt-1 text-lg text-ink/70">Each team is named after a value shown by a hero of the Ramayana. Tap a card to see what it means.</p>
</div>

<div class="mt-8 grid gap-6 md:grid-cols-2">
  {#each config.teams as t, i (t.id)}
    <button
      class="card animate-pop relative min-h-64 overflow-hidden p-8 text-left transition hover:-translate-y-1"
      style="animation-delay: {i * 120}ms"
      onclick={() => (flipped[t.id] = !flipped[t.id])}
    >
      <div class="absolute -right-6 -top-6 text-[10rem] opacity-10">{t.emoji}</div>
      <div class="flex items-center gap-4">
        <div class="flex h-24 w-24 items-center justify-center rounded-3xl text-6xl text-white shadow-lg" style="background: {t.color}">{t.emoji}</div>
        <div>
          <div class="text-sm font-bold uppercase tracking-widest text-ink/50">Team {i + 1}</div>
          <div class="title-font text-5xl" style="color: {t.color}">{t.name}</div>
          <div class="text-lg font-semibold text-ink/70">{t.tagline}</div>
        </div>
      </div>
      {#if flipped[t.id]}
        <p class="animate-pop mt-6 text-xl leading-relaxed">{t.meaning}</p>
      {:else}
        <p class="mt-6 text-ink/40">Tap to reveal the meaning ✨</p>
      {/if}
    </button>
  {/each}
</div>
