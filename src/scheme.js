import { Criterion, DummyCriterion } from "./criterion.js";
import { localizeGrade, weightedAverage, gradeToFullString, toNearestGrade } from "./gradeUtils.js";
import { strings } from "./strings.js";

export const aggregateGrade = new Criterion("grade", strings.grade);

export class Scheme {
    showGroups = true
    roundAggregate = true

    constructor(names, descriptions, criteria) {
        if (names != null)
            this.names = names;
        if (descriptions != null)
            this.descriptions = descriptions;
        if (criteria != null)
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

    get computedAggregateCriteria() {
        return this.aggregateCriteria.filter(criterion => !(criterion instanceof DummyCriterion));
    }

    get groupCriteria() {
        if (!this.showGroups)
            return [];
        return [...new Set(
            this.criteria.map(criterion => criterion.group).filter(group => group != null)
        )];
    }

    get allCriteria() {
        return [...this.criteria, ...this.groupCriteria, ...this.aggregateCriteria];
    }

    get defaultGrades() {
        const defaultGrades = {};
        for (let criterion of this.criteria) {
            defaultGrades[criterion.key] = NaN;
        }
        return defaultGrades;
    }

    aggregateGroupGrades(groupGrades) {
        return {
            [this.grade.key]: weightedAverage(Object.values(groupGrades))
        };
    }

    computeGrades(criteriaGrades) {
        const groupGrades = this.computeGroupGrades(criteriaGrades);
        const aggregateGrades = this.aggregateGroupGrades(groupGrades);
        if (this.showGroups)
            return { ...groupGrades, ...aggregateGrades };
        return aggregateGrades;
    }

    toRow(grades, lang = "en") {
        return this.criteria.map(criterion => {
            const grade = grades[criterion.key]
            if (grade == null || isNaN(grade))
                return "";
            return localizeGrade(grade, lang);
        }).join("\t");
    }

    toCSV(grades, lang = "en", separator = ";") {
        let csv = `${strings.criterion[lang]}${separator}${strings.grade[lang]}\n`;

        const aggregateCriteria = new Set(this.aggregateCriteria);

        for (let criterion of this.allCriteria) {
            if (criterion instanceof DummyCriterion)
                continue;

            let grade = grades[criterion.key];
            if (grade == null || isNaN(grade))
                grade = "";
            else if (aggregateCriteria.has(criterion))
                grade = toNearestGrade(grade);

            grade = localizeGrade(grade, lang);
            if (separator == "," && lang == "de")
                grade = `"${grade}"`;
            csv += `${criterion.names[lang]}${separator}${grade}\n`;
        }

        return csv;
    }

    toLaTeX(grades, lang = "en") {
        let tex = [
            `\\subsection*{${strings.individualGrades[lang]}:}`,
            "",
            "\\begin{center}",
            "\\begin{tabular}{lcc}",
            "\t\\hline",
            `\t\\textbf{${strings.criterion[lang]}} & \\textbf{${strings.grade[lang]}} \\\\`,
            "\t\\hline \\\\",
        ].join("\n");

        let lastGroup = null;
        let groupCount = 0;
        for (let criterion of this.criteria) {
            if (this.showGroups && criterion.group != null && criterion.group != lastGroup) {
                let grade = grades[criterion.group.key];
                if (grade == null || isNaN(grade))
                    grade = "-";
                else
                    grade = localizeGrade(grade, lang);
                tex += `[${groupCount == 0 ? 0 : 2}mm]\n\t\\textbf{${criterion.group.names[lang].replace("&", "\\&")}} & \\\\ % ${grade}\n`;
                groupCount++;
            }
            let grade = grades[criterion.key];
            if (grade == null || isNaN(grade))
                grade = "-";
            else
                grade = localizeGrade(grade, lang);
            tex += `\t${criterion.names[lang].replace("&", "\\&")} & ${grade} \\\\\n`
            lastGroup = criterion.group;
        }

        tex += [
            "\\end{tabular}", "\\end{center}", "", ""
        ].join("\n");

        if (this.aggregateCriteria.length == 1)
            tex += `\\subsection*{${strings.aggResult[lang]}:}\n`;
        else
            tex += [
                `\\subsection*{${strings.summary[lang]}:}`,
                "",
                `\\begin{itemize}`,
                ""
            ].join("\n");

        tex += this.aggregateCriteria.map(criterion => {
            const grade = grades[criterion.key];
            let shownGrade = grade;
            if (criterion instanceof DummyCriterion) {
                shownGrade = criterion.value;
                if (this.aggregateCriteria.length > 1)
                    shownGrade = `\t\\item ${criterion.names[lang]}: ${shownGrade}`;
            }
            else {
                if (this.roundAggregate)
                    shownGrade = toNearestGrade(grade);
                shownGrade = gradeToFullString(shownGrade, lang);
                if (this.aggregateCriteria.length > 1)
                    shownGrade = `\t\\item ${strings.finalGrade[lang]} ${criterion.names[lang]}: \\textbf{${shownGrade}}`;
                if (this.roundAggregate)
                    shownGrade += ` % ${localizeGrade(grade, lang)}`;
            }
            return shownGrade;
        }).join("\n");

        if (this.aggregateCriteria.length > 1)
            tex += "\n\\end{itemize}";

        return tex;
    }

    toMd(grades, lang = "en", url = null) {
        const rows = [
            [strings.criterion[lang], strings.grade[lang]],
        ];

        let lastGroup = null;
        for (let criterion of this.criteria) {
            if (this.showGroups && criterion.group != null && criterion.group != lastGroup) {
                let grade = grades[criterion.group.key];
                if (grade == null || isNaN(grade))
                    grade = "";
                else
                    grade = "**" + localizeGrade(grade, lang) + "**";
                rows.push([`**${criterion.group.names[lang]}**`, grade]);
            }
            let grade = grades[criterion.key];
            if (grade == null || isNaN(grade))
                grade = "";
            else
                grade = localizeGrade(grade, lang);
            rows.push([criterion.names[lang], grade]);
            lastGroup = criterion.group;
        }

        const maxCritLen = Math.max(...rows.map(row => row[0].length));
        const maxGradeLen = Math.max(...rows.map(row => row[1].length));

        if (url != null)
            rows[0][1] = `[${rows[0][1]}](${url})`;

        const header = `| ${rows[0][0].padEnd(maxCritLen)} | ${rows[0][1].padEnd(maxGradeLen)} |`;
        const separator = `| ${"-".repeat(maxCritLen)} | ${"-".repeat(maxGradeLen - 1)}: |`;
        const body = rows.slice(1).map(row => `| ${row[0].padEnd(maxCritLen)} | ${row[1].padEnd(maxGradeLen)} |`).join("\n");

        const footer = this.computedAggregateCriteria
            .map(criterion => {
                const grade = grades[criterion.key];
                let shownGrade = grade;
                if (this.roundAggregate)
                    shownGrade = toNearestGrade(grade);
                shownGrade = gradeToFullString(shownGrade, lang);
                return `**${criterion.names[lang]}:** ${shownGrade}`;
            }).join("\n");

        return `${header}\n${separator}\n${body}\n\n${footer}\n`;
    }
}
