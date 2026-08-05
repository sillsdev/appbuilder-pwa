import { RenderScope, type RenderScopeLevel } from './common';

class ScopeManager {
    constructor(stack: RenderScope[]) {
        this.stack = stack;
    }

    stack: Array<RenderScope>;

    addScope(document: Document, level: RenderScopeLevel, root?: HTMLElement) {
        if (root) {
            this.stack.push(new RenderScope(document, level, root));
        } else {
            this.stack.push(new RenderScope(document, level));
        }
    }

    removeScope(level?: RenderScopeLevel) {
        if (!level) {
            return this.stack.pop();
        } else {
            for (let i = this.stack.length - 1; i >= 0; i--) {
                if (this.stack[i].level === level) {
                    return this.stack.splice(i)[0];
                }
            }
        }
    }

    getDepth() {
        return this.stack.length;
    }

    reset() {
        this.stack = [];
    }

    getTopScope() {
        return this.stack.at(-1);
    }

    getTopContentRoot() {
        return this.getTopScope().contentRoot;
    }

    getCurrentScope(level: RenderScopeLevel) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i].level === level) {
                return this.stack[i];
            }
        }
        return undefined;
    }

    getActiveContentRoot(level: RenderScopeLevel) {
        return this.getCurrentScope(level).contentRoot ?? undefined;
    }

    appendInnerContent(content: HTMLElement, level?: RenderScopeLevel) {
        if (!level) {
            this.getTopContentRoot()?.appendChild(content);
        } else {
            this.getActiveContentRoot(level)?.appendChild(content);
        }
    }

    promoteContent() {
        const layers = this.getDepth();
        if (layers > 1) {
            const innerRoot = this.stack.pop().contentRoot;
            this.stack.at(-1).contentRoot.appendChild(innerRoot);
            return undefined;
        } else if (this.getDepth() === 1) {
            return this.stack.pop().contentRoot;
        }
    }
}

export default ScopeManager;
