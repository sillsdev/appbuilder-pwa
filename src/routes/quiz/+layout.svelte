<script>
<<<<<<< HEAD
    function changeAnswerColor(id, textColor, backgroundColor) {
        var el = document.getElementById(id);
        if (el) {
            el.style.color = textColor;
            el.style.backgroundColor = backgroundColor;
        }
    }

    function showNextButton() {
        var el = document.getElementById('next-button');
        if (el) {
            el.style.display = 'block';
        }
    }

    function showExplanation(text) {
        var el = document.getElementById('explanation');
        if (el) {
            el.style.display = 'block';
            el.innerHTML = text;
        }
    }
    function showExplanationAndNextButton(text) {
        showExplanation(text);
        showNextButton();
    }
    function addNumber(num) {
        const inputBox = document.getElementById('input-box');
        inputBox.value += num;
    }
    function backspaceInput() {
        var el = document.getElementById('input-box');
        var inputValue = el.value;
        var newValue = inputValue.slice(0, -1);
        el.value = newValue;
    }
    function unlock() {
        window.location.href = 'Q-UNLOCK-' + document.getElementById('input-box').value;
    }
</script>

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
<!-- <script>
=======
>>>>>>> b1bbc3e (Started a layout svelte page for layout of quiz GUI. May not be needed.)
    import { json } from 'appsrc\routesquiz';
    import {
        direction,
        s,
        refs,
        theme,
        view,
        modal,
        MODAL_COLLECTION,
        MODAL_NOTE,
        MODAL_TEXT_APPERANCE,
        NAVBAR_HEIGHT,
        MODAL_FONT
    } from '$lib/data/stores';
    import { base } from '$app/paths';

    const colors = {};
</script>

<svelte:head>
    <meta name="theme-color" content={$s['ui.bar.action']['background-color']} />
    <link rel="stylesheet" href="{base}/styles/sab-app.css" />
    <link rel="stylesheet" href="{base}/styles/sab-bc-{$refs.collection}.css" />
    <link rel="stylesheet" href="{base}/override-sab.css" />
<<<<<<< HEAD
</svelte:head> -->
=======
</svelte:head>
>>>>>>> b1bbc3e (Started a layout svelte page for layout of quiz GUI. May not be needed.)
