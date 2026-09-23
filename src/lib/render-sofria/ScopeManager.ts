import { RenderScope, type RenderScopeWithSubType } from './common';

class ScopeManager {
    constructor(document: Document, stack: RenderScope[]) {
        this.document = document;
        this.stack = stack;
    }

    document: Document;
    stack: Array<RenderScope>;

    addScope(level: RenderScopeWithSubType, root?: HTMLElement) {
        this.stack.push(new RenderScope(this.document, level, root));
    }

    removeScope(level?: RenderScopeWithSubType) {
        if (!level) {
            return this.stack.pop();
        } else {
            for (let i = this.stack.length - 1; i >= 0; i--) {
                if (this.stack[i].match(level)) {
                    return this.stack.splice(i, 1)[0];
                }
            }
        }
    }

    reset() {
        this.stack = [];
    }

    getScope(level?: RenderScopeWithSubType) {
        return level ? this.stack.findLast((s) => s.match(level)) : this.stack.at(-1);
    }

    appendInnerContent(content: HTMLElement, level?: RenderScopeWithSubType) {
        const root = this.getScope(level)?.contentRoot;
        if (root) {
            root.appendChild(content);
        } else {
            throw new Error(
                `Tried to append ${content} to undefined content root at level ${level ?? 'top'}`
            );
        }
    }

    promoteContent() {
        const layers = this.stack.length;
        if (layers < 1) {
            throw new Error('Tried to promote content on empty scope stack');
        }

        const innerRoot = this.stack.pop()?.contentRoot;
        if (layers > 1) {
            if (innerRoot) {
                const outerScope = this.stack.at(-1);
                if (outerScope) {
                    if (outerScope.contentRoot) {
                        outerScope.contentRoot.appendChild(innerRoot);
                    } else {
                        outerScope.contentRoot = innerRoot;
                    }
                }
            }

            return undefined;
        } else if (layers === 1) {
            return innerRoot;
        }
    }
}

export default ScopeManager;
