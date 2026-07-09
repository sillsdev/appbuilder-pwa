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

export type BookTabConfig = {
    bookTabID: string;
    type: string;
    file: string;
    features: FeatureConfig;
    chapters?: number;
    chaptersN?: string;
    style?: StyleConfig;
    styles?: {
        name: string;
        category?: string;
        properties: {
            [key: string]: string;
        };
    }[];
    fonts?: string[];
    audio: BookCollectionAudioConfig[];
    footer?: HTML;
};

export type BookTabsConfig = {
    mainType: string;
    tabs: BookTabConfig[];
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
    hashedFileName?: string; // currently just for HTML books
    audio: BookCollectionAudioConfig[];
    features: FeatureConfig;
    quizFeatures?: FeatureConfig;
    footer?: HTML;
    style?: StyleConfig;
    styles?: {
        name: string;
        category?: string;
        properties: {
            [key: string]: string;
        };
    }[];
    bookTabs?: BookTabsConfig;
    pageIllustrations?: {
        num: number;
        filename: string;
    }[];
};

export type BookCollectionConfig = {
    id: string;
    features: FeatureConfig;
    books: BookConfig[];
    style?: StyleConfig;
    fonts: string[];
    languageCode: string;
    languageName?: string;
    footer?: HTML;
    copyShareMessage?: string;
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
    fontRelativeSize?: string;
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

export type FeatureValue = string | boolean | number;
export type FeatureConfig = Record<string, FeatureValue>;

export type AppConfig = {
    name?: string;
    package?: string;
    version?: string;
    programVersion: string;
    programType: string;
    mainFeatures: FeatureConfig;
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
    programType: 'SAB';
    traits?: FeatureConfig;
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
    tabTypes?: {
        [key: string]: {
            style: 'image' | 'text';
            name: {
                [lang: string]: string;
            };
            images?: {
                width: number;
                height: number;
                file: string;
            }[];
        };
    };
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
        plans: PlanItem[];
    };
};

export type PlanItem = {
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
};

export type DictionaryConfig = AppConfig & {
    programType: 'DAB';
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

export type QuizExplanation = {
    text?: string;
    audio?: string;
};

export type QuizAnswer = {
    //\aw or \ar
    correct: boolean;
    text?: string;
    image?: string;
    audio?: string;
    explanation?: QuizExplanation;
    // field is used extensively in UI, adding here for type-safety
    clicked?: boolean;
};

export type QuizQuestion = {
    //\qu
    text: string;
    image?: string;
    audio?: string;
    columns?: number; //\ac
    explanation?: QuizExplanation;
    answers: QuizAnswer[];
};

export type Quiz = {
    id: string; //\id
    name?: string; //\qn
    shortName?: string; //\qs
    rightAnswerAudio?: string[]; //\ra
    wrongAnswerAudio?: string[]; //\wa
    questions: QuizQuestion[];
    scoreMessageBefore?: string; //\sb
    scoreMessageAfter?: string; //\sa
    commentary?: {
        //\sc
        rangeMin: number;
        rangeMax?: number;
        message: string;
    }[];
    passScore?: number; //\pm
};

export type LangContainer = { [lang: string]: string };

export type LinkMeta = {
    // intended to pass between functions so that there is one object passed
    linkType?: string;
    linkTarget?: string;
    linkLocation?: string;
};

export type ContentItem = {
    id: number;
    heading?: boolean;
    features?: FeatureConfig;
    title: LangContainer;
    subtitle?: LangContainer;
    audioFilename?: LangContainer;
    imageFilename?: string;
    itemType?: string;
    contentItemContainer: boolean;
    linkType?: string;
    linkTarget?: string;
    linkLocation?: string;
    layoutMode?: string;
    layoutCollection?: string[];
    children?: ContentItem[];
};

export type ContentScreen = {
    id: number;
    title?: {
        [lang: string]: string;
    };
    items?: {
        id: number;
    }[];
};

export type ContentsData = {
    title?: {
        [lang: string]: string;
    };
    features?: FeatureConfig;
    items?: ContentItem[];
    nestedItems?: boolean;
    screens?: ContentScreen[];
};
