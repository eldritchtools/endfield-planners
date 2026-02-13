import {
    ReactFlow,
    Controls,
    useNodesState,
    useEdgesState,
    useReactFlow,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useEffect, useMemo, useState } from 'react';
import OperatorNode from './OperatorNode';
import SkillNode from './SkillNode';
import TriggerNode from './TriggerNode';
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force';
import "./GraphView.css";

const nodeTypes = {
    "operator": OperatorNode,
    "skill": SkillNode,
    "trigger": TriggerNode,
};

function layout(nodes, edges) {
    const layoutNodes = nodes
        .map(n => ({
            id: n.id,
            width: n.type === "operator" ? 120 : 50,
            height: n.type === "operator" ? 225 : 30,
            x: n.position?.x ?? 0,
            y: n.position?.y ?? 0
        }));

    const sim = forceSimulation(layoutNodes)
        .force("charge", forceManyBody().strength(-20))
        .force("link", forceLink(edges)
            .id(d => d.id)
            .distance(100)
            .strength(0.5)
        )
        .force("collision", forceCollide().radius(d =>
            Math.max(d.width, d.height) / 2 + 80
        ))
        .force("center", forceCenter(0, 0))
        .stop();

    for (let i = 0; i < 300; ++i) sim.tick();

    return nodes.map((n, i) => ({
        ...n,
        position: { x: layoutNodes[i].x, y: layoutNodes[i].y }
    }));
}


export function GraphView({ graph }) {
    const reactFlowInstance = useReactFlow();
    const [selectedNode, setSelectedNode] = useState(null);
    const [inConnections, setInConnections] = useState({});
    const [outConnections, setOutConnections] = useState({});
    const [graphChanged, setGraphChanged] = useState(false);
    const subgraph = useMemo(() => {
        const { nodes, edges } = graph;
        const [nonSkillNodes, skillNodesMapping] = nodes.reduce(([nsn, snm], n) => {
            if (n.type === "skill") snm[n.id] = n.parentId;
            else nsn.push(n);
            return [nsn, snm];
        }, [[], {}]);
        const remappedEdges = Object.values(edges.reduce((acc, edge) => {
            const e = {
                source: edge.source in skillNodesMapping ? skillNodesMapping[edge.source] : edge.source,
                target: edge.target in skillNodesMapping ? skillNodesMapping[edge.target] : edge.target,
            }
            const id = `${e.source}->${e.target}`;
            if (!(id in acc)) acc[id] = e;
            return acc;
        }, {}));
        const layoutedNodes = layout(nonSkillNodes, remappedEdges).reduce((acc, n) => { acc[n.id] = n; return acc; }, {});
        const finalNodes = nodes.map(n => n.id in layoutedNodes ? layoutedNodes[n.id] : n)
        // return {nodes: finalNodes, edges};

        const [inCons, outCons] = edges.reduce(([inAcc, outAcc], e) => {
            if (!(e.source in outAcc)) outAcc[e.source] = [e.target];
            else outAcc[e.source].push(e.target);
            if (!(e.target in inAcc)) inAcc[e.target] = [e.source];
            else inAcc[e.target].push(e.source);
            return [inAcc, outAcc];
        }, [{}, {}]);
        setInConnections(inCons);
        setOutConnections(outCons);

        setSelectedNode(null);
        setGraphChanged(true);
        return { nodes: finalNodes, edges };
    }, [graph]);
    const [nodes, setNodes, onNodesChange] = useNodesState(subgraph.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(subgraph.edges);

    useEffect(() => {
        const styledNodes = (graphChanged ? subgraph.nodes : nodes).map(n => ({
            ...n,
            style: {
                ...n.style,
                opacity: selectedNode ? (n.id === selectedNode ||
                    inConnections[selectedNode]?.includes(n.id) ||
                    outConnections[selectedNode]?.includes(n.id) ?
                    1 : 0.4
                ) : 1
            },
            data: {
                ...n.data,
                selected: selectedNode === n.id ? true : false,
                inSelect: selectedNode !== null && inConnections[n.id]?.includes(selectedNode),
                outSelect: selectedNode !== null && outConnections[n.id]?.includes(selectedNode)
            }
        }));

        const edgeStroke = (e) => {
            if (selectedNode) {
                if (e.source === selectedNode) return "#22d3ee";
                if (e.target === selectedNode) return "#f59e0b";
                return "#555";
            } else {
                return "#ddd";
            }
        }

        const styledEdges = (graphChanged ? subgraph.edges : edges).map(e => ({
            ...e,
            style: {
                ...e.style,
                stroke: edgeStroke(e)
            }
        }))

        if (reactFlowInstance && graphChanged) reactFlowInstance.fitView({ padding: 0.1 })
        setGraphChanged(false);
        setNodes(styledNodes);
        setEdges(styledEdges);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subgraph, graphChanged, inConnections, outConnections, selectedNode, setNodes, setEdges]);

    return (
        <div style={{ height: '80vh', border: "1px #ddd solid", borderRadius: "1rem" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onNodeClick={(_, node) => { if (node.type !== "operator") setSelectedNode(node.id) }}
                onPaneClick={() => setSelectedNode(null)}
                onEdgesChange={onEdgesChange}
                defaultEdgeOptions={{ type: "smoothstep" }}
                proOptions={{ hideAttribution: true }}
                nodesConnectable={false}
                edgesFocusable={false}
                fitView
            >
                <Controls />
            </ReactFlow>
        </div>
    );
}
