<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import { selectedLayouts, t, themeColors } from '$lib/data/stores';
    import CollectionList from './CollectionList.svelte';
    import Modal from './Modal.svelte';

    let id = $state('collection');
    let closeButton: HTMLButtonElement;
    let modal: Modal;
    let viewType = $state('verse-by-verse');
    let selectionNumber = $state(0);
    let showBlankCollection = $state(false);
    const selectedLayout = $derived.by(() => {
        switch (viewType) {
            case 'double-pane':
                return $selectedLayouts.sideBySide?.[selectionNumber];
            case 'verse-by-verse':
                return $selectedLayouts.verseByVerse?.[selectionNumber];
            default:
                return undefined;
        }
    });
    const allDocSets =
        scriptureConfig.bookCollections?.map((ds) => ({
            id: ds.languageCode + '_' + ds.id,
            name: ds.collectionName,
            singlePane: (ds?.features['bc-allow-single-pane'] ??
                ds?.features['bc-layout-allow-single-pane']) as boolean,
            doublePane: (ds?.features['bc-allow-two-pane'] ??
                ds?.features['bc-layout-allow-two-pane']) as boolean,
            verseByVerse: (ds?.features['bc-allow-verse-by-verse'] ??
                ds?.features['bc-layout-allow-verse-by-verse']) as boolean,
            description: ds?.collectionDescription,
            image: ds?.collectionImage
        })) ?? [];
    const blank = {
        id: '',
        name: '--------',
        singlePane: false,
        doublePane: true,
        verseByVerse: true,
        description: '',
        image: undefined
    };
    allDocSets.unshift(blank);
    function handleClick(opt: any) {
        if (viewType === 'double-pane' && $selectedLayouts.sideBySide) {
            $selectedLayouts.sideBySide[selectionNumber] = opt.collection;
            const docSets = allDocSets.filter((x) => {
                return x.doublePane === true && x !== blank;
            });
            for (let i = 0; i < $selectedLayouts.sideBySide.length; i++) {
                if (i === selectionNumber) {
                    // if found self
                    continue;
                } else if ($selectedLayouts.sideBySide[i].id === opt.collection.id) {
                    // if this is a repeat value of self
                    const replacement = docSets.filter(
                        (x) => $selectedLayouts.sideBySide?.includes(x) === false
                    )[0];
                    if (replacement) {
                        $selectedLayouts.sideBySide[i] = replacement;
                    }
                }
            }
        }
        if (viewType === 'verse-by-verse' && $selectedLayouts.verseByVerse) {
            $selectedLayouts.verseByVerse[selectionNumber] = opt.collection;
            const docSets = allDocSets.filter((x) => {
                return x.verseByVerse === true && x !== blank;
            });
            for (let i = 0; i < $selectedLayouts.verseByVerse.length; i++) {
                if (i === selectionNumber) {
                    // if found self
                    continue;
                } else if ($selectedLayouts.verseByVerse[i].id === opt.collection.id) {
                    // if this is a repeat value of self
                    const replacement = docSets.filter(
                        (x) => $selectedLayouts.verseByVerse?.includes(x) === false
                    )[0];
                    if (replacement) {
                        $selectedLayouts.verseByVerse[i] = replacement;
                    }
                }
            }
        }
        closeButton.click();
    }

    export function showModal(data: { type: string; showBlank: boolean; number: number }) {
        viewType = data.type;
        showBlankCollection = data.showBlank;
        selectionNumber = data.number;
        modal.showModal();
    }
    function handleOk() {}
</script>

<Modal bind:this={modal} {id} styling="background-color:{$themeColors['BackgroundColor']};">
    <div class="text-center">
        <div class="overflow-y-auto max-h-[80vh] p-1 text-left">
            <CollectionList
                docSets={allDocSets.filter((x) => {
                    switch (viewType) {
                        case 'double-pane':
                            return x.doublePane === true && (x !== blank || showBlankCollection);
                        case 'verse-by-verse':
                            return x.verseByVerse === true && (x !== blank || showBlankCollection);
                        default:
                            return true;
                    }
                })}
                selectedLayouts={selectedLayout}
                menuaction={(event) => handleClick(event)}
            />
        </div>
        <button
            class="dy-btn dy-btn-sm dy-btn-ghost mt-4"
            bind:this={closeButton}
            onclick={() => handleOk()}>{$t['Button_Close']}</button
        >
    </div>
</Modal>
