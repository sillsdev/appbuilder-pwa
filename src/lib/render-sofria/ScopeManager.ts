import { RenderScope, type RenderScopeWithSubType } from './common';

class ScopeManager {
    constructor(document: Document, stack: RenderScope[]) {
        this.document = document;
        this.stack = stack;
    }

    document: Document;
    stack: Array<RenderScope>;

    push(level: RenderScopeWithSubType, root: HTMLElement) {
        this.stack.push(new RenderScope(this.document, level, root));
    }

    /**
     * remove scope from anywhere in the stack
     */
    remove(level: RenderScopeWithSubType) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i].match(level)) {
                if (i + 1 < this.stack.length) {
                    console.warn(
                        'Removed scope %o with %o scopes above',
                        this.stack.at(i),
                        this.stack.length - i
                    );
                }
                return this.stack.splice(i, 1)[0];
            }
        }
    }

    /**
     * remove scope from top of stack, asserting that the scope type matches
     */
    pop(assertScopeType: RenderScopeWithSubType) {
        const layers = this.stack.length;
        if (layers < 1) {
            throw new Error('Tried to pop empty stack');
        }

        const topScope = this.stack.at(-1)!;

        if (!topScope.match(assertScopeType)) {
            throw new Error(
                `Tried to pop scope ${assertScopeType} but found ${topScope.level + (topScope.subType ? `:${topScope.subType}` : '')}`
            );
        }

        return this.stack.pop()!;
    }

    reset() {
        this.stack = [];
    }

    find(level?: RenderScopeWithSubType) {
        return level ? this.stack.findLast((s) => s.match(level)) : this.stack.at(-1);
    }

    appendContent(content: HTMLElement | Text, level?: RenderScopeWithSubType) {
        const root = this.find(level)?.root;
        if (root) {
            root.appendChild(content);
        } else {
            console.log([...this.stack]);
            throw new Error(
                `Tried to append ${content} to undefined content root at level ${level ?? 'top'}`
            );
        }
    }

    promoteContent(assertScopeType: RenderScopeWithSubType) {
        const layers = this.stack.length;
        if (layers < 1) {
            throw new Error('Tried to promote content on empty scope stack');
        }

        const topScope = this.stack.at(-1)!;

        if (!topScope.match(assertScopeType)) {
            console.log([...this.stack]);
            throw new Error(
                `Tried to promote scope ${assertScopeType} but found ${topScope.level + (topScope.subType ? `:${topScope.subType}` : '')}`
            );
        }

        const innerRoot = this.stack.pop()?.root;
        if (layers > 1) {
            if (innerRoot) {
                const outerScope = this.stack.at(-1);
                if (outerScope) {
                    if (outerScope.root) {
                        outerScope.root.appendChild(innerRoot);
                    } else {
                        outerScope.root = innerRoot;
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
