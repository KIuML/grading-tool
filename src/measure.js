import { gradeToUnit, unitToGrade } from "./gradeUtils.js";

export class Measure {
    constructor(...kvs) {
        console.log(kvs);
        const elements = new Set();
        for (let [subset, _] of kvs)
            for (let e of subset)
                elements.add(e);

        this.elements = [...elements];
        this.map = new Map();

        for (let [subset, value] of kvs) {
            this.map.set(this.subsetToIndex(subset), value);
        }
    }

    subsetToIndex(subset) {
        let i = 0;
        for (let element of subset) {
            const idx = this.elements.indexOf(element);
            if (idx == -1)
                continue;
            i += 1 << idx;
        }
        return i;
    }

    get(subset) {
        const idx = this.subsetToIndex(subset);
        return this.map.get(idx);
    }

    aggregateChoquet(elementValues) {
        const elementKvs = Object.entries(elementValues);
        elementKvs.sort((a, b) => a[1] - b[1]);
        const sortedElements = elementKvs.map(([element, _value]) => element);
        const elementDiffs = [];
        for (let [_, grade] of elementKvs) {
            if (elementDiffs.length == 0)
                elementDiffs.push(grade);
            else
                elementDiffs.push(grade - elementKvs[elementDiffs.length - 1][1]);
        }

        let integral = 0;

        for (let i = 0; i < sortedElements.length; i++) {
            const subset = sortedElements.slice(i, undefined);
            const weight = this.get(subset);
            integral += elementDiffs[i] * weight;
        }

        return integral;
    }
}

export class GradeMeasure extends Measure {
    constructor(...kvs) {
        const transformedKvs = kvs.map(([subset, grade]) => [subset, gradeToUnit(grade)]);
        super(...transformedKvs);
    }

    aggregateChoquet(groupGrades) {

        const groupUnitGrades = {};
        for (let [group, grade] of Object.entries(groupGrades)) {
            if (this.elements.indexOf(group) == -1)
                continue;
            if (isNaN(grade))
                return NaN;
            if (grade > 4)
                return 5.0;
            groupUnitGrades[group] = gradeToUnit(grade);
        }

        const integral = super.aggregateChoquet(groupUnitGrades);

        return unitToGrade(integral);
    }
}
