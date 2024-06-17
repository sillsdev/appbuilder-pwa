export function extendStringProperty(obj: object, property: string, value: string) {
    if (!obj[property]) {
        obj[property] = value;
    } else {
        obj[property] += value;
    }
}
