<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { base } from '$app/paths';
    import { page } from '$app/stores';

    /** @type {import('./$types').PageData} */
    export let data;

    console.log(JSON.stringify(data, null, 4));

    let score = 0;
    let questionNum = 0;
</script>

<div class="grid grid-rows-[auto,1fr] h-screen">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="dropdown" slot="books">
                <!-- CHECK ABOVE!!!! -->
                <div class="btn btn-rectangel normal-case text-xl">{'Quiz'}</div>
                <!-- CHECK ABOVE!!!! -->
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>
    <body class="quiz">
        <div id="content">
            <div class="quiz-question-number"></div>
            <div class="quiz-question-block">
                <div class="quiz-question">
                    {data.quiz.questions[questionNum].text}
                    {#if data.quiz.questions[questionNum].image}
                        {data.quiz.questions[questionNum].image}
                    {/if}
                </div>
            </div>
            <table class="mt-10">
                {#if data.quiz.questions[questionNum].answers}
                    <!-- If statement checks if questions have all been answered. -->
                    {#each data.quiz.questions[questionNum].answers as answer}
                        <tr>
                            <td>
                                <button
                                    class="flex-initial w-[32rem] mt-2 justify-center gap-8"
                                    on:click={() => {
                                        {#if answer==ar}
                                        audio plays
                                        {/if}
                                        {#else}
                                        other audio [plays]
                                        {/else}
                                        questionNum++;
                                    }}
                                >
                                    <div class="quiz-answer flex- w-[32rem] justify-center">
                                        {#if answer.text}
                                            {answer.text}
                                        {/if}
                                        {#if answer.image}
                                            {answer.image}
                                        {/if}
                                    </div>
                                </button>
                            </td>
                        </tr>
                    {/each}
                {/if}
            </table>
        </div>
    </body>
</div>
