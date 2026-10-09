<script>
  import { config } from '../../lib/store.svelte.js';

  let editing = $state(false);
  const total = $derived(config.agenda.reduce((s, a) => s + Number(a.minutes || 0), 0));

  // Clock time for each item, worked out from the start time.
  const times = $derived.by(() => {
    const [h, m] = (config.settings.startTime || '10:00').split(':').map(Number);
    let mins = h * 60 + m;
    return config.agenda.map((a) => {
      const from = mins;
      mins += Number(a.minutes || 0);
      return [fmt(from), fmt(mins)];
    });
  });
  function fmt(x) {
    const h = Math.floor(x / 60) % 24, m = x % 60;
    const ap = h >= 12 ? 'PM' : 'AM';
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`;
  }

  function add() {
    config.agenda.push({ id: crypto.randomUUID(), title: 'New item', minutes: 5, notes: '', link: '' });
  }
  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= config.agenda.length) return;
    [config.agenda[i], config.agenda[j]] = [config.agenda[j], config.agenda[i]];
  }
</script>

<div class="card p-6">
  <div class="flex flex-wrap items-end gap-4">
    <div>
      <h2 class="title-font text-3xl text-maroon">Programme Agenda</h2>
      <p class="text-ink/60">{config.agenda.length} items · <b>{total} minutes</b> in total</p>
    </div>
    <label class="ml-auto">
      <span class="label">Start time</span>
      <input class="input w-36" type="time" bind:value={config.settings.startTime} />
    </label>
    <button class="btn-ghost" onclick={() => (editing = !editing)}>{editing ? '✓ Done editing' : '✏️ Edit agenda'}</button>
  </div>

  <ol class="relative mt-6 space-y-3 border-l-4 border-saffron/30 pl-6">
    {#each config.agenda as a, i (a.id)}
      <li class="relative">
        <span class="absolute -left-[2.35rem] top-3 flex h-7 w-7 items-center justify-center rounded-full bg-saffron text-sm font-bold text-white ring-4 ring-parchment">{i + 1}</span>
        {#if editing}
          <div class="grid gap-2 rounded-2xl bg-orange-50/70 p-4 md:grid-cols-[1fr_100px_160px_auto]">
            <input class="input" bind:value={a.title} placeholder="Title" />
            <input class="input" type="number" min="1" bind:value={a.minutes} title="Minutes" />
            <select class="input" bind:value={a.link}>
              <option value="">No link</option>
              <option value="#/teams">Teams page</option>
              <option value="#/toss">Toss</option>
              <option value="#/puzzle">Picture Puzzle</option>
              <option value="#/whoami">Who Am I?</option>
              <option value="#/leaderboard">Scores</option>
            </select>
            <div class="flex gap-1">
              <button class="btn-ghost px-2" onclick={() => move(i, -1)}>↑</button>
              <button class="btn-ghost px-2" onclick={() => move(i, 1)}>↓</button>
              <button class="btn-ghost px-2 text-red-600" onclick={() => config.agenda.splice(i, 1)}>✕</button>
            </div>
            <textarea class="input md:col-span-4" rows="2" bind:value={a.notes} placeholder="Notes for the host"></textarea>
          </div>
        {:else}
          <div class="flex flex-wrap items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-maroon/10">
            <div class="w-40 shrink-0 text-sm font-bold text-saffron">{times[i][0]} – {times[i][1]}<div class="text-ink/40">{a.minutes} min</div></div>
            <div class="min-w-0 flex-1">
              <div class="text-lg font-extrabold text-maroon">{a.title}</div>
              {#if a.notes}<div class="text-ink/70">{a.notes}</div>{/if}
            </div>
            {#if a.link}<a class="btn-primary px-4 py-1.5 text-sm" href={a.link}>Go →</a>{/if}
          </div>
        {/if}
      </li>
    {/each}
  </ol>
  {#if editing}<button class="btn-ghost mt-4" onclick={add}>＋ Add item</button>{/if}
</div>
