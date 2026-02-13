const CHUNK_LIMIT = 20;

/* eslint-disable no-restricted-globals */
self.onmessage = function (e) {
    const { command, params } = e.data;
    if (command === "start") {
        computeRates({...params, specificToggle: params.specificToggle === "Specific"});
    } else if (command === "cancel") {
        cancelled = true;
    }
};

let cancelled = false;
let BANNER_OPTIONS = 5;

function computeRates({ maxPulls, pullsUntil6, pullsUntil5, specificToggle, target6, pullsUntil300 }) {
    const p6Max = 80, p5Max = 10;
    const stateSize = p6Max * p5Max * (target6 + 1);
    cancelled = false;

    let currDP = new Float64Array(stateSize).fill(0);
    let nextDP = new Float64Array(stateSize).fill(0);

    function getIndex(p6, p5, k) {
        return ((p6 * p5Max + p5) * (target6 + 1) + k);
    }

    function fromIndex(idx) {
        let tmp = idx;
        let k = tmp % (target6 + 1); tmp = Math.floor(tmp / (target6 + 1));
        let p5 = tmp % p5Max; tmp = Math.floor(tmp / p5Max);

        return { p6: tmp, p5, k };
    }

    currDP[getIndex(p6Max - pullsUntil6, p5Max - pullsUntil5, 0)] = 1.0;

    let e6 = 0, e5 = 0, e4 = 0;
    let currentPull = 1;

    const handleChunk = () => {
        if (cancelled) {
            self.postMessage({ type: "done", cancelled: cancelled });
            return;
        }

        const results = [];
        while (results.length < CHUNK_LIMIT && currentPull <= maxPulls) {
            nextDP.fill(0);
            let bannerPull = 300 - pullsUntil300 + currentPull;

            for (let idx = 0; idx < stateSize; idx++) {
                const probState = currDP[idx];
                if (probState < 1e-15) continue;

                let { p6, p5, k } = fromIndex(idx);

                // 0.8% base rate, +5% per pull after 65, guarantee at 80th (i.e. after 79)
                let p6Rate;
                if (p6 < 65) p6Rate = 0.008;
                else if (p6 < 79) p6Rate = 0.008 + 0.05 * (p6 - 64);
                else p6Rate = 1;

                let k6 = Math.min(k + 1, target6);
                if (specificToggle) {
                    nextDP[getIndex(0, 0, k6)] += probState * p6Rate / BANNER_OPTIONS;
                    nextDP[getIndex(0, 0, k)] += probState * p6Rate * (BANNER_OPTIONS - 1) / BANNER_OPTIONS;
                } else {
                    nextDP[getIndex(0, 0, k6)] += probState * p6Rate;
                }

                // guarantee at 10th (i.e. after 9), 8% otherwise, capped by 1-p6Rate to handle guarantee case
                let p5Rate = Math.min((p5 === 9) ? 1.0 : 0.08, 1 - p6Rate);
                nextDP[getIndex(p6 + 1, 0, k)] += probState * p5Rate;

                // remainder after other two
                let p4Rate = (1 - p6Rate - p5Rate);
                nextDP[getIndex(p6 + 1, p5 + 1, k)] += probState * p4Rate;

                e6 += probState * p6Rate;
                e5 += probState * p5Rate;
                e4 += probState * p4Rate;
            }

            if (bannerPull === 300) {
                // Treat as another "step" for clean transitions
                [currDP, nextDP] = [nextDP, currDP];
                nextDP.fill(0);

                for (let idx = 0; idx < stateSize; idx++) {
                    const probState = currDP[idx];
                    if (probState < 1e-15) continue;

                    let { p6, p5, k } = fromIndex(idx);
                    const newK = Math.min(k + 1, target6);
                    nextDP[getIndex(p6, p5, newK)] += probState;
                }
                e6++;
            }

            // compile probabilities for each k
            let totalProb = 0;
            let probK = new Float64Array(target6 + 1).fill(0);
            for (let idx = 0; idx < stateSize; idx++) {
                const probState = nextDP[idx];
                totalProb += probState;
                if (probState < 1e-15) continue;
                let k = idx % (target6 + 1);
                probK[k] += probState;
            }

            let probAtLeastK = new Float64Array(target6 + 1).fill(0);
            probAtLeastK[target6] = probK[target6];
            for (let i = target6 - 1; i > 0; i--)
                probAtLeastK[i] = probK[i] + probAtLeastK[i + 1];

            results.push({ pull: currentPull, probAtLeastK: [...probAtLeastK], e6: e6, e5: e5, e4: e4 });

            // normalize probabilities if the drift gets too big
            if (Math.abs(totalProb - 1) > 1e-12) {
                for (let i = 0; i < stateSize; i++) {
                    nextDP[i] /= totalProb;
                }
            }

            // Swap DP arrays
            [currDP, nextDP] = [nextDP, currDP];
            currentPull++;
        }
        self.postMessage({ type: "results", results: results });

        if (currentPull >= maxPulls) {
            self.postMessage({ type: "done", cancelled: cancelled });
        }

        setTimeout(handleChunk, 0);
    }

    handleChunk();
}