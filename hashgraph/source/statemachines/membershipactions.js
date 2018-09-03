/// First state, and can only be in this state if there is no previous state.
export const INITIALIZE_STATE = 'INITIALIZE_STATE';

export const REQUEST_CONTRIBUTOR_ADD = 'REQUEST_CONTRIBUTOR_ADD';
export const ACCEPT_CONTRIBUTOR_ADD = 'ACCEPT_CONTRIBUTOR_ADD';
export const REJECT_CONTRIBUTOR_ADD = 'REJECT_CONTRIBUTOR_ADD';

export const REQUEST_CONTRIBUTOR_REMOVE = 'REQUEST_CONTRIBUTOR_REMOVE';
export const ACCEPT_CONTRIBUTOR_REMOVE = 'ACCEPT_CONTRIBUTOR_REMOVE';
export const REJECT_CONTRIBUTOR_REMOVE = 'REJECT_CONTRIBUTOR_REMOVE';

export const ADD_CONTRIBUTOR = 'ADD_CONTRIBUTOR';
export const REMOVE_CONTRIBUTOR = 'REMOVE_CONTRIBUTOR';

export const UPDATE_THREAD = 'UPDATE_THREAD';
export const THREAD_CUT_OFF = 'THREAD_CUT_OFF';
export const THREAD_CUT_APPROVAL = 'THREAD_CUT_APPROVAL';
export const THREAD_CUT_APPROVED = 'THREAD_CUT_APPROVED';
export const THREAD_CUT_REJECT = 'THREAD_CUT_REJECT';
export const THREAD_CUT_REJECTED = 'THREAD_CUT_REJECTED';