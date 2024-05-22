<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, language } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { base } from '$app/paths';
    import { page } from '$app/stores';

    /** @type {import('./$types').PageData} */
    export let dataQuiz;

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
    <body class="quiz">
        <div id="content">
            <div class="quiz-question-number">1</div>
            <div class="quiz-question-block">
                <div class="quiz-question">Who was the father of Jacob?</div>
            </div>
            <table class="quiz-answer-block" width="100%">
                <tr>
                    <td width="100%">
                        <div
                            class="quiz-answer"
                            id="answer-0"
                            onClick="window.location.href = 'Q-ANSWER-0'"
                        >
                            Abraham
                        </div>
                    </td>
                </tr>
                <tr>
                    <td width="100%">
                        <div
                            class="quiz-answer"
                            id="answer-1"
                            onClick="window.location.href = 'Q-ANSWER-1'"
                        >
                            Isaac
                        </div>
                    </td>
                </tr>
                <tr>
                    <td width="100%">
                        <div
                            class="quiz-answer"
                            id="answer-2"
                            onClick="window.location.href = 'Q-ANSWER-2'"
                        >
                            Joseph
                        </div>
                    </td>
                </tr>
                <tr>
                    <td width="100%">
                        <div
                            class="quiz-answer"
                            id="answer-3"
                            onClick="window.location.href = 'Q-ANSWER-3'"
                        >
                            Esau
                        </div>
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
