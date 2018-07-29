export default class IConnectionInfo {
    constructor(name, info) {
        this._name = name;
        this._info = info;
    }
    get name() {
        return this._name;
    }
}