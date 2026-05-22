<!--
@component
The verse on image component.
-->
<script>
    import { onMount } from 'svelte';
    import Modal from './Modal.svelte';
    import Slider from './Slider.svelte';
    import { TextAppearanceIcon, ImageIcon } from '$lib/icons';
    import {
        language,
        languages,
        theme,
        monoIconColor,
        themes,
        themeColors,
        selectedVerses
    } from '$lib/data/stores';
    import config from '$lib/data/config';

    let modalId = 'verseOnImage';
    let modal;
    export function showModal() {
        modal.showModal();
    }

    $: barColor = $themeColors['SliderBarColor'];
    $: progressColor = $themeColors['SliderProgressColor'];

    $: reference = selectedVerses.getCompositeReference();
    $: verses = $selectedVerses.reduce((text, v) => (text += v.text), '');
    let cnv;

    onMount(() => {
        const canvas = cnv.getContext('2d');
        canvas.fillStyle = 'red';
        canvas.fillRect(0, 0, cnv.width, cnv.height);
        // put verses here
    });

    function shareCanvas(){
        cnv.toBlob((blob) => {
            const file = new File([blob], (reference+'.png'), { type: 'image/png' });

            if (navigator.share) {
            navigator.share({
                title: reference,
                text: verses,
                files: [file]
            })
                .then(() => {
                console.log('Successfully shared');
                })
                .catch((error) => {
                console.error('Error sharing:', error);
                });
            } else {
            // Handle browser that does not support Web Share API
            console.log('Web Share API is not supported in this browser');
            }
        });
    }
</script>



<Modal bind:this={modal} id={modalId} useLabel={false} addCSS="position:absolute; top:0rem; left:0rem; width:100%; height:full; border: 2px solid purple">
    <!--addCSS injects CSS into the modal to position it 1rem away from the bottom and right edges of the screen (on mobile it will be centered)-->
    <svelte:fragment slot="content">
        <!-- Content here -->
        <div class="flex flex-col flex-nowrap" style="">
            <div id="verseOnImgPreview" style="border: 2px solid red">
                <!-- Preview display of the image and text -->
                <canvas bind:this={cnv} width=300 height=full style="border: 2px solid green;"></canvas>
                <button on:click={shareCanvas}>Export Canvas</button>
            </div>
            <div id="editorsPane" style="border: 2px solid orange;">
                <!-- Pane for the current editor -->
                <h1 id="DEBUG1" style="height:300px; border: 2px solid green;">Editor Content</h1>
            </div>
            <div id="editorTabs" class="flex flex-row flex-nowrap" style="border: 2px solid teal; overflow-x:scroll;">
                <!-- NavBar of tab buttons to bring up the different editor panes -->
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>
                <button class="dy-btn-sm dy-btn-ghost">
                    <TextAppearanceIcon color="black" />
                </button>

            </div>
        </div>
    </svelte:fragment>
</Modal>



<style>
    
    #editorTabs::-webkit-scrollbar{
        display: none;
        /* width: 0 !important */
    }

    .editorTabs {
        -ms-overflow-style: none;
    }

    #editorTabs {
        scrollbar-width: none;
    }

</style>
