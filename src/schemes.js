import { Criterion } from "./criterion.js";
import { aggregateGrade, Scheme } from "./scheme.js";
import { GradeMeasure } from "./measure.js";

const ethics = new Criterion("ethics", { en: "Working Ethics", de: "Arbeitsweise" });
const ethicsFamiliarization = new Criterion("familiarization", { en: "Familiarization with the topic", de: "Einarbeitung in die Aufgabenstellung" }, ethics);
const ethicsAutonomy = new Criterion("autonomy", { en: "Autonomy of the student", de: "Eigenständigkeit" }, ethics);
const ethicsCommitment = new Criterion("commitment", { en: "Commitment/motivation of the student", de: "Einsatz und Engagement" }, ethics);
const ethicsResources = new Criterion("resources", { en: "Use of the offered ressources (tools, machines, etc.)", de: "Nutzung von Ressourcen (Tools, Rechner, etc.)" }, ethics);
const ethicsCriteria = [
    ethicsFamiliarization,
    ethicsAutonomy,
    ethicsCommitment,
    ethicsResources,
];

const solution = new Criterion("solution", { en: "Solution", de: "Inhalt und Ergebnisse" });
const solutionRelatedWork = new Criterion("related-work", { en: "Related work", de: "Aufarbeiten relevanter Literatur" }, solution);
const solutionGoals = new Criterion("goals", { en: "Adherence to the thesis goals", de: "Lösen der Aufgabenstellung" }, solution);
const seminarSolutionGoals = new Criterion("goals", { en: "Adherence to the seminar goals", de: "Erfüllung des Seminarziels" }, solution);
const solutionQuality = new Criterion("quality", { en: "Quality of the developed solution(s)", de: "Qualität der Lösungen" }, solution);
const solutionDocumentation = new Criterion("documentation", { en: "Documentation and reproducability", de: "Dokumentation und Reproduzierbarkeit" }, solution);
const solutionCriteria = [
    solutionRelatedWork,
    solutionGoals,
    solutionQuality,
    solutionDocumentation,
];

const written = new Criterion("written", { en: "Written Thesis", de: "Schriftliche Ausarbeitung" });
const writtenStructure = new Criterion("structure", { en: "Structure & readability", de: "Struktur und Lesbarkeit der Arbeit" }, written);
const writtenLength = new Criterion("length", { en: "Length, Trade-off between depth/breadth", de: "Länge der Arbeit, Balance zwischen Breite und Tiefe" }, written);
const writtenPresentation = new Criterion("presentation", { en: "Formal presentation and correctness", de: "Formale Darstellung und Korrektheit" }, written);
const writtenLanguage = new Criterion("language", { en: "Language (grammar, orthography, typos, etc.)", de: "Sprachliche Qualität (Grammatik, Orthographie, Tippfehler, etc.)" }, written);
const writtenFigures = new Criterion("figures", { en: "Amount and quality of illustrations and plots", de: "Umfang und Qualität von Illustrationen, Abbildungen, Tabellen, etc." }, written);
const writtenReferences = new Criterion("references", { en: "Citation and references", de: "Referenzen und Literaturverzeichnis (Umfang, Vollständigkeit, etc.)" }, written);
const writtenCriteria = [
    writtenStructure,
    writtenLength,
    writtenPresentation,
    writtenLanguage,
    writtenFigures,
    writtenReferences,
];

const defense = new Criterion("defense", { en: "Defense", de: "Verteidigung der Arbeit" });
const defenseClarity = new Criterion("clarity", { en: "Clarity of presentation", de: "Verständlichkeit der Präsentation" }, defense);
const defenseSlides = new Criterion("slides", { en: "Quality of the slides", de: "Qualität der Folien" }, defense);
const defenseContribution = new Criterion("contribution", { en: "Clear statement of own contribution", de: "Darstellung der eigenen Leistung" }, defense);
const defenseRelatedWork = new Criterion("related-work", { en: "Appreciation of related work", de: "Beschreibung verwandter Arbeiten" }, defense);
const defenseLanguage = new Criterion("language", { en: "Language, rhetoric", de: "Ausdrucksweise und Rhetorik" }, defense);
const defenseTime = new Criterion("time", { en: "Compliance with time constraints", de: "Antworten auf Fragen" }, defense);
const defenseDiscussion = new Criterion("discussion", { en: "Discussion, response to questions", de: "Einhalten der Zeitvorgaben" }, defense);
const defenseCriteria = [
    defenseClarity,
    defenseSlides,
    defenseContribution,
    defenseRelatedWork,
    defenseLanguage,
    defenseTime,
    defenseDiscussion,
];

const thesisCriteria = [
    ...ethicsCriteria, ...solutionCriteria, ...writtenCriteria, ...defenseCriteria
];
const seminarCriteria = [
    ethicsFamiliarization,
    ethicsAutonomy,
    ethicsCommitment,
    solutionRelatedWork,
    seminarSolutionGoals,
    solutionQuality,
    ...writtenCriteria,
    ...defenseCriteria
];

const aggregateWritten = new Criterion("written", { en: "Written", de: "Schriftlich" });
const aggregateOral = new Criterion("oral", { en: "Defense", de: "Mündlich" });

const defaultWeights = {
    // Ethics
    [ethicsFamiliarization.key]: 1,
    [ethicsAutonomy.key]: 3,
    [ethicsCommitment.key]: 1,
    [ethicsResources.key]: 1,
    // Solution
    [solutionRelatedWork.key]: 2,
    [solutionGoals.key]: 5,
    [solutionQuality.key]: 5,
    [solutionDocumentation.key]: 2,
    // Written
    [writtenStructure.key]: 2,
    [writtenLength.key]: 1,
    [writtenPresentation.key]: 2,
    [writtenLanguage.key]: 2,
    [writtenFigures.key]: 1,
    [writtenReferences.key]: 1,
    // Defense
    [defenseClarity.key]: 2,
    [defenseSlides.key]: 2,
    [defenseContribution.key]: 2,
    [defenseRelatedWork.key]: 1,
    [defenseLanguage.key]: 1,
    [defenseTime.key]: 1,
    [defenseDiscussion.key]: 2,
};

const withoutDefenseMeasure = new GradeMeasure(
    [[], 4.0],
    [[ethics.key], 4.0],
    [[written.key], 3.0],
    [[solution.key], 2.7],
    [[ethics.key, written.key], 2.7],
    [[ethics.key, solution.key], 2.3],
    [[solution.key, written.key], 1.3],
    [[ethics.key, solution.key, written.key], 1.0],
);
const withDefenseMeasure = new GradeMeasure(
    [[], 4.0],
    [[ethics.key], 4.0],
    [[written.key], 3.3],
    [[solution.key], 3.0],
    [[defense.key], 3.7],
    [[ethics.key, written.key], 3.0],
    [[ethics.key, solution.key], 2.7],
    [[ethics.key, defense.key], 3.3],
    [[solution.key, written.key], 1.7],
    [[solution.key, defense.key], 2.3],
    [[written.key, defense.key], 2.7],
    [[ethics.key, solution.key, written.key], 1.3],
    [[ethics.key, solution.key, defense.key], 2.0],
    [[ethics.key, written.key, defense.key], 2.3],
    [[solution.key, written.key, defense.key], 1.0],
    [[ethics.key, solution.key, written.key, defense.key], 1.0],
);

class SplitThesisScheme extends Scheme {
    weights = defaultWeights
    measure = withoutDefenseMeasure
    names = { "en": "Thesis", "de": "Abschlussarbeit" }
    descriptions = {
        "en": "Computes separate written and defense grades.",
        "de": "Berechnet separate Noten für die schriftliche Arbeit und die Verteidigung."
    }
    criteria = thesisCriteria

    getCriterionWeight(key) {
        return this.weights[key];
    }

    get aggregateCriteria() {
        return [aggregateWritten, aggregateOral];
    }

    aggregateGroupGrades(groupGrades) {
        return {
            [aggregateWritten.key]: this.measure.aggregateChoquet(groupGrades),
            [aggregateOral.key]: groupGrades[defense.key]
        };
    }
}

class SeminarScheme extends SplitThesisScheme {
    names = { "en": "Seminar paper", "de": "Seminararbeit" }
    descriptions = {
        "en": "Computes a grade for a seminar.",
        "de": "Berechnet eine Note für ein Seminar."
    }
    criteria = seminarCriteria
    measure = withDefenseMeasure

    get aggregateCriteria() {
        return [aggregateGrade];
    }

    aggregateGroupGrades(groupGrades) {
        return {
            [aggregateGrade.key]: this.measure.aggregateChoquet(groupGrades)
        };
    }
}

class TalkScheme extends Scheme {
    weights = defaultWeights
    showGroups = false

    names = { "en": "Talk / Defense", "de": "Vortrag / Verteidigung" }
    descriptions = {
        "en": "Computes a grade for a talk.",
        "de": "Berechnet eine Note für einen Vortrag."
    }
    criteria = defenseCriteria

    getCriterionWeight(key) {
        return this.weights[key];
    }

    get aggregateCriteria() {
        return [aggregateOral];
    }

    aggregateGroupGrades(groupGrades) {
        return {
            [aggregateOral.key]: groupGrades[defense.key]
        };
    }
}

class CombinedThesisScheme extends SplitThesisScheme {
    names = { "en": "Thesis (combined)", "de": "Abschlussarbeit (kombi)" }
    descriptions = {
        "en": "Combines the written and defense grades.",
        "de": "Berechnet eine kombinierte Note für die schriftliche Ausarbeitung und die Verteidigung."
    }
    measure = withDefenseMeasure

    get aggregateCriteria() {
        return [aggregateGrade];
    }

    aggregateGroupGrades(groupGrades) {
        return {
            [aggregateGrade.key]: this.measure.aggregateChoquet(groupGrades)
        };
    }
}

export const schemes = {
    0: new SplitThesisScheme(),
    "seminar": new SeminarScheme(),
    "talk": new TalkScheme(),
    "combined": new CombinedThesisScheme(),
};
