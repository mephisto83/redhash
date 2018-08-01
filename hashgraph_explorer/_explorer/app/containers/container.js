import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as CounterActions from '../actions/uiactions';

function mapStateToProps(state) {
    return {
        state: state
    };
}

function mapDispatchToProps(dispatch) {
    var result = bindActionCreators({ ...CounterActions }, dispatch);
    result.dispatch = dispatch;
    return result;
}

export default function (t) {
    return connect(mapStateToProps, mapDispatchToProps)(t);
};
