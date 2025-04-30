import { Criterion } from "./criterion.js";
import { localizeGrade, weightedAverage } from "./gradeUtils.js";

export const aggregateGrade = new Criterion("grade", { en: "Grade", de: "Note" });

export class Scheme {
    constructor(names, descriptions, criteria) {
        this.names = names;
        this.descriptions = descriptions;
        this.criteria = criteria;
    }

    getCriterion(key) {
        return this.criteria.find(criterion => criterion.key == key);
    }

    getCriterionWeight(_key) {
        return 1;
    }

    computeGroupGrades(criteriaGrades) {
        const groupGrades = {};
        const groupWeights = {};
        for (let [key, grade] of Object.entries(criteriaGrades)) {
            const criterion = this.getCriterion(key);
            if (criterion == null || criterion.group == null)
                continue;
            if (groupGrades[criterion.group.key] == null) {
                groupGrades[criterion.group.key] = [];
                groupWeights[criterion.group.key] = [];
            }
            groupGrades[criterion.group.key].push(grade);
            groupWeights[criterion.group.key].push(this.getCriterionWeight(key));
        }

        for (let [group, grades] of Object.entries(groupGrades)) {
            groupGrades[group] = weightedAverage(grades, groupWeights[group]);
        }

        return groupGrades;
    }

    get aggregateCriteria() {
        return [aggregateGrade];
    }

    get groupCriteria() {
        return [...new Set(
            this.criteria.map(criterion => criterion.group).filter(group => group != null)
        )];
    }

    get allCriteria() {
        return [...this.criteria, ...this.groupCriteria, ...this.aggregateCriteria];
    }

    aggregateGroupGrades(groupGrades) {
        return {
            [this.grade.key]: weightedAverage(Object.values(groupGrades))
        };
    }

    computeGrades(criteriaGrades) {
        const groupGrades = this.computeGroupGrades(criteriaGrades);
        const aggregateGrades = this.aggregateGroupGrades(groupGrades);
        return { ...groupGrades, ...aggregateGrades };
    }

    toCSV(grades, lang = "en") {
        let csv = lang === "en" ? "Criterion;Grade\n" : "Kriterium;Note\n";

        for (let criterion of this.allCriteria) {
            let grade = grades[criterion.key];
            if (grade == null || isNaN(grade))
                grade = "";
            csv += `${criterion.names[lang]};${localizeGrade(grade, lang)}\n`;
        }

        return csv;
    }

    toLaTeX(grades, lang = "en") {
        // TODO
    }
}
