<script lang="ts">
    import { loadDocSetIfNotLoaded } from '$lib/data/scripture';
    import type { ReferenceStore } from '$lib/data/stores/reference';
    import type { SABProskomma } from '$lib/sab-proskomma';
    import { convertStorybook } from './sofria-render-json/proskomma-tools/convert-paragraph';
    import { sofriaRaw } from './sofria-render-json/proskomma-tools/pk-query';
    import SofriaRender from './sofria-render-json/SofriaRender.svelte';

    export let proskomma: SABProskomma;
    export let references: ReferenceStore;

    export let bodyFontSize: any;
    export let bodyLineHeight: any;
    export let direction: string;
    export let font: string;

    async function loadSofria(ref: ReferenceStore) {
        await loadDocSetIfNotLoaded(proskomma, ref.docSet, fetch);
        const sofria = await sofriaRaw(
            proskomma,
            references.docSet,
            references.book,
            parseInt(references.chapter)
        );
        return convertStorybook(sofria);
    }
</script>

{#await loadSofria(references)}
    <span class="spin" />
{:then sofria}
    <div
        id="content flex-grow"
        style:font-family={font}
        style:font-size={`${bodyFontSize}px`}
        style:line-height={`${bodyLineHeight}%`}
        class="single"
        style:direction
    >
        <SofriaRender document={sofria} />
    </div>
{/await}
