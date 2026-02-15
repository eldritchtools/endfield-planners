import { useEffect, useMemo, useRef, useState } from "react";
import "./WeaponSelector.css";
import { WeaponImage } from "../../components/ImageHandler";
import { useWeapons } from "../../DataProvider";


const rank_color_mapping = { 6: "#FF7000", 5: "#FFBA03", 4: "#9451F8", 3: "#5AC4FA" }

function WeaponComponent({ id, weapon }) {
    return <div style={{ position: "relative", width: "80px", height: "80px" }}>
        <WeaponImage id={id} width={80} height={80} />
        <div style={{
            position: "absolute", bottom: "0", left: "0", width: "100%", textAlign: "center",
            color: rank_color_mapping[weapon.rank], fontWeight: "bold", fontSize: "0.7rem",
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))', textShadow: '0 1px 3px rgba(0,0,0,0.8)'
        }}>
            {weapon.name}
        </div>
    </div>
}

const weapon_types = ["Sword", "Greatsword", "Polearm", "Handcannon", "Arts Unit"];
const ranks = [6, 5, 4, 3];

export default function WeaponSelector({ value, setValue, options, title = "" }) {
    const [weapons, weaponsLoading] = useWeapons();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const [filter, setFilter] = useState("");
    const [typeFilters, setTypeFilters] = useState([]);
    const [rankFilters, setRankFilters] = useState([]);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const [sel, unsel] = useMemo(() =>
        options
            .filter(x => filter === "" || x.toLowerCase().includes(filter.toLowerCase()))
            .filter(x => typeFilters.length > 0 ? typeFilters.includes(weapons[x].type) : true)
            .filter(x => rankFilters.length > 0 ? rankFilters.includes(weapons[x].rank) : true)
            .sort((a, b) => weapons[a].rank === weapons[b].rank ? a.localeCompare(b) : weapons[b].rank - weapons[a].rank)
            .reduce(([s, u], x) => {
                if (value.includes(x)) s.push(x);
                else u.push(x);
                return [s, u];
            }, [[], []])
        , [options, value, weapons, filter, typeFilters, rankFilters]
    )

    if (weaponsLoading) return null;

    return <div ref={ref} style={{ position: "relative", width: "100%", maxWidth: "1000px" }}>
        <button onClick={() => setOpen(o => !o)} style={{ width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "start", width: "100%", minHeight: "100px" }}>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <div style={{ display: "flex", gap: "0.2rem", overflowX: "auto", width: "100%", overflowY: "hidden" }}>
                    {value.map(id => <WeaponComponent key={id} id={id} weapon={weapons[id]} />)}
                </div>
            </div>
        </button>

        {open && (
            <div className="dark-scrollable"
                style={{
                    position: "absolute",
                    top: "100%",
                    left: "0%",
                    background: "#1a1a1a",
                    border: "1px solid #777",
                    borderRadius: "4px",
                    zIndex: 10,
                    height: "300px",
                    width: "100%",
                    maxWidth: "1000px"
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", padding: "0.5rem", height: "95%" }}>
                    <div style={{ paddingBottom: "0.2rem", alignSelf: "start" }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                        <button onClick={() => setValue([])}>
                            Clear
                        </button>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "0.1rem", flexWrap: "wrap" }}>
                            {weapon_types.map(x =>
                                <button
                                    key={x}
                                    className={typeFilters.includes(x) ? "toggle-button-active" : "toggle-button"}
                                    onClick={() => setTypeFilters(p => {
                                        if (typeFilters.includes(x)) return p.filter(v => v !== x);
                                        else return [...p, x];
                                    })}
                                >
                                    {x}
                                </button>)
                            }
                        </div>
                        <div style={{ display: "flex", gap: "0.1rem" }}>
                            {ranks.map(x =>
                                <button
                                    key={x}
                                    className={rankFilters.includes(x) ? "toggle-button-active" : "toggle-button"}
                                    onClick={() => setRankFilters(p => {
                                        if (rankFilters.includes(x)) return p.filter(v => v !== x);
                                        else return [...p, x];
                                    })}
                                >
                                    {x}★
                                </button>)
                            }
                        </div>
                    </div>
                    <div style={{ height: "100%", overflowY: "auto" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
                            {sel.map(x =>
                                <button key={x} className="weapon-button-active" onClick={() => setValue(value.filter(v => v !== x))}>
                                    <WeaponComponent id={x} weapon={weapons[x]} />
                                </button>
                            )}
                            {unsel.map(x =>
                                <button key={x} className="weapon-button" onClick={() => setValue([...value, x])}>
                                    <WeaponComponent id={x} weapon={weapons[x]} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>;
}

export { WeaponComponent };