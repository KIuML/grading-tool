import { strings } from "./strings.js";
import { schemes } from "./schemes.js";
import { localizeGrade, toNearestGrade, gradeToFullString } from "./gradeUtils.js";

let prevInputs = {};
let prevScheme = null;
let prevLang = null;

function start() {
    const storedLang = localStorage.getItem("lang")

    if (storedLang != null)
        document.querySelector("#lang").value = storedLang;

    // Input handlers
    document.querySelector("#scheme").addEventListener("change", () => computeGrades());
    document.querySelector("#lang").addEventListener("change", () => computeGrades());
    document.querySelector("#grade-table").addEventListener("input", () => computeGrades());
    document.querySelector("#reset").addEventListener("click", () => {
        const schemeId = document.querySelector("#scheme").value;
        const scheme = schemes[schemeId];
        setInputs(scheme.defaultGrades);
        computeGrades();
    });

    // Navigation handler
    if ("navigation" in window) {
        window.navigation.addEventListener("navigate", e => {
            if (!e.userInitiated || !e.hashChange)
                return;
            const newHash = new URL(e.destination.url).hash.slice(1);
            computeGrades(true, newHash);
        });
    }
    else {
        // Firefox navigation support
        window.addEventListener("hashchange", () => {
            const newHash = location.hash.slice(1);
            computeGrades(true, newHash);
        });
    }

    // Export handlers
    document.querySelector("#copy-row").addEventListener("click", () => exportRow());
    document.querySelector("#copy-csv").addEventListener("click", () => exportTSV());
    document.querySelector("#copy-tex").addEventListener("click", () => exportTex());
    document.querySelector("#copy-md").addEventListener("click", () => exportMd());

    // Import handler
    document.addEventListener("paste", e => {
        const schemeId = document.querySelector("#scheme").value;
        const scheme = schemes[schemeId];
        const target = e.target;
        if (target instanceof HTMLInputElement && target.type != "buttom")
            return;
        const data = (e.clipboardData || window.clipboardData).getData("text");

        const match = data.match(/#(c2NoZW1l[a-zA-Z0-9+/]+=*)/);


        if (match != null) {
            const hash = match[1];
            computeGrades(true, hash);
            location.hash = hash;
            return;
        }

        let updates = {};

        let lines = data.split(/\r?\n/);
        if (lines.length == 1)
            lines = lines[0].split(/[\t;]/);
        else
            lines = lines.slice(1).map(line => line.split(/[\t;]/)[1]);

        if (lines.length < scheme.criteria.length) {
            console.error("Invalid pasted data:", data);
            return;
        }

        for (let i = 0; i < scheme.criteria.length; i++) {
            const criterion = scheme.criteria[i];
            let grade = lines[i].trim();
            if (grade == "") {
                updates[criterion.key] = "";
                continue;
            }
            grade = parseFloat(grade.replace(",", "."))
            if (!isFinite(grade) || grade < 1.0 || grade > 5.0) {
                console.error("Invalid pasted data:", data);
                return;
            }
            updates[criterion.key] = grade.toFixed(1);
        }

        console.log("Loaded inputs from copied data:", updates);
        if ("scheme" in updates)
            materializeScheme(schemes[updates["scheme"]], document.querySelector("#lang").value);
        setInputs(updates);
        computeGrades();
        e.preventDefault();

    })

    computeGrades();
    document.querySelector("#loading").style.display = "none";
    document.querySelector("main").style.display = "block";
}

document.addEventListener("DOMContentLoaded", start);

function materializeScheme(scheme, lang) {
    if (scheme == prevScheme && lang == prevLang)
        return false;

    const schemeSelector = document.querySelector("#scheme");
    let schemeId = undefined;

    if (lang != prevLang) {
        document.querySelector("label[for=scheme]").innerHTML = strings.scheme[lang] + ":";
        schemeSelector.innerHTML = "";
        for (let [i, s] of Object.entries(schemes)) {
            const option = document.createElement("option");
            option.value = i;
            option.innerText = s.names[lang];
            option.title = s.descriptions[lang];
            schemeSelector.appendChild(option);
            if (s == scheme)
                schemeId = i;
        }

        document.querySelector("label[for=lang]").innerHTML = strings.lang[lang] + ":";
        localStorage.setItem("lang", lang);

        const isoLang = lang == "en" ? "en-US" : "de-DE";
        document.querySelector("html").lang = isoLang;
    }
    else
        for (let [i, s] of Object.entries(schemes))
            if (s == scheme) {
                schemeId = i;
                break;
            }

    if (schemeId != undefined)
        schemeSelector.value = schemeId;
    else
        throw Error("Tried to materialize a scheme that is not in the scheme list.");

    document.querySelector("#grade-table thead").innerHTML = `
        <tr>
            <th>${strings.criterion[lang]}</th>
            <th>${strings.grade[lang]}</th>
        </tr>
    `;
    const gradeTableBody = document.querySelector("#grade-table tbody");
    gradeTableBody.innerHTML = "";

    let currGroup = null;

    for (let criterion of scheme.criteria) {
        const group = criterion.group;
        if (scheme.showGroups && group != null && group != currGroup) {
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

    if (scheme.computedAggregateCriteria.length == 1) {
        document.querySelector("#results").innerHTML = `
            <h3>${strings.aggResult[lang]}</h3>
            <p><span id="${scheme.computedAggregateCriteria[0].key}"></span></p>
        `;
    }
    else
        document.querySelector("#results").innerHTML = `
            <h3>${strings.aggResults[lang]}</h3>
            ${scheme.computedAggregateCriteria.map(criterion => `
                <p>${criterion.names[lang]}: <span id="${criterion.key}">-</span></p>
            `).join("")}
        `;

    prevScheme = scheme;
    prevLang = lang;

    return true;
}

function computeGrades(forceUpdate = false, hash = null) {
    let externalHash = true;
    if (hash == null) {
        hash = location.hash.slice(1);
        externalHash = false;
    }

    let inputs = undefined;
    let schemeId = undefined;
    if (hash != "") {
        try {
            inputs = stringToInputs(window.atob(hash));
            if (inputs["scheme"] != null && inputs["scheme"] in schemes && (prevScheme == null || forceUpdate))
                schemeId = inputs["scheme"];
            console.log("Loaded inputs from hash:", inputs);
        } catch (e) {
            location.hash = "";
            console.error(e);
        }
    }

    if (prevScheme != null && !forceUpdate)
        schemeId = document.querySelector("#scheme").value;
    else if (schemeId == undefined)
        schemeId = Object.keys(schemes)[0];

    const scheme = schemes[schemeId];
    const lang = document.querySelector("#lang").value;
    const updatedView = materializeScheme(scheme, lang);

    if ((updatedView || forceUpdate) && inputs != undefined) {
        if (updatedView)
            delete inputs["scheme"]; // After materializing the scheme, scheme is already set correctly in DOM.
        console.log(inputs);
        setInputs({ ...scheme.defaultGrades, ...inputs });
    }

    inputs = readInputs();
    const newHash = `scheme=${schemeId}&` + inputsToString(inputs);
    if (hash != newHash && !externalHash)
        location.hash = window.btoa(newHash);

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
        if (scheme.roundAggregate) {
            element.title = localizeGrade(grade, lang);
            grade = toNearestGrade(grade);
        }
        element.innerText = gradeToFullString(grade, lang);
    }

    prevInputs = inputs;
}


function readInputs() {
    const inputs = document.querySelectorAll("#grade-table input");
    const inputValues = {};
    for (let input of inputs) {
        let val = input.value;
        val = val == "" ? NaN : parseFloat(val);
        if (val > 4 && val < 5) {
            if (input.id in prevInputs && prevInputs[input.id] == 5.0)
                val = 4.0;
            else
                val = 5.0;
            input.value = val.toFixed(1);
        }
        if (val < 0) {
            val = NaN;
            input.value = "";
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
        if (grade == null)
            continue;
        if (Number.isNaN(grade))
            grade = "";
        input.value = "" + grade;
    }
}

let copiedTimeout = null;

function showCopiedStatus(type) {
    if (copiedTimeout != null) {
        clearTimeout(copiedTimeout);
    }
    const copiedStatus = document.querySelector("#copied-status");
    copiedStatus.innerText = `📋 Copied ${type}`;
    copiedStatus.style.opacity = 1;
    copiedStatus.style.display = "block";
    copiedTimeout = setTimeout(() => {
        copiedStatus.style.opacity = 0;
        copiedTimeout = setTimeout(() => {
            copiedStatus.style.display = "none";
            copiedStatus.style.opacity = 1;
        }, 500);
    }, 600);
}

function copyToClipboard(type, text) {
    navigator.clipboard.writeText(text).then(() => {
        showCopiedStatus(type);
    }, (err) => {
        console.error("Could not copy text: ", err);
    });
}

function exportRow() {
    const inputs = readInputs();
    const schemeId = document.querySelector("#scheme").value;
    const scheme = schemes[schemeId];
    const lang = document.querySelector("#lang").value;
    const row = scheme.toRow(inputs, lang);
    copyToClipboard("row", row);
}

function exportTSV(separator = "\t") {
    const inputs = readInputs();
    const schemeId = document.querySelector("#scheme").value;
    const scheme = schemes[schemeId];
    const lang = document.querySelector("#lang").value;
    const grades = scheme.computeGrades(inputs);
    const csv = scheme.toCSV({ ...inputs, ...grades }, lang, separator);
    copyToClipboard("TSV", csv);
}

function exportTex() {
    const inputs = readInputs();
    const schemeId = document.querySelector("#scheme").value;
    const scheme = schemes[schemeId];
    const lang = document.querySelector("#lang").value;
    const grades = scheme.computeGrades(inputs);
    const tex = "% Exported from " + location.href + "\n" + scheme.toLaTeX({ ...inputs, ...grades }, lang);
    copyToClipboard("LaTeX", tex);
}

function exportMd() {
    const inputs = readInputs();
    const schemeId = document.querySelector("#scheme").value;
    const scheme = schemes[schemeId];
    const lang = document.querySelector("#lang").value;
    const grades = scheme.computeGrades(inputs);
    const md = scheme.toMd({ ...inputs, ...grades }, lang, location.href);
    copyToClipboard("Markdown", md);
}
