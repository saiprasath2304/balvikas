<script>
  import { config, score } from '../lib/store.svelte.js';
  const total = $derived(config.agenda.reduce((s, a) => s + Number(a.minutes || 0), 0));
</script>

<section class="text-center">
  <div class="animate-floaty text-7xl">🏹</div>
  <h1 class="title-font mt-2 text-5xl text-maroon sm:text-7xl">{config.settings.eventTitle}</h1>
  <p class="mt-2 text-lg font-semibold text-saffron sm:text-2xl">{config.settings.subtitle}: a journey through the Ramayana</p>
</section>

<section class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {#each config.teams as t, i (t.id)}
    <a href="#/teams" class="card animate-pop group overflow-hidden p-5 text-center transition hover:-translate-y-1" style="animation-delay: {i * 90}ms">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl shadow-inner" style="background: {t.color}22">{t.emoji}</div>
      <div class="title-font mt-3 text-3xl" style="color: {t.color}">{t.name}</div>
      <div class="text-sm font-semibold text-ink/60">{t.tagline}</div>
      <div class="mt-3 text-4xl font-extrabold tabular-nums">{score(t.id)}</div>
      <div class="text-xs font-bold uppercase tracking-widest text-ink/40">points</div>
    </a>
  {/each}
</section>

<section class="mt-10 grid gap-4 md:grid-cols-2">
  <a href="#/puzzle" class="card group flex items-center gap-5 p-6 transition hover:-translate-y-1">
    <div class="text-6xl transition group-hover:rotate-12">🧩</div>
    <div>
      <div class="text-sm font-bold uppercase tracking-widest text-saffron">Activity 1</div>
      <div class="title-font text-3xl text-maroon">Chitra Katha</div>
      <div class="text-ink/70">Put the jumbled Ramayana scenes back together!</div>
    </div>
  </a>
  <a href="#/whoami" class="card group flex items-center gap-5 p-6 transition hover:-translate-y-1">
    <div class="text-6xl transition group-hover:rotate-12">❓</div>
    <div>
      <div class="text-sm font-bold uppercase tracking-widest text-saffron">Activity 2</div>
      <div class="title-font text-3xl text-maroon">Main Kaun Hoon?</div>
      <div class="text-ink/70">Guess the Ramayana character from the clues.</div>
    </div>
  </a>
</section>

<section class="card mt-10 p-6">
  <div class="flex items-baseline justify-between">
    <h2 class="title-font text-3xl text-maroon">Today’s Programme</h2>
    <span class="font-bold text-ink/50">{total} min</span>
  </div>
  <ol class="mt-4 grid gap-2 sm:grid-cols-2">
    {#each config.agenda as a, i (a.id)}
      <li class="flex items-center gap-3 rounded-2xl bg-orange-50/70 px-4 py-2">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon font-bold text-white">{i + 1}</span>
        <span class="flex-1 font-semibold">{a.title}</span>
        <span class="text-sm font-bold text-saffron">{a.minutes}′</span>
      </li>
    {/each}
  </ol>
</section>
