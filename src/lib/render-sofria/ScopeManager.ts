import { RenderScope, type RenderScopeLevel } from './common';

class ScopeManager {
    constructor(document: Document, stack: RenderScope[]) {
        this.document = document;
        this.stack = stack;
    }

    document: Document;
    stack: Array<RenderScope>;

    addScope(level: RenderScopeLevel, root?: HTMLElement) {
        if (root) {
            this.stack.push(new RenderScope(this.document, level, root));
        } else {
            this.stack.push(new RenderScope(this.document, level));
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

    reset() {
        this.stack = [];
    }

    getDepth() {
        return this.stack.length;
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
        const result = this.getCurrentScope(level)?.contentRoot ?? undefined;
        console.log('getActiveContentRoot: %o -> %o', level, result);
        return result;
    }

    setActiveContentRoot(level: RenderScopeLevel, contentRoot: HTMLElement) {
        console.log('setActiveContentRoot: %o, %o', level, contentRoot);
        this.getCurrentScope(level).contentRoot = contentRoot;
    }

    appendInnerContent(content: HTMLElement, level?: RenderScopeLevel) {
        const root = level ? this.getActiveContentRoot(level) : this.getTopContentRoot();
        if (root) {
            root.appendChild(content);
        } else {
            throw new Error(
                `Tried to append ${content} to undefined content root at level ${level ?? 'top'}`
            );
        }
    }

    promoteContent() {
        const layers = this.getDepth();
        if (layers < 1) {
            throw new Error('Tried to promote content on empty scope stack');
        }

        const innerRoot = this.stack.pop().contentRoot;
        if (layers > 1) {
            if (innerRoot) {
                const outerScope = this.getTopScope();
                if (outerScope.contentRoot) {
                    outerScope.contentRoot.appendChild(innerRoot);
                } else {
                    outerScope.contentRoot = innerRoot;
                }
            }

            return undefined;
        } else if (layers === 1) {
            return innerRoot;
        }
    }
}

export default ScopeManager;
