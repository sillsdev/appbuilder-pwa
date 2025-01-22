import { readFileSync } from 'fs';
import path from 'path';
import type { DictionaryConfig, DictionaryWritingSystemConfig } from '$config';
import jsdom from 'jsdom';
import { expect, test } from 'vitest';
import { parseDictionaryWritingSystem, parseFeatures } from '../../../convert/convertConfig';

const dataDir = './data/';
const dom = new jsdom.JSDOM(readFileSync(path.join(dataDir, 'appdef.xml')).toString(), {
    contentType: 'text/xml'
});
const { document } = dom.window;
const appDefinition = document.getElementsByTagName('app-definition')[0];
const programType = appDefinition.attributes.getNamedItem('type')!.value;

if (programType === 'SAB') {
    test('Dummy test for DAB testing for SAB file', () => {
        expect(0).toEqual(0);
    });
} else if (programType === 'DAB') {
    test('convertConfig: parse dictionary writing systems', () => {
        const result: { [key: string]: DictionaryWritingSystemConfig } = {};
        const writingSystemsTag = document.getElementsByTagName('writing-systems')[0];
        const writingSystemTags = writingSystemsTag.getElementsByTagName('writing-system');
        for (const tag of writingSystemTags) {
            const writingSystem = parseDictionaryWritingSystem(tag, 1);
            const code: string = tag.attributes.getNamedItem('code')!.value;
            result[code] = writingSystem;
        }

        for (const lang in result.writingSystems) {
            expect(result[lang].fontFamily).not.toEqual('');
            expect(result[lang].textDirection).toSatisfy((r) => r === 'LTR' || r === 'RTL');
            expect(Object.keys(result[lang].displayNames)).not.toHaveLength(0);

            // TRAITS NOT IN SAB
            expect(Object.keys(result[lang].sortMethod)).toHaveLength(2);
            expect(result[lang]).toHaveProperty('alphabet');
            expect(result[lang].alphabet!.length).toBeGreaterThan(0);
            expect(result[lang]).toHaveProperty('inputButtons');
            expect(result[lang].inputButtons!.length).toBeGreaterThan(0);
            expect(Object.keys(result[lang])).not.toHaveLength(0);
        }
    });

    test('convertConfig: parse features', () => {
        const result = parseFeatures(document, 1);
        expect(Object.keys(result)).not.toHaveLength(0);
    });
} else {
    throw new Error(`Unsupported program type parsed: ${programType}`);
}
