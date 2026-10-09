/**
 * Writes LIFT entries as HTML for display.
 *
 * This is a port of EntryHtmlWriter.java (app-lib-dictionary). The class names match the
 * styles that DAB writes to dab-app.css (entry-block-single, gloss-block, gloss-en, ...).
 *
 * Differences from the native app:
 * - Audio links are written as <audio-link src="..."></audio-link> placeholders that
 *   EntryView replaces with a play button (same as for XHTML entries).
 * - Search highlighting is not supported.
 * - Fields before a definition are written. The native app never writes these because
 *   Sense.hasFieldsBeforeDef() returns true only when the list is empty.
 */
import type { DictionaryFieldConfig } from '$config';
import {
    getByWritingSystem,
    getFirstDigitsAsInt,
    hasDefinitions,
    hasGloss,
    hasText,
    hasWritingSystem,
    type CustomField,
    type ExampleField,
    type ImageField,
    type LiftEntry,
    type LiftField,
    type LiftSense,
    type MultiText,
    type NoteField,
    type PronunciationField,
    type RelationField,
    type SubEntryField,
    type VariantField
} from './liftEntry';

export type LiftWritingSystem = {
    code: string;
    vernacular: boolean;
    audio: boolean;
    enabled: boolean;
};

export type LinkedEntry = {
    id: number;
    name: string;
    homonymIndex: number;
};

export type LiftHtmlOptions = {
    // multiple: several entries on one page (more compact, entry names are links)
    mode: 'single' | 'multiple';
    // in lexicon order (the l="n" attribute indexes into this)
    writingSystems: LiftWritingSystem[];
    fields: DictionaryFieldConfig[];
    // interface language for field labels
    language: string;
    homonymFormat: 'subscript' | 'superscript';
    showIllustrations: boolean;
    // resolve a relation ref (E12, S34 or 12) to the linked entry
    resolveRelation: (ref: string) => LinkedEntry | undefined;
    // sub-entries are written inside the main entry in single entry mode
    getSubEntry: (id: number) => LiftEntry | undefined;
};

type PartOfSpeechSenseNumberMode =
    | 'no-sense-number'
    | 'one-part-of-speech-many-sense-numbers'
    | 'part-of-speech-per-sense-number';

const BULLET = '&bull;';
const NBSPACE = '&nbsp;';

export function liftEntriesToHtml(entries: LiftEntry[], options: LiftHtmlOptions): string {
    return new LiftHtmlWriter(options).write(entries);
}

class LiftHtmlWriter {
    private html = '';
    private isPartOfSpeechAlreadyWritten = false;
    private needTopPaddingNext = false;
    // guard against sub-entry cycles
    private entriesBeingWritten = new Set<number>();

    constructor(private readonly options: LiftHtmlOptions) {}

    write(entries: LiftEntry[]): string {
        this.html = '';
        for (const entry of entries) {
            this.writeEntry(entry, false, null);
        }
        return this.html;
    }

    private get isSingleEntry() {
        return this.options.mode === 'single';
    }

    private get isMultipleEntry() {
        return this.options.mode === 'multiple';
    }

    private get writingSystems() {
        return this.options.writingSystems;
    }

    private get mainWritingSystem() {
        return this.writingSystems.find((ws) => ws.vernacular);
    }

    private hasAltWritingSystem() {
        return this.writingSystems.filter((ws) => ws.vernacular).length > 1;
    }

    private writeEntry(entry: LiftEntry, isSubEntry: boolean, labelText: string | null) {
        if (this.entriesBeingWritten.has(entry.id)) {
            return;
        }
        this.entriesBeingWritten.add(entry.id);

        this.isPartOfSpeechAlreadyWritten = false;

        this.html += this.startPara(
            this.isMultipleEntry ? 'entry-block-multiple' : 'entry-block-single',
            true
        );

        this.writeEntryName(entry, isSubEntry, labelText);

        // Fields before senses (like main entry cross ref, variants, etc.)
        if (entry.fieldsBeforeSenses.length) {
            this.writeFields(entry.fieldsBeforeSenses, 'fields-block');
        }

        if (entry.senses.length) {
            this.writeSenses(entry.senses, entry);
        }

        if (entry.fieldsAfterSenses.length) {
            this.writeFields(entry.fieldsAfterSenses, 'fields-block');
        }

        this.html += this.endPara(true);

        this.entriesBeingWritten.delete(entry.id);
    }

    private writeEntryName(entry: LiftEntry, isSubEntry: boolean, labelText: string | null) {
        let labelWritten = false;

        this.writingSystems.forEach((ws, wsIndex) => {
            if (!(ws.enabled && ws.vernacular && !ws.audio)) {
                return;
            }

            const lexicalName = getByWritingSystem(entry.lexicalName, wsIndex);
            const citationForm = hasText(entry.citationForm)
                ? getByWritingSystem(entry.citationForm, wsIndex)
                : '';
            let entryName = isNotBlank(citationForm) ? citationForm : lexicalName;
            if (!isNotBlank(entryName)) {
                return;
            }

            let audioLink = '';
            if (this.isMultipleEntry) {
                // Several entries on page: link to the entry (or the main entry of a sub-entry)
                const entryIndex = entry.mainEntryId ?? entry.id;
                entryName = `<a href="E-${entryIndex}">${entryName}</a>`;
            } else {
                const names = isNotBlank(citationForm) ? entry.citationForm : entry.lexicalName;
                audioLink = this.getAudioLinkForWritingSystem(wsIndex, names);

                if (!audioLink) {
                    // Look for pronunciation media without text
                    const pronunciation = entry.fieldsBeforeSenses.find(
                        (f): f is PronunciationField => f.kind === 'pronunciation'
                    );
                    if (pronunciation && this.isAudioOnly(pronunciation)) {
                        audioLink = this.getAudioLink(pronunciation.media[0]);
                    }
                }
            }

            this.html += this.startPara(
                ws.vernacular ? 'entry-name-line-main' : 'entry-name-line-alt'
            );

            const entrySpanStyle = isSubEntry ? 'subentry-name' : 'entry-name';
            let nameHtml = '';
            if (isNotBlank(labelText ?? '') && !labelWritten) {
                nameHtml += this.span('label', labelText!) + ' ';
                labelWritten = true;
            }
            nameHtml += this.spanWs(entrySpanStyle, ws, entryName);

            if (audioLink) {
                this.html += this.audioTable(nameHtml, audioLink);
            } else {
                this.html += nameHtml;
                if (ws.vernacular && entry.homonymIndex > 0) {
                    this.html += this.homonymIndex(entry.homonymIndex);
                }
            }

            this.html += this.endPara();
        });

        this.needTopPaddingNext = this.hasAltWritingSystem();
    }

    private homonymIndex(homonymIndex: number) {
        return this.options.homonymFormat === 'superscript'
            ? this.span('entry-homonym-index', `<sup>${homonymIndex}</sup>`)
            : this.span('entry-homonym-index', `<sub>${homonymIndex}</sub>`);
    }

    // Use a table for audio icon alignment
    private audioTable(textHtml: string, audioLink: string) {
        return (
            '<table style="font-size:100%"><tr>' +
            `<td style="padding:0; margin:0;">${textHtml}</td>` +
            `<td style="padding:0; margin:0;">${this.span('audio', audioLink)}</td>` +
            '</tr></table>'
        );
    }

    private getAudioLink(audioFilename: string | undefined) {
        if (!isNotBlank(audioFilename ?? '')) {
            return '';
        }
        // Space before image
        return `${NBSPACE}<audio-link src="${escapeAttr(audioFilename!)}"></audio-link>`;
    }

    /**
     * Audio filename from an audio writing system linked with a text writing system
     * e.g. look for audio writing system 'myk-audio' linked to text writing system 'myk'
     */
    private getAudioLinkForWritingSystem(textWsIndex: number, names: MultiText) {
        const textWs = this.writingSystems[textWsIndex];
        const firstPartOfCode = textWs.code.split('-')[0];
        const audioWsIndex = this.writingSystems.findIndex(
            (ws) => ws.enabled && ws.audio && ws.code.startsWith(firstPartOfCode)
        );
        return audioWsIndex >= 0 ? this.getAudioLink(getByWritingSystem(names, audioWsIndex)) : '';
    }

    private isAudioOnly(p: PronunciationField) {
        return (
            p.media.length > 0 &&
            !p.text.some((item) => {
                const ws = this.writingSystems[item.ws];
                return ws && !ws.audio && isNotBlank(item.text);
            })
        );
    }

    private writePronunciation(p: PronunciationField) {
        if (!this.isShown(this.getFieldConfig('pronunciation'))) {
            return;
        }

        let audioLink = '';
        let text = '';

        const hasAudio =
            p.media.length > 0 || p.text.some((item) => this.writingSystems[item.ws]?.audio);
        const hasPronunciationText = hasText(p.text);

        if (!hasAudio && !hasPronunciationText) {
            return;
        }

        this.html += this.startPara('pronunciation-block');

        if (hasAudio) {
            if (p.media.length) {
                audioLink = this.getAudioLink(p.media[0]);
            } else {
                const audioItem = p.text.find((item) => this.writingSystems[item.ws]?.audio);
                audioLink = this.getAudioLink(audioItem?.text);
            }
        }

        if (hasPronunciationText) {
            for (const item of p.text) {
                const ws = this.writingSystems[item.ws];
                if (ws && !ws.audio) {
                    text = text + '[' + item.text + ']';
                    if (this.isMultipleEntry) {
                        text = NBSPACE + NBSPACE + text;
                    }
                }
            }
        }

        if (audioLink) {
            this.html += this.audioTable(this.span('prononciation', text), audioLink);
        } else {
            this.html += this.span('prononciation', text);
        }

        this.html += this.endPara();
    }

    private writeSenses(senses: LiftSense[], entry: LiftEntry) {
        let fieldsBlockStyle = 'fields-block';
        const mode = getPartOfSpeechSenseNumberMode(entry);

        senses.forEach((sense, i) => {
            this.html += this.startPara(
                this.isMultipleEntry ? 'sense-block-multiple' : 'sense-block-single',
                true
            );

            // only one sense - no need to have a sense number
            const senseNumber = senses.length > 1 ? sense.senseNumber : '';

            if (
                (mode === 'no-sense-number' || mode === 'one-part-of-speech-many-sense-numbers') &&
                (senseNumber === '' || senseNumber === '1')
            ) {
                if (i === 0) {
                    if (!this.isPartOfSpeechAlreadyWritten) {
                        this.writePartOfSpeech(sense.partOfSpeech, entry);
                    }
                } else {
                    const prevSense = senses[i - 1];
                    if (
                        isNotBlank(sense.partOfSpeech) &&
                        sense.partOfSpeech !== prevSense.partOfSpeech
                    ) {
                        this.writePartOfSpeech(sense.partOfSpeech, entry);
                    }
                }
            }

            // Prepare for gloss
            let introGloss =
                senseNumber !== ''
                    ? this.span('sense-number', senseNumber) +
                      NBSPACE +
                      this.span('bullet', BULLET) +
                      NBSPACE
                    : this.span('bullet', BULLET) + NBSPACE;

            let partOfSpeechText = '';
            if (mode === 'part-of-speech-per-sense-number' && isNotBlank(sense.partOfSpeech)) {
                // sense numbers and parts of speech associated with each of them
                let str = escapeHtml(sense.partOfSpeech);
                if (!str.endsWith('.')) {
                    str = str + '.';
                }
                partOfSpeechText = this.span('part-of-speech', str + NBSPACE);
            }

            // Fields before definition
            if (sense.fieldsBeforeDef.length) {
                this.writeFields(sense.fieldsBeforeDef, fieldsBlockStyle);
            }

            // Glosses
            this.html += this.startPara('gloss-block');
            let glossBlock = '';
            let prevWs: LiftWritingSystem | null = null;
            let numIndentedLines = 0;

            this.writingSystems.forEach((ws, wsIndex) => {
                if (!(ws.enabled && !ws.audio)) {
                    return;
                }

                let glossOrDef = getDefinitionOrGloss(sense, wsIndex);
                if (!isNotBlank(glossOrDef)) {
                    return;
                }

                if (isNotBlank(glossBlock)) {
                    // not the first gloss/definition
                    if (this.isMultipleEntry) {
                        // add a ";" as punctuation between items of gloss block
                        if (!endsWithPunctuationSpan(glossBlock)) {
                            glossBlock += this.spanWs('gloss', prevWs, ';');
                        }
                        glossOrDef = ' ' + glossOrDef;
                    }

                    if (numIndentedLines === 0) {
                        if (mode === 'no-sense-number') {
                            glossBlock += this.startPara('gloss-block-indent');
                        } else {
                            glossBlock += this.startPara('gloss-block-indent-more');
                            fieldsBlockStyle = 'fields-block-indent';
                        }
                    }
                    numIndentedLines++;
                }

                glossBlock += this.startParaWs('gloss-line', ws);
                glossBlock += introGloss + partOfSpeechText + this.spanWs('gloss', ws, glossOrDef);
                glossBlock += this.endPara();

                introGloss = '';
                partOfSpeechText = '';
                prevWs = ws;
            });

            if (this.isMultipleEntry) {
                // add a "." as final punctuation of gloss block
                if (!endsWithPunctuationSpan(glossBlock)) {
                    glossBlock += this.spanWs('gloss', prevWs, '.');
                }
            }

            this.html += glossBlock;
            if (numIndentedLines > 0) {
                this.html += this.endPara(); // Gloss block indent
            }
            this.html += this.endPara(); // Gloss block

            if (sense.fields.length) {
                this.writeFields(sense.fields, fieldsBlockStyle);
            }

            this.html += this.endPara(true); // sense block
        });
    }

    private writePartOfSpeech(partOfSpeech: string, entry: LiftEntry) {
        if (isNotBlank(partOfSpeech)) {
            let paraStyle = 'part-of-speech-block';
            if (entry.fieldsBeforeSenses.length || this.needTopPaddingNext) {
                paraStyle += ' top-padding';
                this.needTopPaddingNext = false;
            }

            this.html += this.startPara(paraStyle);
            let text = this.addInitialSpaceIfRequired(escapeHtml(partOfSpeech));
            text = this.addFinalPunctuationIfRequired(text, '.');
            this.html += this.span('part-of-speech', text);
            this.html += this.endPara();
        }
        this.isPartOfSpeechAlreadyWritten = true;
    }

    private writeFields(fields: LiftField[], blockStyle: string) {
        this.html += this.startPara(blockStyle);

        fields.forEach((field, i) => {
            const previousField = i > 0 ? fields[i - 1] : null;
            const nextField = i < fields.length - 1 ? fields[i + 1] : null;

            switch (field.kind) {
                case 'example':
                    this.writeExample(field);
                    break;
                case 'image':
                    this.writeImage(field);
                    break;
                case 'note':
                    this.writeNote(field);
                    break;
                case 'custom':
                    this.writeCustomField(field);
                    break;
                case 'subentry':
                    this.writeSubEntryField(field);
                    break;
                case 'pronunciation':
                    this.writePronunciation(field);
                    break;
                case 'relation':
                    this.writeRelation(field, previousField, nextField);
                    break;
                case 'variant':
                    this.writeVariant(field, previousField, nextField);
                    break;
            }
        });

        this.html += this.endPara(); // fields block
    }

    private writeExample(example: ExampleField) {
        this.html += this.startPara('example-block');

        this.writingSystems.forEach((ws, wsIndex) => {
            if (!(ws.enabled && ws.vernacular && !ws.audio)) {
                return;
            }

            let text = getByWritingSystem(example.text, wsIndex);
            if (!isNotBlank(text)) {
                return;
            }

            this.html += this.startPara('example-text');

            text = this.addInitialSpaceIfRequired(text);
            text = this.addFinalPunctuationIfRequired(text, '.');

            const audioLink = example.media.length
                ? this.getAudioLink(example.media[0])
                : this.getAudioLinkForWritingSystem(wsIndex, example.text);

            if (audioLink) {
                this.html += this.audioTable(this.spanWs('example-text', ws, text), audioLink);
            } else {
                this.html += this.spanWs('example-text', ws, text);
            }

            this.html += this.endPara();
        });

        // Example translations - by writing system
        this.html += this.startPara('example-translation-block');
        this.writingSystems.forEach((ws, wsIndex) => {
            if (!(ws.enabled && hasWritingSystem(example.translations, wsIndex) && !ws.audio)) {
                return;
            }
            this.html += this.startParaWs('example-translation-line', ws);

            let text = getByWritingSystem(example.translations, wsIndex);
            text = this.addInitialSpaceIfRequired(text);
            text = this.addFinalPunctuationIfRequired(text, '.');

            this.html += this.spanWs('example-translation', ws, text);
            this.html += this.endPara();
        });
        this.html += this.endPara(); // example translation block

        this.html += this.endPara(); // example block
    }

    private writeImage(image: ImageField) {
        if (this.options.showIllustrations && this.isSingleEntry) {
            this.html += this.startPara('image-block');
            this.html += `<img src="${escapeAttr(image.filename)}" width="200px" />`;
            this.html += this.endPara();
        }
    }

    /**
     * Shared by custom fields and notes: a block with an optional label and one line per
     * writing system
     */
    private writeLabelledTextField(
        fc: DictionaryFieldConfig,
        blockStyle: string,
        lineStyle: string,
        text: MultiText,
        spanClass: (ws: LiftWritingSystem) => string
    ) {
        let labelText = this.getLabel(fc);
        let hasLabel = isNotBlank(labelText);
        const isOneLine = fc.labelPosition !== 'above';

        this.html += this.startPara(blockStyle);

        if (hasLabel && !isOneLine) {
            labelText = this.addInitialSpaceIfRequired(labelText);
            this.html +=
                this.startPara('label-line') + this.span('label', labelText) + this.endPara();
            hasLabel = false;
        }

        this.writingSystems.forEach((ws, wsIndex) => {
            if (!(ws.enabled && hasWritingSystem(text, wsIndex) && !ws.audio)) {
                return;
            }

            this.html += this.startPara(lineStyle);

            if (hasLabel && isOneLine) {
                labelText = labelText + ' ';
                this.html += this.span('label', labelText);
                hasLabel = false;
            }

            let value = getByWritingSystem(text, wsIndex);
            value = this.addInitialSpaceIfRequired(value);
            value = escapeHtml(fc.beforeItem) + value + escapeHtml(fc.afterItem);
            value = this.addFinalPunctuationIfRequired(value, '.');
            this.html += this.span(spanClass(ws), value);
            this.html += this.endPara();
        });

        this.html += this.endPara();
    }

    private writeCustomField(cf: CustomField) {
        const fc = this.getFieldConfig('field', cf.type);
        if (this.isShown(fc)) {
            this.writeLabelledTextField(
                fc!,
                'field-block',
                'field-line',
                cf.text,
                (ws) => `field-${ws.code}`
            );
        }
    }

    private writeNote(note: NoteField) {
        const fc = this.getFieldConfig('note', note.type);
        if (this.isShown(fc)) {
            const isScientificName = note.type.toLowerCase() === 'scientific-name';
            this.writeLabelledTextField(fc!, 'note-block', 'note-line', note.text, (ws) =>
                isScientificName ? 'scientific-name' : `note-${ws.code}`
            );
        }
    }

    private writeRelation(
        relation: RelationField,
        previousField: LiftField | null,
        nextField: LiftField | null
    ) {
        const linkedEntry = this.options.resolveRelation(relation.ref);
        if (!linkedEntry) {
            return;
        }

        const fc = this.getFieldConfig('relation', relation.type);
        if (!this.isShown(fc)) {
            return;
        }

        let labelText = this.getLabel(fc!);
        let hasLabel = isNotBlank(labelText);
        const isOneLine = fc!.labelPosition !== 'above';

        // Are we beginning or ending a block of relations?
        const isSameRelationAsPrevious =
            previousField?.kind === 'relation' &&
            previousField.type === relation.type &&
            !!this.options.resolveRelation(previousField.ref);
        // Unlike native, also require the next relation to resolve. Otherwise it writes nothing
        // and this relation's line and block are never closed.
        const isSameRelationAsNext =
            nextField?.kind === 'relation' &&
            nextField.type === relation.type &&
            !!this.options.resolveRelation(nextField.ref);

        if (!isSameRelationAsPrevious) {
            this.html += this.startPara('relation-block');

            if (hasLabel && !isOneLine) {
                // Place label above field
                labelText = this.addInitialSpaceIfRequired(labelText);
                this.html +=
                    this.startPara('label-line') + this.span('label', labelText) + this.endPara();
                hasLabel = false;
            }
        }

        if (this.isMultipleEntry) {
            this.html += isSameRelationAsPrevious ? ', ' : ' ';
        } else if (isSameRelationAsPrevious && isOneLine) {
            this.html += ', ';
        }

        if (!isSameRelationAsPrevious || !isOneLine) {
            this.html += this.startPara('relation-line');
        }

        if (!isSameRelationAsPrevious && hasLabel && isOneLine) {
            // Place label next to field
            this.html += this.span('label', labelText + ' ');
        }

        this.html += `<a href="E-${linkedEntry.id}">`;
        this.html += this.spanWs(
            'relation-text',
            this.mainWritingSystem ?? null,
            escapeHtml(linkedEntry.name)
        );
        if (linkedEntry.homonymIndex > 0) {
            this.html += this.homonymIndex(linkedEntry.homonymIndex);
        }
        this.html += '</a>';

        if (!isSameRelationAsNext) {
            if (this.isMultipleEntry) {
                this.html += '.';
            } else {
                this.html += this.endPara(); // line
                this.html += this.endPara(); // block
            }
        } else if (!isOneLine) {
            this.html += this.endPara(); // line
        }
    }

    private writeSubEntryField(relation: SubEntryField) {
        // only display sub-entries in single entry view
        if (!this.isSingleEntry || relation.direction !== 'sub') {
            return;
        }

        const subEntry = this.options.getSubEntry(getFirstDigitsAsInt(relation.ref));
        if (!subEntry) {
            return;
        }

        let fc: DictionaryFieldConfig | undefined;
        const complexFormType = getTraitValue(relation.traits, 'complex-form-type');
        if (isNotBlank(complexFormType)) {
            fc = this.getFieldConfig('complex', complexFormType);
        } else {
            const variantType = getTraitValue(relation.traits, 'variant-type');
            if (isNotBlank(variantType)) {
                fc = this.getFieldConfig('variant', variantType);
            }
        }

        if (fc && !fc.show) {
            return;
        }

        this.html += this.startPara('subentry-block');

        let labelText: string | null = null;
        if (fc) {
            labelText = this.getLabel(fc);
            if (fc.labelPosition === 'above' && isNotBlank(labelText)) {
                // Write label if required
                labelText = this.addInitialSpaceIfRequired(labelText);
                this.html +=
                    this.startPara('label-line') + this.span('label', labelText) + this.endPara();
                labelText = null;
            }
        }

        this.writeEntry(subEntry, true, labelText);
        this.html += this.endPara();
    }

    private getFieldConfigForVariant(variant: VariantField) {
        const paradigm = getTraitValue(variant.traits, 'paradigm');
        return isNotBlank(paradigm)
            ? this.getFieldConfig('variant', paradigm)
            : this.getFieldConfig('variant', '(Default)');
    }

    private writeVariant(
        variant: VariantField,
        previousField: LiftField | null,
        nextField: LiftField | null
    ) {
        const fc = this.getFieldConfigForVariant(variant);
        if (!this.isShown(fc)) {
            return;
        }

        // Are we beginning or ending a block of variants?
        const isSameVariantAsPrevious =
            previousField?.kind === 'variant' &&
            fc === this.getFieldConfigForVariant(previousField);
        const isSameVariantAsNext =
            nextField?.kind === 'variant' && fc === this.getFieldConfigForVariant(nextField);

        let labelText = isSameVariantAsPrevious ? '' : this.getLabel(fc!);
        let hasLabel = isNotBlank(labelText);
        const isOneLine = fc!.labelPosition !== 'above';

        if (!isSameVariantAsPrevious) {
            this.html += this.startPara('field-block');

            if (hasLabel && !isOneLine) {
                labelText = this.addInitialSpaceIfRequired(labelText);
                this.html +=
                    this.startPara('label-line') + this.span('label', labelText) + this.endPara();
                hasLabel = false;
            }
        }

        let dialects = variant.traits
            .filter((t) => ['dialect', 'dialects'].includes(t.name.toLowerCase()))
            .map((t) => escapeHtml(t.value))
            .join(', ');

        this.writingSystems.forEach((ws, wsIndex) => {
            if (!(ws.enabled && hasWritingSystem(variant.text, wsIndex) && !ws.audio)) {
                return;
            }

            if (!isSameVariantAsPrevious || !isOneLine) {
                this.html += this.startPara('field-line');
            } else {
                this.html += ', ';
            }

            if (hasLabel && isOneLine) {
                this.html += this.span('label', labelText + ' ');
                hasLabel = false;
            }

            let text = getByWritingSystem(variant.text, wsIndex);
            text = this.addInitialSpaceIfRequired(text);
            text = escapeHtml(fc!.beforeItem) + text + escapeHtml(fc!.afterItem);
            text = this.addFinalPunctuationIfRequired(text, '.');
            this.html += this.span(`variant-${ws.code}`, text);

            if (isNotBlank(dialects)) {
                this.html += ` (${dialects})`;
                dialects = '';
            }

            if (!isSameVariantAsNext || !isOneLine) {
                this.html += this.endPara();
            }
        });

        if (!isSameVariantAsNext) {
            this.html += this.isMultipleEntry ? '.' : this.endPara();
        }
    }

    private isShown(fc: DictionaryFieldConfig | undefined) {
        return !!fc && fc.show;
    }

    private getFieldConfig(type: string, name?: string) {
        return this.options.fields.find(
            (fc) =>
                fc.type === type &&
                (name === undefined || fc.name.toLowerCase() === name.toLowerCase())
        );
    }

    private getLabel(fc: DictionaryFieldConfig) {
        if (!fc.labelShown) {
            return '';
        }
        // Try label for interface language first, otherwise the first (default) label
        const label = fc.labels[this.options.language];
        return escapeHtml(
            isNotBlank(label ?? '') ? label : (Object.values(fc.labels).find(isNotBlank) ?? '')
        );
    }

    private span(className: string, text: string) {
        return `<span class="${className}">${format(text)}</span>`;
    }

    private spanWs(className: string, ws: LiftWritingSystem | null, text: string) {
        return this.span(ws ? `${className}-${ws.code}` : className, text);
    }

    private startPara(className: string, forced = false) {
        return this.isSingleEntry || forced ? `<div class="${className}">` : '';
    }

    private startParaWs(className: string, ws: LiftWritingSystem) {
        return this.isSingleEntry ? `<div class="${className}-${ws.code}">` : '';
    }

    private endPara(forced = false) {
        return this.isSingleEntry || forced ? '</div>' : '';
    }

    private addInitialSpaceIfRequired(text: string) {
        return this.isMultipleEntry ? ' ' + text : text;
    }

    private addFinalPunctuationIfRequired(text: string, punct: string) {
        if (!this.isMultipleEntry) {
            return text;
        }
        return /[.!?](<\/span>)?$/.test(text) ? text : text + punct;
    }
}

function getPartOfSpeechSenseNumberMode(entry: LiftEntry): PartOfSpeechSenseNumberMode {
    let result: PartOfSpeechSenseNumberMode = 'no-sense-number';
    let firstPartOfSpeech = '';

    for (const sense of entry.senses) {
        const thisPartOfSpeech = sense.partOfSpeech;
        let senseNumber = sense.senseNumber;
        if (senseNumber.startsWith('1 ')) {
            senseNumber = '1';
        }

        if (senseNumber === '1') {
            result = 'one-part-of-speech-many-sense-numbers';
            firstPartOfSpeech = thisPartOfSpeech;
        }

        if (
            senseNumber !== '1' &&
            isNotBlank(senseNumber) &&
            isNotBlank(thisPartOfSpeech) &&
            thisPartOfSpeech !== firstPartOfSpeech
        ) {
            result = 'part-of-speech-per-sense-number';
            break;
        }
    }
    return result;
}

function getDefinitionOrGloss(sense: LiftSense, ws: number) {
    let result = '';
    if (hasDefinitions(sense)) {
        result = getByWritingSystem(sense.definitions, ws);
        if (!isNotBlank(result) && hasGloss(sense)) {
            result = getByWritingSystem(sense.glosses, ws);
        }
    } else if (hasGloss(sense)) {
        result = getByWritingSystem(sense.glosses, ws);
    }
    return result.replaceAll(' ; ', ', ');
}

function getTraitValue(traits: { name: string; value: string }[], name: string) {
    return traits.find((t) => t.name === name)?.value ?? '';
}

function endsWithPunctuationSpan(html: string) {
    return /[.?!]<\/span>$/.test(html);
}

function isNotBlank(text: string) {
    return text.trim() !== '';
}

// For plain text (attribute values, database columns, config) inserted as HTML.
// Text from <t> elements is already escaped by parseLiftEntry, except for its <span> markup.
function escapeHtml(text: string) {
    return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeAttr(text: string) {
    return escapeHtml(text).replaceAll('"', '&quot;');
}

function format(input: string) {
    let result = input.replaceAll(' ?', '&nbsp;?').replaceAll(' !', '&nbsp;!');

    // Handle strings that start with hyphens
    // Make sure viewer will not split word at this point to leave a hanging hyphen
    if (result.startsWith('-')) {
        const spPos = result.indexOf(' ');
        const bkPos = result.indexOf('<');
        if (spPos < 0 && bkPos < 0) {
            result = `<span style="white-space: nowrap;">${result}</span>`;
        } else {
            const pos = Math.max(spPos, bkPos);
            result =
                `<span style="white-space: nowrap;">${result.substring(0, pos)}</span>` +
                result.substring(pos);
        }
    }
    return result;
}
