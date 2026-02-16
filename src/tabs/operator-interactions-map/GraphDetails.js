import { useMemo } from "react";
import { useOperators, useSkills } from "../../DataProvider";
import { OperatorImage } from "../../components/ImageHandler";
import "./OperatorInteractionsMap.css";
import Trigger from "./Trigger";

export default function GraphDetails({ graph, viewSpec, selectedNode }) {
    const [skills, skillsLoading] = useSkills();
    const [operators, operatorsLoading] = useOperators();

    const focusIds = useMemo(() => {
        switch (viewSpec.mode) {
            case "operator":
                return [viewSpec.ids[0]]
            case "trigger":
                return []
            case "team":
                return viewSpec.ids.filter(x => x)
            case "path":
                return viewSpec.ids.split(0, 2)
            default:
                return []
        }
    }, [viewSpec]);

    const interactions = useMemo(() => {
        const outAdj = {};
        graph.edges.forEach(e => {
            if (!(e.source in outAdj)) outAdj[e.source] = [e.target];
            else outAdj[e.source].push(e.target);
        })

        const interactions = [];
        const dfs = (node, path, hasFocus) => {
            outAdj[node]?.forEach(next => {
                if (path.includes(next)) return;
                if (next.includes("|")) {
                    if (hasFocus || focusIds.includes(next.split("|")[0]))
                        interactions.push({ start: path[0], triggers: path.slice(1), end: next });
                } else {
                    dfs(next, [...path, next], hasFocus);
                }
            })
        }

        Object.keys(outAdj).forEach(node => {
            if (node.includes("|")) {
                dfs(node, [node], focusIds.length === 0 || focusIds.includes(node.split("|")[0]));
            }
        })

        return interactions.sort((a, b) => {
            if (a.start === b.start) {
                if (a.end === b.end) {
                    for (let i = 0; ; i++) {
                        if (i >= a.triggers.length) return -1;
                        if (i >= b.triggers.length) return 1;
                        if (a.triggers[i] === b.triggers[i]) continue;
                        return a.triggers[i].localeCompare(b.triggers[i])
                    }
                } else {
                    return a.end.localeCompare(b.end);
                }
            } else {
                return a.start.localeCompare(b.start);
            }
        });
    }, [graph, focusIds]);

    const filtered = useMemo(() => {
        if (selectedNode === null) return interactions;
        return interactions.filter(x => x.start === selectedNode || x.end === selectedNode || x.triggers.includes(selectedNode))
    }, [interactions, selectedNode]);

    if (operatorsLoading || skillsLoading) return null;

    const constructSkillCell = (id) => {
        const [opId, type] = id.split("|");
        return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
            <OperatorImage id={opId} width={20} height={24} />
            <span>{operators[opId].name}</span> -
            <span>{skills[opId][type].name}</span>
            <span style={{ fontStyle: "italic", color: "#aaa", fontSize: "0.75rem" }}>({type.charAt(0).toUpperCase() + type.slice(1)})</span>
        </div>
    }

    const constructRow = (path, i) => {
        const { start, triggers, end } = path;
        return <tr key={i} className="skill-interactions-table-row">
            <td
                data-tooltip-id="operatorInteractionsMapSkills"
                data-tooltip-content={start}
            >
                {constructSkillCell(start)}
            </td>
            <td>{triggers.reduce((acc, trigger) => {
                if(acc.length > 0) acc.push(" › ");
                acc.push(<Trigger key={acc.length} id={trigger} />);
                return acc
            }, [])}</td>
            <td
                data-tooltip-id="operatorInteractionsMapSkills"
                data-tooltip-content={end}
            >
                {constructSkillCell(end)}
            </td>
        </tr>
    }

    return <div style={{overflowY: "auto"}}>
        <table className="skill-interactions-table" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
            <tr>
                <th>Source Skill</th>
                <th>Trigger Path</th>
                <th>Affected Skill</th>
            </tr>
        </thead>
        <tbody>
            {filtered.map((x, i) => constructRow(x, i))}
        </tbody>
    </table>
    </div>;
}
