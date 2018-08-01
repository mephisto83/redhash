export const RESET_ALL = 'RESET_ALL';
export const UI_UPDATE = 'UI_UPDATE';
export const BATCH = 'BATCH';
export const MENU_OPEN = 'MENU_OPEN';



export function UI(name, value) {
    return {
        type: UI_UPDATE,
        name,
        value
    }
}


export function Get(state, key) {
    return state.uiReducer[key];
}