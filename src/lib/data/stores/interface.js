import { derived } from 'svelte/store';
import { refs } from './scripture';
import { userSettings } from './setting';
import config from '../config';

export const direction = derived([refs, userSettings], ([$refs, $userSettings]) => {
    var direction = config.mainFeatures['settings-app-layout-direction']
        ? $userSettings['app-layout-direction']
        : config.mainFeatures['app-layout-direction'];
    if (direction === 'interface-language') {
        const code = $userSettings['interface-language'];
        if (code) {
            direction = config.interfaceLanguages.writingSystems[code].textDirection;
        }
    } else if (direction === 'text') {
        direction = config.bookCollections.find((x) => x.id === $refs.collection).style
            .textDirection;
    }
    return direction.toLowerCase();
});
