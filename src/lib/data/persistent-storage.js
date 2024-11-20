export function requestPersistentStorage() {
    if (navigator && navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then((persistent) => {
            console.log(`Persistent storage is ${persistent ? 'already' : 'not'} granted.`);
        });
    }
}
