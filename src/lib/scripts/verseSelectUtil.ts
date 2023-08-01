export function onClickText(e: any, selectedVerses: any, maxSelections: any) {
    let target = e.target;

    while (!isSelectableText(target) && !isClickableText(target) && !isMain(target)) {
        target = target.parentNode;
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
export function updateSelections(selections: any) {
    const items = Array.from(document.getElementsByClassName('selected'));
    let lastId = '';
    // Deselect entries not in the selected verses array
    for (let i = 0; i < items.length; i++) {
        const id = removeIdSuffixes(items[i].id);
        if (id !== lastId) {
            lastId = id;
            const verse = selections.getVerseByVerseNumber(id);
            if (verse.verse === '') {
                modifyClassOfElements(id, 'selected', false);
            }
        }
    }
    // Select items in list
    for (let i = 0; i < selections.length(); i++) {
        const selectedVerse = selections.getVerseByIndex(i).verse;
        modifyClassOfElements(selectedVerse, 'selected', true);
    }
}
// Deselect all elements
export function deselectAllElements(selections: any) {
    const els = document.getElementsByTagName('div');
    for (let i = 0; i < els.length; i++) {
        if (els[i].id != '') {
            els[i].classList.remove('selected');
        }
    }
    selections.reset();
}

// Deselect elements
export function deselectElements(id: string, selections: any) {
    modifyClassOfElements(id, 'selected', false);
    selections.removeVerse(id);
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
export function isSelectableText(target) {
    return target.classList.contains('seltxt');
}

function isClickableText(target) {
    return target.tagName === 'A';
}

function isMain(target) {
    return target.tagName === 'MAIN';
}
// Modify class name of elements id, id+1, id+2, ida, ida+1, ida+2, idb, etc.
function modifyClassOfElements(id, clsName, select) {
    let success = modifyClassOfElement(id, clsName, select);
    for (let i = 97; i <= 122; i++) {
        const letter = String.fromCharCode(i);
        success = modifyClassOfElement(id + letter, clsName, select);
        if (!success) {
            break;
        }
    }
}

// Modify class name of elements id, id+1, id+2, etc.
function modifyClassOfElement(id: string, clsName: string, select: boolean): boolean {
    let found = false;
    let i = 0;
    let el = document.getElementById(id);

    while (el) {
        if (select) {
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

    return found;
}
