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
describe('HashGraph', function () {
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
    })
});