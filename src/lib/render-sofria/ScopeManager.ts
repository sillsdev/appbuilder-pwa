import { RenderScope, type RenderScopeWithSubType } from './common';

class ScopeManager {
    constructor(stack?: RenderScope[]) {
        this.stack = stack ?? [];
    }
    private stack: Array<RenderScope>;

    push(level: RenderScopeWithSubType, root: HTMLElement) {
        this.stack.push(new RenderScope(level, root));
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
                    this.debug();
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

    depth(level?: RenderScopeWithSubType) {
        if (level) {
            const idx = this.stack.findLastIndex((s) => s.match(level));
            return idx > -1 ? this.stack.length - (idx + 1) : idx;
        } else {
            return this.stack.length;
        }
    }

    at(depth: number) {
        if (depth >= 0 && depth < this.stack.length) {
            return this.stack[this.stack.length - depth - 1];
        } else {
            this.debug();
            throw new Error(
                `Tried to get scope at invalid depth ${depth} on stack with ${this.stack.length} element(s).`
            );
        }
    }

    appendContent(content: Element | Text, level?: RenderScopeWithSubType) {
        const root = this.find(level)?.root;
        if (root) {
            root.append(content);
        } else {
            this.debug();
            throw new Error(
                `Tried to append ${content} to undefined content root at level ${level ?? 'top'}`
            );
        }
    }

    appendChildrenFromContainer(container: Element, level?: RenderScopeWithSubType) {
        const root = this.find(level)?.root;
        if (root) {
            // copying the array is necessary to prevent some very wierd errors I ran into. (see WEB MAT.2.6)
            Array.from(container.children).forEach((child) => root.append(child));
        } else {
            this.debug();
            throw new Error(
                `Tried to append children of ${container} to undefined content root at level ${level ?? 'top'}`
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
            this.debug();
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

    debug() {
        console.warn([...this.stack]);
    }
}

export default ScopeManager;
