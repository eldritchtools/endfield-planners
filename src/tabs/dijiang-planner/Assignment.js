import roomData from "./roomData";
import { Mcmf } from '@algorithm.ts/mcmf'

const priorityOptions = {
    "Equal": { "MFG": 1, "GC": 1, "RR": 1 },
    "MFG & GC > RR": { "MFG": 2, "GC": 2, "RR": 1 },
    "MFG & RR > GC": { "MFG": 2, "GC": 1, "RR": 2 },
    "GC & RR > MFG": { "MFG": 1, "GC": 2, "RR": 2 },
    "MFG > GC > RR": { "MFG": 3, "GC": 2, "RR": 1 },
    "MFG > RR > GC": { "MFG": 3, "GC": 1, "RR": 2 },
    "GC > MFG > RR": { "MFG": 2, "GC": 3, "RR": 1 },
    "GC > RR > MFG": { "MFG": 1, "GC": 3, "RR": 2 },
    "RR > MFC > GC": { "MFG": 2, "GC": 1, "RR": 3 },
    "RR > GC > MFG": { "MFG": 1, "GC": 2, "RR": 3 }
}

function optimizeOperators(operatorsData, profileData, available) {
    const CNPrio = profileData.dijiangPlanner.roomSettings["CN"]?.firstPrio ?? true;
    const roomPrioValues = priorityOptions[profileData.dijiangPlanner.settings.prio ?? "Equal"];
    const assignments = Object.entries(profileData.dijiangPlanner.roomAssignments).reduce((acc, [roomId, assignment]) => {
        acc[roomId] = assignment.map(op => {
            if (!op) return null;
            if (op.fixed) return op;
            return null;
        })
        return acc;
    }, {});

    const roomScore = {};
    Object.keys(operatorsData).forEach(operatorId => {
        const scoreDict = {};
        const skillLevels = profileData.dijiangPlanner.operatorSkills[operatorId] ?? [2, 2];
        const skills = operatorsData[operatorId].baseSkills;
        const skillValues = skills.map((skill, i) => skill.values[skillLevels[i] - 1]);

        Object.keys(profileData.dijiangPlanner.roomAssignments).forEach(roomId => {
            let efficiencyBonus = 0;
            let moodBonus = 0;
            const roomType = roomId.split("-")[0];
            skills.forEach((skill, i) => {
                if (skill.room !== roomType) return;
                if (skill.type === "mood regen") {
                    // CN
                    moodBonus += skillValues[i];
                } else if (skill.type === "mood drain") {
                    // All except CN
                    moodBonus += skillValues[i];
                } else if (skill.type === "clue efficiency") {
                    // RR
                    efficiencyBonus += skillValues[i] * roomPrioValues[roomType];
                } else if (["operator xp", "weapon xp", "mineral", "fungus", "plant"].includes(skill.type)) {
                    // MFG and GC
                    if (!(roomId in profileData.dijiangPlanner.roomSettings)) return;

                    if (skill.room === "MFG") {
                        if (skill.type === roomData["MFG"].items[profileData.dijiangPlanner.roomSettings[roomId].item]?.type) {
                            efficiencyBonus += skillValues[i] * roomPrioValues[roomType];
                        }
                    } else if (skill.room === "GC") {
                        let match = 0;
                        let unmatch = 0;
                        profileData.dijiangPlanner.roomSettings[roomId].items.forEach(itemId => {
                            if (!itemId) return;
                            if (skill.type === roomData["GC"].items[itemId]?.type) match++;
                            else unmatch++;
                        })
                        if (match === 0) return;
                        efficiencyBonus += (skillValues[i] * match / (match + unmatch) * roomPrioValues[roomType]);
                    }
                }
            })

            if (efficiencyBonus === 0 && moodBonus === 0)
                scoreDict[roomId] = 0;
            else {
                const BASE_UPTIME = 5 / 8;
                const efficiencyContribution = efficiencyBonus * BASE_UPTIME;
                const moodContribution = (moodBonus * (1 - BASE_UPTIME)) / (1 + BASE_UPTIME * moodBonus);

                scoreDict[roomId] = (1 + efficiencyContribution) * (1 + moodContribution);
            }
        })
        roomScore[operatorId] = scoreDict;
    })

    const worstRoomPrio = {};
    Object.keys(operatorsData).forEach(operatorId => {
        const skills = operatorsData[operatorId].baseSkills;

        let score = 5;
        skills.forEach(skill => {
            if (skill.room === "CN") return;
            if (skill.room === "MFG") {
                if (Object.entries(profileData.dijiangPlanner.roomSettings).every(([k, v]) =>
                    k.split("-")[0] !== "MFG" || !v.item || roomData["MFG"].items[v.item].type !== skill.type
                ))
                    return;
            }
            if (skill.room === "GC") {
                if (Object.entries(profileData.dijiangPlanner.roomSettings).every(([k, v]) =>
                    k.split("-")[0] !== "GC" || !v.items || v.items.every(itemId => !itemId || roomData["GC"].items[itemId].type !== skill.type)
                ))
                    return;
            }
            if (skill.room === "RR" && skill.type === "clue rate up") return;
            score = Math.min(score, roomPrioValues[skill.room]);
        });
        if (score === 5) score = 0;
        worstRoomPrio[operatorId] = score;
    });

    let operators = [...available];

    if (CNPrio) {
        operators.sort((a, b) => {
            const cna = roomScore[a]["CN"];
            const cnb = roomScore[b]["CN"];
            if (cna === cnb) return worstRoomPrio[a] - worstRoomPrio[b];
            return cnb - cna;
        });

        for (let i = 0; i < 3; i++) {
            if (assignments["CN"][i]) continue;
            if (operators.length === 0 || roomScore[operators[0]]["CN"] === 0) break;
            const [first, ...rest] = operators;
            assignments["CN"][i] = { id: first, fixed: false };
            operators = rest;
        }
    }

    operators.sort();
    // MCMF
    let nodeCount = 0;
    const SRC = nodeCount++;
    const [operatorsMapping, operatorsReversed] = operators.reduce(
        ([acc1, acc2], id) => {
            acc1[id] = nodeCount;
            acc2[nodeCount] = id;
            nodeCount++;
            return [acc1, acc2];
        }, [{}, {}]
    );
    const [roomsMapping, roomsReversed] = Object.keys(profileData.dijiangPlanner.roomAssignments).reduce(
        ([acc1, acc2], id) => {
            if (id === "CN") return [acc1, acc2];
            acc1[id] = nodeCount;
            acc2[nodeCount] = id;
            nodeCount++;
            return [acc1, acc2];
        },
        [{}, {}]
    );
    const SNK = nodeCount++;

    const mcmf = new Mcmf();
    mcmf.init(SRC, SNK, nodeCount);

    operators.forEach(operatorId => {
        mcmf.addEdge(SRC, operatorsMapping[operatorId], 1, 0);
    });

    operators.forEach(operatorId => {
        Object.keys(profileData.dijiangPlanner.roomAssignments).forEach(roomId => {
            if (roomId === "CN") return;
            const score = roomScore[operatorId][roomId] - (0.000001 * roomScore[operatorId]["CN"]);
            mcmf.addEdge(operatorsMapping[operatorId], roomsMapping[roomId], 1, -score);
        })
    });

    Object.keys(profileData.dijiangPlanner.roomAssignments).forEach(roomId => {
        if (roomId === "CN") return;
        const availableSlots = assignments[roomId].filter(x => !x).length;
        mcmf.addEdge(roomsMapping[roomId], SNK, availableSlots, 0);
    });

    const mincut = mcmf.mincut();

    const assignedOperators = new Set();
    mincut.forEach(edge => {
        if (!(edge.from in operatorsReversed) || !(edge.to in roomsReversed)) return;
        const operatorId = operatorsReversed[edge.from];
        const roomId = roomsReversed[edge.to];
        for (let i = 0; i < 3; i++) {
            if (assignments[roomId][i]) continue;
            assignments[roomId][i] = {
                id: operatorId,
                fixed: false
            }
            assignedOperators.add(operatorId);
            break;
        }
    })

    operators = operators.filter(x => !assignedOperators.has(x));

    if (!CNPrio) {
        operators.sort((a, b) => roomScore[b]["CN"] - roomScore[a]["CN"]);

        for (let i = 0; i < 3; i++) {
            if (assignments["CN"][i]) continue;
            if (operators.length === 0 || roomScore[operators[0]]["CN"] === 0) break;
            const [first, ...rest] = operators;
            assignments["CN"][i] = { id: first, fixed: false };
            operators = rest;
        }
    }

    return assignments;
}

export { priorityOptions, optimizeOperators };
