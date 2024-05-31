


const LOCAL_STORAGE_ENABLED = isLocalStorageAvailable();


export function localStoredData(key, defaults) {
    if (!LOCAL_STORAGE_ENABLED) {
        return {...defaults};
    }

    const handler = {
      set(target) {
        const resp = Reflect.set(...arguments);
        localStorage.setItem(key, JSON.stringify(target));
        return resp;
      }
    };

    if (Array.isArray(defaults)) {
      return new Proxy([...defaults, ...(JSON.parse(localStorage.getItem(key)) ?? [])], handler);
    }
    else if (typeof defaults === "object") {
      return new Proxy(Object.assign({}, defaults, JSON.parse(localStorage.getItem(key))), handler);
    }
    console.warn("localStoredData supports only objects and arrays");
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
