import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ROOT_PATH = "https://endfield-assets.eldritchtools.com";

const DataContext = createContext();

export function DataProvider({ children }) {
    const [dataStore, setDataStore] = useState({});
    const inFlight = useRef({});

    const getData = useCallback(async (path) => {
        if (path in dataStore) return dataStore[path];
        if (inFlight.current[path]) return inFlight.current[path];

        const promise = (async () => {
            const res = await fetch(`${ROOT_PATH}/${path}.json`);
            const json = await res.json();

            setDataStore(prev => ({ ...prev, [path]: json }));
            delete inFlight.current[path];

            return json;
        })();

        inFlight.current[path] = promise;
        return promise;
    }, [dataStore]);

    const value = useMemo(() => ({ dataStore, getData }), [dataStore, getData]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

function useData(path, enabled = true) {
    const { dataStore, getData } = useContext(DataContext);
    const [data, setData] = useState(path in dataStore ? dataStore[path] : null);
    const [loading, setLoading] = useState(!data);

    useEffect(() => {
        if (!path || !enabled) return;

        const cached = dataStore[path];
        if (cached) {
            setData(cached);
            setLoading(false);
            return;
        }

        setData(null);
        setLoading(true);

        let cancelled = false;

        getData(path)
            .then(fetched => {
                if (!cancelled) setData(fetched);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true };
    }, [path, enabled, dataStore, getData]);

    return [data, loading];
}

function useOperators() {
    return useData("data/operators");
}

function useBaseSkills() {
    return useData("data/base_skills");
}

function useSkills() {
    return useData("data/skills");
}

function useTriggers() {
    return useData("data/triggers");
}

function getImagePath(type, id) {
    return `${ROOT_PATH}/assets/${type}/${id}.png`;
}

async function getMeta() {
    return await (await fetch(`${ROOT_PATH}/meta.json`)).json();
}

export { getMeta, useOperators, useBaseSkills, getImagePath, useSkills, useTriggers };