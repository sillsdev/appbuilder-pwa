type HTML = string;

export type BookCollectionAudioConfig = {
    num: number;
    src: string;
    len?: number;
    size?: number;
    filename: string;
    timingFile: string;
};

export type StyleConfig = {
    font: string;
    textSize: number;
    lineHeight: number;
    textDirection: string;
    numeralSystem: string;
    verseNumbers: string;
};

export type BookConfig = {
    id: string;
    type?: string;
    format?: string;
    name: string;
    abbreviation: string;
    additionalNames?: {
        name: string;
    }[];
    testament: string;
    section: string; // Pentateuch
    portions?: string;
    chapters?: number;
    chaptersN?: string; // 1-34
    chaptersLabels?: { [key: string]: string };
    fonts: string[];
    file: string;
    audio: BookCollectionAudioConfig[];
    features: any;
    quizFeatures?: any;
    footer?: HTML;
    style?: StyleConfig;
    styles?: {
        name: string;
        category?: string;
        properties: {
            [key: string]: string;
        };
    }[];
};

export type BookCollectionConfig = {
    id: string;
    features: any;
    books: BookConfig[];
    style?: StyleConfig;
    fonts: string[];
    languageCode: string;
    languageName?: string;
    footer?: HTML;
    meta?: {
        [key: string]: string;
    };
    styles?: {
        name: string;
        category?: string;
        properties: {
            [key: string]: string;
        };
    }[];
    collectionImage?: string;
    collectionName?: string;
    collectionAbbreviation?: string;
    collectionDescription?: string;
};

export type AudioConfig = {
    sources: {
        [key: string]: {
            type: string;
            name: string;
            accessMethods?: string[];
            folder?: string;
            key?: string;
            damId?: string;
            address?: string;
        };
    };
    files?: {
        name: string;
        src: string;
    }[];
};

export type WritingSystemConfig = {
    type: string;
    displayNames: {
        [key: string]: string;
    };
    fontFamily: string;
    textDirection: string;
};

export type DictionaryWritingSystemConfig = WritingSystemConfig & {
    sortMethod: {
        type: string;
        ignoreChars?: string[];
    };
    alphabet?: string[];
    inputButtons?: string[];
    reversalFilename?: string;
    features?: {
        [name: string]: boolean;
    };
};
export type MenuItemConfig = {
    type: string;
    title: {
        [lang: string]: string;
    };
    link?: {
        [lang: string]: string;
    };
    linkId?: {
        [lang: string]: string;
    };
    images?: {
        width: number;
        height: number;
        file: string;
    }[];
};
export type AppConfig = {
    name?: string;
    package?: string;
    version?: string;
    programVersion?: string;
    programType?: string;
    mainFeatures?: any;
    audio?: AudioConfig;
    fonts?: {
        name?: string;
        family: string;
        file: string;
        fontWeight: string;
        fontStyle: string;
    }[];
    themes?: {
        name: string;
        enabled: boolean;
        colorSets: {
            type: string;
            colors: {
                [key: string]: string;
            };
        }[];
    }[];
    styles?: {
        name: string;
        category?: string;
        properties: {
            [key: string]: string;
        };
    }[];
    defaultTheme?: string;
    translationMappings?: {
        defaultLang: string;
        mappings: {
            [key: string]: {
                [lang: string]: string;
            };
        };
    };
    illustrations?: {
        width: number;
        height: number;
        filename: string;
        placement?: {
            pos: string;
            ref: string;
            collection: string;
            caption: string;
        };
    }[];
    about?: string; // TODO
    firebase?: {
        features: {
            [name: string]: boolean;
        };
    };
    menuItems?: MenuItemConfig[];
    bottomNavBarItems?: MenuItemConfig[];
    security?: {
        // TODO
        features?: {
            [key: string]: any;
        };
        pin: string;
        mode: string;
    };
    interfaceLanguages?: {
        useSystemLanguage: boolean;
        writingSystems: {
            [key: string]: WritingSystemConfig;
        };
    };
    keys?: string[];
    analytics?: {
        enabled: boolean;
        providers: {
            id: string;
            name: string;
            type: string;
            parameters?: {
                [key: string]: string;
            };
        }[];
    };
};

export type ScriptureConfig = AppConfig & {
    traits?: any;
    bookCollections?: BookCollectionConfig[];
    videos?: {
        id: string;
        src?: string;
        width: number;
        height: number;
        title?: string;
        thumbnail: string;
        onlineUrl: string;
        filename: string;
        placement?: {
            pos: string;
            ref: string;
            collection: string;
        };
    }[];
    defaultLayout?: string;
    layouts?: {
        mode: string;
        enabled: boolean;
        layoutCollections: string[];
        features?: {
            [key: string]: string;
        };
    }[];
    backgroundImages?: {
        width: string;
        height: string;
        filename: string;
    }[];
    watermarkImages?: {
        width: string;
        height: string;
        filename: string;
    }[];
    plans?: {
        features: {
            [key: string]: string;
        };
        plans: {
            id: string;
            days: number;
            title: {
                [lang: string]: string;
            };
            filename: string;
            jsonFilename: string;
            image?: {
                width: number;
                height: number;
                file: string;
            };
        }[];
    };
};

export type DictionaryConfig = AppConfig & {
    writingSystems: {
        [key: string]: DictionaryWritingSystemConfig;
    };
    indexes: {
        [key: string]: {
            displayed: boolean;
        };
    };
    singleEntryStyles?: {
        name: string;
        category?: string;
        properties: {
            [key: string]: string;
        };
    }[];
};
