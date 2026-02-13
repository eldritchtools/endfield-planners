import { useMemo, useState } from 'react';
import OperatorSelectorText from '../../components/OperatorSelectorText';
import { useOperators } from '../../DataProvider';
import { useProfiles } from '@eldritchtools/shared-components';
import TriggerSelector from './TriggerSelector';
import { projectGraph, useInteractionsGraph } from './graph';
import { GraphView } from './GraphView';
import SkillTooltip from './SkillTooltip';
import { ReactFlowProvider } from '@xyflow/react';

function GraphControls({ viewSpec, onChange }) {
    const [operators, operatorsLoading] = useOperators();
    const { profileData } = useProfiles();

    const availableOperators = useMemo(() =>
        operatorsLoading ? [] :
            Object.keys(operators).filter(x => x in profileData.operators ? !profileData.operators[x].disabled : true),
        [operators, operatorsLoading, profileData.operators]
    )

    if (operatorsLoading) return null;

    const selector = () => {
        switch (viewSpec.mode) {
            case 'operator':
                return <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", flexWrap: "wrap" }}>
                    Select an operator to view their interactions:
                    <OperatorSelectorText
                        value={viewSpec.ids[0]}
                        setValue={v => onChange({ ...viewSpec, ids: [v] })}
                        options={availableOperators} />
                </div>
            case 'trigger':
                return <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.2rem", textAlign: "start" }}>
                    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", flexWrap: "wrap" }}>
                        Select a trigger to view the operators that interact with it:
                        <TriggerSelector value={viewSpec.ids[0]} setValue={v => onChange({ ...viewSpec, ids: [v] })} />
                    </div>
                    Some of the options are not implemented since they aren't used as triggers or are universal to all operators.
                </div>
            case 'team':
                return <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.5rem", textAlign: "start" }}>
                    <div>
                        Select up to 4 operators to view their interactions between each other:
                        <button onClick={() => onChange({ ...viewSpec, ids: [null, null, null, null] })}>Clear</button>
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                        {
                            viewSpec.ids.map((id, ind) =>
                                <OperatorSelectorText
                                    key={ind}
                                    value={id}
                                    setValue={v => onChange({ ...viewSpec, ids: viewSpec.ids.map((x, i) => ind === i ? v : x) })}
                                    options={availableOperators}
                                />
                            )
                        }
                    </div>
                </div>
            case 'path':
                return <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.5rem", textAlign: "start" }}>
                    <div>
                        Select two operators to see how one can interact with another:
                        <button onClick={() => onChange({ ...viewSpec, ids: [null, null] })}>Clear</button>
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                        <OperatorSelectorText
                            value={viewSpec.ids[0]}
                            setValue={v => onChange({ ...viewSpec, ids: [v, viewSpec.ids[1]] })}
                            options={availableOperators}
                        />
                        ➔
                        <OperatorSelectorText
                            value={viewSpec.ids[1]}
                            setValue={v => onChange({ ...viewSpec, ids: [viewSpec.ids[0], v] })}
                            options={availableOperators}
                        />
                    </div>
                </div>
            default:
                return null;
        }

    }
    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            Select type of interactions to view:
            <select
                value={viewSpec.mode.type}
                onChange={e => {
                    switch (e.target.value) {
                        case "operator":
                            onChange({ mode: "operator", ids: [null] })
                            return;
                        case "trigger":
                            onChange({ mode: "trigger", ids: [null] })
                            return;
                        case "team":
                            onChange({ mode: "team", ids: [null, null, null, null] })
                            return;
                        case "path":
                            onChange({ mode: "path", ids: [null, null] })
                            return;
                        default:
                            return;
                    }
                }}
            >
                <option value="operator">Operator</option>
                <option value="trigger">Trigger</option>
                <option value="team">Team</option>
                {/* <option value="path">Path</option> */}
            </select>
        </div>
        {selector()}
    </div>;
}

function GraphDetails() {
    return null;
}

export default function OperatorInteractionsMapTab() {
    const [viewSpec, setViewSpec] = useState({
        mode: "operator",
        ids: [null]
    });

    const [graph, graphLoading] = useInteractionsGraph();
    const subgraph = useMemo(() => projectGraph(graph, viewSpec), [graph, viewSpec]);

    return <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h2 style={{ marginBottom: 0 }}>Operator Interactions Map</h2>
        <p style={{ textAlign: "start", maxWidth: "1200px", lineHeight: "1.3" }}>
            Find interactions between operators.
            <br />
            The positions of the nodes on the graph are automatically computed which is still pretty rough, especially when there's a lot being displayed.
            <br />
            Clicking on a skill or status will highlight all the other nodes connected to it. This should make viewing things easier. You can also move nodes around if you want.
            <br />
            Operators can be disabled in the profiles page if you don't want them to show up. This setting is shared with the Dijiang Planner.
        </p>
        <GraphControls viewSpec={viewSpec} onChange={setViewSpec} />
        {graphLoading ?
            null :
            <ReactFlowProvider>
                <GraphView graph={subgraph} />
            </ReactFlowProvider>
        }
        <GraphDetails graph={subgraph} />
        <SkillTooltip />
    </div>;
}
