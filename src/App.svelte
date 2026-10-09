<script>
  import { config } from './lib/store.svelte.js';
  import Home from './pages/Home.svelte';
  import Teams from './pages/Teams.svelte';
  import Toss from './pages/Toss.svelte';
  import Puzzle from './pages/Puzzle.svelte';
  import WhoAmI from './pages/WhoAmI.svelte';
  import Leaderboard from './pages/Leaderboard.svelte';
  import Admin from './pages/Admin.svelte';

  const routes = {
    '': Home, teams: Teams, toss: Toss, puzzle: Puzzle,
    whoami: WhoAmI, leaderboard: Leaderboard, admin: Admin,
  };
  const nav = [
    ['', 'Home', '🏠'], ['teams', 'Teams', '🚩'], ['toss', 'Toss', '🎲'],
    ['puzzle', 'Picture Puzzle', '🧩'], ['whoami', 'Who Am I?', '❓'],
    ['leaderboard', 'Scores', '🏆'], ['admin', 'Admin', '⚙️'],
  ];

  const current = () => location.hash.replace(/^#\/?/, '').split('?')[0];
  let path = $state(current());
  $effect(() => {
    const on = () => { path = current(); window.scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  });
  const Page = $derived(routes[path] ?? Home);
  let menuOpen = $state(false);

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }
</script>

<div class="flex min-h-full flex-col">
  <header class="sticky top-0 z-30 border-b border-maroon/10 bg-parchment/85 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
      <a href="#/" class="flex items-center gap-2">
        <span class="text-3xl">🏹</span>
        <span class="leading-tight">
          <span class="title-font block text-xl text-maroon sm:text-2xl">{config.settings.eventTitle}</span>
          <span class="hidden text-xs font-semibold tracking-wide text-saffron sm:block">{config.settings.subtitle}</span>
        </span>
      </a>
      <nav class="ml-auto hidden items-center gap-1 lg:flex">
        {#each nav as [p, label, icon]}
          <a href="#/{p}" class="rounded-xl px-3 py-1.5 text-sm font-bold transition {path === p ? 'bg-maroon text-white' : 'text-maroon hover:bg-orange-100'}">
            <span class="mr-1">{icon}</span>{label}
          </a>
        {/each}
      </nav>
      <button class="btn-ghost ml-auto px-3 py-1.5 lg:ml-1" onclick={fullscreen} title="Toggle fullscreen">⛶</button>
      <button class="btn-ghost px-3 py-1.5 lg:hidden" onclick={() => (menuOpen = !menuOpen)} aria-label="Menu">☰</button>
    </div>
    {#if menuOpen}
      <nav class="grid grid-cols-2 gap-1 px-4 pb-3 lg:hidden">
        {#each nav as [p, label, icon]}
          <a href="#/{p}" onclick={() => (menuOpen = false)} class="rounded-xl px-3 py-2 font-bold {path === p ? 'bg-maroon text-white' : 'bg-white text-maroon'}">{icon} {label}</a>
        {/each}
      </nav>
    {/if}
  </header>

  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
    {#key path}
      <Page />
    {/key}
  </main>

  <footer class="py-4 text-center text-sm text-maroon/60">
    Jai Sri Ram · Samastha Lokah Sukhino Bhavantu 🙏
  </footer>
</div>
