import debug from 'debug';

export interface Debugger {
  (formatter: any, ...args: any[]): void;
  color: string;
  diff: number;
  enabled: boolean;
  log: (...args: any[]) => any;
  namespace: string;
  destroy: () => boolean;
  extend: (namespace: string, delimiter?: string) => Debugger;
}

export type IDebugger = Debugger;

const enable = debug.enable.bind(debug);
const disable = debug.disable.bind(debug);
export { enable, disable };

export type LogLevel = 'trace' | 'debug' | 'log' | 'info' | 'warn' | 'error';
export type LogMethodName = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace';

const LOG_METHODS: LogMethodName[] = ['log', 'info', 'warn', 'error', 'debug', 'trace'];

const LEVEL_HIERARCHY: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  log: 2,
  info: 3,
  warn: 4,
  error: 5,
};

export interface Logger {
  log: Debugger;
  info: Debugger;
  warn: Debugger;
  error: Debugger;
  debug: Debugger;
  trace: Debugger;
  setLevel(level: LogLevel): void;
  pushContext(entry: string): void;
  popContext(): string | undefined;
  resetContext(): void;
}

export interface LoggerOptions {
  ns: string;
  context?: string;
  cache?: boolean;
}

const __namespaces: Record<string, boolean> = {};
const __loggers: Record<string, Logger> = {};

class LoggerImpl implements Logger {
  readonly ns: string;
  private _baseContext: string | undefined;
  private _contextStack: string[] = [];
  _level: LogLevel | undefined;
  private _debugInstances: Record<LogMethodName, Debugger>;

  log!: Debugger;
  info!: Debugger;
  warn!: Debugger;
  error!: Debugger;
  debug!: Debugger;
  trace!: Debugger;

  constructor(opts: LoggerOptions) {
    this.ns = opts.ns;
    this._baseContext = opts.context;

    this._debugInstances = {} as Record<LogMethodName, Debugger>;
    for (const method of LOG_METHODS) {
      this._debugInstances[method] = debug(`${opts.ns}:${method}`);
    }

    for (const method of LOG_METHODS) {
      const d = this._debugInstances[method];
      const self = this;
      const handler: ProxyHandler<Debugger> = {
        apply(target, thisArg, argumentList: unknown[]) {
          const ctx = [self._baseContext, ...self._contextStack].filter(Boolean).join(' ');
          if (ctx) {
            const [formatter, ...args] = argumentList;
            return target.call(thisArg, `${ctx} ${formatter}`, ...args);
          }
          return target.apply(thisArg, argumentList as [string, ...unknown[]]);
        },
        get(target, prop, receiver) {
          return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value) {
          return Reflect.set(target, prop, value);
        },
      };
      (this as unknown as Record<string, Debugger>)[method] = new Proxy(d, handler) as Debugger;
    }

    if (typeof window === 'object' && typeof window.console === 'object') {
      try {
        (this.log as Debugger).log = window.console.log.bind(window.console);
        (this.info as Debugger).log = window.console.info.bind(window.console);
        (this.warn as Debugger).log = window.console.warn.bind(window.console);
        (this.error as Debugger).log = window.console.error.bind(window.console);
        (this.debug as Debugger).log = ((window.console as unknown as Record<string, unknown>).debug
          ? (window.console as Console).debug
          : window.console.log
        ).bind(window.console);
        (this.trace as Debugger).log = ((window.console as unknown as Record<string, unknown>).trace
          ? (window.console as Console).trace
          : window.console.log
        ).bind(window.console);
      } catch (_e) {
        // Silently ignore browser console binding errors
      }
    }
  }

  setLevel(level: LogLevel): void {
    if (!(level in LEVEL_HIERARCHY)) {
      throw new Error(`Invalid log level: ${level}. Valid levels are: ${Object.keys(LEVEL_HIERARCHY).join(', ')}`);
    }
    this._level = level;
    const threshold = LEVEL_HIERARCHY[level];
    for (const method of LOG_METHODS) {
      this._debugInstances[method].enabled = LEVEL_HIERARCHY[method] >= threshold;
    }
  }

  pushContext(entry: string): void {
    this._contextStack.push(entry);
  }

  popContext(): string | undefined {
    return this._contextStack.pop();
  }

  resetContext(): void {
    this._contextStack = [];
  }
}

export function getLogger(ns: string, context?: string, cache?: boolean): Logger;
export function getLogger(opts: LoggerOptions): Logger;
export function getLogger(nsOrOpts: string | LoggerOptions, context?: string, cache?: boolean): Logger {
  const opts: LoggerOptions = typeof nsOrOpts === 'string' ? { ns: nsOrOpts, context, cache } : nsOrOpts;
  let out: Logger;
  if (opts.cache === false) {
    out = new LoggerImpl(opts);
  } else {
    const cacheKey = opts.context ? `${opts.ns}@@${opts.context}` : opts.ns;
    if (!__loggers[cacheKey]) {
      __namespaces[opts.ns] = true;
      __loggers[cacheKey] = new LoggerImpl(opts);
    }
    out = __loggers[cacheKey];
  }
  return out;
}

export function setLevel(pattern: string): void {
  debug.enable(pattern);
}

export function namespaces(): string[] {
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
    },
  );
}
