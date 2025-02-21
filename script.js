"use strict";

const writtenGroups = ["ethics", "solution", "written"];
const grades = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 5.0];
let prevInputs = {};

const weights = {
    // Ethics
    "ethics-familiarization": 1,
    "ethics-autonomy": 3,
    "ethics-commitment": 1,
    "ethics-resources": 1,
    // Solution
    "solution-related-work": 2,
    "solution-goals": 5,
    "solution-quality": 5,
    "solution-documentation": 2,
    // Written
    "written-structure": 2,
    "written-length": 1,
    "written-presentation": 2,
    "written-language": 2,
    "written-figures": 1,
    "written-references": 1,
    // Defense
    "defense-clarity": 2,
    "defense-slides": 2,
    "defense-contribution": 2,
    "defense-related-work": 1,
    "defense-language": 1,
    "defense-time": 1,
    "defense-discussion": 2,
};

function groupSetToIndex(...groupSet) {
    let i = 0;
    for (let group of groupSet) {
        const idx = writtenGroups.indexOf(group);
        if (idx == -1)
            continue;
        i += 1 << idx;
    }
    return i;
}

function gradeToUnit(grade) {
    return (4 - grade) / 3;
}

function unitToGrade(unit) {
    return 4 - 3 * unit;
}

const s2i = groupSetToIndex;
const g2u = gradeToUnit;

const schemes = [{
    name: "LMU Scheme",
    measure: new Map([
        [s2i(), g2u(4.0)],
        [s2i("ethics"), g2u(4.0)],
        [s2i("written"), g2u(3.0)],
        [s2i("solution"), g2u(2.7)],
        [s2i("ethics", "written"), g2u(2.7)],
        [s2i("ethics", "solution"), g2u(2.3)],
        [s2i("solution", "written"), g2u(1.3)],
        [s2i("ethics", "solution", "written"), g2u(1.0)],
    ])
}];

function start() {
    document.querySelector("#grade-table").addEventListener("input", () => computeGrades());
    document.querySelector("#scheme").addEventListener("change", () => computeGrades());
    const hash = location.hash.slice(1);
    if (hash != "") {
        try {
            const inputs = stringToInputs(window.atob(hash));
            console.log("Loaded inputs from Hash:", inputs);
            setInputs(inputs);
        } catch (e) {
            location.hash = "";
            console.error(e);
        }
    }
    computeGrades();
}

function localizeGrade(grade) {
    if (isNaN(grade))
        return "-";
    return grade.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

function computeGrades() {
    const inputs = readInputs();
    const schemeId = parseInt(document.querySelector("#scheme").value);
    location.hash = window.btoa(`scheme=${schemeId}&` + inputsToString(inputs));
    const groupedInputs = groupInputs(inputs);
    const groupedGrades = computeGroupedGrades(groupedInputs);

    // Write group grades to the DOM:
    for (let [group, grade] of Object.entries(groupedGrades)) {
        const val = isNaN(grade) ? "" : "&Oslash; " + localizeGrade(grade);
        document.querySelector(`span[data-group=${group}]`).innerHTML = val;
    }

    // Aggregate grades via Choquet integral:
    const writtenGrade = toNearestGrade(aggregateChoquet(groupedGrades, schemes[schemeId]));
    const defenseGrade = toNearestGrade(groupedGrades["defense"]);

    // Write overall grades to the DOM:
    document.querySelector("#written").innerHTML = localizeGrade(writtenGrade);
    document.querySelector("#oral").innerHTML = localizeGrade(defenseGrade);

    prevInputs = inputs;
}

function readInputs() {
    const inputs = document.querySelectorAll("#grade-table input");
    const inputValues = {};
    for (let input of inputs) {
        const group = input.getAttribute("data-group");
        let val = input.value;
        val = val == "" ? NaN : parseFloat(val);
        if (val > 4 && val < 5) {
            if (input.id in prevInputs && prevInputs[input.id][0] == 5.0)
                val = 4.0;
            else
                val = 5.0;
            input.value = val.toFixed(1);
        }
        inputValues[input.id] = [val, group];
    }
    return inputValues;
}

function inputsToString(inputs) {
    const parts = [];
    for (let [key, [val, group]] of Object.entries(inputs)) {
        if (isNaN(val))
            continue;
        parts.push(`${key}=${val}`);
    }
    return parts.join("&");
}

function stringToInputs(str) {
    const inputs = {};
    for (let part of str.split("&")) {
        if (part == "")
            continue;
        const [key, val] = part.split("=");
        inputs[key] = val;
    }
    return inputs;
}


function setInputs(grades) {
    for (let [id, grade] of Object.entries(grades)) {
        const input = document.getElementById(id);
        if (input == null)
            continue;
        input.value = "" + grade;
    }
}

function groupInputs(inputValues) {
    const groups = {};
    for (let [key, [val, group]] of Object.entries(inputValues)) {
        if (!(group in groups))
            groups[group] = {};
        groups[group][key] = val;
    }
    return groups;
}

function computeGroupedGrades(groupedInputs) {
    const grades = {};
    for (let [group, inputs] of Object.entries(groupedInputs)) {
        const groupGrades = [];
        const groupWeights = [];
        for (let [id, val] of Object.entries(inputs)) {
            groupGrades.push(val);
            groupWeights.push(weights[id]);
        }
        grades[group] = weightedAverage(groupGrades, groupWeights);
    }
    return grades;
}

function weightedAverage(grades, weights) {
    let sum = 0;
    let totalWeight = 0;
    for (let i = 0; i < grades.length; i++) {
        if (isNaN(grades[i]))
            continue;
        if (grades[i] > 4)
            return 5.0;
        sum += grades[i] * weights[i];
        totalWeight += weights[i];
    }
    if (totalWeight == 0)
        return NaN;
    return sum / totalWeight;
}

function toNearestGrade(grade) {
    if (isNaN(grade))
        return NaN;
    return grades.reduce((prev, curr) => Math.abs(prev - grade) > Math.abs(curr - grade) ? curr : prev);
}

function aggregateChoquet(groups, { measure }) {
    const groupsUnit = [];
    for (let [group, grade] of Object.entries(groups)) {
        if (writtenGroups.indexOf(group) == -1)
            continue;
        if (isNaN(grade))
            return NaN;
        if (grade > 4)
            return 5.0;
        groupsUnit.push([group, gradeToUnit(grade)]);
    }
    groupsUnit.sort((a, b) => a[1] - b[1]);
    const sortedGroups = groupsUnit.map(([group, _]) => group);
    const gradeDiffs = [];
    for (let [_, grade] of groupsUnit) {
        if (gradeDiffs.length == 0)
            gradeDiffs.push(grade);
        else
            gradeDiffs.push(grade - groupsUnit[gradeDiffs.length - 1][1]);
    }

    let integral = 0;

    for (let i = 0; i < sortedGroups.length; i++) {
        const subset = sortedGroups.slice(i, undefined);
        const weight = measure.get(s2i(...subset));
        integral += gradeDiffs[i] * weight;
    }

    return unitToGrade(integral);
}

document.addEventListener("DOMContentLoaded", start);
