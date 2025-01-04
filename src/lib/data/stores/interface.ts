import { derived } from 'svelte/store';
import config from '../config';
import { refs } from './scripture';
import { userSettings } from './setting';

export const direction = derived([refs, userSettings], ([$refs, $userSettings]) => {
    var direction = config.mainFeatures['settings-app-layout-direction']
        ? $userSettings['app-layout-direction']
        : config.mainFeatures['app-layout-direction'];
    if (direction === 'interface-language') {
        const code = $userSettings['interface-language'] as string;
        if (code) {
            direction = config.interfaceLanguages.writingSystems[code].textDirection;
        }
    } else if (direction === 'text') {
        const collection = config.bookCollections.find((x) => x.id === $refs.collection);
        direction = collection ? collection.style.textDirection : 'ltr';
    }
    return direction.toLowerCase();
});
