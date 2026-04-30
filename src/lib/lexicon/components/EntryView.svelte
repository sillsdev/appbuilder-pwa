<script lang="ts">
    import config from '$lib/data/config';
    import { convertStyle } from '$lib/data/stores';
    import {
        currentReversal,
        initializeDatabase,
        vernacularLanguageId,
        vernacularWords,
        type SelectedWord
    } from '$lib/data/stores/lexicon.svelte';
    import type { SqlValue } from 'sql.js';

    const clips = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        base: '/src/gen-assets/clips'
    }) as Record<string, string>;

    interface Props {
        wordIds: number[] | null;
        onSelectWord: (word: SelectedWord) => void;
        removeNewLines?: boolean;
    }

    let { wordIds, onSelectWord, removeNewLines = false }: Props = $props();

    let xmlData = $state('');

    async function queryXmlByWordId(wordIds: number[]): Promise<SqlValue[][] | null> {
        try {
            let db = await initializeDatabase({ fetch });

            const dynamicQuery = wordIds.map(() => `id = ?`).join(' OR ');
            const dynamicParams = wordIds.map((id) => id);
            const results = db.exec(`SELECT xml FROM entries WHERE ${dynamicQuery}`, dynamicParams);

            return results[0].values;
        } catch (error) {
            console.error(`Error querying XML for word IDs ${wordIds}:`, error);
            return null;
        }
    }

    function formatXmlByClass(xmlString: string) {
        if (!xmlString) return '';

        const parser = new DOMParser();
        // TODO: find better solution for <default font> replacement (this was causing xml parse errors)
        const xmlDoc = parser.parseFromString(
            xmlString.replaceAll("'<default font>',", ''),
            'text/xml'
        );

        // Collect audio elements to add at the end
        const audioElements = new Map<string, string>();

        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            console.error('XML parsing error:', parseError.textContent);
            return `<span class="text-error">Error parsing XML: Invalid format</span>`;
        }

        function processNode(node: Node, parentHasSenseNumber = false) {
            if (node.nodeType === Node.TEXT_NODE) {
                // TODO: Data in DB has long runs of spaces...
                return node.nodeValue.trim().replaceAll(/ +/g, ' ');
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                let isSenseNumber = el.classList.contains('sensenumber');

                let parentContainsSenseNumber =
                    parentHasSenseNumber ||
                    [...el.parentNode.children].some((child) =>
                        child.classList.contains('sensenumber')
                    );

                if (el.tagName === 'a' && el.hasAttribute('href')) {
                    const href = el.getAttribute('href');
                    let dataAttributes = '';
                    let linkText = el.childNodes
                        .values()
                        .map((child) =>
                            processNode(child, parentContainsSenseNumber || isSenseNumber)
                        )
                        .reduce((p, c) => p + c, '');

                    const match = href.match(/E-(\d+)/);
                    if (match) {
                        const index = parseInt(match[1], 10);
                        const wordObject = vernacularWords.value.find((item) => item.id === index);
                        const word = wordObject ? wordObject.name : 'Unknown';
                        const homonymIndex = wordObject ? wordObject.homonym_index : 1;

                        dataAttributes = ` data-word="${word}" data-index="${index}" data-homonym="${homonymIndex}"`;
                    }
                    return `<span class="clickable cursor-pointer"${dataAttributes}>${linkText}</span>`;
                } else if (el.tagName === 'audio-link' && el.hasAttribute('src')) {
                    // Handle audio-link tag - create audio element and clickable link
                    const audioFile = el.getAttribute('src');
                    const src = clips[`./${audioFile}`] ?? 'clips/' + audioFile;
                    const audioId = 'audio-' + Math.random().toString(36).substring(2); // Generate unique ID

                    // Collect audio element to add at the very end
                    audioElements.set(audioId, src);

                    // Add just the inline clickable icon - no audio element here
                    return `<button type="button" class="audio-link" data-audio-id="${audioId}" aria-label="Play audio" style="display: inline-block; vertical-align: middle; margin: 0 2px; width: 24px; height: 24px; overflow: visible;"><svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" style="display: block; overflow: visible;"><path d="M14 20.725v-2.05q2.25-.65 3.625-2.5t1.375-4.2q0-2.35-1.375-4.2T14 5.275v-2.05q3.1.7 5.05 3.137Q21 8.8 21 11.975q0 3.175-1.95 5.612-1.95 2.438-5.05 3.138ZM3 15V9h4l5-5v16l-5-5Zm11 1V7.95q1.175.55 1.838 1.65.662 1.1.662 2.4q0 1.275-.662 2.362Q15.175 15.45 14 16Z"/></svg></button>`;
                } else {
                    // Add appropriate styling based on class name
                    if (el.classList.contains('sensenumber')) {
                        el.classList.add('font-bold');
                    } else if (el.classList.contains('example')) {
                        el.classList.add('italic');
                    } else if (el.classList.contains('definition')) {
                        el.classList.add('font-normal');
                    }
                    return `<${el.tagName}${Array.from(el.attributes).map((attr) => ` ${attr.name}="${attr.value}"`)}>${el.childNodes
                        .values()
                        .map((child) =>
                            processNode(child, parentContainsSenseNumber || isSenseNumber)
                        )
                        .reduce((p, c) => p + c, '')}</${el.tagName}>`;
                }
            }

            return '';
        }

        return (
            processNode(xmlDoc.documentElement) +
            audioElements
                .entries()
                .map(
                    ([audioId, src]) =>
                        `<audio id="${audioId}" src="${src}" preload="auto" style="display: none;"></audio>`
                )
                .reduce((p, c) => p + c, '')
        );
    }

    async function updateXmlData() {
        if (!wordIds) {
            xmlData = '';
            return;
        }

        const xmlResults = (await queryXmlByWordId(wordIds)) ?? [];

        // Insert an `<hr>` tag or a visible separator between entries
        xmlData =
            xmlResults
                .filter((xml) => xml) // Ensure no null values are included
                .flatMap((v) => v.map(formatXmlByClass))
                .join('\n<hr style="border-color: var(--SettingsSeparatorColor);">\n') +
            '\n<hr style="border-color: var(--SettingsSeparatorColor);">\n';
    }

    function attachEventListeners() {
        const spans = document.querySelectorAll('.clickable');

        spans.forEach((span) => {
            const oldSpan = span.cloneNode(true);
            span.parentNode.replaceChild(oldSpan, span);
        });

        const freshSpans = document.querySelectorAll('.clickable');
        freshSpans.forEach((span) => {
            span.addEventListener('click', () => {
                currentReversal.languageId = vernacularLanguageId.value;
                const name = span.getAttribute('data-word');
                const id = parseInt(span.getAttribute('data-index'), 10);
                const homonym_index = parseInt(span.getAttribute('data-homonym'), 10);

                if (name) {
                    onSelectWord({ name, id, homonym_index });
                }
            });
        });

        const audioButtons = document.querySelectorAll('.audio-link');
        audioButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const audioId = button.getAttribute('data-audio-id');
                const audioElement = document.getElementById(audioId) as HTMLAudioElement;
                if (audioElement) {
                    audioElement.play();
                }
            });
        });
    }

    function applyStyles() {
        // Apply styles from config
        for (let stl of config.singleEntryStyles) {
            for (let elm of document.querySelectorAll(stl.name) as NodeListOf<HTMLElement>) {
                let styleString = convertStyle(stl.properties);

                if (removeNewLines) {
                    styleString = styleString.replace(/display:\s*block/g, 'display: inline');
                }

                elm.style = styleString;
            }
        }

        // Fix legacy sensecontent indentation
        const senseEls = document.querySelectorAll('.sensecontent');
        senseEls.forEach((el) => {
            let style = el.getAttribute('style') || '';

            const hasLegacyIndent =
                style.includes('text-indent: -2em') && style.includes('margin-left: 4em');

            if (hasLegacyIndent) {
                let cleaned = style
                    .replace(/text-indent:\s*-2em;?/g, '')
                    .replace(/margin-left:\s*4em;?/g, '')
                    .trim();

                if (cleaned && !cleaned.endsWith(';')) cleaned += ';';
                cleaned += ' margin-left: -1.1em;';

                style = cleaned;
            }

            if (removeNewLines) {
                style = style.replace(/display:\s*block/g, 'display: inline');
            }

            el.setAttribute('style', style.trim());
        });
    }

    $effect(() => {
        if (wordIds) {
            (async () => {
                await updateXmlData();
                applyStyles();
                attachEventListeners();
            })();
        }
    });
</script>

<pre
    class="p-4 whitespace-pre-wrap break-words"
    style="background-color: var(--BackgroundColor);">{@html xmlData}</pre>
