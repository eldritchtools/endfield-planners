import { Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, useEdgesState, useNodesInitialized, useNodesState, useReactFlow } from "@xyflow/react";
import { useFacilities, useItems, useRecipes } from "../../DataProvider";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { processRecipeGroups } from "./processRecipeGroups";
import Dagre from "dagre";
import { FacilityImage, ItemImage } from "../../components/ImageHandler";
import { useProfiles } from "@eldritchtools/shared-components";

function constructGraph(grouping, recipeGroups, recipes, products) {
    if (recipeGroups.length === 0) return { nodes: [], edges: [] };

    const createRecipeNode = (group, id, qty) =>
    ({
        id: `${group}:${id}`,
        type: "recipe",
        data: { id: id, qty: qty },
        position: { x: 0, y: 0 }
    })

    const createMaterialNode = (group, id, qty) =>
    ({
        id: `${group}:${id}`,
        type: "material",
        data: { id: id, qty: qty, product: id in products },
        position: { x: 0, y: 0 }
    })

    const createEdge = (group, start, end) =>
    ({
        id: `${group}:${start}->${end}`,
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

    const nodes = [];
    const edges = [];

    const edgesSet = new Set();
    const nodesMapped = {};
    if (grouping === "output") {
        const handleRecipeGroup = ({ id, qty, children }, i) => {
            const data = recipes[id];
            const recipeNode = createRecipeNode(i, id, qty);
            if (recipeNode.id in nodesMapped) {
                nodesMapped[recipeNode.id].data.qty += qty;
            } else {
                nodesMapped[recipeNode.id] = recipeNode;
                nodes.push(recipeNode);
            }

            data.inputs?.forEach(input => {
                const materialNode = createMaterialNode(i, input.id, 0);
                if (materialNode.id in nodesMapped) {
                    // do nothing
                } else {
                    nodesMapped[materialNode.id] = materialNode;
                    nodes.push(materialNode);
                }
                const edge = createEdge(i, materialNode.id, recipeNode.id);
                if (!edgesSet.has(edge.id)) {
                    edgesSet.add(edge.id);
                    edges.push(edge);
                }
            })

            data.outputs?.forEach(output => {
                const num = output.qty * qty * 60 / data.duration;
                const materialNode = createMaterialNode(i, output.id, num);
                if (materialNode.id in nodesMapped) {
                    nodesMapped[materialNode.id].data.qty += num;
                } else {
                    nodesMapped[materialNode.id] = materialNode;
                    nodes.push(materialNode);
                }
                const edge = createEdge(i, recipeNode.id, materialNode.id);
                if (!edgesSet.has(edge.id)) {
                    edgesSet.add(edge.id);
                    edges.push(edge);
                }
            })

            children?.forEach(child => handleRecipeGroup(child, i));
        }

        recipeGroups.forEach((group, i) => handleRecipeGroup(group, i));
    } else if (grouping === "facility") {
        const handleRecipeGroup = ({ id, qty }) => {
            const data = recipes[id];
            const recipeNode = createRecipeNode(0, id, qty);
            nodesMapped[recipeNode.id] = recipeNode;
            nodes.push(recipeNode);

            data.inputs?.forEach(input => {
                const materialNode = createMaterialNode(0, input.id, 0);
                if (materialNode.id in nodesMapped) {
                    // do nothing
                } else {
                    nodesMapped[materialNode.id] = materialNode;
                    nodes.push(materialNode);
                }
                const edge = createEdge(0, materialNode.id, recipeNode.id);
                if (!edgesSet.has(edge.id)) {
                    edgesSet.add(edge.id);
                    edges.push(edge);
                }
            })

            data.outputs?.forEach(output => {
                const num = output.qty * qty * 60 / data.duration;
                const materialNode = createMaterialNode(0, output.id, num);
                if (materialNode.id in nodesMapped) {
                    nodesMapped[materialNode.id].data.qty += num;
                } else {
                    nodesMapped[materialNode.id] = materialNode;
                    nodes.push(materialNode);
                }
                const edge = createEdge(0, recipeNode.id, materialNode.id);
                if (!edgesSet.has(edge.id)) {
                    edgesSet.add(edge.id);
                    edges.push(edge);
                }
            })
        }

        recipeGroups.forEach((group, i) => handleRecipeGroup(group));
    }

    return { nodes, edges };
};

function RecipeNode({ data: nodeData }) {
    const [recipes, recipesLoading] = useRecipes();
    const [facilities, facilitiesLoading] = useFacilities();
    const [items, itemsLoading] = useItems();
    const { profileData } = useProfiles();

    if (recipesLoading || facilitiesLoading || itemsLoading) return null;

    if (nodeData.id === "transfer") {
        const transferId = profileData.factoryCalculator.transfers[profileData.factoryCalculator.currentRegion].item;
        if(!transferId) return null;

        return <div>
            <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5px",
                border: `2px #aaa solid`, borderRadius: "5px"
            }}>
                <span>Transfer</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <ItemImage id={transferId} width={48} height={48} name={items[transferId].name} />
                    <span>{nodeData.qty}/min</span>
                </div>
            </div>
            <Handle className="handle" type="target" position={Position.Bottom} />
            <Handle className="handle" type="source" position={Position.Top} />
        </div>
    }

    const recipe = recipes[nodeData.id];

    return <div>
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5px",
            border: `2px #aaa solid`, borderRadius: "5px"
        }}>
            <span>{facilities[recipe.facility].name} (x{Math.round(nodeData.qty * 100) / 100})</span>
            <FacilityImage id={recipe.facility} width={48} height={48} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {recipe.inputs ?
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        Inputs
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            {recipe.inputs.map(input => <div key={input.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <ItemImage id={input.id} width={48} height={48} name={items[input.id].name} />
                                <span>{Math.round(input.qty * nodeData.qty * 60 / recipe.duration * 100) / 100}/min</span>
                            </div>
                            )}
                        </div>
                    </div> :
                    null
                }
                {recipe.inputs && recipe.outputs ? "➔" : null}
                {recipe.outputs ?
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        Outputs
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            {recipe.outputs.map(output => <div key={output.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <ItemImage id={output.id} width={48} height={48} name={items[output.id].name} />
                                <span>{Math.round(output.qty * nodeData.qty * 60 / recipe.duration * 100) / 100}/min</span>
                            </div>
                            )}
                        </div>
                    </div> :
                    null
                }
            </div>
        </div>
        <Handle className="handle" type="target" position={Position.Bottom} />
        <Handle className="handle" type="source" position={Position.Top} />
    </div>
}

function MaterialNode({ data: nodeData }) {
    const [items, itemsLoading] = useItems();

    if (itemsLoading) return null;

    return <div>
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5px",
            border: `2px ${nodeData.product ? "#22c55e" : "#aaa"} solid`, borderRadius: "5px"
        }}>
            <span>{items[nodeData.id].name}</span>
            <ItemImage id={nodeData.id} width={48} height={48} name={items[nodeData.id].name} />
            <span>{Math.round(nodeData.qty * 100) / 100}/min</span>
        </div>
        <Handle className="handle" type="target" position={Position.Bottom} />
        <Handle className="handle" type="source" position={Position.Top} />
    </div>
}

const nodeTypes = { "recipe": RecipeNode, "material": MaterialNode };

function GraphView({ graph }) {
    const { fitView } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);
    const [firstLayout, setFirstLayout] = useState(true);

    const nodesInitialized = useNodesInitialized();

    const layoutElements = (nodes, edges) => {
        const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
        g.setGraph({ rankdir: "BT", ranksep: 100, nodesep: 10 });

        edges.forEach((edge) => g.setEdge(edge.source, edge.target));
        nodes.forEach((node) => {
            g.setNode(node.id, {
                ...node,
                width: node.measured?.width ?? 0,
                height: node.measured?.height ?? 0,
            })
        });

        Dagre.layout(g);

        let layoutedNodes = nodes.map((node) => {
            const position = g.node(node.id);
            // We are shifting the dagre node position (anchor=center center) to the top left
            // so it matches the React Flow node anchor point (top left).
            const x = position.x - (node.measured?.width ?? 0) / 2;
            const y = position.y - (node.measured?.height ?? 0) / 2;

            return { ...node, position: { x, y } };
        });

        return [layoutedNodes, edges];
    }

    useEffect(() => {
        const [layoutedNodes, layoutedEdges] = layoutElements(graph.nodes, graph.edges);

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
        setFirstLayout(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graph]);

    useLayoutEffect(() => {
        if (nodesInitialized && firstLayout) {
            // ignore if nodes have not yet been measured
            if (nodes.length === 0 || !nodes[0].measured) return;

            const nodeTrees = {};
            nodes.forEach(node => {
                const group = node.id.split(":")[0];
                if (group in nodeTrees) nodeTrees[group].push(node);
                else nodeTrees[group] = [node];
            })

            const edgeTrees = {};
            edges.forEach(edge => {
                const group = edge.id.split(":")[0];
                if (group in edgeTrees) edgeTrees[group].push(edge);
                else edgeTrees[group] = [edge];
            })

            let offsetX = 0;
            let gap = 200;
            const allLayoutedNodes = [];

            Object.keys(nodeTrees).forEach((group) => {
                const [layoutedNodes] = layoutElements(nodeTrees[group], edgeTrees[group]);

                const maxX = Math.max(...layoutedNodes.map(n => n.position.x + (n.width || 200)));
                const minX = Math.min(...layoutedNodes.map(n => n.position.x));

                const treeWidth = maxX - minX;

                const shiftedNodes = layoutedNodes.map(n => ({
                    ...n,
                    position: {
                        x: n.position.x + offsetX,
                        y: n.position.y
                    }
                }));

                allLayoutedNodes.push(...shiftedNodes);
                offsetX += treeWidth + gap;
            })

            setNodes([...allLayoutedNodes]);
            // setEdges([...edges]);
            setFirstLayout(false);
            fitView();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges, nodesInitialized, firstLayout]);

    return <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        proOptions={{ hideAttribution: true }}
    />;
}

export default function RecipesGraph({ profileData, computedProducts, computedRecipes }) {
    const [recipes, recipesLoading] = useRecipes();

    const [recipeData, recipesGrouped] = useMemo(() => {
        if (recipesLoading) return [];
        return processRecipeGroups(profileData.factoryCalculator, computedProducts, computedRecipes, recipes);
    }, [profileData.factoryCalculator, computedProducts, computedRecipes, recipes, recipesLoading]);

    const graph = useMemo(() => {
        const products = { ...profileData.factoryCalculator.targetProducts[profileData.factoryCalculator.currentRegion], ...computedProducts };
        return constructGraph(profileData.factoryCalculator.settings.grouping, recipesGrouped, recipeData, products);
    },
        [profileData.factoryCalculator, recipesGrouped, recipeData, computedProducts]
    );

    return <div style={{ height: '80vh', maxHeight: "800px", width: "100%", border: "1px #ddd solid", borderRadius: "1rem" }}>
        <ReactFlowProvider>
            <GraphView graph={graph} />
        </ReactFlowProvider>
    </div>
}

