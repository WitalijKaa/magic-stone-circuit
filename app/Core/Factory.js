class Factory {
    static sceneModel(config) {
        if (config.hasOwnProperty('model')) {
            return new config.model(config)
        }
    }
}