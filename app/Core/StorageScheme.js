class StorageScheme {

    save(key, value) {
        window.localStorage.setItem(key, value);
    }

    get(key) {
        return window.localStorage.getItem(key);
    }

    saveScheme(name, schema) {
        let copySchema = {};

        for (let row in schema) {
            for (let column in schema[row]) {
                if (schema[row][column]) {
                    if (!copySchema[row]) { copySchema[row] = {}; }

                    if (schema[row][column].road && schema[row][column].road.paths) {
                        copySchema[row][column] = { road: { type: schema[row][column].road.type, paths: schema[row][column].road.paths.map((path) => { return !!path; }) }}
                    }
                    else if (schema[row][column].semiconductor) {
                        copySchema[row][column] = { semiconductor: { type: schema[row][column].semiconductor.type, direction: schema[row][column].semiconductor.direction }}
                    }
                    else {
                        copySchema[row][column] = schema[row][column];
                    }
                }
            }
        }

        this.save('__schema__' + name, JSON.stringify(copySchema))
    }

    getSchema(name) {
        let schema = this.get('__schema__' + name);
        if (!schema) { schema = '{}'; }
        return JSON.parse(schema);
    }

}