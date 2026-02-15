import { useProfiles } from "@eldritchtools/shared-components";
import { useEnergyAlluviums, useWeapons } from "../../DataProvider";
import { useMemo } from "react";
import WeaponSelector, { WeaponComponent } from "./WeaponSelector";
import { Tooltip } from "react-tooltip";
import { tooltipStyle } from "../../styles";

const basePill = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.3,
    gap: 6,
};

const pillStyles = [
    { ...basePill, background: '#0b2e1d', border: '1px solid #22c55e', color: '#dcfce7' },
    { ...basePill, background: '#0f2524', border: '1px solid #0f766e', color: '#99f6e4' },
    { ...basePill, background: '#111c2a', border: '1px solid #1e40af', color: '#bfdbfe' },
    { ...basePill, background: '#1b1c2a', border: '1px solid #5b21b6', color: '#ddd6fe' },
    { ...basePill, background: '#1f2937', border: '1px solid #374151', color: '#9ca3af' }
]

const pillTooltipLabels = [
    "perfect match(es) from high priority weapons",
    "perfect match(es) from low priority weapons",
    "matched stat(s) from high priority weapons",
    "matched stat(s) from low priority weapons",
    "perfect match(es) from unselected 6★ weapons",
]

function StatPill({ name, prio, num }) {
    return <div
        data-tooltip-id="essenceFarmingTooltip"
        data-tooltip-content={`${num} ${pillTooltipLabels[prio]}`}
        style={pillStyles[prio]}
    >
        {name} · <span style={{ opacity: 0.8 }}>{num}</span>
    </div>;
}

function Alluvium({ alluvium, high, low, unselected, statsShownLevel, showStatNames }) {
    const [pri, sec, skl, perf, part] = useMemo(() => {
        const priScores = Object.fromEntries(alluvium.primary.map(x => [x, [0, 0, 0, 0, 0]]));
        const secScores = Object.fromEntries(alluvium.secondary.map(x => [x, [0, 0, 0, 0, 0]]));
        const sklScores = Object.fromEntries(alluvium.skill.map(x => [x, [0, 0, 0, 0, 0]]));
        const perfList = [], partList = [];

        high.forEach(([id, data]) => {
            let perf = true;
            const stats = data.stats;
            if (alluvium.primary.includes(stats[0])) {
                priScores[stats[0]][2]++;
            } else if (stats[0] !== null) {
                perf = false;
            }
            if (alluvium.secondary.includes(stats[1])) {
                secScores[stats[1]][2]++;
            } else if (stats[1] !== null) {
                perf = false;
            }
            if (alluvium.skill.includes(stats[2])) {
                sklScores[stats[2]][2]++;
            } else if (stats[2] !== null) {
                perf = false;
            }
            if (perf) {
                priScores[stats[0]][0]++;
                secScores[stats[1]][0]++;
                sklScores[stats[2]][0]++;
                perfList.push([id, data, 0]);
            } else {
                partList.push([id, data, 0]);
            }
        });

        low.forEach(([id, data]) => {
            let perf = true;
            const stats = data.stats;
            if (alluvium.primary.includes(stats[0])) {
                priScores[stats[0]][3]++;
            } else if (stats[0] !== null) {
                perf = false;
            }
            if (alluvium.secondary.includes(stats[1])) {
                secScores[stats[1]][3]++;
            } else if (stats[1] !== null) {
                perf = false;
            }
            if (alluvium.skill.includes(stats[2])) {
                sklScores[stats[2]][3]++;
            } else if (stats[2] !== null) {
                perf = false;
            }
            if (perf) {
                priScores[stats[0]][1]++;
                secScores[stats[1]][1]++;
                sklScores[stats[2]][1]++;
                perfList.push([id, data, 1]);
            } else {
                partList.push([id, data, 1]);
            }
        });

        unselected.forEach(([id, data]) => {
            const stats = data.stats;
            if (!alluvium.primary.includes(stats[0])) return;
            if (!alluvium.secondary.includes(stats[1])) return;
            if (!alluvium.skill.includes(stats[2])) return;
            priScores[stats[0]][4]++;
            secScores[stats[1]][4]++;
            sklScores[stats[2]][4]++;
        });

        const constructSkillScore = (id, scores) => {
            for (let i = 0; i < 5; i++) {
                if (scores[i] === 0) continue;
                return [id, i, scores[i]];
            }
            return [id, 4, 0];
        }

        const pri = Object.entries(priScores)
            .map(([id, scores]) => constructSkillScore(id, scores))
            .sort((a, b) => a[1] === b[1] ? b[2] - a[2] : a[1] - b[1]);
        const sec = Object.entries(secScores)
            .map(([id, scores]) => constructSkillScore(id, scores))
            .sort((a, b) => a[1] === b[1] ? b[2] - a[2] : a[1] - b[1]);
        const skl = Object.entries(sklScores)
            .map(([id, scores]) => constructSkillScore(id, scores))
            .sort((a, b) => a[1] === b[1] ? b[2] - a[2] : a[1] - b[1]);

        return [pri, sec, skl, perfList, partList];
    }, [alluvium, high, low, unselected]);

    return <div style={{
        display: "flex", flexDirection: "column", alignItems: "start", gap: "0.5rem",
        width: "100%", maxWidth: "1000px", padding: "0.5rem",
        border: "1px solid #aaa", borderRadius: "1rem", boxSizing: "border-box"
    }}
    >
        <h3 style={{ alignSelf: "center", margin: 0 }}>{alluvium.name}</h3>
        <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", alignItems: "center" }}>
            Primary Stats:
            {pri
                .filter(([id, prio, num]) => prio <= statsShownLevel)
                .map(([id, prio, num]) => <StatPill key={id} name={id} prio={prio} num={num} />)
            }
        </div>
        <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", alignItems: "center" }}>
            Secondary Stats:
            {sec
                .filter(([id, prio, num]) => prio <= statsShownLevel)
                .map(([id, prio, num]) => <StatPill key={id} name={id} prio={prio} num={num} />)
            }
        </div>
        <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", alignItems: "center" }}>
            Skill Stats:
            {skl
                .filter(([id, prio, num]) => prio <= statsShownLevel)
                .map(([id, prio, num]) => <StatPill key={id} name={id} prio={prio} num={num} />)
            }
        </div>

        <details style={{ width: "100%" }}>
            <summary style={{ textAlign: "start" }}>Perfect Matches · {perf.length}</summary>
            <div style={{ display: "flex", overflowY: "hidden", overflowX: "auto", gap: showStatNames ? "0.5rem" : "0.2rem", width: "100%" }}>
                {perf.map(([id, data, prio]) =>
                    <div
                        key={id}
                        style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "center" }}
                    >
                        <div style={{ border: prio === 0 ? '2px solid rgba(34,197,94,0.55)' : '2px solid rgba(100,116,139,0.40)' }}>
                            <WeaponComponent id={id} weapon={data} />
                        </div>
                        {showStatNames ?
                            <div style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#22c55e" }}>
                                {data.stats.filter(x => x).map(x => <span key={x}>{x}</span>)}
                            </div> :
                            <div style={{ display: "flex", justifyContent: "center", gap: "0.2rem" }}>
                                {data.stats.filter(x => x).map((x, i) =>
                                    <div key={i} style={{
                                        width: "1rem", height: "1rem", borderRadius: "4px", border: "1px #aaa solid",
                                        background: "#22c55e"
                                    }} />
                                )}
                            </div>
                        }
                    </div>
                )}
            </div>
        </details>

        <details style={{ width: "100%" }}>
            <summary style={{ textAlign: "start" }}>Partial Matches · {part.length}</summary>
            <div style={{ display: "flex", overflowY: "hidden", overflowX: "auto", gap: showStatNames ? "0.5rem" : "0.2rem", width: "100%" }}>
                {part.map(([id, data, prio]) =>
                    <div
                        key={id}
                        style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "center" }}
                    >
                        <div style={{ border: prio === 0 ? '2px solid rgba(34,197,94,0.55)' : '2px solid rgba(100,116,139,0.40)' }}>
                            <WeaponComponent id={id} weapon={data} />
                        </div>
                        {showStatNames ?
                            <div style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
                                {data.stats[0] ?
                                    <span style={{color: alluvium.primary.includes(data.stats[0]) ? "#22c55e" : "#6b7280" }}>
                                        {data.stats[0]}
                                    </span> :
                                    null
                                }
                                {data.stats[1] ?
                                    <span style={{color: alluvium.secondary.includes(data.stats[1]) ? "#22c55e" : "#6b7280" }}>
                                        {data.stats[1]}
                                    </span> :
                                    null
                                }
                                {data.stats[2] ?
                                    <span style={{color: alluvium.skill.includes(data.stats[2]) ? "#22c55e" : "#6b7280" }}>
                                        {data.stats[2]}
                                    </span> :
                                    null
                                }
                            </div> :
                            <div style={{ display: "flex", justifyContent: "center", gap: "0.2rem" }}>
                                {data.stats[0] ?
                                    <div style={{
                                        width: "1rem", height: "1rem", borderRadius: "4px", border: "1px #aaa solid",
                                        background: alluvium.primary.includes(data.stats[0]) ? "#22c55e" : "transparent"
                                    }} /> :
                                    null
                                }
                                {data.stats[1] ?
                                    <div style={{
                                        width: "1rem", height: "1rem", borderRadius: "4px", border: "1px #aaa solid",
                                        background: alluvium.secondary.includes(data.stats[1]) ? "#22c55e" : "transparent"
                                    }} /> :
                                    null
                                }
                                {data.stats[2] ?
                                    <div style={{
                                        width: "1rem", height: "1rem", borderRadius: "4px", border: "1px #aaa solid",
                                        background: alluvium.skill.includes(data.stats[2]) ? "#22c55e" : "transparent"
                                    }} /> :
                                    null
                                }
                            </div>
                        }
                    </div>
                )}
            </div>
        </details>
    </div>
}

export default function EssenceFarmingTab() {
    const { profileData, setProfileData } = useProfiles();
    const [weapons, weaponsLoading] = useWeapons();
    const [alluviums, alluviumsLoading] = useEnergyAlluviums();

    const highOptions = useMemo(() => weaponsLoading ? [] :
        Object.keys(weapons).filter(x => !profileData.essenceFarming.low.includes(x))
        , [weapons, weaponsLoading, profileData.essenceFarming.low]);

    const lowOptions = useMemo(() => weaponsLoading ? [] :
        Object.keys(weapons).filter(x => !profileData.essenceFarming.high.includes(x))
        , [weapons, weaponsLoading, profileData.essenceFarming.high]);

    const [alluviumsSorted, unselected] = useMemo(() => {
        if (weaponsLoading || alluviumsLoading) return [];

        const scores = Object.fromEntries(Object.keys(alluviums).map(x => [x, [0, 0, 0, 0, 0]]));
        const picked = new Set();
        profileData.essenceFarming.high.forEach(x => {
            picked.add(x);
            const weapon = weapons[x];
            Object.entries(alluviums).forEach(([id, data]) => {
                let perf = true;
                if (data.primary.includes(weapon.stats[0])) {
                    scores[id][2]++;
                } else if (weapon.stats[0] !== null) {
                    perf = false;
                }
                if (data.secondary.includes(weapon.stats[1])) {
                    scores[id][2]++;
                } else if (!weapon.stats[1] !== null) {
                    perf = false;
                }
                if (data.skill.includes(weapon.stats[2])) {
                    scores[id][2]++;
                } else if (!weapon.stats[2] !== null) {
                    perf = false;
                }
                if (perf) scores[id][0]++;
            })
        })

        profileData.essenceFarming.low.forEach(x => {
            picked.add(x);
            const weapon = weapons[x];
            Object.entries(alluviums).forEach(([id, data]) => {
                let perf = true;
                if (data.primary.includes(weapon.stats[0])) {
                    scores[id][3]++;
                } else if (!weapon.stats[0] !== null) {
                    perf = false;
                }
                if (data.secondary.includes(weapon.stats[1])) {
                    scores[id][3]++;
                } else if (!weapon.stats[1] !== null) {
                    perf = false;
                }
                if (data.skill.includes(weapon.stats[2])) {
                    scores[id][3]++;
                } else if (!weapon.stats[2] !== null) {
                    perf = false;
                }
                if (perf) scores[id][1]++;
            })
        })

        const unselected = [];
        Object.entries(weapons).forEach(([id, weapon]) => {
            if (picked.has(id) || weapon.rank !== 6) return;
            unselected.push(id);
            Object.entries(alluviums).forEach(([aId, data]) => {
                if (!data.primary.includes(weapon.stats[0])) return;
                if (!data.secondary.includes(weapon.stats[1])) return;
                if (!data.skill.includes(weapon.stats[2])) return;
                scores[aId][4]++;
            })
        })

        return [Object.keys(alluviums).sort((a, b) => {
            const sa = scores[a], sb = scores[b];
            for (let i = 0; i < 5; i++) {
                if (sa[i] === sb[i]) continue;
                return sb[i] - sa[i];
            }
            return 0;
        }), unselected];
    }, [profileData.essenceFarming, alluviums, alluviumsLoading, weapons, weaponsLoading])

    if (weaponsLoading || alluviumsLoading) return null;

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        <h2>Essence Farming</h2>

        <p style={{ marginBottom: "8px", textAlign: "start", lineHeight: "1.3", width: "100%", maxWidth: "1000px" }}>
            Find the best farming spots for essences depending on the weapons you plan to farm for.
            <br />
            Energy Alluviums are sorted by the following criteria with ties being resolved by moving to the next criteria:
            <br />
            - Most high priority perfect matches
            <br />
            - Most low priority perfect matches
            <br />
            - Most stats matched in high priority
            <br />
            - Most stats matched in low priority
            <br />
            - Most perfect matches in unselected 6★ weapons
            <br />
            Stats available in each alluvium are also shown with the same criteria as above and are color coded depending on the highest criteria they fulfill.
        </p>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ gap: "0.2rem" }}>
                Stats to show:
                <select
                    value={profileData.essenceFarming.settings.statsShownLevel}
                    onChange={e => setProfileData(p => ({
                        ...p,
                        essenceFarming: {
                            ...p.essenceFarming,
                            settings: {
                                ...p.essenceFarming.settings,
                                statsShownLevel: e.target.value
                            }
                        }
                    }))}
                >
                    <option value={1}>Perfect matches only</option>
                    <option value={3}>Partial matches</option>
                    <option value={5}>All stats</option>
                </select>
            </div>
            <label>
                <input
                    type="checkbox"
                    value={profileData.essenceFarming.settings.showStatNames}
                    onChange={e => setProfileData(p => ({
                        ...p,
                        essenceFarming: {
                            ...p.essenceFarming,
                            settings: {
                                ...p.essenceFarming.settings,
                                showStatNames: e.target.checked
                            }
                        }
                    }))}
                />
                Show Stat Names Under Weapons
            </label>
        </div>

        <WeaponSelector
            value={profileData.essenceFarming.high}
            setValue={v => setProfileData(p => ({
                ...p,
                essenceFarming: {
                    ...p.essenceFarming, high: v
                }
            }))}
            options={highOptions}
            title="High Priority"
        />

        <WeaponSelector
            value={profileData.essenceFarming.low}
            setValue={v => setProfileData(p => ({
                ...p,
                essenceFarming: {
                    ...p.essenceFarming, low: v
                }
            }))}
            options={lowOptions}
            title="Low Priority"
        />

        {alluviumsSorted.map(id =>
            <Alluvium
                key={id}
                alluvium={alluviums[id]}
                high={profileData.essenceFarming.high.map(id => [id, weapons[id]])}
                low={profileData.essenceFarming.low.map(id => [id, weapons[id]])}
                unselected={unselected.map(id => [id, weapons[id]])}
                statsShownLevel={profileData.essenceFarming.settings.statsShownLevel}
                showStatNames={profileData.essenceFarming.settings.showStatNames}
            />
        )}

        <Tooltip id={"essenceFarmingTooltip"} render={({ content }) => <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>} style={tooltipStyle} />
    </div>;
}