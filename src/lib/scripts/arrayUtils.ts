export function getRandomItem<T>(array: T[]) {
    return array[Math.floor(Math.random() * array.length)];
}

export function shuffleArray<T>(array: T[]) {
    let currentIndex = array.length;
    let randomIndex = 0;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}
