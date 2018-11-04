import assert from 'assert';
import HashLine, { EVENT_THREAD } from './hashline';
import HashGraph from './hashgraph';
import HashEvent from './hashevent';
import TestMessageService from './testmessageservice';
import SocketMessageService from './socketmessageservice';
import * as HThread from './hashthread';
import ET from './eventtypes';
import { MEMBERSHIP_THREAD } from './hashline';
import IConnectionInfo from './statemachines/iconnectioninfo';
import * as MA from './statemachines/membershipactions';
import MembershipStateMachine from './statemachines/membershipstatemachine';
import CatStateMachine from './statemachines/catstatemachine';
import * as CSM from './statemachines/catstatemachine';
describe.only('HashGraph', function () {
    let EVENT = 'EVENT';

    xit('can create a hash line', () => {

        var hashGraph = HashGraph.config({
            id: 'id',
            useProxySocket: true,
            useProxyServer: true,
            useRedHashController: true
        }).addStateMachine({
            name: 'csm',
            create: function () {
                return new CatStateMachine({
                });
            }
        });
    });

    it('can setup a hashgraph', () => {
        var hashGraph = HashGraph.config({
            id: 'id',
            useProxySocket: true,
            useProxyServer: true,
            useRedHashController: true
        });
        assert.ok(hashGraph);

        return hashGraph.start().then((server) => {
            assert.ok(server);
            return hashGraph.stop();
        });
    });

    it('can add a state machine', () => {
        var hashGraph = HashGraph.config({
            id: 'id',
            useProxySocket: true,
            useProxyServer: true,
            useRedHashController: true
        }).addStateMachine({
            name: 'csm',
            create: function () {
                return new CatStateMachine({
                });
            }
        });
    });

    it('can hashGraph start stream', () => {
        var hashGraph = HashGraph.config({
            id: 'id',
            useProxySocket: true,
            useProxyServer: true,
            useRedHashController: true,
        }).addStateMachine({
            name: 'csm',
            create: function () {
                return new CatStateMachine({
                });
            }
        });

        return hashGraph.start().then(() => {
            return hashGraph.launch('csm').then(() => {
                hashGraph.sendEvent('csm', { type: CSM.UPDATE, name: EVENT, value: 'an event 2' });
                var events = hashGraph.getLine('csm').getEventsToSend();
                console.log(events);
                assert.ok(events);
                assert.ok(events.length === 0);
                hashGraph.getLine('csm').applyThread(EVENT_THREAD);
                console.log(hashGraph.getLine('csm').threads)
                var state = hashGraph.getState('csm');
                console.log(state);
                return hashGraph.stop();
            });
        });
    });


    it('can hashGraph start stream, proxy configs', () => {
        var hashGraph = HashGraph.config({
            id: 'id',
            useProxySocket: true,
            useProxyServer: true,
            useRedHashController: true,
            proxyServer: {
                address: '127',
                port: '5001'
            }
        }).addStateMachine({
            name: 'csm',
            create: function () {
                return new CatStateMachine({
                });
            }
        });

        return hashGraph.start().then(() => {
            return hashGraph.launch('csm').then(() => {
                return hashGraph.stop();
            });
        });
    });

    it('can hashGraph start stream, proxy configs', () => {
        var hashGraph = HashGraph.config({
            id: 'id',
            useProxySocket: true,
            useProxyServer: true,
            useDefaultConnectionHandler: true,
            userDefaultJoinHandler: true,
            useRedHashController: true,
            socketPreferences: {
                address: '127',
                port: 6000
            },
            proxyServer: {
                port: '5001'
            }
        }).addStateMachine({
            name: 'csm',
            create: function () {
                return new CatStateMachine({
                });
            }
        }).addPotentialParticipant({
            address: '127.0.0.1',
            port: '5002'
        });

        var hashGraph2 = HashGraph.config({
            id: 'id2',
            useProxySocket: true,
            useProxyServer: true,
            useDefaultConnectionHandler: true,
            userDefaultJoinHandler: true,
            useRedHashController: true,
            socketPreferences: {
                address: '127',
                port: 8000
            },
            proxyServer: {
                port: '5002'
            }
        }).addStateMachine({
            name: 'csm',
            create: function () {
                return new CatStateMachine({
                });
            }
        });

        return hashGraph.start().then(() => {
            return hashGraph.launch('csm').then(() => {
                return hashGraph2.start().then(() => {
                    return hashGraph2.launch('csm').then(() => {
                        return hashGraph.connect();
                    })
                })
            }).then(() => {
                return Promise.all(Object.keys(hashGraph.openListeners).map(key => {
                    return hashGraph.isOpen({
                        address: hashGraph.openListeners[key].address,
                        port: hashGraph.openListeners[key].port,
                        id: key

                    });
                }));
            })
            .then(()=>{
                console.log('joining csm --------------------------')
                return hashGraph2.join('id', 'csm');
            })
            .then(() => {
                console.log('joined')
                hashGraph.sendEvent('csm', { type: CSM.UPDATE, name: EVENT, value: 'an event 2' });
                var events = hashGraph.getLine('csm').getEventsToSend();
                console.log(events);
                assert.ok(events);
                assert.ok(events.length === 0);
                hashGraph.getLine('csm').applyThread(EVENT_THREAD);
                console.log(hashGraph.getLine('csm').threads)
                var state = hashGraph.getState('csm');
                console.log(state);
            }).then(() => {
                return hashGraph.stop();
            }).then(() => {
                return hashGraph2.stop();
            });
        });
    });
});