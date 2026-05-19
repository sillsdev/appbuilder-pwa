import config, { scriptureConfig } from '$assets/config';
import { derived } from 'svelte/store';
import { refs } from './scripture';
import { userSettings } from './setting';

export const direction = derived([refs, userSettings], ([$refs, $userSettings]) => {
    let direction = (
        config.mainFeatures['settings-app-layout-direction']
            ? $userSettings['app-layout-direction']
            : config.mainFeatures['app-layout-direction']
    ) as string;
    if (direction === 'interface-language') {
        const code = $userSettings['interface-language'] as string;
        if (code) {
            direction = config.interfaceLanguages?.writingSystems[code].textDirection ?? direction;
        }
    } else if (direction === 'text') {
        direction =
            scriptureConfig.bookCollections?.find((x) => x.id === $refs.collection)?.style
                ?.textDirection ?? direction;
    }
    return direction.toLowerCase() as 'ltr' | 'rtl';
});
