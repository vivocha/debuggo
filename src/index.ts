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

const __namespaces: {
  [ns: string]: boolean;
} = {};
const __loggers: {
  [ns: string]: Logger;
} = {};

function createLogger(ns: string, context?: string): Logger {
  let d = context
    ? function(label: string): IDebugger {
        let origDebugger: IDebugger = debug(label);
        let wrappedDebugger: IDebugger = <IDebugger>function(formatter: string, ...args: any[]) {
          origDebugger(`${context} ${formatter}`, ...args);
        };
        ['namespace', 'enabled', 'userColors', 'color'].forEach(i => {
          wrappedDebugger[i] = origDebugger[i];
        });
        wrappedDebugger['destroy'] = () => origDebugger['destroy']();
        Object.defineProperty(wrappedDebugger, 'log', {
          get: () => origDebugger.log,
          set: v => (origDebugger.log = v)
        });
        return wrappedDebugger;
      }
    : debug;

  let out: Logger = {
    log: d(ns + ':log'),
    info: d(ns + ':info'),
    warn: d(ns + ':warn'),
    error: d(ns + ':error'),
    debug: d(ns + ':debug'),
    trace: d(ns + ':trace')
  };

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
  return out;
}

export function getLogger(ns: string, context?: string, cache?: boolean): Logger {
  let out: Logger;
  if (cache === false) {
    out = createLogger(ns, context);
    for (let i in out) {
      out[i].destroy(); // this is to avoid caching forever in debug.instances
    }
  } else {
    let cacheKey = context ? `${ns}@@${context}` : ns;

    if (!__loggers[cacheKey]) {
      __namespaces[ns] = true;
      __loggers[cacheKey] = createLogger(ns, context);
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
    function(data) {
      l.info(data);
    },
    function(err) {
      l.error(err);
    }
  );
}
