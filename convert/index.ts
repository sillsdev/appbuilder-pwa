import type { TaskOutDirs } from './Task';
import path from 'path';
import { parseConvertArgs } from './parseConvertArgs';
import { ConvertAll } from './convertAll';

// Possible arguments:
// --data-dir=<path> (override data path)
// --watch (watch for changes)
// --watch-timeout=<ms> (time between changes)
// --verbose (log more messages to console)

const params = parseConvertArgs(process.argv);

const outDirs: TaskOutDirs = {
    static: 'static',
    config: path.join('src', 'lib', 'data'),
    firebase: path.join('src', 'lib', 'data')
};

const converter = new ConvertAll(params, outDirs);
converter.run();
