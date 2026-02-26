import { useProfiles } from "@eldritchtools/shared-components";
import { regionData } from "./regionData";
import { useCallback, useMemo, useState } from "react";
import Select from "react-select";
import { selectStyle } from "../../styles";
import { ItemImage } from "../../components/ImageHandler";
import { useFacilities, useItems, useRecipes } from "../../DataProvider";
import { NumInputComponent } from "../../components/utils";
import { ItemTextSelector } from "../../components/ItemSelector";
import Modal from "../../components/Modal";
import RecipesTable from "./RecipesTable";
import { compute } from "./compute";

const resetButtonStyle = { fontWeight: "bold", width: "24px", height: "24px", padding: 0, fontSize: "1rem", cursor: "pointer" };

function ControlsPanel({ items, facilities, recipes, profileData, setProfileData, computedProducts, computedRecipes }) {
    const [
        region, setRegion,
        incomeOverrides, setIncomeOverride, resetIncomeOverride, resetAllIncomeOverride,
        transfer, setTransfer, resetTransfer,
        scoreOverrides, setScoreOverride, resetScoreOverride, resetAllScoreOverride,
        targetProducts, setTargetProducts, resetTargetProducts, resetAllTargetProducts,
        settings, setSettings
    ] = useMemo(() => {
        const region = profileData.factoryCalculator.currentRegion;
        const setRegion = v => setProfileData(p => ({
            ...p,
            factoryCalculator: {
                ...p.factoryCalculator,
                currentRegion: v
            }
        }))
        const incomeOverrides = profileData.factoryCalculator.resourceIncomeOverrides[region];
        const setIncomeOverride = (id, v) => setProfileData(p => ({
            ...p,
            factoryCalculator: {
                ...p.factoryCalculator,
                resourceIncomeOverrides: {
                    ...p.factoryCalculator.resourceIncomeOverrides,
                    [region]: { ...(p.factoryCalculator.resourceIncomeOverrides[region] ?? {}), [id]: v }
                }
            }
        }));
        const resetIncomeOverride = (id) => setProfileData(p => {
            const { [id]: rem, ...rest } = p.factoryCalculator.resourceIncomeOverrides[region] ?? {};
            return {
                ...p,
                factoryCalculator: {
                    ...p.factoryCalculator,
                    resourceIncomeOverrides: {
                        ...p.factoryCalculator.resourceIncomeOverrides, [region]: rest
                    }
                }
            }
        });
        const resetAllIncomeOverride = () => setProfileData(p => {
            const { [region]: rem, ...rest } = p.factoryCalculator.resourceIncomeOverrides ?? {};
            return {
                ...p,
                factoryCalculator: {
                    ...p.factoryCalculator,
                    resourceIncomeOverrides: rest
                }
            }
        });
        const transfer = profileData.factoryCalculator.transfers[region];
        const setTransfer = (key, v) => setProfileData(p => ({
            ...p,
            factoryCalculator: {
                ...p.factoryCalculator,
                transfers: {
                    ...p.factoryCalculator.transfers,
                    [region]: { ...(p.factoryCalculator.transfers[region] ?? {}), [key]: v }
                }
            }
        }));
        const resetTransfer = () => setProfileData(p => {
            const { [region]: rem, ...rest } = p.factoryCalculator.transfers ?? {};
            return {
                ...p,
                factoryCalculator: {
                    ...p.factoryCalculator,
                    transfers: rest
                }
            }
        });
        const scoreOverrides = profileData.factoryCalculator.scoreOverrides[region];
        const setScoreOverride = (id, v) => setProfileData(p => ({
            ...p,
            factoryCalculator: {
                ...p.factoryCalculator,
                scoreOverrides: {
                    ...p.factoryCalculator.scoreOverrides,
                    [region]: { ...p.factoryCalculator.scoreOverrides[region], [id]: v }
                }
            }
        }));
        const resetScoreOverride = (id) => setProfileData(p => {
            const { [id]: rem, ...rest } = p.factoryCalculator.scoreOverrides[region] ?? {};
            return {
                ...p,
                factoryCalculator: {
                    ...p.factoryCalculator,
                    scoreOverrides: {
                        ...p.factoryCalculator.scoreOverrides, [region]: rest
                    }
                }
            }
        });
        const resetAllScoreOverride = () => setProfileData(p => {
            const { [region]: rem, ...rest } = p.factoryCalculator.scoreOverrides ?? {};
            return {
                ...p,
                factoryCalculator: {
                    ...p.factoryCalculator,
                    scoreOverrides: rest
                }
            }
        });
        const targetProducts = profileData.factoryCalculator.targetProducts[region];
        const setTargetProducts = (id, v) => setProfileData(p => ({
            ...p,
            factoryCalculator: {
                ...p.factoryCalculator,
                targetProducts: {
                    ...p.factoryCalculator.targetProducts,
                    [region]: { ...p.factoryCalculator.targetProducts[region], [id]: v }
                }
            }
        }));
        const resetTargetProducts = (id) => setProfileData(p => {
            const { [id]: rem, ...rest } = p.factoryCalculator.targetProducts[region] ?? {};
            return {
                ...p,
                factoryCalculator: {
                    ...p.factoryCalculator,
                    targetProducts: {
                        ...p.factoryCalculator.targetProducts, [region]: rest
                    }
                }
            }
        });
        const resetAllTargetProducts = () => setProfileData(p => {
            const { [region]: rem, ...rest } = p.factoryCalculator.targetProducts ?? {};
            return {
                ...p,
                factoryCalculator: {
                    ...p.factoryCalculator,
                    targetProducts: rest
                }
            }
        });
        const settings = profileData.factoryCalculator.settings;
        const setSettings = (key, v) => setProfileData(p => ({
            ...p,
            factoryCalculator: {
                ...p.factoryCalculator,
                settings: { ...p.factoryCalculator.settings, [key]: v }
            }
        }));

        return [
            region, setRegion,
            incomeOverrides, setIncomeOverride, resetIncomeOverride, resetAllIncomeOverride,
            transfer, setTransfer, resetTransfer,
            scoreOverrides, setScoreOverride, resetScoreOverride, resetAllScoreOverride,
            targetProducts, setTargetProducts, resetTargetProducts, resetAllTargetProducts,
            settings, setSettings
        ];
    }, [
        profileData.factoryCalculator.currentRegion,
        profileData.factoryCalculator.resourceIncomeOverrides,
        profileData.factoryCalculator.transfers,
        profileData.factoryCalculator.scoreOverrides,
        profileData.factoryCalculator.targetProducts,
        profileData.factoryCalculator.settings,
        setProfileData
    ]);

    const [addScoreItemOpen, setAddScoreItemOpen] = useState(false);
    const [addTargetItemOpen, setAddTargetItemOpen] = useState(false);
    const [itemModal, setItemModal] = useState("");
    const [valueModal, setValueModal] = useState("");

    const regionOptions = useMemo(() => Object.entries(regionData).map(([id, { name }]) => ({ value: id, label: name })), []);

    const filterFunc = (candidate, input) => {
        if (!input || input.length === 0) return true;
        return candidate.label.toLowerCase().includes(input.toLowerCase());
    }

    const itemComponent = (id, value, setValue, resetValue) =>
        <div key={id} style={{ display: "flex", flexDirection: "column", width: "100px", alignItems: "center", gap: "0.2rem" }}>
            <ItemImage id={id} width={48} height={48} />
            <div>
                {setValue ?
                    <NumInputComponent value={value} setValue={setValue} disabled={setValue === null} /> :
                    `${value}/min`
                }
                {resetValue ?
                    <button onClick={resetValue} style={resetButtonStyle}>
                        ↺
                    </button> :
                    null
                }
            </div>
            <span style={{ textAlign: "center" }}>{items[id].name}</span>
        </div>

    const regionScoredItems = useMemo(() => {
        const scores = Object.fromEntries(Object.entries(items).filter(
            ([id, data]) => "outpostValue" in data && data.outpostValue.some(x => x.zone === region)
        ).map(
            ([id, data]) => [id, data.outpostValue.find(x => x.zone === region).value]
        ))
        return { ...scores, ...scoreOverrides };
    },
        [items, region, scoreOverrides]
    );

    const currentScore = useMemo(() => {
        let score = 0;
        Object.entries(targetProducts ?? {}).forEach(([id, qty]) => score += (regionScoredItems[id] ?? 0) * qty);
        Object.entries(computedProducts ?? {}).forEach(([id, qty]) => score += (regionScoredItems[id] ?? 0) * qty);
        return Math.round(score * 100) / 100;
    }, [regionScoredItems, computedProducts, targetProducts]);

    const powerConsumed = useMemo(() => {
        let power = 0;
        Object.entries(computedRecipes ?? {}).forEach(([id, qty]) => {
            if (id === "transfer") return;
            power += Math.ceil(qty - 1e-8) * facilities[recipes[id].facility].power
        })
        return power;
    }, [computedRecipes, facilities, recipes])

    return <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>Region</h3>
            <Select
                options={regionOptions}
                value={{ value: region, label: regionData[region].name }}
                onChange={opt => setRegion(opt.value)}
                filterOption={filterFunc}
                styles={selectStyle}
            />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>Mining Income</h3>
            <button onClick={resetAllIncomeOverride} disabled={incomeOverrides === null} style={resetButtonStyle}>
                ↺
            </button>
        </div>
        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
            The theoretical amount of resources your factory mines per minute. You can find these numbers in the report menu of the AIC in game. The default values are the maximum amount mineable at max development level.
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 100px)", width: "100%", gap: "0.2rem" }}>
            {Object.entries(regionData[region].income).map(([id, qty]) =>
                itemComponent(id, incomeOverrides?.[id] ?? qty, v => setIncomeOverride(id, v), () => resetIncomeOverride(id))
            )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>Transfer</h3>
            <button onClick={resetTransfer} disabled={transfer === null} style={resetButtonStyle}>
                ↺
            </button>
        </div>
        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
            Materials transferred through regional or metastorage transfer.
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ItemTextSelector
                value={transfer ? transfer.item : ""} setValue={v => setTransfer("item", v)}
                options={Object.entries(items).map(([id, data]) => ({ id: id, name: data.name }))}
            />
            <div>
                <NumInputComponent
                    value={transfer ? transfer.qty : ""}
                    setValue={v => setTransfer("qty", v)}
                />
                <span>/hr</span>
            </div>
            <div>
                {transfer && transfer.qty ?
                    `${Math.round(transfer.qty / 60 * 100) / 100}/min` :
                    null
                }
            </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>Item Values</h3>
            <button onClick={() => { setAddScoreItemOpen(true); setItemModal(""); setValueModal(""); }}>
                Add Item
            </button>
            <button onClick={resetAllScoreOverride} disabled={scoreOverrides === null} style={resetButtonStyle}>
                ↺
            </button>
        </div>
        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
            Assign values to items for use in optimizing calculations. Defaults to the stock values in outposts.
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 100px)", width: "100%", gap: "0.2rem" }}>
            {Object.entries(regionScoredItems).map(([id, qty]) =>
                itemComponent(id, qty, v => setScoreOverride(id, v), () => resetScoreOverride(id))
            )}
        </div>
        <Modal isOpen={addScoreItemOpen} onClose={() => setAddScoreItemOpen(false)} noClose={true}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>Choose Item and Value</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <ItemTextSelector
                        value={itemModal} setValue={setItemModal}
                        options={Object.entries(items).map(([id, data]) => ({ id: id, name: data.name }))}
                    />
                    <NumInputComponent value={valueModal} setValue={setValueModal} />
                </div>
                <div style={{ display: "flex", gap: " 0.5rem" }}>
                    <button onClick={() => {
                        if (itemModal !== "" && valueModal !== "") {
                            setScoreOverride(itemModal, valueModal);
                            setAddScoreItemOpen(false);
                        }
                    }}>
                        Add Item
                    </button>
                    <button onClick={() => setAddScoreItemOpen(false)}>
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>Required Outputs</h3>
            <button onClick={() => { setAddTargetItemOpen(true); setItemModal(""); setValueModal(""); }}>
                Add Item
            </button>
            <button onClick={resetAllTargetProducts} disabled={targetProducts === null} style={resetButtonStyle}>
                ↺
            </button>
        </div>
        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
            Require specific items to be produced in the factory.
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 100px)", width: "100%", gap: "0.2rem" }}>
            {Object.entries(targetProducts ?? {}).map(([id, qty]) =>
                itemComponent(id, qty, v => setTargetProducts(id, v), () => resetTargetProducts(id))
            )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>
                Computed Outputs
            </h3>
        </div>
        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
            Items selected by the optimizer for the factory to produce. Items only appear here if the solver's mode is "Optimize".
        </span>
        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>

        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 100px)", width: "100%", gap: "0.2rem" }}>
            {Object.entries(computedProducts ?? {}).map(([id, qty]) =>
                itemComponent(id, qty, null)
            )}
        </div>
        <Modal isOpen={addTargetItemOpen} onClose={() => setAddTargetItemOpen(false)} noClose={true}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>Choose Item and Amount</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <ItemTextSelector
                        value={itemModal} setValue={setItemModal}
                        options={Object.entries(items).map(([id, data]) => ({ id: id, name: data.name }))}
                    />
                    <NumInputComponent value={valueModal} setValue={setValueModal} />
                </div>
                <div style={{ display: "flex", gap: " 0.5rem" }}>
                    <button onClick={() => {
                        if (itemModal !== "" && valueModal !== "") {
                            setTargetProducts(itemModal, valueModal);
                            setAddTargetItemOpen(false);
                        }
                    }}>
                        Add Item
                    </button>
                    <button onClick={() => setAddTargetItemOpen(false)}>
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>
                Solver
            </h3>
        </div>
        <span style={{ color: "#aaa", fontSize: "0.8rem", textAlign: "start" }}>
            Settings for the solver. Also displays the total score generated and power consumed. <br />
            Group by changes how recipes are displayed on the table below. The Output mode can sometimes unnecessarily "break apart" some recipes to multiple rows or miss some numbers particularly for circular recipes like planting. <br />
            Mode changes whether the solver only computes the required recipes for the specified target outputs or attempts to use all remaining resources to maximize the score.
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                Group by:
                <select
                    value={settings.grouping}
                    onChange={e => setSettings("grouping", e.target.value)}
                >
                    <option value={"facility"}>Facility</option>
                    <option value={"output"}>Output</option>
                </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                Mode:
                <select
                    value={settings.mode}
                    onChange={e => setSettings("mode", e.target.value)}
                >
                    <option value={"solve"}>Solve</option>
                    <option value={"optimize"}>Optimize</option>
                </select>
            </div>
            <span>Score: {currentScore}/min</span>
            <span>Power Consumed: {powerConsumed}</span>
        </div>
    </div>
}

export default function FactoryCalculatorTab() {
    const { profileData, setProfileData } = useProfiles();
    const [items, itemsLoading] = useItems();
    const [recipes, recipesLoading] = useRecipes();
    const [facilities, facilitiesLoading] = useFacilities();
    const [feasible, setFeasible] = useState(true);

    const factoryItems = useMemo(() => itemsLoading ? {} :
        Object.fromEntries(Object.entries(items).filter(
            ([id, data]) => !("hideFactory" in data) || !data.hideFactory
        )), [items, itemsLoading]
    );

    const recomputeRecipes = useCallback((optimize = false) => {
        const region = profileData.factoryCalculator.currentRegion;
        const incomeOverrides = profileData.factoryCalculator.resourceIncomeOverrides[region];
        const transfer = profileData.factoryCalculator.transfers[region];
        const targetProducts = profileData.factoryCalculator.targetProducts[region];
        const scoreOverrides = profileData.factoryCalculator.scoreOverrides[region];
        const inputLimits = { ...regionData[region].income, ...incomeOverrides };

        const scores = {
            ...Object.fromEntries(
                Object.entries(items)
                    .map(([id, data]) => [id, data.outpostValue?.find(x => x.zone === region)?.value])
                    .filter(([id, x]) => x)
            ),
            ...scoreOverrides
        }

        const { feasible, recipeCounts, resultCounts } = compute(recipes, facilities, inputLimits, transfer, targetProducts, scores, optimize);
        if (!feasible) {
            setFeasible(false);
            return;
        }
        setFeasible(true);

        Object.entries(targetProducts ?? {}).forEach(([id, qty]) => {
            if (id in resultCounts) resultCounts[id] -= qty;
            else resultCounts[id] = -qty;
        })

        const cleanedResults =
            Object.fromEntries(Object.entries(resultCounts)
                .filter(([id, qty]) => Math.abs(qty) > 1e-4)
                .map(([id, qty]) => [id, Math.round(qty * 100) / 100])
            )

        return [{ ...cleanedResults }, { ...recipeCounts }]

    }, [recipes, facilities, items,
        profileData.factoryCalculator.currentRegion,
        profileData.factoryCalculator.resourceIncomeOverrides,
        profileData.factoryCalculator.transfers,
        profileData.factoryCalculator.targetProducts,
        profileData.factoryCalculator.scoreOverrides]);

    const [computedProducts, computedRecipes] = useMemo(() => {
        if (recipesLoading || facilitiesLoading || itemsLoading) return [{}, {}];
        switch (profileData.factoryCalculator.settings.mode) {
            case "solve":
                return recomputeRecipes();
            case "optimize":
                return recomputeRecipes(true);
            default:
                return [{}, {}];
        }
    }, [recipesLoading, facilitiesLoading, itemsLoading, recomputeRecipes,
        profileData.factoryCalculator.settings
    ]);

    if (itemsLoading || recipesLoading || facilitiesLoading) return <div>Loading...</div>;

    return <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "1rem" }}>
        <h2 style={{ marginBottom: 0 }}>Factory Calculator</h2>
        <p style={{ textAlign: "start", maxWidth: "1000px", lineHeight: "1.3" }}>
            Maximize the stock bills you produce in your factory or assign custom score values to items to find the best combination of them to produce.
            <br /> <br />
            The optimizer will find solutions that only partially use some facilities or production lines. Numbers may be slightly off for partial buildings due to rounding errors.
            <br /> <br />
            The optimizer does not account for interchangeable products (e.g. Buck Capsule vs Canned Citrome products). You have to specify them in Required Outputs if you want to see a specific one.
            <br /> <br />
            Note that the highest score is not always the optimal configuration (e.g. if you'd need to consume an extra battery or a number of other situations). You may want to experiment with Required Outputs until you find the configuration that best works for you.
        </p>
        <ControlsPanel items={factoryItems} facilities={facilities} recipes={recipes}
            profileData={profileData} setProfileData={setProfileData}
            computedProducts={computedProducts} computedRecipes={computedRecipes}
        />
        <div style={{ display: "flex", justifyContent: "center" }}>
            {feasible ?
                <div style={{ overflowX: "auto" }}>
                    <RecipesTable profileData={profileData} computedProducts={computedProducts} computedRecipes={computedRecipes} />
                </div> :
                <span style={{ color: "#dc3545" }}>Configuration is not feasible.</span>
            }
        </div>
    </div>
}