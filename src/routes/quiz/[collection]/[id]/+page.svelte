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
    let pairs = [];
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
    function pairAnswers(answers) {
        const pairs = [];
        for (let i = 0; i < answers.length; i += 2) {
            pairs.push([answers[i], answers[i + 1]]);
        }
        return pairs;
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
            pairs = [];
        } else {
            for (const answer of quiz.questions[questionNum].answers) {
                answer.clicked = false;
            }
            shuffledAnswers = shuffleAnswers(quiz.questions[questionNum].answers);
            pairs = pairAnswers(shuffledAnswers);
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
        <body class="score">
            <div id="content">
                <div class="quiz-score-before">You scored</div>
                <div class="quiz-score-block">
                    <span class="quiz-score">{score}</span>
                </div>
                <div class="quiz-score-after">
                    out of {questionNum} questions.
                </div>
                {#if score == quiz.passScore || score > quiz.passScore}
                    <div class="flex justify-center mt-50">You pass!</div>
                {:else if score < quiz.passScore}
                    <div class="flex justify-center mt-50">Oh, dear!</div>
                {/if}
            </div>
        </body>
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
                                    <img
                                        class="display: block; flex-initial w-[32rem] ml-2 gap-8"
                                        src={getImageSource(quiz.questions[questionNum].image)}
                                        alt={quiz.questions[questionNum].text}
                                    />
                                {/if}
                            </div>
                            <div class="flex quiz-answer-block justify-center">
                                <table class="mt-10">
                                    {#each shuffledAnswers as answer}
                                        <tr>
                                            <td>
                                                <button
                                                    class="flex-initial w-[32rem] mt-2 gap-8}"
                                                    on:click={() => {
                                                        onQuestionAnswered(answer);
                                                    }}
                                                >
                                                    <div
                                                        class="quiz-answer flex justify-center items-center"
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
                                {#if quiz.questions[questionNum].image}
                                    {quiz.questions[questionNum].image}
                                {/if}
                            </div>
                            <div class="flex quiz-answer-block justify-center">
                                <table class="mt-10">
                                    {#each pairs as [answer1, answer2]}
                                        <tr>
                                            <td width="50%" style="padding:2%;">
                                                <img
                                                    class="display: block; flex-initial w-[32rem] ml-2 gap-8"
                                                    src={getImageSource(answer1.image)}
                                                    alt={answer1.text}
                                                    style="cursor:pointer; {clicked &&
                                                    answer1.clicked &&
                                                    !answer1.correct
                                                        ? 'background-color: red;'
                                                        : ''} {clicked &&
                                                    answer1.clicked &&
                                                    answer1.correct
                                                        ? 'background-color: green;'
                                                        : ''}"
                                                    on:click={() => {
                                                        onQuestionAnswered(answer1);
                                                    }}
                                                />
                                            </td>
                                            {#if answer2}
                                                <td width="50%" style="padding:2%;">
                                                    <img
                                                        class="display: block; flex-initial w-[32rem] ml-2 gap-8"
                                                        src={getImageSource(answer2.image)}
                                                        alt={answer2.text}
                                                        style="cursor:pointer; {answer2.clicked &&
                                                        !answer2.correct
                                                            ? 'background-color: rgb(128,0,0);'
                                                            : ''} {answer2.clicked &&
                                                        answer2.correct
                                                            ? 'background-color: rgb(0,128,0);'
                                                            : ''}"
                                                        on:click={() => {
                                                            onQuestionAnswered(answer2);
                                                        }}
                                                    />
                                                </td>
                                            {/if}
                                        </tr>
                                    {/each}
                                </table>
                            </div>
                        </div>
                    {/if}
                {/if}
                {#if displayCorrect}
                    <div class="quiz-next-button arrow-ltr" style="cursor: pointer;">
                        <button
                            class="flex-initial w-[32rem] mt-2 gap-8}"
                            on:click={() => {
                                onNextQuestion();
                            }}
                        >
                            <div>Next</div>
                        </button>
                    </div>
                {/if}
            </div>
        </body>
    {/if}
</div>
