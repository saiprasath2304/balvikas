<script>
  import { config } from '../lib/store.svelte.js';
  import AdminAgenda from '../components/admin/AdminAgenda.svelte';
  import AdminTeams from '../components/admin/AdminTeams.svelte';
  import AdminScenes from '../components/admin/AdminScenes.svelte';
  import AdminCards from '../components/admin/AdminCards.svelte';
  import AdminGame from '../components/admin/AdminGame.svelte';
  import AdminSettings from '../components/admin/AdminSettings.svelte';

  const KEY = 'ramayana-utsav:admin';
  let unlocked = $state(sessionStorage.getItem(KEY) === '1');
  let pin = $state('');
  let err = $state(false);

  const tabs = [
    ['agenda', '📋 Agenda', AdminAgenda],
    ['game', '🎮 Live Game', AdminGame],
    ['teams', '🚩 Teams', AdminTeams],
    ['scenes', '🧩 Puzzle Scenes', AdminScenes],
    ['cards', '❓ Who Am I Cards', AdminCards],
    ['settings', '⚙️ Settings & Data', AdminSettings],
  ];
  let tab = $state('agenda');
  const Current = $derived(tabs.find((x) => x[0] === tab)[2]);

  function unlock(e) {
    e.preventDefault();
    if (pin === String(config.settings.adminPin)) {
      unlocked = true;
      sessionStorage.setItem(KEY, '1');
    } else {
      err = true;
      pin = '';
    }
  }
  function lock() {
    unlocked = false;
    sessionStorage.removeItem(KEY);
  }
</script>

{#if !unlocked}
  <form class="card animate-pop mx-auto mt-10 max-w-sm p-8 text-center" onsubmit={unlock}>
    <div class="text-6xl">🔐</div>
    <h1 class="title-font mt-2 text-3xl text-maroon">Admin</h1>
    <p class="text-sm text-ink/60">Enter the admin PIN (default is 1234)</p>
    <input class="input mt-4 text-center text-2xl tracking-[0.5em] {err ? 'animate-shake border-red-500' : ''}" type="password" inputmode="numeric" bind:value={pin} />
    <button class="btn-primary mt-4 w-full">Unlock</button>
  </form>
{:else}
  <div class="flex flex-wrap items-center gap-2">
    <h1 class="title-font mr-auto text-4xl text-maroon">Admin</h1>
    <button class="btn-ghost text-sm" onclick={lock}>🔒 Lock</button>
  </div>
  <div class="mt-4 flex gap-2 overflow-x-auto pb-2">
    {#each tabs as [id, label]}
      <button class="shrink-0 rounded-2xl px-4 py-2 font-bold transition {tab === id ? 'bg-maroon text-white shadow' : 'bg-white text-maroon ring-1 ring-maroon/15 hover:bg-orange-50'}" onclick={() => (tab = id)}>{label}</button>
    {/each}
  </div>
  <div class="mt-4"><Current /></div>
{/if}
