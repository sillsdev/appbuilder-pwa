<script lang="ts">
    import { dismissSafariWarning, shouldShowSafariWarning } from '$lib/scripts/safariUtils';

    let visible = $state(shouldShowSafariWarning());

    function dismiss() {
        dismissSafariWarning();
        visible = false;
    }
</script>

{#if visible}
    <div class="flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 mx-2.5 mt-2.5 text-sm">
        <svg
            class="shrink-0 mt-0.5 w-5 h-5 text-amber-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
        >
            <path
                fill-rule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clip-rule="evenodd"
            />
        </svg>
        <div class="flex-1">
            <p class="font-semibold">Annotations may be deleted by Safari</p>
            <p class="mt-0.5">
                Safari can delete your bookmarks, highlights, and notes after 1–2 weeks of
                inactivity. To keep them permanently, add this app to your Home Screen.
            </p>
        </div>
        <button
            onclick={dismiss}
            class="shrink-0 text-amber-500 hover:text-amber-700"
            aria-label="Dismiss"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
        </button>
    </div>
{/if}
