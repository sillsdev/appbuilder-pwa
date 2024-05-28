<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { base } from '$app/paths';
    import { page } from '$app/stores';

    /** @type {import('./$types').PageData} */
    export let data;

    // console.log(JSON.stringify(data, null, 4));

    let score = 0;
    let questionNum = 0;

    function playSound(path) {
        const audio = new Audio();
        audio.src = path;
        audio.play();
    }
</script>

<div class="grid grid-rows-[auto,1fr] h-screen">
    <div class="navbar">
        <Navbar>
            <label for="dropdown" slot="books">
                <div class="btn btn-rectangel normal-case text-xl">{'Quiz'}</div>
            </label>
        </Navbar>
    </div>
    <body class="quiz">
        <div id="content">
            <div class="quiz-question-number">{questionNum + 1}</div>
            {#if data.quiz.questions[questionNum].answers}
                {#if data.quiz.questions[questionNum].answers.some((answer) => answer.text)}
                    <div class="quiz-answer-block">
                        <div class="quiz-question">
                            {data.quiz.questions[questionNum].text}
                            {#if data.quiz.questions[questionNum].image}
                                {data.quiz.questions[questionNum].image}
                            {/if}
                        </div>
                        <div class="flex quiz-question-block justify-center">
                            <table class="mt-10">
                                {#each data.quiz.questions[questionNum].answers as answer}
                                    {#if answer.text}
                                        <tr>
                                            <td>
                                                <button
                                                    class="flex-initial w-[32rem] mt-2 gap-8"
                                                    on:click={() => {
                                                        const audioPath = answer.correct
                                                            ? `${base}/clips/quiz-right-answer.mp3`
                                                            : `${base}/clips/quiz-wrong-answer.mp3`;
                                                        playSound(audioPath);
                                                        questionNum++;
                                                    }}
                                                >
                                                    <div
                                                        class="quiz-answer flex justify-center items-center"
                                                    >
                                                        {answer.text}
                                                    </div>
                                                </button>
                                            </td>
                                        </tr>
                                    {/if}
                                {/each}
                            </table>
                        </div>
                    </div>
                {/if}
                {#if data.quiz.questions[questionNum].answers.some((answer) => answer.image)}
                    <div class="quiz-answer-block">
                        <div class="quiz-question">
                            {data.quiz.questions[questionNum].text}
                            {#if data.quiz.questions[questionNum].image}
                                {data.quiz.questions[questionNum].image}
                            {/if}
                        </div>
                        <div class="flex quiz-question-block justify-center">
                            <table class="mt-10">
                                {#each data.quiz.questions[questionNum].answers as answer}
                                    {#if answer.image}
                                        <tr>
                                            <td>
                                                <button
                                                    class="flex-initial w-[32rem] mt-2 gap-8"
                                                    on:click={() => {
                                                        const audioPath = answer.correct
                                                            ? `${base}/clips/quiz-right-answer.mp3`
                                                            : `${base}/clips/quiz-wrong-answer.mp3`;
                                                        playSound(audioPath);
                                                        questionNum++;
                                                    }}
                                                >
                                                    <div
                                                        class="quiz-answer flex justify-center items-center"
                                                    >
                                                        {answer.image}
                                                    </div>
                                                </button>
                                            </td>
                                        </tr>
                                    {/if}
                                {/each}
                            </table>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </body>
</div>
