<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { base } from '$app/paths';
    import { page } from '$app/stores';

    /** @type {import('./$types').PageData} */
    export let dataQuiz;

    let score = 0;

    // Remaining code stays the same...
</script>

<div class="grid grid-rows-[auto,1fr] h-screen">
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
    <body class="quiz">
        <div id="content">
            <div class="quiz-question-number">1</div>
            <div class="quiz-question-block">
                <div class="quiz-question">QUESTION GOES HERE</div>
            </div>
            <table class="quiz-answer-block w-full">
                <tr>
                    <td class="flex justify-center items-center">
                        <!-- Apply centering style -->
                        <button
                            class="quiz-answer-button w-full"
                            on:click={() => (window.location.href = 'Q-ANSWER-0')}
                        >
                            <div class="quiz-answer">ANSWER 1</div>
                        </button>
                    </td>
                </tr>
                <tr>
                    <td class="flex justify-center items-center">
                        <!-- Apply centering style -->
                        <button
                            class="quiz-answer-button w-full"
                            on:click={() => (window.location.href = 'Q-ANSWER-1')}
                        >
                            <div class="quiz-answer">ANSWER 2</div>
                        </button>
                    </td>
                </tr>
                <tr>
                    <td class="flex justify-center items-center">
                        <!-- Apply centering style -->
                        <button
                            class="quiz-answer-button w-full"
                            on:click={() => (window.location.href = 'Q-ANSWER-2')}
                        >
                            <div class="quiz-answer">ANSWER 3</div>
                        </button>
                    </td>
                </tr>
                <tr>
                    <td class="flex justify-center items-center">
                        <!-- Apply centering style -->
                        <button
                            class="quiz-answer-button w-full"
                            on:click={() => (window.location.href = 'Q-ANSWER-3')}
                        >
                            <div class="quiz-answer">ANSWER 4</div>
                        </button>
                    </td>
                </tr>
            </table>
            <div
                class="quiz-next-button arrow-ltr hidden"
                id="next-button"
                onClick="window.location.href = 'Q-NEXT'"
            ></div>
        </div>
    </body>
</div>
