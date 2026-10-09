<script>
  let { count, max = 3, size = 'text-2xl' } = $props();
</script>

<span class="inline-flex gap-0.5 {size}" aria-label="{count} of {max} lives">
  {#each Array(max) as _, i}
    <span class="transition-all duration-500 {i < count ? '' : 'scale-75 opacity-25 grayscale'}">❤️</span>
  {/each}
</span>
