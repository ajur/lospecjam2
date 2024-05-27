


const LOCAL_STORAGE_ENABLED = isLocalStorageAvailable();


export function localStoredData(key, defaults) {
    if (!LOCAL_STORAGE_ENABLED) {
        return {...defaults};
    }

    return new Proxy(Object.assign({}, defaults, JSON.parse(localStorage.getItem(key))), {
        set(target) {
            const resp = Reflect.set(...arguments);
            localStorage.setItem(key, JSON.stringify(target));
            return resp;
        }
    });
}


export function isLocalStorageAvailable() {
    try {
        const x = "__storage_test__";
        localStorage.setItem(x, x);
        localStorage.removeItem(x);
        return true;
    } catch (e) {
        console.warn("LocalStorage not available. Settings, score etc won't be persisted.", e);
        return false;
    }
}
