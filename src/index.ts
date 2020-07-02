import * as debug from 'debug';
import { IDebugger } from 'debug';
export { disable, enable, IDebugger } from 'debug';

export interface Logger {
  log: IDebugger;
  info: IDebugger;
  warn: IDebugger;
  error: IDebugger;
  debug: IDebugger;
  trace: IDebugger;
}

export interface LoggerOptions {
  ns: string;
  context?: string;
  cache?: boolean;
}

const __namespaces: {
  [ns: string]: boolean;
} = {};
const __loggers: {
  [ns: string]: Logger;
} = {};

function wrap(opts: LoggerOptions, type: string): IDebugger {
  const d = debug(`${opts.ns}:${type}`);
  d.destroy(); // this is to avoid caching forever in debug.instances
  if (opts.context) {
    const handler = {
      apply: function (target, thisArg, argumentList) {
        const [formatter, ...args] = argumentList;
        return target.call(thisArg, `${opts.context} ${formatter}`, ...args);
      },
    };
    return new Proxy(d, handler);
  } else {
    return d;
  }
}

function createLogger(opts: LoggerOptions): Logger {
  let out: Logger = <Logger>['log', 'info', 'warn', 'error', 'debug', 'trace'].reduce((out, key) => {
    out[key] = wrap(opts, key);
    return out;
  }, {});

  if (typeof window === 'object' && typeof window.console === 'object') {
    try {
      out.log.log = window.console.log.bind(window.console);
      out.info.log = window.console.info.bind(window.console);
      out.warn.log = window.console.warn.bind(window.console);
      out.error.log = window.console.error.bind(window.console);
      out.debug.log = (window.console.debug ? window.console.debug : window.console.log).bind(window.console);
      out.trace.log = (window.console.trace ? window.console.trace : window.console.log).bind(window.console);
    } catch (e) {}
  }

  for (let i in out) {
    out[i].destroy(); // this is to avoid caching forever in debug.instances
  }

  return out;
}

export function getLogger(ns: string, context?: string, cache?: boolean);
export function getLogger(opts: LoggerOptions): Logger;
export function getLogger(nsOrOpts: string | LoggerOptions, context?: string, cache?: boolean): Logger {
  const opts: LoggerOptions = typeof nsOrOpts === 'string' ? { ns: nsOrOpts, context, cache } : nsOrOpts;
  let out: Logger;
  if (opts.cache === false) {
    out = createLogger(opts);
  } else {
    let cacheKey = opts.context ? `${opts.ns}@@${opts.context}` : opts.ns;
    if (!__loggers[cacheKey]) {
      __namespaces[opts.ns] = true;
      __loggers[cacheKey] = createLogger(opts);
    }
    out = __loggers[cacheKey];
  }
  return out;
}

export function namespaces() {
  return Object.keys(__namespaces);
}

export function cb(ns: string = ''): (err: any, data?: any) => void {
  const l: Logger = getLogger(ns);
  return (err: any, data?: any) => {
    if (err) {
      l.error(err);
    } else {
      l.info(data);
    }
  };
}

export function promise(p: PromiseLike<any>, ns: string = ''): PromiseLike<any> {
  const l: Logger = getLogger(ns);
  return p.then(
    function (data) {
      l.info(data);
    },
    function (err) {
      l.error(err);
    }
  );
}
