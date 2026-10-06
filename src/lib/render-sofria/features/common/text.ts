import type { RenderWorkspace } from '$lib/render-sofria/common';

export function terminatePhrase(workspace: RenderWorkspace) {
    const previousPhrase = workspace.scopeManager.remove('phrase')?.root;
    if (previousPhrase?.innerHTML) {
        workspace.scopeManager.appendContent(previousPhrase);
    }
}
