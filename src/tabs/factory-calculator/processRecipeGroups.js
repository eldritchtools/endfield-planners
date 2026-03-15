function processRecipeGroups(factoryData, computedProducts, computedRecipes, recipes) {
    const region = factoryData.currentRegion;
    const transfer = factoryData.transfers[region];
    const targetProducts = factoryData.targetProducts[region];

    const products = { ...targetProducts };
    Object.entries(computedProducts ?? {}).forEach(([id, qty]) => {
        if (id in products) products[id] += qty;
        else products[id] = qty;
    })

    const recipeData = { ...recipes };
    if (transfer && transfer.item && transfer.qty) {
        recipeData.transfer = {
            "duration": 60,
            "facility": null,
            "id": "transfer",
            "outputs": [
                {
                    "id": transfer.item,
                    "qty": 1
                }
            ]
        };
    }

    const grouping = factoryData.settings.grouping;
    let result = [];
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
                            if (child.children) {
                                child.children.forEach(({ id, qty }) => {
                                    if (id in orphans) orphans[id] += qty;
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
                const match = children.find(({ id }) => id === rId);
                if (match) match.qty += qty;
                else children.push({ id: rId, qty: qty });
            });

            if (children && children.length > 0) result.children = children;
            result.qty = Math.round(result.qty * 100) / 100;
            recipeStack.pop();
            return result;
        }

        result = Object.entries(products ?? {}).map(([id, qty]) => {
            if (Math.abs(qty) < 1e-4) return null;
            const recipeId = Object.keys(tempRecipes).find(rId => recipeData[rId].outputs.some(y => y.id === id));
            if(recipeId === undefined) return {};
            const recipeQty = qty * recipeData[recipeId].outputs.find(x => x.id === id).qty * recipeData[recipeId].duration / 60;

            return constructTree(recipeId, recipeQty);
        }).filter(x => x);
    } else if (grouping === "facility") {
        result = Object.entries(computedRecipes ?? {})
            .map(([id, qty]) => ({ id: id, qty: Math.round(qty * 100) / 100 }))
            .sort((a, b) => a.id.localeCompare(b.id));
    }

    return [recipeData, result];
}

export { processRecipeGroups };