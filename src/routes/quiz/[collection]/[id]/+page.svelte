<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { refs } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { base } from '$app/paths';
    import { onMount } from 'svelte';
    /** @type {import('./$types').PageData} */
    export let data;
    // console.log(JSON.stringify(data, null, 4));
    let quiz = data.quiz;
    let shuffledAnswers = [];
    let score = 0;
    let questionNum = 0;
    let clicked = false;
    let displayCorrect = false;
    function playSound(path) {
        const audio = new Audio();
        audio.src = path;
        audio.play();
    }
    function getImageSource(image) {
        let source = `${base}/illustrations/${$refs.collection}-${quiz.id}-${image}`;
        return source;
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
    function handleQuestionChange() {
        if (questionNum == quiz.questions.length) {
            shuffledAnswers = [];
        } else {
            for (const answer of quiz.questions[questionNum].answers) {
                answer.clicked = false;
            }
            shuffledAnswers = shuffleAnswers(quiz.questions[questionNum].answers);
        }
    }
    function onNextQuestion() {
        questionNum++;
        clicked = false;
        displayCorrect = false;
        handleQuestionChange();
    }
    function onQuestionAnswered(answer) {
        const audioPath = answer.correct
            ? `${base}/assets/quiz-right-answer.mp3`
            : `${base}/assets/quiz-wrong-answer.mp3`;
        playSound(audioPath);
        if (answer.correct) {
            score++;
        }
        setTimeout(() => {
            answer.clicked = true;
            clicked = true;
            if (answer.correct) {
                displayCorrect = true;
            } else {
                setTimeout(() => {
                    displayCorrect = true;
                }, 1000);
            }
        }, 1000);
    }
    onMount(() => {
        questionNum = 0;
        handleQuestionChange();
    });
</script>

<div class="grid grid-rows-[auto,1fr] h-screen">
    <div class="navbar">
        <Navbar>
            <label for="Quiz" slot="center">
                <div class="btn btn-rectangel normal-case text-xl">{'Quiz'}</div>
            </label>
        </Navbar>
    </div>
    {#if questionNum == quiz.questions.length}
        <div class="score flex justify-center items-center">
            <div id="content">
                <div class="quiz-score-before">You scored</div>
                <div class="quiz-score-block">
                    <span class="quiz-score">{score}</span>
                </div>
                <div class="quiz-score-after">
                    out of {questionNum} questions.
                </div>
                {#if score == quiz.passScore || score > quiz.passScore}
                    <div class="mt-6 text-3xl font-bold text-green-500">You pass!</div>
                {:else if score < quiz.passScore}
                    <div class="mt-6 text-3xl font-bold text-red-500">Oh, dear!</div>
                {/if}
            </div>
        </div>
    {:else}
        <body class="quiz">
            <div id="content">
                <div class="quiz-question-number">{questionNum + 1}</div>
                {#if quiz.questions[questionNum].answers}
                    {#if quiz.questions[questionNum].answers.some((answer) => answer.text)}
                        <div class="quiz-question-block">
                            <div class="quiz-question">
                                {quiz.questions[questionNum].text}
                                {#if quiz.questions[questionNum].image}
                                    <div class="flex justify-center">
                                        <img
                                            class="quiz-question-image"
                                            src={getImageSource(quiz.questions[questionNum].image)}
                                        />
                                    </div>
                                    <!-- this goes in the img above possibly: alt={quiz.questions[questionNum].text} -->
                                {/if}
                            </div>
                            <div class="flex quiz-answer-block justify-center">
                                <table class="mt-10">
                                    {#each shuffledAnswers as answer}
                                        <tr>
                                            <td>
                                                <button
                                                    class="flex-initial w-64 md:w-[22rem] lg:w-[32rem] mt-2 gap-8}"
                                                    on:click={() => {
                                                        onQuestionAnswered(answer);
                                                    }}
                                                >
                                                    <div
                                                        class="quiz-answer flex justify-center"
                                                        style="{clicked &&
                                                        answer.clicked &&
                                                        !answer.correct
                                                            ? 'color: rgb(255, 255, 255); background-color: rgb(128,0,0)'
                                                            : ''} {clicked &&
                                                        answer.correct &&
                                                        (answer.clicked || displayCorrect)
                                                            ? 'color: rgb(255, 255, 255); background-color: rgb(0,128,0)'
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
                    {#if quiz.questions[questionNum].answers.some((answer) => answer.image)}
                        <div class="quiz-question-block">
                            <div class="quiz-question">
                                {quiz.questions[questionNum].text}
                            </div>
                            <div class="flex justify-center flex-wrap gap-4">
                                <div class="grid grid-cols-2 gap-4">
                                    {#each shuffledAnswers as answer}
                                        <div class="w-full flex justify-center">
                                            <img
                                                class="cursor-pointer w-32 h-32 rounded-md"
                                                src={getImageSource(answer.image)}
                                                alt={answer.text}
                                                style="{clicked && answer.clicked && !answer.correct
                                                    ? 'color: rgb(255, 255, 255); background-color: rgb(128,0,0)'
                                                    : ''} {clicked &&
                                                answer.correct &&
                                                (answer.clicked || displayCorrect)
                                                    ? 'color: rgb(255, 255, 255); background-color: rgb(0,128,0)'
                                                    : ''}"
                                                on:click={() => {
                                                    onQuestionAnswered(answer);
                                                }}
                                            />
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}
                {#if displayCorrect}
                    <div
                        class="quiz-next-button arrow-ltr flex justify-center items-center"
                        style="cursor: pointer;"
                    >
                        <button
                            class=""
                            on:click={() => {
                                onNextQuestion();
                            }}
                        >
                            <div>{'quiz-next-button'}</div>
                        </button>
                    </div>
                {/if}
            </div>
        </body>
    {/if}
</div>
