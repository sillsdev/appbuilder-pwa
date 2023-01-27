import { selectedVerses } from '$lib/data/stores';
import config from '$lib/data/config';

export type SelectedReference = {
    docSet: string;
    book: string;
    chapter: string;
    verse: string;
};
export function onClickText(e) {
    let target = e.target;

    while (!isSelectableText(target) && !isClickable(target) && !isMain(target)) {
        target = target.parentNode;
    }
    if (isSelectableText(target)) {
        const id = removeIdSuffixes(target.id);
        if (target.className.indexOf('selected') < 0) {
            const maxSelections = config.mainFeatures['annotation-max-select'];
            const currentLength = selectedVerses.length();
            if (currentLength < maxSelections) {
                modifyClassOfElements(id, 'selected', true);
                selectedVerses.addVerse(id);
            }
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
            els[i].className = els[i].className.replace('selected', '');
        }
    }
    selectedVerses.reset();
}

// Deselect elements
export function deselectElements(id) {
    modifyClassOfElements(id, 'selected', false);
    selectedVerses.removeVerse(id);
}

function removeIdSuffixes(id) {
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
    return target.className.indexOf('seltxt') >= 0;
}

function isClickable(target) {
    return target.tagName == 'A';
}

function isMain(target) {
    return target.tagName == 'MAIN';
}
// Modify class name of elements id, id+1, id+2, ida, ida+1, ida+2, idb, etc.
function modifyClassOfElements(id, clsName, select) {
    modifyClassOfElement(id, clsName, select);

    for (let i = 97; i <= 122; i++) {
        const letter = String.fromCharCode(i);
        if (!modifyClassOfElement(id + letter, clsName, select)) {
            break;
        }
    }
}

// Modify class name of elements id, id+1, id+2, etc.
function modifyClassOfElement(id, clsName, select) {
    let found = false;
    let i = 0;
    let el = document.getElementById(id);

    while (el) {
        if (select) {
            if (el.className.indexOf(clsName) < 0) {
                el.className = clsName + ' ' + el.className;
            }
        } else {
            el.className = el.className.replace(clsName, '');
        }
        i++;
        el = document.getElementById(id + '+' + i);
        found = true;
    }

    return found;
}
