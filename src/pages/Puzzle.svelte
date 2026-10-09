<script>
  import { config, game, team, award, hearts, loseHeart, score } from '../lib/store.svelte.js';
  import { resolveSceneImage } from '../lib/images.js';
  import { sfx } from '../lib/sound.js';
  import { celebrate } from '../lib/confetti.js';
  import ScoreStrip from '../components/ScoreStrip.svelte';
  import Hearts from '../components/Hearts.svelte';
  import TeamBadge from '../components/TeamBadge.svelte';

  const S = $derived(config.settings);
  const t = $derived(game.puzzle.turn);
  const nTeams = $derived(game.puzzle.order.length);
  const total = $derived(Math.min(nTeams * S.puzzleRoundsPerTeam, config.scenes.length));
  const teamId = $derived(game.puzzle.order[t % nTeams]);
  const tm = $derived(team(teamId));
  const scene = $derived(config.scenes[t]);
  const grid = $derived(Number(scene?.grid) || S.puzzleDefaultGrid);
  const timeLimit = $derived(Number(scene?.time) || S.puzzleDefaultTime);
  const round = $derived(Math.floor(t / nTeams) + 1);
  const done = $derived(t >= total);

  let phase = $state('ready'); // ready | playing | solved | timeout
  let img = $state(null);
  let tiles = $state([]); // tiles[position] = piece index (piece i belongs at position i)
  let labels = $state([]); // labels[piece] = number shown on the piece
  let timeLeft = $state(0);
  let paused = $state(false);
  let clueShown = $state(false);
  let peeking = $state(false);
  let finalUsed = $state(false);
  let nameGiven = $state(false);
  let storyShown = $state(false);
  let selected = $state(null);
  let flash = $state(null); // position that just changed
  let earned = $state(0);
  let drag = $state(null);

  const correct = $derived(tiles.filter((p, i) => p === i).length);

  // Load the picture whenever the scene changes.
  $effect(() => {
    const s = scene;
    if (!s) return;
    const id = s.id;
    img = null;
    resolveSceneImage(s).then((r) => {
      if (scene?.id === id) img = r;
    });
    // preload the next one
    const nxt = config.scenes[t + 1];
    if (nxt) resolveSceneImage(nxt);
  });

  // Countdown
  $effect(() => {
    if (phase !== 'playing' || paused) return;
    const iv = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 10 && timeLeft > 0) sfx.tick();
      if (timeLeft <= 0) timeout();
    }, 1000);
    return () => clearInterval(iv);
  });

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function start() {
    const n = grid * grid;
    const ids = [...Array(n).keys()];
    let order;
    do order = shuffle([...ids]);
    while (order.filter((p, i) => p === i).length > 1);
    tiles = order;
    labels = shuffle(ids.map((i) => i + 1));
    timeLeft = timeLimit;
    paused = clueShown = peeking = finalUsed = nameGiven = storyShown = false;
    selected = null;
    earned = 0;
    phase = 'playing';
    sfx.reveal();
  }

  function swap(a, b) {
    if (a === b || phase !== 'playing') return;
    [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    flash = b;
    setTimeout(() => (flash = null), 350);
    sfx.swap();
    if (tiles.every((p, i) => p === i)) solve();
  }

  function record(solved, points) {
    game.puzzle.results[t] = { team: teamId, scene: scene.id, solved, points, timeTaken: timeLimit - timeLeft };
  }

  function solve() {
    phase = 'solved';
    earned = S.solvePoints + Math.floor(Math.max(0, timeLeft) / S.timeBonusEvery);
    award(teamId, earned, `Solved “${scene.title}”`, 'puzzle');
    record(true, earned);
    sfx.win();
    celebrate(tm.color);
  }

  function timeout() {
    if (phase !== 'playing') return;
    phase = 'timeout';
    timeLeft = 0;
    if (S.timeoutCostsHeart) loseHeart(teamId);
    record(false, 0);
    sfx.fail();
    setTimeout(() => (tiles = tiles.map((_, i) => i)), 1200);
  }

  function hostSolved() {
    tiles = tiles.map((_, i) => i);
    solve();
  }

  function peek() {
    award(teamId, -S.peekCost, `Peek at “${scene.title}”`, 'puzzle');
    peeking = true;
    sfx.reveal();
    setTimeout(() => (peeking = false), S.peekSeconds * 1000);
  }

  function finalHint() {
    if (hearts(teamId) <= 0 || finalUsed) return;
    loseHeart(teamId);
    finalUsed = true;
    sfx.heart();
    const wrong = tiles.map((p, i) => (p === i ? -1 : i)).filter((i) => i >= 0);
    const fix = shuffle(wrong).slice(0, Math.max(1, Math.ceil(wrong.length / 2)));
    fix.forEach((pos, k) =>
      setTimeout(() => {
        if (phase !== 'playing' || tiles[pos] === pos) return;
        swap(pos, tiles.indexOf(pos));
      }, 300 * (k + 1)),
    );
  }

  function giveNameBonus() {
    if (nameGiven) return;
    nameGiven = true;
    award(teamId, S.nameBonus, `Named “${scene.title}”`, 'puzzle');
    sfx.reveal();
  }

  function next() {
    game.puzzle.turn += 1;
    phase = 'ready';
  }

  function heartBonus() {
    for (const t of config.teams) award(t.id, hearts(t.id) * S.heartBonus, `Hearts bonus (${hearts(t.id)} ❤️)`, 'puzzle');
    game.puzzle.heartBonusGiven = true;
    celebrate();
  }

  // ---- drag & tap-to-swap ----
  function down(e, pos) {
    if (phase !== 'playing') return;
    const r = e.currentTarget.getBoundingClientRect();
    drag = { pos, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, w: r.width, h: r.height, moved: false };
  }
  function move(e) {
    if (!drag) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (Math.hypot(drag.x - drag.sx, drag.y - drag.sy) > 8) drag.moved = true;
  }
  function up(e) {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.moved) {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-pos]');
      if (el) swap(d.pos, Number(el.dataset.pos));
      selected = null;
    } else if (selected == null) {
      selected = d.pos;
      sfx.click();
    } else {
      swap(selected, d.pos);
      selected = null;
    }
  }

  function tileBg(piece) {
    const c = piece % grid, r = Math.floor(piece / grid), k = grid - 1 || 1;
    return `background-image:url("${img?.src}");background-size:${grid * 100}% ${grid * 100}%;background-position:${(c / k) * 100}% ${(r / k) * 100}%`;
  }

  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
  const R = 54, C = 2 * Math.PI * R;
</script>

<svelte:window onpointermove={move} onpointerup={up} />

<div class="-mx-4 -mt-6 mb-6"><ScoreStrip active={done ? null : teamId} showHearts /></div>

{#if done}
  <!-- ======= ACTIVITY COMPLETE ======= -->
  <div class="text-center">
    <div class="text-7xl">🎊</div>
    <h1 class="title-font text-5xl text-maroon">Chitra Katha complete!</h1>
    <p class="mt-1 text-lg text-ink/70">All {total} scenes of the Ramayana have been put back together.</p>
  </div>
  <div class="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-4">
    {#each config.teams as tt (tt.id)}
      {@const rs = game.puzzle.results.filter((r) => r?.team === tt.id)}
      <div class="card p-5 text-center">
        <TeamBadge team={tt} />
        <div class="mt-3 text-4xl font-extrabold">{score(tt.id, 'puzzle')}</div>
        <div class="text-sm text-ink/60">{rs.filter((r) => r.solved).length}/{rs.length} solved</div>
        <div class="mt-2"><Hearts count={hearts(tt.id)} max={S.startingHearts} /></div>
      </div>
    {/each}
  </div>
  <div class="mt-8 flex flex-wrap justify-center gap-3">
    {#if !game.puzzle.heartBonusGiven}
      <button class="btn-primary text-xl" onclick={heartBonus}>❤️ Add hearts bonus (+{S.heartBonus} per heart)</button>
    {:else}
      <span class="btn bg-emerald-100 text-emerald-700">✓ Hearts bonus added</span>
    {/if}
    <a class="btn-ghost text-xl" href="#/whoami">Next: Who Am I? →</a>
    <a class="btn-ghost text-xl" href="#/leaderboard">🏆 Scores</a>
  </div>
{:else if phase === 'ready'}
  <!-- ======= TURN INTRO ======= -->
  <div class="mx-auto max-w-2xl">
    <div class="card animate-pop overflow-hidden text-center">
      <div class="p-3 text-sm font-bold uppercase tracking-widest text-white" style="background: {tm.color}">
        Round {round} of {S.puzzleRoundsPerTeam} · Turn {t + 1} of {total}
      </div>
      <div class="p-8">
        <div class="text-8xl">{tm.emoji}</div>
        <div class="mt-2 text-xl font-semibold text-ink/60">Get ready,</div>
        <div class="title-font text-6xl" style="color: {tm.color}">Team {tm.name}!</div>
        <div class="mt-6 flex justify-center gap-6 text-lg">
          <span>🧩 {grid}×{grid} pieces</span>
          <span>⏱️ {mmss(timeLimit)}</span>
          <Hearts count={hearts(teamId)} max={S.startingHearts} size="text-lg" />
        </div>
        <div class="mt-2 text-ink/50">Mystery scene #{t + 1}</div>
        <button class="btn-primary mt-8 px-10 py-4 text-2xl" disabled={!img} onclick={start}>
          {img ? '▶ Start!' : 'Loading picture…'}
        </button>
      </div>
    </div>
    <div class="mt-4 flex justify-between text-sm">
      <button class="btn-ghost px-3 py-1" disabled={t === 0} onclick={() => game.puzzle.turn--}>← Previous turn</button>
      <button class="btn-ghost px-3 py-1" onclick={next}>Skip turn →</button>
    </div>
    <details class="card mt-4 p-4 text-sm">
      <summary class="cursor-pointer font-bold text-maroon">How to play</summary>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-ink/80">
        <li>The picture is cut into numbered pieces and jumbled. The team calls out numbers (e.g. “swap 4 and 7”) and the host swaps them.</li>
        <li>Drag one piece onto another, or tap two pieces, to swap them.</li>
        <li>Solve: <b>+{S.solvePoints}</b>, plus <b>+1 for every {S.timeBonusEvery}s</b> left. Naming the scene afterwards: <b>+{S.nameBonus}</b>.</li>
        <li>💡 Clue: free · 👀 Peek at the picture: <b>−{S.peekCost}</b> · 🪄 Final hint (places half the wrong pieces): <b>−1 ❤️</b></li>
        {#if S.timeoutCostsHeart}<li>Running out of time costs <b>1 ❤️</b>.</li>{/if}
        <li>Each heart left at the end is worth <b>+{S.heartBonus}</b>.</li>
      </ul>
    </details>
  </div>
{:else}
  <!-- ======= PLAYING / RESULT ======= -->
  <div class="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
    <div>
      <div
        class="relative mx-auto select-none overflow-hidden rounded-2xl bg-maroon/90 p-1 shadow-2xl"
        style="aspect-ratio: {img.width} / {img.height}; width: min(100%, calc(72vh * {img.width / img.height}))"
      >
        <div class="grid h-full w-full gap-[3px]" style="grid-template-columns: repeat({grid}, 1fr); grid-template-rows: repeat({grid}, 1fr)">
          {#each tiles as piece, pos (piece)}
            {@const ok = piece === pos}
            <div
              data-pos={pos}
              role="button"
              tabindex="-1"
              class="relative cursor-grab touch-none rounded-md bg-cover transition-all duration-300
                {drag?.pos === pos && drag.moved ? 'opacity-30' : ''}
                {selected === pos ? 'z-10 scale-95 ring-4 ring-gold' : ''}
                {flash === pos ? 'brightness-125' : ''}
                {phase === 'playing' && ok && S.showCorrectGlow ? 'ring-4 ring-inset ring-emerald-400' : ''}"
              style={tileBg(piece)}
              onpointerdown={(e) => down(e, pos)}
            >
              {#if phase === 'playing'}
                <span class="absolute left-1.5 top-1.5 flex h-9 min-w-9 items-center justify-center rounded-full bg-white/95 px-1.5 text-xl font-extrabold text-maroon shadow-md ring-2 ring-maroon/30 sm:h-11 sm:min-w-11 sm:text-2xl">
                  {labels[piece]}
                </span>
              {/if}
            </div>
          {/each}
        </div>

        {#if peeking}
          <div class="animate-pop absolute inset-1 rounded-xl bg-cover bg-center" style="background-image:url('{img.src}')">
            <div class="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 font-bold text-white">👀 Peek!</div>
          </div>
        {/if}

        {#if phase === 'timeout'}
          <div class="pointer-events-none absolute inset-0 flex items-start justify-center pt-6">
            <div class="animate-pop rounded-2xl bg-red-600 px-6 py-2 text-3xl font-extrabold text-white shadow-xl">⏰ Time’s up!</div>
          </div>
        {/if}
      </div>
    </div>

    <!-- side panel -->
    <aside class="space-y-4">
      <div class="card p-4 text-center">
        <TeamBadge team={tm} size="lg" />
        <div class="mt-2"><Hearts count={hearts(teamId)} max={S.startingHearts} /></div>
      </div>

      {#if phase === 'playing'}
        <div class="card flex flex-col items-center p-4">
          <svg viewBox="0 0 120 120" class="h-36 w-36 -rotate-90 {timeLeft <= 10 ? 'animate-pulse' : ''}">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#0000000d" stroke-width="10" />
            <circle
              cx="60" cy="60" r={R} fill="none" stroke-width="10" stroke-linecap="round"
              stroke={timeLeft <= 10 ? '#dc2626' : timeLeft <= 30 ? '#f59e0b' : tm.color}
              stroke-dasharray={C} stroke-dashoffset={C * (1 - timeLeft / timeLimit)}
              class="transition-all duration-1000 ease-linear"
            />
            <text x="60" y="60" text-anchor="middle" dominant-baseline="central" transform="rotate(90 60 60)"
              class="fill-ink text-[26px] font-extrabold tabular-nums">{mmss(timeLeft)}</text>
          </svg>
          <div class="mt-1 text-sm font-semibold text-ink/60">{correct} / {tiles.length} pieces in place</div>
          <div class="mt-3 flex gap-2">
            <button class="btn-ghost px-3 py-1.5 text-sm" onclick={() => (paused = !paused)}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
            <button class="btn-ghost px-3 py-1.5 text-sm" onclick={() => (timeLeft += 15)}>+15s</button>
          </div>
        </div>

        <div class="card space-y-2 p-4">
          <div class="text-sm font-bold uppercase tracking-widest text-ink/50">Hints</div>
          {#if clueShown}
            <div class="animate-pop rounded-xl bg-amber-50 p-3 text-lg font-semibold text-maroon ring-1 ring-amber-200">💡 {scene.clue}</div>
          {:else}
            <button class="btn-ghost w-full" onclick={() => { clueShown = true; sfx.reveal(); }}>💡 Clue <span class="text-xs text-emerald-600">(free)</span></button>
          {/if}
          <button class="btn-ghost w-full" disabled={peeking} onclick={peek}>👀 Peek {S.peekSeconds}s <span class="text-xs text-red-600">(−{S.peekCost} pts)</span></button>
          <button
            class="btn w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow"
            disabled={finalUsed || hearts(teamId) <= 0}
            onclick={finalHint}
          >🪄 Final hint <span class="text-xs">(−1 ❤️)</span></button>
          {#if hearts(teamId) <= 0}<p class="text-center text-xs text-red-600">No hearts left for the final hint</p>{/if}
        </div>

        <div class="flex gap-2">
          <button class="btn-success flex-1 text-sm" onclick={hostSolved}>✓ Mark solved</button>
          <button class="btn-danger flex-1 text-sm" onclick={timeout}>✗ Give up</button>
        </div>
      {:else}
        <div class="card animate-pop space-y-3 p-5 text-center">
          {#if phase === 'solved'}
            <div class="text-5xl">🎉</div>
            <div class="title-font text-3xl text-emerald-600">Solved!</div>
            <div class="text-4xl font-extrabold" style="color: {tm.color}">+{earned}</div>
            <div class="text-sm text-ink/60">in {mmss(timeLimit - timeLeft)}</div>
          {:else}
            <div class="text-5xl">😔</div>
            <div class="title-font text-3xl text-red-600">Time’s up</div>
            {#if S.timeoutCostsHeart}<div class="text-ink/60">−1 ❤️</div>{/if}
          {/if}

          {#if !storyShown}
            <p class="font-semibold">Can the team name this scene?</p>
            <div class="flex gap-2">
              <button class="btn-success flex-1" disabled={nameGiven} onclick={giveNameBonus}>{nameGiven ? '✓ Yes' : `Yes! +${S.nameBonus}`}</button>
              <button class="btn-ghost flex-1" onclick={() => { storyShown = true; sfx.reveal(); }}>📖 Story</button>
            </div>
          {/if}
          <button class="btn-primary w-full text-xl" onclick={next}>{t + 1 >= total ? 'Finish 🎊' : 'Next turn →'}</button>
        </div>
      {/if}
    </aside>
  </div>

  {#if storyShown && phase !== 'playing'}
    <div class="card animate-pop mx-auto mt-6 max-w-4xl p-6">
      <div class="text-sm font-bold uppercase tracking-widest text-saffron">Scene {t + 1}</div>
      <h2 class="title-font text-4xl text-maroon">{scene.title}</h2>
      <p class="mt-2 text-xl leading-relaxed">{scene.story}</p>
      {#if scene.value}
        <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-lg font-bold text-maroon">🌟 {scene.value}</div>
      {/if}
    </div>
  {/if}
{/if}

{#if drag?.moved && img}
  {@const piece = tiles[drag.pos]}
  <div
    class="pointer-events-none fixed z-50 rotate-3 rounded-md shadow-2xl ring-4 ring-gold"
    style="left:{drag.x - drag.ox}px; top:{drag.y - drag.oy}px; width:{drag.w}px; height:{drag.h}px; {tileBg(piece)}"
  >
    <span class="absolute left-1.5 top-1.5 flex h-11 min-w-11 items-center justify-center rounded-full bg-white px-1.5 text-2xl font-extrabold text-maroon">{labels[piece]}</span>
  </div>
{/if}
