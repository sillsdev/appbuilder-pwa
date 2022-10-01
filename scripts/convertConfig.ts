import { readFile } from 'fs';
import path from 'path';
import { xml2js } from 'xml-js';
import { TaskOutput, Task } from './Task';

export interface ConfigTaskOutput extends TaskOutput {
    data: any;
}
function kebabToCamel(name: string) {
    return name.split('-').map((s, i) => i === 0 ? s : s[0].toUpperCase() + s.slice(1)).join('');
}

function convertToCamelIfKebab(key: string) {
    if (key.includes("-") && key === key.toLowerCase() && key.match(/^[a-z0-9-]+$/)) {
        return kebabToCamel(key);
    }
    return key;
}
function simplifyArrayOfKeys(data: any, keyName = "name", valueName = "value") {
    if (Array.isArray(data)) {
        data = data.map(recurseOutput);
        if (!data.find((x: any) => !(Object.keys(x).includes(valueName) && Object.keys(x).includes(keyName) && Object.keys(x).length === 2))) {
            const arr = data;
            data = {};
            arr.forEach((x: any) => data[x.name] = x.value);
        }
    }
    return data;
}
function recurseOutput(data: any) {
    if (typeof data === "string") {
        // data is a primitive type
        const intForm = parseInt(data);
        if (!isNaN(intForm) && intForm.toString() === data) {
            return intForm;
        }
        if (data === "true") {
            return true;
        }
        if (data === "false") {
            return false;
        }
        return data;
    }
    if (Object.keys(data).length === 1 && data._attributes) {
        // The tag only has attributes
        data = data._attributes;
    }
    if (Object.keys(data).length === 1 && data.value) {
        // The tag has only a value
        data = data.value;
    }
    // Simplify arrays of objects with only a key and value to an object
    data = simplifyArrayOfKeys(data, "name", "value");
    data = simplifyArrayOfKeys(data, "property", "value");
    data = simplifyArrayOfKeys(data, "theme", "value");

    // Recurse over children
    if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
            // If the key is kebab-case, convert it to camelCase
            const newKey = convertToCamelIfKebab(key);
            if (newKey !== key) {
                data[newKey] = data[key];
                delete data[key];
            }
            data[newKey] = recurseOutput(data[newKey]);
        });
    }
    return data;
}

/**
 * Converts appdef.xml into a config object which is passed to other conversion functions
 * and is also written to src/config.js.
 */
export class ConvertConfig extends Task {
    public triggerFiles: string[] = ['appdef.xml'];
    public async run(verbose: boolean): Promise<ConfigTaskOutput> {
        const data = xml2js(await new Promise<string>(r => readFile(path.join(this.dataDir, 'appdef.xml'), { encoding: 'utf8' }, (err, data) => {
            if (err) throw err;
            r(data);
        })), {
            compact: true,
            elementNameFn: kebabToCamel,
            attributeNameFn: kebabToCamel
        });

        const config = recurseOutput(data);
        return {
            taskName: 'ConvertConfig',
            data,
            files: [
                {
                    path: 'src/config.js',
                    content: `export default ${JSON.stringify(config)};`
                }
            ]
        };
    }
}
