<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { addQuiz } from '$lib/data/quiz';
    import {
        refs,
        t,
        bodyFontSize,
        bodyLineHeight,
        modal,
        MODAL_TEXT_APPERANCE,
        quizAudioActive
    } from '$lib/data/stores';
    import { compareVersions } from '$lib/scripts/stringUtils';
    import { base } from '$app/paths';
    import { onDestroy } from 'svelte';
    import { beforeNavigate } from '$app/navigation';
    import { ArrowForwardIcon, AudioIcon, TextAppearanceIcon } from '$lib/icons';
    import BookSelector from '$lib/components/BookSelector.svelte';
    /** @type {import('./$types').PageData} */
    export let data;

    $: ({ locked, quiz, quizId, quizName, passScore } = data);

    $: book = config.bookCollections
        .find((x) => x.id === $refs.collection)
        .books.find((x) => x.id === quizId);

    $: displayLabel = quizName || 'Quiz';

    $: if (quiz) {
        resetQuizState();

        score = 0;
        questionNum = 0;
        shuffledAnswers = [];
        quizQuestions = book.quizFeatures['shuffle-questions']
            ? shuffleArray([...quiz.questions])
            : [...quiz.questions];
        handleQuestionChange();
        playQuizQuestionAudio();
        quizSaved = false;
    } else {
        stopAudioPlayback();

        score = 0;
        questionNum = 0;
        shuffledAnswers = [];
        quizQuestions = [];
        quizSaved = false;
    }

    let textHighlightIndex = -1;
    let quizSaved = false;
    let shuffledAnswers = [];
    let quizQuestions = [];
    let score = 0;
    let questionNum = 0;
    let currentQuizQuestion;
    let clicked = false;
    let displayCorrect = false;
    let currentQuestionAudio = null;
    let currentAnswerAudio = null;
    let currentExplanationAudio = null;
    let explanation = '';
    let commentaryMessage = '';

    const quizAssetFolder = compareVersions(config.programVersion, '12.0') < 0 ? 'assets' : 'quiz';

    function getRandomAudio(audioArray) {
        const randomIndex = Math.floor(Math.random() * audioArray.length);
        return audioArray[randomIndex];
    }

    function playSound(path, callback, type = 'answer') {
        let audio = new Audio();
        if (type === 'question') currentQuestionAudio = audio;
        if (type === 'answer') currentAnswerAudio = audio;
        if (type === 'explanation') currentExplanationAudio = audio;

        audio.src = path;
        audio.onended = function () {
            if (callback) {
                callback();
            }
        };
        audio.play();
    }

    beforeNavigate(() => {
        stopAudioPlayback();
        resetQuizState();
    });

    function stopCurrentQuestionAudio() {
        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio.currentTime = 0;
            currentQuestionAudio = null;
        }
    }

    function stopCurrentAnswerAudio() {
        if (currentAnswerAudio) {
            currentAnswerAudio.pause();
            currentAnswerAudio.currentTime = 0;
            currentAnswerAudio = null;
        }
    }

    function stopCurrentExplanationAudio() {
        if (currentExplanationAudio) {
            currentExplanationAudio.pause();
            currentExplanationAudio.currentTime = 0;
            currentExplanationAudio = null;
        }
    }

    function stopAudioPlayback() {
        stopCurrentQuestionAudio();
        stopCurrentAnswerAudio();
        stopCurrentExplanationAudio();
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

    function shuffleArray(array) {
        let currentIndex = array.length,
            randomIndex;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    function handleQuestionChange() {
        explanation = '';
        if (questionNum == quizQuestions.length) {
            shuffledAnswers = [];
            commentaryMessage = getCommentary(score);
        } else {
            currentQuizQuestion = quizQuestions[questionNum];
            for (const answer of currentQuizQuestion.answers) {
                answer.clicked = false;
            }
            shuffledAnswers = shuffleAnswers(currentQuizQuestion.answers);
        }
    }

    function getCommentary(score) {
        let result = '';
        for (const commentary of quiz.commentary) {
            if (score >= commentary.rangeMin && score <= commentary.rangeMax) {
                result = commentary.message;
                break;
            }
        }
        return result;
    }

    function onNextQuestion() {
        stopAudioPlayback();
        questionNum++;
        clicked = false;
        displayCorrect = false;
        handleQuestionChange();
        playQuizQuestionAudio();
    }

    function resetQuizState() {
        clicked = false;
        displayCorrect = false;
        shuffledAnswers = [];
        explanation = '';
    }

    function getAnswerAudio(quiz, correct) {
        let sound;
        if (correct) {
            sound = quiz.rightAnswerAudio
                ? 'clips/' + getRandomAudio(quiz.rightAnswerAudio)
                : quizAssetFolder + '/quiz-right-answer.mp3';
        } else {
            sound = quiz.wrongAnswerAudio
                ? 'clips/' + getRandomAudio(quiz.wrongAnswerAudio)
                : quizAssetFolder + '/quiz-wrong-answer.mp3';
        }
        return sound;
    }

    function onQuestionAnswered(answer) {
        textHighlightIndex = -1;
        stopAudioPlayback();
        if (!clicked) {
            const answerAudio = getAnswerAudio(quiz, answer.correct);
            const audioPath = `${base}/${answerAudio}`;
            playSound(audioPath, () => {
                if (!answer.correct && answer.explanation && answer.explanation.text) {
                    explanation = answer.explanation.text;
                    if (answer.explanation.audio) {
                        playSound(`${base}/clips/${answer.explanation.audio}`, null, 'explanation');
                    }
                } else if (
                    !answer.correct &&
                    currentQuizQuestion.explanation &&
                    currentQuizQuestion.explanation.text
                ) {
                    explanation = currentQuizQuestion.explanation.text;
                    if (currentQuizQuestion.explanation.audio) {
                        playSound(
                            `${base}/clips/${currentQuizQuestion.explanation.audio}`,
                            null,
                            'explanation'
                        );
                    }
                }
            });
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
            }, 0);
        }
    }

    function playQuizQuestionAudio() {
        if ($quizAudioActive) {
            const question = getCurrentQuizQuestion();
            if (question) {
                if (question.audio) {
                    const listener = () => {
                        playQuizAnswerAudio(0);
                    };
                    playSound(`${base}/clips/${question.audio}`, listener, 'question');
                } else {
                    playQuizAnswerAudio(0);
                }
            }
        }
    }

    function playQuizAnswerAudio(answerIndex) {
        if (currentQuizQuestion && $quizAudioActive) {
            if (answerIndex < currentQuizQuestion.answers.length) {
                const answer = currentQuizQuestion.answers[answerIndex];
                if (answer.audio) {
                    const listener = () => {
                        textHighlightIndex = -1;
                        playQuizAnswerAudio(answerIndex + 1);
                    };
                    textHighlightIndex = answerIndex;
                    playSound(`${base}/clips/${answer.audio}`, listener, 'answer');
                }
            } else {
                textHighlightIndex = -1;
            }
        }
    }

    function getCurrentQuizQuestion() {
        return quizQuestions[questionNum];
    }

    onDestroy(() => {
        stopAudioPlayback();
    });
</script>

<div class="grid grid-rows-[auto,1fr] h-screen" style:font-size="{$bodyFontSize}px">
    <div class="navbar">
        <Navbar>
            <div slot="left-buttons">
                <BookSelector {displayLabel} />
            </div>
            <div slot="right-buttons" class="flex items-center">
                <div class="flex">
                    <button
                        class="dy-btn dy-btn-ghost dy-btn-circle"
                        on:click={() => {
                            $quizAudioActive = !$quizAudioActive;
                        }}
                    >
                        {#if $quizAudioActive}
                            <AudioIcon.Volume color="white" />
                        {:else}
                            <AudioIcon.Mute color="white" />
                        {/if}
                    </button>
                </div>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <label
                    class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"
                    on:click={() => modal.open(MODAL_TEXT_APPERANCE)}
                >
                    <TextAppearanceIcon color="white" />
                </label>
            </div>
        </Navbar>
    </div>

    {#if locked}
        <div class="quiz-locked">
            <div class="quiz-locked-title">{data.quizId}</div>
            <div class="quiz-locked-message">
                Before accessing this quiz, you need to pass the following quiz:
            </div>
            <div class="quiz-locked-name">{data.dependentQuizName || data.dependentQuizId}</div>
        </div>
    {:else if questionNum == quizQuestions.length}
        <div class="score">
            <div id="content" class="text-center">
                <div class="quiz-score-before">{$t['Quiz_Score_Page_Message_Before']}</div>
                <div class="quiz-score-block">
                    <span class="quiz-score">{score}</span>
                </div>
                <div class="quiz-score-after">
                    {$t['Quiz_Score_Page_Message_After'].replace('%n%', questionNum)}
                </div>
                <div class="quiz-score-commentary">
                    {getCommentary(score)}
                </div>
            </div>
        </div>
        {#if !quizSaved}
            {@const pass = score >= passScore}
            {#await addQuiz( { collection: $refs.collection, book: quizId, score, passScore, pass } ) then _}
                <p>Quiz result saved!</p>
            {:catch error}
                <p>Error saving quiz result: {error.message}</p>
            {/await}
        {/if}
    {:else}
        <body class="quiz">
            <div id="content">
                <div class="quiz-question-number" style:line-height="{$bodyLineHeight}%">
                    {questionNum + 1}
                </div>
                {#if currentQuizQuestion.answers}
                    {#if currentQuizQuestion.answers.some((answer) => answer.text)}
                        <div class="quiz-question-block">
                            <div class="quiz-question" style:line-height="{$bodyLineHeight}%">
                                {currentQuizQuestion.text}
                                {#if currentQuizQuestion.image}
                                    <!-- svelte-ignore a11y-missing-attribute -->
                                    <img
                                        class="quiz-question-image h-40"
                                        src={getImageSource(currentQuizQuestion.image)}
                                    />
                                {/if}
                            </div>
                            <div class="quiz-answer-block">
                                <div
                                    class="grid grid-cols-{currentQuizQuestion.columns ??
                                        1} justify-items-center"
                                >
                                    {#each shuffledAnswers as answer, currentIndex}
                                        <button
                                            class="w-5/6 md:w-64 lg:w-[20rem] mt-2"
                                            on:click={() => {
                                                onQuestionAnswered(answer);
                                            }}
                                        >
                                            <div
                                                class="quiz-answer"
                                                class:textCorrectSelect={clicked &&
                                                    answer.correct &&
                                                    (answer.clicked || displayCorrect)}
                                                class:textWrongSelect={clicked &&
                                                    answer.clicked &&
                                                    !answer.correct}
                                                class:textHighlight={textHighlightIndex ===
                                                    currentIndex}
                                            >
                                                {answer.text}
                                            </div>
                                        </button>
                                    {/each}
                                </div>
                            </div>
                            {#if explanation}
                                <div class="quiz-answer-explanation mt-4">
                                    {explanation}
                                </div>
                            {/if}
                        </div>
                    {/if}
                    {#if currentQuizQuestion.answers.some((answer) => answer.image)}
                        <div class="quiz-question-block">
                            <div class="quiz-question">
                                {currentQuizQuestion.text}
                            </div>
                            <div class="flex justify-center">
                                <div
                                    class="grid grid-cols-{currentQuizQuestion.columns ?? 2} gap-2"
                                >
                                    {#each shuffledAnswers as answer, currentIndex}
                                        <div
                                            class="w-full flex justify-center p-[4%]"
                                            class:imageCorrectSelect={clicked &&
                                                answer.correct &&
                                                (answer.clicked || displayCorrect)}
                                            class:imageWrongSelect={clicked &&
                                                answer.clicked &&
                                                !answer.correct}
                                            class:textHighlight={textHighlightIndex ===
                                                currentIndex}
                                        >
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                                            <img
                                                class="cursor-pointer"
                                                src={getImageSource(answer.image)}
                                                alt={answer.text}
                                                on:click={() => {
                                                    onQuestionAnswered(answer);
                                                }}
                                            />
                                        </div>
                                    {/each}
                                </div>
                            </div>
                            {#if explanation}
                                <div class="quiz-answer-explanation mt-4">
                                    {explanation}
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/if}
                {#if displayCorrect}
                    <div
                        class="quiz-next-button arrow-ltr flex justify-center items-center"
                        style="cursor: pointer;"
                    >
                        <button
                            class="dy-btn dy-btn-active p-2 px-8 mt-4"
                            on:click={() => {
                                onNextQuestion();
                            }}
                        >
                            <ArrowForwardIcon />
                        </button>
                    </div>
                {/if}
            </div>
        </body>
    {/if}
</div>

<style>
    .imageWrongSelect {
        color: rgb(255, 255, 255);
        background-color: rgb(193, 27, 23);
    }
    .imageCorrectSelect {
        color: rgb(255, 255, 255);
        background-color: rgb(0, 128, 0);
    }
    .textWrongSelect {
        color: rgb(255, 255, 255);
        background-color: rgb(193, 27, 23);
    }
    .textCorrectSelect {
        color: rgb(255, 255, 255);
        background-color: rgb(0, 128, 0);
    }
    .textHighlight {
        color: rgb(0, 0, 0);
        background-color: rgb(212, 212, 238);
    }
    .quiz-question-block img {
        max-width: 100%;
        max-height: 250px;
    }
</style>
