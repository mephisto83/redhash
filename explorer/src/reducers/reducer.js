import * as Actions from '../actions';
import * as Util from '../actions';
import * as UIA from '../actions';

function makeState() {
    return {

    };
}

function reset() {
    return makeState();
}

function duplicateState(state) {
    return Object.assign({}, makeState(), state)
}

function updateUi(action, state) {
    var newstate = duplicateState(state);
    newstate[action.name] = action.value;
    return newstate;
}

const uiReducer = (state, action) => {
    var actions;
    state = state || makeState();
    if (!action) {
        return state;
    }
    if (action && action.type !== Util.BATCH) {
        actions = [action];
    }
    else {
        actions = action.actions;
    }

    actions.forEach(action => {
        switch (action.type) {
            case UIA.RESET_ALL:
                state = reset();
                break;
            case Actions.UI_UPDATE:
                state = updateUi(action, state);
                break;
        }
    });
    return state;
};

export default uiReducer;