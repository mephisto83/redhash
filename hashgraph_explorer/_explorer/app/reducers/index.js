// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import uiReducer from './uireducer';

const rootReducer = combineReducers({
  router,
  uiReducer
});

export default rootReducer;
