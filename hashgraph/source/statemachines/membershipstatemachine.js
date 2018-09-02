import * as MA from './membershipactions';
export default class MembershipStateMachine {
    constructor(initialState) {
        this.initialState = initialState || {}
        this.state = {
            contributorElection: [],
            ...this.initialState
        };
    }
    applyState(state) {
        this.state = { ...state };
    }
    action(actions) {
        var tempstate = { ...this.state };
        actions.map(action => {
            console.log(action.type);
            switch (action.type) {
                case MA.INITIALIZE_STATE:
                    tempstate = initializeState(tempstate, action);
                    break;
                case MA.REQUEST_CONTRIBUTOR_ADD:
                    tempstate = requestContributorAdd(tempstate, action);
                    break;
                case MA.REQUEST_CONTRIBUTOR_REMOVE:
                    tempstate = requestContributorRemove(tempstate, action);
                    break;
                case MA.ACCEPT_CONTRIBUTOR_ADD:
                case MA.REJECT_CONTRIBUTOR_ADD:
                    tempstate = rejectContributorAdd(tempstate, action);
                    break;
                case MA.REJECT_CONTRIBUTOR_REMOVE:
                case MA.ACCEPT_CONTRIBUTOR_REMOVE:
                    tempstate = rejectContributorRemove(tempstate, action);
                    break;
                case MA.ADD_CONTRIBUTOR:
                    tempstate = addContributor(tempstate, action);
                    break;
                case MA.REMOVE_CONTRIBUTOR:
                    tempstate = removeContributor(tempstate, action);
                    break;

            }
        });
        return tempstate;
    }
}

function initializeState(state, action) {
    if (!state.state) {
        return { ...state, ...{ state: action.type } };
    }
    else {
        switch (state.state) {
            case MA.ADD_CONTRIBUTOR:
            case MA.REJECT_CONTRIBUTOR_REMOVE:
            case MA.REJECT_CONTRIBUTOR_ADD:
                return {
                    ...state,
                    state: action.type,
                    contributorElection: [],
                    connectionInfo: null
                };

        }
    }

    return { ...state }
}

function requestContributorAdd(state, action) {
    switch (state.state) {
        case MA.INITIALIZE_STATE:
            var name = getContributorRequestName(action);
            if (name && !state.contributors.find(t => t === name)) {
                return {
                    ...state,
                    state: action.type,
                    contributorRequest: action
                };
            }
            break;
        default:
        console.log('[incorrect state]')
        break;
    }
    return { ...state };
}
function requestContributorRemove(state, action) {
    switch (state.state) {
        case MA.INITIALIZE_STATE:
            let { name } = action;
            if (name && state.contributors.find(t => t === name)) {
                return {
                    ...state,
                    state: action.type,
                    contributorRequest: action
                }
            }
    }
    return { ...state };
}
function getContributorRequestName(contributorRequest) {
    if (contributorRequest && contributorRequest.connectionInfo && contributorRequest.connectionInfo.name) {
        return contributorRequest.connectionInfo.name;
    }
    return null;
}

function addContributor(state, action) {
    switch (state.state) {
        case MA.ACCEPT_CONTRIBUTOR_ADD:
            if (state.contributors.find(t => t === action.from)) {
                var _name = getContributorRequestName(state.contributorRequest);
                if (_name === action.name) {
                    return {
                        ...state,
                        state: action.type,
                        contributorElection: [],
                        contributorRequest: null,
                        contributors: [...(state.contributors || []).filter(t => t !== action.name), action.name]
                    }
                }
            }
            break;
    }
    return { ...state };
}

function removeContributor(state, action) {
    switch (state.state) {
        case MA.ACCEPT_CONTRIBUTOR_REMOVE:
            break;
    }
    return { ...state };
}

function rejectContributorRemove(state, action) {
    switch (state.state) {
        case MA.REQUEST_CONTRIBUTOR_REMOVE:
            if (state.contributorRequest && state.contributorRequest.name === action.name && action.from !== state.contributorRequest.name) {
                var contributorElection = [...(state.contributorElection || []).filter(t => {
                    return t.from !== action.from
                }), {
                    from: action.from,
                    reject: action.type === MA.REJECT_CONTRIBUTOR_REMOVE,
                    accept: action.type === MA.ACCEPT_CONTRIBUTOR_REMOVE
                }];
                let isrejected;
                let contributors = state.contributors.filter(t => t !== state.contributorRequest.name);
                if (contributorElection.length === contributors.length) {
                    isrejected = contributorElection.filter(t => t.reject).length > contributorElection.filter(t => t.accept).length;
                }
                let update = {};
                if (isrejected !== undefined) {
                    update = {
                        state: isrejected ? MA.REJECT_CONTRIBUTOR_REMOVE : MA.ACCEPT_CONTRIBUTOR_REMOVE
                    };
                }
                return {
                    ...state,
                    contributorElection,
                    ...update
                };
            }
            break;
    }
    return { ...state };
}

function rejectContributorAdd(state, action) {
    switch (state.state) {
        case MA.REQUEST_CONTRIBUTOR_ADD:
            if (state.contributors.find(t => t === action.from)) {
                if (getContributorRequestName(state.contributorRequest) === action.name) {
                    var contributorElection = [...(state.contributorElection || []).filter(t => {
                        return t.from !== action.from
                    }), {
                        from: action.from,
                        reject: action.type === MA.REJECT_CONTRIBUTOR_ADD,
                        accept: action.type === MA.ACCEPT_CONTRIBUTOR_ADD
                    }];

                    let isrejected;
                    if (contributorElection.length === state.contributors.length) {
                        isrejected = contributorElection.filter(t => t.reject).length > contributorElection.filter(t => t.accept).length;
                    }
                    let update = {};
                    if (isrejected !== undefined) {
                        update = {
                            state: isrejected ? MA.REJECT_CONTRIBUTOR_ADD : MA.ACCEPT_CONTRIBUTOR_ADD
                        };
                    }
                    return {
                        ...state,
                        contributorElection,
                        ...update
                    };
                }
            }
    }

    return { ...state };
}