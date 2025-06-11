export interface MenuActionEvent {
    text: string;
}
export interface SearchFormSubmitEvent {
    phrase: string;
    wholeWords: boolean;
    matchAccents: boolean;
}