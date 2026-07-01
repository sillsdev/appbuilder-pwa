<!--
@component
A component providing a dropdown where you can choose to download audio or video for selected text
-->

<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import { getBook, logShareContent } from '$lib/data/analytics';
    import { getAudioSourceInfo } from '$lib/data/audio';
    import { shareText } from '$lib/data/share';
    import { refs, selectedVerses, t, themeColors } from '$lib/data/stores';
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

    let { vertOffset = '1rem' } = $props();
    async function shareSelectedText() {
        const book = $selectedVerses[0].book;
        const reference = selectedVerses.getCompositeReference();
        const text = await selectedVerses.getCompositeText();
        const bookCol = $selectedVerses[0].collection;
        const fullBook = getBook({ collection: bookCol, book: book });
        const bookAbbrev = fullBook?.abbreviation ?? fullBook?.name;
        shareText(
            scriptureConfig.name ?? '',
            scriptureConfig.name + '\n\n' + text + '\n' + reference,
            book + '.txt'
        );
        logShareContent('Text', bookCol, bookAbbrev ?? '', reference);
    }
    async function shareAudio() {
        const reference = selectedVerses.getCompositeReference();
        const audioCtx = new AudioContext();
        try {
            const audioConfig: AudioEncodingConfig = await pickSupportedAudioConfig();
            const outputFormat =
                audioConfig.codec === 'aac'
                    ? { name: 'mp4', format: new Mp4OutputFormat() }
                    : audioConfig.codec === 'opus'
                      ? { name: 'webm', format: new WebMOutputFormat() }
                      : { name: 'wav', format: new WavOutputFormat() };
            const output = new Output({
                format: outputFormat.format,
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
            let isRemote;

            try {
                let url = new URL(audioSourceInfo.source);
                isRemote = url.protocol === 'http:' || url.protocol === 'https:';
            } catch (_) {
                isRemote = false;
            }
            if (isRemote) {
                try {
                    let verses = await selectedVerses.getCompositeText();
                    await navigator.share({
                        title: reference,
                        text: verses,
                        url: audioSourceInfo.source
                    });
                    return;
                } catch (error) {
                    if ((error as { name?: string })?.name === 'AbortError') {
                        return; // user intentionally dismissed native share UI
                    }
                    console.error('Error sharing: ', error);
                }

                // if we're here, we failed to share, so we'll try to use the download link. This generally is just going to open the URL rather than downloading it.
                const anchor = document.createElement('a');
                anchor.href = audioSourceInfo.source;
                anchor.download = '';
                anchor.click();
            } else {
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
                        console.warn(
                            `No timing found for verse ${$selectedVerses[i].verse}, skipping`
                        );
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

                const buffer = output.target.buffer as BlobPart;
                const blob = new Blob([buffer], {
                    type: 'audio/' + outputFormat.name
                });
                const filename = reference + '.' + outputFormat.name;
                const file = new File([blob], filename, {
                    type: 'audio/' + outputFormat.name
                });
                try {
                    if (
                        navigator.share &&
                        navigator.canShare &&
                        navigator.canShare({ files: [file] })
                    ) {
                        let verses = await selectedVerses.getCompositeText();
                        const shareData: ShareData = {
                            title: reference,
                            text: verses,
                            files: [file]
                        };

                        await navigator.share(shareData);
                        return;
                    }
                } catch (error) {
                    if ((error as { name?: string })?.name === 'AbortError') {
                        return; // user intentionally dismissed native share UI
                    }
                    console.error('Error sharing: ', error);
                }

                // if we're here, we failed to share, so we'll try to use the download link
                const url = URL.createObjectURL(file);

                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = filename;
                anchor.click();

                URL.revokeObjectURL(url);
            }
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
    export function showModal() {
        modalThis.showModal();
    }
    const positioningCSS = $derived(
        'position:absolute; bottom:' +
            (Number(vertOffset.replace('rem', '')) + 1) +
            'rem; inset-inline-end:1rem; width:auto;'
    );
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<Modal
    bind:this={modalThis}
    id={modalId}
    styling="background-color:{$themeColors['PopupBackgroundColor']}; {positioningCSS}"
>
    <div class="grid gap-2 m-2">
        <button
            class="dy-btn dy-btn-sm flex items-center justify-center gap-2"
            onclick={() => shareSelectedText()}
        >
            <FormatAlignLeftIcon />
            {$t['Share_Text']}
        </button>
        <button
            class="dy-btn dy-btn-sm flex items-center justify-center gap-2"
            onclick={() => shareAudio()}
        >
            <AudioIcon.Volume />
            {$t['Share_Audio']}
        </button>
        <!--<button
            class="dy-btn dy-btn-sm flex items-center justify-center gap-2"
            onclick={() => downloadVideo()}
        >
            <VideoIcon />
            {$t['Share_Video']}
        </button>-->
    </div>
</Modal>
