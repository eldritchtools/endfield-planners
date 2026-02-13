const CHUNK_LIMIT = 20;

/* eslint-disable no-restricted-globals */
self.onmessage = function (e) {
    const { command, params } = e.data;
    if (command === "start") {
        computeRates(params);
    } else if (command === "cancel") {
        cancelled = true;
    }
};

let cancelled = false;

function buildBinomial(n, p) {
    let dp = Array.from({ length: n + 1 }, () => new Float32Array(n + 1).fill(0));
    dp[0][0] = 1;

    for (let i = 1; i <= n; i++) {
        for (let k = 0; k < i; k++) {
            if (dp[i - 1][k] === 0) continue;
            dp[i][k] += dp[i - 1][k] * (1 - p);
            dp[i][k + 1] += dp[i - 1][k] * p;
        }
    }
    return dp;
}

const sixStarDist = buildBinomial(10, 0.04)[10];
const featDist = buildBinomial(10, 0.25);
const nonfeatDist = buildBinomial(10, 0.125);

function computeRates({ maxPulls, pullsUntil6, target6Type, pulled6, target6, pullsOnBanner }) {
    const p6Max = 4;
    const stateSize = p6Max * (target6 + 1);
    cancelled = false;

    let currDP = new Float32Array(stateSize).fill(0);
    let nextDP = new Float32Array(stateSize).fill(0);

    function getIndex(p6, k) {
        return (p6 * (target6 + 1) + k);
    }

    function fromIndex(idx) {
        let tmp = idx;
        let k = tmp % (target6 + 1); tmp = Math.floor(tmp / (target6 + 1));

        return { p6: tmp, k };
    }

    currDP[getIndex(p6Max - pullsUntil6, pulled6)] = 1.0;

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
            let bannerPull = pullsOnBanner + currentPull;

            for (let idx = 0; idx < stateSize; idx++) {
                const probState = currDP[idx];
                if (probState < 1e-15) continue;

                let { p6, k } = fromIndex(idx);

                if (bannerPull === 8 && target6Type === "Featured" && k === 0) {
                    for (let n6 = 1; n6 <= 10; n6++) {
                        let rate6 = n6 === 1 ? sixStarDist[0] + sixStarDist[1] : sixStarDist[n6];
                        for (let nfeatured = 1; nfeatured <= n6; nfeatured++) {
                            let rateFeatured = nfeatured === 1 ? featDist[n6][0] + featDist[n6][1] : featDist[n6][nfeatured];
                            let newk = Math.min(k + nfeatured, target6);
                            nextDP[getIndex(0, newk)] += probState * rate6 * rateFeatured;
                        }
                        e6 += n6 * probState * rate6;
                        e5 += (10 - n6) * probState * rate6 * 0.15;
                        e4 += (10 - n6 - (10 - n6) * 0.15) * probState * rate6;
                    }
                } else if (p6 === 3) {
                    for (let n6 = 1; n6 <= 10; n6++) {
                        let rate6 = n6 === 1 ? sixStarDist[0] + sixStarDist[1] : sixStarDist[n6];
                        if (target6Type === "Featured") {
                            for (let nfeatured = 1; nfeatured <= n6; nfeatured++) {
                                let rateFeatured = featDist[n6][nfeatured];
                                let newk = Math.min(k + nfeatured, target6);
                                nextDP[getIndex(0, newk)] += probState * rate6 * rateFeatured;
                            }
                            nextDP[getIndex(0, k)] += probState * rate6 * featDist[n6][0];
                        } else if (target6Type === "Specific NonFeatured") {
                            for (let nnonfeatured = 1; nnonfeatured <= n6; nnonfeatured++) {
                                let rateNonFeatured = nonfeatDist[n6][nnonfeatured];
                                let newk = Math.min(k + nnonfeatured, target6);
                                nextDP[getIndex(0, newk)] += probState * rate6 * rateNonFeatured;
                            }
                            nextDP[getIndex(0, k)] += probState * rate6 * nonfeatDist[n6][0];
                        } else if (target6Type === "Any") {
                            let newk = Math.min(k + n6, target6);
                            nextDP[getIndex(0, newk)] += probState * rate6;
                        }
                        e6 += n6 * probState * rate6;
                        e5 += (10 - n6) * probState * rate6 * 0.15;
                        e4 += (10 - n6 - (10 - n6) * 0.15) * probState * rate6;
                    }
                } else {
                    for (let n6 = 0; n6 <= 10; n6++) {
                        let rate6 = sixStarDist[n6];
                        let newp6 = n6 > 0 ? 0 : p6 + 1;
                        if (target6Type === "Featured") {
                            for (let nfeatured = 0; nfeatured <= n6; nfeatured++) {
                                let rateFeatured = featDist[n6][nfeatured];
                                let newk = Math.min(k + nfeatured, target6);
                                nextDP[getIndex(newp6, newk)] += probState * rate6 * rateFeatured;
                            }
                        } else if (target6Type === "Specific NonFeatured") {
                            for (let nnonfeatured = 0; nnonfeatured <= n6; nnonfeatured++) {
                                let rateNonFeatured = nonfeatDist[n6][nnonfeatured];
                                let newk = Math.min(k + nnonfeatured, target6);
                                nextDP[getIndex(newp6, newk)] += probState * rate6 * rateNonFeatured;
                            }
                        } else if (target6Type === "Any") {
                            let newk = Math.min(k + n6, target6);
                            nextDP[getIndex(newp6, newk)] += probState * rate6;
                        }

                        e6 += n6 * probState * rate6;
                        if (n6 === 0) {
                            let d5 = 10 * 0.15 + Math.pow(0.85, 10);
                            e5 += d5 * probState * rate6;
                            e4 += (10 - n6 - d5) * probState * rate6;
                        } else {
                            let d5 = (10 - n6) * 0.15;
                            e5 += d5 * probState * rate6;
                            e4 += (10 - n6 - d5) * probState * rate6;
                        }
                    }
                }
            }

            if (bannerPull >= 10 && (bannerPull - 2) % 8 === 0) {
                // Treat as another "step" for clean transitions
                if ((bannerPull - 2) % 16 === 0) {
                    // 18, 34, ...
                    if (target6Type === "Featured" || target6Type === "Any") {
                        [currDP, nextDP] = [nextDP, currDP];
                        nextDP.fill(0);
                        for (let idx = 0; idx < stateSize; idx++) {
                            const probState = currDP[idx];
                            if (probState < 1e-15) continue;

                            let { p6, k } = fromIndex(idx);
                            const newK = Math.min(k + 1, target6);
                            nextDP[getIndex(p6, newK)] += probState;
                        }
                    }
                    e6++;
                } else {
                    // 10, 26, ...
                    if (target6Type === "Specific NonFeatured" || target6Type === "Any") {
                        [currDP, nextDP] = [nextDP, currDP];
                        nextDP.fill(0);
                        for (let idx = 0; idx < stateSize; idx++) {
                            const probState = currDP[idx];
                            if (probState < 1e-15) continue;

                            let { p6, k } = fromIndex(idx);
                            const newK = Math.min(k + 1, target6);
                            nextDP[getIndex(p6, newK)] += probState;
                        }
                    }
                    e6++;
                }

            }

            // compile probabilities for each k
            let probK = new Float32Array(target6 + 1).fill(0);
            for (let idx = 0; idx < stateSize; idx++) {
                const probState = nextDP[idx];
                if (probState < 1e-15) continue;
                let k = idx % (target6 + 1);
                probK[k] += probState;
            }

            let probAtLeastK = new Float32Array(target6 + 1).fill(0);
            probAtLeastK[target6] = probK[target6];
            for (let i = target6 - 1; i > 0; i--)
                probAtLeastK[i] = probK[i] + probAtLeastK[i + 1];

            results.push({ pull: currentPull, probAtLeastK: [...probAtLeastK], e6: e6, e5: e5, e4: e4 });

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