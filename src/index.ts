import * as debug from 'debug';

const __namespaces: { [ns:string]: boolean } = {};

export interface Logger {
  log: debug.IDebugger;
  info: debug.IDebugger;
  warn: debug.IDebugger;
  error: debug.IDebugger;
  debug: debug.IDebugger;
  trace: debug.IDebugger;
}

export function createLogger(ns: string, context?: string): Logger {
  __namespaces[ns] = true;
  let d = context ? function(label:string): debug.IDebugger {
    let origDebugger:debug.IDebugger = debug(label);
    let wrappedDebugger:debug.IDebugger = <debug.IDebugger>function(formatter: string, ...args: any[]) {
      origDebugger(`${context} ${formatter}`, ...args);
    };
    wrappedDebugger.enabled = origDebugger.enabled;
    wrappedDebugger.namespace = origDebugger.namespace;
    Object.defineProperty(wrappedDebugger, 'log', {
      get: () => origDebugger.log,
      set: v => origDebugger.log = v
    });
    return wrappedDebugger;
  } : debug;

  let out:Logger = {
    log: d(ns + ':log'),
    info: d(ns + ':info'),
    warn: d(ns + ':warn'),
    error: d(ns + ':error'),
    debug: d(ns + ':debug'),
    trace: d(ns + ':trace')
  };

  if (typeof window === 'object' && typeof window.console === 'object') {
    try {
      out.info.log = window.console.info.bind(console);
      out.warn.log = window.console.warn.bind(console);
      out.error.log = window.console.error.bind(console);
      if (window.console.debug) {
        out.debug.log = window.console.debug.bind(console);
      }
    } catch (e) {
    }
  }

  return out;
}

export function namespaces() {
  return Object.keys(__namespaces);
}

export function cb(ns: string = ''): ((err: any, data?: any) => void) {
  const l:Logger = createLogger(ns);
  return (err: any, data?: any) => {
    if (err) {
      l.error(err);
    } else {
      l.info(data);
    }
  }
}

export function promise(p:PromiseLike<any>, ns: string = ''): PromiseLike<any> {
  const l:Logger = createLogger(ns);
  return p.then(function(data) {
    l.info(data);
  }, function(err) {
    l.error(err);
  })
}
