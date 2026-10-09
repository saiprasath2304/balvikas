<script>
  import { config, exportJSON, importJSON, resetConfig } from '../../lib/store.svelte.js';
  const S = $derived(config.settings);

  const groups = [
    ['General', [
      ['eventTitle', 'Event title', 'text'],
      ['subtitle', 'Subtitle', 'text'],
      ['adminPin', 'Admin PIN', 'text'],
      ['sound', 'Sound effects', 'bool'],
    ]],
    ['🧩 Picture Puzzle', [
      ['puzzleRoundsPerTeam', 'Rounds per team', 'num'],
      ['puzzleDefaultTime', 'Default time per puzzle (sec)', 'num'],
      ['puzzleDefaultGrid', 'Default grid size (3 = 3×3)', 'num'],
      ['startingHearts', 'Hearts per team', 'num'],
      ['solvePoints', 'Points for solving', 'num'],
      ['timeBonusEvery', '+1 bonus point per … seconds left', 'num'],
      ['peekCost', 'Peek cost (points)', 'num'],
      ['peekSeconds', 'Peek duration (sec)', 'num'],
      ['nameBonus', 'Bonus for naming the scene', 'num'],
      ['heartBonus', 'Bonus per heart left at the end', 'num'],
      ['timeoutCostsHeart', 'Running out of time costs a heart', 'bool'],
      ['showCorrectGlow', 'Green glow on correctly placed pieces', 'bool'],
    ]],
    ['❓ Who Am I?', [
      ['whoamiTurnsPerTeam', 'Turns per team', 'num'],
      ['whoamiClueTime', 'Thinking time per clue (sec)', 'num'],
      ['stealPoints', 'Points for a steal', 'num'],
    ]],
  ];

  let pointsText = $state(S.whoamiPoints.join(', '));
  $effect(() => {
    const p = pointsText.split(',').map((x) => Number(x.trim())).filter((x) => !isNaN(x));
    if (p.length) S.whoamiPoints = p;
  });

  function download() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ramayana-utsav-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }
  async function upload(e) {
    const f = e.currentTarget.files?.[0];
    if (!f) return;
    try {
      importJSON(await f.text());
      alert('Imported!');
    } catch {
      alert('That file could not be read.');
    }
  }
</script>

<div class="grid gap-4 lg:grid-cols-3">
  {#each groups as [title, fields]}
    <div class="card space-y-3 p-5">
      <h2 class="title-font text-2xl text-maroon">{title}</h2>
      {#each fields as [key, label, type]}
        {#if type === 'bool'}
          <label class="flex items-center gap-3 font-semibold">
            <input type="checkbox" class="h-5 w-5 accent-orange-500" bind:checked={S[key]} /> {label}
          </label>
        {:else if type === 'num'}
          <label><span class="label">{label}</span><input class="input" type="number" min="0" bind:value={S[key]} /></label>
        {:else}
          <label><span class="label">{label}</span><input class="input" bind:value={S[key]} /></label>
        {/if}
      {/each}
      {#if title.includes('Who')}
        <label><span class="label">Points for clue 1, 2, 3, 4</span><input class="input" bind:value={pointsText} /></label>
      {/if}
    </div>
  {/each}

  <div class="card space-y-3 p-5 lg:col-span-3">
    <h2 class="title-font text-2xl text-maroon">💾 Backup & Restore</h2>
    <p class="text-sm text-ink/70">Everything you edit is saved automatically in <b>this browser</b>. To move it to another laptop, download a backup here and import it there. (Uploaded pictures are not included, so for those use the <code class="rounded bg-black/5 px-1">public/images</code> folder.)</p>
    <div class="flex flex-wrap gap-2">
      <button class="btn-primary" onclick={download}>⬇ Download backup</button>
      <label class="btn-ghost cursor-pointer">⬆ Import backup<input type="file" accept=".json" class="hidden" onchange={upload} /></label>
      <button class="btn-danger" onclick={() => confirm('Restore all teams, scenes, cards, agenda and settings to the defaults?') && resetConfig()}>Restore defaults</button>
    </div>
  </div>
</div>
