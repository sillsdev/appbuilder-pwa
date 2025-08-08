<script lang="ts">
    import { page } from '$app/stores';

    let message = 'An unknown error occurred';
    let stack = '';

    $: {
        const query = $page.url.searchParams;
        message = query.get('message') ?? message;
        stack = query.get('stack') ?? '';
    }

    function reportIssue() {
        const body = `**Error message:**\n${message}\n\n**Stack trace:**\n\`\`\`\n${stack}\n\`\`\`\n\n**URL:** ${window.location.href}\n**Time:** ${new Date().toISOString()}\n**User‑Agent:** ${navigator.userAgent}\n\n_Please describe what you were doing when this happened._`;
        const issueUrl = `https://github.com/sillsdev/appbuilder-pwa/issues/new?title=Bug+Report&body=${encodeURIComponent(body)}`;
        window.open(issueUrl, '_blank');
    }

    function returnToText() {
        window.location.hash = '/text';
    }
</script>

<div class="p-8 max-w-3xl mx-auto text-center">
    <h1 class="text-3xl font-bold text-red-600">Something went wrong</h1>
    <p class="mt-4 text-lg text-gray-800 break-words">{message}</p>

    {#if stack}
        <details class="mt-4 text-left text-sm text-gray-600 whitespace-pre-wrap">
            <summary class="cursor-pointer font-semibold text-blue-700">View stack trace</summary>
            <pre class="bg-gray-100 p-4 rounded">{stack}</pre>
        </details>
    {/if}

    <div class="mt-6 flex justify-center gap-4 flex-wrap">
        <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            on:click={returnToText}
        >
            Return to Text
        </button>

        <button
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            on:click={reportIssue}
        >
            Report Issue on GitHub
        </button>
    </div>
</div>
