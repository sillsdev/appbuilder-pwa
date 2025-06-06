export function preventDefault(fn: (event: Event) => void): (event: Event) => void {
    return function (event: Event) {
        event.preventDefault();
        fn.call(this, event);
    };
}

