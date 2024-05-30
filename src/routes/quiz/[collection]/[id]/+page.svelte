<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { base } from '$app/paths';

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
</script>

<div class="grid grid-rows-[auto,1fr] h-screen">
    <div class="navbar">
        <Navbar>
            <label for="Quiz" slot="center">
                <div class="btn btn-rectangel normal-case text-xl">{'Quiz'}</div>
            </label>
        </Navbar>
    </div>
    {#if questionNum == data.quiz.questions.length}
        <body class="score">
            <div id="content">
                <div class="quiz-score-before">You scored</div>
                <div class="quiz-score-block">
                    <span class="quiz-score">{score}</span>
                </div>
                <div class="quiz-score-after">
                    out of {questionNum} questions.
                </div>
                {#if score == data.quiz.passScore || score > data.quiz.passScore}
                    <div class="flex justify-center mt-50">You pass!</div>
                {:else if score < data.quiz.passScore}
                    <div class="flex justify-center mt-50">Oh, dear!</div>
                {/if}
            </div>
        </body>
    {:else}
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
                                                        setTimeout(() => {
                                                            questionNum++;
                                                        }, 1000);
                                                        answer.clicked = true;
                                                    }}
                                                >
                                                    <div
                                                        class="quiz-answer flex justify-center items-center"
                                                        style="{answer.clicked && !answer.correct
                                                            ? 'color: rgb(255, 255, 255); background-color: rgb(128,0,0)'
                                                            : ''} {answer.clicked && answer.correct
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
                                    {#each pairAnswers(shuffleAnswers(data.quiz.questions[questionNum].answers)) as [answer1, answer2]}
                                        <tr>
                                            <td width="50%" style="padding:2%;">
                                                <img
                                                    class="flex-initial w-[32rem] mt-2 gap-8"
                                                    src={answer1.image}
                                                    alt={answer1.text}
                                                    style="cursor:pointer; {answer1.clicked &&
                                                    !answer1.correct
                                                        ? 'background-color: red;'
                                                        : ''} {answer1.clicked && answer1.correct
                                                        ? 'background-color: green;'
                                                        : ''}"
                                                    on:click={() => {
                                                        const audioPath = answer1.correct
                                                            ? `${base}/clips/quiz-right-answer.mp3`
                                                            : `${base}/clips/quiz-wrong-answer.mp3`;
                                                        playSound(audioPath);
                                                        if (answer1.correct) {
                                                            score++;
                                                        }
                                                        setTimeout(() => {
                                                            questionNum++;
                                                        }, 1000);
                                                        answer1.clicked = true;
                                                    }}
                                                />
                                            </td>
                                            {#if answer2}
                                                <td width="50%" style="padding:2%;">
                                                    <img
                                                        class="flex-initial w-[32rem] mt-2 gap-8"
                                                        src={answer2.image}
                                                        alt={answer2.text}
                                                        style="cursor:pointer; {answer2.clicked &&
                                                        !answer2.correct
                                                            ? 'background-color: red;'
                                                            : ''} {answer2.clicked &&
                                                        answer2.correct
                                                            ? 'background-color: green;'
                                                            : ''}"
                                                        on:click={() => {
                                                            const audioPath = answer2.correct
                                                                ? `${base}/clips/quiz-right-answer.mp3`
                                                                : `${base}/clips/quiz-wrong-answer.mp3`;
                                                            playSound(audioPath);
                                                            if (answer2.correct) {
                                                                score++;
                                                            }
                                                            setTimeout(() => {
                                                                questionNum++;
                                                            }, 1000);
                                                            answer2.clicked = true;
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
                <!-- Ask about the next arrow below. Quiz-next-button doesn't exist in the sab-app.css -->
                {#if data.quiz.questions[questionNum].answers.clicked}
                    <div class="quiz-next-button arrow-ltr" style="cursor: pointer;"></div>
                {/if}
            </div>
        </body>
    {/if}
</div>
