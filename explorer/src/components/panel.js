import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';
class Panel extends Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }
    render() {
        var { state, dispatch } = this.props;
        return (
            <div className="card">
                <div className={`header ${this.props.headerCls || 'bg-red'}`}>
                    <div className="row clearfix">
                        <div className="col-xs-12 col-sm-6">
                            <h2>{this.props.title}</h2>
                        </div>
                    </div>
                </div>
                <div className="body">
                    {this.props.children}
                </div>
            </div>
        )
    }
}
Panel = connect(Util.mapStateToProps, Util.mapDispatchToProps)(Panel)

export default Panel