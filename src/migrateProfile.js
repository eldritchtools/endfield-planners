const LATEST_VERSION = "1.2";

function defaultDijiangPlanner() {
    return {
        "roomAssignments": {
            "CN": [null, null, null],
            "MFG-I": [null, null, null],
            "MFG-II": [null, null, null],
            "GC": [null, null, null],
            "RR": [null, null, null],
        },
        "roomSettings": {
        },
        "operatorSkills": {},
        "settings": {
            defaultLevels: [2, 2]
        }
    };
}

function defaultPullCalculator() {
    return {};
}

function defaultFactoryCalculator() {
    return {};
}

function defaultOperators() {
    return {};
}

function defaultSettings() {
    return {};
}

function migrateProfile(profile = {}) {
    if (!("latestVersion" in profile)) {
        return {
            latestVersion: LATEST_VERSION,
            dijiangPlanner: defaultDijiangPlanner(),
            pullCalculator: defaultPullCalculator(),
            factoryCalculator: defaultFactoryCalculator(),
            operators: defaultOperators(),
            settings: defaultSettings()
        }
    }

    let migratedProfile = { ...profile };
    if (migratedProfile.latestVersion === "1.0" || migratedProfile.latestVersion === "1.1") {
        migratedProfile.latestVersion = "1.2";
        migratedProfile.dijiangPlanner.settings.defaultLevels = [2, 2];
    }

    return migratedProfile;
}

export default migrateProfile;