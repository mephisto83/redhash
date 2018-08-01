import {bindActionCreators} from 'redux';
import * as Actions from './actions';
export const mapStateToProps = (state, ownProps) => {
    return {
        state: state
    }
}

export const mapDispatchToProps = (dispatch) => {

    var result = bindActionCreators(Actions, dispatch);
    result.dispatch = dispatch;
    return result;
} 