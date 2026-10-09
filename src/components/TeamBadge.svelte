<script>
  let { team, size = 'md' } = $props();
  const s = $derived({ sm: 'text-sm px-2 py-0.5', md: 'text-base px-3 py-1', lg: 'text-2xl px-5 py-2' }[size]);
</script>

{#if team}
  <span class="inline-flex items-center gap-1.5 rounded-full font-extrabold text-white shadow {s}" style="background: {team.color}">
    <span>{team.emoji}</span>{team.name}
  </span>
{/if}
