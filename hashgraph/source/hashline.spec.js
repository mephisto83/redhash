import assert from 'assert';
import HashLine from './hashline';


describe('HashLine', function () {
    it('can create a hash line', () => {
        var line = new HashLine('line', 'self');
        assert.ok(line);
    });
    
    it('can create initial has line setup', () => {
        //Two threads, membership thread, and a event thread.
        var line = new HashLine('line', 'self');
        line.initialize();
        console.log(line.membershipThread);
        assert.ok(line.membershipThread);
        assert.ok(line.eventThread);
        assert.ok(line.threads);
    });
});