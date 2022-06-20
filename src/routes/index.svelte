<script lang="ts">
    import '$src/app';
    import ScriptureView from '$lib/components/ScriptureView.svelte';
    let text: App.BibleText = {
        title: 'The Good News According to John',
        book: 'John',
        chapter: '1',
        bookmark: '',
        paragraphs: [
            {
                1: {
                    a: 'In the beginning was the Word, and the Word was with God, and the Word was God.'
                },
                2: { a: 'The same was in the beginning with God.' },
                3: {
                    a: 'All things were made through him. Without him, nothing was made that has been made.'
                },
                4: { a: 'In him was life, and the life was the light of men.' },
                5: { a: 'The light shines in the darkness, and the darkness hasn’t overcome it.' }
            },
            {
                6: { a: 'There came a man sent from God, whose name was John.' },
                7: {
                    a: 'The same came as a witness, that he might testify about the light, that all might believe through him.'
                },
                8: {
                    a: 'He was not the light, but was sent that he might testify about the light.'
                },
                9: { a: 'The true light that enlightens everyone was coming into the world.' }
            },
            {
                10: {
                    a: 'He was in the world, and the world was made through him, and the world didn’t recognize him.'
                },
                11: { a: 'He came to his own, and those who were his own didn’t receive him.' },
                12: {
                    a: 'But as many as received him, to them he gave the right to become God’s children, to those who believe in his name:'
                },
                13: {
                    a: 'who were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God.'
                }
            },
            {
                14: {
                    a: 'The Word became flesh and lived among us. We saw his glory, such glory as of the only born Son of the Father, full of grace and truth.'
                },
                15: {
                    a: 'John testified about him. He cried out, saying, “This was he of whom I said, ‘He who comes after me has surpassed me, for he was before me.’”'
                },
                16: { a: 'From his fullness we all received grace upon grace.' },
                17: {
                    a: 'For the law was given through Moses. Grace and truth were realized through Jesus Christ.'
                },
                18: {
                    a: 'No one has seen God at any time. The only born Son, who is in the bosom of the Father, has declared him.'
                }
            }
        ]
    };
</script>

<ScriptureView {text} />
