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
            <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12">
                <div class="info-box bg-pink hover-expand-effect">
                    <div class="icon">
                        <i class="material-icons">playlist_add_check</i>
                    </div>
                    <div class="content">
                        {this.props.children}
                    </div>
                </div>
            </div>
        )
    }
}
Panel = connect(Util.mapStateToProps, Util.mapDispatchToProps)(Panel)

export default Panel