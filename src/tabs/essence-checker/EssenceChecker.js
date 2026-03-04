import { useProfiles } from "@eldritchtools/shared-components";
import { useWeapons } from "../../DataProvider";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { selectStyle } from "../../styles";
import { WeaponComponent } from "../../components/WeaponSelector";

const stats = {
    "primary": [
        "Strength Boost",
        "Agility Boost",
        "Intellect Boost",
        "Will Boost",
        "Main Attribute Boost",
    ],
    "secondary": [
        "Attack Boost",
        "HP Boost",
        "Physical DMG Boost",
        "Heat DMG Boost",
        "Electric DMG Boost",
        "Cryo DMG Boost",
        "Nature DMG Boost",
        "Critical Rate Boost",
        "Arts Intensity Boost",
        "Ultimate Gain Boost",
        "Arts DMG Boost",
        "Treatment Efficiency Boost",
    ],
    "skill": [
        "Assault",
        "Suppression",
        "Pursuit",
        "Crusher",
        "Inspiring",
        "Combative",
        "Brutality",
        "Infliction",
        "Medicant",
        "Fracture",
        "Detonate",
        "Twilight",
        "Flow",
        "Efficacy",
    ],
}

function Weapon({ id, weapon, essenceStats, showStatNames = false }) {
    return <div
        key={id}
        style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "center" }}
    >
        <div>
            <WeaponComponent id={id} weapon={weapon} />
        </div>
        {showStatNames ?
            <div style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", textAlign: "center" }}>
                {weapon.stats.map(x =>
                    <span style={{ color: essenceStats.includes(x) ? "#22c55e" : "#6b7280" }}>
                        {x}
                    </span>
                )}
            </div> :
            <div style={{ display: "flex", justifyContent: "center", gap: "0.2rem" }}>
                {weapon.stats.map(x =>
                    <div style={{
                        width: "1rem", height: "1rem", borderRadius: "4px", border: "1px #aaa solid",
                        background: essenceStats.includes(x) ? "#22c55e" : "transparent"
                    }} />
                )}
            </div>
        }
    </div>
}

function Essence({ data, setName, setStat, removeEssence, statOptions, minRank, weapons, showStatNames }) {
    const [editingName, setEditingName] = useState(false);

    const filterFunc = (candidate, input) => {
        if (!input || input.length === 0) return true;
        return candidate.data.name.toLowerCase().includes(input.toLowerCase());
    }

    const filteredWeapons = useMemo(() => {
        const matches = [[], [], []];

        Object.entries(weapons).forEach(([id, weapon]) => {
            if(weapon.rank < minRank) return;
            let num = 0;
            weapon.stats.forEach(x => {
                if (data.stats.includes(x)) num++;
            })
            if (num > 0) matches[num - 1].push(id);
        });

        return [
            matches[0].sort((a, b) => weapons[b].rank - weapons[a].rank),
            matches[1].sort((a, b) => weapons[b].rank - weapons[a].rank),
            matches[2].sort((a, b) => weapons[b].rank - weapons[a].rank)
        ];
    }, [data.stats, minRank, weapons]);

    return <div style={{
        display: "flex", flexDirection: "column", border: "1px #aaa solid", borderRadius: "1rem",
        padding: "1rem", gap: "0.5rem", width: "250px", textAlign: "start"
    }}
    >
        {editingName ?
            <input
                autoFocus
                value={data.name}
                onChange={e => setName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        setEditingName(false);
                    }
                }}
            /> :
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3
                    style={{ margin: 0, cursor: "pointer" }}
                    onClick={() => setEditingName(true)}
                >
                    {data.name}
                </h3>
                <div 
                    style={{ color: "#ff4848", fontSize: "1rem", fontWeight: "bold", cursor: "pointer" }}
                    onClick={() => removeEssence()}
                >
                    ✕
                </div>
            </div>
        }
        {
            data.stats.map((x, i) =>
                <Select
                    key={i}
                    options={statOptions}
                    value={x ? { value: x, label: x } : x}
                    onChange={opt => setStat(i, opt ? opt.value : opt)}
                    filterOption={filterFunc}
                    menuPortalTarget={document.body}
                    styles={selectStyle}
                />
            )
        }
        <details open>
            <summary>Perfect (3) matches ({filteredWeapons[2].length})</summary>
            <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                    {filteredWeapons[2].map(x => <Weapon key={x} id={x} weapon={weapons[x]} essenceStats={data.stats} showStatNames={showStatNames} />)}
                </div>
            </div>
        </details>
        <details>
            <summary>Partial (2) matches ({filteredWeapons[1].length})</summary>
            <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                    {filteredWeapons[1].map(x => <Weapon key={x} id={x} weapon={weapons[x]} essenceStats={data.stats} showStatNames={showStatNames} />)}
                </div>
            </div>
        </details>
        <details>
            <summary>Minimal (1) matches ({filteredWeapons[0].length})</summary>
            <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                    {filteredWeapons[0].map(x => <Weapon key={x} id={x} weapon={weapons[x]} essenceStats={data.stats} showStatNames={showStatNames} />)}
                </div>
            </div>
        </details>
    </div>
}

export default function EssenceCheckerTab() {
    const { profileData, setProfileData } = useProfiles();
    const [weapons, weaponsLoading] = useWeapons();

    const statOptions = useMemo(() => {
        const result = [];
        Object.entries(stats).forEach(([_, list]) =>
            list.forEach(x => result.push({ value: x, label: x }))
        );
        return result;
    }, []);

    const addEssence = useCallback(() => {
        setProfileData(p => (
            {
                ...p,
                essenceChecker: {
                    ...p.essenceChecker,
                    essences: [...p.essenceChecker.essences, { name: `Essence ${p.essenceChecker.essences.length + 1}`, stats: [null, null, null] }]
                }
            }
        ))
    }, [setProfileData]);

    const setEssenceName = useCallback((index, name) => {
        setProfileData(p => (
            {
                ...p,
                essenceChecker: {
                    ...p.essenceChecker,
                    essences: p.essenceChecker.essences.map((x, i) => i === index ? { ...x, name: name } : x)
                }
            }
        ))
    }, [setProfileData]);

    const setEssenceStat = useCallback((index, statIndex, stat) => {
        setProfileData(p => (
            {
                ...p,
                essenceChecker: {
                    ...p.essenceChecker,
                    essences: p.essenceChecker.essences.map((x, i) => i === index ? { ...x, stats: x.stats.map((y, j) => j === statIndex ? stat : y) } : x)
                }
            }
        ))
    }, [setProfileData]);

    const removeEssence = useCallback((index) => {
        setProfileData(p => (
            {
                ...p,
                essenceChecker: {
                    ...p.essenceChecker,
                    essences: p.essenceChecker.essences.filter((x, i) => i !== index)
                }
            }
        ))
    }, [setProfileData])

    useEffect(() => {
        if (profileData.essenceChecker.essences.length === 0) {
            addEssence();
        }
    }, [profileData.essenceChecker.essences, addEssence]);

    if (weaponsLoading) return null;

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        <h2>Essence Checker</h2>

        <p style={{ marginBottom: "8px", textAlign: "start", lineHeight: "1.3", width: "100%", maxWidth: "1000px" }}>
            Check if your essences match a weapon you have or are planning to pull for.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <button onClick={() => addEssence()}>
                Add essence
            </button>
            <label>
                Minimum Rank: 
                <select
                    value={profileData.essenceChecker.minRank}
                    onChange={e => setProfileData(p => ({
                        ...p,
                        essenceChecker: {
                            ...p.essenceChecker,
                            minRank: Number(e.target.value)
                        }
                    }))}
                >
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                </select>
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={profileData.essenceChecker.showStatNames}
                    onChange={e => setProfileData(p => ({
                        ...p,
                        essenceChecker: {
                            ...p.essenceChecker,
                            showStatNames: e.target.checked
                        }
                    }))}
                />
                Show Stat Names Under Weapons
            </label>
        </div>

        <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                {profileData.essenceChecker.essences.map((x, i) =>
                    <Essence
                        key={i}
                        data={x}
                        setName={v => setEssenceName(i, v)}
                        setStat={(ind, v) => setEssenceStat(i, ind, v)}
                        removeEssence={() => removeEssence(i)}
                        statOptions={statOptions}
                        minRank={profileData.essenceChecker.minRank}
                        weapons={weapons}
                        showStatNames={profileData.essenceChecker.showStatNames}
                    />
                )}
            </div>
        </div>
    </div>;
}