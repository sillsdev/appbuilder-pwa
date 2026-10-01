import { goto } from '$app/navigation';
import { getNextPlanReference } from '$lib/data/planProgressItems';
import { defaultPlanStore, t, type PlanStore } from '$lib/data/stores';
import type { ReferenceStore } from '$lib/data/stores/reference';
import { getDisplayString } from '$lib/scripts/scripture-reference-utils';
import { getReferenceFromString } from '$lib/scripts/scripture-reference-utils-common';
import { resolve } from '$lib/utils/paths';
import type { RenderWorkspace } from '../common';

export function planDivInChapter(plan: PlanStore, references: ReferenceStore) {
    let planEntryInChapter = false;
    // If plan entry is -1, there is no active entry
    if (plan.planEntry !== -1) {
        if (
            plan.planBookId === references.book &&
            plan.planChapter.toString() === references.chapter
        ) {
            planEntryInChapter = true;
        }
    }
    return planEntryInChapter;
}

function matchesVerse(planToVerse: number, verseNumber: string): boolean {
    // If end of plan range is -1, then only match verseNumber '-1'
    if (planToVerse === -1) {
        return verseNumber === '-1';
    }

    // If it's just a single number string, compare directly
    if (/^\d+$/.test(verseNumber)) {
        return planToVerse === Number(verseNumber);
    }

    // If it's a range like "3-5"
    if (/^\d+-\d+$/.test(verseNumber)) {
        const [start, end] = verseNumber.split('-').map(Number);
        return planToVerse >= start && planToVerse <= end;
    }

    // If verseNumber is something unexpected, return false
    return false;
}

export function addPlanDiv(workspace: RenderWorkspace, verseNumber: string) {
    if (
        planDivInChapter(workspace.stores.plan, workspace.references) &&
        matchesVerse(workspace.stores.plan.planToVerse, verseNumber)
    ) {
        const planDiv = document.createElement('div');
        planDiv.id = 'plan-progress';
        planDiv.classList.add('plan-progress-block');
        if (workspace.stores.lastPlanReference) {
            // plan is complete once this item finishes
            appendPlanProgressTextDiv(
                planDiv,
                'plan-progress-title',
                '',
                workspace.stores.t['Plans_Progress_Congratulations'],
                false,
                workspace
            );
            appendPlanProgressTextDiv(
                planDiv,
                'plan-progress-info',
                '',
                workspace.stores.t['Plans_Progress_Plan_Completed'],
                false,
                workspace
            );
            appendPlanProgressTextDiv(
                planDiv,
                'plan-progress-info',
                '',
                workspace.stores.currentPlanData?.title?.[workspace.stores.language] ??
                    workspace.stores.currentPlanData?.title?.default ??
                    '',
                false,
                workspace
            );
            appendPlanProgressTextDiv(
                planDiv,
                'plan-progress-button',
                'PLAN-next',
                workspace.stores.t['Plans_Button_View_Plans'],
                true,
                workspace
            );
        } else {
            appendPlanProgressTextDiv(
                planDiv,
                'plan-progress-info',
                '',
                workspace.stores.t['Plans_Progress_Item_Completed'],
                false,
                workspace
            );
            appendPlanProgressTextDiv(
                planDiv,
                'plan-progress-reference',
                '',
                getPlanReferenceString(
                    workspace.stores.plan.planReference,
                    workspace.references
                ),
                false,
                workspace
            );
            const hr = document.createElement('hr');
            if (workspace.stores.plan.planNextReference === '') {
                // No more entries for current day
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-button',
                    'PLAN-next',
                    workspace.stores.t['Plans_Button_View_Plan'],
                    true,
                    workspace
                );
            } else {
                planDiv.append(hr);
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-info',
                    '',
                    workspace.stores.t['Plans_Progress_Next_Reading'],
                    false,
                    workspace
                );
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-reference',
                    '',
                    getPlanReferenceString(
                        workspace.stores.plan.planNextReference,
                        workspace.references
                    ),
                    false,
                    workspace
                );
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-button',
                    'PLAN-next',
                    workspace.stores.t['Button_Next'],
                    true,
                    workspace
                );
            }
        }
        workspace.scopeManager.appendContent(planDiv);
    } else if (
        planDivInChapter(workspace.stores.plan, workspace.references) === false &&
        workspace.stores.plan.completed === true
    ) {
        // If we are no longer in the plan chapter and the plan section
        // has been read, clear plan so that the plan item will not
        // appear if you go back to that chapter
        workspace.events.setPlanStore({ ...defaultPlanStore });
    }
}

function appendPlanProgressTextDiv(
    progressDiv: HTMLDivElement,
    divClass: string,
    divId: string,
    stringId: string,
    addClick: boolean,
    workspace: RenderWorkspace
) {
    const textDiv = document.createElement('div');
    if (divId !== '') {
        textDiv.id = divId;
    }
    if (addClick) {
        textDiv.onclick = (event) => planClicked(workspace);
    }
    textDiv.classList.add(divClass);
    textDiv.innerHTML += stringId;
    progressDiv.append(textDiv);
}

function getPlanReferenceString(ref: string, references: ReferenceStore) {
    const [_collection, book, _fromChapter, toChapter, verseRanges] = getReferenceFromString(ref);
    return getDisplayString(references.collection, book, toChapter, verseRanges);
}

function planClicked(workspace: RenderWorkspace) {
    if (workspace.stores.plan.planNextReference === '') {
        if (workspace.stores.currentPlanState === 'completed') {
            goto(resolve(`/plans`));
        } else {
            goto(resolve(`/plans/${workspace.stores.plan.planId}`));
        }
    } else {
        gotoPlanReference(workspace);
    }
}

async function gotoPlanReference(workspace: RenderWorkspace) {
    const currentBookCollectionId = workspace.references.collection;
    const [_collection, book, _fromChapter, toChapter, verseRanges] = getReferenceFromString(
        workspace.stores.plan.planNextReference
    );
    const [fromVerse, toVerse, _separator] = verseRanges[0];
    const destinationVerse = fromVerse === -1 ? 1 : fromVerse;
    if (workspace.stores.currentPlanData?.items) {
        const item = workspace.stores.currentPlanData.items[workspace.stores.plan.planDay - 1];
        const [nextReference, nextIndex] = await getNextPlanReference(
            workspace.stores.plan.planId,
            item,
            workspace.stores.plan.planNextReferenceIndex
        );
        const newEntry = workspace.stores.plan.planNextReferenceIndex;
        const newReference = workspace.stores.plan.planNextReference;
        workspace.events.setPlanStore({
            planId: workspace.stores.plan.planId,
            planDay: workspace.stores.plan.planDay,
            planEntry: newEntry,
            planBookId: book,
            planChapter: toChapter,
            planFromVerse: fromVerse,
            planToVerse: toVerse,
            planReference: newReference,
            planNextReference: nextReference,
            planNextReferenceIndex: nextIndex,
            completed: false
        });

        workspace.events.navigate({
            docSet: currentBookCollectionId,
            book: book,
            chapter: toChapter.toString(),
            verse: destinationVerse.toString()
        });
    }
}
