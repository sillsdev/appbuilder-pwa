/**fires an outlick event when a click happens outside the attached node*/
export function clickOutside(node: HTMLDivElement) {
    const handleClick = (event: { target: any }) => {
        if (!node.contains(event.target)) {
            node.dispatchEvent(new CustomEvent('outclick'));
        }
    };

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
}
