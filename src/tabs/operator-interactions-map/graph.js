import { useMemo } from "react";
import { useSkills, useTriggers } from "../../DataProvider";
import { useProfiles } from "@eldritchtools/shared-components";
import { MarkerType } from "@xyflow/react";

const SKILL_TYPES = ["attack", "skill", "combo", "ultimate"];

function toSkillId(opId, type) {
    return `${opId}|${type}`;
}

function useInteractionsGraph() {
    const [triggers, triggersLoading] = useTriggers();
    const [skills, skillsLoading] = useSkills();
    const { profileData } = useProfiles();

    const graph = useMemo(() => {
        if (triggersLoading || skillsLoading) return null;

        const result = {
            skills: {},
            triggers: Object.keys(triggers).reduce((acc, op) => {
                acc[op] = { in: new Set(), out: new Set() };
                return acc;
            }, {})
        };

        Object.entries(skills).forEach(([opId, opSkills]) => {
            if (opId in profileData.operators && profileData.operators[opId].disabled) return;

            Object.entries(opSkills).forEach(([type, skill]) => {
                const id = toSkillId(opId, type);
                const data = { in: new Set(), out: new Set() };
                skill.inTriggers?.forEach(triggerId => {
                    data.in.add(triggerId);
                    result.triggers[triggerId].out.add(id);
                    const triggerData = triggers[triggerId];
                    if ("subtypes" in triggerData) {
                        (triggerData["subtypes"] ?? []).forEach(tId => {
                            data.in.add(tId);
                            result.triggers[tId].out.add(id);
                        })
                    }
                })
                skill.outTriggers?.forEach(triggerId => {
                    data.out.add(triggerId);
                    result.triggers[triggerId].in.add(id);
                    const triggerData = triggers[triggerId];
                    if ("subtypes" in triggerData) {
                        (triggerData["subtypes"] ?? []).forEach(tId => {
                            data.out.add(tId);
                            result.triggers[tId].in.add(id);
                        })
                    }
                })
                result.skills[id] = data;
            })
        })

        Object.keys(triggers).forEach(id => {
            const expand = [id];
            while (expand.length > 0) {
                const triggerData = triggers[expand[0]];
                if ("intriggers" in triggerData) {
                    triggerData.intriggers.forEach(oId => {
                        result.triggers[oId].out.add(id);
                        result.triggers[id].in.add(oId);
                    });
                }
                if ("outtriggers" in triggerData) {
                    triggerData.outtriggers.forEach(oId => {
                        result.triggers[oId].in.add(id);
                        result.triggers[id].out.add(oId);
                    });
                }
                if ("parents" in triggerData)
                    triggerData.parents.forEach(x => expand.push(x));

                expand.shift();
            }
        })

        return {
            skills: Object.entries(result.skills).reduce((acc, [id, data]) => { acc[id] = { in: [...data.in], out: [...data.out] }; return acc; }, {}),
            triggers: Object.entries(result.triggers).reduce((acc, [id, data]) => { acc[id] = { in: [...data.in], out: [...data.out] }; return acc; }, {}),
        };
    }, [triggers, triggersLoading, skills, skillsLoading, profileData.operators]);

    if (triggersLoading || skillsLoading) return [null, true];

    return [graph, false];
}

function toEdge(source, target) {
    return { source, target };
}

// function extendGraph(graph, nodes, edges, nodeType, nodeId, directions) {
//     const node = graph[nodeType][nodeId];

// }

function projectOperatorGraph(graph, id) {
    if (!id) return { nodes: [], edges: [] };
    const nodes = new Set();
    const edges = [];

    SKILL_TYPES.forEach(type => {
        const skillId = toSkillId(id, type);
        const skillNode = graph.skills[skillId];
        nodes.add(skillId);

        skillNode.in.forEach(triggerId => {
            nodes.add(triggerId);
            edges.push(toEdge(triggerId, skillId));
            const expand = [triggerId];
            while (expand.length > 0) {
                graph.triggers[expand[0]].in.forEach(oId => {
                    nodes.add(oId);
                    edges.push(toEdge(oId, expand[0]));
                    if (!oId.includes("|")) expand.push(oId);
                });
                expand.shift();
            }
        });

        skillNode.out.forEach(triggerId => {
            nodes.add(triggerId);
            edges.push(toEdge(skillId, triggerId));
            const expand = [triggerId];
            while (expand.length > 0) {
                graph.triggers[expand[0]].out.forEach(oId => {
                    nodes.add(oId);
                    edges.push(toEdge(expand[0], oId));
                    if (!oId.includes("|")) expand.push(oId);
                });
                expand.shift();
            }
        });
    });

    return { nodes, edges };
}

function projectTriggerGraph(graph, id) {
    if (!id) return { nodes: [], edges: [] };
    const nodes = new Set();
    const edges = [];

    nodes.add(id);
    const expand = [id];
    while (expand.length > 0) {
        graph.triggers[expand[0]].in.forEach(oId => {
            nodes.add(oId);
            edges.push(toEdge(oId, expand[0]));
            if (!oId.includes("|")) expand.push(oId);
        })
        expand.shift();
    }

    expand.push(id);
    while (expand.length > 0) {
        graph.triggers[expand[0]].out.forEach(oId => {
            nodes.add(oId);
            edges.push(toEdge(expand[0], oId));
            if (!oId.includes("|")) expand.push(oId);
        })
        expand.shift();
    }

    return { nodes, edges };
}

function projectTeamGraph(graph, ids) {
    if (ids.filter(x => x).length === 0) return { nodes: [], edges: [] };

    const triggers = {};
    const addTriggerRelationship = (id, direction, newId) => {
        if (!(id in triggers)) triggers[id] = { in: [], out: [] };
        triggers[id][direction].push(newId);
    }

    ids.forEach(id => {
        if (!id) return;
        SKILL_TYPES.forEach(type => {
            const skillId = toSkillId(id, type);
            graph.skills[skillId].in.forEach(triggerId => {
                addTriggerRelationship(triggerId, "out", skillId);
                const expand = [triggerId];
                while (expand.length > 0) {
                    graph.triggers[expand[0]].in.forEach(oId => {
                        if (!oId.includes("|")) {
                            addTriggerRelationship(oId, "out", expand[0]);
                            expand.push(oId);
                        }
                    })
                    expand.shift();
                }
            })
            graph.skills[skillId].out.forEach(triggerId => {
                addTriggerRelationship(triggerId, "in", skillId);
                const expand = [triggerId];
                while (expand.length > 0) {
                    graph.triggers[expand[0]].out.forEach(oId => {
                        if (!oId.includes("|")) {
                            addTriggerRelationship(oId, "in", expand[0]);
                            expand.push(oId);
                        }
                    })
                    expand.shift();
                }
            })
        })
    });

    const nodes = new Set();
    const edges = [];
    Object.entries(triggers).forEach(([id, data]) => {
        if (data.in.length === 0 || data.out.length === 0) return;
        nodes.add(id);

        data.in.forEach(skillId => {
            nodes.add(skillId);
            edges.push(toEdge(skillId, id));
        })
        data.out.forEach(skillId => {
            nodes.add(skillId);
            edges.push(toEdge(id, skillId));
        })
    });
    return { nodes, edges };
}

function projectPathGraph(graph, startId, endId) {
    if (!startId || !endId) return { nodes: [], edges: [] };

}

function processGraph(subgraph, focusIds) {
    const createOperatorNode = (id) =>
    ({
        id,
        type: "operator",
        data: { id: id, highlighted: focusIds.includes(id) },
        position: { x: 0, y: 0 }
    })

    const createSkillNode = (id, opId, type) => {
        const pos = { x: 0, y: 0 };
        switch (type) {
            case "attack": pos.y = 100; break;
            case "skill": pos.y = 135; break;
            case "combo": pos.y = 170; break;
            case "ultimate": pos.y = 205; break;
            default: break;
        }

        return {
            id,
            type: "skill",
            data: { opId: opId, type: type, id: id },
            position: pos,
            parentId: opId,
            extent: "parent",
            draggable: false
        };
    }

    const createTriggerNode = (id) =>
        ({ id, type: "trigger", data: { id: id, highlighted: focusIds.includes(id) }, position: { x: 0, y: 0 } })

    const createEdge = (start, end) =>
    ({
        id: `${start}->${end}`,
        source: start,
        target: end,
        type: "default",
        animated: true,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
        },
        selectable: false,
        focusable: false
    })

    const operators = new Set();
    const nodes = [];
    const edgeSet = new Set();
    const edges = [];

    const nodesMapped = {};
    subgraph.nodes.forEach(nodeId => {
        if (nodeId.includes("|")) {
            const [opId, type] = nodeId.split("|");
            if (!operators.has(opId)) {
                operators.add(opId);
                const node = createOperatorNode(opId)
                nodes.push(node);
                nodesMapped[opId] = nodes[node];
            }
            nodes.push(createSkillNode(nodeId, opId, type));
        } else {
            const node = createTriggerNode(nodeId);
            nodes.push(node);
            nodesMapped[nodeId] = node;
        }
    });
    
    const adjIn = {};
    const adjOut = {};
    subgraph.edges.forEach(edge => {
        const e = createEdge(edge.source, edge.target);
        if (!edgeSet.has(e.id)) {
            edgeSet.add(e.id);
            edges.push(e);
            
            if(!(e.source in adjOut)) adjOut[e.source] = [e.target];
            else adjOut[e.source].push(e.target);
            if(!(e.target in adjIn)) adjIn[e.target] = [e.source];
            else adjOut[e.target].push(e.source);
        }
    });

    if(focusIds.length === 1) {
        
    }


    return { nodes, edges };
};

function projectGraph(graph, viewSpec) {
    let subgraph;
    switch (viewSpec.mode) {
        case "operator":
            subgraph = projectOperatorGraph(graph, viewSpec.ids[0]);
            return processGraph(subgraph, viewSpec.ids);
        case "trigger":
            subgraph = projectTriggerGraph(graph, viewSpec.ids[0]);
            return processGraph(subgraph, viewSpec.ids);
        case "team":
            subgraph = projectTeamGraph(graph, viewSpec.ids);
            return processGraph(subgraph, viewSpec.ids);
        case "path":
            subgraph = projectPathGraph(graph, viewSpec.ids[0], viewSpec.ids[1]);
            return processGraph(subgraph, viewSpec.ids);
        default:
            return { nodes: [], edges: [] };
    }
}

export { useInteractionsGraph, projectGraph };