import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Util from '../../util';
import * as UIA from '../../actions';
import RedHash from 'redhashgraph';
import Properties from '../properties';
import Row from '../row';
import Panel from '../panel';
import * as Titles from '../titles';
import { RippleButton } from './hashmetadata';
import ThreadMessageTimeline from './threadmessagetimeline';
let { TestMessageService, strarse, HashEvent } = RedHash;
import HashMetaData from './hashmetadata';
class ThreadSimulation extends Component {
    constructor(props) {
        super(props)


        this.state = {
            currentMessage: 0,
            contributors: [].interpolate(0, 5, x => {
                return `contrib-${x}`;
            }),
            messageServices: {},
            messageTransitions: []
        }
    }
    step() {
        TestMessageService.globalStep();
    }
    pumpMessages() {
        var me = this;
        var { threadDic } = me.state;
        Object.keys(threadDic).map(id => {
            var thread = threadDic[id];
            var eventsToSend = thread.getEventsToSend();
            if (eventsToSend.length) {
                if (!me.state.sendAll) {
                    eventsToSend.map(ets => {
                        var destinations = thread.getNextPossibleDestinationsFor(ets.id).random().subset(0, 2);
                        // var tempThread = threads.find(t => t.self === destinations[0]);
                        var alreadySent = me.state.messageTransitions.filter(x => x.from === id && ets.id === x.id);
                        if (destinations.length) {
                            var res = [...destinations].map(dest => {
                                var ms = me.state.messageServices[dest];
                                return ms.send(ets, dest, id).then(res => {
                                    thread.sentEventSuccessfully(ets.id, dest, res);

                                });
                            });
                            Promise.all(res).catch(e => {
                                me.setState({ messagefailure: e })
                            }).then(() => {
                                me.setState({ update: Date.now() });
                                me.setState({
                                    messageTransitions: [...me.state.messageTransitions, ...destinations.map(t => {
                                        return {
                                            from: id,
                                            to: t,
                                            id: ets.id
                                        }
                                    })]
                                });
                            });
                        }
                    });
                }
            }
        });

    }
    sendMessage(from) {
        var message = this.state.currentMessage + 1;
        var thread = this.state.threadDic[from];
        thread.sendEvent(new HashEvent(`${message}`, null, this.state.contributors));
        this.setState({ currentMessage: message });
    }
    componentWillUnmount() {
        this.setState({
            messageServices: {},
            threadDic: {},
            messageTransitions: []
        })
    }
    componentDidMount() {
        var me = this;
        var threadid = 'thread-1234';
        let mss = {};
        let threadDic = {};
        var threads = me.state.contributors.map(contrib => {
            var t = RedHash.HashThread.createThread(contrib, me.state.contributors, threadid);
            t._id = contrib;
            var ms = new TestMessageService(t.id);
            ms.onmessage((message, to, from) => {
                var mess = strarse(message);
                return threadDic[to].receiveEvent(mess, from);
            });
            //threadDic[from].sentEventSuccessfully(mess.id, to);
            mss[t.id] = ms;
            mss[contrib] = ms;
            threadDic[t.id] = t;
            return t;
        });
        me.setState({
            threadDic,
            messageServices: mss,
            threads
        });
        var time = 1;
        RedHash.HashEvent.timeService = {
            now: () => {
                var _t = time;
                time += 100;
                return _t;
            }
        }
        // threads.map(thread => {
        //     [].interpolate(0, 3, function (i) {
        //         var evntToSend = thread.getEventsToSend();
        //         if (evntToSend && evntToSend.length) {
        //             var sentEvent = evntToSend[0];
        //             var destinations = thread.getNextPossibleDestinationsFor(sentEvent.id);
        //             var tempThread = threads.find(t => t.self === destinations[0]);
        //             if (tempThread) {
        //                 tempThread.receiveEvent(strarse(sentEvent), thread.self);
        //                 thread.sentEventSuccessfully(sentEvent.id, tempThread.self);

        //                 evntToSend = thread.getEventsToSend();
        //                 thread.printEvents();
        //                 console.log('-----------------------------');
        //             }
        //         }
        //     });
        // });
    }
    render() {
        var me = this;
        var { state } = me.props;
        var threads = me.state.threads || [];
        var res = [];
        threads.map(thread => {
            var completed = thread.getCompletedEvents();
            var consensus = thread.getConsensusEvents();
            var eventSituation = thread.eventList.map((evt, i) => {
                return (<div style={{ flex: 1 }} key={`meta-${i}`}>
                    <HashMetaData diagonalOnly={true} disabled={true} meta={evt.meta} size={threads.length} />
                </div>)
            });
            res.push((
                <Row key={thread.id}>
                    <p>{thread.id}</p>
                    <RippleButton onClick={() => {
                        me.sendMessage(thread.id);
                    }} title={Titles.SendMessage} />
                    <p>
                        <span>{Titles.Completed}: {completed ? completed.length : null}</span>
                        <span>{Titles.Consensus}: {consensus ? consensus.length : null}</span>
                    </p>
                </Row>));

            res.push((<div key={`${thread.id}-asdf`} style={{ display: 'flex', flexDirection: 'row' }}>
                {eventSituation}
            </div>));
        });
        return (<div>
            <Row>
                <div className="btn-group btn-group-lg" role="group" aria-label="Large button group">
                    <RippleButton onClick={() => {
                        me.pumpMessages();
                        me.step();
                    }} title={`${Titles.Pump} & ${Titles.Step}`} />
                </div>
            </Row>
            <Row>
                <ThreadMessageTimeline threadDic={me.state.threadDic} messageTransitions={me.state.messageTransitions} />
            </Row>
            {res}
        </div>);
    }
}
ThreadSimulation = connect(Util.mapStateToProps, Util.mapDispatchToProps)(ThreadSimulation)

export default ThreadSimulation