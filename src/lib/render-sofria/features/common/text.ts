import type { RenderWorkspace } from '$lib/render-sofria/common';

export function terminatePhrase(workspace: RenderWorkspace) {
    const depth = workspace.scopeManager.depth('phrase');
    const previousPhrase = workspace.scopeManager.remove('phrase')?.root;
    if (previousPhrase?.innerHTML) {
        workspace.scopeManager.at(depth).root.append(previousPhrase);
    }
}
