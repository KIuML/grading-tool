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
