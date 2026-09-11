import { selectedVerses, type SelectedVersesStore } from '$lib/data/stores';

export function onClickText(e: MouseEvent, maxSelections: number) {
    let target = e.target as HTMLElement;

    while (!isSelectableText(target) && !isClickableText(target) && !isMain(target)) {
        target = target.parentNode as HTMLElement;
    }
    if (isSelectableText(target)) {
        const id = removeIdSuffixes(target.id);
        if (!target.classList.contains('selected')) {
            const currentLength = selectedVerses.length();
            if (currentLength < maxSelections) {
                selectedVerses.addVerse(id);
            }
            // Display all selected entries in order
            // for (let i = 0; i < selectedVerses.length(); i++) {
            //     const selected = selectedVerses.getVerseByIndex(i);
            // }
        } else {
            selectedVerses.removeVerse(id);
        }
    }
}
export function updateSelections(container: HTMLElement, selectedVerses: SelectedVersesStore) {
    const items = Array.from(container.getElementsByClassName('selected'));
    let lastId = '';
    // Deselect entries not in the selected verses array
    for (let i = 0; i < items.length; i++) {
        const id = removeIdSuffixes(items[i].id);
        if (id !== lastId) {
            lastId = id;
            const verse = selectedVerses.getVerseByVerseNumber(id);
            if (verse.verse === '') {
                modifyClassOfElements(container, id, 'selected', false);
            }
        }
    }
    // Select items in list
    for (let i = 0; i < selectedVerses.length(); i++) {
        const selectedVerse = selectedVerses.getVerseByIndex(i).verse;
        modifyClassOfElements(container, selectedVerse, 'selected', true);
    }
}
// Deselect all elements
export function deselectAllElements(container: HTMLElement) {
    const els = container.getElementsByTagName('div');
    for (let i = 0; i < els.length; i++) {
        if (els[i].id != '') {
            els[i].classList.remove('selected');
        }
    }
    selectedVerses.reset();
}

// Deselect elements
export function deselectElements(container: HTMLElement, id: string) {
    modifyClassOfElements(container, id, 'selected', false);
    selectedVerses.removeVerse(id);
}

function removeIdSuffixes(id: string) {
    // Remove +n suffix of id
    if (id.indexOf('+') > 0) {
        id = id.substring(0, id.indexOf('+'));
    }
    // Remove a/b/c suffix of id if after a verse number
    // or after a verse range, e.g. 2-3
    const num = id.match(/[0-9]+(-[0-9]+)?/)?.[0];
    if (num) {
        id = id.substring(0, id.indexOf(num) + num.length);
    }

    return id;
}
export function isSelectableText(target: HTMLElement) {
    return target.classList.contains('seltxt');
}

function isClickableText(target: HTMLElement) {
    return target.tagName === 'A';
}

function isMain(target: HTMLElement) {
    return target.tagName === 'MAIN';
}
// Modify class name of elements id, id+1, id+2, ida, ida+1, ida+2, idb, etc.
function modifyClassOfElements(
    container: HTMLElement,
    id: string,
    clsName: string,
    select: boolean
) {
    let success = modifyClassOfElement(container, id, clsName, select);
    for (let i = 97; i <= 122; i++) {
        const letter = String.fromCharCode(i);
        success = modifyClassOfElement(container, id + letter, clsName, select);
        if (!success) {
            break;
        }
    }
}

// Modify class name of elements id, id+1, id+2, etc.
function modifyClassOfElement(
    container: HTMLElement,
    id: string,
    clsName: string,
    select: boolean
): boolean {
    let found = false;
    let i = 0;
    let el = container.querySelector(`#${id}`);

    while (el) {
        if (select) {
            if (!el.classList.contains(clsName)) {
                el.classList.add(clsName);
            }
        } else {
            el.classList.remove(clsName);
        }
        i++;
        el = container.querySelector(`#${id}+${i}`);
        found = true;
    }

    return found;
}
