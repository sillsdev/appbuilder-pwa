<!--
@component
A component providing a dropdown where you can choose to download audio or video for selected text
-->

<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import { getBook, logShareContent } from '$lib/data/analytics';
    import { getAudioSourceInfo } from '$lib/data/audio';
    import { shareAudio, shareText } from '$lib/data/share';
    import { getPositioningCSS, refs, selectedVerses, t } from '$lib/data/stores';
    import { AudioIcon } from '$lib/icons';
    import FormatAlignLeftIcon from '$lib/icons/image/FormatAlignLeftIcon.svelte';
    import {
        AudioBufferSource,
        BufferTarget,
        canEncodeAudio,
        Mp4OutputFormat,
        Output,
        WavOutputFormat,
        WebMOutputFormat
    } from 'mediabunny';
    import type { AudioEncodingConfig } from 'mediabunny';
    import Modal from './Modal.svelte';

    let { vertOffset = '2rem' } = $props();
    async function shareSelectedText() {
        const book = $selectedVerses[0].book;
        const reference = selectedVerses.getCompositeReference();
        const text = await selectedVerses.getCompositeText();
        const bookCol = $selectedVerses[0].collection;
        const fullBook = getBook({ collection: bookCol, book: book });
        const bookAbbrev = fullBook?.abbreviation ?? fullBook?.name;
        const copyShareMessage = scriptureConfig.bookCollections?.find(
            (x) => x.id === bookCol
        )?.copyShareMessage;
        shareText(
            scriptureConfig.name ?? '',
            text + '\n' + reference + (copyShareMessage ? '\n' + copyShareMessage : ''),
            book + '.txt'
        );
        logShareContent('Text', bookCol, bookAbbrev ?? '', reference);
    }
    async function shareAudioFile() {
        const reference = selectedVerses.getCompositeReference();
        const audioCtx = new AudioContext();
        try {
            const audioConfig: AudioEncodingConfig = await pickSupportedAudioConfig();
            const outputFormat =
                audioConfig.codec === 'aac'
                    ? new Mp4OutputFormat()
                    : audioConfig.codec === 'opus'
                      ? new WebMOutputFormat()
                      : new WavOutputFormat();
            const output = new Output({
                format: outputFormat,
                target: new BufferTarget()
            });

            const audioSourceInfo = await getAudioSourceInfo({
                collection: $refs.collection,
                book: $refs.book,
                chapter: $refs.chapter
            });
            if (!audioSourceInfo?.source) {
                throw new Error('No audio source available for this chapter');
            }

            const audioSource = new AudioBufferSource(audioConfig);
            output.addAudioTrack(audioSource);
            await output.start();

            const audioBlob = await fetch(audioSourceInfo?.source).then((r) => r.blob());
            const audioBuffer = await audioCtx.decodeAudioData(await audioBlob.arrayBuffer());

            const sampleRate = audioBuffer.sampleRate;

            for (let i = 0; i < $selectedVerses.length; i++) {
                let startFrame = 0;
                let endFrame = 0;
                for (var j = 0; j < (audioSourceInfo?.timing?.length || 0); j++) {
                    const timing = audioSourceInfo?.timing?.[j];
                    const verse = timing?.tag?.replace(/\D/g, '');
                    if (verse === $selectedVerses[i].verse) {
                        if (!startFrame) {
                            startFrame = Math.floor((timing?.starttime || 0) * sampleRate);
                            endFrame = Math.floor((timing?.endtime || 0) * sampleRate);
                        } else {
                            endFrame = Math.floor((timing?.endtime || 0) * sampleRate);
                        }
                    }
                }
                if (endFrame <= startFrame) {
                    console.warn(`No timing found for verse ${$selectedVerses[i].verse}, skipping`);
                    continue;
                }
                const trimmedBuffer = audioCtx.createBuffer(
                    audioBuffer.numberOfChannels,
                    endFrame - startFrame,
                    sampleRate
                );

                for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                    const src = audioBuffer.getChannelData(ch);
                    const dst = trimmedBuffer.getChannelData(ch);
                    dst.set(src.slice(startFrame, endFrame));
                }

                await audioSource.add(trimmedBuffer);
            }
            await output.finalize();

            await shareAudio(
                reference,
                await selectedVerses.getCompositeText(),
                reference + outputFormat.fileExtension,
                new Blob([output.target.buffer as BlobPart], {
                    type: outputFormat.mimeType
                }),
                outputFormat.mimeType
            );
        } catch (error) {
            console.error('Error generating audio export:', error);
        } finally {
            await audioCtx?.close();
        }
    }
    async function pickSupportedAudioConfig() {
        const candidates: AudioEncodingConfig[] = [
            { codec: 'aac', bitrate: 128000 },
            { codec: 'aac', bitrate: 96000 },
            { codec: 'aac', bitrate: 64000 },
            {
                codec: 'opus',
                bitrate: 96000
            },
            { codec: 'pcm-f32' },
            { codec: 'pcm-s24' },
            { codec: 'pcm-s16' }
        ];

        for (const cfg of candidates) {
            if (await canEncodeAudio(cfg.codec, cfg)) {
                return cfg;
            }
        }

        throw new Error('No supported audio configuration found.');
    } //This is used to determine a supported audio configuration. It first tries AAC, but then falls back to opus if AAC isn't supported. This is a duplicate of the function with the same name in VerseOnImage.svelte, so maybe it should be moved to somewhere that exports it for any place that needs it to use it?
    let modalId = 'shareSelector';
    let modalThis: Modal;
    export function showModal(shareTextOnly: boolean) {
        if (shareTextOnly) {
            shareSelectedText();
        } else {
            modalThis.showModal();
        }
    }
    const positioningCSS = $derived(getPositioningCSS(vertOffset, 'bottom'));
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<Modal
    bind:this={modalThis}
    id={modalId}
    styling="background-color:red; box-shadow:none; padding:0; width:auto; {positioningCSS}"
>
    <div class="grid">
        <button
            class="dy-btn flex items-center justify-center rounded-none"
            onclick={() => shareSelectedText()}
        >
            <FormatAlignLeftIcon />
            {$t['Share_Text']}
        </button>
        <button
            class="dy-btn flex items-center justify-center rounded-none"
            onclick={() => shareAudioFile()}
        >
            <AudioIcon.Volume />
            {$t['Share_Audio']}
        </button>
        <!--<button
            class="dy-btn flex items-center justify-center rounded-none"
            onclick={() => downloadVideo()}
        >
            <VideoIcon />
            {$t['Share_Video']}
        </button>-->
    </div>
</Modal>
