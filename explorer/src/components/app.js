import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';
import NavBar from './navbar';
import TopBar from './topbar';
import Content from './content';
import Home from './home';
import RedHash from './redhash';
import RedHashEvent from './redhash/hashevent';
import RedHashMeta from './redhash/hashmeta';
import RedHashThread from './redhash/hashthread';
import * as UIA from '../actions';
import * as Titles from './titles';
class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            menuOpen: false
        }
    }
    render() {
        var me = this;
        var { state } = me.props;
        let content = null;
        let title = null;
        switch (UIA.Get(state, UIA.CURRENT_PAGE)) {
            case UIA.REDHASHEVENT:
                content = <RedHashEvent />;
                title = Titles.RedHashEvent;
                break;
            case UIA.REDHASH:
                content = <RedHash />;
                title = Titles.RedHash;
                break;
            case UIA.REDHASHMETA:
                content = <RedHashMeta />;
                title = Titles.RedHashMeta;
                break;
            case UIA.REDHASHTHREAD:
                content = <RedHashThread />
                title = Titles.RedHashThread;
                break;
            default:
                title = Titles.Home;
                content = <Home />
                break;

        }
        return (
            <div>
                <NavBar />
                <TopBar />
                <Content title={title}>
                    {content}
                </Content>
            </div>
        )
    }
}
App = connect(Util.mapStateToProps, Util.mapDispatchToProps)(App)

export default App