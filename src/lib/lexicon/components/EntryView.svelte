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
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Collect audio elements to add at the end
        let audioElements = '';

        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            console.error('XML parsing error:', parseError.textContent);
            return `<span class="text-error" style="background-color: var(--BackgroundColor);">Error parsing XML: Invalid format</span>`;
        }

        function processNode(node, parentHasSenseNumber = false) {
            let output = '';

            if (node.nodeType === Node.TEXT_NODE) {
                return node.nodeValue.trim() ? node.nodeValue + ' ' : '';
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                let className = node.getAttribute('class') || '';
                let isSenseNumber = className.includes('sensenumber');

                let parentContainsSenseNumber =
                    parentHasSenseNumber ||
                    [...node.parentNode.children].some(
                        (child) =>
                            child.getAttribute &&
                            (child.getAttribute('class') || '').includes('sensenumber')
                    );

                const addStyle =
                    node.tagName === 'span' ||
                    className === 'clickable cursor-pointer' ||
                    (node.tagName === 'div' && className === 'entry');

                if (node.tagName === 'a' && node.hasAttribute('href')) {
                    const href = node.getAttribute('href');
                    const match = href.match(/E-(\d+)/);
                    if (match) {
                        const index = parseInt(match[1], 10);
                        const wordObject = vernacularWords.value.find((item) => item.id === index);
                        const word = wordObject ? wordObject.name : 'Unknown';
                        const homonymIndex = wordObject ? wordObject.homonym_index : 1;

                        let linkText = node.textContent.trim();

                        if (linkText === String(homonymIndex)) {
                            linkText = homonymIndex.toString();
                        }

                        output += `<span class="clickable cursor-pointer" style="background-color: var(--BackgroundColor);" data-word="${word}" data-index="${index}" data-homonym="${homonymIndex}">${linkText}</span>`;
                    }
                } else if (node.tagName === 'audio-link' && node.hasAttribute('src')) {
                    // Handle audio-link tag - create audio element and clickable link
                    const audioFile = node.getAttribute('src');
                    const src = clips[`./${audioFile}`] ?? 'clips/' + audioFile;
                    const audioId = 'audio-' + Math.random().toString(36).substr(2, 9); // Generate unique ID

                    // Collect audio element to add at the very end
                    audioElements += `<audio id="${audioId}" src="${src}" preload="auto" style="display: none;"></audio>`;

                    // Add just the inline clickable icon - no audio element here
                    output += `<button type="button" class="audio-link" data-audio-id="${audioId}" aria-label="Play audio" style="display: inline-block; vertical-align: middle; margin: 0 2px; width: 24px; height: 24px; overflow: visible;"><svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" style="display: block; overflow: visible;"><path d="M14 20.725v-2.05q2.25-.65 3.625-2.5t1.375-4.2q0-2.35-1.375-4.2T14 5.275v-2.05q3.1.7 5.05 3.137Q21 8.8 21 11.975q0 3.175-1.95 5.612-1.95 2.438-5.05 3.138ZM3 15V9h4l5-5v16l-5-5Zm11 1V7.95q1.175.55 1.838 1.65.662 1.1.662 2.4q0 1.275-.662 2.362Q15.175 15.45 14 16Z"/></svg></button>`;
                } else {
                    output += `<${node.tagName}`;
                    for (let attr of node.attributes) {
                        output += ` ${attr.name}="${attr.value}"`;
                    }

                    // Add appropriate styling based on class name
                    if (className.includes('sensenumber')) {
                        output += ` style="color: var(--TextColor); font-weight: bold;"`;
                    } else if (className.includes('vernacular')) {
                        output += ` style="color: var(--TextColor2);"`;
                    } else if (className.includes('example')) {
                        output += ` style="color: var(--TextColor3); font-style: italic;"`;
                    } else if (className.includes('definition')) {
                        output += ` style="color: var(--TextColor); font-weight: normal;"`;
                    }

                    if (addStyle) {
                        output += ` style="background-color: var(--BackgroundColor); color: var(--TextColor);"`;
                    }

                    output += '>';

                    for (let child of node.childNodes) {
                        output += processNode(child, parentContainsSenseNumber || isSenseNumber);
                    }

                    output += `</${node.tagName}>`;
                }
            }

            return output;
        }

        return processNode(xmlDoc.documentElement) + audioElements;
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
                const word = span.getAttribute('data-word');
                const index = parseInt(span.getAttribute('data-index'), 10);
                const homonym_index = parseInt(span.getAttribute('data-homonym'), 10);

                onSelectWord({
                    word,
                    index,
                    homonym_index
                });
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
    style="background-color: var(--BackgroundColor); color: var(--TextColor);">{@html xmlData}</pre>
