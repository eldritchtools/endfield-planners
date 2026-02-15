const LATEST_VERSION = "1.3";

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

function defaultEssenceFarming() {
    return {
        high: [],
        low: [],
        settings: {
            statsShownLevel: 1,
            showStatNames: false
        }
    };
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
            essenceFarming: defaultEssenceFarming(),
            settings: defaultSettings()
        }
    }

    let migratedProfile = { ...profile };
    if (migratedProfile.latestVersion === "1.0" || migratedProfile.latestVersion === "1.1") {
        migratedProfile.latestVersion = "1.2";
        migratedProfile.dijiangPlanner.settings.defaultLevels = [2, 2];
    }

    if (migratedProfile.latestVersion === "1.2") {
        migratedProfile.latestVersion = "1.3";
        migratedProfile.essenceFarming = { high: [], low: [], settings: { statsShownLevel: 1, showStatNames: false } };
    }

    // DON'T FORGET TO UPDATE THE DEFAULTS WHEN ADDING NEW THINGS

    return migratedProfile;
}

export default migrateProfile;