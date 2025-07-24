export class Criterion {
    constructor(id, names, group = null) {
        this.id = id;
        this.names = names;
        this.group = group;
    }

    get key() {
        if (this.group == null)
            return this.id;
        return `${this.group.key}-${this.id}`;
    }

    toString() {
        return `[Criterion ${this.key}]`;
    }
}

export class DummyCriterion extends Criterion {
    constructor(id, names, value = null) {
        super(id, names);
        this.value = value;
    }

    get key() {
        return `dummy-${this.id}`;
    }

    toString() {
        return `[DummyCriterion ${this.id} = ${this.value}]`;
    }
}
