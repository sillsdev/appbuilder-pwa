import { writable, readable, get } from 'svelte/store';
import { setDefaultStorage, mergeDefaultStorage } from './storage';
import config from '../config';

export const SETTINGS_CATEGORY_INTERFACE = 'Settings_Category_Interface';
export const SETTINGS_CATEGORY_NAVIGATION = 'Settings_Category_Navigation';
export const SETTINGS_CATEGORY_NOTIFICATIONS = 'Settings_Category_Notifications';
export const SETTINGS_CATEGORY_AUDIO = 'Settings_Category_Audio';
export const SETTINGS_CATEGORY_TEXT_DISPLAY = 'Settings_Category_Text_Display';

setDefaultStorage('development', 'false');
export const development = readable(localStorage.development === 'true');

export const userPreferenceSettings = ((): Array<App.UserPreferenceSetting> => {
    const hasVerses = config.traits['has-verse-numbers'];

    // "Text Display"
    const settings = new Array<App.UserPreferenceSetting>();
    if (config.mainFeatures['settings-verse-numbers'] && hasVerses) {
        // Verse Numbers
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_TEXT_DISPLAY,
            title: 'Settings_Verse_Numbers',
            key: 'verse-numbers',
            defaultValue: config.mainFeatures['show-verse-numbers']
        });
    }

    if (config.mainFeatures['settings-verse-layout'] && hasVerses) {
        // Verse Layout
        settings.push({
            type: 'list',
            category: SETTINGS_CATEGORY_TEXT_DISPLAY,
            title: 'Settings_Verse_Layout',
            key: 'verse-layout',
            defaultValue: config.mainFeatures['verse-layout'],
            entries: ['Settings_Verse_Layout_Paragraphs', 'Settings_Verse_Layout_One_Per_Line'],
            values: ['paragraphs', 'one-per-line']
        });
    }

    if (config.mainFeatures['settings-show-border'] && config.traits['has-borders']) {
        // Show Border
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_TEXT_DISPLAY,
            title: 'Settings_Show_Border',
            summary: 'Settings_Show_Border_Summary',
            key: 'show-border',
            defaultValue: config.mainFeatures['show-border']
        });
    }

    if (config.mainFeatures['settings-red-letters'] && config.mainFeatures['wj-enabled']) {
        // Red letters
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_TEXT_DISPLAY,
            title: 'Settings_Red_Letters',
            summary: 'Settings_Red_Letters_Summary',
            key: 'red-letters',
            defaultValue: config.mainFeatures['show-red-letters']
        });
    }

    if (config.mainFeatures['settings-glossary-links'] && config.traits['has-glossary']) {
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_TEXT_DISPLAY,
            title: 'Settings_Glossary_Words',
            key: 'glossary-words',
            defaultValue: config.mainFeatures['show-glossary-words']
        });
        // Show links to glossary words
    }

    if (
        config.mainFeatures['settings-display-images-in-bible-text'] &&
        config.traits['has-illustrations']
    ) {
        // Images in Bible Text
        settings.push({
            type: 'list',
            category: SETTINGS_CATEGORY_TEXT_DISPLAY,
            title: 'Settings_Display_Images_In_Bible_Text',
            key: 'display-images-in-bible-text',
            defaultValue: config.mainFeatures['display-images-in-bible-text'] || 'normal',
            entries: ['Settings_Display_Images_Normal', 'Settings_Display_Images_Hidden'],
            values: ['normal', 'hidden']
        });
    }

    if (
        config.mainFeatures['settings-display-videos-in-bible-text'] &&
        config.traits['has-video']
    ) {
        // Videos in Bible Text
        settings.push({
            type: 'list',
            category: SETTINGS_CATEGORY_TEXT_DISPLAY,
            title: 'Settings_Display_Videos_In_Bible_Text',
            key: 'display-videos-in-bible-text',
            defaultValue: config.mainFeatures['display-videos-in-bible-text'] || 'normal',
            entries: ['Settings_Display_Images_Normal', 'Settings_Display_Images_Hidden'],
            values: ['normal', 'hidden']
        });
    }

    // "Audio"
    if (
        config.mainFeatures['settings-audio-highlight-phrase'] &&
        config.traits['has-sync-audio']
    ) {
        // Synchronised phrase highlighting
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_AUDIO,
            title: 'Settings_Audio_Highlight_Phrase',
            summary: 'Settings_Audio_Highlight_Phrase_Summary',
            key: 'audio-highlight-phrase',
            defaultValue: config.mainFeatures['audio-highlight-phrase']
        });
    }

    if (config.mainFeatures['settings-audio-speed'] && config.traits['has-audio']) {
        // Playback speed
        settings.push({
            type: 'list',
            category: SETTINGS_CATEGORY_AUDIO,
            title: 'Settings_Audio_Speed',
            key: 'audio-speed',
            defaultValue: '1.0',
            entries: [
                '0.4x',
                '0.6x',
                '0.7x',
                '0.8x',
                'Settings_Audio_Speed_Normal',
                '1.2x',
                '1.4x',
                '1.6x'
            ],
            values: ['0.4', '0.6', '0.7', '0.8', '1.0', '1.2', '1.4', '1.6']
        });
    }

    const hasAudioSourceWithAccessModeChoice =
        Object.keys(config.audio.sources).filter(
            (key) => config.audio.sources[key].accessMethods?.length > 1
        ).length > 0;
    if (
        config.mainFeatures['settings-audio-access-method'] &&
        hasAudioSourceWithAccessModeChoice
    ) {
        settings.push({
            type: 'list',
            category: SETTINGS_CATEGORY_AUDIO,
            title: 'Settings_Audio_Access_Method',
            key: 'audio-access-method',
            defaultValue: config.mainFeatures['audio-access-method'],
            entries: [
                'Settings_Audio_Access_Method_Stream',
                'Settings_Audio_Access_Method_Download'
            ],
            values: ['stream', 'download']
        });
    }

    const hasAudioSourceWitbDownload =
        Object.keys(config.audio.sources).filter((key) =>
            config.audio.sources[key].accessMethods?.includes('download')
        ).length > 0;
    if (config.mainFeatures['settings-audio-download-mode'] && hasAudioSourceWitbDownload) {
        settings.push({
            type: 'list',
            category: SETTINGS_CATEGORY_AUDIO,
            title: 'Settings_Audio_Download_Mode',
            key: 'audio-auto-download',
            defaultValue: 'prompt',
            entries: [
                'Settings_Audio_Download_Prompt',
                'Settings_Audio_Download_Automatic',
                'Settings_Audio_Download_Automatic_Wifi'
            ],
            values: ['prompt', 'auto', 'auto-wifi']
        });
    }

    // "Notifications"
    if (config.mainFeatures['settings-verse-of-the-day'] && hasVerses) {
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_NOTIFICATIONS,
            title: 'Settings_Verse_Of_The_Day',
            key: 'verse-of-the-day',
            defaultValue: config.mainFeatures['verse-of-the-day']
        });
    }
    // "Verse of the day"
    if (config.mainFeatures['settings-verse-of-the-day-time'] && hasVerses) {
        // "Time for verse of the day
        settings.push({
            type: 'time',
            category: SETTINGS_CATEGORY_NOTIFICATIONS,
            title: 'Settings_Verse_Of_The_Day_Time',
            key: 'verse-of-the-day-time',
            defaultValue: config.mainFeatures['verse-of-the-day-time']
        });
    }

    const bcList = config.bookCollections.filter(
        (bc) => bc.features['bc-allow-verse-of-the-day'] === true
    );
    if (config.mainFeatures['settings-verse-of-the-day-book-collection'] && hasVerses) {
        // "Translation for verse of the day"
        if (bcList.length > 1) {
            const entries = [];
            const values = [];
            bcList.forEach((bc) => {
                entries.push(bc.collectionName);
                values.push(bc.id);
            });
            const bcId = config.mainFeatures['verse-of-the-day-book-collection'];
            const defaultValue = !bcId ? bcId : bcList[0].id;

            settings.push({
                type: 'list',
                category: SETTINGS_CATEGORY_NOTIFICATIONS,
                title: 'Settings_Verse_Of_The_Day_Book_Collection',
                key: 'verse-of-the-day-book-collection',
                defaultValue,
                entries,
                values
            });
        }
    }

    if (config.mainFeatures['settings-daily-reminder']) {
        // "Daily reminder"
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_NOTIFICATIONS,
            title: 'Settings_Daily_Reminder',
            key: 'daily-reminder',
            defaultValue: config.mainFeatures['daily-reminder-default']
        });
    }

    if (config.mainFeatures['settings-daily-reminder-time']) {
        // "Time for daily reminder"
        settings.push({
            type: 'time',
            category: SETTINGS_CATEGORY_NOTIFICATIONS,
            title: 'Settings_Daily_Reminder_Time',
            key: 'daily-reminder-time',
            defaultValue: config.mainFeatures['daily-reminder-time']
        });
    }

    // "Navigation"
    if (config.mainFeatures['settings-book-selection'] && config.traits['has-multiple-books']) {
        // Book Selection
        settings.push({
            type: 'list',
            category: SETTINGS_CATEGORY_NAVIGATION,
            title: 'Settings_Book_Selection',
            key: 'book-selection',
            defaultValue: config.mainFeatures['book-select'],
            entries: ['Settings_Book_Selection_List', 'Settings_Book_Selection_Grid'],
            values: ['list', 'grid']
        });
    }

    if (config.mainFeatures['settings-verse-selection'] && hasVerses) {
        // Verse Selector
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_NAVIGATION,
            title: 'Settings_Verse_Selection',
            key: 'verse-selection',
            defaultValue: config.mainFeatures['show-verse-selector']
        });
    }

    // "User Interface"

    if (config.mainFeatures['settings-keep-screen-on']) {
        // Keep Screen on
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_INTERFACE,
            title: 'Settings_Keep_Screen_On',
            key: 'keep-screen-on',
            defaultValue: false
        });
    }

    const hasAnalytics = config.analytics?.length > 0; // TODO
    if (config.mainFeatures['settings-share-usage-data'] && hasAnalytics) {
        // Share app usage data
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_INTERFACE,
            title: 'Settings_Share_Usage_Data',
            key: 'share-usage-data',
            defaultValue: true
        });
    }

    const langCount = Object.keys(config.interfaceLanguages.writingSystems).length;
    if (config.mainFeatures['settings-interface-language'] && langCount > 1) {
        // Interface language
        const entries = [];
        const values = [];
        Object.keys(config.interfaceLanguages.writingSystems).forEach((key) => {
            entries.push('Language_' + key);
            values.push(key);
        });

        settings.push({
            type: 'list',
            category: SETTINGS_CATEGORY_INTERFACE,
            title: 'Settings_Interface_Language',
            key: 'interface-language',
            defaultValue: config.translationMappings.defaultLang,
            entries,
            values
        });
    }

    if (config.mainFeatures['settings-app-layout-direction']) {
        // App Layout Direction
        settings.push({
            type: 'list',
            category: SETTINGS_CATEGORY_INTERFACE,
            title: 'Settings_Layout_Direction',
            key: 'app-layout-direction',
            defaultValue: config.mainFeatures['app-layout-direction'],
            entries: [
                'Settings_Layout_Direction_LTR',
                'Settings_Layout_Direction_RTL',
                'Settings_Layout_Direction_Interface_Language',
                'Settings_Layout_Direction_Text'
            ],
            values: ['ltr', 'rtl', 'interface-language', 'text']
        });
    }

    if (get(development)) {
        settings.push({
            type: 'checkbox',
            category: SETTINGS_CATEGORY_INTERFACE,
            title: "Desktop Sidebar",
            key: 'desktop-sidebar',
            defaultValue: false
        });
    }
    return settings;
})();

function defaultUserSettings() {
    return userPreferenceSettings.reduce((defaults, setting) => {
        defaults[setting.key] = setting.defaultValue;
        return defaults;
    });
}
mergeDefaultStorage('userSettings', defaultUserSettings());
export const userSettings = writable(JSON.parse(localStorage.userSettings));
userSettings.subscribe(value => localStorage.userSettings = JSON.stringify(value));