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
        let scope: RenderScope;

        for (let i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i].level === level) {
                scope = this.stack[i];
            }
        }

        console.log('getCurrentScope(%o): found %o', level, scope);

        return scope ?? undefined;
    }

    getActiveContentRoot(level: RenderScopeLevel) {
        const result = this.getCurrentScope(level).contentRoot ?? undefined;
        console.log('getActiveContentRoot: %o -> %o', level, result);
        return result;
    }

    setActiveContentRoot(level: RenderScopeLevel, contentRoot: HTMLElement) {
        console.log('setActiveContentRoot: %o, %o', level, contentRoot);
        this.getCurrentScope(level).contentRoot = contentRoot;
    }

    appendInnerContent(content: HTMLElement, level?: RenderScopeLevel) {
        let root: HTMLElement;
        if (!level) {
            root = this.getTopContentRoot();
        } else {
            root = this.getActiveContentRoot(level);
        }

        if (root) {
            root.appendChild(content);
        } else {
            if (level) {
                this.setActiveContentRoot(level, content);
            } else {
                this.stack.at(-1).contentRoot = content;
            }
        }
    }

    promoteContent() {
        const layers = this.getDepth();
        if (layers > 1) {
            const innerRoot = this.stack.pop().contentRoot;
            if (!innerRoot) {
                return undefined;
            }

            const outerRoot = this.getTopContentRoot();
            if (outerRoot) {
                outerRoot.appendChild(innerRoot);
            } else {
                // const topScope = this.stack.pop();
                // topScope.contentRoot = innerRoot;
                // this.stack.push(topScope);
                this.stack[this.stack.length - 1].contentRoot = innerRoot;
            }

            return undefined;
        } else if (layers === 1) {
            return this.stack.pop().contentRoot;
        }
    }
}

export default ScopeManager;
