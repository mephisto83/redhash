
export default class CatStateMachine {
    constructor(initialState) {
        this.initialState = initialState || {}
        this.state = {
            ...this.initialState
        };
    }
    applyState(state) {
        this.state = { ...state };
    }
    action(actions) {
        var tempstate = { ...this.state };
        actions.map(action => {
            switch (action.type) {
                case UPDATE:
                    tempstate = { ...tempstate, [action.name]: action.value };
                    break;
            }
        });
        return tempstate;
    }
}

export const UPDATE = 'UPDATE';