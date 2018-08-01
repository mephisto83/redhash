import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import Reducers from './reducers'
import App from './components/app'

import thunk from 'redux-thunk';

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);


function configureStore(initialState) {
    var store = createStoreWithMiddleware(Reducers, initialState);

    return store;
}

var store;
store = configureStore();


render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
)