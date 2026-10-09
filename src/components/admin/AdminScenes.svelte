<script>
  import { config } from '../../lib/store.svelte.js';
  import { resolveSceneImage, saveUpload, deleteUpload } from '../../lib/images.js';

  let thumbs = $state({});
  let open = $state(null);
  const S = $derived(config.settings);
  const used = $derived(Math.min(config.teams.length * S.puzzleRoundsPerTeam, config.scenes.length));

  async function refresh(scene) {
    thumbs[scene.id] = await resolveSceneImage(scene);
  }
  $effect(() => {
    config.scenes.forEach((s) => { if (!thumbs[s.id]) refresh(s); });
  });

  async function upload(scene, e) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    await saveUpload(scene.id, file);
    refresh(scene);
  }
  async function removeUpload(scene) {
    await deleteUpload(scene.id);
    refresh(scene);
  }
  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= config.scenes.length) return;
    [config.scenes[i], config.scenes[j]] = [config.scenes[j], config.scenes[i]];
  }
  function add() {
    const id = 's' + Date.now();
    config.scenes.push({ id, title: 'New scene', image: '', story: '', clue: '', value: '', art: ['#fde68a', '#16a34a', '🏹'] });
    open = id;
  }
  const label = { upload: '📤 Uploaded', file: '📁 From folder', placeholder: '🎨 Placeholder' };
</script>

<div class="card mb-4 p-4 text-sm text-ink/80">
  <p><b>{config.scenes.length} scenes</b>, of which <b>{used}</b> will be played ({config.teams.length} teams × {S.puzzleRoundsPerTeam} rounds). They are played in this order: turn 1 = scene 1, and so on.</p>
  <p class="mt-1"><b>Pictures:</b> you can <b>upload</b> a picture here (it is saved in this browser only), or put the file in <code class="rounded bg-black/5 px-1">public/images/</code> using the filename shown and redeploy (this works on every device). Scenes without a picture get a colourful emoji placeholder.</p>
</div>

<div class="space-y-3">
  {#each config.scenes as s, i (s.id)}
    {@const th = thumbs[s.id]}
    <div class="card overflow-hidden {i >= used ? 'opacity-60' : ''}">
      <div class="flex items-center gap-4 p-3">
        <span class="w-8 text-center text-xl font-extrabold text-maroon/60">{i + 1}</span>
        <div class="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-black/5">
          {#if th}<img src={th.src} alt="" class="h-full w-full object-cover" />{/if}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-lg font-extrabold">{s.title}</div>
          <div class="text-xs text-ink/50">{th ? label[th.source] : '…'} · {Number(s.grid) || S.puzzleDefaultGrid}×{Number(s.grid) || S.puzzleDefaultGrid} · {Number(s.time) || S.puzzleDefaultTime}s {i >= used ? '· not played (extra)' : ''}</div>
        </div>
        <button class="btn-ghost px-2 py-1" onclick={() => move(i, -1)}>↑</button>
        <button class="btn-ghost px-2 py-1" onclick={() => move(i, 1)}>↓</button>
        <button class="btn-primary px-3 py-1" onclick={() => (open = open === s.id ? null : s.id)}>{open === s.id ? 'Close' : 'Edit'}</button>
      </div>

      {#if open === s.id}
        <div class="grid gap-3 border-t border-maroon/10 bg-orange-50/40 p-4 md:grid-cols-2">
          <label><span class="label">Title</span><input class="input" bind:value={s.title} /></label>
          <label><span class="label">Clue (free hint)</span><input class="input" bind:value={s.clue} /></label>
          <label class="md:col-span-2"><span class="label">Story (shown after the puzzle)</span><textarea class="input" rows="3" bind:value={s.story}></textarea></label>
          <label><span class="label">Value / Moral</span><input class="input" bind:value={s.value} /></label>
          <div class="grid grid-cols-2 gap-2">
            <label><span class="label">Grid</span>
              <select class="input" bind:value={s.grid}>
                <option value={undefined}>Default ({S.puzzleDefaultGrid}×{S.puzzleDefaultGrid})</option>
                {#each [2, 3, 4, 5] as n}<option value={n}>{n}×{n} ({n * n} pieces)</option>{/each}
              </select>
            </label>
            <label><span class="label">Time (sec)</span><input class="input" type="number" min="10" placeholder={String(S.puzzleDefaultTime)} bind:value={s.time} /></label>
          </div>
          <label><span class="label">Image file in /public</span>
            <input class="input" bind:value={s.image} placeholder="images/my-scene.jpg" onchange={() => refresh(s)} />
          </label>
          <div>
            <span class="label">Upload a picture</span>
            <div class="flex gap-2">
              <input type="file" accept="image/*" class="input text-sm" onchange={(e) => upload(s, e)} />
              {#if th?.source === 'upload'}<button class="btn-ghost px-3 text-red-600" onclick={() => removeUpload(s)}>Remove</button>{/if}
            </div>
          </div>
          <label class="md:col-span-2"><span class="label">Placeholder art: sky colour, ground colour, then emojis (comma separated)</span>
            <input class="input" value={(s.art ?? []).join(', ')} onchange={(e) => { s.art = e.currentTarget.value.split(',').map((x) => x.trim()).filter(Boolean); refresh(s); }} />
          </label>
          <div class="flex justify-between md:col-span-2">
            <button class="btn-ghost text-red-600" onclick={() => { if (confirm(`Delete "${s.title}"?`)) config.scenes.splice(i, 1); }}>🗑 Delete scene</button>
            <button class="btn-primary" onclick={() => { refresh(s); open = null; }}>✓ Done</button>
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>
<button class="btn-ghost mt-4" onclick={add}>＋ Add scene</button>
