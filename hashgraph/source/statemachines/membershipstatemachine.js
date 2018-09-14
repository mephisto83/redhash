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
    adjustContributors(state) {
        if (!state) {
            throw 'requires a state to adjust contributors';
        }
        var newstate = {
            ...state,
            contributors: [...(state.proposed || [])],
            state: MA.INITIALIZE_STATE
        }
        this.applyState(newstate);

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
                case MA.UPDATE_THREAD:
                    tempstate = updateThread(tempstate, action);
                    break;
                case MA.THREAD_CUT_OFF:
                    tempstate = threadCutOff(tempstate, action);
                    break;
                case MA.THREAD_CUT_APPROVAL:
                    tempstate = threadCutApproval(tempstate, action);
                    break;
                case MA.THREAD_CUT_REJECT:
                    tempstate = threadCutRejection(tempstate, action);
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

function updateThread(state, action) {
    switch (state.state) {
        case MA.ADD_CONTRIBUTOR:
        case MA.THREAD_CUT_REJECTED:
            var name = action.from;
            if (name && state.contributors.find(t => t === name)) {
                if (state.thread === action.thread) {
                    return {
                        ...state,
                        state: action.type,
                    }
                }
                else {
                    console.log('--------- thread is not correct')
                }
            }
            else {
                console.log(' - -------- not a contributor')
            }
            break;
    }
    return { ...state };
}
function threadCutOff(state, action) {
    switch (state.state) {
        case MA.UPDATE_THREAD:
        case MA.THREAD_CUT_OFF:
            var name = action.from;
            if (name && state.contributors.find(t => t === name)) {
                if (action.thread === state.thread) {
                    if (!isNaN(action.time)) {
                        console.log('-------- thread cutoff success')
                        return {
                            ...state,
                            state: action.type,
                            storedState: { ...(state.storedState || {}), ...action.storedState },
                            vote: {},
                            threadCutoff: {
                                ...(state.threadCutoff || {}),
                                time: action.time
                            }
                        }
                    }
                    else {
                        console.log('------------ time is not a number')
                    }
                }
                else {
                    console.log('------------  wrong thread');
                }
            }
            else {
                console.log('------------ not a contributor')
            }
            break;
        default:
            console.log(action.type);
            console.log('------------ incorrect state ' + state.state)
            break;
    }
    return { ...state };
}
function threadCutApproval(state, action) {
    switch (state.state) {
        case MA.THREAD_CUT_OFF:
            var name = action.from;
            if (name && state.contributors.find(t => t === name)) {
                var votes = {
                    ...(state.votes || {}),
                    [name]: true
                };
                console.log(votes);
                var update = {
                    ...state,
                    votes,
                    threadCutoff: {
                        ...(state.threadCutoff || {})
                    },
                    ranges: {
                        ...(state.ranges || {}),
                        [name]: action.range
                    }
                };

                var all = !state.contributors.find(t => {
                    return votes[t] === undefined;
                });
                var afalse = !!state.contributors.find(t => {
                    return votes[t] === false;
                });
                if (all && !afalse) {

                    var ranges = update.ranges;
                    console.log(update);
                    console.log(action.range);
                    var time = getAgreeableTime(ranges);
                    if (time === null) {
                        update = { ...update, state: MA.THREAD_CANT_CUT_NO_AGREEABLE_TIME };
                    }
                    else {
                        update = { ...update, time, state: MA.THREAD_CUT_APPROVED };
                    }
                }

                return update;
            }
            else {
                console.log('didnt find name')
            }
            break;
    }
    return state;
}
function getAgreeableTime(ranges) {
    var maximum = null;
    var minimum = null;
    Object.keys(ranges).map(t => {
        if (ranges[t]) {
            var max = ranges[t].maximum;
            var min = ranges[t].minimum;
            if (maximum === null) {
                maximum = max;
            }
            if (minimum === null) {
                minimum = min;
            }
            if (maximum >= max) {
                maximum = max;
            }
            if (minimum <= min) {
                minimum = min;
            }
        }
    });
    if (maximum !== null && minimum !== null && maximum >= minimum) {
        return maximum;
    }
    return null;
}
function threadCutRejection(state, action) {
    switch (state.state) {
        case MA.THREAD_CUT_OFF:
            var name = action.from;
            if (name && state.contributors.find(t => t === name)) {
                var votes = {
                    ...(state.votes || {}),
                    [name]: false
                };
                var update = {
                    ...state,
                    votes,
                    threadCutoff: {
                        ...(state.threadCutoff || {})
                    }
                };
                var all = !state.contributors.find(t => {
                    return votes[t] === undefined;
                });
                var afalse = !!state.contributors.find(t => {
                    return votes[t] === false;
                });
                if (all && afalse) {
                    update = { ...update, state: MA.THREAD_CUT_REJECTED };
                }

                return update;
            }
            break;
    }
    return state;
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

function getThreadName(contributorRequest) {
    if (contributorRequest && contributorRequest.connectionInfo && contributorRequest.connectionInfo._info) {
        return contributorRequest.connectionInfo._info.thread || null;
    }
    return null;
}
function getThreadType(contributorRequest) {
    if (contributorRequest && contributorRequest.connectionInfo && contributorRequest.connectionInfo._info) {
        return contributorRequest.connectionInfo._info.threadType || null;
    }
    return null;
}

function addContributor(state, action) {
    switch (state.state) {
        case MA.ACCEPT_CONTRIBUTOR_ADD:
            if (state.contributors.find(t => t === action.from)) {
                var _name = getContributorRequestName(state.contributorRequest);
                var _affectedThread = getThreadName(state.contributorRequest);
                var threadType = getThreadType(state.contributorRequest);
                if (_name === action.name) {
                    return {
                        ...state,
                        state: action.type,
                        contributorElection: [],
                        contributorRequest: null,
                        thread: _affectedThread,
                        threadType,
                        proposed: [...(state.contributors || []).filter(t => t !== action.name), action.name]
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