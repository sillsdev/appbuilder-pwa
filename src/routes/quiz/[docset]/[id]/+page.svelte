<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, language } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { base } from '$app/paths';
    import { page } from '$app/stores';

    let quizData;

    async () => {
        const response = await fetch('app/src/routes/quiz/quiz.json');
        quizData = await response.json();
    };

    let score = 0;

    // Remaining code stays the same...
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="dropdown" slot="books">
                <!-- CHECK ABOVE!!!! -->
                <div class="btn btn-rectangel normal-case text-xl">{$t['Menu_Book_Quizzes']}</div>
                <!-- CHECK ABOVE!!!! -->
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>
    <div>
        {#if quizData}
            <h1>{quizData.name}</h1>
            {#each quizData.questions as question, questionIndex}
                <div>
                    <p>{question.qu.text}</p>
                    {#if question.qu.image}
                        <img src={question.qu.image} alt="Question Image" />
                    {/if}
                    <div>
                        {#each question.answers as answer, answerIndex}
                            <button
                                on:click={() => answerSelected(questionIndex, answerIndex)}
                                style="margin-right: 10px;"
                            >
                                {answer.ar ? answer.ar : answer.aw}
                            </button>
                        {/each}
                    </div>
                </div>
            {/each}
            <button on:click={() => alert(`Your score: ${score}/${quizData.questions.length}`)}
                >Submit</button
            >
        {/if}
    </div>
</div>
