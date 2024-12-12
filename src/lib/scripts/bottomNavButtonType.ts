export enum NavButtonType {
    Contents = 'contents',
    Bible = 'book',
    About = 'about',
    Plans = 'plans',
    Search = 'search',
    Settings = 'settings'
}
export function castToNavButtonType(value: string): NavButtonType {
    if (Object.values(NavButtonType).includes(value as NavButtonType)) {
        return value as NavButtonType;
    }
    return undefined;
}