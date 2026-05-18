<script lang="ts" module>
    function getRandomItem<T>(array: T[]) {
        return array[Math.floor(Math.random() * array.length)];
    }

    function shuffle<T>(array: T[]) {
        let currentIndex = array.length;
        let randomIndex = 0;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }

        return array;
    }
</script>

<script lang="ts">
    import { beforeNavigate } from '$app/navigation';
    import { scriptureConfig } from '$assets/config';
    import type { QuizAnswer, QuizQuestion } from '$config';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { addQuiz } from '$lib/data/quiz';
    import {
        bodyFontSize,
        bodyLineHeight,
        modal,
        ModalType,
        quizAudioActive,
        t
    } from '$lib/data/stores';
    import { refs } from '$lib/data/stores/scripture';
    import { ArrowForwardIcon, AudioIcon, TextAppearanceIcon } from '$lib/icons';
    import { compareVersions } from '$lib/scripts/stringUtils';
    import { onDestroy } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import type { PageData } from './$types.js';

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

    let { locked, quiz, quizId, displayLabel, passScore, collection } = $derived(data);

    let highlightIdx = $state(-1);
    let score = $state(0);
    let currentQuestionIdx = $state(0);

    let saved = $state(false);
    let clicked = $state(false);
    let showCorrectAnswer = $state(false);

    let currentAudio: HTMLAudioElement | null = null;

    let explanation = $state('');

    const book = $derived(
        scriptureConfig.bookCollections
            ?.find((x) => x.id === $refs.collection)
            ?.books.find((x) => x.id === quizId)
    );
    const questions: QuizQuestion[] = $derived(
        book?.quizFeatures?.['shuffle-questions']
            ? shuffle([...(quiz?.questions ?? [])])
            : [...(quiz?.questions ?? [])]
    );
    const currentQuestion: QuizQuestion | undefined = $derived(questions[currentQuestionIdx]);
    const shuffledAnswers: QuizAnswer[] = $derived(
        shuffle(currentQuestion?.answers.map((a) => ({ ...a, clicked: false })) ?? [])
    );

    const staticAssets = compareVersions(scriptureConfig.programVersion, '12.0') < 0;
    function getQuizAssetAudio(file: string) {
        return staticAssets ? 'assets/' + file : quizAssets[`./${file}`].replace(/^\//, '');
    }

    function playSound(path: string, onended: null | (() => void) = null) {
        stopAudioPlayback();
        currentAudio = new Audio(path);
        currentAudio.onended = onended;
        currentAudio.play();
    }

    function stopAudioPlayback() {
        try {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }
        } catch {
            // swallow play interrupt error
        }
    }

    function getImageSource(image: string) {
        return illustrations[`./${data.collection}-${quiz?.id}-${image}`] ?? '';
    }

    function getCommentary(score: number) {
        return (
            quiz?.commentary?.find(
                (c) => score >= c.rangeMin && (!c.rangeMax || score <= c.rangeMax)
            )?.message ?? ''
        );
    }

    function nextQuestion() {
        clearQuestion();
        currentQuestionIdx++;
        startQuestionAudio();
    }

    function clearQuestion() {
        clicked = false;
        showCorrectAnswer = false;
        explanation = '';
    }

    function reset() {
        stopAudioPlayback();
        clearQuestion();
        score = 0;
        saved = false;
        currentQuestionIdx = 0;
    }

    function getAnswerAudio(correct: boolean) {
        const key = correct ? 'rightAnswerAudio' : 'wrongAnswerAudio';
        return quiz?.[key]?.length
            ? clips[`./${getRandomItem(quiz[key])}`]
            : getQuizAssetAudio(correct ? 'quiz-right-answer.mp3' : 'quiz-wrong-answer.mp3');
    }

    function answerQuestion(answer: QuizAnswer) {
        highlightIdx = -1;
        if (!clicked) {
            const answerAudio = getAnswerAudio(answer.correct);
            const currentIndex = currentQuestionIdx;
            playSound(answerAudio, () => {
                if (!answer.correct) {
                    const e = answer.explanation || currentQuestion?.explanation;
                    if (e?.text && currentIndex === currentQuestionIdx) {
                        explanation = e.text;
                        if (e.audio) {
                            playSound(clips[`./${e.audio}`]);
                        }
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
                    showCorrectAnswer = true;
                } else {
                    setTimeout(() => {
                        showCorrectAnswer = true;
                    }, 1000);
                }
            }, 0);
        }
    }

    function startQuestionAudio() {
        if ($quizAudioActive) {
            if (currentQuestion) {
                if (currentQuestion.audio) {
                    const listener = () => {
                        playAnswerAudio(0);
                    };
                    playSound(clips[`./${currentQuestion.audio}`], listener);
                } else {
                    playAnswerAudio(0);
                }
            }
        }
    }

    function playAnswerAudio(answerIndex: number) {
        if (currentQuestion && $quizAudioActive) {
            if (answerIndex < shuffledAnswers.length) {
                const answer = shuffledAnswers[answerIndex];
                if (answer.audio) {
                    const listener = () => {
                        highlightIdx = -1;
                        playAnswerAudio(answerIndex + 1);
                    };
                    highlightIdx = answerIndex;
                    playSound(clips[`./${answer.audio}`], listener);
                }
            } else {
                highlightIdx = -1;
            }
        }
    }

    beforeNavigate(() => {
        reset();
    });

    onDestroy(() => {
        stopAudioPlayback();
    });

    $effect(() => {
        if (quiz) {
            explanation = '';
            startQuestionAudio();
        } else {
            reset();
        }
    });
</script>

<div class="grid grid-rows-[auto,1fr] h-screen overflow-y-auto" style:font-size="{$bodyFontSize}px">
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
                        onclick={() => modal.open(ModalType.TextAppearance)}
                    >
                        <TextAppearanceIcon color="white" />
                    </label>
                </div>
            {/snippet}
        </Navbar>
    </div>

    {#if locked}
        <div class="quiz-locked">
            <div class="quiz-locked-title">{quizId}</div>
            <div class="quiz-locked-message">
                {$t['Quiz_Access_After_Message']}
            </div>
            <div class="quiz-locked-name">{data.dependentQuizName || data.dependentQuizId}</div>
        </div>
    {:else if currentQuestionIdx === questions.length}
        <div class="score">
            <div id="content" class="text-center">
                <div class="quiz-score-before">{$t['Quiz_Score_Page_Message_Before']}</div>
                <div class="quiz-score-block">
                    <span class="quiz-score">{score}</span>
                </div>
                <div class="quiz-score-after">
                    {$t['Quiz_Score_Page_Message_After'].replace('%n%', String(currentQuestionIdx))}
                </div>
                <div class="quiz-score-commentary">
                    {getCommentary(score)}
                </div>
            </div>
        </div>
        {#if !saved}
            {@const pass = score >= passScore}
            {#await addQuiz( { collection, book: quizId, score, passScore, pass } ).then(() => (saved = true)) then _}
                <p>Quiz result saved!</p>
            {:catch error}
                <p>Error saving quiz result: {error.message}</p>
            {/await}
        {/if}
    {:else}
        <div class="quiz">
            <div id="content">
                <div class="quiz-question-number" style:line-height="{$bodyLineHeight}%">
                    {currentQuestionIdx + 1}
                </div>
                {#if currentQuestion?.answers}
                    {@const imgFormat = currentQuestion.answers.some((answer) => answer.image)}
                    {@const cols = currentQuestion.columns ?? (imgFormat ? 2 : 1)}
                    <div class="quiz-question-block">
                        <div class="quiz-question" style:line-height="{$bodyLineHeight}%">
                            {currentQuestion.text}
                            {#if currentQuestion.image && !imgFormat}
                                <!-- svelte-ignore a11y_missing_attribute -->
                                <img
                                    class="quiz-question-image h-40"
                                    src={getImageSource(currentQuestion.image)}
                                />
                            {/if}
                        </div>
                        <div class={[imgFormat ? 'flex justify-center' : 'quiz-answer-block']}>
                            <div class="grid grid-cols-{cols} gap-2 justify-items-center">
                                {#each shuffledAnswers as answer, currentIndex}
                                    {@const classes: ClassValue = [
                                        clicked && answer.correct && (answer.clicked || showCorrectAnswer) && 'correct', 
                                        clicked && answer.clicked && !answer.correct && 'wrong', 
                                        highlightIdx === currentIndex && 'highlight']}
                                    <button
                                        class={[
                                            imgFormat
                                                ? 'w-full flex justify-center p-[4%]'
                                                : 'w-5/6 md:w-64 lg:w-[20rem] mt-2',
                                            imgFormat && classes
                                        ]}
                                        onclick={() => {
                                            answerQuestion(answer);
                                        }}
                                    >
                                        {@render (imgFormat ? imgAnswer : textAnswer)(
                                            answer,
                                            classes
                                        )}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    </div>
                    {#if explanation}
                        <div class="quiz-answer-explanation mt-4">
                            {explanation}
                        </div>
                    {/if}
                {/if}
                {#if showCorrectAnswer}
                    <div class="flex justify-center items-center">
                        <button
                            class="dy-btn dy-btn-active p-2 px-8 mt-4"
                            onclick={() => {
                                nextQuestion();
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

{#snippet textAnswer(answer: QuizAnswer, classes: ClassValue)}
    <div class={['quiz-answer', classes]}>
        {answer.text}
    </div>
{/snippet}

{#snippet imgAnswer(answer: QuizAnswer, _classes: ClassValue)}
    <img src={getImageSource(answer.image ?? '')} alt={answer.text} />
{/snippet}

<style>
    .wrong {
        color: var(--QuizWrongAnswerTextColor);
        background-color: var(--QuizWrongAnswerBackgroundColor);
    }
    .correct {
        color: var(--QuizRightAnswerTextColor);
        background-color: var(--QuizRightAnswerBackgroundColor);
    }
    .highlight {
        color: var(--QuizAnswerTextColor);
        background-color: var(--QuizAnswerHighlightBackgroundColor);
    }
    .quiz-question-block img {
        max-width: 100%;
        max-height: 250px;
    }
</style>
