import { selectedVerses } from '$lib/data/stores';
import config from '$lib/data/config';

export type SelectedReference = {
    docSet: string;
    book: string;
    chapter: string;
    verse: string;
};
export function onClickText(e: any) {
    let target = e.target;

    while (!isSelectableText(target) && !isClickable(target) && !isMain(target)) {
        target = target.parentNode;
    }
    if (isSelectableText(target)) {
        const id = removeIdSuffixes(target.id);
        if (!target.classList.contains('selected')) {
            const maxSelections = config.mainFeatures['annotation-max-select'];
            const currentLength = selectedVerses.length();
            if (currentLength < maxSelections) {
                const selectedText = modifyClassOfElements(id, 'selected', true);
                selectedVerses.addVerse(id, selectedText);
            }
            /*
            // Display all selected entries in order
            let nextIndex = selectedVerses.getNextVerseIndex();
            while (nextIndex != -1)  {
                const selected = selectedVerses.getVerseByIndex(nextIndex);
                console.log("Selection %o: verse: %o, text: %o", nextIndex, selected.verse, selected.text);
                nextIndex = selectedVerses.getNextVerseIndex(selected.verse);
            }
            */
        } else {
            modifyClassOfElements(id, 'selected', false);
            selectedVerses.removeVerse(id);
        }
    }
}
// Deselect all elements
export function deselectAllElements() {
    const els = document.getElementsByTagName('div');
    for (let i = 0; i < els.length; i++) {
        if (els[i].id != '') {
            els[i].classList.remove('selected');
        }
    }
    selectedVerses.reset();
}

// Deselect elements
export function deselectElements(id: string) {
    modifyClassOfElements(id, 'selected', false);
    selectedVerses.removeVerse(id);
}

function removeIdSuffixes(id: string) {
    // Remove +n suffix of id
    if (id.indexOf('+') > 0) {
        id = id.substring(0, id.indexOf('+'));
    }
    // Remove a/b/c suffix of id if after a verse number
    // or after a verse range, e.g. 2-3
    const num = id.match(/[0-9]+(-[0-9]+)?/)[0];
    if (num) {
        id = id.substring(0, id.indexOf(num) + num.length);
    }

    return id;
}
function isSelectableText(target) {
    return target.classList.contains('seltxt');
}

function isClickable(target) {
    return target.tagName === 'A';
}

function isMain(target) {
    return target.tagName === 'MAIN';
}
// Modify class name of elements id, id+1, id+2, ida, ida+1, ida+2, idb, etc.
function modifyClassOfElements(id, clsName, select): string {
    let [success, selectedText] = modifyClassOfElement(id, clsName, select);
    let text = selectedText;
    for (let i = 97; i <= 122; i++) {
        const letter = String.fromCharCode(i);
        [success, selectedText] = modifyClassOfElement(id + letter, clsName, select);
        if (!success) {
            break;
        }
        text = text.concat(selectedText);
    }
    return text;
}

// Modify class name of elements id, id+1, id+2, etc.
function modifyClassOfElement(id: string, clsName: string, select: boolean): [boolean, string] {
    let found = false;
    let selectedText = '';
    let i = 0;
    let el = document.getElementById(id);

    while (el) {
        if (select) {
            selectedText = selectedText.concat(el.textContent);
            if (!el.classList.contains(clsName)) {
                el.classList.add(clsName);
            }
        } else {
            el.classList.remove(clsName);
        }
        i++;
        el = document.getElementById(id + '+' + i);
        found = true;
    }

    return [found, selectedText];
}
