export const anAction = () => {
    return {
        type: 'something'
    }
}

export const RESET_ALL = 'RESET_ALL';
export const BATCH = 'BATCH';
export const UI_UPDATE = 'UI_UPDATE';
export function UI(name, value) {
    return {
        type: UI_UPDATE,
        name,
        value
    }
}

export function Get(state, key) {
    return state.Reducer[key];
}

export const CURRENT_PAGE = 'CURRENT_PAGE';
export const REDHASH = 'REDHASH';
export const REDHASHEVENT = 'REDHASHEVEHT';
export const REDHASHMETA = 'REDHASHMETA';
export const REDHASHTHREAD = 'REDHASHTHREAD';
export const HOME = 'HOME';