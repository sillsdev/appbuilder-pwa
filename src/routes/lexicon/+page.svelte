// src/routes/+page.svelte
<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import config from '$lib/data/config';

onMount(() => {
  if (config.programType === 'DAB') {
    goto(`${base}/lexicon`);
  }
});
</script>

// src/routes/lexicon/+page.svelte
<script lang="ts">
import { TabGroup, Tab } from '@/components/ui/tabs';
import LexiconMainView from '$lib/components/LexiconMainView.svelte';
import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
import Navbar from '$lib/components/Navbar.svelte';

let activeTab = 'main';
</script>

<div class="grid grid-rows-[auto,auto,1fr]" style="height:100vh;height:100dvh;">
  <Navbar>
    <label for="sidebar" slot="center">
      <div class="btn btn-ghost normal-case text-xl">Lexicon</div>
    </label>
  </Navbar>

  <TabGroup value={activeTab} onValueChange={(value) => activeTab = value} class="w-full">
    <Tab value="main">Main</Tab>
    <Tab value="reversal">Reversal</Tab>
  </TabGroup>

  <div class="overflow-y-auto">
    {#if activeTab === 'main'}
      <LexiconMainView />
    {:else}
      <LexiconReversalView />
    {/if}
  </div>
</div>