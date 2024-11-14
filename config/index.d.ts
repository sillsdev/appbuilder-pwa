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
    chapters: number;
    chaptersN: string; // 1-34
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

export type AppConfig = {
    name?: string;
    package?: string;
    version?: string;
    programVersion?: string;
    programType?: string;
    mainFeatures?: any;
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
    about?: string; // TODO
    firebase?: {
        features: {
            [name: string]: boolean;
        };
    };
    security?: {
        // TODO
        features?: {
            [key: string]: any;
        };
        pin: string;
        mode: string;
    };
};

export type ScriptureConfig = AppConfig & {
    traits?: any;
    bookCollections?: BookCollectionConfig[];
    interfaceLanguages?: {
        useSystemLanguage: boolean;
        writingSystems: {
            [key: string]: {
                displayNames: {
                    [key: string]: string;
                };
                fontFamily: string;
                textDirection: string;
            };
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
    audio?: AudioConfig;
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
    menuItems?: {
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
            image?: {
                width: number;
                height: number;
                file: string;
            };
        }[];
    };
};

export type DictionaryConfig = AppConfig & {
    interfaceLanguages?: {
        useSystemLanguage: boolean;
        writingSystems: {
            [key: string]: {
                displayNames: {
                    [key: string]: string;
                };
                fontFamily: string;
                textDirection: string;
                sortMethod: {
                    ignoreChars: string[];
                };
                alphabet: string[];
                inputButtons: string[];
                features?: {
                    [key: string]: any;
                };
            };
        };
    };
};
