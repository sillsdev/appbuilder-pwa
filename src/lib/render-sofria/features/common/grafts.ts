import type { RenderEnvironment } from '$lib/render-sofria/common';
import { getBlock } from '.';

export function renderBlock(environment: RenderEnvironment, label?: string) {
    if (getBlock(environment.context).sequence) {
        environment.workspace.scopeManager.push(
            `blockGraft:${label}`,
            environment.workspace.document.createElement('div')
        );
        environment.context.renderer.renderSequence(environment);
        environment.workspace.scopeManager.appendChildrenFromContainer(
            environment.workspace.scopeManager.pop(`blockGraft:${label}`).root
        );
    }
}
