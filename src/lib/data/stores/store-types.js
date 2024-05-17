/**
 * a store wrapper for a dynamic list of stores.
 * behaves like a normal store if the default key is used.
 */
export const groupStore = (/**@type{any}*/ groupType, /**@type{any}*/ props) => {
    /**@type{any}*/ const stores = { default: groupType(props) };
    /**@type{any}*/ const vals = { default: undefined };
    /**@type{any}*/ const mods = { default: undefined };
    /**@type{any}*/ const unsubs = {
        default: stores.default.subscribe((v) => (vals['default'] = v))
    };
    /**@type{any}*/ const subs = { default: [] };

    const subscribe = (cb, key = 'default') => {
        if (!stores.hasOwnProperty(key)) {
            stores[key] = groupType(props);
            unsubs[key] = stores[key].subscribe((v) => (vals[key] = v));
            subs[key] = [];
        }
        subs[key].push(cb);
        cb(vals[key], mods[key]);
        return () => {
            subs[key] = subs[key].filter((sub) => sub !== cb);
            if (key !== 'default' && subs[key].length <= 0) {
                unsubs[key]();
                delete stores[key];
                delete vals[key];
                delete mods[key];
                delete unsubs[key];
                delete subs[key];
            }
        };
    };

    const set = (val, key = 'default', mod = undefined) => {
        stores[key].set(val);
        mods[key] = mod;
        subs[key].forEach((sub) => sub(vals[key], mods[key]));
    };

    const extras = Object.fromEntries(
        Object.entries(stores['default'])
            .filter((kv) => kv[0] !== 'subscribe' && kv[0] !== 'set' && typeof kv[1] === 'function')
            .map((kv) => [
                kv[0],
                (val, key = 'default', mod = undefined) => {
                    stores[key][kv[0]](val);
                    mods[key] = mod;
                    subs[key].forEach((sub) => sub(vals[key], mods[key]));
                }
            ])
    );

    return { subscribe, set, ...extras };
};
