import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';
import NavBar from './navbar';
import TopBar from './topbar';
import Content from './content';
import Row from './row';
import Panel from './Panel';
class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            menuOpen: false
        }
    }
    render() {
        var { state, dispatch } = this.props;
        return (
            <div>
                <NavBar />
                <TopBar />
                <Content>
                    <Row>
                        <Panel>asdf</Panel>
                    </Row>
                </Content>
            </div>
        )
    }
}
App = connect(Util.mapStateToProps, Util.mapDispatchToProps)(App)

export default App