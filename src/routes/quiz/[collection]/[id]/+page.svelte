<script lang="ts">
    import { beforeNavigate } from '$app/navigation';
    import { base } from '$app/paths';
    import type { Quiz, QuizAnswer, QuizQuestion, ScriptureConfig } from '$config';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { addQuiz } from '$lib/data/quiz';
    import {
        bodyFontSize,
        bodyLineHeight,
        modal,
        MODAL_TEXT_APPEARANCE,
        quizAudioActive,
        t
    } from '$lib/data/stores';
    import { refs } from '$lib/data/stores/scripture';
    import { ArrowForwardIcon, AudioIcon, TextAppearanceIcon } from '$lib/icons';
    import { compareVersions } from '$lib/scripts/stringUtils';
    import { onDestroy } from 'svelte';
    import type { PageData } from './$types.js';

    const scriptConfig: ScriptureConfig = config;

    const illustrations: Record<string, string> = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/illustrations'
    });

    const clips: Record<string, string> = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/clips'
    });

    const quizAssets: Record<string, string> = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/quiz'
    });

    interface Props {
        data: PageData;
    }
    let { data }: Props = $props();

    let textHighlightIndex = $state(-1);
    let quizSaved = $state(false);
    let shuffledAnswers: QuizAnswer[] = $state([]);
    let quizQuestions: QuizQuestion[] = $state([]);
    let score = $state(0);
    let questionNum = $state(0);
    let currentQuizQuestion: QuizQuestion | undefined = $state();
    let clicked = $state(false);
    let displayCorrect = $state(false);
    let currentQuestionAudio: HTMLAudioElement | null = null;
    let currentAnswerAudio: HTMLAudioElement | null = null;
    let currentExplanationAudio: HTMLAudioElement | null = null;
    let explanation = $state('');
    let commentaryMessage = '';

    const staticAssets = compareVersions(config.programVersion, '12.0') < 0;

    function getQuizAssetAudio(file: string) {
        return staticAssets ? 'assets/' + file : quizAssets[`./${file}`].replace(/^\//, '');
    }

    function getRandomAudio(audioArray: string[]) {
        const randomIndex = Math.floor(Math.random() * audioArray.length);
        return audioArray[randomIndex];
    }

    function playSound(path: string, callback: null | (() => void), type = 'answer') {
        let audio = new Audio();
        if (type === 'question') {
            currentQuestionAudio = audio;
        }
        if (type === 'answer') {
            currentAnswerAudio = audio;
        }
        if (type === 'explanation') {
            currentExplanationAudio = audio;
        }

        audio.src = path;
        audio.onended = function () {
            callback?.();
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

    function getImageSource(image: string) {
        return illustrations[`./${data.collection}-${quiz?.id}-${image}`] ?? '';
    }

    function shuffleAnswers(answerArray: QuizAnswer[]) {
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

    function shuffleArray<T>(array: T[]) {
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

    function getCommentary(score: number) {
        let result = '';
        for (const commentary of quiz?.commentary ?? []) {
            if (
                score >= commentary.rangeMin &&
                (!commentary.rangeMax || score <= commentary.rangeMax)
            ) {
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
        score = 0;
        quizQuestions = [];
        quizSaved = false;
        questionNum = 0;
    }

    function getAnswerAudio(quiz: Quiz | null, correct: boolean) {
        let sound;
        if (correct) {
            sound = quiz?.rightAnswerAudio
                ? clips[`./${getRandomAudio(quiz.rightAnswerAudio)}`]
                : getQuizAssetAudio('quiz-right-answer.mp3');
        } else {
            sound = quiz?.wrongAnswerAudio
                ? clips[`./${getRandomAudio(quiz.wrongAnswerAudio)}`]
                : getQuizAssetAudio('quiz-wrong-answer.mp3');
        }
        return sound;
    }

    function onQuestionAnswered(answer: QuizAnswer) {
        textHighlightIndex = -1;
        stopAudioPlayback();
        if (!clicked) {
            const answerAudio = getAnswerAudio(quiz, answer.correct);
            const audioPath = `${base}/${answerAudio}`;
            playSound(audioPath, () => {
                if (!answer.correct && answer.explanation && answer.explanation.text) {
                    explanation = answer.explanation.text;
                    if (answer.explanation.audio) {
                        playSound(clips[`./${answer.explanation.audio}`], null, 'explanation');
                    }
                } else if (!answer.correct && currentQuizQuestion?.explanation?.text) {
                    explanation = currentQuizQuestion.explanation.text;
                    if (currentQuizQuestion.explanation.audio) {
                        playSound(
                            clips[`./${currentQuizQuestion.explanation.audio}`],
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
                    playSound(clips[`./${question.audio}`], listener, 'question');
                } else {
                    playQuizAnswerAudio(0);
                }
            }
        }
    }

    function playQuizAnswerAudio(answerIndex: number) {
        if (currentQuizQuestion && $quizAudioActive) {
            if (answerIndex < currentQuizQuestion.answers.length) {
                const answer = currentQuizQuestion.answers[answerIndex];
                if (answer.audio) {
                    const listener = () => {
                        textHighlightIndex = -1;
                        playQuizAnswerAudio(answerIndex + 1);
                    };
                    textHighlightIndex = answerIndex;
                    playSound(clips[`./${answer.audio}`], listener, 'answer');
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
    let { locked, quiz, quizId, quizName, passScore } = $derived(data);
    let book = $derived(
        scriptConfig.bookCollections
            ?.find((x) => x.id === $refs.collection)
            ?.books.find((x) => x.id === quizId)
    );
    let displayLabel = $derived(quizName || 'Quiz');
    $effect(() => {
        resetQuizState();
        if (quiz) {
            quizQuestions = book?.quizFeatures?.['shuffle-questions']
                ? shuffleArray([...quiz.questions])
                : [...quiz.questions];
            handleQuestionChange();
            playQuizQuestionAudio();
        } else {
            stopAudioPlayback();
        }
    });
</script>

<div class="grid grid-rows-[auto,1fr] h-screen" style:font-size="{$bodyFontSize}px">
    <div class="navbar">
        <Navbar>
            {#snippet start()}
                <BookSelector {displayLabel} />
            {/snippet}
            {#snippet end()}
                <div class="flex items-center">
                    <div class="flex">
                        <button
                            class="dy-btn dy-btn-ghost dy-btn-circle"
                            onclick={() => {
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
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <label
                        class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"
                        onclick={() => modal.open(MODAL_TEXT_APPEARANCE)}
                    >
                        <TextAppearanceIcon color="white" />
                    </label>
                </div>
            {/snippet}
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
            {#await addQuiz( { collection: data.collection, book: quizId, score, passScore, pass } ) then _}
                <p>Quiz result saved!</p>
            {:catch error}
                <p>Error saving quiz result: {error.message}</p>
            {/await}
        {/if}
    {:else}
        <div class="quiz">
            <div id="content">
                <div class="quiz-question-number" style:line-height="{$bodyLineHeight}%">
                    {questionNum + 1}
                </div>
                {#if currentQuizQuestion?.answers}
                    {#if currentQuizQuestion.answers.some((answer) => answer.text)}
                        <div class="quiz-question-block">
                            <div class="quiz-question" style:line-height="{$bodyLineHeight}%">
                                {currentQuizQuestion.text}
                                {#if currentQuizQuestion.image}
                                    <!-- svelte-ignore a11y_missing_attribute -->
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
                                            onclick={() => {
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
                    {#if currentQuizQuestion?.answers.some((answer) => answer.image)}
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
                                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                                            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                                            <img
                                                class="cursor-pointer"
                                                src={getImageSource(answer.image ?? '')}
                                                alt={answer.text}
                                                onclick={() => {
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
                            onclick={() => {
                                onNextQuestion();
                            }}
                        >
                            <ArrowForwardIcon />
                        </button>
                    </div>
                {/if}
            </div>
        </div>
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
