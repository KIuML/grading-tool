import { strings } from "./strings.js";

export const grades = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 5.0];

export function gradeToUnit(grade) {
    return (4 - grade) / 3;
}

export function unitToGrade(unit) {
    return 4 - 3 * unit;
}


export function toNearestGrade(grade) {
    if (grade == null || isNaN(grade))
        return NaN;
    return grades.reduce((prev, curr) => Math.abs(prev - grade) > Math.abs(curr - grade) ? curr : prev);
}

export function gradeToName(grade, lang) {
    if (grade == null || isNaN(grade))
        return "";
    const roundedGrade = Math.round(grade);
    if (1 <= roundedGrade <= 5)
        return strings["grade" + roundedGrade][lang];
    throw RangeError(`Invalid grade ${grade}`);
}

export function weightedAverage(grades, weights = undefined) {
    if (weights == null)
        weights = new Array(grades.length).fill(1);

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

export function localizeGrade(grade, lang = "de") {
    const language = lang == "en" ? "en-US" : "de-DE";

    if (isNaN(grade))
        return "-";
    return grade.toLocaleString(language, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

export function gradeToFullString(grade, lang) {
    if (grade == null || isNaN(grade))
        return "-";
    return `${gradeToName(grade, lang)} (${localizeGrade(grade, lang)})`;
}
