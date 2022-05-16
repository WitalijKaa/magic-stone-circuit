class StorageScheme {

    save(key, value) {
        window.localStorage.setItem(key, value);
    }

    get(key) {
        return window.localStorage.getItem(key);
    }

    saveScheme(name, schema) {
        this.save('__schema__' + name, JSON.stringify(schema))
    }

    getSchema(name) {
        let schema = this.get('__schema__' + name);
        if (!schema) { schema = '{}'; }
        return JSON.parse(schema);
    }

}