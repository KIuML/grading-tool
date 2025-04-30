import { schemes } from "./schemes.js";
import { localizeGrade } from "./gradeUtils.js";

let prevInputs = {};
let prevScheme = null;
let prevLang = null;

function start() {
    const storedLang = localStorage.getItem("lang")

    if (storedLang != null)
        document.querySelector("#lang").value = storedLang;

    document.querySelector("#scheme").addEventListener("change", () => computeGrades());
    document.querySelector("#lang").addEventListener("change", () => computeGrades());
    document.querySelector("#grade-table").addEventListener("input", () => computeGrades());
    document.querySelector("#copy-tex").addEventListener("click", () => exportTex());
    document.querySelector("#copy-csv").addEventListener("click", () => exportCSV());
    document.querySelector("#copy-url").addEventListener("click", () => exportURL());

    computeGrades();
    document.querySelector("#loading").style.display = "none";
    document.querySelector("main").style.display = "block";
}

document.addEventListener("DOMContentLoaded", start);

function materializeScheme(scheme, lang) {
    if (scheme == prevScheme && lang == prevLang)
        return false;

    if (lang != prevLang) {
        document.querySelector("label[for=scheme]").innerHTML = lang == "en" ? "Grading Scheme:" : "Bewertungsschema:";
        const schemeSelector = document.querySelector("#scheme");
        schemeSelector.innerHTML = "";
        for (let i = 0; i < schemes.length; i++) {
            const s = schemes[i];
            const option = document.createElement("option");
            option.value = i;
            option.innerText = s.names[lang];
            option.title = s.descriptions[lang];
            if (s == scheme)
                option.selected = true;
            schemeSelector.appendChild(option);
        }
        document.querySelector("label[for=lang]").innerHTML = lang == "en" ? "Language:" : "Sprache:";
        localStorage.setItem("lang", lang);

        const isoLang = lang == "en" ? "en-US" : "de-DE";
        document.querySelector("html").lang = isoLang;
    }

    document.querySelector("#grade-table thead").innerHTML = `
        <tr>
            <th>${lang == "en" ? "Criterion" : "Kriterium"}</th>
            <th>${lang == "en" ? "Grade" : "Note"}</th>
        </tr>
    `;
    const gradeTableBody = document.querySelector("#grade-table tbody");
    gradeTableBody.innerHTML = "";

    let currGroup = null;

    for (let criterion of scheme.criteria) {
        const group = criterion.group;
        if (group != null && group != currGroup) {
            const groupRow = document.createElement("tr");
            groupRow.classList.add("group");
            const firstCell = document.createElement("td");
            firstCell.innerText = group.names[lang];
            const secondCell = document.createElement("td");
            secondCell.innerHTML = `<span data-group="${group.key}"></span>`;
            groupRow.appendChild(firstCell);
            groupRow.appendChild(secondCell);
            gradeTableBody.appendChild(groupRow);
            currGroup = group;
        }
        const row = document.createElement("tr");
        row.classList.add("criterion");
        const firstCell = document.createElement("td");
        const label = document.createElement("label");
        label.setAttribute("for", criterion.key);
        label.innerText = criterion.names[lang];
        firstCell.appendChild(label);
        const secondCell = document.createElement("td");
        secondCell.innerHTML = `
            <input type="number" list="grade-list" min="1" max="5" step="0.1" id="${criterion.key}">
        `;
        row.appendChild(firstCell);
        row.appendChild(secondCell);
        gradeTableBody.appendChild(row);
    }

    if (scheme.aggregateCriteria.length == 1) {
        document.querySelector("#results div:first-child").innerHTML = `
            <h3>${lang == "en" ? "Aggregated Results" : "Gesamtnoten"}</h3>
            <p><span id="${scheme.aggregateCriteria[0].key}"></span></p>
        `;
    }
    else
        document.querySelector("#results div:first-child").innerHTML = `
            <h3>${lang == "en" ? "Aggregated Results" : "Gesamtnoten"}</h3>
            ${scheme.aggregateCriteria.map(criterion => `
                <p>${criterion.names[lang]}: <span id="${criterion.key}">-</span></p>
            `).join("")}
        `;

    prevScheme = scheme;
    prevLang = lang;

    return true;
}

function computeGrades() {
    const schemeId = parseInt(document.querySelector("#scheme").value);
    const scheme = schemes[schemeId];
    const lang = document.querySelector("#lang").value;
    const updatedView = materializeScheme(scheme, lang);

    if (updatedView) {
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
    }

    const inputs = readInputs();
    location.hash = window.btoa(`scheme=${schemeId}&` + inputsToString(inputs));

    const groupGrades = scheme.computeGroupGrades(inputs);
    const aggregateGrades = scheme.aggregateGroupGrades(groupGrades);

    for (let [key, grade] of Object.entries(groupGrades)) {
        const element = document.querySelector(`span[data-group=${key}]`);
        if (element == null)
            continue;
        element.innerText = localizeGrade(grade, lang);
    }

    for (let [key, grade] of Object.entries(aggregateGrades)) {
        const element = document.getElementById(key);
        if (element == null)
            continue;
        element.innerText = localizeGrade(grade, lang);
    }

    prevInputs = inputs;
}


function readInputs() {
    console.log(prevInputs);
    const inputs = document.querySelectorAll("#grade-table input");
    const inputValues = {};
    for (let input of inputs) {
        let val = input.value;
        console.log(input.id, val)
        val = val == "" ? NaN : parseFloat(val);
        if (val > 4 && val < 5) {
            if (input.id in prevInputs && prevInputs[input.id] == 5.0)
                val = 4.0;
            else
                val = 5.0;
            input.value = val.toFixed(1);
        }
        inputValues[input.id] = val;
    }
    return inputValues;
}

function inputsToString(inputs) {
    const parts = [];
    for (let [key, val] of Object.entries(inputs)) {
        if (isNaN(val))
            continue;
        if (isFinite(val))
            val = val.toFixed(1);
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

function exportURL() {
    navigator.clipboard.writeText(location.href).then(() => {
        alert("URL copied to clipboard!");
    }, (err) => {
        console.error("Could not copy text: ", err);
    });
}

function exportCSV() {
    const inputs = readInputs();
    const schemeId = parseInt(document.querySelector("#scheme").value);
    const scheme = schemes[schemeId];
    const lang = document.querySelector("#lang").value
    const grades = scheme.computeGrades(inputs);
    const csv = scheme.toCSV({ ...inputs, ...grades }, lang);
    navigator.clipboard.writeText(csv).then(() => {
        alert("CSV copied to clipboard!");
    }, (err) => {
        console.error("Could not copy text: ", err);
    });
}

function exportTex() {

}
