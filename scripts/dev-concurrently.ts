import concurrently from 'concurrently';

const { result } = concurrently(
    [
        { command: 'ts-node convert/index.ts --watch', name: 'Converter' },
        { command: 'vite dev --host', name: 'Svelte', raw: true }
    ],
    {
        prefix: '[{time} {name}]',
        timestampFormat: 'HH:mm:ss',
        restartTries: -1,
        restartDelay: 10
    }
);

result.then(
    () => process.exit(0),
    () => process.exit(1)
);
