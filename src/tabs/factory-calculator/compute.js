import solver from "javascript-lp-solver";

const LIMITS = {
    Forge_of_the_Sky: 8
}

function compute(recipes, facilities, inputLimits, transfer, targets, scores, optimize = false) {
    const constraints = {};
    const variables = {};
    Object.entries(recipes).forEach(([id, data]) => {
        const variable = { power: facilities[data.facility].power, score: 0 };
        data.inputs?.forEach(input => {
            const num = -(60 / data.duration * input.qty);
            constraints[input.id] = { min: 0 };
            variable[input.id] = num;
            if (input.id in scores) variable.score += num * scores[input.id];
        });
        data.outputs?.forEach(output => {
            const num = 60 / data.duration * output.qty
            variable[output.id] = num;
            if (output.id in inputLimits) variable[`${output.id}-limit`] = 60 / data.duration * output.qty;
            if (output.id in scores) variable.score += num * scores[output.id];
        });
        if (data.facility in LIMITS) variable[data.facility] = 1;
        variables[id] = variable;
    })

    Object.entries(LIMITS).forEach(([id, limit]) => { constraints[id] = { max: limit }; });
    Object.entries(inputLimits ?? {}).forEach(([id, qty]) => { constraints[`${id}-limit`] = { max: qty }; });
    Object.entries(targets ?? {}).forEach(([id, qty]) => { constraints[id] = { min: qty } });
    if (transfer && transfer.item && transfer.qty) {
        constraints["transfer"] = { max: transfer.qty / 60 };
        variables["transfer"] = { [transfer.item]: 1, transfer: 1 };
    }

    let results;
    if (optimize) {
        const model1 = {
            "optimize": "score",
            "opType": "max",
            "variables": variables,
            "constraints": constraints
        };

        const result1 = solver.Solve(model1);
        const maxScore = result1.result;

        const constraints2 = {
            ...constraints,
            score: { min: maxScore - 1e-6, max: maxScore + 1e-6 }
        };

        const model2 = {
            optimize: "power",
            opType: "min",
            variables: variables,
            constraints: constraints2
        };

        results = solver.Solve(model2);
    } else {
        const model = {
            "optimize": "power",
            "opType": "min",
            "variables": variables,
            "constraints": constraints
        }

        results = solver.Solve(model);
    }

    const resultCounts = {};
    const recipeCounts = {};
    Object.entries(results).forEach(([id, count]) => {
        if (id === "feasible" || id === "bounded" || id === "result") return;
        recipeCounts[id] = count;
        if (id === "transfer") {
            resultCounts[transfer.item] += count;
            return;
        }
        const recipe = recipes[id];
        recipe.inputs?.forEach(input => {
            if (input.id in resultCounts) resultCounts[input.id] -= count * 60 / recipe.duration * input.qty;
            else resultCounts[input.id] = -count * 60 / recipe.duration * input.qty;
        });
        recipe.outputs?.forEach(output => {
            if (output.id in resultCounts) resultCounts[output.id] += count * 60 / recipe.duration * output.qty;
            else resultCounts[output.id] = count * 60 / recipe.duration * output.qty;
        });
    });

    return { feasible: results.feasible, recipeCounts: recipeCounts, resultCounts: resultCounts };
}

export { compute };