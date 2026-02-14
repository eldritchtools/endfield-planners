import roomData from "./roomData";

const alignmentOptions = [
    "Staggered",
    "Aligned"
]

function secondsToString(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function decimalToPercentFixed(decimal, digits = 2) {
    return (decimal * 100).toFixed(digits) + '%';
}

const BREAK_TIME = 30000;
const WORK_TIME = 50000;

function computeProductivity(operatorsData, profileData) {
    const assignments = profileData.dijiangPlanner.roomAssignments;
    const skillLevels = profileData.dijiangPlanner.operatorSkills;
    const roomSettings = profileData.dijiangPlanner.roomSettings;
    const result = {};

    let moodRegen = 1;
    let cnMoodDrain = 1;
    assignments["CN"].forEach(operator => {
        if (!operator) return;
        operatorsData[operator.id].baseSkills.forEach((skill, i) => {
            if (skill.room !== "CN") return;
            const level = operator.id in skillLevels ? skillLevels[operator.id][i] : 2;
            if(level === 0) return;
            if (skill.type === "mood regen") {
                moodRegen += skill.values[level - 1];
            } else if (skill.type === "mood drain") {
                cnMoodDrain -= skill.values[level - 1];
            }
        })
    })

    const breakTime = BREAK_TIME / moodRegen;
    const cnWorkTime = WORK_TIME / cnMoodDrain;

    result["CN"] = { "globalBreakTime": secondsToString(breakTime), "workTime": secondsToString(cnWorkTime) }

    Object.entries(assignments).forEach(([roomId, assignment]) => {
        if (roomId === "CN") return;
        if (assignment.every(x => x === null)) {
            result[roomId] = {
                "workTime": secondsToString(WORK_TIME),
                "operatorUptime": decimalToPercentFixed(WORK_TIME / (WORK_TIME + breakTime)),
            }
            return;
        };
        
        const roomType = roomId.split("-")[0];
        let moodDrain = 1;
        const vars = roomType === "GC" ? { "fungus": [0, 0, 0], "plant": [0, 0, 0], "mineral": [0, 0, 0] } : { "efficiency": [0, 0, 0] };

        assignment.forEach((operator, oi) => {
            if (!operator) return;
            operatorsData[operator.id].baseSkills.forEach((skill, i) => {
                if (skill.room !== roomType) return;
                const level = operator.id in skillLevels ? skillLevels[operator.id][i] : 2;
                if(level === 0) return;
                if (skill.type === "mood drain") {
                    moodDrain -= skill.values[level - 1];
                    return;
                }

                if (roomType === "MFG") {
                    const itemId = roomSettings[roomId]?.item;
                    if (itemId in roomData["MFG"].items && skill.type === roomData["MFG"].items[itemId].type) {
                        vars["efficiency"][oi] += skill.values[level - 1];
                    }
                } else if (roomType === "GC") {
                    vars[skill.type][oi] += skill.values[level - 1];
                } else if (roomType === "RR") {
                    if (skill.type === "clue efficiency") {
                        vars["efficiency"][oi] += skill.values[level - 1];
                    }
                }
            })
        });

        const workTime = WORK_TIME / moodDrain;
        const operatorUptime = workTime / (workTime + breakTime);
        const cycleTime = workTime + breakTime;
        const efficiencies = {};

        if ((profileData.dijiangPlanner.settings.align ?? "Staggered") === "Staggered") {
            Object.entries(vars).forEach(([type, bonuses]) => {
                const events = [];
                for (let i = 0; i < 3; i++) {
                    if (!assignment[i]) continue;
                    let start = Math.floor(i * (cycleTime / 3));
                    let end = start + workTime;
                    events.push({ time: start, type: type, operators: 1, bonus: bonuses[i] });
                    if (end <= cycleTime)
                        events.push({ time: end, type: type, operators: -1, bonus: -bonuses[i] });
                    else {
                        events.push({ time: cycleTime, type: type, operators: -1, bonus: -bonuses[i] });
                        events.push({ time: 0, type: type, operators: 1, bonus: bonuses[i] });
                        events.push({ time: end % cycleTime, type: type, operators: -1, bonus: -bonuses[i] });
                    }
                }

                events.sort((a, b) => a.time - b.time);
                let totalWork = 0;
                let operators = 0;
                let bonus = 0;
                for (let i = 0; i < events.length; i++) {
                    if (i > 0 && events[i].time > events[i - 1].time && operators > 0) {
                        totalWork += (1 + operators * 0.4) * (1 + bonus) * (events[i].time - events[i - 1].time);
                    }
                    operators += events[i].operators;
                    bonus += events[i].bonus;
                }
                let averageWork = totalWork / cycleTime;
                efficiencies[type] = averageWork;
            })
        } else {
            Object.entries(vars).forEach(([type, bonuses]) => {
                let operators = 0;
                let bonus = 0;
                for (let i = 0; i < 3; i++) {
                    if (!assignment[i]) continue;
                    operators += 1;
                    bonus += bonuses[i];
                }
                let averageWork = (1 + operators * 0.4) * (1 + bonus) * operatorUptime;
                efficiencies[type] = averageWork;
            })
        }

        result[roomId] = {
            "workTime": secondsToString(workTime),
            "operatorUptime": decimalToPercentFixed(operatorUptime),
        }

        if (roomType === "MFG") {
            result[roomId]["efficiency"] = decimalToPercentFixed(efficiencies["efficiency"]);

            const itemId = roomSettings[roomId]?.item;
            if (itemId in roomData["MFG"].items) {
                const item = roomData["MFG"].items[itemId];
                const duration = item.duration / efficiencies["efficiency"];
                result[roomId]["duration"] = secondsToString(duration);
                result[roomId]["xpPerSecond"] = (item.value / duration).toFixed(4);
                result[roomId]["xpPerHour"] = (3600 * item.value / duration).toFixed(2);
            }
        } else if (roomType === "GC") {
            result[roomId]["fungus"] = decimalToPercentFixed(efficiencies["fungus"]);
            result[roomId]["plant"] = decimalToPercentFixed(efficiencies["plant"]);
            result[roomId]["mineral"] = decimalToPercentFixed(efficiencies["mineral"]);

            result[roomId]["items"] = roomSettings[roomId]?.items.map(itemId => {
                if (!itemId) return null;
                const item = roomData["GC"].items[itemId];
                const duration = item.duration / efficiencies[item.type];
                return {
                    name: item.name,
                    duration: secondsToString(duration),
                }
            })
        } else if (roomType === "RR") {
            result[roomId]["efficiency"] = decimalToPercentFixed(efficiencies["efficiency"]);
        }
    })

    return result;
}

export { alignmentOptions, computeProductivity };