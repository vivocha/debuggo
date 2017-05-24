import * as chai from 'chai';
import * as spies from 'chai-spies';
import * as debuggo from '../dist/index';

chai.should();
chai.use(spies);

describe('debuggo', function() {

  describe('getLogger', function() {

    it('create a logger with no context', function() {
      let l = debuggo.getLogger('test-1');
      l.log.should.be.a('function');
    });

    it('create a logger with a context', function() {
      let l = debuggo.getLogger('test-2', 'bbb');
      l.info.should.be.a('function');
    });

    it('create cache loggers by namespace and context', function() {
      let l1 = debuggo.getLogger('test-1');
      let l2 = debuggo.getLogger('test-1');
      let l3 = debuggo.getLogger('test-2', 'bbb');
      let l4 = debuggo.getLogger('test-2', 'bbb');
      let l5 = debuggo.getLogger('test-2', 'ccc');
      let l6 = debuggo.getLogger('test-2');
      l1.should.equal(l2);
      l3.should.equal(l4);
      l4.should.not.equal(l5);
      l5.should.not.equal(l6);
      l6.should.not.equal(l3);
    });

    it('use console.log to log when available', function() {
      let w = {
        console: {
          log: chai.spy(),
          info: chai.spy(),
          warn: chai.spy(),
          error: chai.spy()
        } as any
      };
      (<any>global).window = w;
      let l1 = debuggo.getLogger('test-3');
      l1.info('aaa');
      w.console.info.should.have.been.called.once;

      w.console.debug = chai.spy();
      w.console.trace = chai.spy();
      let l2 = debuggo.getLogger('test-4', 'ccc');
      l2.debug('aaa');
      l2.info('aaa');
      l2.info.log;
      w.console.debug.should.have.been.called.once;
      w.console.info.should.have.been.called.twice;
    });

  });

  describe('namespaces', function() {

    it('should return the namespaces', function() {
      debuggo.namespaces().should.deep.equal(['test-1', 'test-2', 'test-3', 'test-4']);
    })

  });

  describe('cb', function() {

    it('should return a logging callback', function() {
      let w = {
        console: {
          log: chai.spy(),
          info: chai.spy(),
          warn: chai.spy(),
          error: chai.spy()
        } as any
      };
      (<any>global).window = w;
      let f = debuggo.cb('test-5');
      f.should.be.a('function');
      f(null, 'data');
      w.console.info.should.have.been.called.once;
      f('error');
      w.console.error.should.have.been.called.once;

      let f2 = debuggo.cb();
      f2.should.be.a('function');
      f2(null, 'data');
      w.console.info.should.have.been.called.once;
    });

  });

  describe('promise', function() {

    it('should log a promise', function() {
      let w = {
        console: {
          log: chai.spy(),
          info: chai.spy(),
          warn: chai.spy(),
          error: chai.spy()
        } as any
      };
      (<any>global).window = w;
      return debuggo.promise(Promise.resolve(true), 'test-6').then(() => {
        w.console.info.should.have.been.called.once;
        return debuggo.promise(Promise.reject(true), 'test-6').then(() => {
          w.console.error.should.have.been.called.once;
          return debuggo.promise(Promise.reject(true)).then(() => {
            w.console.error.should.have.been.called.once;
          });
        });
      });
    })

  });


});