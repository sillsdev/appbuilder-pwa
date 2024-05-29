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

    function shuffleAnswers(answerArray) {
        let currentIndex = answerArray.length,
            randomIndex;

        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [answerArray[currentIndex], answerArray[randomIndex]] = [
                answerArray[randomIndex],
                answerArray[currentIndex]
            ];
        }

        return answerArray;
    }
</script>

{#if questionNum == data.quiz.questions.length}
    <h1>Your score: {score}</h1>
{:else}
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
                        <div class="quiz-question-block">
                            <div class="quiz-question">
                                {data.quiz.questions[questionNum].text}
                                {#if data.quiz.questions[questionNum].image}
                                    {data.quiz.questions[questionNum].image}
                                {/if}
                            </div>
                            <div class="flex quiz-answer-block justify-center">
                                <table class="mt-10">
                                    {#each shuffleAnswers(data.quiz.questions[questionNum].answers) as answer}
                                        <tr>
                                            <td>
                                                <button
                                                    class="flex-initial w-[32rem] mt-2 gap-8}"
                                                    on:click={() => {
                                                        const audioPath = answer.correct
                                                            ? `${base}/clips/quiz-right-answer.mp3`
                                                            : `${base}/clips/quiz-wrong-answer.mp3`;
                                                        playSound(audioPath);
                                                        if (answer.correct) {
                                                            score++;
                                                        }
                                                        console.log(score);
                                                        setTimeout(() => {
                                                            questionNum++;
                                                        }, 1000);
                                                        answer.clicked = true;
                                                    }}
                                                >
                                                    <div
                                                        class="quiz-answer flex justify-center items-center"
                                                        style="{answer.clicked && !answer.correct
                                                            ? 'background-color: rgb(500,0,0)'
                                                            : ''} {answer.clicked && answer.correct
                                                            ? 'background-color: rgb(0,500,0)'
                                                            : ''}"
                                                    >
                                                        {answer.text}
                                                    </div>
                                                </button>
                                            </td>
                                        </tr>
                                    {/each}
                                </table>
                            </div>
                        </div>
                    {/if}
                    {#if data.quiz.questions[questionNum].answers.some((answer) => answer.image)}
                        <div class="quiz-question-block">
                            <div class="quiz-question">
                                {data.quiz.questions[questionNum].text}
                                {#if data.quiz.questions[questionNum].image}
                                    {data.quiz.questions[questionNum].image}
                                {/if}
                            </div>
                            <div class="flex quiz-answer-block justify-center">
                                <table class="mt-10">
                                    {#each shuffleAnswers(data.quiz.questions[questionNum].answers) as answer}
                                        <tr>
                                            <td>
                                                <button
                                                    class="flex-initial w-[32rem] mt-2 gap-8 {answer.clicked &&
                                                    !answer.correct
                                                        ? 'bg-red-500'
                                                        : ''} {answer.clicked && answer.correct
                                                        ? 'bg-green-500'
                                                        : ''}"
                                                    on:click={() => {
                                                        const audioPath = answer.correct
                                                            ? `${base}/clips/quiz-right-answer.mp3`
                                                            : `${base}/clips/quiz-wrong-answer.mp3`;
                                                        playSound(audioPath);
                                                        if (answer.correct) {
                                                            score++;
                                                        }
                                                        console.log(score);
                                                        setTimeout(() => {
                                                            questionNum++;
                                                        }, 1000);
                                                        answer.clicked = true;
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
                                    {/each}
                                </table>
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>
        </body>
    </div>
{/if}
