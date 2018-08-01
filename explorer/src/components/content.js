import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';
class Content extends Component {
    constructor(props) {
        super(props)
        this.state = {
            menuOpen: false
        }
    }
    render() {

        var { state, dispatch } = this.props;
        return (<section className="content">
            <div className="container-fluid">
                <div className="block-header">
                    <h2>{this.props.title || 'DASHBOARD'}</h2>
                </div>
                {this.props.children}
            </div>
        </section>
        )
    }
}
Content = connect(Util.mapStateToProps, Util.mapDispatchToProps)(Content)

export default Content