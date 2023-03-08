import { writable } from 'svelte/store';
import { setDefaultStorage } from './storage';
import config from '../config';


function defaultUserSettings() {
    const defaultSettings = {
        'verse-numbers' : config.mainFeatures['show-verse-numbers'],
        'verse-layout' : config.mainFeatures['verse-layout'],
        'verse-of-the-day-time' : config.mainFeatures['verse-of-the-day-time'],
    };
    return defaultSettings;
}
setDefaultStorage('userSettings', JSON.stringify(defaultUserSettings()));
export const userSettings = writable(JSON.parse(localStorage.userSettings));
userSettings.subscribe(value => localStorage.userSettings = JSON.stringify(value));