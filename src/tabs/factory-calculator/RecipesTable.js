import { useMemo, useState } from "react";
import { useFacilities, useItems, useRecipes } from "../../DataProvider";
import { FacilityImage, ItemImage } from "../../components/ImageHandler";
import "./FactoryCalculator.css";

export default function RecipesTable({ profileData, computedProducts, computedRecipes }) {
    const [recipes, recipesLoading] = useRecipes();
    const [facilities, facilitiesLoading] = useFacilities();
    const [items, itemsLoading] = useItems();
    const [collapsed, setCollapsed] = useState(new Set());

    const [products, transfer] = useMemo(() => {
        const region = profileData.factoryCalculator.currentRegion;
        const transfer = profileData.factoryCalculator.transfers[region];
        const targetProducts = profileData.factoryCalculator.targetProducts[region];

        const products = { ...targetProducts };
        Object.entries(computedProducts ?? {}).forEach(([id, qty]) => {
            if (id in products) products[id] += qty;
            else products[id] = qty;
        })

        return [products, transfer];
    }, [
        profileData.factoryCalculator.currentRegion,
        profileData.factoryCalculator.targetProducts,
        profileData.factoryCalculator.transfers,
        computedProducts
    ]);

    const recipeData = useMemo(() => {
        if (recipesLoading) return {};
        if (transfer && transfer.item && transfer.qty) {
            return {
                ...recipes, transfer: {
                    "duration": 60,
                    "facility": null,
                    "id": "transfer",
                    "outputs": [
                        {
                            "id": transfer.item,
                            "qty": 1
                        }
                    ]
                }
            };
        } else {
            return recipes;
        }
    }, [recipes, recipesLoading, transfer]);

    const recipesGrouped = useMemo(() => {
        if (recipesLoading) return [];
        const grouping = profileData.factoryCalculator.settings.grouping;

        if (grouping === "output") {
            const tempRecipes = { ...computedRecipes };
            const recipeStack = [];
            const constructTree = (recipeId, recipeQty) => {
                const data = recipeData[recipeId];
                const result = { id: recipeId, qty: recipeQty };
                recipeStack.push(result);

                const children = [];
                const orphans = {};

                data.inputs?.forEach(({ id: inputId, qty: inputQty }) => {
                    let demand = recipeQty * inputQty / data.duration;
                    while (Math.abs(demand) > 1e-7) {
                        const inputRecipeId = Object.keys(tempRecipes).find(id => recipeData[id].outputs.some(y => y.id === inputId));
                        if (!inputRecipeId) break;
                        const perRecipe = recipeData[inputRecipeId].outputs.find(x => x.id === inputId).qty / recipeData[inputRecipeId].duration;
                        const inputRecipeQty = Math.min(tempRecipes[inputRecipeId], demand / perRecipe);
                        tempRecipes[inputRecipeId] -= inputRecipeQty;
                        if (Math.abs(tempRecipes[inputRecipeId]) < 1e-7) delete tempRecipes[inputRecipeId];
                        demand -= inputRecipeQty * perRecipe;
                        const prev = recipeStack.find(x => x.id === inputRecipeId);
                        if (prev) {
                            prev.qty += inputRecipeQty;
                            if (inputRecipeQty > 0.0001) {
                                const child = constructTree(inputRecipeId, inputRecipeQty);
                                if(child.children) {
                                    child.children.forEach(({id, qty}) => {
                                        if(id in orphans) orphans[id] += qty;
                                        else orphans[id] = qty;
                                    })
                                }
                            }
                        } else {
                            children.push(constructTree(inputRecipeId, inputRecipeQty));
                        }
                    }
                });

                Object.entries(orphans).forEach(([rId, qty]) => {
                    const match = children.find(({id}) => id === rId);
                    if(match) match.qty += qty;
                    else children.push({id: rId, qty: qty});
                });

                if (children && children.length > 0) result.children = children;
                result.qty = Math.round(result.qty * 100) / 100;
                recipeStack.pop();
                return result;
            }

            return Object.entries(products ?? {}).map(([id, qty]) => {
                if (Math.abs(qty) < 1e-4) return null;
                const recipeId = Object.keys(tempRecipes).find(rId => recipeData[rId].outputs.some(y => y.id === id));
                const recipeQty = qty * recipeData[recipeId].outputs.find(x => x.id === id).qty * recipeData[recipeId].duration / 60;

                return constructTree(recipeId, recipeQty);
            }).filter(x => x);
        } else if (grouping === "facility") {
            return Object.entries(computedRecipes ?? {})
                .map(([id, qty]) => ({ id: id, qty: Math.round(qty * 100) / 100 }))
                .sort((a, b) => a.id.localeCompare(b.id));
        }
    }, [products, computedRecipes, profileData.factoryCalculator.settings.grouping, recipeData, recipesLoading]);

    const toggleRowCollapse = id => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    const recipeGroupToRows = (recipeGroup, index) => {
        const rows = [];

        if (facilitiesLoading || itemsLoading) return rows;

        const handleRecipeGroup = (recipeGroup, level, pathId) => {
            const data = recipeData[recipeGroup.id];
            rows.push(<tr key={`${recipeGroup.id}-${rows.length}`} className="factory-recipes-table-row">
                <td style={{padding: "0.5rem"}}>{data.id === "transfer" ? "" : recipeGroup.qty}</td>
                <td style={{padding: "0.5rem"}}>
                    <div style={{ display: "flex", alignItems: "center", textAlign: "start", paddingLeft: `${level * 24}px` }}>
                        {recipeGroup.children && (
                            <button
                                onClick={() => toggleRowCollapse(pathId)}
                                style={{ fontSize: "1.1rem", padding: 0, margin: 0, background: "transparent", border: "1px solid transparent" }}>
                                {collapsed.has(pathId) ? "▶" : "▼"}
                            </button>
                        )}
                        {
                            data.id === "transfer" ?
                                "Transfer" : <>
                                    <FacilityImage id={data.facility} width={48} height={48} />
                                    {facilities[data.facility].name}
                                </>
                        }
                    </div>
                </td>
                <td style={{padding: "0.5rem"}}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        {data.inputs?.map(input => {
                            const num = (60 / data.duration) * input.qty;
                            return <div key={input.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <ItemImage id={input.id} width={48} height={48} name={items[input.id].name} />
                                <span>{Math.round(num * recipeGroup.qty * 100) / 100}/min</span>
                            </div>
                        })}
                    </div>
                </td>
                <td style={{padding: "0.5rem"}}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        {data.outputs?.map(output => {
                            const num = (60 / data.duration) * output.qty;
                            return <div key={output.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <ItemImage id={output.id} width={48} height={48} name={items[output.id].name} />
                                <span>{Math.round(num * recipeGroup.qty * 100) / 100}/min</span>
                            </div>
                        })}
                    </div>
                </td>
                <td style={{padding: "0.5rem"}}>
                    {data.facility ? facilities[data.facility].power : 0}
                </td>
            </tr>);

            if (!collapsed.has(pathId))
                recipeGroup.children?.forEach((x, i) => handleRecipeGroup(x, level + 1, `${pathId}.${i}`));
        }

        handleRecipeGroup(recipeGroup, 0, index);
        return rows;
    }

    return <table className="factory-recipes-table">
        <thead>
            <tr>
                <th>Qty</th>
                <th>Facility</th>
                <th>Input</th>
                <th>Output</th>
                <th>Power</th>
            </tr>
        </thead>
        <tbody>
            {(recipesGrouped ?? []).map((x, i) => recipeGroupToRows(x, `${i}`))}
        </tbody>
    </table>
}