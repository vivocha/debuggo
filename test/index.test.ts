import * as chai from 'chai';
import * as spies from 'chai-spies';
import * as debuggo from '../dist/index';

chai.should();
chai.use(spies);

describe('debuggo', function() {

  describe('createLogger', function() {

    it('create a logger with no context', function() {
      let l = debuggo.createLogger('test');
      l.log.should.be.a('function');
      l.info.should.be.a('function');
      l.warn.should.be.a('function');
      l.error.should.be.a('function');
      l.debug.should.be.a('function');
      l.trace.should.be.a('function');
    });

    it('create a logger with a context', function() {
      let l = debuggo.createLogger('test', 'bbb');
      l.log.should.be.a('function');
      l.info.should.be.a('function');
      l.warn.should.be.a('function');
      l.error.should.be.a('function');
      l.debug.should.be.a('function');
      l.trace.should.be.a('function');
    });

    it('use console.log to log when available', function() {
      let w = {
        console: {
          info: chai.spy(),
          warn: chai.spy(),
          error: chai.spy()
        } as any
      };
      (<any>global).window = w;
      let l1 = debuggo.createLogger('test');
      l1.info('aaa');
      w.console.info.should.have.been.called.once;

      w.console.debug = chai.spy();
      let l2 = debuggo.createLogger('test', 'ccc');
      l2.debug('aaa');
      l2.info('aaa');
      l2.info.log;
      w.console.debug.should.have.been.called.once;
      w.console.info.should.have.been.called.twice;
    });

  });

  describe('namespaces', function() {

    it('should return the namespaces', function() {
      debuggo.namespaces().should.deep.equal(['test']);
      debuggo.createLogger('test2');
      debuggo.namespaces().should.deep.equal(['test', 'test2']);
    })

  });

  describe('cb', function() {

    it('should return a logging callback', function() {
      let w = {
        console: {
          info: chai.spy(),
          warn: chai.spy(),
          error: chai.spy()
        } as any
      };
      (<any>global).window = w;
      let f = debuggo.cb('test');
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
          info: chai.spy(),
          warn: chai.spy(),
          error: chai.spy()
        } as any
      };
      (<any>global).window = w;
      return debuggo.promise(Promise.resolve(true), 'test').then(() => {
        w.console.info.should.have.been.called.once;
        return debuggo.promise(Promise.reject(true), 'test').then(() => {
          w.console.error.should.have.been.called.once;
          return debuggo.promise(Promise.reject(true)).then(() => {
            w.console.error.should.have.been.called.once;
          });
        });
      });
    })

  });


});