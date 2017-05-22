"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const __namespaces = {};
function createLogger(ns, context) {
    __namespaces[ns] = true;
    let d = context ? function (label) {
        let origDebugger = debug(label);
        let wrappedDebugger = function (formatter, ...args) {
            origDebugger(`${context} ${formatter}`, ...args);
        };
        wrappedDebugger.enabled = origDebugger.enabled;
        wrappedDebugger.log = origDebugger.log;
        wrappedDebugger.namespace = origDebugger.namespace;
        return wrappedDebugger;
    } : debug;
    let out = {
        log: d(ns + ':log'),
        info: d(ns + ':info'),
        warn: d(ns + ':warn'),
        error: d(ns + ':error'),
        debug: d(ns + ':debug'),
        trace: d(ns + ':trace')
    };
    if (typeof window === 'object' && typeof window.console === 'object') {
        try {
            out.info.log = console.info.bind(console);
            out.warn.log = console.warn.bind(console);
            out.error.log = console.error.bind(console);
            if (console.debug)
                out.debug.log = console.debug.bind(console);
        }
        catch (e) {
        }
    }
    return out;
}
exports.createLogger = createLogger;
function namespaces() {
    return Object.keys(__namespaces);
}
exports.namespaces = namespaces;
function cb(ns = '') {
    return (err, data) => {
        if (err) {
            debug(`${ns}:error`)(err);
        }
        else {
            debug(`${ns}:info`)(data);
        }
    };
}
exports.cb = cb;
function promise(p, ns = '') {
    p.then(function (data) {
        debug(`${ns}:info`)(data);
    }, function (err) {
        debug(`${ns}:error`)(err);
    });
}
exports.promise = promise;
