import { useMemo, useState } from "react";
import { useFacilities, useItems, useRecipes } from "../../DataProvider";
import { FacilityImage, ItemImage } from "../../components/ImageHandler";
import "./FactoryCalculator.css";
import { processRecipeGroups } from "./processRecipeGroups";

export default function RecipesTable({ profileData, computedProducts, computedRecipes }) {
    const [recipes, recipesLoading] = useRecipes();
    const [facilities, facilitiesLoading] = useFacilities();
    const [items, itemsLoading] = useItems();
    const [collapsed, setCollapsed] = useState(new Set());

    const [recipeData, recipesGrouped] = useMemo(() => {
        if (recipesLoading) return [];
        return processRecipeGroups(profileData.factoryCalculator, computedProducts, computedRecipes, recipes);
    }, [profileData.factoryCalculator, computedProducts, computedRecipes, recipes, recipesLoading]);

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
            if(!data) return;
            rows.push(<tr key={`${recipeGroup.id}-${rows.length}`} className="factory-recipes-table-row">
                <td style={{ padding: "0.5rem" }}>{data.id === "transfer" ? "" : recipeGroup.qty}</td>
                <td style={{ padding: "0.5rem" }}>
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
                <td style={{ padding: "0.5rem" }}>
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
                <td style={{ padding: "0.5rem" }}>
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
                <td style={{ padding: "0.5rem" }}>
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