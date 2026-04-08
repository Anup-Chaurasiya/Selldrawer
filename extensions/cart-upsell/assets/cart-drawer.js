"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/react/cjs/react.production.min.js
  var require_react_production_min = __commonJS({
    "node_modules/react/cjs/react.production.min.js"(exports) {
      "use strict";
      var l = Symbol.for("react.element");
      var n = Symbol.for("react.portal");
      var p = Symbol.for("react.fragment");
      var q = Symbol.for("react.strict_mode");
      var r = Symbol.for("react.profiler");
      var t = Symbol.for("react.provider");
      var u = Symbol.for("react.context");
      var v = Symbol.for("react.forward_ref");
      var w = Symbol.for("react.suspense");
      var x = Symbol.for("react.memo");
      var y = Symbol.for("react.lazy");
      var z = Symbol.iterator;
      function A(a) {
        if (null === a || "object" !== typeof a)
          return null;
        a = z && a[z] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var B = { isMounted: function() {
        return false;
      }, enqueueForceUpdate: function() {
      }, enqueueReplaceState: function() {
      }, enqueueSetState: function() {
      } };
      var C = Object.assign;
      var D = {};
      function E(a, b, e) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e || B;
      }
      E.prototype.isReactComponent = {};
      E.prototype.setState = function(a, b) {
        if ("object" !== typeof a && "function" !== typeof a && null != a)
          throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, a, b, "setState");
      };
      E.prototype.forceUpdate = function(a) {
        this.updater.enqueueForceUpdate(this, a, "forceUpdate");
      };
      function F() {
      }
      F.prototype = E.prototype;
      function G(a, b, e) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e || B;
      }
      var H = G.prototype = new F();
      H.constructor = G;
      C(H, E.prototype);
      H.isPureReactComponent = true;
      var I = Array.isArray;
      var J = Object.prototype.hasOwnProperty;
      var K = { current: null };
      var L = { key: true, ref: true, __self: true, __source: true };
      function M(a, b, e) {
        var d, c = {}, k = null, h = null;
        if (null != b)
          for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b)
            J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
        var g = arguments.length - 2;
        if (1 === g)
          c.children = e;
        else if (1 < g) {
          for (var f = Array(g), m = 0; m < g; m++)
            f[m] = arguments[m + 2];
          c.children = f;
        }
        if (a && a.defaultProps)
          for (d in g = a.defaultProps, g)
            void 0 === c[d] && (c[d] = g[d]);
        return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
      }
      function N(a, b) {
        return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
      }
      function O(a) {
        return "object" === typeof a && null !== a && a.$$typeof === l;
      }
      function escape(a) {
        var b = { "=": "=0", ":": "=2" };
        return "$" + a.replace(/[=:]/g, function(a2) {
          return b[a2];
        });
      }
      var P = /\/+/g;
      function Q(a, b) {
        return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
      }
      function R(a, b, e, d, c) {
        var k = typeof a;
        if ("undefined" === k || "boolean" === k)
          a = null;
        var h = false;
        if (null === a)
          h = true;
        else
          switch (k) {
            case "string":
            case "number":
              h = true;
              break;
            case "object":
              switch (a.$$typeof) {
                case l:
                case n:
                  h = true;
              }
          }
        if (h)
          return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
            return a2;
          })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
        h = 0;
        d = "" === d ? "." : d + ":";
        if (I(a))
          for (var g = 0; g < a.length; g++) {
            k = a[g];
            var f = d + Q(k, g);
            h += R(k, b, e, f, c);
          }
        else if (f = A(a), "function" === typeof f)
          for (a = f.call(a), g = 0; !(k = a.next()).done; )
            k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
        else if ("object" === k)
          throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
        return h;
      }
      function S(a, b, e) {
        if (null == a)
          return a;
        var d = [], c = 0;
        R(a, d, "", "", function(a2) {
          return b.call(e, a2, c++);
        });
        return d;
      }
      function T(a) {
        if (-1 === a._status) {
          var b = a._result;
          b = b();
          b.then(function(b2) {
            if (0 === a._status || -1 === a._status)
              a._status = 1, a._result = b2;
          }, function(b2) {
            if (0 === a._status || -1 === a._status)
              a._status = 2, a._result = b2;
          });
          -1 === a._status && (a._status = 0, a._result = b);
        }
        if (1 === a._status)
          return a._result.default;
        throw a._result;
      }
      var U = { current: null };
      var V = { transition: null };
      var W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
      function X() {
        throw Error("act(...) is not supported in production builds of React.");
      }
      exports.Children = { map: S, forEach: function(a, b, e) {
        S(a, function() {
          b.apply(this, arguments);
        }, e);
      }, count: function(a) {
        var b = 0;
        S(a, function() {
          b++;
        });
        return b;
      }, toArray: function(a) {
        return S(a, function(a2) {
          return a2;
        }) || [];
      }, only: function(a) {
        if (!O(a))
          throw Error("React.Children.only expected to receive a single React element child.");
        return a;
      } };
      exports.Component = E;
      exports.Fragment = p;
      exports.Profiler = r;
      exports.PureComponent = G;
      exports.StrictMode = q;
      exports.Suspense = w;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
      exports.act = X;
      exports.cloneElement = function(a, b, e) {
        if (null === a || void 0 === a)
          throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
        var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
        if (null != b) {
          void 0 !== b.ref && (k = b.ref, h = K.current);
          void 0 !== b.key && (c = "" + b.key);
          if (a.type && a.type.defaultProps)
            var g = a.type.defaultProps;
          for (f in b)
            J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
        }
        var f = arguments.length - 2;
        if (1 === f)
          d.children = e;
        else if (1 < f) {
          g = Array(f);
          for (var m = 0; m < f; m++)
            g[m] = arguments[m + 2];
          d.children = g;
        }
        return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
      };
      exports.createContext = function(a) {
        a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
        a.Provider = { $$typeof: t, _context: a };
        return a.Consumer = a;
      };
      exports.createElement = M;
      exports.createFactory = function(a) {
        var b = M.bind(null, a);
        b.type = a;
        return b;
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(a) {
        return { $$typeof: v, render: a };
      };
      exports.isValidElement = O;
      exports.lazy = function(a) {
        return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
      };
      exports.memo = function(a, b) {
        return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
      };
      exports.startTransition = function(a) {
        var b = V.transition;
        V.transition = {};
        try {
          a();
        } finally {
          V.transition = b;
        }
      };
      exports.unstable_act = X;
      exports.useCallback = function(a, b) {
        return U.current.useCallback(a, b);
      };
      exports.useContext = function(a) {
        return U.current.useContext(a);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(a) {
        return U.current.useDeferredValue(a);
      };
      exports.useEffect = function(a, b) {
        return U.current.useEffect(a, b);
      };
      exports.useId = function() {
        return U.current.useId();
      };
      exports.useImperativeHandle = function(a, b, e) {
        return U.current.useImperativeHandle(a, b, e);
      };
      exports.useInsertionEffect = function(a, b) {
        return U.current.useInsertionEffect(a, b);
      };
      exports.useLayoutEffect = function(a, b) {
        return U.current.useLayoutEffect(a, b);
      };
      exports.useMemo = function(a, b) {
        return U.current.useMemo(a, b);
      };
      exports.useReducer = function(a, b, e) {
        return U.current.useReducer(a, b, e);
      };
      exports.useRef = function(a) {
        return U.current.useRef(a);
      };
      exports.useState = function(a) {
        return U.current.useState(a);
      };
      exports.useSyncExternalStore = function(a, b, e) {
        return U.current.useSyncExternalStore(a, b, e);
      };
      exports.useTransition = function() {
        return U.current.useTransition();
      };
      exports.version = "18.3.1";
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.min.js
  var require_scheduler_production_min = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.min.js"(exports) {
      "use strict";
      function f(a, b) {
        var c = a.length;
        a.push(b);
        a:
          for (; 0 < c; ) {
            var d = c - 1 >>> 1, e = a[d];
            if (0 < g(e, b))
              a[d] = b, a[c] = e, c = d;
            else
              break a;
          }
      }
      function h(a) {
        return 0 === a.length ? null : a[0];
      }
      function k(a) {
        if (0 === a.length)
          return null;
        var b = a[0], c = a.pop();
        if (c !== b) {
          a[0] = c;
          a:
            for (var d = 0, e = a.length, w = e >>> 1; d < w; ) {
              var m = 2 * (d + 1) - 1, C = a[m], n = m + 1, x = a[n];
              if (0 > g(C, c))
                n < e && 0 > g(x, C) ? (a[d] = x, a[n] = c, d = n) : (a[d] = C, a[m] = c, d = m);
              else if (n < e && 0 > g(x, c))
                a[d] = x, a[n] = c, d = n;
              else
                break a;
            }
        }
        return b;
      }
      function g(a, b) {
        var c = a.sortIndex - b.sortIndex;
        return 0 !== c ? c : a.id - b.id;
      }
      if ("object" === typeof performance && "function" === typeof performance.now) {
        l = performance;
        exports.unstable_now = function() {
          return l.now();
        };
      } else {
        p = Date, q = p.now();
        exports.unstable_now = function() {
          return p.now() - q;
        };
      }
      var l;
      var p;
      var q;
      var r = [];
      var t = [];
      var u = 1;
      var v = null;
      var y = 3;
      var z = false;
      var A = false;
      var B = false;
      var D = "function" === typeof setTimeout ? setTimeout : null;
      var E = "function" === typeof clearTimeout ? clearTimeout : null;
      var F = "undefined" !== typeof setImmediate ? setImmediate : null;
      "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
      function G(a) {
        for (var b = h(t); null !== b; ) {
          if (null === b.callback)
            k(t);
          else if (b.startTime <= a)
            k(t), b.sortIndex = b.expirationTime, f(r, b);
          else
            break;
          b = h(t);
        }
      }
      function H(a) {
        B = false;
        G(a);
        if (!A)
          if (null !== h(r))
            A = true, I(J);
          else {
            var b = h(t);
            null !== b && K(H, b.startTime - a);
          }
      }
      function J(a, b) {
        A = false;
        B && (B = false, E(L), L = -1);
        z = true;
        var c = y;
        try {
          G(b);
          for (v = h(r); null !== v && (!(v.expirationTime > b) || a && !M()); ) {
            var d = v.callback;
            if ("function" === typeof d) {
              v.callback = null;
              y = v.priorityLevel;
              var e = d(v.expirationTime <= b);
              b = exports.unstable_now();
              "function" === typeof e ? v.callback = e : v === h(r) && k(r);
              G(b);
            } else
              k(r);
            v = h(r);
          }
          if (null !== v)
            var w = true;
          else {
            var m = h(t);
            null !== m && K(H, m.startTime - b);
            w = false;
          }
          return w;
        } finally {
          v = null, y = c, z = false;
        }
      }
      var N = false;
      var O = null;
      var L = -1;
      var P = 5;
      var Q = -1;
      function M() {
        return exports.unstable_now() - Q < P ? false : true;
      }
      function R() {
        if (null !== O) {
          var a = exports.unstable_now();
          Q = a;
          var b = true;
          try {
            b = O(true, a);
          } finally {
            b ? S() : (N = false, O = null);
          }
        } else
          N = false;
      }
      var S;
      if ("function" === typeof F)
        S = function() {
          F(R);
        };
      else if ("undefined" !== typeof MessageChannel) {
        T = new MessageChannel(), U = T.port2;
        T.port1.onmessage = R;
        S = function() {
          U.postMessage(null);
        };
      } else
        S = function() {
          D(R, 0);
        };
      var T;
      var U;
      function I(a) {
        O = a;
        N || (N = true, S());
      }
      function K(a, b) {
        L = D(function() {
          a(exports.unstable_now());
        }, b);
      }
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(a) {
        a.callback = null;
      };
      exports.unstable_continueExecution = function() {
        A || z || (A = true, I(J));
      };
      exports.unstable_forceFrameRate = function(a) {
        0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a ? Math.floor(1e3 / a) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return y;
      };
      exports.unstable_getFirstCallbackNode = function() {
        return h(r);
      };
      exports.unstable_next = function(a) {
        switch (y) {
          case 1:
          case 2:
          case 3:
            var b = 3;
            break;
          default:
            b = y;
        }
        var c = y;
        y = b;
        try {
          return a();
        } finally {
          y = c;
        }
      };
      exports.unstable_pauseExecution = function() {
      };
      exports.unstable_requestPaint = function() {
      };
      exports.unstable_runWithPriority = function(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            a = 3;
        }
        var c = y;
        y = a;
        try {
          return b();
        } finally {
          y = c;
        }
      };
      exports.unstable_scheduleCallback = function(a, b, c) {
        var d = exports.unstable_now();
        "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
        switch (a) {
          case 1:
            var e = -1;
            break;
          case 2:
            e = 250;
            break;
          case 5:
            e = 1073741823;
            break;
          case 4:
            e = 1e4;
            break;
          default:
            e = 5e3;
        }
        e = c + e;
        a = { id: u++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
        c > d ? (a.sortIndex = c, f(t, a), null === h(r) && a === h(t) && (B ? (E(L), L = -1) : B = true, K(H, c - d))) : (a.sortIndex = e, f(r, a), A || z || (A = true, I(J)));
        return a;
      };
      exports.unstable_shouldYield = M;
      exports.unstable_wrapCallback = function(a) {
        var b = y;
        return function() {
          var c = y;
          y = b;
          try {
            return a.apply(this, arguments);
          } finally {
            y = c;
          }
        };
      };
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_scheduler_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.min.js
  var require_react_dom_production_min = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.min.js"(exports) {
      "use strict";
      var aa = require_react();
      var ca = require_scheduler();
      function p(a) {
        for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++)
          b += "&args[]=" + encodeURIComponent(arguments[c]);
        return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      var da = /* @__PURE__ */ new Set();
      var ea = {};
      function fa(a, b) {
        ha(a, b);
        ha(a + "Capture", b);
      }
      function ha(a, b) {
        ea[a] = b;
        for (a = 0; a < b.length; a++)
          da.add(b[a]);
      }
      var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
      var ja = Object.prototype.hasOwnProperty;
      var ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
      var la = {};
      var ma = {};
      function oa(a) {
        if (ja.call(ma, a))
          return true;
        if (ja.call(la, a))
          return false;
        if (ka.test(a))
          return ma[a] = true;
        la[a] = true;
        return false;
      }
      function pa(a, b, c, d) {
        if (null !== c && 0 === c.type)
          return false;
        switch (typeof b) {
          case "function":
          case "symbol":
            return true;
          case "boolean":
            if (d)
              return false;
            if (null !== c)
              return !c.acceptsBooleans;
            a = a.toLowerCase().slice(0, 5);
            return "data-" !== a && "aria-" !== a;
          default:
            return false;
        }
      }
      function qa(a, b, c, d) {
        if (null === b || "undefined" === typeof b || pa(a, b, c, d))
          return true;
        if (d)
          return false;
        if (null !== c)
          switch (c.type) {
            case 3:
              return !b;
            case 4:
              return false === b;
            case 5:
              return isNaN(b);
            case 6:
              return isNaN(b) || 1 > b;
          }
        return false;
      }
      function v(a, b, c, d, e, f, g) {
        this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
        this.attributeName = d;
        this.attributeNamespace = e;
        this.mustUseProperty = c;
        this.propertyName = a;
        this.type = b;
        this.sanitizeURL = f;
        this.removeEmptyString = g;
      }
      var z = {};
      "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
        z[a] = new v(a, 0, false, a, null, false, false);
      });
      [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
        var b = a[0];
        z[b] = new v(b, 1, false, a[1], null, false, false);
      });
      ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
        z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
      });
      ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
        z[a] = new v(a, 2, false, a, null, false, false);
      });
      "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
        z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
      });
      ["checked", "multiple", "muted", "selected"].forEach(function(a) {
        z[a] = new v(a, 3, true, a, null, false, false);
      });
      ["capture", "download"].forEach(function(a) {
        z[a] = new v(a, 4, false, a, null, false, false);
      });
      ["cols", "rows", "size", "span"].forEach(function(a) {
        z[a] = new v(a, 6, false, a, null, false, false);
      });
      ["rowSpan", "start"].forEach(function(a) {
        z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
      });
      var ra = /[\-:]([a-z])/g;
      function sa(a) {
        return a[1].toUpperCase();
      }
      "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
        var b = a.replace(
          ra,
          sa
        );
        z[b] = new v(b, 1, false, a, null, false, false);
      });
      "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
      });
      ["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
      });
      ["tabIndex", "crossOrigin"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
      });
      z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
      ["src", "href", "action", "formAction"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
      });
      function ta(a, b, c, d) {
        var e = z.hasOwnProperty(b) ? z[b] : null;
        if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1])
          qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
      }
      var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      var va = Symbol.for("react.element");
      var wa = Symbol.for("react.portal");
      var ya = Symbol.for("react.fragment");
      var za = Symbol.for("react.strict_mode");
      var Aa = Symbol.for("react.profiler");
      var Ba = Symbol.for("react.provider");
      var Ca = Symbol.for("react.context");
      var Da = Symbol.for("react.forward_ref");
      var Ea = Symbol.for("react.suspense");
      var Fa = Symbol.for("react.suspense_list");
      var Ga = Symbol.for("react.memo");
      var Ha = Symbol.for("react.lazy");
      Symbol.for("react.scope");
      Symbol.for("react.debug_trace_mode");
      var Ia = Symbol.for("react.offscreen");
      Symbol.for("react.legacy_hidden");
      Symbol.for("react.cache");
      Symbol.for("react.tracing_marker");
      var Ja = Symbol.iterator;
      function Ka(a) {
        if (null === a || "object" !== typeof a)
          return null;
        a = Ja && a[Ja] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var A = Object.assign;
      var La;
      function Ma(a) {
        if (void 0 === La)
          try {
            throw Error();
          } catch (c) {
            var b = c.stack.trim().match(/\n( *(at )?)/);
            La = b && b[1] || "";
          }
        return "\n" + La + a;
      }
      var Na = false;
      function Oa(a, b) {
        if (!a || Na)
          return "";
        Na = true;
        var c = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          if (b)
            if (b = function() {
              throw Error();
            }, Object.defineProperty(b.prototype, "props", { set: function() {
              throw Error();
            } }), "object" === typeof Reflect && Reflect.construct) {
              try {
                Reflect.construct(b, []);
              } catch (l) {
                var d = l;
              }
              Reflect.construct(a, [], b);
            } else {
              try {
                b.call();
              } catch (l) {
                d = l;
              }
              a.call(b.prototype);
            }
          else {
            try {
              throw Error();
            } catch (l) {
              d = l;
            }
            a();
          }
        } catch (l) {
          if (l && d && "string" === typeof l.stack) {
            for (var e = l.stack.split("\n"), f = d.stack.split("\n"), g = e.length - 1, h = f.length - 1; 1 <= g && 0 <= h && e[g] !== f[h]; )
              h--;
            for (; 1 <= g && 0 <= h; g--, h--)
              if (e[g] !== f[h]) {
                if (1 !== g || 1 !== h) {
                  do
                    if (g--, h--, 0 > h || e[g] !== f[h]) {
                      var k = "\n" + e[g].replace(" at new ", " at ");
                      a.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a.displayName));
                      return k;
                    }
                  while (1 <= g && 0 <= h);
                }
                break;
              }
          }
        } finally {
          Na = false, Error.prepareStackTrace = c;
        }
        return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
      }
      function Pa(a) {
        switch (a.tag) {
          case 5:
            return Ma(a.type);
          case 16:
            return Ma("Lazy");
          case 13:
            return Ma("Suspense");
          case 19:
            return Ma("SuspenseList");
          case 0:
          case 2:
          case 15:
            return a = Oa(a.type, false), a;
          case 11:
            return a = Oa(a.type.render, false), a;
          case 1:
            return a = Oa(a.type, true), a;
          default:
            return "";
        }
      }
      function Qa(a) {
        if (null == a)
          return null;
        if ("function" === typeof a)
          return a.displayName || a.name || null;
        if ("string" === typeof a)
          return a;
        switch (a) {
          case ya:
            return "Fragment";
          case wa:
            return "Portal";
          case Aa:
            return "Profiler";
          case za:
            return "StrictMode";
          case Ea:
            return "Suspense";
          case Fa:
            return "SuspenseList";
        }
        if ("object" === typeof a)
          switch (a.$$typeof) {
            case Ca:
              return (a.displayName || "Context") + ".Consumer";
            case Ba:
              return (a._context.displayName || "Context") + ".Provider";
            case Da:
              var b = a.render;
              a = a.displayName;
              a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
              return a;
            case Ga:
              return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
            case Ha:
              b = a._payload;
              a = a._init;
              try {
                return Qa(a(b));
              } catch (c) {
              }
          }
        return null;
      }
      function Ra(a) {
        var b = a.type;
        switch (a.tag) {
          case 24:
            return "Cache";
          case 9:
            return (b.displayName || "Context") + ".Consumer";
          case 10:
            return (b._context.displayName || "Context") + ".Provider";
          case 18:
            return "DehydratedFragment";
          case 11:
            return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
          case 7:
            return "Fragment";
          case 5:
            return b;
          case 4:
            return "Portal";
          case 3:
            return "Root";
          case 6:
            return "Text";
          case 16:
            return Qa(b);
          case 8:
            return b === za ? "StrictMode" : "Mode";
          case 22:
            return "Offscreen";
          case 12:
            return "Profiler";
          case 21:
            return "Scope";
          case 13:
            return "Suspense";
          case 19:
            return "SuspenseList";
          case 25:
            return "TracingMarker";
          case 1:
          case 0:
          case 17:
          case 2:
          case 14:
          case 15:
            if ("function" === typeof b)
              return b.displayName || b.name || null;
            if ("string" === typeof b)
              return b;
        }
        return null;
      }
      function Sa(a) {
        switch (typeof a) {
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return a;
          case "object":
            return a;
          default:
            return "";
        }
      }
      function Ta(a) {
        var b = a.type;
        return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
      }
      function Ua(a) {
        var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
        if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
          var e = c.get, f = c.set;
          Object.defineProperty(a, b, { configurable: true, get: function() {
            return e.call(this);
          }, set: function(a2) {
            d = "" + a2;
            f.call(this, a2);
          } });
          Object.defineProperty(a, b, { enumerable: c.enumerable });
          return { getValue: function() {
            return d;
          }, setValue: function(a2) {
            d = "" + a2;
          }, stopTracking: function() {
            a._valueTracker = null;
            delete a[b];
          } };
        }
      }
      function Va(a) {
        a._valueTracker || (a._valueTracker = Ua(a));
      }
      function Wa(a) {
        if (!a)
          return false;
        var b = a._valueTracker;
        if (!b)
          return true;
        var c = b.getValue();
        var d = "";
        a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
        a = d;
        return a !== c ? (b.setValue(a), true) : false;
      }
      function Xa(a) {
        a = a || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof a)
          return null;
        try {
          return a.activeElement || a.body;
        } catch (b) {
          return a.body;
        }
      }
      function Ya(a, b) {
        var c = b.checked;
        return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
      }
      function Za(a, b) {
        var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
        c = Sa(null != b.value ? b.value : c);
        a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
      }
      function ab(a, b) {
        b = b.checked;
        null != b && ta(a, "checked", b, false);
      }
      function bb(a, b) {
        ab(a, b);
        var c = Sa(b.value), d = b.type;
        if (null != c)
          if ("number" === d) {
            if (0 === c && "" === a.value || a.value != c)
              a.value = "" + c;
          } else
            a.value !== "" + c && (a.value = "" + c);
        else if ("submit" === d || "reset" === d) {
          a.removeAttribute("value");
          return;
        }
        b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
        null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
      }
      function db(a, b, c) {
        if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
          var d = b.type;
          if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value))
            return;
          b = "" + a._wrapperState.initialValue;
          c || b === a.value || (a.value = b);
          a.defaultValue = b;
        }
        c = a.name;
        "" !== c && (a.name = "");
        a.defaultChecked = !!a._wrapperState.initialChecked;
        "" !== c && (a.name = c);
      }
      function cb(a, b, c) {
        if ("number" !== b || Xa(a.ownerDocument) !== a)
          null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
      }
      var eb = Array.isArray;
      function fb(a, b, c, d) {
        a = a.options;
        if (b) {
          b = {};
          for (var e = 0; e < c.length; e++)
            b["$" + c[e]] = true;
          for (c = 0; c < a.length; c++)
            e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
        } else {
          c = "" + Sa(c);
          b = null;
          for (e = 0; e < a.length; e++) {
            if (a[e].value === c) {
              a[e].selected = true;
              d && (a[e].defaultSelected = true);
              return;
            }
            null !== b || a[e].disabled || (b = a[e]);
          }
          null !== b && (b.selected = true);
        }
      }
      function gb(a, b) {
        if (null != b.dangerouslySetInnerHTML)
          throw Error(p(91));
        return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
      }
      function hb(a, b) {
        var c = b.value;
        if (null == c) {
          c = b.children;
          b = b.defaultValue;
          if (null != c) {
            if (null != b)
              throw Error(p(92));
            if (eb(c)) {
              if (1 < c.length)
                throw Error(p(93));
              c = c[0];
            }
            b = c;
          }
          null == b && (b = "");
          c = b;
        }
        a._wrapperState = { initialValue: Sa(c) };
      }
      function ib(a, b) {
        var c = Sa(b.value), d = Sa(b.defaultValue);
        null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
        null != d && (a.defaultValue = "" + d);
      }
      function jb(a) {
        var b = a.textContent;
        b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
      }
      function kb(a) {
        switch (a) {
          case "svg":
            return "http://www.w3.org/2000/svg";
          case "math":
            return "http://www.w3.org/1998/Math/MathML";
          default:
            return "http://www.w3.org/1999/xhtml";
        }
      }
      function lb(a, b) {
        return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
      }
      var mb;
      var nb = function(a) {
        return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
          MSApp.execUnsafeLocalFunction(function() {
            return a(b, c, d, e);
          });
        } : a;
      }(function(a, b) {
        if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a)
          a.innerHTML = b;
        else {
          mb = mb || document.createElement("div");
          mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
          for (b = mb.firstChild; a.firstChild; )
            a.removeChild(a.firstChild);
          for (; b.firstChild; )
            a.appendChild(b.firstChild);
        }
      });
      function ob(a, b) {
        if (b) {
          var c = a.firstChild;
          if (c && c === a.lastChild && 3 === c.nodeType) {
            c.nodeValue = b;
            return;
          }
        }
        a.textContent = b;
      }
      var pb = {
        animationIterationCount: true,
        aspectRatio: true,
        borderImageOutset: true,
        borderImageSlice: true,
        borderImageWidth: true,
        boxFlex: true,
        boxFlexGroup: true,
        boxOrdinalGroup: true,
        columnCount: true,
        columns: true,
        flex: true,
        flexGrow: true,
        flexPositive: true,
        flexShrink: true,
        flexNegative: true,
        flexOrder: true,
        gridArea: true,
        gridRow: true,
        gridRowEnd: true,
        gridRowSpan: true,
        gridRowStart: true,
        gridColumn: true,
        gridColumnEnd: true,
        gridColumnSpan: true,
        gridColumnStart: true,
        fontWeight: true,
        lineClamp: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        tabSize: true,
        widows: true,
        zIndex: true,
        zoom: true,
        fillOpacity: true,
        floodOpacity: true,
        stopOpacity: true,
        strokeDasharray: true,
        strokeDashoffset: true,
        strokeMiterlimit: true,
        strokeOpacity: true,
        strokeWidth: true
      };
      var qb = ["Webkit", "ms", "Moz", "O"];
      Object.keys(pb).forEach(function(a) {
        qb.forEach(function(b) {
          b = b + a.charAt(0).toUpperCase() + a.substring(1);
          pb[b] = pb[a];
        });
      });
      function rb(a, b, c) {
        return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
      }
      function sb(a, b) {
        a = a.style;
        for (var c in b)
          if (b.hasOwnProperty(c)) {
            var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
            "float" === c && (c = "cssFloat");
            d ? a.setProperty(c, e) : a[c] = e;
          }
      }
      var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
      function ub(a, b) {
        if (b) {
          if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML))
            throw Error(p(137, a));
          if (null != b.dangerouslySetInnerHTML) {
            if (null != b.children)
              throw Error(p(60));
            if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML))
              throw Error(p(61));
          }
          if (null != b.style && "object" !== typeof b.style)
            throw Error(p(62));
        }
      }
      function vb(a, b) {
        if (-1 === a.indexOf("-"))
          return "string" === typeof b.is;
        switch (a) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      var wb = null;
      function xb(a) {
        a = a.target || a.srcElement || window;
        a.correspondingUseElement && (a = a.correspondingUseElement);
        return 3 === a.nodeType ? a.parentNode : a;
      }
      var yb = null;
      var zb = null;
      var Ab = null;
      function Bb(a) {
        if (a = Cb(a)) {
          if ("function" !== typeof yb)
            throw Error(p(280));
          var b = a.stateNode;
          b && (b = Db(b), yb(a.stateNode, a.type, b));
        }
      }
      function Eb(a) {
        zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
      }
      function Fb() {
        if (zb) {
          var a = zb, b = Ab;
          Ab = zb = null;
          Bb(a);
          if (b)
            for (a = 0; a < b.length; a++)
              Bb(b[a]);
        }
      }
      function Gb(a, b) {
        return a(b);
      }
      function Hb() {
      }
      var Ib = false;
      function Jb(a, b, c) {
        if (Ib)
          return a(b, c);
        Ib = true;
        try {
          return Gb(a, b, c);
        } finally {
          if (Ib = false, null !== zb || null !== Ab)
            Hb(), Fb();
        }
      }
      function Kb(a, b) {
        var c = a.stateNode;
        if (null === c)
          return null;
        var d = Db(c);
        if (null === d)
          return null;
        c = d[b];
        a:
          switch (b) {
            case "onClick":
            case "onClickCapture":
            case "onDoubleClick":
            case "onDoubleClickCapture":
            case "onMouseDown":
            case "onMouseDownCapture":
            case "onMouseMove":
            case "onMouseMoveCapture":
            case "onMouseUp":
            case "onMouseUpCapture":
            case "onMouseEnter":
              (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
              a = !d;
              break a;
            default:
              a = false;
          }
        if (a)
          return null;
        if (c && "function" !== typeof c)
          throw Error(p(231, b, typeof c));
        return c;
      }
      var Lb = false;
      if (ia)
        try {
          Mb = {};
          Object.defineProperty(Mb, "passive", { get: function() {
            Lb = true;
          } });
          window.addEventListener("test", Mb, Mb);
          window.removeEventListener("test", Mb, Mb);
        } catch (a) {
          Lb = false;
        }
      var Mb;
      function Nb(a, b, c, d, e, f, g, h, k) {
        var l = Array.prototype.slice.call(arguments, 3);
        try {
          b.apply(c, l);
        } catch (m) {
          this.onError(m);
        }
      }
      var Ob = false;
      var Pb = null;
      var Qb = false;
      var Rb = null;
      var Sb = { onError: function(a) {
        Ob = true;
        Pb = a;
      } };
      function Tb(a, b, c, d, e, f, g, h, k) {
        Ob = false;
        Pb = null;
        Nb.apply(Sb, arguments);
      }
      function Ub(a, b, c, d, e, f, g, h, k) {
        Tb.apply(this, arguments);
        if (Ob) {
          if (Ob) {
            var l = Pb;
            Ob = false;
            Pb = null;
          } else
            throw Error(p(198));
          Qb || (Qb = true, Rb = l);
        }
      }
      function Vb(a) {
        var b = a, c = a;
        if (a.alternate)
          for (; b.return; )
            b = b.return;
        else {
          a = b;
          do
            b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
          while (a);
        }
        return 3 === b.tag ? c : null;
      }
      function Wb(a) {
        if (13 === a.tag) {
          var b = a.memoizedState;
          null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
          if (null !== b)
            return b.dehydrated;
        }
        return null;
      }
      function Xb(a) {
        if (Vb(a) !== a)
          throw Error(p(188));
      }
      function Yb(a) {
        var b = a.alternate;
        if (!b) {
          b = Vb(a);
          if (null === b)
            throw Error(p(188));
          return b !== a ? null : a;
        }
        for (var c = a, d = b; ; ) {
          var e = c.return;
          if (null === e)
            break;
          var f = e.alternate;
          if (null === f) {
            d = e.return;
            if (null !== d) {
              c = d;
              continue;
            }
            break;
          }
          if (e.child === f.child) {
            for (f = e.child; f; ) {
              if (f === c)
                return Xb(e), a;
              if (f === d)
                return Xb(e), b;
              f = f.sibling;
            }
            throw Error(p(188));
          }
          if (c.return !== d.return)
            c = e, d = f;
          else {
            for (var g = false, h = e.child; h; ) {
              if (h === c) {
                g = true;
                c = e;
                d = f;
                break;
              }
              if (h === d) {
                g = true;
                d = e;
                c = f;
                break;
              }
              h = h.sibling;
            }
            if (!g) {
              for (h = f.child; h; ) {
                if (h === c) {
                  g = true;
                  c = f;
                  d = e;
                  break;
                }
                if (h === d) {
                  g = true;
                  d = f;
                  c = e;
                  break;
                }
                h = h.sibling;
              }
              if (!g)
                throw Error(p(189));
            }
          }
          if (c.alternate !== d)
            throw Error(p(190));
        }
        if (3 !== c.tag)
          throw Error(p(188));
        return c.stateNode.current === c ? a : b;
      }
      function Zb(a) {
        a = Yb(a);
        return null !== a ? $b(a) : null;
      }
      function $b(a) {
        if (5 === a.tag || 6 === a.tag)
          return a;
        for (a = a.child; null !== a; ) {
          var b = $b(a);
          if (null !== b)
            return b;
          a = a.sibling;
        }
        return null;
      }
      var ac = ca.unstable_scheduleCallback;
      var bc = ca.unstable_cancelCallback;
      var cc = ca.unstable_shouldYield;
      var dc = ca.unstable_requestPaint;
      var B = ca.unstable_now;
      var ec = ca.unstable_getCurrentPriorityLevel;
      var fc = ca.unstable_ImmediatePriority;
      var gc = ca.unstable_UserBlockingPriority;
      var hc = ca.unstable_NormalPriority;
      var ic = ca.unstable_LowPriority;
      var jc = ca.unstable_IdlePriority;
      var kc = null;
      var lc = null;
      function mc(a) {
        if (lc && "function" === typeof lc.onCommitFiberRoot)
          try {
            lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
          } catch (b) {
          }
      }
      var oc = Math.clz32 ? Math.clz32 : nc;
      var pc = Math.log;
      var qc = Math.LN2;
      function nc(a) {
        a >>>= 0;
        return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
      }
      var rc = 64;
      var sc = 4194304;
      function tc(a) {
        switch (a & -a) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return a & 4194240;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return a & 130023424;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 1073741824;
          default:
            return a;
        }
      }
      function uc(a, b) {
        var c = a.pendingLanes;
        if (0 === c)
          return 0;
        var d = 0, e = a.suspendedLanes, f = a.pingedLanes, g = c & 268435455;
        if (0 !== g) {
          var h = g & ~e;
          0 !== h ? d = tc(h) : (f &= g, 0 !== f && (d = tc(f)));
        } else
          g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f && (d = tc(f));
        if (0 === d)
          return 0;
        if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f = b & -b, e >= f || 16 === e && 0 !== (f & 4194240)))
          return b;
        0 !== (d & 4) && (d |= c & 16);
        b = a.entangledLanes;
        if (0 !== b)
          for (a = a.entanglements, b &= d; 0 < b; )
            c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
        return d;
      }
      function vc(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 4:
            return b + 250;
          case 8:
          case 16:
          case 32:
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return b + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return -1;
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function wc(a, b) {
        for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f = a.pendingLanes; 0 < f; ) {
          var g = 31 - oc(f), h = 1 << g, k = e[g];
          if (-1 === k) {
            if (0 === (h & c) || 0 !== (h & d))
              e[g] = vc(h, b);
          } else
            k <= b && (a.expiredLanes |= h);
          f &= ~h;
        }
      }
      function xc(a) {
        a = a.pendingLanes & -1073741825;
        return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
      }
      function yc() {
        var a = rc;
        rc <<= 1;
        0 === (rc & 4194240) && (rc = 64);
        return a;
      }
      function zc(a) {
        for (var b = [], c = 0; 31 > c; c++)
          b.push(a);
        return b;
      }
      function Ac(a, b, c) {
        a.pendingLanes |= b;
        536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
        a = a.eventTimes;
        b = 31 - oc(b);
        a[b] = c;
      }
      function Bc(a, b) {
        var c = a.pendingLanes & ~b;
        a.pendingLanes = b;
        a.suspendedLanes = 0;
        a.pingedLanes = 0;
        a.expiredLanes &= b;
        a.mutableReadLanes &= b;
        a.entangledLanes &= b;
        b = a.entanglements;
        var d = a.eventTimes;
        for (a = a.expirationTimes; 0 < c; ) {
          var e = 31 - oc(c), f = 1 << e;
          b[e] = 0;
          d[e] = -1;
          a[e] = -1;
          c &= ~f;
        }
      }
      function Cc(a, b) {
        var c = a.entangledLanes |= b;
        for (a = a.entanglements; c; ) {
          var d = 31 - oc(c), e = 1 << d;
          e & b | a[d] & b && (a[d] |= b);
          c &= ~e;
        }
      }
      var C = 0;
      function Dc(a) {
        a &= -a;
        return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
      }
      var Ec;
      var Fc;
      var Gc;
      var Hc;
      var Ic;
      var Jc = false;
      var Kc = [];
      var Lc = null;
      var Mc = null;
      var Nc = null;
      var Oc = /* @__PURE__ */ new Map();
      var Pc = /* @__PURE__ */ new Map();
      var Qc = [];
      var Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
      function Sc(a, b) {
        switch (a) {
          case "focusin":
          case "focusout":
            Lc = null;
            break;
          case "dragenter":
          case "dragleave":
            Mc = null;
            break;
          case "mouseover":
          case "mouseout":
            Nc = null;
            break;
          case "pointerover":
          case "pointerout":
            Oc.delete(b.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            Pc.delete(b.pointerId);
        }
      }
      function Tc(a, b, c, d, e, f) {
        if (null === a || a.nativeEvent !== f)
          return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
        a.eventSystemFlags |= d;
        b = a.targetContainers;
        null !== e && -1 === b.indexOf(e) && b.push(e);
        return a;
      }
      function Uc(a, b, c, d, e) {
        switch (b) {
          case "focusin":
            return Lc = Tc(Lc, a, b, c, d, e), true;
          case "dragenter":
            return Mc = Tc(Mc, a, b, c, d, e), true;
          case "mouseover":
            return Nc = Tc(Nc, a, b, c, d, e), true;
          case "pointerover":
            var f = e.pointerId;
            Oc.set(f, Tc(Oc.get(f) || null, a, b, c, d, e));
            return true;
          case "gotpointercapture":
            return f = e.pointerId, Pc.set(f, Tc(Pc.get(f) || null, a, b, c, d, e)), true;
        }
        return false;
      }
      function Vc(a) {
        var b = Wc(a.target);
        if (null !== b) {
          var c = Vb(b);
          if (null !== c) {
            if (b = c.tag, 13 === b) {
              if (b = Wb(c), null !== b) {
                a.blockedOn = b;
                Ic(a.priority, function() {
                  Gc(c);
                });
                return;
              }
            } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
              a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
              return;
            }
          }
        }
        a.blockedOn = null;
      }
      function Xc(a) {
        if (null !== a.blockedOn)
          return false;
        for (var b = a.targetContainers; 0 < b.length; ) {
          var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
          if (null === c) {
            c = a.nativeEvent;
            var d = new c.constructor(c.type, c);
            wb = d;
            c.target.dispatchEvent(d);
            wb = null;
          } else
            return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
          b.shift();
        }
        return true;
      }
      function Zc(a, b, c) {
        Xc(a) && c.delete(b);
      }
      function $c() {
        Jc = false;
        null !== Lc && Xc(Lc) && (Lc = null);
        null !== Mc && Xc(Mc) && (Mc = null);
        null !== Nc && Xc(Nc) && (Nc = null);
        Oc.forEach(Zc);
        Pc.forEach(Zc);
      }
      function ad(a, b) {
        a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
      }
      function bd(a) {
        function b(b2) {
          return ad(b2, a);
        }
        if (0 < Kc.length) {
          ad(Kc[0], a);
          for (var c = 1; c < Kc.length; c++) {
            var d = Kc[c];
            d.blockedOn === a && (d.blockedOn = null);
          }
        }
        null !== Lc && ad(Lc, a);
        null !== Mc && ad(Mc, a);
        null !== Nc && ad(Nc, a);
        Oc.forEach(b);
        Pc.forEach(b);
        for (c = 0; c < Qc.length; c++)
          d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
        for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); )
          Vc(c), null === c.blockedOn && Qc.shift();
      }
      var cd = ua.ReactCurrentBatchConfig;
      var dd = true;
      function ed(a, b, c, d) {
        var e = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 1, fd(a, b, c, d);
        } finally {
          C = e, cd.transition = f;
        }
      }
      function gd(a, b, c, d) {
        var e = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 4, fd(a, b, c, d);
        } finally {
          C = e, cd.transition = f;
        }
      }
      function fd(a, b, c, d) {
        if (dd) {
          var e = Yc(a, b, c, d);
          if (null === e)
            hd(a, b, d, id, c), Sc(a, d);
          else if (Uc(e, a, b, c, d))
            d.stopPropagation();
          else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
            for (; null !== e; ) {
              var f = Cb(e);
              null !== f && Ec(f);
              f = Yc(a, b, c, d);
              null === f && hd(a, b, d, id, c);
              if (f === e)
                break;
              e = f;
            }
            null !== e && d.stopPropagation();
          } else
            hd(a, b, d, null, c);
        }
      }
      var id = null;
      function Yc(a, b, c, d) {
        id = null;
        a = xb(d);
        a = Wc(a);
        if (null !== a)
          if (b = Vb(a), null === b)
            a = null;
          else if (c = b.tag, 13 === c) {
            a = Wb(b);
            if (null !== a)
              return a;
            a = null;
          } else if (3 === c) {
            if (b.stateNode.current.memoizedState.isDehydrated)
              return 3 === b.tag ? b.stateNode.containerInfo : null;
            a = null;
          } else
            b !== a && (a = null);
        id = a;
        return null;
      }
      function jd(a) {
        switch (a) {
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "resize":
          case "seeked":
          case "submit":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 1;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "scroll":
          case "toggle":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 4;
          case "message":
            switch (ec()) {
              case fc:
                return 1;
              case gc:
                return 4;
              case hc:
              case ic:
                return 16;
              case jc:
                return 536870912;
              default:
                return 16;
            }
          default:
            return 16;
        }
      }
      var kd = null;
      var ld = null;
      var md = null;
      function nd() {
        if (md)
          return md;
        var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f = e.length;
        for (a = 0; a < c && b[a] === e[a]; a++)
          ;
        var g = c - a;
        for (d = 1; d <= g && b[c - d] === e[f - d]; d++)
          ;
        return md = e.slice(a, 1 < d ? 1 - d : void 0);
      }
      function od(a) {
        var b = a.keyCode;
        "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
        10 === a && (a = 13);
        return 32 <= a || 13 === a ? a : 0;
      }
      function pd() {
        return true;
      }
      function qd() {
        return false;
      }
      function rd(a) {
        function b(b2, d, e, f, g) {
          this._reactName = b2;
          this._targetInst = e;
          this.type = d;
          this.nativeEvent = f;
          this.target = g;
          this.currentTarget = null;
          for (var c in a)
            a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f) : f[c]);
          this.isDefaultPrevented = (null != f.defaultPrevented ? f.defaultPrevented : false === f.returnValue) ? pd : qd;
          this.isPropagationStopped = qd;
          return this;
        }
        A(b.prototype, { preventDefault: function() {
          this.defaultPrevented = true;
          var a2 = this.nativeEvent;
          a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
        }, stopPropagation: function() {
          var a2 = this.nativeEvent;
          a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
        }, persist: function() {
        }, isPersistent: pd });
        return b;
      }
      var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
        return a.timeStamp || Date.now();
      }, defaultPrevented: 0, isTrusted: 0 };
      var td = rd(sd);
      var ud = A({}, sd, { view: 0, detail: 0 });
      var vd = rd(ud);
      var wd;
      var xd;
      var yd;
      var Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
        return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
      }, movementX: function(a) {
        if ("movementX" in a)
          return a.movementX;
        a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
        return wd;
      }, movementY: function(a) {
        return "movementY" in a ? a.movementY : xd;
      } });
      var Bd = rd(Ad);
      var Cd = A({}, Ad, { dataTransfer: 0 });
      var Dd = rd(Cd);
      var Ed = A({}, ud, { relatedTarget: 0 });
      var Fd = rd(Ed);
      var Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Hd = rd(Gd);
      var Id = A({}, sd, { clipboardData: function(a) {
        return "clipboardData" in a ? a.clipboardData : window.clipboardData;
      } });
      var Jd = rd(Id);
      var Kd = A({}, sd, { data: 0 });
      var Ld = rd(Kd);
      var Md = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      };
      var Nd = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      };
      var Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
      function Pd(a) {
        var b = this.nativeEvent;
        return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
      }
      function zd() {
        return Pd;
      }
      var Qd = A({}, ud, { key: function(a) {
        if (a.key) {
          var b = Md[a.key] || a.key;
          if ("Unidentified" !== b)
            return b;
        }
        return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
      }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
        return "keypress" === a.type ? od(a) : 0;
      }, keyCode: function(a) {
        return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      }, which: function(a) {
        return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      } });
      var Rd = rd(Qd);
      var Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 });
      var Td = rd(Sd);
      var Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd });
      var Vd = rd(Ud);
      var Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Xd = rd(Wd);
      var Yd = A({}, Ad, {
        deltaX: function(a) {
          return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
        },
        deltaY: function(a) {
          return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      });
      var Zd = rd(Yd);
      var $d = [9, 13, 27, 32];
      var ae = ia && "CompositionEvent" in window;
      var be = null;
      ia && "documentMode" in document && (be = document.documentMode);
      var ce = ia && "TextEvent" in window && !be;
      var de = ia && (!ae || be && 8 < be && 11 >= be);
      var ee = String.fromCharCode(32);
      var fe = false;
      function ge(a, b) {
        switch (a) {
          case "keyup":
            return -1 !== $d.indexOf(b.keyCode);
          case "keydown":
            return 229 !== b.keyCode;
          case "keypress":
          case "mousedown":
          case "focusout":
            return true;
          default:
            return false;
        }
      }
      function he(a) {
        a = a.detail;
        return "object" === typeof a && "data" in a ? a.data : null;
      }
      var ie = false;
      function je(a, b) {
        switch (a) {
          case "compositionend":
            return he(b);
          case "keypress":
            if (32 !== b.which)
              return null;
            fe = true;
            return ee;
          case "textInput":
            return a = b.data, a === ee && fe ? null : a;
          default:
            return null;
        }
      }
      function ke(a, b) {
        if (ie)
          return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
        switch (a) {
          case "paste":
            return null;
          case "keypress":
            if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
              if (b.char && 1 < b.char.length)
                return b.char;
              if (b.which)
                return String.fromCharCode(b.which);
            }
            return null;
          case "compositionend":
            return de && "ko" !== b.locale ? null : b.data;
          default:
            return null;
        }
      }
      var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
      function me(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
      }
      function ne(a, b, c, d) {
        Eb(d);
        b = oe(b, "onChange");
        0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
      }
      var pe = null;
      var qe = null;
      function re(a) {
        se(a, 0);
      }
      function te(a) {
        var b = ue(a);
        if (Wa(b))
          return a;
      }
      function ve(a, b) {
        if ("change" === a)
          return b;
      }
      var we = false;
      if (ia) {
        if (ia) {
          ye = "oninput" in document;
          if (!ye) {
            ze = document.createElement("div");
            ze.setAttribute("oninput", "return;");
            ye = "function" === typeof ze.oninput;
          }
          xe = ye;
        } else
          xe = false;
        we = xe && (!document.documentMode || 9 < document.documentMode);
      }
      var xe;
      var ye;
      var ze;
      function Ae() {
        pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
      }
      function Be(a) {
        if ("value" === a.propertyName && te(qe)) {
          var b = [];
          ne(b, qe, a, xb(a));
          Jb(re, b);
        }
      }
      function Ce(a, b, c) {
        "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
      }
      function De(a) {
        if ("selectionchange" === a || "keyup" === a || "keydown" === a)
          return te(qe);
      }
      function Ee(a, b) {
        if ("click" === a)
          return te(b);
      }
      function Fe(a, b) {
        if ("input" === a || "change" === a)
          return te(b);
      }
      function Ge(a, b) {
        return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
      }
      var He = "function" === typeof Object.is ? Object.is : Ge;
      function Ie(a, b) {
        if (He(a, b))
          return true;
        if ("object" !== typeof a || null === a || "object" !== typeof b || null === b)
          return false;
        var c = Object.keys(a), d = Object.keys(b);
        if (c.length !== d.length)
          return false;
        for (d = 0; d < c.length; d++) {
          var e = c[d];
          if (!ja.call(b, e) || !He(a[e], b[e]))
            return false;
        }
        return true;
      }
      function Je(a) {
        for (; a && a.firstChild; )
          a = a.firstChild;
        return a;
      }
      function Ke(a, b) {
        var c = Je(a);
        a = 0;
        for (var d; c; ) {
          if (3 === c.nodeType) {
            d = a + c.textContent.length;
            if (a <= b && d >= b)
              return { node: c, offset: b - a };
            a = d;
          }
          a: {
            for (; c; ) {
              if (c.nextSibling) {
                c = c.nextSibling;
                break a;
              }
              c = c.parentNode;
            }
            c = void 0;
          }
          c = Je(c);
        }
      }
      function Le(a, b) {
        return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
      }
      function Me() {
        for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
          try {
            var c = "string" === typeof b.contentWindow.location.href;
          } catch (d) {
            c = false;
          }
          if (c)
            a = b.contentWindow;
          else
            break;
          b = Xa(a.document);
        }
        return b;
      }
      function Ne(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
      }
      function Oe(a) {
        var b = Me(), c = a.focusedElem, d = a.selectionRange;
        if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
          if (null !== d && Ne(c)) {
            if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c)
              c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
            else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
              a = a.getSelection();
              var e = c.textContent.length, f = Math.min(d.start, e);
              d = void 0 === d.end ? f : Math.min(d.end, e);
              !a.extend && f > d && (e = d, d = f, f = e);
              e = Ke(c, f);
              var g = Ke(
                c,
                d
              );
              e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
            }
          }
          b = [];
          for (a = c; a = a.parentNode; )
            1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
          "function" === typeof c.focus && c.focus();
          for (c = 0; c < b.length; c++)
            a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
        }
      }
      var Pe = ia && "documentMode" in document && 11 >= document.documentMode;
      var Qe = null;
      var Re = null;
      var Se = null;
      var Te = false;
      function Ue(a, b, c) {
        var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
        Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
      }
      function Ve(a, b) {
        var c = {};
        c[a.toLowerCase()] = b.toLowerCase();
        c["Webkit" + a] = "webkit" + b;
        c["Moz" + a] = "moz" + b;
        return c;
      }
      var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") };
      var Xe = {};
      var Ye = {};
      ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
      function Ze(a) {
        if (Xe[a])
          return Xe[a];
        if (!We[a])
          return a;
        var b = We[a], c;
        for (c in b)
          if (b.hasOwnProperty(c) && c in Ye)
            return Xe[a] = b[c];
        return a;
      }
      var $e = Ze("animationend");
      var af = Ze("animationiteration");
      var bf = Ze("animationstart");
      var cf = Ze("transitionend");
      var df = /* @__PURE__ */ new Map();
      var ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
      function ff(a, b) {
        df.set(a, b);
        fa(b, [a]);
      }
      for (gf = 0; gf < ef.length; gf++) {
        hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
        ff(jf, "on" + kf);
      }
      var hf;
      var jf;
      var kf;
      var gf;
      ff($e, "onAnimationEnd");
      ff(af, "onAnimationIteration");
      ff(bf, "onAnimationStart");
      ff("dblclick", "onDoubleClick");
      ff("focusin", "onFocus");
      ff("focusout", "onBlur");
      ff(cf, "onTransitionEnd");
      ha("onMouseEnter", ["mouseout", "mouseover"]);
      ha("onMouseLeave", ["mouseout", "mouseover"]);
      ha("onPointerEnter", ["pointerout", "pointerover"]);
      ha("onPointerLeave", ["pointerout", "pointerover"]);
      fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
      fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
      fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
      fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
      var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ");
      var mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
      function nf(a, b, c) {
        var d = a.type || "unknown-event";
        a.currentTarget = c;
        Ub(d, b, void 0, a);
        a.currentTarget = null;
      }
      function se(a, b) {
        b = 0 !== (b & 4);
        for (var c = 0; c < a.length; c++) {
          var d = a[c], e = d.event;
          d = d.listeners;
          a: {
            var f = void 0;
            if (b)
              for (var g = d.length - 1; 0 <= g; g--) {
                var h = d[g], k = h.instance, l = h.currentTarget;
                h = h.listener;
                if (k !== f && e.isPropagationStopped())
                  break a;
                nf(e, h, l);
                f = k;
              }
            else
              for (g = 0; g < d.length; g++) {
                h = d[g];
                k = h.instance;
                l = h.currentTarget;
                h = h.listener;
                if (k !== f && e.isPropagationStopped())
                  break a;
                nf(e, h, l);
                f = k;
              }
          }
        }
        if (Qb)
          throw a = Rb, Qb = false, Rb = null, a;
      }
      function D(a, b) {
        var c = b[of];
        void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
        var d = a + "__bubble";
        c.has(d) || (pf(b, a, 2, false), c.add(d));
      }
      function qf(a, b, c) {
        var d = 0;
        b && (d |= 4);
        pf(c, a, d, b);
      }
      var rf = "_reactListening" + Math.random().toString(36).slice(2);
      function sf(a) {
        if (!a[rf]) {
          a[rf] = true;
          da.forEach(function(b2) {
            "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
          });
          var b = 9 === a.nodeType ? a : a.ownerDocument;
          null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
        }
      }
      function pf(a, b, c, d) {
        switch (jd(b)) {
          case 1:
            var e = ed;
            break;
          case 4:
            e = gd;
            break;
          default:
            e = fd;
        }
        c = e.bind(null, b, c, a);
        e = void 0;
        !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
        d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
      }
      function hd(a, b, c, d, e) {
        var f = d;
        if (0 === (b & 1) && 0 === (b & 2) && null !== d)
          a:
            for (; ; ) {
              if (null === d)
                return;
              var g = d.tag;
              if (3 === g || 4 === g) {
                var h = d.stateNode.containerInfo;
                if (h === e || 8 === h.nodeType && h.parentNode === e)
                  break;
                if (4 === g)
                  for (g = d.return; null !== g; ) {
                    var k = g.tag;
                    if (3 === k || 4 === k) {
                      if (k = g.stateNode.containerInfo, k === e || 8 === k.nodeType && k.parentNode === e)
                        return;
                    }
                    g = g.return;
                  }
                for (; null !== h; ) {
                  g = Wc(h);
                  if (null === g)
                    return;
                  k = g.tag;
                  if (5 === k || 6 === k) {
                    d = f = g;
                    continue a;
                  }
                  h = h.parentNode;
                }
              }
              d = d.return;
            }
        Jb(function() {
          var d2 = f, e2 = xb(c), g2 = [];
          a: {
            var h2 = df.get(a);
            if (void 0 !== h2) {
              var k2 = td, n = a;
              switch (a) {
                case "keypress":
                  if (0 === od(c))
                    break a;
                case "keydown":
                case "keyup":
                  k2 = Rd;
                  break;
                case "focusin":
                  n = "focus";
                  k2 = Fd;
                  break;
                case "focusout":
                  n = "blur";
                  k2 = Fd;
                  break;
                case "beforeblur":
                case "afterblur":
                  k2 = Fd;
                  break;
                case "click":
                  if (2 === c.button)
                    break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  k2 = Bd;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  k2 = Dd;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  k2 = Vd;
                  break;
                case $e:
                case af:
                case bf:
                  k2 = Hd;
                  break;
                case cf:
                  k2 = Xd;
                  break;
                case "scroll":
                  k2 = vd;
                  break;
                case "wheel":
                  k2 = Zd;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  k2 = Jd;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  k2 = Td;
              }
              var t = 0 !== (b & 4), J = !t && "scroll" === a, x = t ? null !== h2 ? h2 + "Capture" : null : h2;
              t = [];
              for (var w = d2, u; null !== w; ) {
                u = w;
                var F = u.stateNode;
                5 === u.tag && null !== F && (u = F, null !== x && (F = Kb(w, x), null != F && t.push(tf(w, F, u))));
                if (J)
                  break;
                w = w.return;
              }
              0 < t.length && (h2 = new k2(h2, n, null, c, e2), g2.push({ event: h2, listeners: t }));
            }
          }
          if (0 === (b & 7)) {
            a: {
              h2 = "mouseover" === a || "pointerover" === a;
              k2 = "mouseout" === a || "pointerout" === a;
              if (h2 && c !== wb && (n = c.relatedTarget || c.fromElement) && (Wc(n) || n[uf]))
                break a;
              if (k2 || h2) {
                h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
                if (k2) {
                  if (n = c.relatedTarget || c.toElement, k2 = d2, n = n ? Wc(n) : null, null !== n && (J = Vb(n), n !== J || 5 !== n.tag && 6 !== n.tag))
                    n = null;
                } else
                  k2 = null, n = d2;
                if (k2 !== n) {
                  t = Bd;
                  F = "onMouseLeave";
                  x = "onMouseEnter";
                  w = "mouse";
                  if ("pointerout" === a || "pointerover" === a)
                    t = Td, F = "onPointerLeave", x = "onPointerEnter", w = "pointer";
                  J = null == k2 ? h2 : ue(k2);
                  u = null == n ? h2 : ue(n);
                  h2 = new t(F, w + "leave", k2, c, e2);
                  h2.target = J;
                  h2.relatedTarget = u;
                  F = null;
                  Wc(e2) === d2 && (t = new t(x, w + "enter", n, c, e2), t.target = u, t.relatedTarget = J, F = t);
                  J = F;
                  if (k2 && n)
                    b: {
                      t = k2;
                      x = n;
                      w = 0;
                      for (u = t; u; u = vf(u))
                        w++;
                      u = 0;
                      for (F = x; F; F = vf(F))
                        u++;
                      for (; 0 < w - u; )
                        t = vf(t), w--;
                      for (; 0 < u - w; )
                        x = vf(x), u--;
                      for (; w--; ) {
                        if (t === x || null !== x && t === x.alternate)
                          break b;
                        t = vf(t);
                        x = vf(x);
                      }
                      t = null;
                    }
                  else
                    t = null;
                  null !== k2 && wf(g2, h2, k2, t, false);
                  null !== n && null !== J && wf(g2, J, n, t, true);
                }
              }
            }
            a: {
              h2 = d2 ? ue(d2) : window;
              k2 = h2.nodeName && h2.nodeName.toLowerCase();
              if ("select" === k2 || "input" === k2 && "file" === h2.type)
                var na = ve;
              else if (me(h2))
                if (we)
                  na = Fe;
                else {
                  na = De;
                  var xa = Ce;
                }
              else
                (k2 = h2.nodeName) && "input" === k2.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
              if (na && (na = na(a, d2))) {
                ne(g2, na, c, e2);
                break a;
              }
              xa && xa(a, h2, d2);
              "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
            }
            xa = d2 ? ue(d2) : window;
            switch (a) {
              case "focusin":
                if (me(xa) || "true" === xa.contentEditable)
                  Qe = xa, Re = d2, Se = null;
                break;
              case "focusout":
                Se = Re = Qe = null;
                break;
              case "mousedown":
                Te = true;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                Te = false;
                Ue(g2, c, e2);
                break;
              case "selectionchange":
                if (Pe)
                  break;
              case "keydown":
              case "keyup":
                Ue(g2, c, e2);
            }
            var $a;
            if (ae)
              b: {
                switch (a) {
                  case "compositionstart":
                    var ba = "onCompositionStart";
                    break b;
                  case "compositionend":
                    ba = "onCompositionEnd";
                    break b;
                  case "compositionupdate":
                    ba = "onCompositionUpdate";
                    break b;
                }
                ba = void 0;
              }
            else
              ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
            ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
            if ($a = ce ? je(a, c) : ke(a, c))
              d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
          }
          se(g2, b);
        });
      }
      function tf(a, b, c) {
        return { instance: a, listener: b, currentTarget: c };
      }
      function oe(a, b) {
        for (var c = b + "Capture", d = []; null !== a; ) {
          var e = a, f = e.stateNode;
          5 === e.tag && null !== f && (e = f, f = Kb(a, c), null != f && d.unshift(tf(a, f, e)), f = Kb(a, b), null != f && d.push(tf(a, f, e)));
          a = a.return;
        }
        return d;
      }
      function vf(a) {
        if (null === a)
          return null;
        do
          a = a.return;
        while (a && 5 !== a.tag);
        return a ? a : null;
      }
      function wf(a, b, c, d, e) {
        for (var f = b._reactName, g = []; null !== c && c !== d; ) {
          var h = c, k = h.alternate, l = h.stateNode;
          if (null !== k && k === d)
            break;
          5 === h.tag && null !== l && (h = l, e ? (k = Kb(c, f), null != k && g.unshift(tf(c, k, h))) : e || (k = Kb(c, f), null != k && g.push(tf(c, k, h))));
          c = c.return;
        }
        0 !== g.length && a.push({ event: b, listeners: g });
      }
      var xf = /\r\n?/g;
      var yf = /\u0000|\uFFFD/g;
      function zf(a) {
        return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
      }
      function Af(a, b, c) {
        b = zf(b);
        if (zf(a) !== b && c)
          throw Error(p(425));
      }
      function Bf() {
      }
      var Cf = null;
      var Df = null;
      function Ef(a, b) {
        return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
      }
      var Ff = "function" === typeof setTimeout ? setTimeout : void 0;
      var Gf = "function" === typeof clearTimeout ? clearTimeout : void 0;
      var Hf = "function" === typeof Promise ? Promise : void 0;
      var Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
        return Hf.resolve(null).then(a).catch(If);
      } : Ff;
      function If(a) {
        setTimeout(function() {
          throw a;
        });
      }
      function Kf(a, b) {
        var c = b, d = 0;
        do {
          var e = c.nextSibling;
          a.removeChild(c);
          if (e && 8 === e.nodeType)
            if (c = e.data, "/$" === c) {
              if (0 === d) {
                a.removeChild(e);
                bd(b);
                return;
              }
              d--;
            } else
              "$" !== c && "$?" !== c && "$!" !== c || d++;
          c = e;
        } while (c);
        bd(b);
      }
      function Lf(a) {
        for (; null != a; a = a.nextSibling) {
          var b = a.nodeType;
          if (1 === b || 3 === b)
            break;
          if (8 === b) {
            b = a.data;
            if ("$" === b || "$!" === b || "$?" === b)
              break;
            if ("/$" === b)
              return null;
          }
        }
        return a;
      }
      function Mf(a) {
        a = a.previousSibling;
        for (var b = 0; a; ) {
          if (8 === a.nodeType) {
            var c = a.data;
            if ("$" === c || "$!" === c || "$?" === c) {
              if (0 === b)
                return a;
              b--;
            } else
              "/$" === c && b++;
          }
          a = a.previousSibling;
        }
        return null;
      }
      var Nf = Math.random().toString(36).slice(2);
      var Of = "__reactFiber$" + Nf;
      var Pf = "__reactProps$" + Nf;
      var uf = "__reactContainer$" + Nf;
      var of = "__reactEvents$" + Nf;
      var Qf = "__reactListeners$" + Nf;
      var Rf = "__reactHandles$" + Nf;
      function Wc(a) {
        var b = a[Of];
        if (b)
          return b;
        for (var c = a.parentNode; c; ) {
          if (b = c[uf] || c[Of]) {
            c = b.alternate;
            if (null !== b.child || null !== c && null !== c.child)
              for (a = Mf(a); null !== a; ) {
                if (c = a[Of])
                  return c;
                a = Mf(a);
              }
            return b;
          }
          a = c;
          c = a.parentNode;
        }
        return null;
      }
      function Cb(a) {
        a = a[Of] || a[uf];
        return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
      }
      function ue(a) {
        if (5 === a.tag || 6 === a.tag)
          return a.stateNode;
        throw Error(p(33));
      }
      function Db(a) {
        return a[Pf] || null;
      }
      var Sf = [];
      var Tf = -1;
      function Uf(a) {
        return { current: a };
      }
      function E(a) {
        0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
      }
      function G(a, b) {
        Tf++;
        Sf[Tf] = a.current;
        a.current = b;
      }
      var Vf = {};
      var H = Uf(Vf);
      var Wf = Uf(false);
      var Xf = Vf;
      function Yf(a, b) {
        var c = a.type.contextTypes;
        if (!c)
          return Vf;
        var d = a.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === b)
          return d.__reactInternalMemoizedMaskedChildContext;
        var e = {}, f;
        for (f in c)
          e[f] = b[f];
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
        return e;
      }
      function Zf(a) {
        a = a.childContextTypes;
        return null !== a && void 0 !== a;
      }
      function $f() {
        E(Wf);
        E(H);
      }
      function ag(a, b, c) {
        if (H.current !== Vf)
          throw Error(p(168));
        G(H, b);
        G(Wf, c);
      }
      function bg(a, b, c) {
        var d = a.stateNode;
        b = b.childContextTypes;
        if ("function" !== typeof d.getChildContext)
          return c;
        d = d.getChildContext();
        for (var e in d)
          if (!(e in b))
            throw Error(p(108, Ra(a) || "Unknown", e));
        return A({}, c, d);
      }
      function cg(a) {
        a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
        Xf = H.current;
        G(H, a);
        G(Wf, Wf.current);
        return true;
      }
      function dg(a, b, c) {
        var d = a.stateNode;
        if (!d)
          throw Error(p(169));
        c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
        G(Wf, c);
      }
      var eg = null;
      var fg = false;
      var gg = false;
      function hg(a) {
        null === eg ? eg = [a] : eg.push(a);
      }
      function ig(a) {
        fg = true;
        hg(a);
      }
      function jg() {
        if (!gg && null !== eg) {
          gg = true;
          var a = 0, b = C;
          try {
            var c = eg;
            for (C = 1; a < c.length; a++) {
              var d = c[a];
              do
                d = d(true);
              while (null !== d);
            }
            eg = null;
            fg = false;
          } catch (e) {
            throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
          } finally {
            C = b, gg = false;
          }
        }
        return null;
      }
      var kg = [];
      var lg = 0;
      var mg = null;
      var ng = 0;
      var og = [];
      var pg = 0;
      var qg = null;
      var rg = 1;
      var sg = "";
      function tg(a, b) {
        kg[lg++] = ng;
        kg[lg++] = mg;
        mg = a;
        ng = b;
      }
      function ug(a, b, c) {
        og[pg++] = rg;
        og[pg++] = sg;
        og[pg++] = qg;
        qg = a;
        var d = rg;
        a = sg;
        var e = 32 - oc(d) - 1;
        d &= ~(1 << e);
        c += 1;
        var f = 32 - oc(b) + e;
        if (30 < f) {
          var g = e - e % 5;
          f = (d & (1 << g) - 1).toString(32);
          d >>= g;
          e -= g;
          rg = 1 << 32 - oc(b) + e | c << e | d;
          sg = f + a;
        } else
          rg = 1 << f | c << e | d, sg = a;
      }
      function vg(a) {
        null !== a.return && (tg(a, 1), ug(a, 1, 0));
      }
      function wg(a) {
        for (; a === mg; )
          mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
        for (; a === qg; )
          qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
      }
      var xg = null;
      var yg = null;
      var I = false;
      var zg = null;
      function Ag(a, b) {
        var c = Bg(5, null, null, 0);
        c.elementType = "DELETED";
        c.stateNode = b;
        c.return = a;
        b = a.deletions;
        null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
      }
      function Cg(a, b) {
        switch (a.tag) {
          case 5:
            var c = a.type;
            b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
            return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
          case 6:
            return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
          case 13:
            return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
          default:
            return false;
        }
      }
      function Dg(a) {
        return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
      }
      function Eg(a) {
        if (I) {
          var b = yg;
          if (b) {
            var c = b;
            if (!Cg(a, b)) {
              if (Dg(a))
                throw Error(p(418));
              b = Lf(c.nextSibling);
              var d = xg;
              b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
            }
          } else {
            if (Dg(a))
              throw Error(p(418));
            a.flags = a.flags & -4097 | 2;
            I = false;
            xg = a;
          }
        }
      }
      function Fg(a) {
        for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; )
          a = a.return;
        xg = a;
      }
      function Gg(a) {
        if (a !== xg)
          return false;
        if (!I)
          return Fg(a), I = true, false;
        var b;
        (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
        if (b && (b = yg)) {
          if (Dg(a))
            throw Hg(), Error(p(418));
          for (; b; )
            Ag(a, b), b = Lf(b.nextSibling);
        }
        Fg(a);
        if (13 === a.tag) {
          a = a.memoizedState;
          a = null !== a ? a.dehydrated : null;
          if (!a)
            throw Error(p(317));
          a: {
            a = a.nextSibling;
            for (b = 0; a; ) {
              if (8 === a.nodeType) {
                var c = a.data;
                if ("/$" === c) {
                  if (0 === b) {
                    yg = Lf(a.nextSibling);
                    break a;
                  }
                  b--;
                } else
                  "$" !== c && "$!" !== c && "$?" !== c || b++;
              }
              a = a.nextSibling;
            }
            yg = null;
          }
        } else
          yg = xg ? Lf(a.stateNode.nextSibling) : null;
        return true;
      }
      function Hg() {
        for (var a = yg; a; )
          a = Lf(a.nextSibling);
      }
      function Ig() {
        yg = xg = null;
        I = false;
      }
      function Jg(a) {
        null === zg ? zg = [a] : zg.push(a);
      }
      var Kg = ua.ReactCurrentBatchConfig;
      function Lg(a, b, c) {
        a = c.ref;
        if (null !== a && "function" !== typeof a && "object" !== typeof a) {
          if (c._owner) {
            c = c._owner;
            if (c) {
              if (1 !== c.tag)
                throw Error(p(309));
              var d = c.stateNode;
            }
            if (!d)
              throw Error(p(147, a));
            var e = d, f = "" + a;
            if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f)
              return b.ref;
            b = function(a2) {
              var b2 = e.refs;
              null === a2 ? delete b2[f] : b2[f] = a2;
            };
            b._stringRef = f;
            return b;
          }
          if ("string" !== typeof a)
            throw Error(p(284));
          if (!c._owner)
            throw Error(p(290, a));
        }
        return a;
      }
      function Mg(a, b) {
        a = Object.prototype.toString.call(b);
        throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
      }
      function Ng(a) {
        var b = a._init;
        return b(a._payload);
      }
      function Og(a) {
        function b(b2, c2) {
          if (a) {
            var d2 = b2.deletions;
            null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
          }
        }
        function c(c2, d2) {
          if (!a)
            return null;
          for (; null !== d2; )
            b(c2, d2), d2 = d2.sibling;
          return null;
        }
        function d(a2, b2) {
          for (a2 = /* @__PURE__ */ new Map(); null !== b2; )
            null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
          return a2;
        }
        function e(a2, b2) {
          a2 = Pg(a2, b2);
          a2.index = 0;
          a2.sibling = null;
          return a2;
        }
        function f(b2, c2, d2) {
          b2.index = d2;
          if (!a)
            return b2.flags |= 1048576, c2;
          d2 = b2.alternate;
          if (null !== d2)
            return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
          b2.flags |= 2;
          return c2;
        }
        function g(b2) {
          a && null === b2.alternate && (b2.flags |= 2);
          return b2;
        }
        function h(a2, b2, c2, d2) {
          if (null === b2 || 6 !== b2.tag)
            return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2);
          b2.return = a2;
          return b2;
        }
        function k(a2, b2, c2, d2) {
          var f2 = c2.type;
          if (f2 === ya)
            return m(a2, b2, c2.props.children, d2, c2.key);
          if (null !== b2 && (b2.elementType === f2 || "object" === typeof f2 && null !== f2 && f2.$$typeof === Ha && Ng(f2) === b2.type))
            return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
          d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
          d2.ref = Lg(a2, b2, c2);
          d2.return = a2;
          return d2;
        }
        function l(a2, b2, c2, d2) {
          if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation)
            return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2.children || []);
          b2.return = a2;
          return b2;
        }
        function m(a2, b2, c2, d2, f2) {
          if (null === b2 || 7 !== b2.tag)
            return b2 = Tg(c2, a2.mode, d2, f2), b2.return = a2, b2;
          b2 = e(b2, c2);
          b2.return = a2;
          return b2;
        }
        function q(a2, b2, c2) {
          if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2)
            return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
          if ("object" === typeof b2 && null !== b2) {
            switch (b2.$$typeof) {
              case va:
                return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
              case wa:
                return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
              case Ha:
                var d2 = b2._init;
                return q(a2, d2(b2._payload), c2);
            }
            if (eb(b2) || Ka(b2))
              return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
            Mg(a2, b2);
          }
          return null;
        }
        function r(a2, b2, c2, d2) {
          var e2 = null !== b2 ? b2.key : null;
          if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2)
            return null !== e2 ? null : h(a2, b2, "" + c2, d2);
          if ("object" === typeof c2 && null !== c2) {
            switch (c2.$$typeof) {
              case va:
                return c2.key === e2 ? k(a2, b2, c2, d2) : null;
              case wa:
                return c2.key === e2 ? l(a2, b2, c2, d2) : null;
              case Ha:
                return e2 = c2._init, r(
                  a2,
                  b2,
                  e2(c2._payload),
                  d2
                );
            }
            if (eb(c2) || Ka(c2))
              return null !== e2 ? null : m(a2, b2, c2, d2, null);
            Mg(a2, c2);
          }
          return null;
        }
        function y(a2, b2, c2, d2, e2) {
          if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2)
            return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
          if ("object" === typeof d2 && null !== d2) {
            switch (d2.$$typeof) {
              case va:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k(b2, a2, d2, e2);
              case wa:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l(b2, a2, d2, e2);
              case Ha:
                var f2 = d2._init;
                return y(a2, b2, c2, f2(d2._payload), e2);
            }
            if (eb(d2) || Ka(d2))
              return a2 = a2.get(c2) || null, m(b2, a2, d2, e2, null);
            Mg(b2, d2);
          }
          return null;
        }
        function n(e2, g2, h2, k2) {
          for (var l2 = null, m2 = null, u = g2, w = g2 = 0, x = null; null !== u && w < h2.length; w++) {
            u.index > w ? (x = u, u = null) : x = u.sibling;
            var n2 = r(e2, u, h2[w], k2);
            if (null === n2) {
              null === u && (u = x);
              break;
            }
            a && u && null === n2.alternate && b(e2, u);
            g2 = f(n2, g2, w);
            null === m2 ? l2 = n2 : m2.sibling = n2;
            m2 = n2;
            u = x;
          }
          if (w === h2.length)
            return c(e2, u), I && tg(e2, w), l2;
          if (null === u) {
            for (; w < h2.length; w++)
              u = q(e2, h2[w], k2), null !== u && (g2 = f(u, g2, w), null === m2 ? l2 = u : m2.sibling = u, m2 = u);
            I && tg(e2, w);
            return l2;
          }
          for (u = d(e2, u); w < h2.length; w++)
            x = y(u, e2, w, h2[w], k2), null !== x && (a && null !== x.alternate && u.delete(null === x.key ? w : x.key), g2 = f(x, g2, w), null === m2 ? l2 = x : m2.sibling = x, m2 = x);
          a && u.forEach(function(a2) {
            return b(e2, a2);
          });
          I && tg(e2, w);
          return l2;
        }
        function t(e2, g2, h2, k2) {
          var l2 = Ka(h2);
          if ("function" !== typeof l2)
            throw Error(p(150));
          h2 = l2.call(h2);
          if (null == h2)
            throw Error(p(151));
          for (var u = l2 = null, m2 = g2, w = g2 = 0, x = null, n2 = h2.next(); null !== m2 && !n2.done; w++, n2 = h2.next()) {
            m2.index > w ? (x = m2, m2 = null) : x = m2.sibling;
            var t2 = r(e2, m2, n2.value, k2);
            if (null === t2) {
              null === m2 && (m2 = x);
              break;
            }
            a && m2 && null === t2.alternate && b(e2, m2);
            g2 = f(t2, g2, w);
            null === u ? l2 = t2 : u.sibling = t2;
            u = t2;
            m2 = x;
          }
          if (n2.done)
            return c(
              e2,
              m2
            ), I && tg(e2, w), l2;
          if (null === m2) {
            for (; !n2.done; w++, n2 = h2.next())
              n2 = q(e2, n2.value, k2), null !== n2 && (g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
            I && tg(e2, w);
            return l2;
          }
          for (m2 = d(e2, m2); !n2.done; w++, n2 = h2.next())
            n2 = y(m2, e2, w, n2.value, k2), null !== n2 && (a && null !== n2.alternate && m2.delete(null === n2.key ? w : n2.key), g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
          a && m2.forEach(function(a2) {
            return b(e2, a2);
          });
          I && tg(e2, w);
          return l2;
        }
        function J(a2, d2, f2, h2) {
          "object" === typeof f2 && null !== f2 && f2.type === ya && null === f2.key && (f2 = f2.props.children);
          if ("object" === typeof f2 && null !== f2) {
            switch (f2.$$typeof) {
              case va:
                a: {
                  for (var k2 = f2.key, l2 = d2; null !== l2; ) {
                    if (l2.key === k2) {
                      k2 = f2.type;
                      if (k2 === ya) {
                        if (7 === l2.tag) {
                          c(a2, l2.sibling);
                          d2 = e(l2, f2.props.children);
                          d2.return = a2;
                          a2 = d2;
                          break a;
                        }
                      } else if (l2.elementType === k2 || "object" === typeof k2 && null !== k2 && k2.$$typeof === Ha && Ng(k2) === l2.type) {
                        c(a2, l2.sibling);
                        d2 = e(l2, f2.props);
                        d2.ref = Lg(a2, l2, f2);
                        d2.return = a2;
                        a2 = d2;
                        break a;
                      }
                      c(a2, l2);
                      break;
                    } else
                      b(a2, l2);
                    l2 = l2.sibling;
                  }
                  f2.type === ya ? (d2 = Tg(f2.props.children, a2.mode, h2, f2.key), d2.return = a2, a2 = d2) : (h2 = Rg(f2.type, f2.key, f2.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f2), h2.return = a2, a2 = h2);
                }
                return g(a2);
              case wa:
                a: {
                  for (l2 = f2.key; null !== d2; ) {
                    if (d2.key === l2)
                      if (4 === d2.tag && d2.stateNode.containerInfo === f2.containerInfo && d2.stateNode.implementation === f2.implementation) {
                        c(a2, d2.sibling);
                        d2 = e(d2, f2.children || []);
                        d2.return = a2;
                        a2 = d2;
                        break a;
                      } else {
                        c(a2, d2);
                        break;
                      }
                    else
                      b(a2, d2);
                    d2 = d2.sibling;
                  }
                  d2 = Sg(f2, a2.mode, h2);
                  d2.return = a2;
                  a2 = d2;
                }
                return g(a2);
              case Ha:
                return l2 = f2._init, J(a2, d2, l2(f2._payload), h2);
            }
            if (eb(f2))
              return n(a2, d2, f2, h2);
            if (Ka(f2))
              return t(a2, d2, f2, h2);
            Mg(a2, f2);
          }
          return "string" === typeof f2 && "" !== f2 || "number" === typeof f2 ? (f2 = "" + f2, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f2), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f2, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
        }
        return J;
      }
      var Ug = Og(true);
      var Vg = Og(false);
      var Wg = Uf(null);
      var Xg = null;
      var Yg = null;
      var Zg = null;
      function $g() {
        Zg = Yg = Xg = null;
      }
      function ah(a) {
        var b = Wg.current;
        E(Wg);
        a._currentValue = b;
      }
      function bh(a, b, c) {
        for (; null !== a; ) {
          var d = a.alternate;
          (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
          if (a === c)
            break;
          a = a.return;
        }
      }
      function ch(a, b) {
        Xg = a;
        Zg = Yg = null;
        a = a.dependencies;
        null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
      }
      function eh(a) {
        var b = a._currentValue;
        if (Zg !== a)
          if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
            if (null === Xg)
              throw Error(p(308));
            Yg = a;
            Xg.dependencies = { lanes: 0, firstContext: a };
          } else
            Yg = Yg.next = a;
        return b;
      }
      var fh = null;
      function gh(a) {
        null === fh ? fh = [a] : fh.push(a);
      }
      function hh(a, b, c, d) {
        var e = b.interleaved;
        null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
        b.interleaved = c;
        return ih(a, d);
      }
      function ih(a, b) {
        a.lanes |= b;
        var c = a.alternate;
        null !== c && (c.lanes |= b);
        c = a;
        for (a = a.return; null !== a; )
          a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
        return 3 === c.tag ? c.stateNode : null;
      }
      var jh = false;
      function kh(a) {
        a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
      }
      function lh(a, b) {
        a = a.updateQueue;
        b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
      }
      function mh(a, b) {
        return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
      }
      function nh(a, b, c) {
        var d = a.updateQueue;
        if (null === d)
          return null;
        d = d.shared;
        if (0 !== (K & 2)) {
          var e = d.pending;
          null === e ? b.next = b : (b.next = e.next, e.next = b);
          d.pending = b;
          return ih(a, c);
        }
        e = d.interleaved;
        null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
        d.interleaved = b;
        return ih(a, c);
      }
      function oh(a, b, c) {
        b = b.updateQueue;
        if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      function ph(a, b) {
        var c = a.updateQueue, d = a.alternate;
        if (null !== d && (d = d.updateQueue, c === d)) {
          var e = null, f = null;
          c = c.firstBaseUpdate;
          if (null !== c) {
            do {
              var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
              null === f ? e = f = g : f = f.next = g;
              c = c.next;
            } while (null !== c);
            null === f ? e = f = b : f = f.next = b;
          } else
            e = f = b;
          c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f, shared: d.shared, effects: d.effects };
          a.updateQueue = c;
          return;
        }
        a = c.lastBaseUpdate;
        null === a ? c.firstBaseUpdate = b : a.next = b;
        c.lastBaseUpdate = b;
      }
      function qh(a, b, c, d) {
        var e = a.updateQueue;
        jh = false;
        var f = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
        if (null !== h) {
          e.shared.pending = null;
          var k = h, l = k.next;
          k.next = null;
          null === g ? f = l : g.next = l;
          g = k;
          var m = a.alternate;
          null !== m && (m = m.updateQueue, h = m.lastBaseUpdate, h !== g && (null === h ? m.firstBaseUpdate = l : h.next = l, m.lastBaseUpdate = k));
        }
        if (null !== f) {
          var q = e.baseState;
          g = 0;
          m = l = k = null;
          h = f;
          do {
            var r = h.lane, y = h.eventTime;
            if ((d & r) === r) {
              null !== m && (m = m.next = {
                eventTime: y,
                lane: 0,
                tag: h.tag,
                payload: h.payload,
                callback: h.callback,
                next: null
              });
              a: {
                var n = a, t = h;
                r = b;
                y = c;
                switch (t.tag) {
                  case 1:
                    n = t.payload;
                    if ("function" === typeof n) {
                      q = n.call(y, q, r);
                      break a;
                    }
                    q = n;
                    break a;
                  case 3:
                    n.flags = n.flags & -65537 | 128;
                  case 0:
                    n = t.payload;
                    r = "function" === typeof n ? n.call(y, q, r) : n;
                    if (null === r || void 0 === r)
                      break a;
                    q = A({}, q, r);
                    break a;
                  case 2:
                    jh = true;
                }
              }
              null !== h.callback && 0 !== h.lane && (a.flags |= 64, r = e.effects, null === r ? e.effects = [h] : r.push(h));
            } else
              y = { eventTime: y, lane: r, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m ? (l = m = y, k = q) : m = m.next = y, g |= r;
            h = h.next;
            if (null === h)
              if (h = e.shared.pending, null === h)
                break;
              else
                r = h, h = r.next, r.next = null, e.lastBaseUpdate = r, e.shared.pending = null;
          } while (1);
          null === m && (k = q);
          e.baseState = k;
          e.firstBaseUpdate = l;
          e.lastBaseUpdate = m;
          b = e.shared.interleaved;
          if (null !== b) {
            e = b;
            do
              g |= e.lane, e = e.next;
            while (e !== b);
          } else
            null === f && (e.shared.lanes = 0);
          rh |= g;
          a.lanes = g;
          a.memoizedState = q;
        }
      }
      function sh(a, b, c) {
        a = b.effects;
        b.effects = null;
        if (null !== a)
          for (b = 0; b < a.length; b++) {
            var d = a[b], e = d.callback;
            if (null !== e) {
              d.callback = null;
              d = c;
              if ("function" !== typeof e)
                throw Error(p(191, e));
              e.call(d);
            }
          }
      }
      var th = {};
      var uh = Uf(th);
      var vh = Uf(th);
      var wh = Uf(th);
      function xh(a) {
        if (a === th)
          throw Error(p(174));
        return a;
      }
      function yh(a, b) {
        G(wh, b);
        G(vh, a);
        G(uh, th);
        a = b.nodeType;
        switch (a) {
          case 9:
          case 11:
            b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
            break;
          default:
            a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
        }
        E(uh);
        G(uh, b);
      }
      function zh() {
        E(uh);
        E(vh);
        E(wh);
      }
      function Ah(a) {
        xh(wh.current);
        var b = xh(uh.current);
        var c = lb(b, a.type);
        b !== c && (G(vh, a), G(uh, c));
      }
      function Bh(a) {
        vh.current === a && (E(uh), E(vh));
      }
      var L = Uf(0);
      function Ch(a) {
        for (var b = a; null !== b; ) {
          if (13 === b.tag) {
            var c = b.memoizedState;
            if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data))
              return b;
          } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
            if (0 !== (b.flags & 128))
              return b;
          } else if (null !== b.child) {
            b.child.return = b;
            b = b.child;
            continue;
          }
          if (b === a)
            break;
          for (; null === b.sibling; ) {
            if (null === b.return || b.return === a)
              return null;
            b = b.return;
          }
          b.sibling.return = b.return;
          b = b.sibling;
        }
        return null;
      }
      var Dh = [];
      function Eh() {
        for (var a = 0; a < Dh.length; a++)
          Dh[a]._workInProgressVersionPrimary = null;
        Dh.length = 0;
      }
      var Fh = ua.ReactCurrentDispatcher;
      var Gh = ua.ReactCurrentBatchConfig;
      var Hh = 0;
      var M = null;
      var N = null;
      var O = null;
      var Ih = false;
      var Jh = false;
      var Kh = 0;
      var Lh = 0;
      function P() {
        throw Error(p(321));
      }
      function Mh(a, b) {
        if (null === b)
          return false;
        for (var c = 0; c < b.length && c < a.length; c++)
          if (!He(a[c], b[c]))
            return false;
        return true;
      }
      function Nh(a, b, c, d, e, f) {
        Hh = f;
        M = b;
        b.memoizedState = null;
        b.updateQueue = null;
        b.lanes = 0;
        Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
        a = c(d, e);
        if (Jh) {
          f = 0;
          do {
            Jh = false;
            Kh = 0;
            if (25 <= f)
              throw Error(p(301));
            f += 1;
            O = N = null;
            b.updateQueue = null;
            Fh.current = Qh;
            a = c(d, e);
          } while (Jh);
        }
        Fh.current = Rh;
        b = null !== N && null !== N.next;
        Hh = 0;
        O = N = M = null;
        Ih = false;
        if (b)
          throw Error(p(300));
        return a;
      }
      function Sh() {
        var a = 0 !== Kh;
        Kh = 0;
        return a;
      }
      function Th() {
        var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
        null === O ? M.memoizedState = O = a : O = O.next = a;
        return O;
      }
      function Uh() {
        if (null === N) {
          var a = M.alternate;
          a = null !== a ? a.memoizedState : null;
        } else
          a = N.next;
        var b = null === O ? M.memoizedState : O.next;
        if (null !== b)
          O = b, N = a;
        else {
          if (null === a)
            throw Error(p(310));
          N = a;
          a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
          null === O ? M.memoizedState = O = a : O = O.next = a;
        }
        return O;
      }
      function Vh(a, b) {
        return "function" === typeof b ? b(a) : b;
      }
      function Wh(a) {
        var b = Uh(), c = b.queue;
        if (null === c)
          throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = N, e = d.baseQueue, f = c.pending;
        if (null !== f) {
          if (null !== e) {
            var g = e.next;
            e.next = f.next;
            f.next = g;
          }
          d.baseQueue = e = f;
          c.pending = null;
        }
        if (null !== e) {
          f = e.next;
          d = d.baseState;
          var h = g = null, k = null, l = f;
          do {
            var m = l.lane;
            if ((Hh & m) === m)
              null !== k && (k = k.next = { lane: 0, action: l.action, hasEagerState: l.hasEagerState, eagerState: l.eagerState, next: null }), d = l.hasEagerState ? l.eagerState : a(d, l.action);
            else {
              var q = {
                lane: m,
                action: l.action,
                hasEagerState: l.hasEagerState,
                eagerState: l.eagerState,
                next: null
              };
              null === k ? (h = k = q, g = d) : k = k.next = q;
              M.lanes |= m;
              rh |= m;
            }
            l = l.next;
          } while (null !== l && l !== f);
          null === k ? g = d : k.next = h;
          He(d, b.memoizedState) || (dh = true);
          b.memoizedState = d;
          b.baseState = g;
          b.baseQueue = k;
          c.lastRenderedState = d;
        }
        a = c.interleaved;
        if (null !== a) {
          e = a;
          do
            f = e.lane, M.lanes |= f, rh |= f, e = e.next;
          while (e !== a);
        } else
          null === e && (c.lanes = 0);
        return [b.memoizedState, c.dispatch];
      }
      function Xh(a) {
        var b = Uh(), c = b.queue;
        if (null === c)
          throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = c.dispatch, e = c.pending, f = b.memoizedState;
        if (null !== e) {
          c.pending = null;
          var g = e = e.next;
          do
            f = a(f, g.action), g = g.next;
          while (g !== e);
          He(f, b.memoizedState) || (dh = true);
          b.memoizedState = f;
          null === b.baseQueue && (b.baseState = f);
          c.lastRenderedState = f;
        }
        return [f, d];
      }
      function Yh() {
      }
      function Zh(a, b) {
        var c = M, d = Uh(), e = b(), f = !He(d.memoizedState, e);
        f && (d.memoizedState = e, dh = true);
        d = d.queue;
        $h(ai.bind(null, c, d, a), [a]);
        if (d.getSnapshot !== b || f || null !== O && O.memoizedState.tag & 1) {
          c.flags |= 2048;
          bi(9, ci.bind(null, c, d, e, b), void 0, null);
          if (null === Q)
            throw Error(p(349));
          0 !== (Hh & 30) || di(c, b, e);
        }
        return e;
      }
      function di(a, b, c) {
        a.flags |= 16384;
        a = { getSnapshot: b, value: c };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
      }
      function ci(a, b, c, d) {
        b.value = c;
        b.getSnapshot = d;
        ei(b) && fi(a);
      }
      function ai(a, b, c) {
        return c(function() {
          ei(b) && fi(a);
        });
      }
      function ei(a) {
        var b = a.getSnapshot;
        a = a.value;
        try {
          var c = b();
          return !He(a, c);
        } catch (d) {
          return true;
        }
      }
      function fi(a) {
        var b = ih(a, 1);
        null !== b && gi(b, a, 1, -1);
      }
      function hi(a) {
        var b = Th();
        "function" === typeof a && (a = a());
        b.memoizedState = b.baseState = a;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
        b.queue = a;
        a = a.dispatch = ii.bind(null, M, a);
        return [b.memoizedState, a];
      }
      function bi(a, b, c, d) {
        a = { tag: a, create: b, destroy: c, deps: d, next: null };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
        return a;
      }
      function ji() {
        return Uh().memoizedState;
      }
      function ki(a, b, c, d) {
        var e = Th();
        M.flags |= a;
        e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
      }
      function li(a, b, c, d) {
        var e = Uh();
        d = void 0 === d ? null : d;
        var f = void 0;
        if (null !== N) {
          var g = N.memoizedState;
          f = g.destroy;
          if (null !== d && Mh(d, g.deps)) {
            e.memoizedState = bi(b, c, f, d);
            return;
          }
        }
        M.flags |= a;
        e.memoizedState = bi(1 | b, c, f, d);
      }
      function mi(a, b) {
        return ki(8390656, 8, a, b);
      }
      function $h(a, b) {
        return li(2048, 8, a, b);
      }
      function ni(a, b) {
        return li(4, 2, a, b);
      }
      function oi(a, b) {
        return li(4, 4, a, b);
      }
      function pi(a, b) {
        if ("function" === typeof b)
          return a = a(), b(a), function() {
            b(null);
          };
        if (null !== b && void 0 !== b)
          return a = a(), b.current = a, function() {
            b.current = null;
          };
      }
      function qi(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return li(4, 4, pi.bind(null, b, a), c);
      }
      function ri() {
      }
      function si(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1]))
          return d[0];
        c.memoizedState = [a, b];
        return a;
      }
      function ti(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1]))
          return d[0];
        a = a();
        c.memoizedState = [a, b];
        return a;
      }
      function ui(a, b, c) {
        if (0 === (Hh & 21))
          return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
        He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
        return b;
      }
      function vi(a, b) {
        var c = C;
        C = 0 !== c && 4 > c ? c : 4;
        a(true);
        var d = Gh.transition;
        Gh.transition = {};
        try {
          a(false), b();
        } finally {
          C = c, Gh.transition = d;
        }
      }
      function wi() {
        return Uh().memoizedState;
      }
      function xi(a, b, c) {
        var d = yi(a);
        c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a))
          Ai(b, c);
        else if (c = hh(a, b, c, d), null !== c) {
          var e = R();
          gi(c, a, d, e);
          Bi(c, b, d);
        }
      }
      function ii(a, b, c) {
        var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a))
          Ai(b, e);
        else {
          var f = a.alternate;
          if (0 === a.lanes && (null === f || 0 === f.lanes) && (f = b.lastRenderedReducer, null !== f))
            try {
              var g = b.lastRenderedState, h = f(g, c);
              e.hasEagerState = true;
              e.eagerState = h;
              if (He(h, g)) {
                var k = b.interleaved;
                null === k ? (e.next = e, gh(b)) : (e.next = k.next, k.next = e);
                b.interleaved = e;
                return;
              }
            } catch (l) {
            } finally {
            }
          c = hh(a, b, e, d);
          null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
        }
      }
      function zi(a) {
        var b = a.alternate;
        return a === M || null !== b && b === M;
      }
      function Ai(a, b) {
        Jh = Ih = true;
        var c = a.pending;
        null === c ? b.next = b : (b.next = c.next, c.next = b);
        a.pending = b;
      }
      function Bi(a, b, c) {
        if (0 !== (c & 4194240)) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false };
      var Oh = { readContext: eh, useCallback: function(a, b) {
        Th().memoizedState = [a, void 0 === b ? null : b];
        return a;
      }, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return ki(
          4194308,
          4,
          pi.bind(null, b, a),
          c
        );
      }, useLayoutEffect: function(a, b) {
        return ki(4194308, 4, a, b);
      }, useInsertionEffect: function(a, b) {
        return ki(4, 2, a, b);
      }, useMemo: function(a, b) {
        var c = Th();
        b = void 0 === b ? null : b;
        a = a();
        c.memoizedState = [a, b];
        return a;
      }, useReducer: function(a, b, c) {
        var d = Th();
        b = void 0 !== c ? c(b) : b;
        d.memoizedState = d.baseState = b;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
        d.queue = a;
        a = a.dispatch = xi.bind(null, M, a);
        return [d.memoizedState, a];
      }, useRef: function(a) {
        var b = Th();
        a = { current: a };
        return b.memoizedState = a;
      }, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
        return Th().memoizedState = a;
      }, useTransition: function() {
        var a = hi(false), b = a[0];
        a = vi.bind(null, a[1]);
        Th().memoizedState = a;
        return [b, a];
      }, useMutableSource: function() {
      }, useSyncExternalStore: function(a, b, c) {
        var d = M, e = Th();
        if (I) {
          if (void 0 === c)
            throw Error(p(407));
          c = c();
        } else {
          c = b();
          if (null === Q)
            throw Error(p(349));
          0 !== (Hh & 30) || di(d, b, c);
        }
        e.memoizedState = c;
        var f = { value: c, getSnapshot: b };
        e.queue = f;
        mi(ai.bind(
          null,
          d,
          f,
          a
        ), [a]);
        d.flags |= 2048;
        bi(9, ci.bind(null, d, f, c, b), void 0, null);
        return c;
      }, useId: function() {
        var a = Th(), b = Q.identifierPrefix;
        if (I) {
          var c = sg;
          var d = rg;
          c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
          b = ":" + b + "R" + c;
          c = Kh++;
          0 < c && (b += "H" + c.toString(32));
          b += ":";
        } else
          c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
        return a.memoizedState = b;
      }, unstable_isNewReconciler: false };
      var Ph = {
        readContext: eh,
        useCallback: si,
        useContext: eh,
        useEffect: $h,
        useImperativeHandle: qi,
        useInsertionEffect: ni,
        useLayoutEffect: oi,
        useMemo: ti,
        useReducer: Wh,
        useRef: ji,
        useState: function() {
          return Wh(Vh);
        },
        useDebugValue: ri,
        useDeferredValue: function(a) {
          var b = Uh();
          return ui(b, N.memoizedState, a);
        },
        useTransition: function() {
          var a = Wh(Vh)[0], b = Uh().memoizedState;
          return [a, b];
        },
        useMutableSource: Yh,
        useSyncExternalStore: Zh,
        useId: wi,
        unstable_isNewReconciler: false
      };
      var Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
        return Xh(Vh);
      }, useDebugValue: ri, useDeferredValue: function(a) {
        var b = Uh();
        return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
      }, useTransition: function() {
        var a = Xh(Vh)[0], b = Uh().memoizedState;
        return [a, b];
      }, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
      function Ci(a, b) {
        if (a && a.defaultProps) {
          b = A({}, b);
          a = a.defaultProps;
          for (var c in a)
            void 0 === b[c] && (b[c] = a[c]);
          return b;
        }
        return b;
      }
      function Di(a, b, c, d) {
        b = a.memoizedState;
        c = c(d, b);
        c = null === c || void 0 === c ? b : A({}, b, c);
        a.memoizedState = c;
        0 === a.lanes && (a.updateQueue.baseState = c);
      }
      var Ei = { isMounted: function(a) {
        return (a = a._reactInternals) ? Vb(a) === a : false;
      }, enqueueSetState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
      }, enqueueReplaceState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.tag = 1;
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
      }, enqueueForceUpdate: function(a, b) {
        a = a._reactInternals;
        var c = R(), d = yi(a), e = mh(c, d);
        e.tag = 2;
        void 0 !== b && null !== b && (e.callback = b);
        b = nh(a, e, d);
        null !== b && (gi(b, a, d, c), oh(b, a, d));
      } };
      function Fi(a, b, c, d, e, f, g) {
        a = a.stateNode;
        return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f) : true;
      }
      function Gi(a, b, c) {
        var d = false, e = Vf;
        var f = b.contextType;
        "object" === typeof f && null !== f ? f = eh(f) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
        b = new b(c, f);
        a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
        b.updater = Ei;
        a.stateNode = b;
        b._reactInternals = a;
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f);
        return b;
      }
      function Hi(a, b, c, d) {
        a = b.state;
        "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
        "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
        b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
      }
      function Ii(a, b, c, d) {
        var e = a.stateNode;
        e.props = c;
        e.state = a.memoizedState;
        e.refs = {};
        kh(a);
        var f = b.contextType;
        "object" === typeof f && null !== f ? e.context = eh(f) : (f = Zf(b) ? Xf : H.current, e.context = Yf(a, f));
        e.state = a.memoizedState;
        f = b.getDerivedStateFromProps;
        "function" === typeof f && (Di(a, b, f, c), e.state = a.memoizedState);
        "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
        "function" === typeof e.componentDidMount && (a.flags |= 4194308);
      }
      function Ji(a, b) {
        try {
          var c = "", d = b;
          do
            c += Pa(d), d = d.return;
          while (d);
          var e = c;
        } catch (f) {
          e = "\nError generating stack: " + f.message + "\n" + f.stack;
        }
        return { value: a, source: b, stack: e, digest: null };
      }
      function Ki(a, b, c) {
        return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
      }
      function Li(a, b) {
        try {
          console.error(b.value);
        } catch (c) {
          setTimeout(function() {
            throw c;
          });
        }
      }
      var Mi = "function" === typeof WeakMap ? WeakMap : Map;
      function Ni(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        c.payload = { element: null };
        var d = b.value;
        c.callback = function() {
          Oi || (Oi = true, Pi = d);
          Li(a, b);
        };
        return c;
      }
      function Qi(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        var d = a.type.getDerivedStateFromError;
        if ("function" === typeof d) {
          var e = b.value;
          c.payload = function() {
            return d(e);
          };
          c.callback = function() {
            Li(a, b);
          };
        }
        var f = a.stateNode;
        null !== f && "function" === typeof f.componentDidCatch && (c.callback = function() {
          Li(a, b);
          "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
          var c2 = b.stack;
          this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
        });
        return c;
      }
      function Si(a, b, c) {
        var d = a.pingCache;
        if (null === d) {
          d = a.pingCache = new Mi();
          var e = /* @__PURE__ */ new Set();
          d.set(b, e);
        } else
          e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
        e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
      }
      function Ui(a) {
        do {
          var b;
          if (b = 13 === a.tag)
            b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
          if (b)
            return a;
          a = a.return;
        } while (null !== a);
        return null;
      }
      function Vi(a, b, c, d, e) {
        if (0 === (a.mode & 1))
          return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
        a.flags |= 65536;
        a.lanes = e;
        return a;
      }
      var Wi = ua.ReactCurrentOwner;
      var dh = false;
      function Xi(a, b, c, d) {
        b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
      }
      function Yi(a, b, c, d, e) {
        c = c.render;
        var f = b.ref;
        ch(b, e);
        d = Nh(a, b, c, d, f, e);
        c = Sh();
        if (null !== a && !dh)
          return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
        I && c && vg(b);
        b.flags |= 1;
        Xi(a, b, d, e);
        return b.child;
      }
      function $i(a, b, c, d, e) {
        if (null === a) {
          var f = c.type;
          if ("function" === typeof f && !aj(f) && void 0 === f.defaultProps && null === c.compare && void 0 === c.defaultProps)
            return b.tag = 15, b.type = f, bj(a, b, f, d, e);
          a = Rg(c.type, null, d, b, b.mode, e);
          a.ref = b.ref;
          a.return = b;
          return b.child = a;
        }
        f = a.child;
        if (0 === (a.lanes & e)) {
          var g = f.memoizedProps;
          c = c.compare;
          c = null !== c ? c : Ie;
          if (c(g, d) && a.ref === b.ref)
            return Zi(a, b, e);
        }
        b.flags |= 1;
        a = Pg(f, d);
        a.ref = b.ref;
        a.return = b;
        return b.child = a;
      }
      function bj(a, b, c, d, e) {
        if (null !== a) {
          var f = a.memoizedProps;
          if (Ie(f, d) && a.ref === b.ref)
            if (dh = false, b.pendingProps = d = f, 0 !== (a.lanes & e))
              0 !== (a.flags & 131072) && (dh = true);
            else
              return b.lanes = a.lanes, Zi(a, b, e);
        }
        return cj(a, b, c, d, e);
      }
      function dj(a, b, c) {
        var d = b.pendingProps, e = d.children, f = null !== a ? a.memoizedState : null;
        if ("hidden" === d.mode)
          if (0 === (b.mode & 1))
            b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
          else {
            if (0 === (c & 1073741824))
              return a = null !== f ? f.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
            b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
            d = null !== f ? f.baseLanes : c;
            G(ej, fj);
            fj |= d;
          }
        else
          null !== f ? (d = f.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
        Xi(a, b, e, c);
        return b.child;
      }
      function gj(a, b) {
        var c = b.ref;
        if (null === a && null !== c || null !== a && a.ref !== c)
          b.flags |= 512, b.flags |= 2097152;
      }
      function cj(a, b, c, d, e) {
        var f = Zf(c) ? Xf : H.current;
        f = Yf(b, f);
        ch(b, e);
        c = Nh(a, b, c, d, f, e);
        d = Sh();
        if (null !== a && !dh)
          return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
        I && d && vg(b);
        b.flags |= 1;
        Xi(a, b, c, e);
        return b.child;
      }
      function hj(a, b, c, d, e) {
        if (Zf(c)) {
          var f = true;
          cg(b);
        } else
          f = false;
        ch(b, e);
        if (null === b.stateNode)
          ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
        else if (null === a) {
          var g = b.stateNode, h = b.memoizedProps;
          g.props = h;
          var k = g.context, l = c.contextType;
          "object" === typeof l && null !== l ? l = eh(l) : (l = Zf(c) ? Xf : H.current, l = Yf(b, l));
          var m = c.getDerivedStateFromProps, q = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate;
          q || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Hi(b, g, d, l);
          jh = false;
          var r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e);
          k = b.memoizedState;
          h !== d || r !== k || Wf.current || jh ? ("function" === typeof m && (Di(b, c, m, d), k = b.memoizedState), (h = jh || Fi(b, c, h, d, r, k, l)) ? (q || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
        } else {
          g = b.stateNode;
          lh(a, b);
          h = b.memoizedProps;
          l = b.type === b.elementType ? h : Ci(b.type, h);
          g.props = l;
          q = b.pendingProps;
          r = g.context;
          k = c.contextType;
          "object" === typeof k && null !== k ? k = eh(k) : (k = Zf(c) ? Xf : H.current, k = Yf(b, k));
          var y = c.getDerivedStateFromProps;
          (m = "function" === typeof y || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q || r !== k) && Hi(b, g, d, k);
          jh = false;
          r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e);
          var n = b.memoizedState;
          h !== q || r !== n || Wf.current || jh ? ("function" === typeof y && (Di(b, c, y, d), n = b.memoizedState), (l = jh || Fi(b, c, l, d, r, n, k) || false) ? (m || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n, k), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n, k)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n), g.props = d, g.state = n, g.context = k, d = l) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), d = false);
        }
        return jj(a, b, c, d, f, e);
      }
      function jj(a, b, c, d, e, f) {
        gj(a, b);
        var g = 0 !== (b.flags & 128);
        if (!d && !g)
          return e && dg(b, c, false), Zi(a, b, f);
        d = b.stateNode;
        Wi.current = b;
        var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
        b.flags |= 1;
        null !== a && g ? (b.child = Ug(b, a.child, null, f), b.child = Ug(b, null, h, f)) : Xi(a, b, h, f);
        b.memoizedState = d.state;
        e && dg(b, c, true);
        return b.child;
      }
      function kj(a) {
        var b = a.stateNode;
        b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
        yh(a, b.containerInfo);
      }
      function lj(a, b, c, d, e) {
        Ig();
        Jg(e);
        b.flags |= 256;
        Xi(a, b, c, d);
        return b.child;
      }
      var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
      function nj(a) {
        return { baseLanes: a, cachePool: null, transitions: null };
      }
      function oj(a, b, c) {
        var d = b.pendingProps, e = L.current, f = false, g = 0 !== (b.flags & 128), h;
        (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
        if (h)
          f = true, b.flags &= -129;
        else if (null === a || null !== a.memoizedState)
          e |= 1;
        G(L, e & 1);
        if (null === a) {
          Eg(b);
          a = b.memoizedState;
          if (null !== a && (a = a.dehydrated, null !== a))
            return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
          g = d.children;
          a = d.fallback;
          return f ? (d = b.mode, f = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f ? (f.childLanes = 0, f.pendingProps = g) : f = pj(g, d, 0, null), a = Tg(a, d, c, null), f.return = b, a.return = b, f.sibling = a, b.child = f, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
        }
        e = a.memoizedState;
        if (null !== e && (h = e.dehydrated, null !== h))
          return rj(a, b, g, d, h, e, c);
        if (f) {
          f = d.fallback;
          g = b.mode;
          e = a.child;
          h = e.sibling;
          var k = { mode: "hidden", children: d.children };
          0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k, b.deletions = null) : (d = Pg(e, k), d.subtreeFlags = e.subtreeFlags & 14680064);
          null !== h ? f = Pg(h, f) : (f = Tg(f, g, c, null), f.flags |= 2);
          f.return = b;
          d.return = b;
          d.sibling = f;
          b.child = d;
          d = f;
          f = b.child;
          g = a.child.memoizedState;
          g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
          f.memoizedState = g;
          f.childLanes = a.childLanes & ~c;
          b.memoizedState = mj;
          return d;
        }
        f = a.child;
        a = f.sibling;
        d = Pg(f, { mode: "visible", children: d.children });
        0 === (b.mode & 1) && (d.lanes = c);
        d.return = b;
        d.sibling = null;
        null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
        b.child = d;
        b.memoizedState = null;
        return d;
      }
      function qj(a, b) {
        b = pj({ mode: "visible", children: b }, a.mode, 0, null);
        b.return = a;
        return a.child = b;
      }
      function sj(a, b, c, d) {
        null !== d && Jg(d);
        Ug(b, a.child, null, c);
        a = qj(b, b.pendingProps.children);
        a.flags |= 2;
        b.memoizedState = null;
        return a;
      }
      function rj(a, b, c, d, e, f, g) {
        if (c) {
          if (b.flags & 256)
            return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
          if (null !== b.memoizedState)
            return b.child = a.child, b.flags |= 128, null;
          f = d.fallback;
          e = b.mode;
          d = pj({ mode: "visible", children: d.children }, e, 0, null);
          f = Tg(f, e, g, null);
          f.flags |= 2;
          d.return = b;
          f.return = b;
          d.sibling = f;
          b.child = d;
          0 !== (b.mode & 1) && Ug(b, a.child, null, g);
          b.child.memoizedState = nj(g);
          b.memoizedState = mj;
          return f;
        }
        if (0 === (b.mode & 1))
          return sj(a, b, g, null);
        if ("$!" === e.data) {
          d = e.nextSibling && e.nextSibling.dataset;
          if (d)
            var h = d.dgst;
          d = h;
          f = Error(p(419));
          d = Ki(f, d, void 0);
          return sj(a, b, g, d);
        }
        h = 0 !== (g & a.childLanes);
        if (dh || h) {
          d = Q;
          if (null !== d) {
            switch (g & -g) {
              case 4:
                e = 2;
                break;
              case 16:
                e = 8;
                break;
              case 64:
              case 128:
              case 256:
              case 512:
              case 1024:
              case 2048:
              case 4096:
              case 8192:
              case 16384:
              case 32768:
              case 65536:
              case 131072:
              case 262144:
              case 524288:
              case 1048576:
              case 2097152:
              case 4194304:
              case 8388608:
              case 16777216:
              case 33554432:
              case 67108864:
                e = 32;
                break;
              case 536870912:
                e = 268435456;
                break;
              default:
                e = 0;
            }
            e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
            0 !== e && e !== f.retryLane && (f.retryLane = e, ih(a, e), gi(d, a, e, -1));
          }
          tj();
          d = Ki(Error(p(421)));
          return sj(a, b, g, d);
        }
        if ("$?" === e.data)
          return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
        a = f.treeContext;
        yg = Lf(e.nextSibling);
        xg = b;
        I = true;
        zg = null;
        null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
        b = qj(b, d.children);
        b.flags |= 4096;
        return b;
      }
      function vj(a, b, c) {
        a.lanes |= b;
        var d = a.alternate;
        null !== d && (d.lanes |= b);
        bh(a.return, b, c);
      }
      function wj(a, b, c, d, e) {
        var f = a.memoizedState;
        null === f ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f.isBackwards = b, f.rendering = null, f.renderingStartTime = 0, f.last = d, f.tail = c, f.tailMode = e);
      }
      function xj(a, b, c) {
        var d = b.pendingProps, e = d.revealOrder, f = d.tail;
        Xi(a, b, d.children, c);
        d = L.current;
        if (0 !== (d & 2))
          d = d & 1 | 2, b.flags |= 128;
        else {
          if (null !== a && 0 !== (a.flags & 128))
            a:
              for (a = b.child; null !== a; ) {
                if (13 === a.tag)
                  null !== a.memoizedState && vj(a, c, b);
                else if (19 === a.tag)
                  vj(a, c, b);
                else if (null !== a.child) {
                  a.child.return = a;
                  a = a.child;
                  continue;
                }
                if (a === b)
                  break a;
                for (; null === a.sibling; ) {
                  if (null === a.return || a.return === b)
                    break a;
                  a = a.return;
                }
                a.sibling.return = a.return;
                a = a.sibling;
              }
          d &= 1;
        }
        G(L, d);
        if (0 === (b.mode & 1))
          b.memoizedState = null;
        else
          switch (e) {
            case "forwards":
              c = b.child;
              for (e = null; null !== c; )
                a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
              c = e;
              null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
              wj(b, false, e, c, f);
              break;
            case "backwards":
              c = null;
              e = b.child;
              for (b.child = null; null !== e; ) {
                a = e.alternate;
                if (null !== a && null === Ch(a)) {
                  b.child = e;
                  break;
                }
                a = e.sibling;
                e.sibling = c;
                c = e;
                e = a;
              }
              wj(b, true, c, null, f);
              break;
            case "together":
              wj(b, false, null, null, void 0);
              break;
            default:
              b.memoizedState = null;
          }
        return b.child;
      }
      function ij(a, b) {
        0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
      }
      function Zi(a, b, c) {
        null !== a && (b.dependencies = a.dependencies);
        rh |= b.lanes;
        if (0 === (c & b.childLanes))
          return null;
        if (null !== a && b.child !== a.child)
          throw Error(p(153));
        if (null !== b.child) {
          a = b.child;
          c = Pg(a, a.pendingProps);
          b.child = c;
          for (c.return = b; null !== a.sibling; )
            a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
          c.sibling = null;
        }
        return b.child;
      }
      function yj(a, b, c) {
        switch (b.tag) {
          case 3:
            kj(b);
            Ig();
            break;
          case 5:
            Ah(b);
            break;
          case 1:
            Zf(b.type) && cg(b);
            break;
          case 4:
            yh(b, b.stateNode.containerInfo);
            break;
          case 10:
            var d = b.type._context, e = b.memoizedProps.value;
            G(Wg, d._currentValue);
            d._currentValue = e;
            break;
          case 13:
            d = b.memoizedState;
            if (null !== d) {
              if (null !== d.dehydrated)
                return G(L, L.current & 1), b.flags |= 128, null;
              if (0 !== (c & b.child.childLanes))
                return oj(a, b, c);
              G(L, L.current & 1);
              a = Zi(a, b, c);
              return null !== a ? a.sibling : null;
            }
            G(L, L.current & 1);
            break;
          case 19:
            d = 0 !== (c & b.childLanes);
            if (0 !== (a.flags & 128)) {
              if (d)
                return xj(a, b, c);
              b.flags |= 128;
            }
            e = b.memoizedState;
            null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
            G(L, L.current);
            if (d)
              break;
            else
              return null;
          case 22:
          case 23:
            return b.lanes = 0, dj(a, b, c);
        }
        return Zi(a, b, c);
      }
      var zj;
      var Aj;
      var Bj;
      var Cj;
      zj = function(a, b) {
        for (var c = b.child; null !== c; ) {
          if (5 === c.tag || 6 === c.tag)
            a.appendChild(c.stateNode);
          else if (4 !== c.tag && null !== c.child) {
            c.child.return = c;
            c = c.child;
            continue;
          }
          if (c === b)
            break;
          for (; null === c.sibling; ) {
            if (null === c.return || c.return === b)
              return;
            c = c.return;
          }
          c.sibling.return = c.return;
          c = c.sibling;
        }
      };
      Aj = function() {
      };
      Bj = function(a, b, c, d) {
        var e = a.memoizedProps;
        if (e !== d) {
          a = b.stateNode;
          xh(uh.current);
          var f = null;
          switch (c) {
            case "input":
              e = Ya(a, e);
              d = Ya(a, d);
              f = [];
              break;
            case "select":
              e = A({}, e, { value: void 0 });
              d = A({}, d, { value: void 0 });
              f = [];
              break;
            case "textarea":
              e = gb(a, e);
              d = gb(a, d);
              f = [];
              break;
            default:
              "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
          }
          ub(c, d);
          var g;
          c = null;
          for (l in e)
            if (!d.hasOwnProperty(l) && e.hasOwnProperty(l) && null != e[l])
              if ("style" === l) {
                var h = e[l];
                for (g in h)
                  h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
              } else
                "dangerouslySetInnerHTML" !== l && "children" !== l && "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && "autoFocus" !== l && (ea.hasOwnProperty(l) ? f || (f = []) : (f = f || []).push(l, null));
          for (l in d) {
            var k = d[l];
            h = null != e ? e[l] : void 0;
            if (d.hasOwnProperty(l) && k !== h && (null != k || null != h))
              if ("style" === l)
                if (h) {
                  for (g in h)
                    !h.hasOwnProperty(g) || k && k.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
                  for (g in k)
                    k.hasOwnProperty(g) && h[g] !== k[g] && (c || (c = {}), c[g] = k[g]);
                } else
                  c || (f || (f = []), f.push(
                    l,
                    c
                  )), c = k;
              else
                "dangerouslySetInnerHTML" === l ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f = f || []).push(l, k)) : "children" === l ? "string" !== typeof k && "number" !== typeof k || (f = f || []).push(l, "" + k) : "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && (ea.hasOwnProperty(l) ? (null != k && "onScroll" === l && D("scroll", a), f || h === k || (f = [])) : (f = f || []).push(l, k));
          }
          c && (f = f || []).push("style", c);
          var l = f;
          if (b.updateQueue = l)
            b.flags |= 4;
        }
      };
      Cj = function(a, b, c, d) {
        c !== d && (b.flags |= 4);
      };
      function Dj(a, b) {
        if (!I)
          switch (a.tailMode) {
            case "hidden":
              b = a.tail;
              for (var c = null; null !== b; )
                null !== b.alternate && (c = b), b = b.sibling;
              null === c ? a.tail = null : c.sibling = null;
              break;
            case "collapsed":
              c = a.tail;
              for (var d = null; null !== c; )
                null !== c.alternate && (d = c), c = c.sibling;
              null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
          }
      }
      function S(a) {
        var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
        if (b)
          for (var e = a.child; null !== e; )
            c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
        else
          for (e = a.child; null !== e; )
            c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
        a.subtreeFlags |= d;
        a.childLanes = c;
        return b;
      }
      function Ej(a, b, c) {
        var d = b.pendingProps;
        wg(b);
        switch (b.tag) {
          case 2:
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return S(b), null;
          case 1:
            return Zf(b.type) && $f(), S(b), null;
          case 3:
            d = b.stateNode;
            zh();
            E(Wf);
            E(H);
            Eh();
            d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
            if (null === a || null === a.child)
              Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
            Aj(a, b);
            S(b);
            return null;
          case 5:
            Bh(b);
            var e = xh(wh.current);
            c = b.type;
            if (null !== a && null != b.stateNode)
              Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            else {
              if (!d) {
                if (null === b.stateNode)
                  throw Error(p(166));
                S(b);
                return null;
              }
              a = xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.type;
                var f = b.memoizedProps;
                d[Of] = b;
                d[Pf] = f;
                a = 0 !== (b.mode & 1);
                switch (c) {
                  case "dialog":
                    D("cancel", d);
                    D("close", d);
                    break;
                  case "iframe":
                  case "object":
                  case "embed":
                    D("load", d);
                    break;
                  case "video":
                  case "audio":
                    for (e = 0; e < lf.length; e++)
                      D(lf[e], d);
                    break;
                  case "source":
                    D("error", d);
                    break;
                  case "img":
                  case "image":
                  case "link":
                    D(
                      "error",
                      d
                    );
                    D("load", d);
                    break;
                  case "details":
                    D("toggle", d);
                    break;
                  case "input":
                    Za(d, f);
                    D("invalid", d);
                    break;
                  case "select":
                    d._wrapperState = { wasMultiple: !!f.multiple };
                    D("invalid", d);
                    break;
                  case "textarea":
                    hb(d, f), D("invalid", d);
                }
                ub(c, f);
                e = null;
                for (var g in f)
                  if (f.hasOwnProperty(g)) {
                    var h = f[g];
                    "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f.suppressHydrationWarning && Af(
                      d.textContent,
                      h,
                      a
                    ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
                  }
                switch (c) {
                  case "input":
                    Va(d);
                    db(d, f, true);
                    break;
                  case "textarea":
                    Va(d);
                    jb(d);
                    break;
                  case "select":
                  case "option":
                    break;
                  default:
                    "function" === typeof f.onClick && (d.onclick = Bf);
                }
                d = e;
                b.updateQueue = d;
                null !== d && (b.flags |= 4);
              } else {
                g = 9 === e.nodeType ? e : e.ownerDocument;
                "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
                "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
                a[Of] = b;
                a[Pf] = d;
                zj(a, b, false, false);
                b.stateNode = a;
                a: {
                  g = vb(c, d);
                  switch (c) {
                    case "dialog":
                      D("cancel", a);
                      D("close", a);
                      e = d;
                      break;
                    case "iframe":
                    case "object":
                    case "embed":
                      D("load", a);
                      e = d;
                      break;
                    case "video":
                    case "audio":
                      for (e = 0; e < lf.length; e++)
                        D(lf[e], a);
                      e = d;
                      break;
                    case "source":
                      D("error", a);
                      e = d;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      D(
                        "error",
                        a
                      );
                      D("load", a);
                      e = d;
                      break;
                    case "details":
                      D("toggle", a);
                      e = d;
                      break;
                    case "input":
                      Za(a, d);
                      e = Ya(a, d);
                      D("invalid", a);
                      break;
                    case "option":
                      e = d;
                      break;
                    case "select":
                      a._wrapperState = { wasMultiple: !!d.multiple };
                      e = A({}, d, { value: void 0 });
                      D("invalid", a);
                      break;
                    case "textarea":
                      hb(a, d);
                      e = gb(a, d);
                      D("invalid", a);
                      break;
                    default:
                      e = d;
                  }
                  ub(c, e);
                  h = e;
                  for (f in h)
                    if (h.hasOwnProperty(f)) {
                      var k = h[f];
                      "style" === f ? sb(a, k) : "dangerouslySetInnerHTML" === f ? (k = k ? k.__html : void 0, null != k && nb(a, k)) : "children" === f ? "string" === typeof k ? ("textarea" !== c || "" !== k) && ob(a, k) : "number" === typeof k && ob(a, "" + k) : "suppressContentEditableWarning" !== f && "suppressHydrationWarning" !== f && "autoFocus" !== f && (ea.hasOwnProperty(f) ? null != k && "onScroll" === f && D("scroll", a) : null != k && ta(a, f, k, g));
                    }
                  switch (c) {
                    case "input":
                      Va(a);
                      db(a, d, false);
                      break;
                    case "textarea":
                      Va(a);
                      jb(a);
                      break;
                    case "option":
                      null != d.value && a.setAttribute("value", "" + Sa(d.value));
                      break;
                    case "select":
                      a.multiple = !!d.multiple;
                      f = d.value;
                      null != f ? fb(a, !!d.multiple, f, false) : null != d.defaultValue && fb(
                        a,
                        !!d.multiple,
                        d.defaultValue,
                        true
                      );
                      break;
                    default:
                      "function" === typeof e.onClick && (a.onclick = Bf);
                  }
                  switch (c) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                      d = !!d.autoFocus;
                      break a;
                    case "img":
                      d = true;
                      break a;
                    default:
                      d = false;
                  }
                }
                d && (b.flags |= 4);
              }
              null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            }
            S(b);
            return null;
          case 6:
            if (a && null != b.stateNode)
              Cj(a, b, a.memoizedProps, d);
            else {
              if ("string" !== typeof d && null === b.stateNode)
                throw Error(p(166));
              c = xh(wh.current);
              xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.memoizedProps;
                d[Of] = b;
                if (f = d.nodeValue !== c) {
                  if (a = xg, null !== a)
                    switch (a.tag) {
                      case 3:
                        Af(d.nodeValue, c, 0 !== (a.mode & 1));
                        break;
                      case 5:
                        true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
                    }
                }
                f && (b.flags |= 4);
              } else
                d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
            }
            S(b);
            return null;
          case 13:
            E(L);
            d = b.memoizedState;
            if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
              if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128))
                Hg(), Ig(), b.flags |= 98560, f = false;
              else if (f = Gg(b), null !== d && null !== d.dehydrated) {
                if (null === a) {
                  if (!f)
                    throw Error(p(318));
                  f = b.memoizedState;
                  f = null !== f ? f.dehydrated : null;
                  if (!f)
                    throw Error(p(317));
                  f[Of] = b;
                } else
                  Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
                S(b);
                f = false;
              } else
                null !== zg && (Fj(zg), zg = null), f = true;
              if (!f)
                return b.flags & 65536 ? b : null;
            }
            if (0 !== (b.flags & 128))
              return b.lanes = c, b;
            d = null !== d;
            d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
            null !== b.updateQueue && (b.flags |= 4);
            S(b);
            return null;
          case 4:
            return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
          case 10:
            return ah(b.type._context), S(b), null;
          case 17:
            return Zf(b.type) && $f(), S(b), null;
          case 19:
            E(L);
            f = b.memoizedState;
            if (null === f)
              return S(b), null;
            d = 0 !== (b.flags & 128);
            g = f.rendering;
            if (null === g)
              if (d)
                Dj(f, false);
              else {
                if (0 !== T || null !== a && 0 !== (a.flags & 128))
                  for (a = b.child; null !== a; ) {
                    g = Ch(a);
                    if (null !== g) {
                      b.flags |= 128;
                      Dj(f, false);
                      d = g.updateQueue;
                      null !== d && (b.updateQueue = d, b.flags |= 4);
                      b.subtreeFlags = 0;
                      d = c;
                      for (c = b.child; null !== c; )
                        f = c, a = d, f.flags &= 14680066, g = f.alternate, null === g ? (f.childLanes = 0, f.lanes = a, f.child = null, f.subtreeFlags = 0, f.memoizedProps = null, f.memoizedState = null, f.updateQueue = null, f.dependencies = null, f.stateNode = null) : (f.childLanes = g.childLanes, f.lanes = g.lanes, f.child = g.child, f.subtreeFlags = 0, f.deletions = null, f.memoizedProps = g.memoizedProps, f.memoizedState = g.memoizedState, f.updateQueue = g.updateQueue, f.type = g.type, a = g.dependencies, f.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
                      G(L, L.current & 1 | 2);
                      return b.child;
                    }
                    a = a.sibling;
                  }
                null !== f.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
              }
            else {
              if (!d)
                if (a = Ch(g), null !== a) {
                  if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f, true), null === f.tail && "hidden" === f.tailMode && !g.alternate && !I)
                    return S(b), null;
                } else
                  2 * B() - f.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
              f.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f.last, null !== c ? c.sibling = g : b.child = g, f.last = g);
            }
            if (null !== f.tail)
              return b = f.tail, f.rendering = b, f.tail = b.sibling, f.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
            S(b);
            return null;
          case 22:
          case 23:
            return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
          case 24:
            return null;
          case 25:
            return null;
        }
        throw Error(p(156, b.tag));
      }
      function Ij(a, b) {
        wg(b);
        switch (b.tag) {
          case 1:
            return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 3:
            return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
          case 5:
            return Bh(b), null;
          case 13:
            E(L);
            a = b.memoizedState;
            if (null !== a && null !== a.dehydrated) {
              if (null === b.alternate)
                throw Error(p(340));
              Ig();
            }
            a = b.flags;
            return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 19:
            return E(L), null;
          case 4:
            return zh(), null;
          case 10:
            return ah(b.type._context), null;
          case 22:
          case 23:
            return Hj(), null;
          case 24:
            return null;
          default:
            return null;
        }
      }
      var Jj = false;
      var U = false;
      var Kj = "function" === typeof WeakSet ? WeakSet : Set;
      var V = null;
      function Lj(a, b) {
        var c = a.ref;
        if (null !== c)
          if ("function" === typeof c)
            try {
              c(null);
            } catch (d) {
              W(a, b, d);
            }
          else
            c.current = null;
      }
      function Mj(a, b, c) {
        try {
          c();
        } catch (d) {
          W(a, b, d);
        }
      }
      var Nj = false;
      function Oj(a, b) {
        Cf = dd;
        a = Me();
        if (Ne(a)) {
          if ("selectionStart" in a)
            var c = { start: a.selectionStart, end: a.selectionEnd };
          else
            a: {
              c = (c = a.ownerDocument) && c.defaultView || window;
              var d = c.getSelection && c.getSelection();
              if (d && 0 !== d.rangeCount) {
                c = d.anchorNode;
                var e = d.anchorOffset, f = d.focusNode;
                d = d.focusOffset;
                try {
                  c.nodeType, f.nodeType;
                } catch (F) {
                  c = null;
                  break a;
                }
                var g = 0, h = -1, k = -1, l = 0, m = 0, q = a, r = null;
                b:
                  for (; ; ) {
                    for (var y; ; ) {
                      q !== c || 0 !== e && 3 !== q.nodeType || (h = g + e);
                      q !== f || 0 !== d && 3 !== q.nodeType || (k = g + d);
                      3 === q.nodeType && (g += q.nodeValue.length);
                      if (null === (y = q.firstChild))
                        break;
                      r = q;
                      q = y;
                    }
                    for (; ; ) {
                      if (q === a)
                        break b;
                      r === c && ++l === e && (h = g);
                      r === f && ++m === d && (k = g);
                      if (null !== (y = q.nextSibling))
                        break;
                      q = r;
                      r = q.parentNode;
                    }
                    q = y;
                  }
                c = -1 === h || -1 === k ? null : { start: h, end: k };
              } else
                c = null;
            }
          c = c || { start: 0, end: 0 };
        } else
          c = null;
        Df = { focusedElem: a, selectionRange: c };
        dd = false;
        for (V = b; null !== V; )
          if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a)
            a.return = b, V = a;
          else
            for (; null !== V; ) {
              b = V;
              try {
                var n = b.alternate;
                if (0 !== (b.flags & 1024))
                  switch (b.tag) {
                    case 0:
                    case 11:
                    case 15:
                      break;
                    case 1:
                      if (null !== n) {
                        var t = n.memoizedProps, J = n.memoizedState, x = b.stateNode, w = x.getSnapshotBeforeUpdate(b.elementType === b.type ? t : Ci(b.type, t), J);
                        x.__reactInternalSnapshotBeforeUpdate = w;
                      }
                      break;
                    case 3:
                      var u = b.stateNode.containerInfo;
                      1 === u.nodeType ? u.textContent = "" : 9 === u.nodeType && u.documentElement && u.removeChild(u.documentElement);
                      break;
                    case 5:
                    case 6:
                    case 4:
                    case 17:
                      break;
                    default:
                      throw Error(p(163));
                  }
              } catch (F) {
                W(b, b.return, F);
              }
              a = b.sibling;
              if (null !== a) {
                a.return = b.return;
                V = a;
                break;
              }
              V = b.return;
            }
        n = Nj;
        Nj = false;
        return n;
      }
      function Pj(a, b, c) {
        var d = b.updateQueue;
        d = null !== d ? d.lastEffect : null;
        if (null !== d) {
          var e = d = d.next;
          do {
            if ((e.tag & a) === a) {
              var f = e.destroy;
              e.destroy = void 0;
              void 0 !== f && Mj(b, c, f);
            }
            e = e.next;
          } while (e !== d);
        }
      }
      function Qj(a, b) {
        b = b.updateQueue;
        b = null !== b ? b.lastEffect : null;
        if (null !== b) {
          var c = b = b.next;
          do {
            if ((c.tag & a) === a) {
              var d = c.create;
              c.destroy = d();
            }
            c = c.next;
          } while (c !== b);
        }
      }
      function Rj(a) {
        var b = a.ref;
        if (null !== b) {
          var c = a.stateNode;
          switch (a.tag) {
            case 5:
              a = c;
              break;
            default:
              a = c;
          }
          "function" === typeof b ? b(a) : b.current = a;
        }
      }
      function Sj(a) {
        var b = a.alternate;
        null !== b && (a.alternate = null, Sj(b));
        a.child = null;
        a.deletions = null;
        a.sibling = null;
        5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
        a.stateNode = null;
        a.return = null;
        a.dependencies = null;
        a.memoizedProps = null;
        a.memoizedState = null;
        a.pendingProps = null;
        a.stateNode = null;
        a.updateQueue = null;
      }
      function Tj(a) {
        return 5 === a.tag || 3 === a.tag || 4 === a.tag;
      }
      function Uj(a) {
        a:
          for (; ; ) {
            for (; null === a.sibling; ) {
              if (null === a.return || Tj(a.return))
                return null;
              a = a.return;
            }
            a.sibling.return = a.return;
            for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
              if (a.flags & 2)
                continue a;
              if (null === a.child || 4 === a.tag)
                continue a;
              else
                a.child.return = a, a = a.child;
            }
            if (!(a.flags & 2))
              return a.stateNode;
          }
      }
      function Vj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d)
          a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
        else if (4 !== d && (a = a.child, null !== a))
          for (Vj(a, b, c), a = a.sibling; null !== a; )
            Vj(a, b, c), a = a.sibling;
      }
      function Wj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d)
          a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
        else if (4 !== d && (a = a.child, null !== a))
          for (Wj(a, b, c), a = a.sibling; null !== a; )
            Wj(a, b, c), a = a.sibling;
      }
      var X = null;
      var Xj = false;
      function Yj(a, b, c) {
        for (c = c.child; null !== c; )
          Zj(a, b, c), c = c.sibling;
      }
      function Zj(a, b, c) {
        if (lc && "function" === typeof lc.onCommitFiberUnmount)
          try {
            lc.onCommitFiberUnmount(kc, c);
          } catch (h) {
          }
        switch (c.tag) {
          case 5:
            U || Lj(c, b);
          case 6:
            var d = X, e = Xj;
            X = null;
            Yj(a, b, c);
            X = d;
            Xj = e;
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
            break;
          case 18:
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
            break;
          case 4:
            d = X;
            e = Xj;
            X = c.stateNode.containerInfo;
            Xj = true;
            Yj(a, b, c);
            X = d;
            Xj = e;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
              e = d = d.next;
              do {
                var f = e, g = f.destroy;
                f = f.tag;
                void 0 !== g && (0 !== (f & 2) ? Mj(c, b, g) : 0 !== (f & 4) && Mj(c, b, g));
                e = e.next;
              } while (e !== d);
            }
            Yj(a, b, c);
            break;
          case 1:
            if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount))
              try {
                d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
              } catch (h) {
                W(c, b, h);
              }
            Yj(a, b, c);
            break;
          case 21:
            Yj(a, b, c);
            break;
          case 22:
            c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
            break;
          default:
            Yj(a, b, c);
        }
      }
      function ak(a) {
        var b = a.updateQueue;
        if (null !== b) {
          a.updateQueue = null;
          var c = a.stateNode;
          null === c && (c = a.stateNode = new Kj());
          b.forEach(function(b2) {
            var d = bk.bind(null, a, b2);
            c.has(b2) || (c.add(b2), b2.then(d, d));
          });
        }
      }
      function ck(a, b) {
        var c = b.deletions;
        if (null !== c)
          for (var d = 0; d < c.length; d++) {
            var e = c[d];
            try {
              var f = a, g = b, h = g;
              a:
                for (; null !== h; ) {
                  switch (h.tag) {
                    case 5:
                      X = h.stateNode;
                      Xj = false;
                      break a;
                    case 3:
                      X = h.stateNode.containerInfo;
                      Xj = true;
                      break a;
                    case 4:
                      X = h.stateNode.containerInfo;
                      Xj = true;
                      break a;
                  }
                  h = h.return;
                }
              if (null === X)
                throw Error(p(160));
              Zj(f, g, e);
              X = null;
              Xj = false;
              var k = e.alternate;
              null !== k && (k.return = null);
              e.return = null;
            } catch (l) {
              W(e, b, l);
            }
          }
        if (b.subtreeFlags & 12854)
          for (b = b.child; null !== b; )
            dk(b, a), b = b.sibling;
      }
      function dk(a, b) {
        var c = a.alternate, d = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            ck(b, a);
            ek(a);
            if (d & 4) {
              try {
                Pj(3, a, a.return), Qj(3, a);
              } catch (t) {
                W(a, a.return, t);
              }
              try {
                Pj(5, a, a.return);
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 1:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            break;
          case 5:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            if (a.flags & 32) {
              var e = a.stateNode;
              try {
                ob(e, "");
              } catch (t) {
                W(a, a.return, t);
              }
            }
            if (d & 4 && (e = a.stateNode, null != e)) {
              var f = a.memoizedProps, g = null !== c ? c.memoizedProps : f, h = a.type, k = a.updateQueue;
              a.updateQueue = null;
              if (null !== k)
                try {
                  "input" === h && "radio" === f.type && null != f.name && ab(e, f);
                  vb(h, g);
                  var l = vb(h, f);
                  for (g = 0; g < k.length; g += 2) {
                    var m = k[g], q = k[g + 1];
                    "style" === m ? sb(e, q) : "dangerouslySetInnerHTML" === m ? nb(e, q) : "children" === m ? ob(e, q) : ta(e, m, q, l);
                  }
                  switch (h) {
                    case "input":
                      bb(e, f);
                      break;
                    case "textarea":
                      ib(e, f);
                      break;
                    case "select":
                      var r = e._wrapperState.wasMultiple;
                      e._wrapperState.wasMultiple = !!f.multiple;
                      var y = f.value;
                      null != y ? fb(e, !!f.multiple, y, false) : r !== !!f.multiple && (null != f.defaultValue ? fb(
                        e,
                        !!f.multiple,
                        f.defaultValue,
                        true
                      ) : fb(e, !!f.multiple, f.multiple ? [] : "", false));
                  }
                  e[Pf] = f;
                } catch (t) {
                  W(a, a.return, t);
                }
            }
            break;
          case 6:
            ck(b, a);
            ek(a);
            if (d & 4) {
              if (null === a.stateNode)
                throw Error(p(162));
              e = a.stateNode;
              f = a.memoizedProps;
              try {
                e.nodeValue = f;
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 3:
            ck(b, a);
            ek(a);
            if (d & 4 && null !== c && c.memoizedState.isDehydrated)
              try {
                bd(b.containerInfo);
              } catch (t) {
                W(a, a.return, t);
              }
            break;
          case 4:
            ck(b, a);
            ek(a);
            break;
          case 13:
            ck(b, a);
            ek(a);
            e = a.child;
            e.flags & 8192 && (f = null !== e.memoizedState, e.stateNode.isHidden = f, !f || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
            d & 4 && ak(a);
            break;
          case 22:
            m = null !== c && null !== c.memoizedState;
            a.mode & 1 ? (U = (l = U) || m, ck(b, a), U = l) : ck(b, a);
            ek(a);
            if (d & 8192) {
              l = null !== a.memoizedState;
              if ((a.stateNode.isHidden = l) && !m && 0 !== (a.mode & 1))
                for (V = a, m = a.child; null !== m; ) {
                  for (q = V = m; null !== V; ) {
                    r = V;
                    y = r.child;
                    switch (r.tag) {
                      case 0:
                      case 11:
                      case 14:
                      case 15:
                        Pj(4, r, r.return);
                        break;
                      case 1:
                        Lj(r, r.return);
                        var n = r.stateNode;
                        if ("function" === typeof n.componentWillUnmount) {
                          d = r;
                          c = r.return;
                          try {
                            b = d, n.props = b.memoizedProps, n.state = b.memoizedState, n.componentWillUnmount();
                          } catch (t) {
                            W(d, c, t);
                          }
                        }
                        break;
                      case 5:
                        Lj(r, r.return);
                        break;
                      case 22:
                        if (null !== r.memoizedState) {
                          gk(q);
                          continue;
                        }
                    }
                    null !== y ? (y.return = r, V = y) : gk(q);
                  }
                  m = m.sibling;
                }
              a:
                for (m = null, q = a; ; ) {
                  if (5 === q.tag) {
                    if (null === m) {
                      m = q;
                      try {
                        e = q.stateNode, l ? (f = e.style, "function" === typeof f.setProperty ? f.setProperty("display", "none", "important") : f.display = "none") : (h = q.stateNode, k = q.memoizedProps.style, g = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g));
                      } catch (t) {
                        W(a, a.return, t);
                      }
                    }
                  } else if (6 === q.tag) {
                    if (null === m)
                      try {
                        q.stateNode.nodeValue = l ? "" : q.memoizedProps;
                      } catch (t) {
                        W(a, a.return, t);
                      }
                  } else if ((22 !== q.tag && 23 !== q.tag || null === q.memoizedState || q === a) && null !== q.child) {
                    q.child.return = q;
                    q = q.child;
                    continue;
                  }
                  if (q === a)
                    break a;
                  for (; null === q.sibling; ) {
                    if (null === q.return || q.return === a)
                      break a;
                    m === q && (m = null);
                    q = q.return;
                  }
                  m === q && (m = null);
                  q.sibling.return = q.return;
                  q = q.sibling;
                }
            }
            break;
          case 19:
            ck(b, a);
            ek(a);
            d & 4 && ak(a);
            break;
          case 21:
            break;
          default:
            ck(
              b,
              a
            ), ek(a);
        }
      }
      function ek(a) {
        var b = a.flags;
        if (b & 2) {
          try {
            a: {
              for (var c = a.return; null !== c; ) {
                if (Tj(c)) {
                  var d = c;
                  break a;
                }
                c = c.return;
              }
              throw Error(p(160));
            }
            switch (d.tag) {
              case 5:
                var e = d.stateNode;
                d.flags & 32 && (ob(e, ""), d.flags &= -33);
                var f = Uj(a);
                Wj(a, f, e);
                break;
              case 3:
              case 4:
                var g = d.stateNode.containerInfo, h = Uj(a);
                Vj(a, h, g);
                break;
              default:
                throw Error(p(161));
            }
          } catch (k) {
            W(a, a.return, k);
          }
          a.flags &= -3;
        }
        b & 4096 && (a.flags &= -4097);
      }
      function hk(a, b, c) {
        V = a;
        ik(a, b, c);
      }
      function ik(a, b, c) {
        for (var d = 0 !== (a.mode & 1); null !== V; ) {
          var e = V, f = e.child;
          if (22 === e.tag && d) {
            var g = null !== e.memoizedState || Jj;
            if (!g) {
              var h = e.alternate, k = null !== h && null !== h.memoizedState || U;
              h = Jj;
              var l = U;
              Jj = g;
              if ((U = k) && !l)
                for (V = e; null !== V; )
                  g = V, k = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k ? (k.return = g, V = k) : jk(e);
              for (; null !== f; )
                V = f, ik(f, b, c), f = f.sibling;
              V = e;
              Jj = h;
              U = l;
            }
            kk(a, b, c);
          } else
            0 !== (e.subtreeFlags & 8772) && null !== f ? (f.return = e, V = f) : kk(a, b, c);
        }
      }
      function kk(a) {
        for (; null !== V; ) {
          var b = V;
          if (0 !== (b.flags & 8772)) {
            var c = b.alternate;
            try {
              if (0 !== (b.flags & 8772))
                switch (b.tag) {
                  case 0:
                  case 11:
                  case 15:
                    U || Qj(5, b);
                    break;
                  case 1:
                    var d = b.stateNode;
                    if (b.flags & 4 && !U)
                      if (null === c)
                        d.componentDidMount();
                      else {
                        var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
                        d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
                      }
                    var f = b.updateQueue;
                    null !== f && sh(b, f, d);
                    break;
                  case 3:
                    var g = b.updateQueue;
                    if (null !== g) {
                      c = null;
                      if (null !== b.child)
                        switch (b.child.tag) {
                          case 5:
                            c = b.child.stateNode;
                            break;
                          case 1:
                            c = b.child.stateNode;
                        }
                      sh(b, g, c);
                    }
                    break;
                  case 5:
                    var h = b.stateNode;
                    if (null === c && b.flags & 4) {
                      c = h;
                      var k = b.memoizedProps;
                      switch (b.type) {
                        case "button":
                        case "input":
                        case "select":
                        case "textarea":
                          k.autoFocus && c.focus();
                          break;
                        case "img":
                          k.src && (c.src = k.src);
                      }
                    }
                    break;
                  case 6:
                    break;
                  case 4:
                    break;
                  case 12:
                    break;
                  case 13:
                    if (null === b.memoizedState) {
                      var l = b.alternate;
                      if (null !== l) {
                        var m = l.memoizedState;
                        if (null !== m) {
                          var q = m.dehydrated;
                          null !== q && bd(q);
                        }
                      }
                    }
                    break;
                  case 19:
                  case 17:
                  case 21:
                  case 22:
                  case 23:
                  case 25:
                    break;
                  default:
                    throw Error(p(163));
                }
              U || b.flags & 512 && Rj(b);
            } catch (r) {
              W(b, b.return, r);
            }
          }
          if (b === a) {
            V = null;
            break;
          }
          c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function gk(a) {
        for (; null !== V; ) {
          var b = V;
          if (b === a) {
            V = null;
            break;
          }
          var c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function jk(a) {
        for (; null !== V; ) {
          var b = V;
          try {
            switch (b.tag) {
              case 0:
              case 11:
              case 15:
                var c = b.return;
                try {
                  Qj(4, b);
                } catch (k) {
                  W(b, c, k);
                }
                break;
              case 1:
                var d = b.stateNode;
                if ("function" === typeof d.componentDidMount) {
                  var e = b.return;
                  try {
                    d.componentDidMount();
                  } catch (k) {
                    W(b, e, k);
                  }
                }
                var f = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, f, k);
                }
                break;
              case 5:
                var g = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, g, k);
                }
            }
          } catch (k) {
            W(b, b.return, k);
          }
          if (b === a) {
            V = null;
            break;
          }
          var h = b.sibling;
          if (null !== h) {
            h.return = b.return;
            V = h;
            break;
          }
          V = b.return;
        }
      }
      var lk = Math.ceil;
      var mk = ua.ReactCurrentDispatcher;
      var nk = ua.ReactCurrentOwner;
      var ok = ua.ReactCurrentBatchConfig;
      var K = 0;
      var Q = null;
      var Y = null;
      var Z = 0;
      var fj = 0;
      var ej = Uf(0);
      var T = 0;
      var pk = null;
      var rh = 0;
      var qk = 0;
      var rk = 0;
      var sk = null;
      var tk = null;
      var fk = 0;
      var Gj = Infinity;
      var uk = null;
      var Oi = false;
      var Pi = null;
      var Ri = null;
      var vk = false;
      var wk = null;
      var xk = 0;
      var yk = 0;
      var zk = null;
      var Ak = -1;
      var Bk = 0;
      function R() {
        return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
      }
      function yi(a) {
        if (0 === (a.mode & 1))
          return 1;
        if (0 !== (K & 2) && 0 !== Z)
          return Z & -Z;
        if (null !== Kg.transition)
          return 0 === Bk && (Bk = yc()), Bk;
        a = C;
        if (0 !== a)
          return a;
        a = window.event;
        a = void 0 === a ? 16 : jd(a.type);
        return a;
      }
      function gi(a, b, c, d) {
        if (50 < yk)
          throw yk = 0, zk = null, Error(p(185));
        Ac(a, c, d);
        if (0 === (K & 2) || a !== Q)
          a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
      }
      function Dk(a, b) {
        var c = a.callbackNode;
        wc(a, b);
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d)
          null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
        else if (b = d & -d, a.callbackPriority !== b) {
          null != c && bc(c);
          if (1 === b)
            0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
              0 === (K & 6) && jg();
            }), c = null;
          else {
            switch (Dc(d)) {
              case 1:
                c = fc;
                break;
              case 4:
                c = gc;
                break;
              case 16:
                c = hc;
                break;
              case 536870912:
                c = jc;
                break;
              default:
                c = hc;
            }
            c = Fk(c, Gk.bind(null, a));
          }
          a.callbackPriority = b;
          a.callbackNode = c;
        }
      }
      function Gk(a, b) {
        Ak = -1;
        Bk = 0;
        if (0 !== (K & 6))
          throw Error(p(327));
        var c = a.callbackNode;
        if (Hk() && a.callbackNode !== c)
          return null;
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d)
          return null;
        if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b)
          b = Ik(a, d);
        else {
          b = d;
          var e = K;
          K |= 2;
          var f = Jk();
          if (Q !== a || Z !== b)
            uk = null, Gj = B() + 500, Kk(a, b);
          do
            try {
              Lk();
              break;
            } catch (h) {
              Mk(a, h);
            }
          while (1);
          $g();
          mk.current = f;
          K = e;
          null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
        }
        if (0 !== b) {
          2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
          if (1 === b)
            throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
          if (6 === b)
            Ck(a, d);
          else {
            e = a.current.alternate;
            if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f = xc(a), 0 !== f && (d = f, b = Nk(a, f))), 1 === b))
              throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
            a.finishedWork = e;
            a.finishedLanes = d;
            switch (b) {
              case 0:
              case 1:
                throw Error(p(345));
              case 2:
                Pk(a, tk, uk);
                break;
              case 3:
                Ck(a, d);
                if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
                  if (0 !== uc(a, 0))
                    break;
                  e = a.suspendedLanes;
                  if ((e & d) !== d) {
                    R();
                    a.pingedLanes |= a.suspendedLanes & e;
                    break;
                  }
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 4:
                Ck(a, d);
                if ((d & 4194240) === d)
                  break;
                b = a.eventTimes;
                for (e = -1; 0 < d; ) {
                  var g = 31 - oc(d);
                  f = 1 << g;
                  g = b[g];
                  g > e && (e = g);
                  d &= ~f;
                }
                d = e;
                d = B() - d;
                d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
                if (10 < d) {
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 5:
                Pk(a, tk, uk);
                break;
              default:
                throw Error(p(329));
            }
          }
        }
        Dk(a, B());
        return a.callbackNode === c ? Gk.bind(null, a) : null;
      }
      function Nk(a, b) {
        var c = sk;
        a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
        a = Ik(a, b);
        2 !== a && (b = tk, tk = c, null !== b && Fj(b));
        return a;
      }
      function Fj(a) {
        null === tk ? tk = a : tk.push.apply(tk, a);
      }
      function Ok(a) {
        for (var b = a; ; ) {
          if (b.flags & 16384) {
            var c = b.updateQueue;
            if (null !== c && (c = c.stores, null !== c))
              for (var d = 0; d < c.length; d++) {
                var e = c[d], f = e.getSnapshot;
                e = e.value;
                try {
                  if (!He(f(), e))
                    return false;
                } catch (g) {
                  return false;
                }
              }
          }
          c = b.child;
          if (b.subtreeFlags & 16384 && null !== c)
            c.return = b, b = c;
          else {
            if (b === a)
              break;
            for (; null === b.sibling; ) {
              if (null === b.return || b.return === a)
                return true;
              b = b.return;
            }
            b.sibling.return = b.return;
            b = b.sibling;
          }
        }
        return true;
      }
      function Ck(a, b) {
        b &= ~rk;
        b &= ~qk;
        a.suspendedLanes |= b;
        a.pingedLanes &= ~b;
        for (a = a.expirationTimes; 0 < b; ) {
          var c = 31 - oc(b), d = 1 << c;
          a[c] = -1;
          b &= ~d;
        }
      }
      function Ek(a) {
        if (0 !== (K & 6))
          throw Error(p(327));
        Hk();
        var b = uc(a, 0);
        if (0 === (b & 1))
          return Dk(a, B()), null;
        var c = Ik(a, b);
        if (0 !== a.tag && 2 === c) {
          var d = xc(a);
          0 !== d && (b = d, c = Nk(a, d));
        }
        if (1 === c)
          throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
        if (6 === c)
          throw Error(p(345));
        a.finishedWork = a.current.alternate;
        a.finishedLanes = b;
        Pk(a, tk, uk);
        Dk(a, B());
        return null;
      }
      function Qk(a, b) {
        var c = K;
        K |= 1;
        try {
          return a(b);
        } finally {
          K = c, 0 === K && (Gj = B() + 500, fg && jg());
        }
      }
      function Rk(a) {
        null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
        var b = K;
        K |= 1;
        var c = ok.transition, d = C;
        try {
          if (ok.transition = null, C = 1, a)
            return a();
        } finally {
          C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
        }
      }
      function Hj() {
        fj = ej.current;
        E(ej);
      }
      function Kk(a, b) {
        a.finishedWork = null;
        a.finishedLanes = 0;
        var c = a.timeoutHandle;
        -1 !== c && (a.timeoutHandle = -1, Gf(c));
        if (null !== Y)
          for (c = Y.return; null !== c; ) {
            var d = c;
            wg(d);
            switch (d.tag) {
              case 1:
                d = d.type.childContextTypes;
                null !== d && void 0 !== d && $f();
                break;
              case 3:
                zh();
                E(Wf);
                E(H);
                Eh();
                break;
              case 5:
                Bh(d);
                break;
              case 4:
                zh();
                break;
              case 13:
                E(L);
                break;
              case 19:
                E(L);
                break;
              case 10:
                ah(d.type._context);
                break;
              case 22:
              case 23:
                Hj();
            }
            c = c.return;
          }
        Q = a;
        Y = a = Pg(a.current, null);
        Z = fj = b;
        T = 0;
        pk = null;
        rk = qk = rh = 0;
        tk = sk = null;
        if (null !== fh) {
          for (b = 0; b < fh.length; b++)
            if (c = fh[b], d = c.interleaved, null !== d) {
              c.interleaved = null;
              var e = d.next, f = c.pending;
              if (null !== f) {
                var g = f.next;
                f.next = e;
                d.next = g;
              }
              c.pending = d;
            }
          fh = null;
        }
        return a;
      }
      function Mk(a, b) {
        do {
          var c = Y;
          try {
            $g();
            Fh.current = Rh;
            if (Ih) {
              for (var d = M.memoizedState; null !== d; ) {
                var e = d.queue;
                null !== e && (e.pending = null);
                d = d.next;
              }
              Ih = false;
            }
            Hh = 0;
            O = N = M = null;
            Jh = false;
            Kh = 0;
            nk.current = null;
            if (null === c || null === c.return) {
              T = 1;
              pk = b;
              Y = null;
              break;
            }
            a: {
              var f = a, g = c.return, h = c, k = b;
              b = Z;
              h.flags |= 32768;
              if (null !== k && "object" === typeof k && "function" === typeof k.then) {
                var l = k, m = h, q = m.tag;
                if (0 === (m.mode & 1) && (0 === q || 11 === q || 15 === q)) {
                  var r = m.alternate;
                  r ? (m.updateQueue = r.updateQueue, m.memoizedState = r.memoizedState, m.lanes = r.lanes) : (m.updateQueue = null, m.memoizedState = null);
                }
                var y = Ui(g);
                if (null !== y) {
                  y.flags &= -257;
                  Vi(y, g, h, f, b);
                  y.mode & 1 && Si(f, l, b);
                  b = y;
                  k = l;
                  var n = b.updateQueue;
                  if (null === n) {
                    var t = /* @__PURE__ */ new Set();
                    t.add(k);
                    b.updateQueue = t;
                  } else
                    n.add(k);
                  break a;
                } else {
                  if (0 === (b & 1)) {
                    Si(f, l, b);
                    tj();
                    break a;
                  }
                  k = Error(p(426));
                }
              } else if (I && h.mode & 1) {
                var J = Ui(g);
                if (null !== J) {
                  0 === (J.flags & 65536) && (J.flags |= 256);
                  Vi(J, g, h, f, b);
                  Jg(Ji(k, h));
                  break a;
                }
              }
              f = k = Ji(k, h);
              4 !== T && (T = 2);
              null === sk ? sk = [f] : sk.push(f);
              f = g;
              do {
                switch (f.tag) {
                  case 3:
                    f.flags |= 65536;
                    b &= -b;
                    f.lanes |= b;
                    var x = Ni(f, k, b);
                    ph(f, x);
                    break a;
                  case 1:
                    h = k;
                    var w = f.type, u = f.stateNode;
                    if (0 === (f.flags & 128) && ("function" === typeof w.getDerivedStateFromError || null !== u && "function" === typeof u.componentDidCatch && (null === Ri || !Ri.has(u)))) {
                      f.flags |= 65536;
                      b &= -b;
                      f.lanes |= b;
                      var F = Qi(f, h, b);
                      ph(f, F);
                      break a;
                    }
                }
                f = f.return;
              } while (null !== f);
            }
            Sk(c);
          } catch (na) {
            b = na;
            Y === c && null !== c && (Y = c = c.return);
            continue;
          }
          break;
        } while (1);
      }
      function Jk() {
        var a = mk.current;
        mk.current = Rh;
        return null === a ? Rh : a;
      }
      function tj() {
        if (0 === T || 3 === T || 2 === T)
          T = 4;
        null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
      }
      function Ik(a, b) {
        var c = K;
        K |= 2;
        var d = Jk();
        if (Q !== a || Z !== b)
          uk = null, Kk(a, b);
        do
          try {
            Tk();
            break;
          } catch (e) {
            Mk(a, e);
          }
        while (1);
        $g();
        K = c;
        mk.current = d;
        if (null !== Y)
          throw Error(p(261));
        Q = null;
        Z = 0;
        return T;
      }
      function Tk() {
        for (; null !== Y; )
          Uk(Y);
      }
      function Lk() {
        for (; null !== Y && !cc(); )
          Uk(Y);
      }
      function Uk(a) {
        var b = Vk(a.alternate, a, fj);
        a.memoizedProps = a.pendingProps;
        null === b ? Sk(a) : Y = b;
        nk.current = null;
      }
      function Sk(a) {
        var b = a;
        do {
          var c = b.alternate;
          a = b.return;
          if (0 === (b.flags & 32768)) {
            if (c = Ej(c, b, fj), null !== c) {
              Y = c;
              return;
            }
          } else {
            c = Ij(c, b);
            if (null !== c) {
              c.flags &= 32767;
              Y = c;
              return;
            }
            if (null !== a)
              a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
            else {
              T = 6;
              Y = null;
              return;
            }
          }
          b = b.sibling;
          if (null !== b) {
            Y = b;
            return;
          }
          Y = b = a;
        } while (null !== b);
        0 === T && (T = 5);
      }
      function Pk(a, b, c) {
        var d = C, e = ok.transition;
        try {
          ok.transition = null, C = 1, Wk(a, b, c, d);
        } finally {
          ok.transition = e, C = d;
        }
        return null;
      }
      function Wk(a, b, c, d) {
        do
          Hk();
        while (null !== wk);
        if (0 !== (K & 6))
          throw Error(p(327));
        c = a.finishedWork;
        var e = a.finishedLanes;
        if (null === c)
          return null;
        a.finishedWork = null;
        a.finishedLanes = 0;
        if (c === a.current)
          throw Error(p(177));
        a.callbackNode = null;
        a.callbackPriority = 0;
        var f = c.lanes | c.childLanes;
        Bc(a, f);
        a === Q && (Y = Q = null, Z = 0);
        0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
          Hk();
          return null;
        }));
        f = 0 !== (c.flags & 15990);
        if (0 !== (c.subtreeFlags & 15990) || f) {
          f = ok.transition;
          ok.transition = null;
          var g = C;
          C = 1;
          var h = K;
          K |= 4;
          nk.current = null;
          Oj(a, c);
          dk(c, a);
          Oe(Df);
          dd = !!Cf;
          Df = Cf = null;
          a.current = c;
          hk(c, a, e);
          dc();
          K = h;
          C = g;
          ok.transition = f;
        } else
          a.current = c;
        vk && (vk = false, wk = a, xk = e);
        f = a.pendingLanes;
        0 === f && (Ri = null);
        mc(c.stateNode, d);
        Dk(a, B());
        if (null !== b)
          for (d = a.onRecoverableError, c = 0; c < b.length; c++)
            e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
        if (Oi)
          throw Oi = false, a = Pi, Pi = null, a;
        0 !== (xk & 1) && 0 !== a.tag && Hk();
        f = a.pendingLanes;
        0 !== (f & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
        jg();
        return null;
      }
      function Hk() {
        if (null !== wk) {
          var a = Dc(xk), b = ok.transition, c = C;
          try {
            ok.transition = null;
            C = 16 > a ? 16 : a;
            if (null === wk)
              var d = false;
            else {
              a = wk;
              wk = null;
              xk = 0;
              if (0 !== (K & 6))
                throw Error(p(331));
              var e = K;
              K |= 4;
              for (V = a.current; null !== V; ) {
                var f = V, g = f.child;
                if (0 !== (V.flags & 16)) {
                  var h = f.deletions;
                  if (null !== h) {
                    for (var k = 0; k < h.length; k++) {
                      var l = h[k];
                      for (V = l; null !== V; ) {
                        var m = V;
                        switch (m.tag) {
                          case 0:
                          case 11:
                          case 15:
                            Pj(8, m, f);
                        }
                        var q = m.child;
                        if (null !== q)
                          q.return = m, V = q;
                        else
                          for (; null !== V; ) {
                            m = V;
                            var r = m.sibling, y = m.return;
                            Sj(m);
                            if (m === l) {
                              V = null;
                              break;
                            }
                            if (null !== r) {
                              r.return = y;
                              V = r;
                              break;
                            }
                            V = y;
                          }
                      }
                    }
                    var n = f.alternate;
                    if (null !== n) {
                      var t = n.child;
                      if (null !== t) {
                        n.child = null;
                        do {
                          var J = t.sibling;
                          t.sibling = null;
                          t = J;
                        } while (null !== t);
                      }
                    }
                    V = f;
                  }
                }
                if (0 !== (f.subtreeFlags & 2064) && null !== g)
                  g.return = f, V = g;
                else
                  b:
                    for (; null !== V; ) {
                      f = V;
                      if (0 !== (f.flags & 2048))
                        switch (f.tag) {
                          case 0:
                          case 11:
                          case 15:
                            Pj(9, f, f.return);
                        }
                      var x = f.sibling;
                      if (null !== x) {
                        x.return = f.return;
                        V = x;
                        break b;
                      }
                      V = f.return;
                    }
              }
              var w = a.current;
              for (V = w; null !== V; ) {
                g = V;
                var u = g.child;
                if (0 !== (g.subtreeFlags & 2064) && null !== u)
                  u.return = g, V = u;
                else
                  b:
                    for (g = w; null !== V; ) {
                      h = V;
                      if (0 !== (h.flags & 2048))
                        try {
                          switch (h.tag) {
                            case 0:
                            case 11:
                            case 15:
                              Qj(9, h);
                          }
                        } catch (na) {
                          W(h, h.return, na);
                        }
                      if (h === g) {
                        V = null;
                        break b;
                      }
                      var F = h.sibling;
                      if (null !== F) {
                        F.return = h.return;
                        V = F;
                        break b;
                      }
                      V = h.return;
                    }
              }
              K = e;
              jg();
              if (lc && "function" === typeof lc.onPostCommitFiberRoot)
                try {
                  lc.onPostCommitFiberRoot(kc, a);
                } catch (na) {
                }
              d = true;
            }
            return d;
          } finally {
            C = c, ok.transition = b;
          }
        }
        return false;
      }
      function Xk(a, b, c) {
        b = Ji(c, b);
        b = Ni(a, b, 1);
        a = nh(a, b, 1);
        b = R();
        null !== a && (Ac(a, 1, b), Dk(a, b));
      }
      function W(a, b, c) {
        if (3 === a.tag)
          Xk(a, a, c);
        else
          for (; null !== b; ) {
            if (3 === b.tag) {
              Xk(b, a, c);
              break;
            } else if (1 === b.tag) {
              var d = b.stateNode;
              if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
                a = Ji(c, a);
                a = Qi(b, a, 1);
                b = nh(b, a, 1);
                a = R();
                null !== b && (Ac(b, 1, a), Dk(b, a));
                break;
              }
            }
            b = b.return;
          }
      }
      function Ti(a, b, c) {
        var d = a.pingCache;
        null !== d && d.delete(b);
        b = R();
        a.pingedLanes |= a.suspendedLanes & c;
        Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
        Dk(a, b);
      }
      function Yk(a, b) {
        0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
        var c = R();
        a = ih(a, b);
        null !== a && (Ac(a, b, c), Dk(a, c));
      }
      function uj(a) {
        var b = a.memoizedState, c = 0;
        null !== b && (c = b.retryLane);
        Yk(a, c);
      }
      function bk(a, b) {
        var c = 0;
        switch (a.tag) {
          case 13:
            var d = a.stateNode;
            var e = a.memoizedState;
            null !== e && (c = e.retryLane);
            break;
          case 19:
            d = a.stateNode;
            break;
          default:
            throw Error(p(314));
        }
        null !== d && d.delete(b);
        Yk(a, c);
      }
      var Vk;
      Vk = function(a, b, c) {
        if (null !== a)
          if (a.memoizedProps !== b.pendingProps || Wf.current)
            dh = true;
          else {
            if (0 === (a.lanes & c) && 0 === (b.flags & 128))
              return dh = false, yj(a, b, c);
            dh = 0 !== (a.flags & 131072) ? true : false;
          }
        else
          dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
        b.lanes = 0;
        switch (b.tag) {
          case 2:
            var d = b.type;
            ij(a, b);
            a = b.pendingProps;
            var e = Yf(b, H.current);
            ch(b, c);
            e = Nh(null, b, d, a, e, c);
            var f = Sh();
            b.flags |= 1;
            "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f = true, cg(b)) : f = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f, c)) : (b.tag = 0, I && f && vg(b), Xi(null, b, e, c), b = b.child);
            return b;
          case 16:
            d = b.elementType;
            a: {
              ij(a, b);
              a = b.pendingProps;
              e = d._init;
              d = e(d._payload);
              b.type = d;
              e = b.tag = Zk(d);
              a = Ci(d, a);
              switch (e) {
                case 0:
                  b = cj(null, b, d, a, c);
                  break a;
                case 1:
                  b = hj(null, b, d, a, c);
                  break a;
                case 11:
                  b = Yi(null, b, d, a, c);
                  break a;
                case 14:
                  b = $i(null, b, d, Ci(d.type, a), c);
                  break a;
              }
              throw Error(p(
                306,
                d,
                ""
              ));
            }
            return b;
          case 0:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
          case 1:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
          case 3:
            a: {
              kj(b);
              if (null === a)
                throw Error(p(387));
              d = b.pendingProps;
              f = b.memoizedState;
              e = f.element;
              lh(a, b);
              qh(b, d, null, c);
              var g = b.memoizedState;
              d = g.element;
              if (f.isDehydrated)
                if (f = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f, b.memoizedState = f, b.flags & 256) {
                  e = Ji(Error(p(423)), b);
                  b = lj(a, b, d, c, e);
                  break a;
                } else if (d !== e) {
                  e = Ji(Error(p(424)), b);
                  b = lj(a, b, d, c, e);
                  break a;
                } else
                  for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; )
                    c.flags = c.flags & -3 | 4096, c = c.sibling;
              else {
                Ig();
                if (d === e) {
                  b = Zi(a, b, c);
                  break a;
                }
                Xi(a, b, d, c);
              }
              b = b.child;
            }
            return b;
          case 5:
            return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f && Ef(d, f) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
          case 6:
            return null === a && Eg(b), null;
          case 13:
            return oj(a, b, c);
          case 4:
            return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
          case 11:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
          case 7:
            return Xi(a, b, b.pendingProps, c), b.child;
          case 8:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 12:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 10:
            a: {
              d = b.type._context;
              e = b.pendingProps;
              f = b.memoizedProps;
              g = e.value;
              G(Wg, d._currentValue);
              d._currentValue = g;
              if (null !== f)
                if (He(f.value, g)) {
                  if (f.children === e.children && !Wf.current) {
                    b = Zi(a, b, c);
                    break a;
                  }
                } else
                  for (f = b.child, null !== f && (f.return = b); null !== f; ) {
                    var h = f.dependencies;
                    if (null !== h) {
                      g = f.child;
                      for (var k = h.firstContext; null !== k; ) {
                        if (k.context === d) {
                          if (1 === f.tag) {
                            k = mh(-1, c & -c);
                            k.tag = 2;
                            var l = f.updateQueue;
                            if (null !== l) {
                              l = l.shared;
                              var m = l.pending;
                              null === m ? k.next = k : (k.next = m.next, m.next = k);
                              l.pending = k;
                            }
                          }
                          f.lanes |= c;
                          k = f.alternate;
                          null !== k && (k.lanes |= c);
                          bh(
                            f.return,
                            c,
                            b
                          );
                          h.lanes |= c;
                          break;
                        }
                        k = k.next;
                      }
                    } else if (10 === f.tag)
                      g = f.type === b.type ? null : f.child;
                    else if (18 === f.tag) {
                      g = f.return;
                      if (null === g)
                        throw Error(p(341));
                      g.lanes |= c;
                      h = g.alternate;
                      null !== h && (h.lanes |= c);
                      bh(g, c, b);
                      g = f.sibling;
                    } else
                      g = f.child;
                    if (null !== g)
                      g.return = f;
                    else
                      for (g = f; null !== g; ) {
                        if (g === b) {
                          g = null;
                          break;
                        }
                        f = g.sibling;
                        if (null !== f) {
                          f.return = g.return;
                          g = f;
                          break;
                        }
                        g = g.return;
                      }
                    f = g;
                  }
              Xi(a, b, e.children, c);
              b = b.child;
            }
            return b;
          case 9:
            return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
          case 14:
            return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
          case 15:
            return bj(a, b, b.type, b.pendingProps, c);
          case 17:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
          case 19:
            return xj(a, b, c);
          case 22:
            return dj(a, b, c);
        }
        throw Error(p(156, b.tag));
      };
      function Fk(a, b) {
        return ac(a, b);
      }
      function $k(a, b, c, d) {
        this.tag = a;
        this.key = c;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.ref = null;
        this.pendingProps = b;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = d;
        this.subtreeFlags = this.flags = 0;
        this.deletions = null;
        this.childLanes = this.lanes = 0;
        this.alternate = null;
      }
      function Bg(a, b, c, d) {
        return new $k(a, b, c, d);
      }
      function aj(a) {
        a = a.prototype;
        return !(!a || !a.isReactComponent);
      }
      function Zk(a) {
        if ("function" === typeof a)
          return aj(a) ? 1 : 0;
        if (void 0 !== a && null !== a) {
          a = a.$$typeof;
          if (a === Da)
            return 11;
          if (a === Ga)
            return 14;
        }
        return 2;
      }
      function Pg(a, b) {
        var c = a.alternate;
        null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
        c.flags = a.flags & 14680064;
        c.childLanes = a.childLanes;
        c.lanes = a.lanes;
        c.child = a.child;
        c.memoizedProps = a.memoizedProps;
        c.memoizedState = a.memoizedState;
        c.updateQueue = a.updateQueue;
        b = a.dependencies;
        c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
        c.sibling = a.sibling;
        c.index = a.index;
        c.ref = a.ref;
        return c;
      }
      function Rg(a, b, c, d, e, f) {
        var g = 2;
        d = a;
        if ("function" === typeof a)
          aj(a) && (g = 1);
        else if ("string" === typeof a)
          g = 5;
        else
          a:
            switch (a) {
              case ya:
                return Tg(c.children, e, f, b);
              case za:
                g = 8;
                e |= 8;
                break;
              case Aa:
                return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f, a;
              case Ea:
                return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f, a;
              case Fa:
                return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f, a;
              case Ia:
                return pj(c, e, f, b);
              default:
                if ("object" === typeof a && null !== a)
                  switch (a.$$typeof) {
                    case Ba:
                      g = 10;
                      break a;
                    case Ca:
                      g = 9;
                      break a;
                    case Da:
                      g = 11;
                      break a;
                    case Ga:
                      g = 14;
                      break a;
                    case Ha:
                      g = 16;
                      d = null;
                      break a;
                  }
                throw Error(p(130, null == a ? a : typeof a, ""));
            }
        b = Bg(g, c, b, e);
        b.elementType = a;
        b.type = d;
        b.lanes = f;
        return b;
      }
      function Tg(a, b, c, d) {
        a = Bg(7, a, d, b);
        a.lanes = c;
        return a;
      }
      function pj(a, b, c, d) {
        a = Bg(22, a, d, b);
        a.elementType = Ia;
        a.lanes = c;
        a.stateNode = { isHidden: false };
        return a;
      }
      function Qg(a, b, c) {
        a = Bg(6, a, null, b);
        a.lanes = c;
        return a;
      }
      function Sg(a, b, c) {
        b = Bg(4, null !== a.children ? a.children : [], a.key, b);
        b.lanes = c;
        b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
        return b;
      }
      function al(a, b, c, d, e) {
        this.tag = b;
        this.containerInfo = a;
        this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
        this.timeoutHandle = -1;
        this.callbackNode = this.pendingContext = this.context = null;
        this.callbackPriority = 0;
        this.eventTimes = zc(0);
        this.expirationTimes = zc(-1);
        this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
        this.entanglements = zc(0);
        this.identifierPrefix = d;
        this.onRecoverableError = e;
        this.mutableSourceEagerHydrationData = null;
      }
      function bl(a, b, c, d, e, f, g, h, k) {
        a = new al(a, b, c, h, k);
        1 === b ? (b = 1, true === f && (b |= 8)) : b = 0;
        f = Bg(3, null, null, b);
        a.current = f;
        f.stateNode = a;
        f.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
        kh(f);
        return a;
      }
      function cl(a, b, c) {
        var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
      }
      function dl(a) {
        if (!a)
          return Vf;
        a = a._reactInternals;
        a: {
          if (Vb(a) !== a || 1 !== a.tag)
            throw Error(p(170));
          var b = a;
          do {
            switch (b.tag) {
              case 3:
                b = b.stateNode.context;
                break a;
              case 1:
                if (Zf(b.type)) {
                  b = b.stateNode.__reactInternalMemoizedMergedChildContext;
                  break a;
                }
            }
            b = b.return;
          } while (null !== b);
          throw Error(p(171));
        }
        if (1 === a.tag) {
          var c = a.type;
          if (Zf(c))
            return bg(a, c, b);
        }
        return b;
      }
      function el(a, b, c, d, e, f, g, h, k) {
        a = bl(c, d, true, a, e, f, g, h, k);
        a.context = dl(null);
        c = a.current;
        d = R();
        e = yi(c);
        f = mh(d, e);
        f.callback = void 0 !== b && null !== b ? b : null;
        nh(c, f, e);
        a.current.lanes = e;
        Ac(a, e, d);
        Dk(a, d);
        return a;
      }
      function fl(a, b, c, d) {
        var e = b.current, f = R(), g = yi(e);
        c = dl(c);
        null === b.context ? b.context = c : b.pendingContext = c;
        b = mh(f, g);
        b.payload = { element: a };
        d = void 0 === d ? null : d;
        null !== d && (b.callback = d);
        a = nh(e, b, g);
        null !== a && (gi(a, e, g, f), oh(a, e, g));
        return g;
      }
      function gl(a) {
        a = a.current;
        if (!a.child)
          return null;
        switch (a.child.tag) {
          case 5:
            return a.child.stateNode;
          default:
            return a.child.stateNode;
        }
      }
      function hl(a, b) {
        a = a.memoizedState;
        if (null !== a && null !== a.dehydrated) {
          var c = a.retryLane;
          a.retryLane = 0 !== c && c < b ? c : b;
        }
      }
      function il(a, b) {
        hl(a, b);
        (a = a.alternate) && hl(a, b);
      }
      function jl() {
        return null;
      }
      var kl = "function" === typeof reportError ? reportError : function(a) {
        console.error(a);
      };
      function ll(a) {
        this._internalRoot = a;
      }
      ml.prototype.render = ll.prototype.render = function(a) {
        var b = this._internalRoot;
        if (null === b)
          throw Error(p(409));
        fl(a, b, null, null);
      };
      ml.prototype.unmount = ll.prototype.unmount = function() {
        var a = this._internalRoot;
        if (null !== a) {
          this._internalRoot = null;
          var b = a.containerInfo;
          Rk(function() {
            fl(null, a, null, null);
          });
          b[uf] = null;
        }
      };
      function ml(a) {
        this._internalRoot = a;
      }
      ml.prototype.unstable_scheduleHydration = function(a) {
        if (a) {
          var b = Hc();
          a = { blockedOn: null, target: a, priority: b };
          for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++)
            ;
          Qc.splice(c, 0, a);
          0 === c && Vc(a);
        }
      };
      function nl(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
      }
      function ol(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
      }
      function pl() {
      }
      function ql(a, b, c, d, e) {
        if (e) {
          if ("function" === typeof d) {
            var f = d;
            d = function() {
              var a2 = gl(g);
              f.call(a2);
            };
          }
          var g = el(b, d, a, 0, null, false, false, "", pl);
          a._reactRootContainer = g;
          a[uf] = g.current;
          sf(8 === a.nodeType ? a.parentNode : a);
          Rk();
          return g;
        }
        for (; e = a.lastChild; )
          a.removeChild(e);
        if ("function" === typeof d) {
          var h = d;
          d = function() {
            var a2 = gl(k);
            h.call(a2);
          };
        }
        var k = bl(a, 0, false, null, null, false, false, "", pl);
        a._reactRootContainer = k;
        a[uf] = k.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        Rk(function() {
          fl(b, k, c, d);
        });
        return k;
      }
      function rl(a, b, c, d, e) {
        var f = c._reactRootContainer;
        if (f) {
          var g = f;
          if ("function" === typeof e) {
            var h = e;
            e = function() {
              var a2 = gl(g);
              h.call(a2);
            };
          }
          fl(b, g, a, e);
        } else
          g = ql(c, b, a, e, d);
        return gl(g);
      }
      Ec = function(a) {
        switch (a.tag) {
          case 3:
            var b = a.stateNode;
            if (b.current.memoizedState.isDehydrated) {
              var c = tc(b.pendingLanes);
              0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
            }
            break;
          case 13:
            Rk(function() {
              var b2 = ih(a, 1);
              if (null !== b2) {
                var c2 = R();
                gi(b2, a, 1, c2);
              }
            }), il(a, 1);
        }
      };
      Fc = function(a) {
        if (13 === a.tag) {
          var b = ih(a, 134217728);
          if (null !== b) {
            var c = R();
            gi(b, a, 134217728, c);
          }
          il(a, 134217728);
        }
      };
      Gc = function(a) {
        if (13 === a.tag) {
          var b = yi(a), c = ih(a, b);
          if (null !== c) {
            var d = R();
            gi(c, a, b, d);
          }
          il(a, b);
        }
      };
      Hc = function() {
        return C;
      };
      Ic = function(a, b) {
        var c = C;
        try {
          return C = a, b();
        } finally {
          C = c;
        }
      };
      yb = function(a, b, c) {
        switch (b) {
          case "input":
            bb(a, c);
            b = c.name;
            if ("radio" === c.type && null != b) {
              for (c = a; c.parentNode; )
                c = c.parentNode;
              c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
              for (b = 0; b < c.length; b++) {
                var d = c[b];
                if (d !== a && d.form === a.form) {
                  var e = Db(d);
                  if (!e)
                    throw Error(p(90));
                  Wa(d);
                  bb(d, e);
                }
              }
            }
            break;
          case "textarea":
            ib(a, c);
            break;
          case "select":
            b = c.value, null != b && fb(a, !!c.multiple, b, false);
        }
      };
      Gb = Qk;
      Hb = Rk;
      var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] };
      var tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
      var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
        a = Zb(a);
        return null === a ? null : a.stateNode;
      }, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
      if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
        vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!vl.isDisabled && vl.supportsFiber)
          try {
            kc = vl.inject(ul), lc = vl;
          } catch (a) {
          }
      }
      var vl;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
      exports.createPortal = function(a, b) {
        var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!nl(b))
          throw Error(p(200));
        return cl(a, b, null, c);
      };
      exports.createRoot = function(a, b) {
        if (!nl(a))
          throw Error(p(299));
        var c = false, d = "", e = kl;
        null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
        b = bl(a, 1, false, null, null, c, false, d, e);
        a[uf] = b.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        return new ll(b);
      };
      exports.findDOMNode = function(a) {
        if (null == a)
          return null;
        if (1 === a.nodeType)
          return a;
        var b = a._reactInternals;
        if (void 0 === b) {
          if ("function" === typeof a.render)
            throw Error(p(188));
          a = Object.keys(a).join(",");
          throw Error(p(268, a));
        }
        a = Zb(b);
        a = null === a ? null : a.stateNode;
        return a;
      };
      exports.flushSync = function(a) {
        return Rk(a);
      };
      exports.hydrate = function(a, b, c) {
        if (!ol(b))
          throw Error(p(200));
        return rl(null, a, b, true, c);
      };
      exports.hydrateRoot = function(a, b, c) {
        if (!nl(a))
          throw Error(p(405));
        var d = null != c && c.hydratedSources || null, e = false, f = "", g = kl;
        null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
        b = el(b, null, a, 1, null != c ? c : null, e, false, f, g);
        a[uf] = b.current;
        sf(a);
        if (d)
          for (a = 0; a < d.length; a++)
            c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
              c,
              e
            );
        return new ml(b);
      };
      exports.render = function(a, b, c) {
        if (!ol(b))
          throw Error(p(200));
        return rl(null, a, b, false, c);
      };
      exports.unmountComponentAtNode = function(a) {
        if (!ol(a))
          throw Error(p(40));
        return a._reactRootContainer ? (Rk(function() {
          rl(null, null, a, false, function() {
            a._reactRootContainer = null;
            a[uf] = null;
          });
        }), true) : false;
      };
      exports.unstable_batchedUpdates = Qk;
      exports.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
        if (!ol(c))
          throw Error(p(200));
        if (null == a || void 0 === a._reactInternals)
          throw Error(p(38));
        return rl(a, b, c, false, d);
      };
      exports.version = "18.3.1-next-f1338f8080-20240426";
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS({
    "node_modules/react-dom/client.js"(exports) {
      "use strict";
      var m = require_react_dom();
      if (true) {
        exports.createRoot = m.createRoot;
        exports.hydrateRoot = m.hydrateRoot;
      } else {
        i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        exports.createRoot = function(c, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.createRoot(c, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
        exports.hydrateRoot = function(c, h, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.hydrateRoot(c, h, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
      }
      var i;
    }
  });

  // node_modules/react/cjs/react-jsx-runtime.production.min.js
  var require_react_jsx_runtime_production_min = __commonJS({
    "node_modules/react/cjs/react-jsx-runtime.production.min.js"(exports) {
      "use strict";
      var f = require_react();
      var k = Symbol.for("react.element");
      var l = Symbol.for("react.fragment");
      var m = Object.prototype.hasOwnProperty;
      var n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
      var p = { key: true, ref: true, __self: true, __source: true };
      function q(c, a, g) {
        var b, d = {}, e = null, h = null;
        void 0 !== g && (e = "" + g);
        void 0 !== a.key && (e = "" + a.key);
        void 0 !== a.ref && (h = a.ref);
        for (b in a)
          m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
        if (c && c.defaultProps)
          for (b in a = c.defaultProps, a)
            void 0 === d[b] && (d[b] = a[b]);
        return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
      }
      exports.Fragment = l;
      exports.jsx = q;
      exports.jsxs = q;
    }
  });

  // node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "node_modules/react/jsx-runtime.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_jsx_runtime_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // extensions/cart-upsell/assets/modules/cart-drawer-class.js
  var import_react12 = __toESM(require_react(), 1);
  var import_client = __toESM(require_client(), 1);

  // extensions/cart-upsell/assets/modules/cart-operations.js
  async function addProductToCart(variantId, quantity = 1, loadCartCallback, properties = {}) {
    try {
      if (!variantId) {
        throw new Error("No variant ID provided");
      }
      if (/^\d+$/.test(variantId)) {
        const formData = new FormData();
        formData.append("id", variantId);
        formData.append("quantity", quantity.toString());
        Object.keys(properties).forEach((key) => {
          formData.append(`properties[${key}]`, properties[key]);
        });
        const response = await fetch("/cart/add.js", {
          method: "POST",
          body: formData
        });
        if (response.ok) {
          await loadCartCallback();
        } else {
          const error = await response.json();
          console.error("Cart add error:", error);
        }
      } else {
        await addProductToCartByHandle(variantId, null, quantity, loadCartCallback, properties);
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
    }
  }
  async function addProductToCartByHandle(productHandle, variantId, quantity = 1, loadCartCallback, properties = {}) {
    try {
      let productResponse;
      if (/^\d+$/.test(productHandle)) {
        const formData2 = new FormData();
        formData2.append("id", productHandle);
        formData2.append("quantity", quantity.toString());
        Object.keys(properties).forEach((key) => {
          formData2.append(`properties[${key}]`, properties[key]);
        });
        const response2 = await fetch("/cart/add.js", {
          method: "POST",
          body: formData2
        });
        if (response2.ok) {
          await loadCartCallback();
          return;
        } else {
          const error = await response2.json();
          console.error("Failed to add product with numeric ID:", productHandle, error);
          throw new Error(error.description || error.message || "Product not found");
        }
      } else {
        productResponse = await fetch(`/products/${productHandle}.js`);
        if (!productResponse.ok) {
          console.error("Product not found for handle:", productHandle);
          throw new Error("Product not found");
        }
      }
      const product = await productResponse.json();
      const variant = variantId ? product.variants.find((v) => {
        const vId = v.id.toString().replace("gid://shopify/ProductVariant/", "");
        const pId = variantId.toString().replace("gid://shopify/ProductVariant/", "");
        return vId === pId;
      }) : product.variants[0];
      if (!variant) {
        console.error("No variant found for product:", product.title);
        throw new Error("Variant not found");
      }
      if (!variant.available) {
        console.warn("Product is not available:", product.title);
        return;
      }
      if (variant.inventory_management && variant.inventory_quantity !== null && variant.inventory_quantity <= 0) {
        console.warn("Product is out of stock:", product.title);
        return;
      }
      const formData = new FormData();
      formData.append("id", variant.id);
      formData.append("quantity", quantity.toString());
      Object.keys(properties).forEach((key) => {
        formData.append(`properties[${key}]`, properties[key]);
      });
      const response = await fetch("/cart/add.js", {
        method: "POST",
        body: formData
      });
      if (response.ok) {
        await loadCartCallback();
      } else {
        const error = await response.json();
        console.error("Cart add failed:", error);
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
      if (error.message && !error.message.includes("Failed to add")) {
      } else {
      }
    }
  }
  async function updateQuantity(itemKey, newQuantity, loadCartCallback, renderCallback) {
    if (newQuantity < 0) {
      return;
    }
    const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`);
    if (cartItem) {
      cartItem.classList.add("selldrawer-loading");
    }
    try {
      const cartResponse = await fetch("/cart.js");
      if (!cartResponse.ok) {
        throw new Error("Failed to fetch cart");
      }
      const cart = await cartResponse.json();
      const cartItemIndex = cart.items.findIndex((item2) => item2.key === itemKey);
      if (cartItemIndex === -1) {
        await loadCartCallback();
        renderCallback();
        return;
      }
      const item = cart.items[cartItemIndex];
      const lineNumber = cartItemIndex + 1;
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          line: lineNumber,
          quantity: newQuantity
        })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.items) {
          const updatedItem = result.items.find((item2) => item2.key === itemKey);
          if (!updatedItem && newQuantity > 0) {
            await loadCartCallback();
            renderCallback();
            return;
          }
        }
        await loadCartCallback(result);
        renderCallback();
        if (newQuantity > 0) {
        }
      } else {
        const error = await response.json();
        console.error("Cart update error:", error);
        await loadCartCallback();
        renderCallback();
        let errorMessage = error.description || error.message || "Failed to update cart";
        if (error.description && error.description.includes("sold out")) {
          if (newQuantity !== 0) {
            errorMessage = "This product is out of stock";
          }
        } else {
        }
        return;
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      await loadCartCallback();
      renderCallback();
    } finally {
      if (cartItem) {
        cartItem.classList.remove("selldrawer-loading");
      }
    }
  }
  async function removeItem(itemKey, loadCartCallback, renderCallback) {
    const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`);
    if (cartItem) {
      cartItem.classList.add("selldrawer-loading");
    }
    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: 0
        })
      });
      if (response.ok) {
        const result = await response.json();
        await loadCartCallback(result);
        renderCallback();
      } else {
        const error = await response.json();
      }
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      if (cartItem) {
        cartItem.classList.remove("selldrawer-loading");
      }
    }
  }
  async function updateCartNote(note, loadCartCallback) {
    try {
      const response = await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ note })
      });
      if (response.ok) {
        await loadCartCallback();
      }
    } catch (error) {
      console.error("Error updating cart note:", error);
    }
  }
  async function toggleShippingProtection(variantId, enabled, loadCartCallback) {
    try {
      if (enabled) {
        await addProductToCart(variantId, 1, loadCartCallback, { _is_shipping_protection: "true" });
      } else {
        const cartResponse = await fetch("/cart.js");
        const cart = await cartResponse.json();
        const item = cart.items.find((i) => i.variant_id.toString() === variantId.toString());
        if (item) {
          await removeItem(item.key, loadCartCallback, () => {
          });
        }
      }
    } catch (error) {
      console.error("Error toggling shipping protection:", error);
    }
  }

  // extensions/cart-upsell/assets/modules/discount-manager.js
  async function loadAvailableDiscounts(appUrl, shop, config) {
    var _a2;
    const couponField = (_a2 = config == null ? void 0 : config.features) == null ? void 0 : _a2.couponCodeField;
    if (!couponField || !couponField.enableAutoApply && !couponField.showAllOffers) {
      return [];
    }
    try {
      const response = await fetch(`${appUrl}/api/available-discounts?shop=${shop}`);
      const data = await response.json();
      if (data.discounts && data.discounts.length > 0) {
        return data.discounts;
      } else {
        console.warn("Selldrawer: No discounts available", {
          count: data.count,
          error: data.error,
          debug: data.debug
        });
        return [];
      }
    } catch (error) {
      console.error("Selldrawer: Failed to load available discounts", error);
      return [];
    }
  }
  async function autoApplyBestDiscount(availableDiscounts, config, loadCartCallback) {
    var _a2;
    if (!availableDiscounts || availableDiscounts.length === 0) {
      return null;
    }
    const couponField = (_a2 = config == null ? void 0 : config.features) == null ? void 0 : _a2.couponCodeField;
    const strategy = (couponField == null ? void 0 : couponField.autoApplyStrategy) || "first_available";
    let bestDiscount = null;
    if (strategy === "first_available") {
      bestDiscount = availableDiscounts[0];
    } else if (strategy === "highest_percentage") {
      for (const discount of availableDiscounts) {
        if (discount.type === "percentage") {
          if (!bestDiscount || discount.value > bestDiscount.value) {
            bestDiscount = discount;
          }
        }
      }
      if (!bestDiscount) {
        bestDiscount = availableDiscounts[0];
      }
    } else {
      bestDiscount = availableDiscounts[0];
    }
    if (bestDiscount) {
      await applyDiscountCode(bestDiscount.code, loadCartCallback);
      return bestDiscount.code;
    }
    return null;
  }
  async function applyDiscountCode(code, loadCartCallback) {
    if (!code || !code.trim()) {
      return false;
    }
    try {
      const response = await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          discount: code.trim()
        })
      });
      if (response.ok) {
        const cart = await response.json();
        if (loadCartCallback) {
          await loadCartCallback(cart);
        }
        return true;
      } else {
        const error = await response.json();
        const errorMessage = error.description || error.message || "Invalid coupon code";
        return false;
      }
    } catch (error) {
      console.error("Selldrawer: Error applying discount", error);
      return false;
    }
  }
  async function removeDiscount(loadCartCallback) {
    try {
      const response = await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          discount: ""
        })
      });
      if (response.ok) {
        const cart = await response.json();
        if (loadCartCallback) {
          await loadCartCallback(cart);
        }
        return true;
      } else {
        const error = await response.json();
        console.error("Selldrawer: Error removing discount", error);
        return false;
      }
    } catch (error) {
      console.error("Selldrawer: Error removing discount", error);
      return false;
    }
  }
  async function validateAndApplyCoupon(appUrl, shop, config, couponCode, loadCartCallback) {
    return await applyDiscountCode(couponCode, loadCartCallback);
  }
  async function applyCoupon(appUrl, shop, config, appliedDiscount, renderCallback) {
    const couponInput = document.getElementById("selldrawer-coupon-input");
    const messageDiv = document.getElementById("selldrawer-coupon-message");
    const applyBtn = document.querySelector(".selldrawer-coupon-apply-btn");
    if (!couponInput || !messageDiv) {
      console.error("Selldrawer: Coupon elements not found");
      return null;
    }
    const couponCode = couponInput.value.trim();
    if (!couponCode) {
      messageDiv.textContent = "Please enter a coupon code";
      messageDiv.style.color = "#ef4444";
      return null;
    }
    messageDiv.textContent = "Applying coupon...";
    messageDiv.style.color = "#6b7280";
    if (applyBtn)
      applyBtn.disabled = true;
    try {
      const success = await applyDiscountCode(couponCode, async (cart) => {
        renderCallback();
      });
      if (success) {
        const couponField = config.features.couponCodeField;
        messageDiv.textContent = couponField.successMessage || "Coupon applied successfully!";
        messageDiv.style.color = "#10b981";
        couponInput.value = "";
        return couponCode;
      } else {
        const couponField = config.features.couponCodeField;
        messageDiv.textContent = couponField.errorMessage || "Invalid coupon code";
        messageDiv.style.color = "#ef4444";
        return null;
      }
    } catch (error) {
      console.error("Selldrawer: Error applying coupon", error);
      const couponField = config.features.couponCodeField;
      messageDiv.textContent = couponField.errorMessage || "Invalid coupon code";
      messageDiv.style.color = "#ef4444";
      return null;
    } finally {
      if (applyBtn)
        applyBtn.disabled = false;
    }
  }
  function getDiscountFromCart(cart) {
    if (!cart || !cart.discount_codes || cart.discount_codes.length === 0) {
      return null;
    }
    const discountCode = cart.discount_codes[0];
    return {
      code: discountCode.code,
      amount: cart.total_discount || 0
      // Total discount amount in cents
    };
  }
  function getCheckoutUrl(discountCode) {
    if (discountCode) {
      return `/checkout?discount=${encodeURIComponent(discountCode)}`;
    }
    return "/checkout";
  }

  // extensions/cart-upsell/assets/modules/product-loader.js
  async function loadProductCompareAtPrices(cart) {
    const productCompareAtPrices = {};
    if (!cart || !cart.items) {
      return productCompareAtPrices;
    }
    const itemsToFetch = cart.items.filter((item) => {
      const linePrice = item.line_price || item.price * item.quantity;
      const hasOriginalLinePrice = item.original_line_price && item.original_line_price > linePrice;
      return !hasOriginalLinePrice && (item.handle || item.product_id) && item.variant_id;
    });
    for (const item of itemsToFetch) {
      try {
        let productHandle = item.handle;
        if (!productHandle && item.url) {
          const urlMatch = item.url.match(/\/products\/([^\/]+)/);
          if (urlMatch) {
            productHandle = urlMatch[1];
          }
        }
        if (productHandle) {
          const productResponse = await fetch(`/products/${productHandle}.js`);
          if (productResponse.ok) {
            const product = await productResponse.json();
            const variant = product.variants.find((v) => {
              const variantId = v.id.toString();
              const itemVariantId = item.variant_id.toString();
              return variantId === itemVariantId || variantId.replace("gid://shopify/ProductVariant/", "") === itemVariantId || variantId === itemVariantId.replace("gid://shopify/ProductVariant/", "");
            });
            if (variant && variant.compare_at_price) {
              let compareAtPrice;
              if (typeof variant.compare_at_price === "string") {
                compareAtPrice = parseInt(variant.compare_at_price, 10);
              } else if (typeof variant.compare_at_price === "number") {
                compareAtPrice = variant.compare_at_price > 1e3 ? Math.round(variant.compare_at_price) : Math.round(variant.compare_at_price * 100);
              } else {
                compareAtPrice = Math.round(parseFloat(variant.compare_at_price) * 100);
              }
              if (compareAtPrice > 0) {
                productCompareAtPrices[item.variant_id] = compareAtPrice;
              }
            }
          }
        }
      } catch (error) {
        console.warn("Failed to load compare_at_price for product:", item.title, error);
      }
    }
    return productCompareAtPrices;
  }
  async function loadShopifyRecommendations(cart, config) {
    var _a2, _b;
    const recommendations = (_a2 = config == null ? void 0 : config.features) == null ? void 0 : _a2.productRecommendations;
    if (!recommendations) {
      return;
    }
    const recommendationType = recommendations.recommendationType;
    if (recommendationType !== "related" && recommendationType !== "complementary") {
      return;
    }
    if (!cart || !cart.items || cart.items.length === 0) {
      return;
    }
    try {
      let productId = null;
      let fallbackProductId = null;
      for (const item of cart.items) {
        if (item.product_id && !((_b = item.properties) == null ? void 0 : _b["_selldrawer_gift_source"]) && !item.title.toLowerCase().includes("protection")) {
          productId = item.product_id;
          break;
        }
        if (!fallbackProductId && item.product_id) {
          fallbackProductId = item.product_id;
        }
      }
      productId = productId || fallbackProductId;
      if (!productId) {
        console.warn("[Selldrawer] No valid Product ID found in cart items for recommendations");
        return;
      }
      const maxProducts = recommendations.maxProducts || 4;
      const getRecommendationsUrl = (intent) => {
        var _a3, _b2;
        const pathPrefix = ((_b2 = (_a3 = window.Shopify) == null ? void 0 : _a3.routes) == null ? void 0 : _b2.root) || "/";
        const cleanPrefix = pathPrefix.endsWith("/") ? pathPrefix : pathPrefix + "/";
        return `${cleanPrefix}recommendations/products.json?product_id=${productId}&intent=${intent}&limit=${maxProducts}`;
      };
      const fetchRecommendationsByIntent = async (intent) => {
        const url = getRecommendationsUrl(intent);
        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`[Selldrawer] Recommendations API (${intent}) returned ${response.status}`);
            return null;
          }
          const data = await response.json();
          const rawProducts = data.products || [];
          if (rawProducts.length === 0) {
            return [];
          }
          const shopifyRecommendations = rawProducts.map((product) => {
            var _a3, _b2;
            const normalizeVariantId = (id) => {
              if (!id)
                return null;
              const idStr = id.toString();
              return idStr.includes("gid://") ? idStr.replace("gid://shopify/ProductVariant/", "") : idStr;
            };
            const firstVariant = (_a3 = product.variants) == null ? void 0 : _a3[0];
            const firstVariantId = normalizeVariantId(firstVariant == null ? void 0 : firstVariant.id);
            const isAvailable = firstVariant ? firstVariant.available !== false && (firstVariant.inventory_management === null || firstVariant.inventory_quantity === void 0 || firstVariant.inventory_quantity === null || firstVariant.inventory_quantity > 0) : false;
            const variants = (product.variants || []).map((v) => ({
              id: normalizeVariantId(v.id),
              title: v.title || "Default Title",
              available: v.available !== false,
              price: v.price ? Math.round(parseFloat(v.price)) : 0,
              compareAtPrice: v.compare_at_price ? Math.round(parseFloat(v.compare_at_price)) : null,
              option1: v.option1 || null,
              option2: v.option2 || null,
              option3: v.option3 || null,
              featured_image: v.featured_image ? { url: v.featured_image.url || v.featured_image } : null
            }));
            const options = (product.options || []).map((o) => typeof o === "string" ? o : o.name).filter(Boolean);
            return {
              id: product.handle,
              // Use handle as ID for consistency with app logic
              shopifyProductId: ((_b2 = product.id) == null ? void 0 : _b2.toString()) || product.handle,
              shopifyVariantId: firstVariantId,
              title: product.title,
              handle: product.handle,
              price: (firstVariant == null ? void 0 : firstVariant.price) ? parseFloat(firstVariant.price) / 100 : 0,
              compareAtPrice: (firstVariant == null ? void 0 : firstVariant.compare_at_price) ? parseFloat(firstVariant.compare_at_price) / 100 : null,
              imageUrl: product.featured_image || product.images && product.images[0],
              position: 0,
              available: isAvailable,
              variants,
              options
            };
          }).filter((rec) => rec.available);
          return shopifyRecommendations.filter((rec) => {
            return !cart.items.some((item) => item.handle && item.handle === rec.handle || String(item.product_id) === String(rec.shopifyProductId));
          });
        } catch (e) {
          console.error(`[Selldrawer] Failed to fetch ${intent} recommendations:`, e);
          return null;
        }
      };
      const primaryIntent = recommendationType === "complementary" ? "complementary" : "related";
      let finalRecommendations = await fetchRecommendationsByIntent(primaryIntent);
      if (!finalRecommendations || finalRecommendations.length === 0) {
        const secondaryIntent = primaryIntent === "complementary" ? "related" : "complementary";
        console.log(`[Selldrawer] Primary recommendations (${primaryIntent}) empty, trying ${secondaryIntent}...`);
        finalRecommendations = await fetchRecommendationsByIntent(secondaryIntent);
      }
      if (!recommendations.products) {
        recommendations.products = [];
      }
      if (finalRecommendations && finalRecommendations.length > 0) {
        recommendations.products = finalRecommendations.slice(0, maxProducts);
      } else {
        console.log("Selldrawer: Dynamic recommendations empty, falling back to manual selection");
      }
    } catch (error) {
      console.error("Selldrawer: Error loading Shopify recommendations:", error);
      if (recommendations) {
        recommendations.products = [];
      }
    }
  }
  async function loadDynamicFreeShippingUpsells(cart, config) {
    var _a2;
    const fsb = (_a2 = config == null ? void 0 : config.features) == null ? void 0 : _a2.freeShippingProgressBar;
    if (!fsb || !fsb.showProductUpsell) {
      return;
    }
    if (!cart || !cart.items || cart.items.length === 0) {
      return;
    }
    try {
      const firstItem = cart.items[0];
      const productId = firstItem.product_id;
      if (!productId) {
        return;
      }
      const recommendationsUrl = `/recommendations/products.json?product_id=${productId}&intent=related&limit=10`;
      console.log("[Cart Drawer] Fetching dynamic upsells from:", recommendationsUrl);
      const response = await fetch(recommendationsUrl);
      if (!response.ok) {
        console.error("[Cart Drawer] Recommendations API failed:", response.status);
        return;
      }
      const data = await response.json();
      const rawProducts = data.products || [];
      console.log(`[Cart Drawer] Shopify returned ${rawProducts.length} recommendations`);
      const cartTotal = cart.total_price / 100;
      const threshold = fsb.thresholdAmount;
      const gap = threshold - cartTotal;
      console.log(`[Cart Drawer] Cart total: ${cartTotal}, Threshold: ${threshold}, Gap: ${gap}`);
      const dynamicUpsells = rawProducts.map((product) => {
        var _a3, _b;
        const normalizeVariantId = (id) => {
          if (!id)
            return null;
          const idStr = id.toString();
          return idStr.includes("gid://") ? idStr.replace("gid://shopify/ProductVariant/", "") : idStr;
        };
        const firstVariant = (_a3 = product.variants) == null ? void 0 : _a3[0];
        const variantId = normalizeVariantId(firstVariant == null ? void 0 : firstVariant.id);
        const price = (firstVariant == null ? void 0 : firstVariant.price) ? parseFloat(firstVariant.price) / 100 : 0;
        const isAvailable = firstVariant ? firstVariant.available !== false && (firstVariant.inventory_management === null || firstVariant.inventory_quantity === null || firstVariant.inventory_quantity === void 0 || firstVariant.inventory_quantity > 0) : false;
        const variants = (product.variants || []).map((v) => ({
          id: normalizeVariantId(v.id),
          title: v.title || "Default Title",
          available: v.available !== false && (v.inventory_management === null || v.inventory_quantity === null || v.inventory_quantity === void 0 || v.inventory_quantity > 0),
          price: v.price ? Math.round(parseFloat(v.price)) : 0,
          compareAtPrice: v.compare_at_price ? Math.round(parseFloat(v.compare_at_price)) : null,
          option1: v.option1 || null,
          option2: v.option2 || null,
          option3: v.option3 || null,
          featured_image: v.featured_image ? { url: v.featured_image.url || v.featured_image } : null
        }));
        const options = (product.options || []).map((o) => typeof o === "string" ? o : o.name).filter(Boolean);
        return {
          id: variantId,
          variantId,
          shopifyProductId: ((_b = product.id) == null ? void 0 : _b.toString()) || product.handle,
          shopifyVariantId: variantId,
          title: product.title,
          handle: product.handle,
          price,
          compareAtPrice: (firstVariant == null ? void 0 : firstVariant.compare_at_price) ? parseFloat(firstVariant.compare_at_price) / 100 : null,
          imageUrl: product.featured_image,
          available: isAvailable,
          variants,
          options
        };
      }).filter((p) => {
        if (!p.available)
          return false;
        const isInCart = cart.items.some((item) => {
          const itemVariantId = String(item.variant_id);
          const pVariantId = String(p.variantId);
          return itemVariantId === pVariantId || item.handle && item.handle === p.handle;
        });
        return !isInCart;
      });
      const sortedUpsells = dynamicUpsells.sort((a, b) => a.price - b.price);
      const finalUpsells = sortedUpsells.slice(0, 4);
      fsb.upsellProducts = [...finalUpsells];
      console.log("[Cart Drawer] Dynamic Free Shipping Upsells Success:", fsb.upsellProducts.length);
    } catch (error) {
      console.error("Selldrawer: Error loading dynamic free shipping upsells:", error);
    }
  }

  // extensions/cart-upsell/assets/modules/auto-apply-storage.js
  var STORAGE_KEY = "selldrawer_discount_removed";
  var EXPIRATION_MINUTES = 15;
  function markDiscountRemoved() {
    const expirationTime = Date.now() + EXPIRATION_MINUTES * 60 * 1e3;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        removed: true,
        expiresAt: expirationTime
      }));
    } catch (error) {
      console.warn("Selldrawer: Failed to save discount removal preference", error);
    }
  }
  function wasDiscountRemoved() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return false;
      }
      const data = JSON.parse(stored);
      const now = Date.now();
      if (now >= data.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      return data.removed === true;
    } catch (error) {
      console.warn("Selldrawer: Failed to read discount removal preference", error);
      return false;
    }
  }
  function clearDiscountRemoval() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Selldrawer: Failed to clear discount removal preference", error);
    }
  }

  // extensions/cart-upsell/assets/modules/cart-operations-enhanced.js
  var DEFAULT_MAX_RETRIES = 3;
  var DEFAULT_RETRY_DELAY = 300;
  var CART_UPDATE_VERIFICATION_TIMEOUT = 2e3;
  var CartOperations = class {
    constructor() {
      this.isOperationInProgress = false;
      this.operationQueue = [];
    }
    /**
     * Retry a cart operation with exponential backoff
     * @param {Function} operation - The async operation to retry
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} baseDelay - Base delay between retries (ms)
     * @returns {Promise} Result of the operation
     */
    async retryOperation(operation, maxRetries = DEFAULT_MAX_RETRIES, baseDelay = DEFAULT_RETRY_DELAY) {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation();
          return result;
        } catch (error) {
          lastError = error;
          console.warn(`Cart operation attempt ${attempt} failed:`, error);
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
      throw new Error(`Cart operation failed after ${maxRetries} attempts: ${(lastError == null ? void 0 : lastError.message) || "Unknown error"}`);
    }
    /**
     * Fetch current cart state
     * @returns {Promise<Object>} Current cart data
     */
    async getCart() {
      return this.retryOperation(async () => {
        const response = await fetch("/cart.js", {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        });
        if (!response.ok) {
          throw new Error(`Cart fetch failed: ${response.status}`);
        }
        return await response.json();
      });
    }
    /**
     * Add items to cart with verification
     * @param {Array} items - Array of items to add [{id, quantity, properties}]
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Result with success status and cart data
     */
    async addToCart(items, options = {}) {
      const { verify = true, maxRetries = DEFAULT_MAX_RETRIES } = options;
      try {
        const result = await this.retryOperation(async () => {
          const response = await fetch("/cart/add.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ items })
          });
          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { description: errorText };
            }
            throw new Error(errorData.description || `Failed to add to cart: ${response.status}`);
          }
          return await response.json();
        }, maxRetries);
        if (verify) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          const cart = await this.getCart();
          const allItemsAdded = items.every((item) => {
            const itemId = this.normalizeVariantId(item.id);
            return cart.items.some((cartItem) => {
              const cartItemId = this.normalizeVariantId(cartItem.variant_id || cartItem.id);
              return cartItemId === itemId;
            });
          });
          if (!allItemsAdded) {
            console.warn("Not all items were verified in cart");
          }
        }
        return { success: true, data: result };
      } catch (error) {
        console.error("Add to cart failed:", error);
        return { success: false, error: error.message };
      }
    }
    /**
     * Remove item from cart by key
     * @param {string} itemKey - Cart item key
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Result with success status
     */
    async removeFromCart(itemKey, options = {}) {
      const { verify = true, maxRetries = DEFAULT_MAX_RETRIES } = options;
      try {
        await this.retryOperation(async () => {
          const response = await fetch("/cart/change.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: itemKey,
              quantity: 0
            })
          });
          if (!response.ok) {
            throw new Error(`Failed to remove from cart: ${response.status}`);
          }
          return await response.json();
        }, maxRetries);
        if (verify) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          const cart = await this.getCart();
          const itemStillExists = cart.items.some((item) => item.key === itemKey);
          if (itemStillExists) {
            throw new Error("Item not removed from cart");
          }
        }
        return { success: true };
      } catch (error) {
        console.error("Remove from cart failed:", error);
        return { success: false, error: error.message };
      }
    }
    /**
     * Replace a cart item with new items (atomic operation)
     * @param {string} oldItemKey - Key of item to remove
     * @param {Array} newItems - New items to add
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Result with success status
     */
    async replaceCartItem(oldItemKey, newItems, options = {}) {
      const { maxRetries = DEFAULT_MAX_RETRIES } = options;
      try {
        const removeResult = await this.removeFromCart(oldItemKey, { verify: true, maxRetries });
        if (!removeResult.success) {
          throw new Error(`Failed to remove old item: ${removeResult.error}`);
        }
        const addResult = await this.addToCart(newItems, { verify: true, maxRetries });
        if (!addResult.success) {
          throw new Error(`Failed to add new items: ${addResult.error}`);
        }
        return { success: true };
      } catch (error) {
        console.error("Replace cart item failed:", error);
        return { success: false, error: error.message };
      }
    }
    /**
     * Verify a product is in the cart
     * @param {string|number} variantId - Variant ID to check
     * @returns {Promise<boolean>} True if product is in cart
     */
    async verifyProductInCart(variantId) {
      try {
        const cart = await this.getCart();
        const normalizedId = this.normalizeVariantId(variantId);
        return cart.items.some((item) => {
          const itemId = this.normalizeVariantId(item.variant_id || item.id);
          return itemId === normalizedId;
        });
      } catch (error) {
        console.error("Error verifying product in cart:", error);
        return false;
      }
    }
    /**
     * Wait for cart to be ready (not locked)
     * @param {number} timeout - Max time to wait in ms
     * @returns {Promise<boolean>} True if cart is ready
     */
    async waitForCartReady(timeout = CART_UPDATE_VERIFICATION_TIMEOUT) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        try {
          const cart = await this.getCart();
          return true;
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      return false;
    }
    /**
     * Find cart item by variant ID
     * @param {string|number} variantId - Variant ID to find
     * @returns {Promise<Object|null>} Cart item or null
     */
    async findCartItem(variantId) {
      try {
        const cart = await this.getCart();
        const normalizedId = this.normalizeVariantId(variantId);
        return cart.items.find((item) => {
          const itemId = this.normalizeVariantId(item.variant_id || item.id);
          return itemId === normalizedId;
        }) || null;
      } catch (error) {
        console.error("Error finding cart item:", error);
        return null;
      }
    }
    /**
     * Normalize variant ID to consistent format (numeric string)
     * @param {string|number} variantId - Variant ID in any format
     * @returns {string} Normalized variant ID
     */
    normalizeVariantId(variantId) {
      if (!variantId)
        return "";
      let id = String(variantId);
      if (id.includes("gid://shopify/ProductVariant/")) {
        id = id.replace("gid://shopify/ProductVariant/", "");
      }
      const numericId = id.replace(/\D/g, "");
      return numericId;
    }
    /**
     * Get checkout URL (handles custom checkout apps)
     * @returns {string} Checkout URL
     */
    getCheckoutUrl() {
      if (typeof Shopify !== "undefined" && Shopify.routes && Shopify.routes.root) {
        const root = Shopify.routes.root.replace(/\/$/, "");
        return `${root}/checkout`;
      }
      return "/checkout";
    }
    /**
     * Validate variant ID format
     * @param {string|number} variantId - Variant ID to validate
     * @returns {boolean} True if valid
     */
    isValidVariantId(variantId) {
      if (!variantId)
        return false;
      const normalized = this.normalizeVariantId(variantId);
      const numericId = parseInt(normalized, 10);
      return !isNaN(numericId) && numericId > 0;
    }
    /**
     * Trigger cart updated event
     */
    triggerCartUpdated() {
      document.dispatchEvent(new CustomEvent("cart:updated", { bubbles: true }));
    }
    /**
     * Fetch product data from Shopify
     * @param {string} handle - Product handle
     * @returns {Promise<Object|null>} Product data or null
     */
    async fetchProductData(handle) {
      try {
        const response = await fetch(`/products/${handle}.js`);
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Error fetching product ${handle}:`, error);
        return null;
      }
    }
    /**
     * Get variant from product data
     * @param {Object} productData - Product data from Shopify
     * @param {string|number} variantId - Preferred variant ID
     * @returns {Object|null} Variant object or null
     */
    getVariantFromProduct(productData, variantId = null) {
      if (!productData || !productData.variants || productData.variants.length === 0) {
        return null;
      }
      if (variantId) {
        const normalizedId = this.normalizeVariantId(variantId);
        const variant = productData.variants.find((v) => {
          const vId = this.normalizeVariantId(v.id);
          return vId === normalizedId;
        });
        if (variant)
          return variant;
      }
      return productData.variants[0];
    }
  };
  var cartOps = new CartOperations();

  // extensions/cart-upsell/assets/modules/milestone-reward-manager.js
  var MilestoneRewardManager = {
    /**
     * Calculate cart total excluding gift items
     */
    calculateCartTotalExcludingGifts(cart) {
      if (!cart || !cart.items)
        return 0;
      let total = 0;
      for (const item of cart.items) {
        const props = this.normalizeProperties(item.properties);
        const isGift = props["_selldrawer_gift_source"];
        if (!isGift) {
          total += item.line_price;
        }
      }
      return total;
    },
    /**
     * Handle milestone rewards - add gift to cart with discount properties
     */
    async handleMilestoneRewards(milestones, cart, onSuccess) {
      if (!milestones || milestones.length === 0)
        return null;
      const cartTotal = this.calculateCartTotalExcludingGifts(cart);
      let unlockedMilestone = null;
      for (const milestone of milestones) {
        if (milestone.rewardType === "gift_wrapping" && cartTotal >= milestone.targetAmount * 100) {
          unlockedMilestone = milestone;
        }
      }
      if (!unlockedMilestone)
        return null;
      const existingGift = this.getMilestoneGiftInCart(cart, unlockedMilestone);
      if (existingGift)
        return unlockedMilestone;
      if (unlockedMilestone.giftProducts && unlockedMilestone.giftProducts.length > 0) {
        const giftProduct = unlockedMilestone.giftProducts[0];
        const variantId = giftProduct.shopifyVariantId || giftProduct.shopifyProductId;
        const items = [{
          id: variantId,
          quantity: 1,
          properties: {
            "_selldrawer_gift_source": "milestone",
            "_selldrawer_discount_type": "FREE",
            "_selldrawer_discount_value": "100",
            "_milestone_id": unlockedMilestone.id
          }
        }];
        const result = await cartOps.addToCart(items);
        if (result.success) {
          this.showMilestoneUnlockedNotification(unlockedMilestone);
          if (onSuccess)
            await onSuccess();
        }
      }
      return unlockedMilestone;
    },
    /**
     * Show milestone unlocked notification
     */
    showMilestoneUnlockedNotification(milestone) {
      const notification = document.createElement("div");
      notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;
      notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">\u{1F389}</span>
        <div>
          <div style="font-weight: 700; margin-bottom: 4px;">Milestone Unlocked!</div>
          <div style="font-weight: 400; opacity: 0.9;">${milestone.title}</div>
        </div>
      </div>
    `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease-in";
        setTimeout(() => notification.remove(), 300);
      }, 4e3);
    },
    /**
     * Get all gifts in cart
     */
    getAllGiftsInCart(cart) {
      if (!cart || !cart.items)
        return [];
      return cart.items.filter((item) => {
        const props = this.normalizeProperties(item.properties);
        return props["_selldrawer_gift_source"] === "milestone";
      });
    },
    /**
     * Get milestone gift in cart
     */
    getMilestoneGiftInCart(cart, milestone) {
      if (!cart || !cart.items || !milestone)
        return null;
      return cart.items.find((item) => {
        const props = this.normalizeProperties(item.properties);
        return props["_milestone_id"] === milestone.id;
      });
    },
    /**
     * Remove gift from cart
     */
    async removeGiftFromCart(itemKey) {
      try {
        await cartOps.removeFromCart(itemKey);
        return true;
      } catch (error) {
        console.error("Error removing gift from cart:", error);
        return false;
      }
    },
    /**
     * Normalize properties object
     */
    normalizeProperties(properties) {
      if (!properties)
        return {};
      if (Array.isArray(properties)) {
        const normalized = {};
        properties.forEach((prop) => {
          if (prop && prop.name) {
            normalized[prop.name] = prop.value;
          }
        });
        return normalized;
      }
      return properties;
    },
    /**
     * Validate milestone for checkout
     */
    async validateMilestoneForCheckout(cart, milestones) {
      const cartTotal = this.calculateCartTotalExcludingGifts(cart);
      const giftsInCart = this.getAllGiftsInCart(cart);
      for (const giftItem of giftsInCart) {
        const props = this.normalizeProperties(giftItem.properties);
        const milestoneId = props["_milestone_id"];
        const milestone = milestones.find((m) => m.id === milestoneId);
        if (!milestone || cartTotal < milestone.targetAmount * 100) {
          return {
            valid: false,
            message: "Cart total has dropped below milestone threshold. Please remove the gift or add more items."
          };
        }
      }
      return { valid: true, message: "" };
    },
    /**
     * Get checkout URL with discount code if applicable
     */
    getCheckoutUrlWithDiscount(milestone) {
      if (!milestone || !milestone.discountCode) {
        return "/checkout";
      }
      return `/checkout?discount=${encodeURIComponent(milestone.discountCode)}`;
    }
  };
  if (typeof document !== "undefined") {
    const style = document.createElement("style");
    style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
    document.head.appendChild(style);
  }

  // extensions/cart-upsell/assets/modules/free-gift-manager.js
  var FreeGiftManager = {
    /**
     * Load free gifts from API
     */
    async loadFreeGifts(shop, cart, cartTotal) {
      try {
        const appUrl = true ? "https://drew-fix-america-insertion.trycloudflare.com" : "https://app.selldrawer.com";
        const response = await fetch(`${appUrl}/api/free-gifts?shop=${encodeURIComponent(shop)}&cartTotal=${cartTotal}`);
        if (!response.ok) {
          console.error("Failed to load free gifts:", response.status);
          return [];
        }
        const data = await response.json();
        return data.freeGifts || [];
      } catch (error) {
        console.error("Error loading free gifts:", error);
        return [];
      }
    },
    /**
     * Select a free gift and add it to cart with discount properties
     */
    async selectGift(variantId, freeGift, onSuccess) {
      try {
        const cart = await cartOps.getCart();
        const existingGifts = this.getAllGiftsInCart(cart, freeGift);
        for (const giftItem of existingGifts) {
          await cartOps.removeFromCart(giftItem.key);
        }
        const items = [{
          id: variantId,
          quantity: 1,
          properties: {
            "_selldrawer_gift_source": "free_gift",
            "_selldrawer_discount_type": "FREE",
            "_selldrawer_discount_value": "100",
            "_free_gift_id": freeGift.id
          }
        }];
        const result = await cartOps.addToCart(items);
        if (result.success && onSuccess) {
          await onSuccess();
        }
        return result.success;
      } catch (error) {
        console.error("Error selecting free gift:", error);
        return false;
      }
    },
    /**
     * Sync free gift with cart (auto-add if only one option)
     */
    async syncFreeGiftWithCart(freeGift, cart, onSuccess) {
      if (!freeGift || !freeGift.qualified)
        return;
      if (freeGift.giftProducts && freeGift.giftProducts.length === 1) {
        const giftProduct = freeGift.giftProducts[0];
        const variantId = giftProduct.shopifyVariantId || giftProduct.shopifyProductId;
        const existingGift = this.getSelectedGiftFromCart(cart, freeGift);
        if (!existingGift) {
          await this.selectGift(variantId, freeGift, onSuccess);
        }
      }
    },
    /**
     * Get selected gift from cart
     */
    getSelectedGiftFromCart(cart, freeGift) {
      if (!cart || !cart.items || !freeGift)
        return null;
      const giftItem = cart.items.find((item) => {
        const props = this.normalizeProperties(item.properties);
        return props["_free_gift_id"] === freeGift.id;
      });
      if (giftItem) {
        const matchingProduct = freeGift.giftProducts.find((p) => {
          const variantId = p.shopifyVariantId || p.shopifyProductId;
          return cartOps.normalizeVariantId(variantId) === cartOps.normalizeVariantId(giftItem.variant_id);
        });
        return matchingProduct ? matchingProduct.id : null;
      }
      return null;
    },
    /**
     * Get all free gifts in cart
     */
    getAllGiftsInCart(cart, freeGift = null) {
      if (!cart || !cart.items)
        return [];
      return cart.items.filter((item) => {
        const props = this.normalizeProperties(item.properties);
        const source = props["_selldrawer_gift_source"];
        if (source !== "free_gift")
          return false;
        if (freeGift) {
          return props["_free_gift_id"] === freeGift.id;
        }
        return true;
      });
    },
    /**
     * Normalize properties object
     */
    normalizeProperties(properties) {
      if (!properties)
        return {};
      if (Array.isArray(properties)) {
        const normalized = {};
        properties.forEach((prop) => {
          if (prop && prop.name) {
            normalized[prop.name] = prop.value;
          }
        });
        return normalized;
      }
      return properties;
    },
    /**
     * Get checkout URL with discount code if applicable
     */
    getCheckoutUrlWithDiscount(freeGift) {
      if (!freeGift || !freeGift.discountCode) {
        return "/checkout";
      }
      return `/checkout?discount=${encodeURIComponent(freeGift.discountCode)}`;
    }
  };

  // extensions/cart-upsell/assets/modules/components/UnifiedCartDrawer.jsx
  var import_react11 = __toESM(require_react(), 1);

  // app/components/shared/FreeShippingBar.tsx
  var import_react2 = __toESM(require_react(), 1);

  // app/components/shared/VariantPickerSheet.tsx
  var import_react = __toESM(require_react(), 1);
  var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
  var fmtPrice = (cents, symbol) => {
    var _a2, _b, _c, _d, _e, _f;
    const amount = cents / 100;
    const isoCode = typeof window !== "undefined" && ((_b = (_a2 = window.selldrawer_config) == null ? void 0 : _a2.currency) == null ? void 0 : _b.isoCode) ? window.selldrawer_config.currency.isoCode : typeof window !== "undefined" && ((_d = (_c = window.selldrawer_config) == null ? void 0 : _c.currency) == null ? void 0 : _d.code) || "USD";
    try {
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: isoCode,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2
      }).format(amount);
    } catch (e) {
      const s = symbol || typeof window !== "undefined" && ((_f = (_e = window.selldrawer_config) == null ? void 0 : _e.currency) == null ? void 0 : _f.symbol) || "";
      return `${s}${amount.toLocaleString()}`;
    }
  };
  var SHEET_KEYFRAMES = `
  @keyframes sd-vps-backdrop-in {
    from { opacity: 0; backdrop-filter: blur(0px); }
    to   { opacity: 1; backdrop-filter: blur(8px); }
  }
  @keyframes sd-vps-sheet-up {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }
  @keyframes sd-vps-sheet-down {
    from { transform: translateY(0);   opacity: 1; }
    to   { transform: translateY(100%); opacity: 0; }
  }
  @keyframes sd-vps-add-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(0.95); }
    70%  { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
  @keyframes sd-vps-check-in {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }
  @keyframes sd-vps-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
  var VariantPickerSheet = ({
    product,
    onClose,
    onAddToCart,
    currency = "USD",
    accentColor = "#7c3aed"
  }) => {
    var _a2, _b, _c;
    const [isClosing, setIsClosing] = (0, import_react.useState)(false);
    const [selectedVariantId, setSelectedVariantId] = (0, import_react.useState)(null);
    const [adding, setAdding] = (0, import_react.useState)(false);
    const [added, setAdded] = (0, import_react.useState)(false);
    const [selectedOptions, setSelectedOptions] = (0, import_react.useState)({});
    const overlayRef = (0, import_react.useRef)(null);
    const getCurrencySymbol = () => {
      var _a3, _b2;
      return typeof window !== "undefined" && ((_b2 = (_a3 = window.selldrawer_config) == null ? void 0 : _a3.currency) == null ? void 0 : _b2.symbol) || "";
    };
    const currencySymbol = getCurrencySymbol();
    (0, import_react.useEffect)(() => {
      var _a3, _b2;
      if (!product)
        return;
      const first = ((_a3 = product.variants) == null ? void 0 : _a3.find((v) => v.available)) || ((_b2 = product.variants) == null ? void 0 : _b2[0]);
      if (first) {
        const opts = {};
        const names = product.options || deriveOptionNames(product.variants);
        if (names[0] && first.option1)
          opts[names[0]] = first.option1;
        if (names[1] && first.option2)
          opts[names[1]] = first.option2;
        if (names[2] && first.option3)
          opts[names[2]] = first.option3;
        setSelectedOptions(opts);
        setSelectedVariantId(first.id);
      }
      setAdded(false);
      setAdding(false);
    }, [product]);
    (0, import_react.useEffect)(() => {
      var _a3, _b2;
      if (!((_a3 = product == null ? void 0 : product.variants) == null ? void 0 : _a3.length))
        return;
      const names = product.options || deriveOptionNames(product.variants);
      const match = product.variants.find((v) => {
        const o1 = names[0] ? selectedOptions[names[0]] : void 0;
        const o2 = names[1] ? selectedOptions[names[1]] : void 0;
        const o3 = names[2] ? selectedOptions[names[2]] : void 0;
        return (!o1 || v.option1 === o1) && (!o2 || v.option2 === o2) && (!o3 || v.option3 === o3);
      });
      setSelectedVariantId((_b2 = match == null ? void 0 : match.id) != null ? _b2 : null);
    }, [selectedOptions, product]);
    if (!product)
      return null;
    const variants = product.variants || [];
    const optionNames = product.options || deriveOptionNames(variants);
    const optionValues = (optionNames || []).map((name, idx) => {
      const key = `option${idx + 1}`;
      const seen = /* @__PURE__ */ new Set();
      const values = [];
      variants.forEach((v) => {
        const val = v[key];
        if (val && !seen.has(val)) {
          seen.add(val);
          const isAvail = variants.some((vv) => vv[key] === val && vv.available);
          values.push({ value: val, available: isAvail });
        }
      });
      return { name, values };
    });
    const selectedVariant = variants.find((v) => v.id === selectedVariantId) || null;
    const displayPrice = (_a2 = selectedVariant == null ? void 0 : selectedVariant.price) != null ? _a2 : product.price;
    const displayCompareAt = (_b = selectedVariant == null ? void 0 : selectedVariant.compareAtPrice) != null ? _b : product.compareAtPrice;
    const imageUrl = ((_c = selectedVariant == null ? void 0 : selectedVariant.featured_image) == null ? void 0 : _c.url) || product.imageUrl;
    const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        onClose();
      }, 280);
    };
    const handleAdd = async () => {
      if (!selectedVariantId || adding || !(selectedVariant == null ? void 0 : selectedVariant.available))
        return;
      setAdding(true);
      try {
        onAddToCart(selectedVariantId);
        await new Promise((r) => setTimeout(r, 600));
        setAdded(true);
        setTimeout(() => {
          handleClose();
        }, 900);
      } finally {
        setAdding(false);
      }
    };
    const handleBackdropClick = (e) => {
      if (e.target === overlayRef.current)
        handleClose();
    };
    const hasDiscount = displayCompareAt && displayCompareAt > displayPrice;
    const discountPct = hasDiscount ? Math.round((displayCompareAt - displayPrice) / displayCompareAt * 100) : 0;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: SHEET_KEYFRAMES }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          ref: overlayRef,
          onClick: handleBackdropClick,
          style: {
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            animation: isClosing ? "sd-vps-backdrop-in 0.28s ease reverse" : "sd-vps-backdrop-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              onClick: (e) => e.stopPropagation(),
              style: {
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                maxWidth: "480px",
                margin: "0 auto",
                background: "#ffffff",
                borderRadius: "28px 28px 0 0",
                boxShadow: "0 -20px 60px rgba(0,0,0,0.15)",
                padding: "0 0 env(safe-area-inset-bottom, 20px)",
                animation: isClosing ? "sd-vps-sheet-down 0.3s cubic-bezier(0.4,0,1,1)" : "sd-vps-sheet-up 0.5s cubic-bezier(0.16,1,0.3,1)",
                display: "flex",
                flexDirection: "column",
                maxHeight: "92vh",
                overflowY: "auto"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", justifyContent: "center", paddingTop: "16px", paddingBottom: "6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: "44px", height: "5px", borderRadius: "100px", background: "#E5E7EB" } }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 20px 0"
                }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "15px", fontWeight: 850, color: "#111827", letterSpacing: "-0.02em" }, children: "Select Options" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      onClick: handleClose,
                      style: {
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        border: "none",
                        background: "#F3F4F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "18px",
                        color: "#6B7280",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.background = "#E5E7EB";
                        e.currentTarget.style.color = "#111827";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.background = "#F3F4F6";
                        e.currentTarget.style.color = "#6B7280";
                      },
                      "aria-label": "Close",
                      children: "\xD7"
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "16px", padding: "16px 20px", alignItems: "flex-start" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
                    width: "80px",
                    height: "80px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "#F9FAFB",
                    border: "1px solid rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }, children: imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: imageUrl, alt: product.title, style: { width: "90%", height: "90%", objectFit: "contain" } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }, children: "\u{1F4E6}" }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
                      fontSize: "15px",
                      fontWeight: "850",
                      color: "#111827",
                      lineHeight: "1.2",
                      marginBottom: "8px",
                      letterSpacing: "-0.02em"
                    }, children: product.title }),
                    selectedVariant && selectedVariant.title !== "Default Title" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
                      display: "inline-block",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: accentColor,
                      background: `${accentColor}10`,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em"
                    }, children: selectedVariant.title }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "17px", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }, children: fmtPrice(displayPrice, currencySymbol) }),
                      hasDiscount && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", fontWeight: 500, color: "#9CA3AF", textDecoration: "line-through" }, children: fmtPrice(displayCompareAt, currencySymbol) }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: {
                          fontSize: "10px",
                          fontWeight: 850,
                          color: "#DC2626",
                          background: "#FEF2F2",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }, children: [
                          discountPct,
                          "% OFF"
                        ] })
                      ] })
                    ] })
                  ] })
                ] }),
                optionValues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "1px", background: "#F3F4F6", margin: "0 20px" } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "16px 20px", display: "flex", flexDirection: "column", gap: "18px" }, children: optionValues.map(({ name, values }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
                    fontSize: "11px",
                    fontWeight: "850",
                    color: "#6B7280",
                    marginBottom: "10px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }, children: [
                    name,
                    selectedOptions[name] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: "#111827", textTransform: "none", letterSpacing: 0, fontWeight: 700 }, children: [
                      "\xB7 ",
                      selectedOptions[name]
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px" }, children: values.map(({ value, available }) => {
                    const isSelected = selectedOptions[name] === value;
                    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                      "button",
                      {
                        onClick: () => {
                          if (!available)
                            return;
                          setSelectedOptions((prev) => __spreadProps(__spreadValues({}, prev), { [name]: value }));
                        },
                        disabled: !available,
                        style: {
                          padding: "8px 16px",
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: isSelected ? "800" : "600",
                          border: "2px solid",
                          borderColor: isSelected ? "#111827" : "#E5E7EB",
                          background: isSelected ? "#111827" : "#ffffff",
                          color: !available ? "#D1D5DB" : isSelected ? "#ffffff" : "#1F2937",
                          cursor: available ? "pointer" : "not-allowed",
                          position: "relative",
                          transition: "all 0.3s cubic-bezier(0.2, 1, 0.3, 1)",
                          opacity: !available ? 0.4 : 1,
                          overflow: "hidden",
                          transform: isSelected ? "scale(1.02)" : "scale(1)"
                        },
                        onMouseEnter: (e) => {
                          if (available && !isSelected) {
                            e.currentTarget.style.borderColor = "#111827";
                            e.currentTarget.style.transform = "scale(1.02)";
                          }
                        },
                        onMouseLeave: (e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "#E5E7EB";
                            e.currentTarget.style.transform = "scale(1)";
                          }
                        },
                        children: [
                          value,
                          !available && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            right: 0,
                            height: "1.5px",
                            background: "#D1D5DB",
                            transform: "rotate(-20deg)",
                            pointerEvents: "none"
                          } })
                        ]
                      },
                      value
                    );
                  }) })
                ] }, name)) }),
                selectedVariant && !selectedVariant.available && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
                  margin: "0 20px 8px",
                  padding: "10px 14px",
                  background: "#FFF5F5",
                  border: "1px solid #FED7D7",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#C53030",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u{1F6AB}" }),
                  " This combination is currently unavailable"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "8px 20px 24px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    onClick: handleAdd,
                    disabled: !selectedVariantId || !(selectedVariant == null ? void 0 : selectedVariant.available) || adding,
                    style: {
                      width: "100%",
                      padding: "16px",
                      borderRadius: "14px",
                      border: "none",
                      fontSize: "16px",
                      fontWeight: "900",
                      cursor: !selectedVariantId || !(selectedVariant == null ? void 0 : selectedVariant.available) || adding ? "not-allowed" : "pointer",
                      transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      letterSpacing: "-0.02em",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      animation: added ? "sd-vps-add-pop 0.5s forwards" : void 0,
                      background: added ? "#10B981" : !selectedVariantId || !(selectedVariant == null ? void 0 : selectedVariant.available) ? "#F3F4F6" : "#111827",
                      color: added ? "#ffffff" : !selectedVariantId || !(selectedVariant == null ? void 0 : selectedVariant.available) ? "#9CA3AF" : "#ffffff",
                      boxShadow: added ? "0 10px 25px rgba(16,185,129,0.3)" : !selectedVariantId || !(selectedVariant == null ? void 0 : selectedVariant.available) ? "none" : selectedVariantId && (selectedVariant == null ? void 0 : selectedVariant.available) ? "0 12px 24px rgba(17,24,39,0.2)" : "none"
                    },
                    onMouseEnter: (e) => {
                      if (selectedVariantId && (selectedVariant == null ? void 0 : selectedVariant.available) && !adding && !added) {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
                        e.currentTarget.style.background = "#000000";
                      }
                    },
                    onMouseLeave: (e) => {
                      if (!added) {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.background = !selectedVariantId || !(selectedVariant == null ? void 0 : selectedVariant.available) ? "#F3F4F6" : "#111827";
                      }
                    },
                    children: adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "svg",
                        {
                          width: "20",
                          height: "20",
                          viewBox: "0 0 24 24",
                          fill: "none",
                          stroke: "currentColor",
                          strokeWidth: "3",
                          style: { animation: "sd-spin 0.7s linear infinite" },
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "10", strokeOpacity: "0.2" }),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2a10 10 0 0 1 10 10" })
                          ]
                        }
                      ),
                      "Processing..."
                    ] }) : added ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "svg",
                        {
                          width: "20",
                          height: "20",
                          viewBox: "0 0 24 24",
                          fill: "none",
                          stroke: "white",
                          strokeWidth: "4",
                          style: { animation: "sd-vps-check-in 0.4s cubic-bezier(0.16,1,0.3,1)" },
                          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "20 6 9 17 4 12" })
                        }
                      ),
                      "Added to Cart!"
                    ] }) : !selectedVariantId || !(selectedVariant == null ? void 0 : selectedVariant.available) ? "Select Options" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                      "Add to Cart \xB7 ",
                      fmtPrice(displayPrice, currencySymbol)
                    ] })
                  }
                ) })
              ]
            }
          )
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `@keyframes sd-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` })
    ] });
  };
  function deriveOptionNames(variants) {
    const names = [];
    if (!(variants == null ? void 0 : variants.length))
      return names;
    const first = variants[0];
    if (first.option1 != null)
      names.push("Option 1");
    if (first.option2 != null)
      names.push("Option 2");
    if (first.option3 != null)
      names.push("Option 3");
    return names;
  }

  // app/components/shared/FreeShippingBar.tsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
  var FreeShippingBar = ({
    thresholdMode,
    thresholdAmount,
    thresholdCount,
    beforeThresholdMessage = "Add {remaining} for FREE shipping",
    afterThresholdMessage = "\u{1F389} You qualify for FREE shipping!",
    backgroundColor = "#f0f9ff",
    progressBarColor = "#7c3aed",
    borderColor = "#e8e0ff",
    showPercentage = true,
    currency = "USD",
    cart,
    isPreview = false,
    showProductUpsell = true,
    upsellHeaderText = "Almost there! Add this to unlock free shipping:",
    appUrl,
    shop,
    onAddProduct,
    upsellProducts = []
  }) => {
    const [animatedProgress, setAnimatedProgress] = (0, import_react2.useState)(0);
    const [celebrated, setCelebrated] = (0, import_react2.useState)(false);
    const [products, setProducts] = (0, import_react2.useState)([]);
    const [pickerProduct, setPickerProduct] = (0, import_react2.useState)(null);
    const prevCompleteRef = (0, import_react2.useRef)(false);
    const calculateProgress = () => {
      if (thresholdMode === "amount" && thresholdAmount) {
        const cartTotal = cart.total_price / 100;
        return Math.min(cartTotal / thresholdAmount * 100, 100);
      } else if (thresholdMode === "count" && thresholdCount) {
        return Math.min(cart.item_count / thresholdCount * 100, 100);
      }
      return 0;
    };
    const calculateRemaining = () => {
      if (thresholdMode === "amount" && thresholdAmount) {
        const cartTotal = cart.total_price / 100;
        return Math.max(thresholdAmount - cartTotal, 0);
      } else if (thresholdMode === "count" && thresholdCount) {
        return Math.max(thresholdCount - cart.item_count, 0);
      }
      return 0;
    };
    const progress = calculateProgress();
    const remaining = calculateRemaining();
    const isComplete = thresholdMode === "amount" && thresholdAmount ? Math.round(cart.total_price / 100) >= Math.round(thresholdAmount) : progress >= 100;
    (0, import_react2.useEffect)(() => {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 80);
      return () => clearTimeout(timer);
    }, [progress]);
    (0, import_react2.useEffect)(() => {
      const wasComplete = prevCompleteRef.current;
      prevCompleteRef.current = isComplete;
      if (isComplete && !wasComplete) {
        setCelebrated(true);
        const t = setTimeout(() => setCelebrated(false), 2e3);
        return () => clearTimeout(t);
      }
    }, [isComplete]);
    const cartItemIdsKey = (cart.items || []).map((i) => String(i.variant_id)).join(",");
    (0, import_react2.useEffect)(() => {
      if (showProductUpsell && !isComplete && Array.isArray(upsellProducts) && upsellProducts.length > 0) {
        const cartItemIds = cartItemIdsKey ? cartItemIdsKey.split(",") : [];
        const filtered = upsellProducts.filter(
          (p) => !cartItemIds.includes(String(p.variantId || p.shopifyVariantId || p.id))
        );
        setProducts(filtered);
      } else {
        setProducts((prev) => prev.length === 0 ? prev : []);
      }
    }, [upsellProducts, isComplete, showProductUpsell, cartItemIdsKey]);
    const handleAddClick = (p) => {
      if (isPreview || !onAddProduct)
        return;
      const variantId = String(p.variantId || p.id);
      const hasMultipleVariants = Array.isArray(p.variants) && p.variants.length > 1;
      if (!hasMultipleVariants) {
        onAddProduct(variantId);
        return;
      }
      setPickerProduct({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl,
        price: Math.round(p.price * 100),
        // convert to cents for the picker
        compareAtPrice: p.compareAtPrice ? Math.round(p.compareAtPrice * 100) : null,
        variants: p.variants,
        options: p.options || []
      });
    };
    const formatMoney = (cents) => {
      var _a2;
      if (typeof cents !== "number")
        return "";
      const amount = cents / 100;
      const currencyConfig = typeof window !== "undefined" ? (_a2 = window.selldrawer_config) == null ? void 0 : _a2.currency : null;
      const isoCode = (currencyConfig == null ? void 0 : currencyConfig.isoCode) || (currencyConfig == null ? void 0 : currencyConfig.code) || "USD";
      try {
        return new Intl.NumberFormat(void 0, {
          style: "currency",
          currency: isoCode,
          minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2
        }).format(amount);
      } catch (e) {
        const symbol = (currencyConfig == null ? void 0 : currencyConfig.symbol) || "$";
        return `${symbol}${amount.toFixed(2)}`;
      }
    };
    const getMessage = () => {
      if (isComplete)
        return afterThresholdMessage;
      let message2 = beforeThresholdMessage;
      if (thresholdMode === "amount") {
        message2 = message2.replace("{remaining}", formatMoney(remaining * 100));
      } else {
        message2 = message2.replace("{remaining}", `${Math.round(remaining)} more items`);
      }
      return message2;
    };
    const message = getMessage();
    const isDark = (color) => {
      if (!color || color === "transparent")
        return false;
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1e3 < 128;
    };
    const textColor = isDark(backgroundColor) ? "#ffffff" : "#1f2937";
    const subTextColor = isDark(backgroundColor) ? "rgba(255,255,255,0.7)" : "#6b7280";
    const badgeBg = isDark(backgroundColor) ? "rgba(255,255,255,0.15)" : "rgba(156,163,175,0.2)";
    const badgeBorder = isDark(backgroundColor) ? "rgba(255,255,255,0.25)" : "rgba(156,163,175,0.3)";
    const fillColor = isComplete ? "#10b981" : progressBarColor;
    const glowColor = isComplete ? "rgba(16,185,129,0.35)" : `${progressBarColor}55`;
    const keyframes = `
    @keyframes sd-truck-slide {
      0% { transform: translateX(-2px); }
      50% { transform: translateX(1px); }
      100% { transform: translateX(-2px); }
    }
    @keyframes sd-shimmer-bar {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes sd-celebrate-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.02); opacity: 0.9; }
    }
    @keyframes sd-flash-in {
      0% { opacity: 0; transform: translateY(4px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { children: keyframes }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "div",
        {
          style: {
            background: backgroundColor,
            borderRadius: "16px",
            border: `2px solid ${borderColor}`,
            padding: "10px 12px",
            boxShadow: isComplete ? "0 4px 15px rgba(16,185,129,0.1)" : "0 4px 15px rgba(0,0,0,0.08)",
            animation: celebrated ? "sd-celebrate-pulse 0.5s ease-in-out 2" : void 0,
            transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "div",
                {
                  style: {
                    fontSize: "18px",
                    lineHeight: 1,
                    flexShrink: 0,
                    animation: isComplete ? void 0 : "sd-truck-slide 1.8s ease-in-out infinite",
                    transition: "all 0.4s ease"
                  },
                  "aria-hidden": "true",
                  children: isComplete ? "\u{1F389}" : "\u{1F69A}"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "div",
                {
                  style: {
                    flex: 1,
                    fontSize: "13px",
                    fontWeight: "700",
                    color: textColor,
                    lineHeight: "1.3",
                    letterSpacing: "-0.01em",
                    animation: "sd-flash-in 0.35s ease"
                  },
                  children: message
                }
              ),
              showPercentage && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "div",
                {
                  style: {
                    flexShrink: 0,
                    fontSize: "11px",
                    fontWeight: "700",
                    color: textColor,
                    background: badgeBg,
                    padding: "3px 8px",
                    borderRadius: "20px",
                    letterSpacing: "0.02em",
                    border: `1.5px solid ${badgeBorder}`
                  },
                  children: isComplete ? "\u2713 FREE" : `${Math.round(progress)}%`
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { position: "relative", height: "6px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "div",
                {
                  style: {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    borderRadius: "100px",
                    background: isDark(backgroundColor) ? "rgba(255,255,255,0.15)" : "rgba(229,231,235,0.6)",
                    overflow: "hidden",
                    display: "block"
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "div",
                    {
                      style: {
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${animatedProgress}%`,
                        borderRadius: "100px",
                        background: fillColor,
                        boxShadow: `0 0 10px ${glowColor}`,
                        transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease",
                        backgroundSize: "200% 100%",
                        animation: !isComplete && animatedProgress > 5 ? "sd-shimmer-bar 2.5s linear infinite" : void 0,
                        display: "block"
                      }
                    }
                  )
                }
              ),
              !isComplete && animatedProgress > 3 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "div",
                {
                  style: {
                    position: "absolute",
                    top: "50%",
                    left: `${animatedProgress}%`,
                    transform: "translate(-50%, -50%)",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: fillColor,
                    boxShadow: `0 0 0 3px ${backgroundColor}, 0 0 0 4.5px ${fillColor}55`,
                    transition: "left 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                    zIndex: 2
                  }
                }
              )
            ] }),
            !isComplete && products.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
              marginTop: "2px",
              paddingTop: "8px",
              borderTop: `1px solid ${isDark(backgroundColor) ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
              display: "block"
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "4px",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch"
              }, children: products.map((p) => {
                const variantId = String(p.variantId || p.shopifyVariantId || p.id);
                const imageUrl = p.imageUrl || p.featured_image;
                const hasMultipleVariants = Array.isArray(p.variants) && p.variants.length > 1;
                return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                  "div",
                  {
                    onClick: () => {
                      if (p.handle)
                        window.location.href = `/products/${p.handle}`;
                    },
                    style: {
                      minWidth: "calc(100% - 40px)",
                      maxWidth: "300px",
                      padding: "6px",
                      background: isDark(backgroundColor) ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.03)",
                      borderRadius: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexShrink: 0
                    },
                    children: [
                      imageUrl && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
                        width: "36px",
                        height: "36px",
                        flexShrink: 0,
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "#fff"
                      }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                        "img",
                        {
                          src: imageUrl,
                          alt: p.title,
                          style: { width: "100%", height: "100%", objectFit: "cover" }
                        }
                      ) }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
                          fontSize: "12px",
                          fontWeight: "600",
                          color: textColor,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }, children: p.title }),
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
                          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: "12px", fontWeight: "800", color: isDark(backgroundColor) ? "#fbbf24" : "#ef4444" }, children: formatMoney(Number(p.price) * 100) }),
                          hasMultipleVariants && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: {
                            fontSize: "9px",
                            fontWeight: 600,
                            color: subTextColor,
                            background: isDark(backgroundColor) ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.07)",
                            padding: "1px 5px",
                            borderRadius: "4px"
                          }, children: [
                            p.variants.length,
                            " options"
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                        "button",
                        {
                          onClick: () => handleAddClick(p),
                          style: {
                            padding: "5px 10px",
                            background: isDark(backgroundColor) ? "#ffffff" : progressBarColor,
                            color: isDark(backgroundColor) ? "#000000" : "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "10px",
                            fontWeight: "700",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            transition: "transform 0.15s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px"
                          },
                          onMouseEnter: (e) => {
                            e.currentTarget.style.transform = "scale(1.06)";
                          },
                          onMouseLeave: (e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          },
                          children: hasMultipleVariants ? "Select" : "Add"
                        }
                      )
                    ]
                  },
                  variantId
                );
              }) }),
              products.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
                display: "flex",
                justifyContent: "center",
                gap: "4px",
                marginTop: "4px",
                opacity: 0.5
              }, children: products.slice(0, 5).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { width: "4px", height: "4px", borderRadius: "50%", background: textColor } }, i)) })
            ] })
          ]
        }
      ),
      pickerProduct && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        VariantPickerSheet,
        {
          product: pickerProduct,
          onClose: () => setPickerProduct(null),
          onAddToCart: (variantId) => {
            if (onAddProduct)
              onAddProduct(variantId);
            setPickerProduct(null);
          },
          currency,
          accentColor: progressBarColor
        }
      )
    ] });
  };

  // app/components/shared/CartItems.tsx
  var import_react3 = __toESM(require_react(), 1);
  var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
  var CART_ITEM_KEYFRAMES = `
  @keyframes sd-item-enter {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes sd-remove-spin {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(90deg) scale(0.85); }
    100% { transform: rotate(90deg) scale(0.85); }
  }
  @keyframes sd-qty-bump {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  @keyframes sd-pending-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
  var CartItemRow = ({
    item,
    productCompareAtPrices,
    isPending = false,
    onUpdateQuantity,
    onRemoveItem,
    isPreview,
    formatMoney,
    calculateItemPrices
  }) => {
    var _a2;
    const [inputValue, setInputValue] = (0, import_react3.useState)(item.quantity.toString());
    const [isEditing, setIsEditing] = (0, import_react3.useState)(false);
    const [error, setError] = (0, import_react3.useState)(null);
    const [isUpdating, setIsUpdating] = (0, import_react3.useState)(false);
    const [isHovered, setIsHovered] = (0, import_react3.useState)(false);
    const [imgHovered, setImgHovered] = (0, import_react3.useState)(false);
    const [removeHovered, setRemoveHovered] = (0, import_react3.useState)(false);
    const [qtyBump, setQtyBump] = (0, import_react3.useState)(false);
    const handleInputChange = (e) => {
      const value = e.target.value;
      if (value === "" || /^\d+$/.test(value)) {
        setInputValue(value);
        setError(null);
      }
    };
    const handleBlur = () => {
      setIsEditing(false);
      const newQuantity = parseInt(inputValue, 10);
      if (!inputValue || isNaN(newQuantity) || newQuantity < 1) {
        setError("Enter a valid quantity");
        setInputValue(item.quantity.toString());
        setTimeout(() => setError(null), 3e3);
        return;
      }
      if (newQuantity === item.quantity)
        return;
      onUpdateQuantity(item.key, newQuantity);
      setQtyBump(true);
      setTimeout(() => setQtyBump(false), 300);
    };
    const handleFocus = () => setIsEditing(true);
    const handleKeyDown = (e) => {
      if (e.key === "Enter")
        e.currentTarget.blur();
    };
    import_react3.default.useEffect(() => {
      if (!isEditing)
        setInputValue(item.quantity.toString());
    }, [item.quantity, isEditing]);
    const handleQtyChange = (newQty) => {
      if (isPreview)
        return;
      if (newQty < 1)
        return;
      setInputValue(newQty.toString());
      setQtyBump(true);
      setTimeout(() => setQtyBump(false), 300);
      onUpdateQuantity(item.key, newQty);
    };
    const currentQuantity = parseInt(inputValue, 10) || item.quantity;
    const prices = calculateItemPrices(item, currentQuantity);
    const imageUrl = ((_a2 = item.featured_image) == null ? void 0 : _a2.url) || item.image || "";
    const isDisabled = isPreview;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "div",
      {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        style: {
          display: "flex",
          gap: "12px",
          padding: "14px 0",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          animation: "sd-item-enter 0.35s cubic-bezier(0.4,0,0.2,1)",
          opacity: isPending ? 0.7 : 1,
          transition: "opacity 0.25s ease",
          position: "relative"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "div",
            {
              style: {
                position: "relative",
                flexShrink: 0,
                width: "80px",
                height: "80px",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#f4f4f8",
                border: "1.5px solid rgba(0,0,0,0.07)",
                boxShadow: imgHovered ? "0 8px 24px rgba(0,0,0,0.14)" : "0 2px 8px rgba(0,0,0,0.07)",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                cursor: "pointer"
              },
              onMouseEnter: () => setImgHovered(true),
              onMouseLeave: () => setImgHovered(false),
              onClick: () => {
                if (item.url)
                  window.location.href = item.url;
                else if (item.handle)
                  window.location.href = `/products/${item.handle}`;
              },
              children: [
                imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "img",
                  {
                    src: imageUrl,
                    alt: item.title,
                    style: {
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transform: imgHovered ? "scale(1.08)" : "scale(1)",
                      transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)"
                    }
                  }
                ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: {
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px"
                }, children: "\u{1F4E6}" }),
                prices.hasItemDiscount && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: {
                  position: "absolute",
                  top: "5px",
                  left: "5px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white",
                  fontSize: "8px",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  letterSpacing: "0.04em",
                  boxShadow: "0 2px 6px rgba(245,158,11,0.3)"
                }, children: [
                  prices.itemDiscountPercent,
                  "% OFF"
                ] }),
                !isPreview && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "button",
                  {
                    onClick: () => !isPending && onRemoveItem(item.key),
                    onMouseEnter: () => setRemoveHovered(true),
                    onMouseLeave: () => setRemoveHovered(false),
                    disabled: isPending,
                    "aria-label": "Remove item",
                    style: {
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: removeHovered ? "#ef4444" : "rgba(0,0,0,0.55)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? "scale(1)" : "scale(0.7)",
                      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                      zIndex: 5
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "3", strokeLinecap: "round", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                    ] })
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "div",
                {
                  onClick: () => {
                    if (item.url)
                      window.location.href = item.url;
                    else if (item.handle)
                      window.location.href = `/products/${item.handle}`;
                  },
                  style: {
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#111827",
                    lineHeight: "1.3",
                    marginBottom: "3px",
                    letterSpacing: "-0.01em",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    cursor: "pointer"
                  },
                  children: item.title
                }
              ),
              item.variant_title && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: {
                display: "inline-block",
                fontSize: "10px",
                fontWeight: "600",
                color: "#6b7280",
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
                padding: "1px 7px",
                borderRadius: "6px",
                letterSpacing: "0.02em",
                marginBottom: "6px"
              }, children: item.variant_title })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }, children: [
                prices.hasItemDiscount && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { textDecoration: "line-through", color: "#d1d5db", fontSize: "12px" }, children: formatMoney(prices.originalLinePrice) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: {
                  fontWeight: "800",
                  fontSize: "15px",
                  color: prices.hasItemDiscount ? "#d97706" : "#111827",
                  letterSpacing: "-0.02em"
                }, children: formatMoney(prices.itemSubtotal) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: {
                display: "flex",
                alignItems: "center",
                background: "#f9fafb",
                border: "1.5px solid #e5e7eb",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
              }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "button",
                  {
                    onClick: () => handleQtyChange(currentQuantity - 1),
                    disabled: isDisabled || currentQuantity <= 1,
                    style: {
                      width: "30px",
                      height: "30px",
                      border: "none",
                      background: "transparent",
                      color: isDisabled || currentQuantity <= 1 ? "#d1d5db" : "#374151",
                      cursor: isDisabled || currentQuantity <= 1 ? "not-allowed" : "pointer",
                      fontSize: "17px",
                      fontWeight: "400",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.15s ease, color 0.15s ease"
                    },
                    onMouseEnter: (e) => {
                      if (!isDisabled && currentQuantity > 1)
                        e.currentTarget.style.background = "#f0f0f5";
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.background = "transparent";
                    },
                    children: "\u2212"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "input",
                  {
                    type: "text",
                    inputMode: "numeric",
                    value: inputValue,
                    onChange: handleInputChange,
                    onBlur: handleBlur,
                    onFocus: handleFocus,
                    onKeyDown: handleKeyDown,
                    disabled: isDisabled,
                    style: {
                      width: "30px",
                      textAlign: "center",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#111827",
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      cursor: isDisabled ? "not-allowed" : "text",
                      animation: qtyBump ? "sd-qty-bump 0.25s ease" : void 0
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "button",
                  {
                    onClick: () => handleQtyChange(currentQuantity + 1),
                    disabled: isDisabled,
                    style: {
                      width: "30px",
                      height: "30px",
                      border: "none",
                      background: "transparent",
                      color: isDisabled ? "#d1d5db" : "#374151",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      fontSize: "17px",
                      fontWeight: "400",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.15s ease, color 0.15s ease"
                    },
                    onMouseEnter: (e) => {
                      if (!isDisabled)
                        e.currentTarget.style.background = "#f0f0f5";
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.background = "transparent";
                    },
                    children: "+"
                  }
                )
              ] })
            ] }),
            error && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: {
              fontSize: "11px",
              color: "#dc2626",
              fontWeight: "500",
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "#dc2626", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "12", cy: "12", r: "10" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: "12", y1: "8", x2: "12", y2: "12", stroke: "white", strokeWidth: "2" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: "12", y1: "16", x2: "12.01", y2: "16", stroke: "white", strokeWidth: "2" })
              ] }),
              error
            ] })
          ] })
        ]
      }
    );
  };
  var CartItems = ({
    items,
    productCompareAtPrices,
    pendingOperations,
    onUpdateQuantity = () => {
    },
    onRemoveItem = () => {
    },
    isPreview = false
  }) => {
    const formatMoney = (cents) => {
      var _a2;
      if (typeof cents !== "number")
        return "";
      const amount = cents / 100;
      const currencyConfig = typeof window !== "undefined" ? (_a2 = window.selldrawer_config) == null ? void 0 : _a2.currency : null;
      const isoCode = (currencyConfig == null ? void 0 : currencyConfig.isoCode) || (currencyConfig == null ? void 0 : currencyConfig.code) || "USD";
      try {
        return new Intl.NumberFormat(void 0, {
          style: "currency",
          currency: isoCode,
          minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2
        }).format(amount);
      } catch (e) {
        const symbol = (currencyConfig == null ? void 0 : currencyConfig.symbol) || "$";
        return `${symbol}${amount.toFixed(2)}`;
      }
    };
    const calculateItemPrices = (item, currentQty = item.quantity) => {
      const itemPrice = item.final_price || item.price || 0;
      const linePrice = itemPrice * currentQty;
      let originalLinePrice = null;
      if (item.original_line_price && item.original_line_price > itemPrice * item.quantity) {
        const singleOriginalPrice = item.original_line_price / item.quantity;
        originalLinePrice = singleOriginalPrice * currentQty;
      }
      if (!originalLinePrice) {
        const compareAtPrice = productCompareAtPrices[item.variant_id];
        if (compareAtPrice && compareAtPrice > itemPrice) {
          originalLinePrice = compareAtPrice * currentQty;
        }
      }
      if (!originalLinePrice && item.original_price) {
        const originalItemPrice = item.original_price;
        if (originalItemPrice > itemPrice) {
          originalLinePrice = originalItemPrice * currentQty;
        }
      }
      if (!originalLinePrice || originalLinePrice <= linePrice) {
        originalLinePrice = linePrice;
      }
      const hasItemDiscount = originalLinePrice > linePrice;
      const itemDiscountPercent = hasItemDiscount && originalLinePrice > 0 ? Math.round((originalLinePrice - linePrice) / originalLinePrice * 100) : 0;
      const itemSubtotal = linePrice;
      return { originalLinePrice, itemSubtotal, hasItemDiscount, itemDiscountPercent };
    };
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: CART_ITEM_KEYFRAMES }),
      items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        CartItemRow,
        {
          item,
          productCompareAtPrices,
          isPending: pendingOperations == null ? void 0 : pendingOperations.has(item.key),
          onUpdateQuantity,
          onRemoveItem,
          isPreview,
          formatMoney,
          calculateItemPrices
        },
        item.key
      ))
    ] });
  };

  // app/components/shared/ProductRecommendations.tsx
  var import_react4 = __toESM(require_react(), 1);
  var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
  var RECO_KEYFRAMES = `
  @keyframes sd-reco-fade-up {
    0% { opacity: 0; transform: translateY(12px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes sd-reco-image-zoom {
    0% { transform: scale(1); }
    100% { transform: scale(1.06); }
  }
  @keyframes sd-reco-success-pop {
    0% { transform: scale(1); }
    50% { transform: scale(0.92); }
    100% { transform: scale(1); }
  }
  @keyframes sd-reco-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes sd-bottom-sheet-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes sd-backdrop-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes sd-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes sd-check-draw {
    from { stroke-dashoffset: 20; }
    to { stroke-dashoffset: 0; }
  }
`;
  var ProductRecommendations = ({
    title = "You may also like",
    products = [],
    layout = "carousel",
    maxProducts = 4,
    showDiscount = true,
    showDiscountBadge = true,
    showAddButton = true,
    onAddToCart,
    onImpression,
    onProductClick,
    isPreview = false,
    initialProductsShow = 6,
    seeAllLink = "/collections/all"
  }) => {
    var _a2, _b;
    const [canScrollLeft, setCanScrollLeft] = (0, import_react4.useState)(false);
    const [canScrollRight, setCanScrollRight] = (0, import_react4.useState)(false);
    const [containerHovered, setContainerHovered] = (0, import_react4.useState)(false);
    const [addingIds, setAddingIds] = (0, import_react4.useState)(/* @__PURE__ */ new Set());
    const [addedIds, setAddedIds] = (0, import_react4.useState)(/* @__PURE__ */ new Set());
    const [hoveredId, setHoveredId] = (0, import_react4.useState)(null);
    const [pickerProduct, setPickerProduct] = (0, import_react4.useState)(null);
    const scrollContainerRef = (0, import_react4.useRef)(null);
    const impressionTracked = (0, import_react4.useRef)(false);
    const isGrid = layout === "grid";
    const limit = initialProductsShow || maxProducts || 4;
    const displayLimit = isGrid ? Math.min(products.length, Math.floor(limit / 3) * 3 || 3) : Math.min(products.length, limit);
    const displayProducts = products.slice(0, displayLimit);
    const showSeeAll = products.length > displayLimit;
    const [isDragging, setIsDragging] = (0, import_react4.useState)(false);
    const [startX, setStartX] = (0, import_react4.useState)(0);
    const [scrollLeft, setScrollLeft] = (0, import_react4.useState)(0);
    (0, import_react4.useEffect)(() => {
      if (!impressionTracked.current && onAddToCart && !isPreview && displayProducts.length > 0) {
        if (onImpression)
          onImpression();
        impressionTracked.current = true;
      }
    }, [onImpression, isPreview, displayProducts.length, onAddToCart]);
    const updateScrollState = () => {
      const container = scrollContainerRef.current;
      if (!container || isGrid)
        return;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const currentScroll = container.scrollLeft;
      setCanScrollLeft(currentScroll > 10);
      setCanScrollRight(currentScroll < maxScrollLeft - 10);
    };
    (0, import_react4.useEffect)(() => {
      updateScrollState();
      const container = scrollContainerRef.current;
      if (container && !isGrid) {
        container.addEventListener("scroll", updateScrollState);
        return () => container.removeEventListener("scroll", updateScrollState);
      }
    }, [products.length, isGrid, displayLimit]);
    const handleWheel = (e) => {
      const container = scrollContainerRef.current;
      if (!container || isGrid)
        return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        container.scrollLeft += e.deltaX;
        updateScrollState();
      }
    };
    const handleMouseDown = (e) => {
      if (isGrid || !scrollContainerRef.current)
        return;
      setIsDragging(true);
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
      scrollContainerRef.current.style.scrollSnapType = "none";
      scrollContainerRef.current.style.cursor = "grabbing";
    };
    const handleMouseMove = (e) => {
      if (!isDragging || isGrid || !scrollContainerRef.current)
        return;
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 1.5;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };
    const stopDragging = () => {
      if (isDragging && scrollContainerRef.current) {
        scrollContainerRef.current.style.scrollSnapType = "x mandatory";
        scrollContainerRef.current.style.cursor = "pointer";
      }
      setIsDragging(false);
    };
    const handleScroll = (direction) => {
      const container = scrollContainerRef.current;
      if (!container)
        return;
      const card = container.firstElementChild;
      const scrollAmount = card ? card.offsetWidth + 10 : container.clientWidth * 0.8;
      container.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    };
    const handleAddClick = async (product, stableKey, e) => {
      e.stopPropagation();
      if (isPreview)
        return;
      const hasMultipleVariants = Array.isArray(product.variants) && product.variants.length > 1;
      if (hasMultipleVariants) {
        setPickerProduct({
          id: product.id,
          title: product.title,
          imageUrl: product.imageUrl,
          // price from product is in rupees; convert to cents for picker
          price: Math.round(product.price * 100),
          compareAtPrice: product.compareAtPrice ? Math.round(product.compareAtPrice * 100) : null,
          variants: product.variants,
          options: product.options || []
        });
        return;
      }
      const variantId = product.shopifyVariantId || product.shopifyProductId;
      if (!variantId || !onAddToCart)
        return;
      setAddingIds((prev) => /* @__PURE__ */ new Set([...prev, stableKey]));
      try {
        onAddToCart(variantId);
        await new Promise((r) => setTimeout(r, 600));
        setAddedIds((prev) => /* @__PURE__ */ new Set([...prev, stableKey]));
        setTimeout(() => {
          setAddedIds((prev) => {
            const next = new Set(prev);
            next.delete(stableKey);
            return next;
          });
        }, 1500);
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev);
          next.delete(stableKey);
          return next;
        });
      }
    };
    const handleCardClick = (product) => {
      if (onProductClick) {
        const variantId = product.shopifyVariantId || product.shopifyProductId;
        onProductClick(product.id, variantId);
      }
      if (isPreview)
        return;
      const handle = product.handle || product.shopifyProductId;
      if (handle) {
        const finalHandle = typeof handle === "string" && handle.includes("gid://") ? handle.split("/").pop() : handle;
        window.location.href = `/products/${finalHandle}`;
      }
    };
    const formatMoney = (cents) => {
      var _a3;
      if (typeof cents !== "number")
        return "";
      const amount = cents / 100;
      const currencyConfig = typeof window !== "undefined" ? (_a3 = window.selldrawer_config) == null ? void 0 : _a3.currency : null;
      const isoCode = (currencyConfig == null ? void 0 : currencyConfig.isoCode) || (currencyConfig == null ? void 0 : currencyConfig.code) || "USD";
      try {
        return new Intl.NumberFormat(void 0, {
          style: "currency",
          currency: isoCode,
          minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2
        }).format(amount);
      } catch (e) {
        const symbol = (currencyConfig == null ? void 0 : currencyConfig.symbol) || "$";
        return `${symbol}${amount.toLocaleString()}`;
      }
    };
    if (products.length === 0)
      return null;
    const renderProductCard = (product, idx, isModal = false) => {
      const stableKey = `${product.id}-${idx}`;
      const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((product.compareAtPrice - product.price) / product.compareAtPrice * 100) : 0;
      const isAdding = addingIds.has(stableKey);
      const isAdded = addedIds.has(stableKey);
      const isCardHovered = hoveredId === stableKey;
      const hasMultipleVariants = Array.isArray(product.variants) && product.variants.length > 1;
      const accentColor = "#db2777";
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "div",
        {
          onClick: () => handleCardClick(product),
          onMouseEnter: () => setHoveredId(stableKey),
          onMouseLeave: () => setHoveredId(null),
          style: __spreadProps(__spreadValues({}, isGrid || isModal ? {} : {
            flex: "0 0 calc((100% - 16px) / 3)",
            scrollSnapAlign: "start"
          }), {
            borderRadius: "14px",
            border: "1px solid transparent",
            background: "#ffffff",
            boxShadow: isCardHovered ? "0 12px 24px -8px rgba(0,0,0,0.15), 0 4px 12px -4px rgba(0,0,0,0.08)" : "0 4px 10px -4px rgba(0,0,0,0.05), 0 1px 4px -2px rgba(0,0,0,0.03)",
            transition: "all 0.4s cubic-bezier(0.2, 1, 0.3, 1)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            transform: isCardHovered ? "translateY(-4px)" : "translateY(0)",
            animation: `sd-reco-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.08}s both`,
            position: "relative",
            overflow: "hidden"
          }),
          children: [
            showDiscountBadge && discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: {
              position: "absolute",
              top: "8px",
              left: "8px",
              background: "linear-gradient(135deg, #f472b6, #db2777)",
              color: "white",
              fontSize: "9px",
              fontWeight: "800",
              padding: "3px 8px",
              borderRadius: "100px",
              zIndex: 10,
              boxShadow: "0 4px 10px rgba(219,39,119,0.3)",
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              gap: "2px"
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
                discount,
                "%"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: "7px", opacity: 0.9, textTransform: "uppercase" }, children: "OFF" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: {
              position: "relative",
              aspectRatio: "1 / 1.1",
              background: "#F9FAFB",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }, children: product.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "img",
              {
                src: product.imageUrl,
                alt: product.title,
                style: {
                  width: "90%",
                  height: "90%",
                  objectFit: "contain",
                  display: "block",
                  transition: "transform 0.6s cubic-bezier(0.2, 1, 0.3, 1)",
                  transform: isCardHovered ? "scale(1.1)" : "scale(1)"
                }
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: {
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px"
            }, children: "\u{1F4E6}" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { padding: "8px 10px 10px", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: {
                fontSize: "11px",
                fontWeight: "700",
                color: "#111827",
                lineHeight: "1.3",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "2.6em",
                letterSpacing: "-0.01em"
              }, children: product.title }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "0px" }, children: [
                  showDiscount && product.compareAtPrice && product.compareAtPrice > product.price && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { textDecoration: "line-through", color: "#9CA3AF", fontSize: "9px", fontWeight: "500" }, children: formatMoney(product.compareAtPrice * 100) }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontWeight: "850", fontSize: "13px", color: "#111827", letterSpacing: "-0.02em" }, children: formatMoney(product.price * 100) })
                ] }),
                hasMultipleVariants && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: {
                  fontSize: "8px",
                  color: "#6B7280",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  background: "#F3F4F6",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }, children: "Options" })
              ] }),
              showAddButton && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  onClick: (e) => handleAddClick(product, stableKey, e),
                  style: {
                    width: "100%",
                    padding: "7px 0",
                    marginTop: "6px",
                    background: isAdded ? "#10B981" : isCardHovered ? "#111827" : "#ffffff",
                    color: isAdded ? "#ffffff" : isCardHovered ? "#ffffff" : "#111827",
                    border: isAdded ? "1px solid #10B981" : "1.5px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "800",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: isCardHovered && !isAdded ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                    transform: isAdding ? "scale(0.98)" : "scale(1)"
                  },
                  children: isAdding ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", style: { animation: "sd-spin 0.7s linear infinite" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "12", cy: "12", r: "10", strokeOpacity: "0.3" }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M12 2a10 10 0 0 1 10 10" })
                  ] }) : isAdded ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", style: { strokeDasharray: 20, strokeDashoffset: 20, animation: "sd-check-draw 0.3s forwards" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "20 6 9 17 4 12" }) }),
                    "Added"
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
                    ] }),
                    "Add"
                  ] })
                }
              )
            ] })
          ]
        },
        stableKey
      );
    };
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("style", { children: RECO_KEYFRAMES }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { marginTop: "8px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          padding: "0 6px"
        }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("h4", { style: {
          fontSize: "15px",
          fontWeight: "850",
          color: "#111827",
          margin: 0,
          letterSpacing: "-0.02em",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }, children: [
          title,
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { width: "4px", height: "4px", borderRadius: "50%", background: "#db2777" } })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "div",
          {
            style: { position: "relative", overflow: "hidden" },
            onMouseEnter: () => setContainerHovered(true),
            onMouseLeave: () => setContainerHovered(false),
            children: [
              !isGrid && canScrollLeft && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  onClick: () => handleScroll("left"),
                  style: {
                    position: "absolute",
                    left: "0",
                    top: "50%",
                    transform: `translateY(-50%) ${containerHovered ? "scale(1)" : "scale(0.8)"}`,
                    background: "rgba(255,255,255,0.95)",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                    opacity: containerHovered ? 1 : 0
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.background = "#7c3aed";
                    e.currentTarget.style.borderColor = "#7c3aed";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.95)";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "15 18 9 12 15 6" }) })
                }
              ),
              !isGrid && canScrollRight && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  onClick: () => handleScroll("right"),
                  style: {
                    position: "absolute",
                    right: "0",
                    top: "50%",
                    transform: `translateY(-50%) ${containerHovered ? "scale(1)" : "scale(0.8)"}`,
                    background: "rgba(255,255,255,0.95)",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                    opacity: containerHovered ? 1 : 0
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.background = "#7c3aed";
                    e.currentTarget.style.borderColor = "#7c3aed";
                    e.currentTarget.style.color = "white";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.95)";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.color = "inherit";
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "9 18 15 12 9 6" }) })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "div",
                {
                  ref: scrollContainerRef,
                  onMouseDown: handleMouseDown,
                  onMouseMove: handleMouseMove,
                  onMouseUp: stopDragging,
                  onMouseLeave: stopDragging,
                  onWheel: handleWheel,
                  style: isGrid ? {
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px"
                  } : {
                    display: "flex",
                    gap: "10px",
                    overflowX: "auto",
                    scrollSnapType: isDragging ? "none" : "x mandatory",
                    WebkitOverflowScrolling: "touch",
                    paddingBottom: isGrid ? "0" : "8px",
                    paddingTop: "6px",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    paddingLeft: "6px",
                    paddingRight: "6px",
                    cursor: isDragging ? "grabbing" : "pointer",
                    userSelect: "none"
                  },
                  children: displayProducts.map((product, idx) => renderProductCard(product, idx, false))
                }
              )
            ]
          }
        ),
        showSeeAll && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { marginTop: "0", padding: "0" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "a",
          {
            href: seeAllLink,
            style: {
              width: "100%",
              fontSize: "13px",
              fontWeight: "850",
              color: "#db2777",
              textDecoration: "none",
              cursor: "pointer",
              padding: "1px 0",
              background: "#fdf2f8",
              borderRadius: "0 0 14px 14px",
              // Rounded only at bottom
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.2, 1, 0.3, 1)",
              borderTop: "1px solid rgba(219,39,119,0.1)",
              borderLeft: "1px solid rgba(219,39,119,0.05)",
              borderRight: "1px solid rgba(219,39,119,0.05)",
              borderBottom: "1px solid rgba(219,39,119,0.05)"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = "#db2777";
              e.currentTarget.style.color = "#ffffff";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "#fdf2f8";
              e.currentTarget.style.color = "#db2777";
            },
            children: [
              "See All Items (",
              products.length,
              ")",
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "9 18 15 12 9 6" }) })
            ]
          }
        ) })
      ] }),
      pickerProduct && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        VariantPickerSheet,
        {
          product: pickerProduct,
          onClose: () => setPickerProduct(null),
          onAddToCart: (variantId) => {
            if (onAddToCart)
              onAddToCart(variantId);
            setPickerProduct(null);
          },
          currency: typeof window !== "undefined" && ((_b = (_a2 = window.selldrawer_config) == null ? void 0 : _a2.currency) == null ? void 0 : _b.code) || "USD",
          accentColor: "#7c3aed"
        }
      )
    ] });
  };

  // app/components/shared/SavingsDisplay.tsx
  var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
  var SavingsDisplay = ({
    message,
    amount,
    backgroundColor = "#dcfce7",
    textColor = "#15803d",
    borderColor = "#ffffff"
  }) => {
    if (amount <= 0) {
      return null;
    }
    const formatMoney = (cents) => {
      var _a2, _b, _c, _d, _e, _f;
      const amount2 = cents / 100;
      const isoCode = typeof window !== "undefined" && ((_b = (_a2 = window.selldrawer_config) == null ? void 0 : _a2.currency) == null ? void 0 : _b.isoCode) ? window.selldrawer_config.currency.isoCode : typeof window !== "undefined" && ((_d = (_c = window.selldrawer_config) == null ? void 0 : _c.currency) == null ? void 0 : _d.code) || "USD";
      try {
        return new Intl.NumberFormat(void 0, {
          style: "currency",
          currency: isoCode,
          minimumFractionDigits: amount2 % 1 === 0 ? 0 : 2
        }).format(amount2);
      } catch (e) {
        const symbol = typeof window !== "undefined" && ((_f = (_e = window.selldrawer_config) == null ? void 0 : _e.currency) == null ? void 0 : _f.symbol) || "";
        return `${symbol}${amount2.toLocaleString()}`;
      }
    };
    const formattedMessage = message.replace("{amount}", formatMoney(amount));
    const keyframes = `
    @keyframes sd-savings-badge-in {
      0% { opacity: 0; transform: translateY(8px) scale(0.95); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes sd-savings-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes sd-coin-spin {
      0% { transform: rotateY(0deg); }
      100% { transform: rotateY(360deg); }
    }
  `;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("style", { children: keyframes }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
        "div",
        {
          style: {
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            border: "1.5px solid #86efac",
            borderRadius: "12px",
            padding: "10px 14px",
            boxShadow: "0 4px 16px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
            animation: "sd-savings-badge-in 0.4s cubic-bezier(0.4,0,0.2,1)",
            overflow: "hidden"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "div",
              {
                style: {
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "sd-savings-shimmer 3s linear infinite",
                  borderRadius: "12px",
                  pointerEvents: "none"
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "div",
              {
                style: {
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #34d399, #10b981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                  position: "relative",
                  zIndex: 1
                },
                "aria-hidden": "true",
                children: "\u{1F4B0}"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { flex: 1, minWidth: 0, position: "relative", zIndex: 1 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "div",
              {
                style: {
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#166534",
                  lineHeight: "1.3",
                  letterSpacing: "-0.01em"
                },
                children: formattedMessage
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
              "div",
              {
                style: {
                  flexShrink: 0,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "800",
                  padding: "4px 10px",
                  borderRadius: "100px",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                  position: "relative",
                  zIndex: 1
                },
                children: [
                  formatMoney(amount),
                  " saved"
                ]
              }
            )
          ]
        }
      )
    ] });
  };

  // app/components/shared/FreeShippingMessage.tsx
  var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
  var FreeShippingMessage = ({
    thresholdAmount,
    cartTotal,
    beforeThresholdMessage,
    achievedMessage,
    backgroundColor = "#fef3c7",
    textColor = "#92400e",
    borderColor = "#92400e",
    icon = "\u{1F69A}",
    currency = "USD",
    isPreview = false
  }) => {
    const cartTotalInCurrency = cartTotal / 100;
    const remaining = Math.max(thresholdAmount - cartTotalInCurrency, 0);
    const isAchieved = remaining <= 0;
    const getCurrencySymbol = () => {
      var _a2, _b;
      return typeof window !== "undefined" && ((_b = (_a2 = window.selldrawer_config) == null ? void 0 : _a2.currency) == null ? void 0 : _b.symbol) || "";
    };
    const currencySymbol = getCurrencySymbol();
    const message = isAchieved ? achievedMessage : beforeThresholdMessage.replace("{threshold}", `${currencySymbol}${Math.round(thresholdAmount)}`).replace("{remaining}", `${currencySymbol}${Math.round(remaining)}`);
    const keyframes = `
    @keyframes sd-msg-slide-in {
      0% { opacity: 0; transform: translateX(-12px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    @keyframes sd-pill-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
      50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
    }
    @keyframes sd-icon-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
  `;
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("style", { children: keyframes }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "div",
        {
          style: {
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            background: isAchieved ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: `1.5px solid ${isAchieved ? "#6ee7b7" : "#fcd34d"}`,
            boxShadow: isAchieved ? "0 4px 16px rgba(16,185,129,0.12)" : "0 4px 16px rgba(245,158,11,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 14px",
            animation: "sd-msg-slide-in 0.35s cubic-bezier(0.4,0,0.2,1)"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "div",
              {
                style: {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "4px",
                  background: isAchieved ? "linear-gradient(180deg, #34d399, #10b981)" : "linear-gradient(180deg, #fbbf24, #f59e0b)",
                  borderRadius: "12px 0 0 12px"
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "div",
              {
                style: {
                  fontSize: "22px",
                  lineHeight: 1,
                  flexShrink: 0,
                  paddingLeft: "4px",
                  animation: "sd-icon-bob 2s ease-in-out infinite"
                },
                "aria-hidden": "true",
                children: isAchieved ? "\u{1F389}" : icon
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { flex: 1, minWidth: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "div",
              {
                style: {
                  fontSize: "13px",
                  fontWeight: "600",
                  color: isAchieved ? "#065f46" : "#78350f",
                  lineHeight: "1.4",
                  letterSpacing: "-0.01em"
                },
                children: message
              }
            ) }),
            isAchieved && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "div",
              {
                style: {
                  flexShrink: 0,
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#065f46",
                  background: "#d1fae5",
                  border: "1px solid #6ee7b7",
                  padding: "3px 10px",
                  borderRadius: "100px",
                  animation: "sd-pill-pulse 1.5s ease-in-out infinite",
                  whiteSpace: "nowrap"
                },
                children: "\u2713 Unlocked"
              }
            ),
            !isAchieved && remaining > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
              "div",
              {
                style: {
                  flexShrink: 0,
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#92400e",
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  padding: "3px 10px",
                  borderRadius: "100px",
                  whiteSpace: "nowrap"
                },
                children: [
                  currencySymbol,
                  Math.round(remaining),
                  " left"
                ]
              }
            )
          ]
        }
      )
    ] });
  };

  // app/components/shared/CouponCodeField.tsx
  var import_react5 = __toESM(require_react(), 1);
  var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
  var CheckIcon = ({ size = 16, color = "currentColor" }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("polyline", { points: "20 6 9 17 4 12" }) });
  var ChevronRightIcon = ({ size = 16, color = "currentColor" }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("polyline", { points: "9 18 15 12 9 6" }) });
  var XIcon = ({ size = 16, color = "currentColor" }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
  var TicketIcon = ({ size = 20, color = "currentColor" }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("path", { d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("line", { x1: "13", y1: "5", x2: "13", y2: "19" })
  ] });
  var CouponCodeField = ({
    id,
    placeholder = "Enter coupon code",
    buttonText = "Apply",
    showAllOffers = true,
    showAllOffersButtonText = "View Offers",
    appliedDiscount = null,
    availableDiscounts = [],
    onApplyCoupon = () => {
    },
    onRemoveDiscount = () => {
    },
    onSwitchDiscount = () => {
    },
    isPreview = false,
    cartTotal = 0
  }) => {
    const [couponCode, setCouponCode] = (0, import_react5.useState)("");
    const [isSheetOpen, setIsSheetOpen] = (0, import_react5.useState)(false);
    const [animationClass, setAnimationClass] = (0, import_react5.useState)("");
    const processedDiscounts = availableDiscounts.map((d) => __spreadProps(__spreadValues({}, d), {
      // Mock thresholds if not present
      threshold: d.threshold || (d.code === "FLAT10" ? 5e3 : 0),
      remaining: Math.max(0, (d.threshold || 0) - cartTotal)
    }));
    const validDiscounts = processedDiscounts.filter((d) => d.remaining === 0);
    const invalidDiscounts = processedDiscounts.filter((d) => d.remaining > 0);
    (0, import_react5.useEffect)(() => {
      if (isSheetOpen) {
        setAnimationClass("sd-slide-up");
      } else {
        setAnimationClass("sd-slide-down");
      }
    }, [isSheetOpen]);
    const handleApply = (codeToApply) => {
      const code = codeToApply || couponCode.trim();
      if (code) {
        onApplyCoupon(code);
        if (!isPreview) {
          setCouponCode("");
          setIsSheetOpen(false);
        }
      }
    };
    const handleKeyPress = (e) => {
      if (e.key === "Enter")
        handleApply();
    };
    const TicketCard = ({ discount, isApplied, isLocked }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "div",
      {
        style: {
          position: "relative",
          backgroundColor: isApplied ? "#f0f9ff" : isLocked ? "#f8fafc" : "#ffffff",
          borderRadius: "12px",
          border: `1.5px ${isApplied ? "solid #3b82f6" : isLocked ? "dashed #e2e8f0" : "solid #f1f5f9"}`,
          padding: "16px",
          marginBottom: "12px",
          transition: "all 0.2s ease",
          cursor: isLocked ? "default" : "pointer",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          overflow: "hidden",
          opacity: isLocked ? 0.7 : 1,
          boxShadow: isApplied ? "0 4px 6px -1px rgba(59, 130, 246, 0.1)" : "0 1px 2px rgba(0,0,0,0.05)"
        },
        onClick: () => !isLocked && !isApplied && handleApply(discount.code),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: {
            position: "absolute",
            top: "50%",
            left: "-8px",
            transform: "translateY(-50%)",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            // Match parent sheet background
            boxShadow: "inset -2px 0 2px rgba(0,0,0,0.02)",
            zIndex: 2
          } }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: {
            position: "absolute",
            top: "50%",
            right: "-8px",
            transform: "translateY(-50%)",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            boxShadow: "inset 2px 0 2px rgba(0,0,0,0.02)",
            zIndex: 2
          } }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: {
                padding: "4px 10px",
                backgroundColor: isApplied ? "#3b82f6" : "#fff7ed",
                color: isApplied ? "#ffffff" : "#f97316",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }, children: discount.code }),
              isApplied && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(CheckIcon, { size: 16, color: "#3b82f6" })
            ] }),
            !isLocked && !isApplied && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { style: {
              background: "none",
              border: "none",
              color: "#3b82f6",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer"
            }, children: "Apply" }),
            isApplied && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { fontSize: "12px", fontWeight: 700, color: "#3b82f6" }, children: "APPLIED" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: "13px", color: "#4b5563", fontWeight: 500 }, children: discount.description || `${discount.value}${discount.type === "percentage" ? "%" : ""} off entire order` }),
          isLocked && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { marginTop: "4px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af", marginBottom: "4px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
                "Unlocks at ",
                discount.threshold ? `Rs. ${(discount.threshold / 100).toFixed(2)}` : ""
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: discount.remaining ? `Rs. ${(discount.remaining / 100).toFixed(2)} left` : "" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { width: "100%", height: "4px", backgroundColor: "#f1f5f9", borderRadius: "2px", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: {
              width: `${Math.min(100, cartTotal / (discount.threshold || 1) * 100)}%`,
              height: "100%",
              backgroundColor: "#ffa07a",
              transition: "width 0.5s ease"
            } }) })
          ] })
        ]
      }
    );
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { id, style: { marginBottom: "16px" }, children: [
      !appliedDiscount ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "div",
        {
          onClick: () => setIsSheetOpen(true),
          style: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.borderColor = "#3b82f6";
            e.currentTarget.style.backgroundColor = "#ffffff";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.backgroundColor = "#f8fafc";
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { color: "#64748b" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TicketIcon, {}) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { flex: 1, fontSize: "14px", color: "#64748b", fontWeight: 500 }, children: "Apply Coupon Code" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { color: "#3b82f6", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }, children: [
              showAllOffersButtonText,
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ChevronRightIcon, { size: 14 })
            ] })
          ]
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: {
        backgroundColor: "#eff6ff",
        border: "1.5px solid #bfdbfe",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        animation: "sd-fade-in 0.3s ease"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: {
            width: "24px",
            height: "24px",
            backgroundColor: "#3b82f6",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
          }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(CheckIcon, { size: 14 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: "13px", fontWeight: 800, color: "#1e40af", letterSpacing: "0.5px" }, children: appliedDiscount.code }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: "11px", color: "#60a5fa", fontWeight: 600 }, children: "COUPON APPLIED" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            onClick: onRemoveDiscount,
            style: {
              padding: "6px 12px",
              backgroundColor: "#ffffff",
              color: "#ef4444",
              border: "1px solid #fee2e2",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            },
            children: "Remove"
          }
        )
      ] }),
      isSheetOpen && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "div",
          {
            onClick: () => setIsSheetOpen(false),
            style: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              zIndex: 9998,
              animation: "sd-fade-in 0.3s ease"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "div",
          {
            style: {
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#ffffff",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
              padding: "24px 20px",
              boxShadow: "0 -10px 25px -5px rgba(0,0,0,0.1)",
              animation: "sd-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { style: { margin: 0, fontSize: "18px", fontWeight: 800, color: "#111827" }, children: "Apply Coupon" }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "button",
                  {
                    onClick: () => setIsSheetOpen(false),
                    style: {
                      background: "#f3f4f6",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      cursor: "pointer"
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(XIcon, { size: 18 })
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", gap: "10px", marginBottom: "24px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "input",
                  {
                    type: "text",
                    value: couponCode,
                    onChange: (e) => setCouponCode(e.target.value.toUpperCase()),
                    onKeyPress: handleKeyPress,
                    placeholder,
                    style: {
                      flex: 1,
                      padding: "14px 18px",
                      border: "2.5px solid #f3f4f6",
                      borderRadius: "12px",
                      fontSize: "15px",
                      fontWeight: 600,
                      outline: "none",
                      transition: "border-color 0.2s ease",
                      color: "#111827"
                    },
                    onFocus: (e) => e.target.style.borderColor = "#3b82f6",
                    onBlur: (e) => e.target.style.borderColor = "#f3f4f6"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "button",
                  {
                    onClick: () => handleApply(),
                    disabled: !couponCode.trim(),
                    style: {
                      padding: "0 24px",
                      backgroundColor: !couponCode.trim() ? "#e5e7eb" : "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: !couponCode.trim() ? "not-allowed" : "pointer"
                    },
                    children: buttonText
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { flex: 1, overflowY: "auto", marginBottom: "10px", paddingRight: "4px" }, children: [
                validDiscounts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { marginBottom: "24px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: "12px", fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "1px" }, children: "Available Coupons" }),
                  validDiscounts.map((d) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TicketCard, { discount: d, isApplied: (appliedDiscount == null ? void 0 : appliedDiscount.code) === d.code, isLocked: false }, d.code))
                ] }),
                invalidDiscounts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: "12px", fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "1px" }, children: "Unavailable Coupons" }),
                  invalidDiscounts.map((d) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TicketCard, { discount: d, isApplied: false, isLocked: true }, d.code))
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("style", { dangerouslySetInnerHTML: { __html: `
            @keyframes sd-slide-up {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            @keyframes sd-fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .sd-slide-up { animation: sd-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          ` } })
      ] })
    ] });
  };

  // app/components/shared/CartTotals.tsx
  var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
  var CartTotals = ({
    items,
    totalPrice,
    subtotalPrice,
    totalDiscount = 0,
    config = {},
    isPreview = false,
    freeGiftVariantIds = []
  }) => {
    const {
      showOriginalPrice = true,
      showItemDiscounts = true,
      showSubtotal = true,
      showTaxNotice = true,
      subtotalLabel = "Subtotal",
      totalLabel = "Total",
      taxNoticeText = "Taxes and shipping calculated at checkout",
      originalPriceLabel = "Original Price",
      itemDiscountsLabel = "Item Discounts",
      borderColor = "#e5e7eb",
      backgroundColor = "#ffffff",
      textColor = "#374151",
      totalTextColor = "#111827",
      discountColor = "#f59e0b"
    } = config;
    const formatMoney = (cents) => {
      var _a2, _b, _c, _d, _e, _f;
      const amount = cents / 100;
      const isoCode = typeof window !== "undefined" && ((_b = (_a2 = window.selldrawer_config) == null ? void 0 : _a2.currency) == null ? void 0 : _b.isoCode) ? window.selldrawer_config.currency.isoCode : typeof window !== "undefined" && ((_d = (_c = window.selldrawer_config) == null ? void 0 : _c.currency) == null ? void 0 : _d.code) || "USD";
      try {
        return new Intl.NumberFormat(void 0, {
          style: "currency",
          currency: isoCode,
          minimumFractionDigits: amount % 1 === 0 ? 0 : 2
        }).format(amount);
      } catch (e) {
        const symbol = typeof window !== "undefined" && ((_f = (_e = window.selldrawer_config) == null ? void 0 : _e.currency) == null ? void 0 : _f.symbol) || "";
        return `${symbol}${amount.toFixed(2)}`;
      }
    };
    const originalTotal = items.reduce((sum, item) => {
      if (item.original_line_price) {
        return sum + item.original_line_price;
      }
      return sum + (item.original_price || item.price || 0) * item.quantity;
    }, 0);
    const sumOfItems = items.reduce((sum, item) => {
      return sum + (item.line_price || (item.final_price || item.price || 0) * item.quantity);
    }, 0);
    const subtotal = subtotalPrice || sumOfItems;
    const itemLevelSavings = originalTotal - subtotal;
    const totalSavings = itemLevelSavings;
    const finalTotal = sumOfItems;
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
      "div",
      {
        className: "selldrawer-totals-container",
        style: {
          borderTop: `2px solid ${borderColor}`,
          padding: "16px",
          margin: "12px -20px 0 -20px",
          // Pull to edges of drawer
          backgroundColor,
          boxShadow: "0 -4px 10px rgba(0,0,0,0.02)",
          position: "sticky",
          bottom: 0,
          zIndex: 10
        },
        children: [
          showOriginalPrice && totalSavings > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: {
            fontSize: "15px",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            color: textColor
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: originalPriceLabel }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { textDecoration: "line-through" }, children: formatMoney(originalTotal) })
          ] }),
          showItemDiscounts && itemLevelSavings > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: {
            fontSize: "14px",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            color: discountColor
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: itemDiscountsLabel }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: {
                background: "#fef3c7",
                color: "#92400e",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: "600"
              }, children: "SALE" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { style: { fontWeight: "600" }, children: [
              "-",
              formatMoney(itemLevelSavings)
            ] })
          ] }),
          showSubtotal && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: {
            fontSize: "16px",
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            fontWeight: itemLevelSavings > 0 ? "600" : "normal"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { color: textColor }, children: subtotalLabel }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { color: totalTextColor }, children: formatMoney(subtotal) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: {
            fontSize: "20px",
            fontWeight: "700",
            paddingTop: "12px",
            display: "flex",
            justifyContent: "space-between",
            color: totalTextColor
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: totalLabel }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { color: totalSavings > 0 ? "#059669" : totalTextColor }, children: formatMoney(finalTotal) })
          ] }),
          showTaxNotice && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: {
            fontSize: "12px",
            color: "#6b7280",
            marginTop: "8px",
            textAlign: "right"
          }, children: taxNoticeText })
        ]
      }
    );
  };

  // app/components/shared/MilestonesWidget.tsx
  var import_react6 = __toESM(require_react(), 1);
  var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
  var getDefaultIcon = (rewardType) => {
    switch (rewardType) {
      case "free_shipping":
        return "\u{1F69A}";
      case "discount_percentage":
        return "\u{1F3F7}\uFE0F";
      case "discount_fixed":
        return "\u{1F4B0}";
      case "gift_wrapping":
        return "\u{1F381}";
      default:
        return "\u{1F381}";
    }
  };
  var fmt = (cents, currencyCode = "USD") => {
    var _a2, _b, _c, _d;
    const amount = cents / 100;
    const isoCode = typeof window !== "undefined" && ((_b = (_a2 = window.selldrawer_config) == null ? void 0 : _a2.currency) == null ? void 0 : _b.isoCode) ? window.selldrawer_config.currency.isoCode : currencyCode;
    try {
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: isoCode,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2
      }).format(amount);
    } catch (e) {
      const symbol = typeof window !== "undefined" && ((_d = (_c = window.selldrawer_config) == null ? void 0 : _c.currency) == null ? void 0 : _d.symbol) || "";
      return `${symbol}${amount.toLocaleString()}`;
    }
  };
  var calcProgress = (total, sorted) => {
    if (!sorted.length)
      return 0;
    const n = sorted.length;
    const segmentWidth = 100 / (n + 1);
    let prevAmount = 0;
    for (let i = 0; i < n; i++) {
      const milestone = sorted[i];
      if (total <= milestone.targetAmount) {
        const rangeProgress = (total - prevAmount) / (milestone.targetAmount - prevAmount);
        return i * segmentWidth + rangeProgress * segmentWidth;
      }
      prevAmount = milestone.targetAmount;
    }
    const lastTarget = sorted[n - 1].targetAmount;
    const ratio = Math.min(1, (total - lastTarget) / (lastTarget * 0.1 || 1e3));
    return n * segmentWidth + ratio * segmentWidth;
  };
  function MilestonesWidget({
    milestones,
    cartTotal,
    progressBarColor = "#1c1c3b",
    backgroundColor = "#ffffff",
    allUnlockedMessage = "\u{1F389} Congratulations! All rewards unlocked!",
    currency = "USD",
    onAddToCart
  }) {
    var _a2, _b, _c;
    if (!milestones || milestones.length === 0)
      return null;
    const sorted = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
    const allUnlocked = sorted.every((m) => Math.round(cartTotal) >= Math.round(m.targetAmount));
    const fillPct = calcProgress(cartTotal, sorted);
    const nextMilestone = sorted.find((m) => Math.round(cartTotal) < Math.round(m.targetAmount));
    const statusMsg = allUnlocked ? allUnlockedMessage : (_a2 = nextMilestone == null ? void 0 : nextMilestone.message) != null ? _a2 : null;
    const n = sorted.length;
    const segmentWidth = 100 / (n + 1);
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: {
      width: "100%",
      boxSizing: "border-box",
      fontFamily: "inherit",
      backgroundColor: backgroundColor || "#ffffff",
      padding: backgroundColor && backgroundColor !== "transparent" ? "20px" : "0",
      borderRadius: backgroundColor && backgroundColor !== "transparent" ? "16px" : "0",
      border: backgroundColor && backgroundColor !== "transparent" ? "1px solid rgba(0,0,0,0.08)" : "none",
      boxShadow: backgroundColor && backgroundColor !== "transparent" ? "0 4px 20px rgba(0,0,0,0.05)" : "none"
    }, children: [
      statusMsg && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: {
        textAlign: "center",
        fontSize: "13px",
        fontWeight: 600,
        color: "#1e1b4b",
        margin: "0 0 10px",
        lineHeight: 1.5,
        padding: "0 4px",
        display: "block"
      }, children: statusMsg }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { position: "relative", width: "100%", height: "85px", boxSizing: "border-box" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: {
          position: "absolute",
          top: "38px",
          left: "0",
          right: "0",
          height: "5px",
          backgroundColor: "#e2e8f0",
          borderRadius: "3px",
          zIndex: 0,
          display: "block"
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "div",
          {
            "data-fill-pct": fillPct.toFixed(2),
            style: {
              position: "absolute",
              top: "38px",
              left: "0",
              width: `${fillPct}%`,
              height: "5px",
              background: `linear-gradient(90deg, ${progressBarColor}, ${progressBarColor}cc)`,
              borderRadius: "3px",
              zIndex: 1,
              transition: "width 0.6s ease",
              display: "block"
            }
          }
        ),
        sorted.map((m, i) => {
          const isUnlocked = Math.round(cartTotal) >= Math.round(m.targetAmount);
          const pos = (i + 1) * segmentWidth;
          return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
            "div",
            {
              style: {
                position: "absolute",
                left: `${pos}%`,
                top: 0,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                width: "80px",
                // fixed width for labeling
                zIndex: 2
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: {
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#6b7280",
                  lineHeight: "16px",
                  whiteSpace: "nowrap",
                  textAlign: "center"
                }, children: fmt(m.targetAmount, currency) }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: {
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: isUnlocked ? progressBarColor : "#fff",
                  border: `2px solid ${isUnlocked ? progressBarColor : "#cbd5e1"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "17px",
                  flexShrink: 0,
                  boxShadow: isUnlocked ? `0 0 0 3px ${progressBarColor}25, 0 3px 8px rgba(0,0,0,0.15)` : "0 2px 6px rgba(0,0,0,0.07)",
                  transition: "all 0.3s ease",
                  position: "relative"
                }, children: m.icon || getDefaultIcon(m.rewardType) }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: {
                  fontSize: "11px",
                  fontWeight: 600,
                  color: isUnlocked ? progressBarColor : "#6b7280",
                  textAlign: "center",
                  lineHeight: "14px",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 2px"
                }, children: m.title })
              ]
            },
            m.id
          );
        })
      ] }),
      ((_c = (_b = nextMilestone == null ? void 0 : nextMilestone.upsellProducts) == null ? void 0 : _b.length) != null ? _c : 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { marginTop: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        MilestoneUpsellProducts,
        {
          products: nextMilestone.upsellProducts,
          currency,
          onAddToCart
        }
      ) })
    ] });
  }
  function MilestoneUpsellProducts({
    milestones,
    cartTotal = 0,
    products: directProducts,
    currency = "USD",
    onAddToCart
  }) {
    var _a2;
    const scrollRef = (0, import_react6.useRef)(null);
    const [showLeftArrow, setShowLeftArrow] = (0, import_react6.useState)(false);
    const [showRightArrow, setShowRightArrow] = (0, import_react6.useState)(false);
    let products = directProducts != null ? directProducts : [];
    let buttonColor = "#1c1c3b";
    let targetMilestone = null;
    if (!directProducts && milestones) {
      const sorted = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
      targetMilestone = sorted.find((m) => Math.round(cartTotal) < Math.round(m.targetAmount));
      products = (_a2 = targetMilestone == null ? void 0 : targetMilestone.upsellProducts) != null ? _a2 : [];
      buttonColor = (targetMilestone == null ? void 0 : targetMilestone.unlockButtonColor) || buttonColor;
    }
    const updateArrows = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
    (0, import_react6.useEffect)(() => {
      updateArrows();
    }, [products]);
    if (products.length === 0)
      return null;
    const upsellHeader = (targetMilestone == null ? void 0 : targetMilestone.upsellHeaderText) || "Unlock Your Reward";
    const ArrowBtn = ({
      dir,
      visible,
      onClick
    }) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "button",
      {
        onClick,
        "aria-label": dir === "left" ? "Previous" : "Next",
        style: {
          flexShrink: 0,
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          border: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          padding: 0,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          position: "relative",
          zIndex: 10,
          marginLeft: dir === "left" ? "0" : "-16px",
          marginRight: dir === "right" ? "0" : "-16px"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "svg",
          {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "#1e293b",
            strokeWidth: "3",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: dir === "left" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("polyline", { points: "15 18 9 12 15 6" }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("polyline", { points: "9 18 15 12 9 6" })
          }
        )
      }
    );
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "8px", width: "100%", boxSizing: "border-box" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: 0, fontSize: "13px", fontWeight: 700, color: "#1e293b", letterSpacing: "-0.3px" }, children: upsellHeader }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", width: "100%", boxSizing: "border-box", position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ArrowBtn, { dir: "left", visible: showLeftArrow, onClick: () => {
          var _a3;
          return (_a3 = scrollRef.current) == null ? void 0 : _a3.scrollBy({ left: -220, behavior: "smooth" });
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "div",
          {
            ref: scrollRef,
            onScroll: updateArrows,
            style: {
              flex: 1,
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              minWidth: 0,
              padding: "4px 0",
              cursor: "default",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              gap: "10px"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("style", { children: `
            div::-webkit-scrollbar { display: none; }
          ` }),
              products.map((p) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                "div",
                {
                  onClick: () => {
                    if (p.handle)
                      window.location.href = `/products/${p.handle}`;
                  },
                  style: {
                    minWidth: "220px",
                    width: "220px",
                    flexShrink: 0,
                    border: "1px solid rgba(0,0,0,0.05)",
                    borderRadius: "14px",
                    padding: "10px",
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
                    boxSizing: "border-box",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer"
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.06)";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.04)";
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: {
                      width: "60px",
                      height: "60px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      flexShrink: 0,
                      backgroundColor: "#f8fafc",
                      border: "1px solid rgba(0,0,0,0.04)"
                    }, children: p.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("img", { src: p.imageUrl, alt: p.title, style: { width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" } }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }, children: "\u{1F6CD}\uFE0F" }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: {
                        margin: "0",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#0f172a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        lineHeight: "1.3",
                        letterSpacing: "-0.2px"
                      }, children: p.title }),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { style: { margin: "0", fontSize: "13px", color: "#1e293b", fontWeight: 800 }, children: [
                          currency,
                          (p.price / 100).toLocaleString()
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "button",
                          {
                            onClick: (e) => {
                              e.stopPropagation();
                              onAddToCart == null ? void 0 : onAddToCart(p);
                            },
                            style: {
                              padding: "5px 12px",
                              backgroundColor: buttonColor,
                              color: "#fff",
                              border: "none",
                              borderRadius: "100px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              boxShadow: `0 3px 6px ${buttonColor}30`
                            },
                            onMouseOver: (e) => e.currentTarget.style.transform = "scale(1.05)",
                            onMouseOut: (e) => e.currentTarget.style.transform = "scale(1)",
                            children: "Add"
                          }
                        )
                      ] })
                    ] })
                  ]
                },
                p.id
              ))
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ArrowBtn, { dir: "right", visible: showRightArrow, onClick: () => {
          var _a3;
          return (_a3 = scrollRef.current) == null ? void 0 : _a3.scrollBy({ left: 220, behavior: "smooth" });
        } })
      ] })
    ] });
  }

  // app/components/shared/PromotionalBannerCard.tsx
  var import_react7 = __toESM(require_react(), 1);
  var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
  var PROMO_KEYFRAMES = `
  @keyframes sd-promo-fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes sd-promo-slide-up {
    0% { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes sd-promo-dot-expand {
    0% { width: 6px; }
    100% { width: 20px; }
  }
  @keyframes sd-promo-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes sd-promo-cta-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.2); }
    50% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
  }
`;
  var getYouTubeEmbedUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    if (!videoId)
      return null;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&origin=${encodeURIComponent(origin)}&playsinline=1&widget_referrer=${encodeURIComponent(origin)}`;
  };
  var getVimeoEmbedUrl = (url) => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    const videoId = match ? match[1] : null;
    return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1` : null;
  };
  var PromotionalBannerCard = ({
    slides,
    carouselSettings = {},
    onCtaClick,
    onImpression,
    isPreview = false,
    context = "cart-drawer",
    maxHeight = "180px",
    titleColor = "#111827",
    descriptionColor = "#6b7280",
    ctaTextColor = "#374151",
    ctaBackgroundColor = "#f3f4f6",
    borderColor = "#e5e7eb"
  }) => {
    const [currentIndex, setCurrentIndex] = (0, import_react7.useState)(0);
    const [canScrollLeft, setCanScrollLeft] = (0, import_react7.useState)(false);
    const [canScrollRight, setCanScrollRight] = (0, import_react7.useState)(false);
    const [containerHovered, setContainerHovered] = (0, import_react7.useState)(false);
    const scrollContainerRef = (0, import_react7.useRef)(null);
    const isScrolling = (0, import_react7.useRef)(false);
    const currentIndexRef = (0, import_react7.useRef)(0);
    const impressionTracked = (0, import_react7.useRef)(false);
    const [isMuted, setIsMuted] = (0, import_react7.useState)(
      () => slides.reduce((acc, _, idx) => __spreadProps(__spreadValues({}, acc), { [idx]: true }), {})
    );
    const videoRefs = (0, import_react7.useRef)({});
    const isBlockContext = context === "block";
    (0, import_react7.useEffect)(() => {
      if (!impressionTracked.current && onImpression && !isPreview && slides.length > 0) {
        onImpression();
        impressionTracked.current = true;
      }
    }, [onImpression, isPreview, slides.length]);
    const updateScrollState = () => {
      const container = scrollContainerRef.current;
      if (!container || slides.length <= 1)
        return;
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < maxScrollLeft - 10);
      const gap = isBlockContext ? 16 : 8;
      const slideWidth = container.clientWidth + gap;
      const index = Math.round(scrollLeft / slideWidth);
      const newIndex = Math.min(index, slides.length - 1);
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
    };
    (0, import_react7.useEffect)(() => {
      currentIndexRef.current = currentIndex;
    }, [currentIndex]);
    (0, import_react7.useEffect)(() => {
      updateScrollState();
      const container = scrollContainerRef.current;
      if (container && slides.length > 1) {
        container.addEventListener("scroll", updateScrollState);
        window.addEventListener("resize", updateScrollState);
        return () => {
          container.removeEventListener("scroll", updateScrollState);
          window.removeEventListener("resize", updateScrollState);
        };
      }
    }, [slides]);
    (0, import_react7.useEffect)(() => {
      if (!slides || slides.length <= 1 || !carouselSettings || carouselSettings.autoRotate === false)
        return;
      const interval = setInterval(() => {
        if (isScrolling.current)
          return;
        const container = scrollContainerRef.current;
        if (!container)
          return;
        isScrolling.current = true;
        const gap = isBlockContext ? 16 : 8;
        const slideWidth = container.clientWidth + gap;
        const currentIdx = currentIndexRef.current;
        const nextIndex = currentIdx < slides.length - 1 ? currentIdx + 1 : 0;
        const targetScroll = nextIndex * slideWidth;
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        container.scrollTo({ left: targetScroll, behavior: "smooth" });
        setTimeout(() => {
          isScrolling.current = false;
        }, 500);
      }, (carouselSettings == null ? void 0 : carouselSettings.rotationSpeed) || 5e3);
      return () => clearInterval(interval);
    }, [slides.length, carouselSettings == null ? void 0 : carouselSettings.autoRotate, carouselSettings == null ? void 0 : carouselSettings.rotationSpeed, isBlockContext]);
    (0, import_react7.useEffect)(() => {
      if (!slides || slides.length <= 1)
        return;
      slides.forEach((slide, index) => {
        var _a2, _b, _c, _d, _e, _f, _g, _h;
        const videoElement = videoRefs.current[index];
        if (!videoElement || !slide.videoUrl)
          return;
        if (index === currentIndex) {
          if (slide.videoType === "mp4" && videoElement instanceof HTMLVideoElement) {
            videoElement.muted = isMuted[index];
            videoElement.play().catch((err) => {
              console.error("[PromotionalBanner] MP4 play error:", err);
            });
          } else if (slide.videoType === "youtube" && videoElement instanceof HTMLIFrameElement) {
            try {
              (_a2 = videoElement.contentWindow) == null ? void 0 : _a2.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
              const muteCommand = isMuted[index] ? "mute" : "unMute";
              (_b = videoElement.contentWindow) == null ? void 0 : _b.postMessage(JSON.stringify({ event: "command", func: muteCommand, args: [] }), "*");
            } catch (error) {
              console.error("[PromotionalBanner] YouTube play/mute error:", error);
            }
          } else if (slide.videoType === "vimeo" && videoElement instanceof HTMLIFrameElement) {
            try {
              (_c = videoElement.contentWindow) == null ? void 0 : _c.postMessage(JSON.stringify({ method: "play" }), "*");
              const volume = isMuted[index] ? 0 : 1;
              (_d = videoElement.contentWindow) == null ? void 0 : _d.postMessage(JSON.stringify({ method: "setVolume", value: volume }), "*");
            } catch (error) {
              console.error("[PromotionalBanner] Vimeo play/mute error:", error);
            }
          }
        } else {
          if (slide.videoType === "mp4" && videoElement instanceof HTMLVideoElement) {
            videoElement.pause();
            videoElement.muted = true;
          } else if (slide.videoType === "youtube" && videoElement instanceof HTMLIFrameElement) {
            try {
              (_e = videoElement.contentWindow) == null ? void 0 : _e.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
              (_f = videoElement.contentWindow) == null ? void 0 : _f.postMessage(JSON.stringify({ event: "command", func: "mute", args: [] }), "*");
            } catch (error) {
              console.error("[PromotionalBanner] YouTube pause/mute error:", error);
            }
          } else if (slide.videoType === "vimeo" && videoElement instanceof HTMLIFrameElement) {
            try {
              (_g = videoElement.contentWindow) == null ? void 0 : _g.postMessage(JSON.stringify({ method: "pause" }), "*");
              (_h = videoElement.contentWindow) == null ? void 0 : _h.postMessage(JSON.stringify({ method: "setVolume", value: 0 }), "*");
            } catch (error) {
              console.error("[PromotionalBanner] Vimeo pause/mute error:", error);
            }
          }
        }
      });
    }, [currentIndex, slides, isMuted]);
    const normalizeImageUrl = (url) => {
      if (!url || typeof url !== "string" || url.trim() === "")
        return null;
      const trimmedUrl = url.trim();
      if (/^https?:\/\//i.test(trimmedUrl))
        return trimmedUrl;
      if (trimmedUrl.startsWith("//"))
        return `https:${trimmedUrl}`;
      if (trimmedUrl.startsWith("/")) {
        console.warn("[PromotionalBanner] Invalid relative image URL:", trimmedUrl);
        return null;
      }
      console.warn("[PromotionalBanner] Potentially invalid image URL:", trimmedUrl);
      return null;
    };
    const handleMuteToggle = (0, import_react7.useCallback)((slideIndex, e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setIsMuted((prev) => {
        var _a2, _b;
        const newMuted = !prev[slideIndex];
        const videoElement = videoRefs.current[slideIndex];
        if (!videoElement)
          return prev;
        const slide = slides[slideIndex];
        if ((slide == null ? void 0 : slide.videoType) === "mp4" && videoElement instanceof HTMLVideoElement) {
          videoElement.muted = newMuted;
        } else if ((slide == null ? void 0 : slide.videoType) === "youtube" && videoElement instanceof HTMLIFrameElement) {
          try {
            const command = newMuted ? "mute" : "unMute";
            (_a2 = videoElement.contentWindow) == null ? void 0 : _a2.postMessage(JSON.stringify({ event: "command", func: command, args: [] }), "*");
          } catch (error) {
            console.error("[PromotionalBanner] YouTube mute control error:", error);
          }
        } else if ((slide == null ? void 0 : slide.videoType) === "vimeo" && videoElement instanceof HTMLIFrameElement) {
          try {
            const value = newMuted ? 0 : 1;
            (_b = videoElement.contentWindow) == null ? void 0 : _b.postMessage(JSON.stringify({ method: "setVolume", value }), "*");
          } catch (error) {
            console.error("[PromotionalBanner] Vimeo mute control error:", error);
          }
        }
        return __spreadProps(__spreadValues({}, prev), { [slideIndex]: newMuted });
      });
    }, [slides]);
    const renderMedia = (slide, slideIndex) => {
      if (slide.videoUrl && slide.videoType) {
        if (slide.videoType === "youtube") {
          const embedUrl = getYouTubeEmbedUrl(slide.videoUrl);
          if (embedUrl) {
            return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: { width: "100%", height: "100%", position: "relative" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "iframe",
                {
                  ref: (el) => {
                    videoRefs.current[slideIndex] = el;
                  },
                  src: embedUrl,
                  style: { position: "absolute", top: "-60px", left: "0", width: "100%", height: "calc(100% + 120px)", border: "none", pointerEvents: "none" },
                  allow: "autoplay; encrypted-media",
                  allowFullScreen: true
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: { position: "absolute", bottom: "0", left: "0", width: "100%", height: "80px", background: "transparent", pointerEvents: "auto", zIndex: 10 } })
            ] });
          }
        } else if (slide.videoType === "vimeo") {
          const embedUrl = getVimeoEmbedUrl(slide.videoUrl);
          if (embedUrl) {
            return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              "iframe",
              {
                ref: (el) => {
                  videoRefs.current[slideIndex] = el;
                },
                src: embedUrl,
                style: { width: "100%", height: "100%", border: "none", objectFit: "cover", pointerEvents: "none" },
                allow: "autoplay; encrypted-media",
                allowFullScreen: true
              }
            );
          }
        } else if (slide.videoType === "mp4") {
          const normalizedVideoUrl = normalizeImageUrl(slide.videoUrl);
          if (normalizedVideoUrl) {
            return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              "video",
              {
                ref: (el) => {
                  videoRefs.current[slideIndex] = el;
                },
                src: normalizedVideoUrl,
                style: { width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" },
                autoPlay: true,
                loop: true,
                muted: true,
                playsInline: true,
                onError: (e) => {
                  e.currentTarget.style.display = "none";
                }
              }
            );
          }
        }
      }
      const normalizedImageUrl = normalizeImageUrl(slide.imageUrl);
      if (normalizedImageUrl) {
        return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "img",
          {
            src: normalizedImageUrl,
            alt: slide.title || "Promotional banner",
            style: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
            onError: (e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = '<div style="width:100%;height:100%;background:linear-gradient(135deg,#f5f3ff,#ede9fe);display:flex;align-items:center;justify-content:center;font-size:48px">\u{1F5BC}\uFE0F</div>';
              }
            }
          }
        );
      }
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: {
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "48px"
      }, children: "\u{1F5BC}\uFE0F" });
    };
    const scrollToIndex = (index) => {
      const container = scrollContainerRef.current;
      if (!container)
        return;
      isScrolling.current = true;
      setCurrentIndex(index);
      currentIndexRef.current = index;
      const gap = isBlockContext ? 16 : 8;
      const slideWidth = container.clientWidth + gap;
      container.scrollTo({ left: index * slideWidth, behavior: "smooth" });
      setTimeout(() => {
        isScrolling.current = false;
      }, 500);
    };
    const handlePrevious = (e) => {
      if (e)
        e.stopPropagation();
      scrollToIndex(currentIndex > 0 ? currentIndex - 1 : slides.length - 1);
    };
    const handleNext = (e) => {
      if (e)
        e.stopPropagation();
      scrollToIndex(currentIndex < slides.length - 1 ? currentIndex + 1 : 0);
    };
    const handleDotClick = (index, e) => {
      if (e)
        e.stopPropagation();
      scrollToIndex(index);
    };
    const handleCtaClick = (slide, e) => {
      if (e)
        e.stopPropagation();
      if (slide.ctaUrl && onCtaClick)
        onCtaClick(slide.ctaUrl);
    };
    const handleBannerClick = (slide) => {
      if (slide.ctaUrl && onCtaClick)
        onCtaClick(slide.ctaUrl);
    };
    if (!slides || slides.length === 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: {
        borderRadius: "16px",
        overflow: "hidden",
        position: "relative",
        border: `1.5px solid ${borderColor}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: { position: "relative", aspectRatio: "16/9", overflow: "hidden", background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "img",
          {
            src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop&crop=center",
            alt: "Sample promotional banner",
            style: { width: "100%", height: "100%", objectFit: "cover" }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" } }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: { fontSize: "16px", fontWeight: "700", color: "white", marginBottom: "3px", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }, children: "Summer Sale" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: { fontSize: "12px", color: "rgba(255,255,255,0.8)" }, children: "Get 20% Off on Summer Items" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { style: {
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            padding: "8px 16px",
            borderRadius: "10px",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap"
          }, children: "Shop Now" })
        ] })
      ] }) });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("style", { children: `
        ${PROMO_KEYFRAMES}
        .sd-promo-scroll::-webkit-scrollbar { display: none; }
        .sd-promo-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        ${isBlockContext ? `
          .sd-promo-block-media { height: ${maxHeight === "auto" ? "auto" : maxHeight}; ${maxHeight === "auto" ? "aspect-ratio: 16/9;" : ""} }
          @media (max-width: 768px) { .sd-promo-block-media { height: ${maxHeight === "auto" ? "auto" : `calc(${maxHeight} * 0.78)`}; ${maxHeight === "auto" ? "aspect-ratio: 16/9;" : ""} } }
          @media (max-width: 480px) { .sd-promo-block-media { height: ${maxHeight === "auto" ? "auto" : `calc(${maxHeight} * 0.67)`}; ${maxHeight === "auto" ? "aspect-ratio: 16/9;" : ""} } }
        ` : ""}
      ` }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: { marginBottom: isBlockContext ? "0" : "4px" }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
        "div",
        {
          style: { position: "relative", overflow: "visible" },
          onMouseEnter: () => setContainerHovered(true),
          onMouseLeave: () => setContainerHovered(false),
          children: [
            slides.length > 1 && canScrollLeft && (carouselSettings == null ? void 0 : carouselSettings.showArrows) !== false && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              "button",
              {
                onClick: (e) => handlePrevious(e),
                style: {
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: `translateY(-50%) scale(${containerHovered ? 1 : 0.85})`,
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 20,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  opacity: containerHovered ? 1 : 0
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.65)";
                  e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.45)";
                  e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("polyline", { points: "15 18 9 12 15 6" }) })
              }
            ),
            slides.length > 1 && canScrollRight && (carouselSettings == null ? void 0 : carouselSettings.showArrows) !== false && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              "button",
              {
                onClick: (e) => handleNext(e),
                style: {
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: `translateY(-50%) scale(${containerHovered ? 1 : 0.85})`,
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 20,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  opacity: containerHovered ? 1 : 0
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.65)";
                  e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.45)";
                  e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("polyline", { points: "9 18 15 12 9 6" }) })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              "div",
              {
                ref: scrollContainerRef,
                className: "sd-promo-scroll",
                style: {
                  display: "flex",
                  gap: isBlockContext ? "16px" : "8px",
                  overflowX: "auto",
                  scrollBehavior: "smooth",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  borderRadius: "16px"
                },
                children: slides.map((slide, index) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                  "div",
                  {
                    onClick: () => handleBannerClick(slide),
                    style: {
                      minWidth: slides.length > 1 ? isBlockContext ? "100%" : "92%" : "100%",
                      maxWidth: slides.length > 1 ? isBlockContext ? "100%" : "92%" : "100%",
                      flexShrink: 0,
                      scrollSnapAlign: "start",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: `1.5px solid ${borderColor}`,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      cursor: slide.ctaUrl ? "pointer" : "default",
                      position: "relative",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      background: "#f4f4f8"
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                      "div",
                      {
                        className: isBlockContext ? "sd-promo-block-media" : "",
                        style: __spreadProps(__spreadValues({
                          position: "relative",
                          overflow: "hidden"
                        }, isBlockContext ? { width: "100%" } : { aspectRatio: "16/9", width: "100%", height: "auto" }), {
                          backgroundColor: "#f4f4f8"
                        }),
                        children: [
                          renderMedia(slide, index),
                          (slide.title || slide.description || slide.ctaText) && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: {
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 45%, transparent 100%)",
                            pointerEvents: "none",
                            zIndex: 2
                          } }),
                          (slide.title || slide.description || slide.ctaText) && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: {
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: isBlockContext ? "16px 18px 14px" : "12px 14px 12px",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            gap: "12px",
                            zIndex: 3,
                            animation: "sd-promo-slide-up 0.4s ease"
                          }, children: [
                            (slide.title || slide.description) && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                              slide.title && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: {
                                fontSize: isBlockContext ? "18px" : "15px",
                                fontWeight: "700",
                                color: "white",
                                lineHeight: "1.25",
                                marginBottom: slide.description ? "4px" : "0",
                                textShadow: "0 1px 6px rgba(0,0,0,0.4)",
                                letterSpacing: "-0.02em",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }, children: slide.title }),
                              slide.description && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: {
                                fontSize: isBlockContext ? "13px" : "12px",
                                color: "rgba(255,255,255,0.85)",
                                lineHeight: "1.35",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }, children: slide.description })
                            ] }),
                            slide.ctaText && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                              "button",
                              {
                                onClick: (e) => handleCtaClick(slide, e),
                                style: {
                                  flexShrink: 0,
                                  background: "rgba(255,255,255,0.15)",
                                  backdropFilter: "blur(8px)",
                                  color: "white",
                                  border: "1px solid rgba(255,255,255,0.3)",
                                  padding: isBlockContext ? "9px 18px" : "7px 14px",
                                  borderRadius: "10px",
                                  fontWeight: "700",
                                  fontSize: isBlockContext ? "13px" : "12px",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  letterSpacing: "0.01em",
                                  transition: "all 0.2s ease",
                                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)"
                                },
                                onMouseEnter: (e) => {
                                  e.currentTarget.style.background = "rgba(255,255,255,0.28)";
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
                                },
                                onMouseLeave: (e) => {
                                  e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.2)";
                                },
                                children: slide.ctaText
                              }
                            )
                          ] }),
                          slide.videoUrl && slide.videoType && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                            "button",
                            {
                              onClick: (e) => handleMuteToggle(index, e),
                              style: {
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                background: "rgba(0,0,0,0.5)",
                                backdropFilter: "blur(4px)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "8px",
                                width: "32px",
                                height: "32px",
                                cursor: "pointer",
                                zIndex: 15,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease"
                              },
                              onMouseEnter: (e) => {
                                e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                                e.currentTarget.style.transform = "scale(1.08)";
                              },
                              onMouseLeave: (e) => {
                                e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                                e.currentTarget.style.transform = "scale(1)";
                              },
                              "aria-label": isMuted[index] ? "Unmute video" : "Mute video",
                              children: isMuted[index] ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "white", style: { display: "block" }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" }) }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "white", style: { display: "block" }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 4.45v.2c0 .38.25.71.6.85C17.18 6.53 19 9.06 19 12s-1.82 5.47-4.4 6.5c-.36.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85C18.6 19.11 21 15.84 21 12s-2.4-7.11-5.79-8.4c-.58-.23-1.21.22-1.21.85z" }) })
                            }
                          ),
                          slides.length > 1 && (carouselSettings == null ? void 0 : carouselSettings.showDots) !== false && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: {
                            position: "absolute",
                            bottom: slide.title || slide.description || slide.ctaText ? "72px" : "10px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            gap: "4px",
                            zIndex: 10
                          }, children: slides.map((_, dotIdx) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                            "div",
                            {
                              onClick: (e) => handleDotClick(dotIdx, e),
                              style: {
                                height: "3px",
                                width: dotIdx === currentIndex ? "20px" : "6px",
                                borderRadius: "3px",
                                background: dotIdx === currentIndex ? "white" : "rgba(255,255,255,0.45)",
                                cursor: "pointer",
                                transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                                boxShadow: dotIdx === currentIndex ? "0 1px 4px rgba(0,0,0,0.3)" : "none"
                              }
                            },
                            `dot-${dotIdx}`
                          )) })
                        ]
                      }
                    )
                  },
                  index
                ))
              }
            )
          ]
        }
      ) })
    ] });
  };

  // app/components/shared/FreeGiftSelector.tsx
  var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
  function FreeGiftSelector({
    freeGifts,
    selectedGiftId,
    onSelectGift,
    isPreview = false
  }) {
    if (!freeGifts || freeGifts.length === 0) {
      return null;
    }
    const freeGift = freeGifts[0];
    if (!freeGift || !freeGift.qualified) {
      return null;
    }
    const { giftProducts, customerLimit, name } = freeGift;
    if (giftProducts.length === 1) {
      return null;
    }
    const hasSelectedGift = giftProducts.some((p) => selectedGiftId === p.id);
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: {
      padding: "12px 14px",
      backgroundColor: "#f0fdf4",
      borderRadius: "8px",
      border: "1px solid #86efac",
      marginBottom: "12px"
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { style: { fontSize: "20px" }, children: "\u{1F381}" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: {
            fontSize: "14px",
            fontWeight: "600",
            color: "#166534",
            marginBottom: "2px"
          }, children: name }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: {
            fontSize: "12px",
            color: "#15803d"
          }, children: hasSelectedGift ? "Gift selected - FREE at checkout!" : `Choose ${customerLimit} free gift${customerLimit > 1 ? "s" : ""}` })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: {
          padding: "6px 12px",
          backgroundColor: "#16a34a",
          color: "#ffffff",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600"
        }, children: "FREE" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: {
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "4px",
        scrollbarWidth: "thin"
      }, children: giftProducts.map((product) => {
        const isSelected = selectedGiftId === product.id;
        return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
          "div",
          {
            onClick: () => {
              if (!isPreview) {
                onSelectGift(product.id, product.shopifyVariantId || product.shopifyProductId);
              }
            },
            style: {
              minWidth: "110px",
              maxWidth: "110px",
              border: isSelected ? "2px solid #16a34a" : "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "8px",
              backgroundColor: "#ffffff",
              cursor: isPreview ? "default" : "pointer",
              transition: "all 0.2s",
              position: "relative",
              boxShadow: isSelected ? "0 2px 8px rgba(22, 101, 52, 0.2)" : "none"
            },
            onMouseEnter: (e) => {
              if (!isPreview) {
                e.currentTarget.style.borderColor = "#16a34a";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }
            },
            onMouseLeave: (e) => {
              if (!isPreview && !isSelected) {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              } else if (isSelected) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(22, 101, 52, 0.2)";
              }
            },
            children: [
              isSelected && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: {
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "bold",
                zIndex: 1,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              }, children: "\u2713" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: {
                width: "100%",
                aspectRatio: "1",
                backgroundColor: "#f9fafb",
                borderRadius: "6px",
                overflow: "hidden",
                marginBottom: "6px"
              }, children: product.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
                "img",
                {
                  src: product.imageUrl,
                  alt: product.title,
                  style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }
                }
              ) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: {
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px"
              }, children: "\u{1F381}" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: {
                fontSize: "11px",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "4px",
                lineHeight: "1.2",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                minHeight: "26px"
              }, children: product.title }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: {
                fontSize: "10px",
                color: "#16a34a",
                fontWeight: "700",
                textAlign: "center"
              }, children: "FREE" })
            ]
          },
          product.id
        );
      }) })
    ] });
  }

  // app/components/shared/TrustBadges.tsx
  var import_jsx_runtime12 = __toESM(require_jsx_runtime(), 1);
  var TrustBadges = ({ config }) => {
    if (!config || config.isActive === false)
      return null;
    const {
      title = "Secure Checkout",
      alignment = "center",
      imageUrls = [],
      paymentIcons = ["visa", "master", "amex", "paypal"],
      socialProofText = ""
    } = config;
    const getPaymentIcon = (type) => {
      switch (type.toLowerCase()) {
        case "visa":
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { width: "32", height: "20", viewBox: "0 0 32 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { width: "32", height: "20", rx: "4", fill: "#1434CB" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M12.92 14.68H10.82L12.13 6.44H14.23L12.92 14.68ZM22.42 6.64C22.06 6.52 21.36 6.3 20.44 6.3C18.3 6.3 16.82 7.42 16.8 9.02C16.78 10.2 17.86 10.86 18.68 11.26C19.52 11.66 19.8 11.92 19.8 12.3C19.8 12.88 19.1 13.14 18.48 13.14C17.44 13.14 16.82 12.86 16.38 12.66L16.08 12.52L15.66 15.08C16.14 15.3 17.14 15.5 18.2 15.5C20.48 15.5 21.94 14.38 21.96 12.72C21.98 11.78 21.36 11.08 19.06 10.02C18.3 9.66 17.86 9.4 17.86 8.94C17.86 8.42 18.44 8.08 19.34 8.08C20.18 8.06 20.76 8.24 21.2 8.44L21.46 8.56L22.42 6.64ZM26.96 14.68H28.84L26.54 6.44H24.84C24.42 6.44 24.1 6.68 23.94 7.06L20.46 14.68H22.62L23.06 13.48H25.7L25.96 14.68ZM23.68 11.76L24.76 8.84L25.38 11.76H23.68ZM10.2 6.44L7.38 12.96L7.08 11.5C6.72 9.8 5.06 8.1 3.22 7.34L3.82 6.44H10.2ZM8.6 14.68H6.54L3.22 10.36V14.68H1.14V6.44H3.22V10.76L6.54 6.44H8.6V14.68Z", fill: "white" })
          ] });
        case "master":
        case "mastercard":
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { width: "32", height: "20", viewBox: "0 0 32 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { width: "32", height: "20", rx: "4", fill: "#202020" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { cx: "12", cy: "10", r: "6", fill: "#EB001B" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { cx: "20", cy: "10", r: "6", fill: "#F79E1B" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M16 14.8988C14.8872 13.9189 14.1818 12.5332 14.1818 10C14.1818 7.46679 14.8872 6.08112 16 5.1012C17.1128 6.08112 17.8182 7.46679 17.8182 10C17.8182 12.5332 17.1128 13.9189 16 14.8988Z", fill: "#FF5F00" })
          ] });
        case "amex":
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { width: "32", height: "20", viewBox: "0 0 32 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { width: "32", height: "20", rx: "4", fill: "#0070CE" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M11.4 13.16L10.6 11.24L9.8 13.16H8.04L10 8.44H11.16L13.12 13.16H11.4ZM8.68 11.72H12.44V10.28H10.6L10.28 9.56L8.68 11.72ZM14.92 13.16V8.44H16.6C17.48 8.44 18.04 8.76 18.36 9.4C18.68 8.76 19.32 8.44 20.2 8.44H21.56V13.16H20.04V9.88C20.04 9.56 19.8 9.4 19.48 9.4C19 9.4 18.6 9.72 18.6 10.36V13.16H17.08V9.88C17.08 9.56 16.84 9.4 16.52 9.4C16.04 9.4 15.64 9.72 15.64 10.36V13.16H14.92ZM22.52 13.16V8.44H26.2V9.4H24.04V10.28H25.88V11.24H24.04V12.2H26.28V13.16H22.52ZM27.08 13.16L28.12 10.84L27.16 8.44H28.76L29.24 9.88L29.72 8.44H31.32L30.36 10.84L31.48 13.16H29.8L29.24 11.88L28.68 13.16H27.08Z", fill: "white" })
          ] });
        case "paypal":
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { width: "32", height: "20", viewBox: "0 0 32 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { width: "32", height: "20", rx: "4", fill: "#00457C" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M22.5188 8.5C22.5188 11.3688 20.1938 13.0688 16.8688 13.0688H15.1188L14.0188 17H11.5188L13.1188 6.5C13.1812 6.3375 13.3438 6.225 13.5188 6.225H17.9188C20.7812 6.225 22.5188 7.31875 22.5188 8.5Z", fill: "#179BD7" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M20.5938 7.375C20.5938 9.1 19.1938 10.9688 16.1438 10.9688H15.1188L13.9188 15V13.0688H15.1188C18.4438 13.0688 20.7688 11.3688 20.7688 8.5C20.7688 8.0875 20.6938 7.7125 20.5938 7.375Z", fill: "#222D65" })
          ] });
        case "apple":
        case "applepay":
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { width: "32", height: "20", viewBox: "0 0 32 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { width: "32", height: "20", rx: "4", fill: "black" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M12.9242 14.542V8.374H15.5322C16.4862 8.374 17.2022 8.626 17.6802 9.13C18.1582 9.634 18.3972 10.282 18.3972 11.074C18.3972 11.878 18.1582 12.532 17.6802 13.036C17.2022 13.528 16.4742 13.774 15.4962 13.774H14.1882V14.542H12.9242ZM14.1882 12.754H15.4242C15.9642 12.754 16.4022 12.598 16.7382 12.286C17.0742 11.962 17.2422 11.542 17.2422 11.026C17.2422 10.51 17.0742 10.096 16.7382 9.784C16.4022 9.472 15.9642 9.316 15.4242 9.316H14.1882V12.754ZM20.803 14.542C20.407 14.542 20.089 14.452 19.849 14.272C19.621 14.092 19.465 13.84 19.381 13.516H19.345L19.237 14.434H18.169V10.15H19.369V11.014H19.405C19.537 10.702 19.741 10.468 20.017 10.312C20.293 10.156 20.617 10.078 20.989 10.078C21.433 10.078 21.787 10.222 22.051 10.51C22.315 10.786 22.447 11.164 22.447 11.644V14.542H21.283V11.896C21.283 11.536 21.199 11.284 21.031 11.14C20.875 10.984 20.653 10.906 20.365 10.906C20.041 10.906 19.789 11.008 19.609 11.212C19.429 11.416 19.339 11.758 19.339 12.238V14.542H20.803ZM25.0744 14.614C24.4624 14.614 24.0064 14.446 23.7064 14.11C23.4184 13.774 23.2744 13.342 23.2744 12.814V10.15H24.4744V12.658C24.4744 13.066 24.5764 13.348 24.7804 13.504C24.9844 13.66 25.2604 13.738 25.6084 13.738C25.8604 13.738 26.0644 13.684 26.2204 13.576C26.3764 13.468 26.5024 13.312 26.5984 13.108L26.7064 14.434C26.5144 14.506 26.2924 14.56 26.0404 14.596C25.7884 14.608 25.4644 14.614 25.0744 14.614ZM26.8322 17.518V10.15H27.9482V10.87H27.9842C28.1642 10.51 28.3802 10.258 28.6322 10.114C28.8962 9.958 29.2082 9.88 29.5682 9.88C30.1322 9.88 30.5642 10.108 30.8642 10.564C31.1762 11.02 31.3322 11.602 31.3322 12.31C31.3322 13.042 31.1762 13.618 30.8642 14.038C30.5522 14.446 30.1082 14.65 29.5322 14.65C29.1362 14.65 28.8122 14.554 28.5602 14.362C28.3082 14.17 28.1162 13.918 27.9842 13.606H27.9482L28.0202 14.65V17.518H26.8322ZM29.1002 13.642C29.4482 13.642 29.7122 13.522 29.8922 13.282C30.0842 13.042 30.1802 12.694 30.1802 12.238C30.1802 11.83 30.0842 11.518 29.8922 11.302C29.7002 11.074 29.4362 10.96 29.1002 10.96C28.7402 10.96 28.4642 11.08 28.2722 11.32C28.0922 11.56 28.0022 11.908 28.0022 12.364C28.0022 12.82 28.0922 13.168 28.2722 13.408C28.4642 13.636 28.7402 13.642 29.1002 13.642Z", fill: "white" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M11.6115 10.4851C11.5995 9.72108 12.2315 9.34908 12.2635 9.32908C11.8955 8.78908 11.3115 8.70508 11.1075 8.68108C10.6195 8.63308 10.1555 8.97308 9.90349 8.97308C9.64749 8.97308 9.27149 8.68508 8.86349 8.68908C8.33149 8.69708 7.84349 8.99708 7.56749 9.47708C7.00349 10.4571 7.42749 11.9131 7.97549 12.7091C8.24349 13.0971 8.55549 13.5291 8.97149 13.5131C9.37549 13.4971 9.53149 13.2531 10.0155 13.2531C10.4955 13.2531 10.6355 13.5131 11.0555 13.5051C11.4875 13.4971 11.7555 13.1131 12.0195 12.7251C12.3275 12.2771 12.4555 11.8331 12.4635 11.8131C12.4555 11.8091 11.6235 11.4931 11.6115 10.4851Z", fill: "white" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M10.8715 8.16913C11.0955 7.89713 11.2515 7.51313 11.2115 7.12513C10.8875 7.13713 10.4795 7.34113 10.2475 7.61313C10.0435 7.85313 9.87149 8.24513 9.91949 8.62513C10.2835 8.65313 10.6555 8.44913 10.8715 8.16913Z", fill: "white" })
          ] });
        case "google":
        case "googlepay":
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { width: "32", height: "20", viewBox: "0 0 32 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { width: "32", height: "20", rx: "4", fill: "white", stroke: "#E5E7EB" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M13.2429 13.784H14.7709V8.408H13.2429V13.784ZM20.7302 13.892C21.4382 13.892 22.0262 13.628 22.4942 13.1C22.9622 12.572 23.1962 11.912 23.1962 11.12C23.1962 10.328 22.9622 9.68 22.4942 9.176C22.0262 8.648 21.4382 8.384 20.7302 8.384C20.0222 8.384 19.4222 8.648 18.9302 9.176C18.4502 9.68 18.2102 10.328 18.2102 11.12C18.2102 11.912 18.4502 12.584 18.9302 13.136C19.4222 13.64 20.0222 13.892 20.7302 13.892ZM20.7302 12.632C20.3582 12.632 20.0582 12.5 19.8302 12.236C19.6142 11.972 19.5062 11.6 19.5062 11.12C19.5062 10.664 19.6142 10.292 19.8302 10.004C20.0582 9.716 20.3582 9.572 20.7302 9.572C21.1022 9.572 21.4022 9.716 21.6302 10.004C21.8702 10.28 21.9902 10.652 21.9902 11.12C21.9902 11.6 21.8702 11.972 21.6302 12.236C21.4022 12.5 21.1022 12.632 20.7302 12.632ZM25.867 16.988C26.527 16.988 27.055 16.796 27.451 16.412C27.859 16.028 28.063 15.524 28.063 14.9V8.408H26.659V9.164H26.623C26.395 8.864 26.119 8.648 25.795 8.516C25.483 8.384 25.135 8.318 24.751 8.318C24.091 8.318 23.539 8.582 23.095 9.11C22.651 9.614 22.429 10.286 22.429 11.126C22.429 11.93 22.651 12.59 23.095 13.106C23.539 13.61 24.091 13.862 24.751 13.862C25.135 13.862 25.483 13.796 25.795 13.664C26.119 13.52 26.395 13.316 26.623 13.052H26.659V13.826C26.659 14.342 26.503 14.75 26.191 15.05C25.891 15.35 25.483 15.5 24.967 15.5C24.475 15.5 24.079 15.368 23.779 15.104C23.479 14.84 23.239 14.492 23.059 14.06L21.799 14.618C22.075 15.266 22.483 15.794 23.023 16.202C23.575 16.598 24.523 16.988 25.867 16.988ZM25.327 12.668C24.955 12.668 24.643 12.542 24.391 12.29C24.151 12.026 24.031 11.666 24.031 11.21C24.031 10.742 24.151 10.382 24.391 10.13C24.643 9.866 24.955 9.734 25.327 9.734C25.699 9.734 25.999 9.878 26.227 10.166C26.467 10.454 26.587 10.826 26.587 11.282V11.39H24.811C24.847 11.75 24.991 12.038 25.243 12.254C25.495 12.47 25.795 12.578 26.143 12.578C26.599 12.578 26.947 12.35 27.187 11.894L28.321 12.398C28.057 12.878 27.685 13.262 27.205 13.55C26.737 13.838 26.197 13.982 25.585 13.982H25.327V12.668Z", fill: "#5F6368" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M8.28315 13.784H10.1551V9.452L8.03115 13.784H8.28315ZM10.2271 8.714L10.5151 9.47L10.0831 8.57C10.0951 8.606 10.1311 8.654 10.2271 8.714ZM8.82315 12.614H8.53515L9.61515 10.418L10.0471 11.33L8.82315 12.614Z", fill: "#4B90E2" })
          ] });
        case "shop":
        case "shoppay":
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { width: "32", height: "20", viewBox: "0 0 32 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { width: "32", height: "20", rx: "4", fill: "#5A31F4" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M12.9242 14.542V8.374H15.5322C16.4862 8.374 17.2022 8.626 17.6802 9.13C18.1582 9.634 18.3972 10.282 18.3972 11.074C18.3972 11.878 18.1582 12.532 17.6802 13.036C17.2022 13.528 16.4742 13.774 15.4962 13.774H14.1882V14.542H12.9242ZM14.1882 12.754H15.4242C15.9642 12.754 16.4022 12.598 16.7382 12.286C17.0742 11.962 17.2422 11.542 17.2422 11.026C17.2422 10.51 17.0742 10.096 16.7382 9.784C16.4022 9.472 15.9642 9.316 15.4242 9.316H14.1882V12.754ZM20.803 14.542C20.407 14.542 20.089 14.452 19.849 14.272C19.621 14.092 19.465 13.84 19.381 13.516H19.345L19.237 14.434H18.169V10.15H19.369V11.014H19.405C19.537 10.702 19.741 10.468 20.017 10.312C20.293 10.156 20.617 10.078 20.989 10.078C21.433 10.078 21.787 10.222 22.051 10.51C22.315 10.786 22.447 11.164 22.447 11.644V14.542H21.283V11.896C21.283 11.536 21.199 11.284 21.031 11.14C20.875 10.984 20.653 10.906 20.365 10.906C20.041 10.906 19.789 11.008 19.609 11.212C19.429 11.416 19.339 11.758 19.339 12.238V14.542H20.803ZM25.0744 14.614C24.4624 14.614 24.0064 14.446 23.7064 14.11C23.4184 13.774 23.2744 13.342 23.2744 12.814V10.15H24.4744V12.658C24.4744 13.066 24.5764 13.348 24.7804 13.504C24.9844 13.66 25.2604 13.738 25.6084 13.738C25.8604 13.738 26.0644 13.684 26.2204 13.576C26.3764 13.468 26.5024 13.312 26.5984 13.108L26.7064 14.434C26.5144 14.506 26.2924 14.56 26.0404 14.596C25.7884 14.608 25.4644 14.614 25.0744 14.614ZM26.8322 17.518V10.15H27.9482V10.87H27.9842C28.1642 10.51 28.3802 10.258 28.6322 10.114C28.8962 9.958 29.2082 9.88 29.5682 9.88C30.1322 9.88 30.5642 10.108 30.8642 10.564C31.1762 11.02 31.3322 11.602 31.3322 12.31C31.3322 13.042 31.1762 13.618 30.8642 14.038C30.5522 14.446 30.1082 14.65 29.5322 14.65C29.1362 14.65 28.8122 14.554 28.5602 14.362C28.3082 14.17 28.1162 13.918 27.9842 13.606H27.9482L28.0202 14.65V17.518H26.8322ZM29.1002 13.642C29.4482 13.642 29.7122 13.522 29.8922 13.282C30.0842 13.042 30.1802 12.694 30.1802 12.238C30.1802 11.83 30.0842 11.518 29.8922 11.302C29.7002 11.074 29.4362 10.96 29.1002 10.96C28.7402 10.96 28.4642 11.08 28.2722 11.32C28.0922 11.56 28.0022 11.908 28.0022 12.364C28.0022 12.82 28.0922 13.168 28.2722 13.408C28.4642 13.636 28.7402 13.642 29.1002 13.642Z", fill: "white" })
          ] });
        default:
          return null;
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: {
      display: "flex",
      flexDirection: "column",
      alignItems: alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center",
      padding: "12px 16px",
      margin: "12px 0 0 0",
      backgroundColor: "#f9fafb",
      borderRadius: "8px",
      border: "1px solid #e5e7eb"
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "8px"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("svg", { width: "14", height: "16", viewBox: "0 0 14 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M7 0L0 3.11111V7.77778C0 11.8844 2.99444 15.7111 7 16C11.0056 15.7111 14 11.8844 14 7.77778V3.11111L7 0ZM7 3.66222L12.4444 6.09778V7.77778C12.4444 11.0133 10.1578 13.9822 7 14.3911C3.84222 13.9822 1.55556 11.0133 1.55556 7.77778V6.09778L7 3.66222ZM6.38556 11.3333L3.5 8.44444L4.60444 7.33333L6.38556 9.10667L10.3556 5.13333L11.4667 6.24444L6.38556 11.3333Z", fill: "#10B981" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { style: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }, children: title })
      ] }),
      socialProofText && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: {
        fontSize: "13px",
        color: "#4b5563",
        marginBottom: "10px",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        gap: "4px"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { style: { color: "#10b981" }, children: "\u25CF" }),
        " ",
        socialProofText
      ] }),
      imageUrls.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: alignment }, children: imageUrls.map((url, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("img", { src: url, alt: "Trust Badge", style: { height: "24px", objectFit: "contain" } }, i)) }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: alignment }, children: paymentIcons.map((icon) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { opacity: 0.85, transition: "opacity 0.2s", cursor: "default" }, onMouseEnter: (e) => e.currentTarget.style.opacity = "1", onMouseLeave: (e) => e.currentTarget.style.opacity = "0.85", children: getPaymentIcon(icon) }, icon)) })
    ] });
  };

  // app/components/shared/CountdownTimer.tsx
  var import_react8 = __toESM(require_react(), 1);
  var import_jsx_runtime13 = __toESM(require_jsx_runtime(), 1);
  var CountdownTimer = ({ config, cartKey }) => {
    if (!config || config.isActive === false)
      return null;
    const {
      durationMinutes = 15,
      messageText = "Your reserves expire in {time}",
      backgroundColor = "#FEF2F2",
      textColor = "#991B1B"
    } = config;
    const [timeLeft, setTimeLeft] = (0, import_react8.useState)(durationMinutes * 60);
    (0, import_react8.useEffect)(() => {
      let initialTime = durationMinutes * 60;
      const storedTime = sessionStorage.getItem("selldrawer_timer");
      const storedTimestamp = sessionStorage.getItem("selldrawer_timer_timestamp");
      if (storedTime && storedTimestamp) {
        const elapsed = Math.floor((Date.now() - parseInt(storedTimestamp, 10)) / 1e3);
        initialTime = Math.max(0, parseInt(storedTime, 10) - elapsed);
      }
      setTimeLeft(initialTime);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - 1);
          sessionStorage.setItem("selldrawer_timer", next.toString());
          sessionStorage.setItem("selldrawer_timer_timestamp", Date.now().toString());
          return next;
        });
      }, 1e3);
      return () => clearInterval(timer);
    }, [durationMinutes, cartKey]);
    if (timeLeft <= 0)
      return null;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    const formattedMessage = messageText.replace("{time}", timeString);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "10px 16px",
      backgroundColor,
      color: textColor,
      borderRadius: "8px",
      marginBottom: "12px",
      fontSize: "13px",
      fontWeight: "600",
      textAlign: "center",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)"
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("svg", { className: "selldrawer-pulse", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("circle", { cx: "12", cy: "12", r: "10" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("polyline", { points: "12 6 12 12 16 14" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: formattedMessage })
    ] });
  };

  // app/components/shared/AcceleratedCheckout.tsx
  var import_react9 = __toESM(require_react(), 1);
  var import_jsx_runtime14 = __toESM(require_jsx_runtime(), 1);
  var AcceleratedCheckout = ({ config }) => {
    const containerRef = (0, import_react9.useRef)(null);
    (0, import_react9.useEffect)(() => {
      if (!config || config.isActive === false)
        return;
      if (containerRef.current) {
        const nativeButtons = document.querySelector(".additional-checkout-buttons");
        if (nativeButtons && nativeButtons.innerHTML.trim() !== "") {
          const cloned = nativeButtons.cloneNode(true);
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(cloned);
        }
      }
    }, [config]);
    if (!config || config.isActive === false)
      return null;
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      "div",
      {
        className: "selldrawer-accelerated-checkout",
        ref: containerRef,
        style: {
          marginTop: "12px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        },
        children: typeof window === "undefined" || !document.querySelector(".additional-checkout-buttons") ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { style: { padding: "10px", background: "#5A31F4", color: "white", textAlign: "center", borderRadius: "4px", fontSize: "14px", fontWeight: "bold" }, children: [
          "Shop ",
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { style: { opacity: 0.8 }, children: "Pay" })
        ] }) : null
      }
    );
  };

  // app/components/shared/OrderNote.tsx
  var import_react10 = __toESM(require_react(), 1);
  var import_jsx_runtime15 = __toESM(require_jsx_runtime(), 1);
  var OrderNote = ({
    initialNote = "",
    placeholder = "Add a note to your order...",
    onSave,
    debounceMs = 1e3
  }) => {
    const [note, setNote] = (0, import_react10.useState)(initialNote);
    const [isExpanded, setIsExpanded] = (0, import_react10.useState)(initialNote.length > 0);
    const timerRef = (0, import_react10.useRef)(null);
    (0, import_react10.useEffect)(() => {
      setNote(initialNote);
    }, [initialNote]);
    const handleChange = (e) => {
      const newVal = e.target.value;
      setNote(newVal);
      if (timerRef.current)
        clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSave(newVal);
      }, debounceMs);
    };
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { style: { marginBottom: "16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
        "button",
        {
          onClick: () => setIsExpanded(!isExpanded),
          style: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#4b5563",
            fontSize: "13px",
            fontWeight: 600,
            padding: 0
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
              "svg",
              {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                style: { transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" },
                children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("polyline", { points: "9 18 15 12 9 6" })
              }
            ),
            isExpanded ? "Hide order note" : "Add order note"
          ]
        }
      ),
      isExpanded && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { style: { marginTop: "8px" }, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "textarea",
        {
          value: note,
          onChange: handleChange,
          placeholder,
          style: {
            width: "100%",
            minHeight: "80px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
            resize: "vertical"
          }
        }
      ) })
    ] });
  };

  // app/components/shared/TermsConditions.tsx
  var import_jsx_runtime16 = __toESM(require_jsx_runtime(), 1);
  var TermsConditions = ({
    isChecked,
    onToggle,
    text = "I agree to the Terms & Conditions"
  }) => {
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
          padding: "8px 12px",
          backgroundColor: "#f9fafb",
          borderRadius: "6px",
          border: "1px solid #e5e7eb",
          fontSize: "13px",
          color: "#374151",
          cursor: "pointer"
        },
        onClick: () => onToggle(!isChecked),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
            "input",
            {
              type: "checkbox",
              checked: isChecked,
              onChange: (e) => onToggle(e.target.checked),
              style: { width: "16px", height: "16px", cursor: "pointer" },
              onClick: (e) => e.stopPropagation()
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { style: { fontWeight: 500 }, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { dangerouslySetInnerHTML: { __html: text } }) })
        ]
      }
    );
  };

  // app/components/shared/DeliveryEstimates.tsx
  var import_jsx_runtime17 = __toESM(require_jsx_runtime(), 1);
  var DeliveryEstimates = ({
    processingDaysMin = 1,
    processingDaysMax = 2,
    transitDaysMin = 3,
    transitDaysMax = 5,
    message = "Estimated delivery: {date}"
  }) => {
    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };
    const calculateRange = () => {
      const today = /* @__PURE__ */ new Date();
      const minArrival = new Date(today);
      minArrival.setDate(today.getDate() + processingDaysMin + transitDaysMin);
      const maxArrival = new Date(today);
      maxArrival.setDate(today.getDate() + processingDaysMax + transitDaysMax);
      if (minArrival.toDateString() === maxArrival.toDateString()) {
        return formatDate(minArrival);
      }
      return `${formatDate(minArrival)} - ${formatDate(maxArrival)}`;
    };
    const range = calculateRange();
    const formattedMessage = message.replace("{date}", range);
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "12px",
      padding: "10px 14px",
      backgroundColor: "#eff6ff",
      borderRadius: "8px",
      border: "1px solid #bfdbfe",
      fontSize: "13px",
      color: "#1e40af",
      fontWeight: 500
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: "1", y: "3", width: "15", height: "13" }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("polygon", { points: "16 8 20 8 23 11 23 16 16 16 16 8" }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("circle", { cx: "5.5", cy: "18.5", r: "2.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("circle", { cx: "18.5", cy: "18.5", r: "2.5" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { children: formattedMessage })
    ] });
  };

  // app/components/shared/ShippingProtection.tsx
  var import_jsx_runtime18 = __toESM(require_jsx_runtime(), 1);
  var ShippingProtection = ({
    isEnabled,
    onToggle,
    price = 0,
    currency = "USD",
    title = "Shipping Protection",
    isPending = false
  }) => {
    const formatPrice = (cents) => {
      var _a2, _b, _c, _d;
      const amount = cents / 100;
      const isoCode = typeof window !== "undefined" && ((_b = (_a2 = window.selldrawer_config) == null ? void 0 : _a2.currency) == null ? void 0 : _b.isoCode) ? window.selldrawer_config.currency.isoCode : currency;
      try {
        return new Intl.NumberFormat(void 0, {
          style: "currency",
          currency: isoCode,
          minimumFractionDigits: amount % 1 === 0 ? 0 : 2
        }).format(amount);
      } catch (e) {
        const symbol = typeof window !== "undefined" && ((_d = (_c = window.selldrawer_config) == null ? void 0 : _c.currency) == null ? void 0 : _d.symbol) || "";
        return `${symbol}${amount.toLocaleString()}`;
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          backgroundColor: isEnabled ? "#f0f7ff" : "#ffffff",
          borderRadius: "16px",
          border: `1px solid ${isEnabled ? "#3b82f6" : "#e2e8f0"}`,
          marginBottom: "16px",
          cursor: isPending ? "wait" : "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: isPending ? 0.7 : 1,
          boxShadow: isEnabled ? "0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)" : "0 1px 3px rgba(0,0,0,0.05)",
          overflow: "hidden"
        },
        onClick: () => !isPending && onToggle(!isEnabled),
        children: [
          isEnabled && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: {
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "100px",
            height: "100px",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
            pointerEvents: "none"
          } }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "16px", zIndex: 1 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: {
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: isEnabled ? "#3b82f6" : "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isEnabled ? "#ffffff" : "#64748b",
              transition: "all 0.3s ease",
              boxShadow: isEnabled ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none",
              position: "relative"
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }) }),
              isEnabled && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: {
                position: "absolute",
                top: "-4px",
                right: "-4px",
                width: "12px",
                height: "12px",
                backgroundColor: "#10b981",
                borderRadius: "50%",
                border: "2px solid #ffffff",
                boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)"
              } })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: {
                fontSize: "15px",
                fontWeight: 700,
                color: isEnabled ? "#1e40af" : "#1e293b",
                transition: "color 0.3s ease"
              }, children: title }),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: "12px", color: isEnabled ? "#60a5fa" : "#64748b", fontWeight: 500 }, children: "Against loss, theft, or damage" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: {
              fontSize: "15px",
              fontWeight: 800,
              color: isEnabled ? "#3b82f6" : "#64748b",
              transition: "color 0.3s ease"
            }, children: price > 0 ? formatPrice(price) : "FREE" }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: {
              width: "42px",
              height: "24px",
              backgroundColor: isEnabled ? "#3b82f6" : "#e2e8f0",
              borderRadius: "12px",
              position: "relative",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: isEnabled ? "inset 0 2px 4px rgba(0,0,0,0.1)" : "none"
            }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: {
              width: "18px",
              height: "18px",
              backgroundColor: "white",
              borderRadius: "50%",
              position: "absolute",
              top: "3px",
              left: isEnabled ? "21px" : "3px",
              transition: "left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
            } }) })
          ] })
        ]
      }
    );
  };

  // extensions/cart-upsell/assets/modules/components/UnifiedCartDrawer.jsx
  var import_jsx_runtime19 = __toESM(require_jsx_runtime(), 1);
  var UnifiedCartDrawer = ({
    config,
    cart,
    appliedDiscount,
    availableDiscounts,
    productCompareAtPrices,
    freeGifts,
    selectedGiftId,
    pendingOperations,
    onClose,
    onCheckout,
    onAddProductToCart,
    onUpdateQuantity,
    onRemoveItem,
    onApplyCoupon,
    onRemoveDiscount,
    onSwitchDiscount,
    onSelectGift,
    onUpdateNote,
    onToggleShippingProtection,
    onImpression,
    onFeatureImpression,
    onFeatureClick
  }) => {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    const [isTermsAccepted, setIsTermsAccepted] = import_react11.default.useState(!(config == null ? void 0 : config.termsConditionsEnabled));
    import_react11.default.useEffect(() => {
      setIsTermsAccepted(!(config == null ? void 0 : config.termsConditionsEnabled));
    }, [config == null ? void 0 : config.termsConditionsEnabled]);
    import_react11.default.useEffect(() => {
      if (onImpression) {
        onImpression();
      }
    }, []);
    const getFeatureOrder = () => {
      const featureOrder = (config == null ? void 0 : config.featureOrder) || [];
      let orderArray = [];
      if (typeof featureOrder === "string") {
        orderArray = featureOrder.split(",").filter(Boolean);
      } else if (Array.isArray(featureOrder)) {
        orderArray = featureOrder;
      }
      const cartItemsIndex = orderArray.findIndex(
        (item) => item === "cart-items" || item === "__cart-items__"
      );
      if (cartItemsIndex === -1) {
        return { beforeItems: orderArray, afterItems: [] };
      }
      const beforeItems2 = orderArray.slice(0, cartItemsIndex);
      const afterItems2 = orderArray.slice(cartItemsIndex + 1);
      return { beforeItems: beforeItems2, afterItems: afterItems2 };
    };
    const calculateSavings = () => {
      var _a3;
      if (!((_a3 = config == null ? void 0 : config.features) == null ? void 0 : _a3.savingsDisplay))
        return 0;
      const itemLevelSavings = cart.items.reduce((sum, item) => {
        return sum + Math.max(0, item.original_price - item.final_price) * item.quantity;
      }, 0);
      const discountSavings = cart.total_discount || 0;
      return Math.max(itemLevelSavings, discountSavings);
    };
    const renderFeature = (featureId) => {
      var _a3, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2, _k2, _l2, _m2, _n2, _o2, _p2, _q2, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
      switch (featureId) {
        case "free-shipping-bar": {
          const bar = (_a3 = config == null ? void 0 : config.features) == null ? void 0 : _a3.freeShippingProgressBar;
          if (!bar)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            FreeShippingBar,
            {
              thresholdMode: bar.thresholdMode || "amount",
              thresholdAmount: parseFloat(bar.thresholdAmount) || 0,
              thresholdCount: parseInt(bar.thresholdCount) || 0,
              beforeThresholdMessage: bar.beforeThresholdMessage || "Add {remaining} for FREE shipping",
              afterThresholdMessage: bar.afterThresholdMessage || "\u{1F389} You qualify for FREE shipping!",
              backgroundColor: bar.backgroundColor || "#f0f9ff",
              progressBarColor: bar.progressBarColor || "#3b82f6",
              borderColor: bar.borderColor || "#e2e8f0",
              showPercentage: (_b2 = bar.showPercentage) != null ? _b2 : true,
              currency: void 0,
              cart,
              isPreview: false,
              showProductUpsell: (_c2 = bar.showProductUpsell) != null ? _c2 : true,
              upsellHeaderText: bar.upsellHeaderText || "Almost there! Add this to unlock free shipping:",
              upsellProducts: bar.upsellProducts || [],
              appUrl: (config == null ? void 0 : config.appUrl) || ((_d2 = window.selldrawer_config) == null ? void 0 : _d2.appUrl),
              shop: (config == null ? void 0 : config.shop) || ((_e2 = window.selldrawer_config) == null ? void 0 : _e2.shop) || ((_f2 = window.Shopify) == null ? void 0 : _f2.shop),
              onAddProduct: onAddProductToCart
            }
          ) }, featureId);
        }
        case "product-recommendations": {
          const recommendations = (_g2 = config == null ? void 0 : config.features) == null ? void 0 : _g2.productRecommendations;
          if (!recommendations)
            return null;
          const products = recommendations.products || [];
          if (products.length === 0)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            ProductRecommendations,
            {
              title: recommendations.title || "You may also like",
              products,
              layout: recommendations.layout || "carousel",
              maxProducts: recommendations.maxProducts || 4,
              showDiscount: (_h2 = recommendations.showDiscount) != null ? _h2 : true,
              showDiscountBadge: (_i2 = recommendations.showDiscountBadge) != null ? _i2 : true,
              showAddButton: (_j2 = recommendations.showAddButton) != null ? _j2 : true,
              onAddToCart: onAddProductToCart,
              onImpression: () => onFeatureImpression && onFeatureImpression("product_recommendations"),
              onProductClick: (productId, variantId) => onFeatureClick && onFeatureClick("product_recommendations", { productId, variantId }),
              isPreview: false
            }
          ) }, featureId);
        }
        case "savings-display": {
          const savingsCfg = (_k2 = config == null ? void 0 : config.features) == null ? void 0 : _k2.savingsDisplay;
          if (!savingsCfg)
            return null;
          const totalSavings = calculateSavings();
          if (totalSavings <= 0)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            SavingsDisplay,
            {
              message: savingsCfg.message || "You saved {amount}!",
              amount: totalSavings,
              backgroundColor: savingsCfg.backgroundColor || "#dcfce7",
              textColor: savingsCfg.textColor || "#15803d",
              borderColor: savingsCfg.borderColor || "#ffffff",
              isPreview: false
            }
          ) }, featureId);
        }
        case "free-shipping-message": {
          const msg = (_l2 = config == null ? void 0 : config.features) == null ? void 0 : _l2.freeShippingMessage;
          if (!msg)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            FreeShippingMessage,
            {
              thresholdAmount: parseFloat(msg.thresholdAmount) || 0,
              cartTotal: cart.total_price,
              beforeThresholdMessage: msg.beforeThresholdMessage || "Add {remaining} more for FREE shipping",
              achievedMessage: msg.achievedMessage || "You qualify for FREE shipping!",
              backgroundColor: msg.backgroundColor || "#fef3c7",
              textColor: msg.textColor || "#92400e",
              borderColor: msg.borderColor || "#92400e",
              icon: msg.icon || "\u{1F69A}",
              currency: void 0,
              isPreview: false
            }
          ) }, featureId);
        }
        case "coupon-code": {
          const couponField = (_m2 = config == null ? void 0 : config.features) == null ? void 0 : _m2.couponCodeField;
          if (!couponField)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            CouponCodeField,
            {
              id: "selldrawer-coupon-field",
              placeholder: couponField.placeholder || "Enter coupon code",
              buttonText: couponField.buttonText || "Apply",
              showAllOffers: couponField.showAllOffers || false,
              showAllOffersButtonText: couponField.showAllOffersButtonText || "Show all offers",
              enableAutoApply: couponField.enableAutoApply || false,
              appliedDiscount,
              availableDiscounts,
              backgroundColor: couponField.backgroundColor || "#d1fae5",
              textColor: couponField.textColor || "#065f46",
              couponCodeColor: couponField.couponCodeColor || "",
              borderColor: couponField.borderColor || "#059669",
              appliedDiscountText: couponField.appliedDiscountText || "",
              onApplyCoupon,
              onRemoveDiscount,
              onSwitchDiscount,
              isPreview: false
            }
          ) }, featureId);
        }
        case "promotional-banner": {
          const banner = (_n2 = config == null ? void 0 : config.features) == null ? void 0 : _n2.promotionalBanner;
          if (!banner || !banner.slides || banner.slides.length === 0)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            PromotionalBannerCard,
            {
              slides: banner.slides,
              carouselSettings: banner.carouselSettings,
              context: "cart-drawer"
            }
          ) }, featureId);
        }
        case "milestones": {
          const milestones = (_o2 = config == null ? void 0 : config.features) == null ? void 0 : _o2.milestones;
          if (!milestones || milestones.length === 0)
            return null;
          const cartTotalForWidget = (cart.total_price || 0) / 100;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            MilestonesWidget,
            {
              milestones,
              cartTotal: cartTotalForWidget,
              progressBarColor: ((_p2 = config == null ? void 0 : config.features) == null ? void 0 : _p2.milestonesProgressBarColor) || "#1c1c3b",
              backgroundColor: (_q2 = config == null ? void 0 : config.features) == null ? void 0 : _q2.milestonesBackgroundColor,
              allUnlockedMessage: ((_r = config == null ? void 0 : config.features) == null ? void 0 : _r.milestonesAllUnlockedMessage) || "\u{1F389} Congratulations! All rewards unlocked!",
              currency: void 0,
              onAddToCart: (product) => {
                if (onAddProductToCart) {
                  const id = product.variantId || product.id;
                  const numericId = typeof id === "string" && id.startsWith("gid://") ? id.split("/").pop() : id;
                  const properties = {
                    "_selldrawer_gift_source": "milestone",
                    "_selldrawer_discount_type": "FREE",
                    // Milestone rewards are free (100% off)
                    "_selldrawer_discount_value": "100"
                  };
                  onAddProductToCart(numericId, 1, properties);
                }
              }
            }
          ) }, featureId);
        }
        case "free-gifts": {
          const gifts = (_s = config == null ? void 0 : config.features) == null ? void 0 : _s.freeGifts;
          if (!((_t = config == null ? void 0 : config.features) == null ? void 0 : _t.freeGiftsEnabled) || !gifts || gifts.length === 0)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            FreeGiftSelector,
            {
              gifts,
              selectedGiftId,
              onSelectGift,
              pendingOperations
            }
          ) }, featureId);
        }
        case "order-intelligence": {
          const hasOrderNote = config == null ? void 0 : config.orderNoteEnabled;
          const hasTerms = config == null ? void 0 : config.termsConditionsEnabled;
          const hasDelivery = config == null ? void 0 : config.deliveryEstimatesEnabled;
          const hasProtection = config == null ? void 0 : config.shippingProtectionEnabled;
          if (!hasOrderNote && !hasTerms && !hasDelivery && !hasProtection)
            return null;
          const isProtectionEnabled = hasProtection && cart.items.some(
            (item) => {
              var _a4;
              return item.variant_id.toString() === ((_a4 = config == null ? void 0 : config.shippingProtectionProductId) == null ? void 0 : _a4.toString());
            }
          );
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "selldrawer-order-intelligence-container", style: { marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }, children: [
            hasDelivery && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
              DeliveryEstimates,
              {
                message: config.deliveryEstimatesText,
                processingDaysMin: config.processingDaysMin,
                processingDaysMax: config.processingDaysMax,
                transitDaysMin: config.transitDaysMin,
                transitDaysMax: config.transitDaysMax
              }
            ),
            hasProtection && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
              ShippingProtection,
              {
                isEnabled: isProtectionEnabled,
                onToggle: (enabled) => onToggleShippingProtection(config.shippingProtectionProductId, enabled),
                title: config.shippingProtectionTitle || "Shipping Protection",
                price: config.shippingProtectionPrice || 0,
                currency: (_u = config.currency) == null ? void 0 : _u.isoCode,
                isPending: pendingOperations == null ? void 0 : pendingOperations.has("shipping-protection")
              }
            ),
            hasOrderNote && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
              OrderNote,
              {
                placeholder: config.orderNotePlaceholder,
                initialNote: cart.note || "",
                onSave: onUpdateNote
              }
            ),
            hasTerms && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
              TermsConditions,
              {
                isChecked: isTermsAccepted,
                onToggle: setIsTermsAccepted,
                text: config.termsConditionsText
              }
            )
          ] }, featureId);
        }
        case "trust-badges": {
          const trustBadges = (config == null ? void 0 : config.trustBadges) || ((_v = config == null ? void 0 : config.features) == null ? void 0 : _v.trustBadges);
          const isEnabled = (config == null ? void 0 : config.trustBadgesEnabled) || ((_w = config == null ? void 0 : config.features) == null ? void 0 : _w.trustBadgesEnabled);
          if (!isEnabled || !trustBadges || trustBadges.length === 0)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(TrustBadges, { config: trustBadges[0] }) }, featureId);
        }
        case "countdown-timer": {
          const timers = (config == null ? void 0 : config.countdownTimers) || ((_x = config == null ? void 0 : config.features) == null ? void 0 : _x.countdownTimers);
          const isEnabled = (config == null ? void 0 : config.countdownTimerEnabled) || ((_y = config == null ? void 0 : config.features) == null ? void 0 : _y.countdownTimerEnabled);
          if (!isEnabled || !timers || timers.length === 0)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(CountdownTimer, { config: timers[0] }) }, featureId);
        }
        case "accelerated-checkout": {
          const checkouts = (config == null ? void 0 : config.acceleratedCheckouts) || ((_z = config == null ? void 0 : config.features) == null ? void 0 : _z.acceleratedCheckouts);
          const isEnabled = (config == null ? void 0 : config.acceleratedCheckoutEnabled) || ((_A = config == null ? void 0 : config.features) == null ? void 0 : _A.acceleratedCheckoutEnabled);
          if (!isEnabled || !checkouts || checkouts.length === 0)
            return null;
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(AcceleratedCheckout, { config: checkouts[0] }) }, featureId);
        }
        default:
          return null;
      }
    };
    const { beforeItems, afterItems } = getFeatureOrder();
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(import_jsx_runtime19.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
        "button",
        {
          className: "selldrawer-close-btn",
          onClick: onClose,
          style: { background: "none", border: "none", cursor: "pointer" },
          children: "\xD7"
        }
      ),
      ((config == null ? void 0 : config.countdownTimerEnabled) || ((_a2 = config == null ? void 0 : config.features) == null ? void 0 : _a2.countdownTimerEnabled)) && !beforeItems.includes("countdown-timer") && !afterItems.includes("countdown-timer") && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(CountdownTimer, { config: ((_b = config.countdownTimers) == null ? void 0 : _b[0]) || ((_d = (_c = config.features) == null ? void 0 : _c.countdownTimers) == null ? void 0 : _d[0]) || { isActive: true } }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
        "h2",
        {
          id: "selldrawer-cart-header",
          style: { fontSize: "20px", fontWeight: 600, marginBottom: "20px" },
          children: [
            "Your Cart (",
            cart.item_count,
            " items)"
          ]
        }
      ),
      beforeItems.map(renderFeature),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
        CartItems,
        {
          items: cart.items,
          productCompareAtPrices,
          pendingOperations,
          onUpdateQuantity,
          onRemoveItem,
          isPreview: false
        }
      ) }),
      afterItems.map(renderFeature),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
        CartTotals,
        {
          items: cart.items,
          totalPrice: cart.total_price,
          subtotalPrice: cart.subtotal_price,
          totalDiscount: cart.total_discount || 0,
          freeGiftVariantIds: freeGifts && freeGifts.length > 0 ? freeGifts[0].giftProducts.map((gp) => gp.shopifyVariantId || gp.shopifyProductId) : [],
          config: ((_e = config == null ? void 0 : config.features) == null ? void 0 : _e.cartTotals) ? {
            showOriginalPrice: (_f = config.features.cartTotals.showOriginalPrice) != null ? _f : true,
            showItemDiscounts: (_g = config.features.cartTotals.showItemDiscounts) != null ? _g : true,
            showSubtotal: (_h = config.features.cartTotals.showSubtotal) != null ? _h : true,
            showTaxNotice: (_i = config.features.cartTotals.showTaxNotice) != null ? _i : true,
            subtotalLabel: config.features.cartTotals.subtotalLabel || "Subtotal",
            totalLabel: config.features.cartTotals.totalLabel || "Total",
            taxNoticeText: config.features.cartTotals.taxNoticeText || "Taxes and shipping calculated at checkout",
            originalPriceLabel: config.features.cartTotals.originalPriceLabel || "Original Price",
            itemDiscountsLabel: config.features.cartTotals.itemDiscountsLabel || "Item Discounts",
            borderColor: config.features.cartTotals.borderColor || "#e5e7eb",
            backgroundColor: config.features.cartTotals.backgroundColor || "#ffffff",
            textColor: config.features.cartTotals.textColor || "#374151",
            totalTextColor: config.features.cartTotals.totalTextColor || "#111827",
            discountColor: config.features.cartTotals.discountColor || "#f59e0b"
          } : void 0,
          isPreview: false
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
        "button",
        {
          className: `selldrawer-checkout-btn ${!isTermsAccepted ? "disabled" : ""}`,
          onClick: onCheckout,
          disabled: !isTermsAccepted,
          style: {
            opacity: isTermsAccepted ? 1 : 0.5,
            cursor: isTermsAccepted ? "pointer" : "not-allowed"
          },
          children: "Checkout"
        }
      ),
      ((config == null ? void 0 : config.acceleratedCheckoutEnabled) || ((_j = config == null ? void 0 : config.features) == null ? void 0 : _j.acceleratedCheckoutEnabled)) && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(AcceleratedCheckout, { config: ((_k = config.acceleratedCheckouts) == null ? void 0 : _k[0]) || ((_m = (_l = config.features) == null ? void 0 : _l.acceleratedCheckouts) == null ? void 0 : _m[0]) || { isActive: true } }),
      ((config == null ? void 0 : config.trustBadgesEnabled) || ((_n = config == null ? void 0 : config.features) == null ? void 0 : _n.trustBadgesEnabled)) && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(TrustBadges, { config: ((_o = config.trustBadges) == null ? void 0 : _o[0]) || ((_q = (_p = config.features) == null ? void 0 : _p.trustBadges) == null ? void 0 : _q[0]) || { isActive: true } }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: {
        textAlign: "center",
        fontSize: "12px",
        color: "#6b7280",
        marginTop: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
          ] }),
          "Secure Checkout"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "\u2022" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "Free Returns" })
      ] })
    ] });
  };

  // extensions/cart-upsell/assets/modules/analytics.js
  var _a;
  var Analytics = {
    shop: ((_a = window.Shopify) == null ? void 0 : _a.shop) || window.location.hostname,
    appUrl: null,
    init(appUrl) {
      this.appUrl = appUrl;
    },
    getSessionId() {
      try {
        let sessionId = sessionStorage.getItem("selldrawer_session_id");
        if (!sessionId) {
          sessionId = "sess_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
          sessionStorage.setItem("selldrawer_session_id", sessionId);
        }
        return sessionId;
      } catch (e) {
        return "sess_" + Date.now();
      }
    },
    track(event) {
      if (!this.shop) {
        return;
      }
      if (!this.appUrl) {
        return;
      }
      const payload = {
        shop: this.shop,
        events: [__spreadProps(__spreadValues({}, event), {
          sessionId: this.getSessionId(),
          url: window.location.href
        })]
      };
      const apiUrl = `${this.appUrl}/api/analytics`;
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        const sent = navigator.sendBeacon(apiUrl, blob);
        if (!sent) {
          this.fallbackFetch(apiUrl, payload);
        }
      } else {
        this.fallbackFetch(apiUrl, payload);
      }
    },
    fallbackFetch(apiUrl, payload) {
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).then((response) => {
        if (!response.ok) {
        }
      }).catch((err) => {
      });
    }
  };

  // extensions/cart-upsell/assets/modules/cart-drawer-class.js
  var SelldrawerCartDrawer = class {
    constructor(appUrl) {
      this.appUrl = appUrl;
      this.shop = this._detectShop();
      this.config = null;
      this.isOpen = false;
      this.cart = null;
      this.availableDiscounts = [];
      this.showingAllOffers = false;
      this.productCompareAtPrices = {};
      this.reactRoot = null;
      this.cartJustUpdated = false;
      this.unlockedMilestone = null;
      this.milestones = [];
      this.isSyncingGifts = false;
      this.freeGifts = [];
      this.selectedGiftId = null;
      this.pendingOperations = /* @__PURE__ */ new Set();
      this.init();
    }
    _detectShop() {
      var _a2, _b, _c, _d, _e, _f, _g, _h;
      return ((_a2 = window.selldrawer_config) == null ? void 0 : _a2.shop) || ((_b = window.Shopify) == null ? void 0 : _b.shop) || ((_d = (_c = window.meta) == null ? void 0 : _c.page) == null ? void 0 : _d.pageType) && ((_e = window.Shopify) == null ? void 0 : _e.shop) || ((_g = (_f = document.querySelector("[data-shop-domain]")) == null ? void 0 : _f.dataset) == null ? void 0 : _g.shopDomain) || // Parse from canonical URL as last resort
      (((_h = document.querySelector('link[rel="canonical"]')) == null ? void 0 : _h.href) ? new URL(document.querySelector('link[rel="canonical"]').href).hostname : null) || window.location.hostname;
    }
    async init() {
      if (!this.appUrl) {
        console.error("Selldrawer: App URL not configured");
        return;
      }
      console.log("[Selldrawer] Initializing. Shop:", this.shop, "| AppURL:", this.appUrl);
      try {
        this.createDrawer();
        this.interceptAddToCart();
        this.attachCartTriggers();
        console.log("[Selldrawer] Drawer created and triggers attached.");
      } catch (e) {
        console.error("Selldrawer: Failed to initialize UI components", e);
      }
      this.loadConfig().then(() => this.loadCart()).catch((e) => console.error("Selldrawer: Background data load failed", e));
    }
    async loadConfig() {
      var _a2, _b, _c, _d, _e, _f;
      try {
        Analytics.init(this.appUrl);
        if (((_a2 = window.selldrawer_config) == null ? void 0 : _a2.settings) && Object.keys(window.selldrawer_config.settings).length > 0) {
          console.log("[Selldrawer] Using zero-latency config from Metafields");
          this.config = window.selldrawer_config.settings;
        } else {
          const timestamp = (/* @__PURE__ */ new Date()).getTime();
          let apiUrl = `${this.appUrl}/api/cart-drawer?shop=${encodeURIComponent(this.shop)}&_t=${timestamp}`;
          if ((_b = window.selldrawer_config) == null ? void 0 : _b.customerId) {
            apiUrl += `&customerId=gid://shopify/Customer/${window.selldrawer_config.customerId}`;
          }
          console.log("[Selldrawer] Fetching config from:", apiUrl);
          const response = await fetch(apiUrl, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
          });
          if (!response.ok) {
            throw new Error(`Config API returned ${response.status}`);
          }
          this.config = await response.json();
          console.log("[Selldrawer] Config loaded:", this.config);
        }
        if ((_d = (_c = this.config) == null ? void 0 : _c.features) == null ? void 0 : _d.milestonesEnabled) {
          await this.loadMilestones();
        }
        if ((_f = (_e = this.config) == null ? void 0 : _e.features) == null ? void 0 : _f.freeGiftsEnabled) {
          await this.loadFreeGifts();
        }
      } catch (error) {
        console.error("Selldrawer: Failed to load config, using fallback:", error);
        this.config = {
          enabled: true,
          features: {
            freeShippingBar: null,
            productRecommendations: null,
            couponCodeField: null,
            milestonesEnabled: false,
            freeGiftsEnabled: false
          }
        };
      }
    }
    async loadFreeGifts() {
      try {
        if (!this.config) {
          console.warn("Selldrawer: Config not loaded, skipping free gifts");
          return;
        }
        if (!this.cart) {
          console.warn("Selldrawer: Cart not loaded, skipping free gifts");
          return;
        }
        if (this.isSyncingGifts) {
          console.log("Selldrawer Free Gifts: Already syncing, skipping");
          return;
        }
        const cartTotalExcludingGifts = MilestoneRewardManager.calculateCartTotalExcludingGifts(this.cart);
        console.log("Selldrawer Free Gifts: Cart total check", {
          totalWithGifts: this.cart.total_price / 100,
          totalExcludingGifts: cartTotalExcludingGifts / 100
        });
        const freeGifts = await FreeGiftManager.loadFreeGifts(
          this.appUrl,
          this.shop,
          this.cart,
          cartTotalExcludingGifts / 100
          // Pass cart total in rupees, excluding gifts
        );
        this.freeGifts = freeGifts;
        if (freeGifts.length > 0 && freeGifts[0].qualified) {
          console.log("Selldrawer Free Gifts: API returned gifts, syncing");
          await FreeGiftManager.syncFreeGiftWithCart(
            freeGifts[0],
            this.cart,
            async () => {
              const response = await fetch("/cart.js");
              this.cart = await response.json();
            }
          );
          this.selectedGiftId = FreeGiftManager.getSelectedGiftFromCart(this.cart, freeGifts[0]);
        } else {
          console.log("Selldrawer Free Gifts: No gifts from API, not syncing (milestone has priority)");
          this.selectedGiftId = null;
        }
      } catch (error) {
        console.error("Selldrawer: Failed to load free gifts", error);
      }
    }
    async loadMilestones() {
      try {
        const appUrl = this.appUrl;
        if (!appUrl)
          return;
        if (!this.config) {
          console.warn("Selldrawer: Config not loaded, skipping milestones");
          return;
        }
        if (!this.cart) {
          console.warn("Selldrawer: Cart not loaded, skipping milestones");
          return;
        }
        const cartTotalInCents = MilestoneRewardManager.calculateCartTotalExcludingGifts(this.cart);
        const cartTotal = cartTotalInCents / 100;
        const timestamp = (/* @__PURE__ */ new Date()).getTime();
        const response = await fetch(
          `${appUrl}/api/milestones?shop=${this.shop}&_t=${timestamp}`,
          {
            method: "POST",
            body: JSON.stringify({
              cartTotal,
              cartItems: this.cart ? this.cart.items : []
            }),
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
            }
          }
        );
        const data = await response.json();
        if (data.milestones) {
          this.milestones = data.milestones;
          if (!this.config.features) {
            this.config.features = {};
          }
          this.config.features.milestones = data.milestones;
          await this.handleMilestoneRewards();
        }
        if (data.progressBarColor && this.config.features) {
          this.config.features.milestonesProgressBarColor = data.progressBarColor;
        }
        if (data.allUnlockedMessage && this.config.features) {
          this.config.features.milestonesAllUnlockedMessage = data.allUnlockedMessage;
        }
        if (data.backgroundColor && this.config.features) {
          this.config.features.milestonesBackgroundColor = data.backgroundColor;
        }
      } catch (error) {
        console.error("Selldrawer: Failed to load milestones", error);
      }
    }
    async handleMilestoneRewards() {
      if (this.isSyncingGifts) {
        console.log("Selldrawer Milestones: Already syncing, skipping");
        return;
      }
      if (!this.cart) {
        console.warn("Selldrawer: Cart not loaded, skipping milestone rewards");
        return;
      }
      try {
        this.isSyncingGifts = true;
        console.log("Selldrawer Milestones: Starting sync");
        const previousMilestone = this.unlockedMilestone;
        this.unlockedMilestone = await MilestoneRewardManager.handleMilestoneRewards(
          this.milestones,
          this.cart,
          async (cartData) => {
            await this.loadCart(cartData, false, true);
          }
        );
        if (this.unlockedMilestone && (!previousMilestone || previousMilestone.id !== this.unlockedMilestone.id)) {
          MilestoneRewardManager.showMilestoneUnlockedNotification(this.unlockedMilestone);
        }
        console.log("Selldrawer Milestones: Sync complete");
      } catch (error) {
        console.error("Selldrawer Milestones: Error handling rewards", error);
      } finally {
        setTimeout(() => {
          this.isSyncingGifts = false;
        }, 1e3);
      }
    }
    async loadCart(cartData = null, skipRender = false, skipGiftSync = false) {
      var _a2, _b, _c, _d, _e;
      try {
        if (cartData) {
          this.cart = cartData;
        } else {
          const response = await fetch(`/cart.js?v=${(/* @__PURE__ */ new Date()).getTime()}`, {
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
          });
          this.cart = await response.json();
        }
        if (!skipRender) {
          this.render();
        }
        if (!skipGiftSync) {
          this.loadSecondaryDataAsync();
        }
        const promises = [
          loadProductCompareAtPrices(this.cart),
          loadAvailableDiscounts(this.appUrl, this.shop, this.config),
          loadShopifyRecommendations(this.cart, this.config),
          loadDynamicFreeShippingUpsells(this.cart, this.config)
        ];
        const [productCompareAtPrices, availableDiscounts] = await Promise.all(promises);
        this.productCompareAtPrices = productCompareAtPrices;
        this.availableDiscounts = availableDiscounts;
        if (((_b = (_a2 = this.config) == null ? void 0 : _a2.features) == null ? void 0 : _b.couponCodeField) && ((_e = (_d = (_c = this.config) == null ? void 0 : _c.features) == null ? void 0 : _d.couponCodeField) == null ? void 0 : _e.enableAutoApply) && !this.getDiscountFromCart() && this.availableDiscounts.length > 0 && !wasDiscountRemoved()) {
          await autoApplyBestDiscount(this.availableDiscounts, this.config, this.loadCart.bind(this));
        }
        if (!skipRender) {
          this.render();
        }
      } catch (error) {
        console.error("Selldrawer: Failed to load cart", error);
        this.cart = {
          item_count: 0,
          total_price: 0,
          items: []
        };
        if (!skipRender) {
          this.render();
        }
      }
    }
    // OPTIMIZATION: Load milestones and gifts asynchronously without blocking
    async loadSecondaryDataAsync() {
      var _a2, _b, _c, _d;
      try {
        if ((_b = (_a2 = this.config) == null ? void 0 : _a2.features) == null ? void 0 : _b.milestonesEnabled) {
          await this.loadMilestones();
        } else {
          if (!this.cart) {
            console.warn("Selldrawer: Cart not loaded, skipping milestone cleanup");
            return;
          }
          const allGifts = MilestoneRewardManager.getAllGiftsInCart(this.cart);
          if (allGifts.length > 0) {
            let cartModified = false;
            for (const giftItem of allGifts) {
              const props = MilestoneRewardManager.normalizeProperties(giftItem.properties);
              const source = props["_selldrawer_gift_source"];
              const isMilestoneGift = !source || source === "milestone";
              if (isMilestoneGift) {
                console.log("Selldrawer Cart Drawer: Cleaning up disabled milestone gift", giftItem.key);
                await MilestoneRewardManager.removeGiftFromCart(giftItem.key);
                cartModified = true;
              } else {
                console.log("Selldrawer Cart Drawer: Ignoring gift from other source", source, giftItem.key);
              }
            }
            if (cartModified) {
              const response = await fetch("/cart.js");
              this.cart = await response.json();
            }
          }
        }
        if ((_d = (_c = this.config) == null ? void 0 : _c.features) == null ? void 0 : _d.freeGiftsEnabled) {
          await this.loadFreeGifts();
        }
        this.render();
      } catch (error) {
        console.error("Selldrawer: Failed to load secondary data", error);
      }
    }
    interceptAddToCart() {
      let isHandlingAddToCart = false;
      document.addEventListener("submit", async (e) => {
        const form = e.target;
        const action = form.getAttribute("action");
        if (action && (action === "/cart/add" || action.endsWith("/cart/add") || action.includes("/cart/add"))) {
          e.preventDefault();
          e.stopPropagation();
          if (isHandlingAddToCart)
            return;
          isHandlingAddToCart = true;
          const formData = new FormData(form);
          try {
            const response = await fetch("/cart/add.js", {
              method: "POST",
              body: formData
            });
            if (response.ok) {
              if (!this.config) {
                await this.loadConfig();
              }
              const cartResponse = await fetch("/cart.js");
              this.cart = await cartResponse.json();
              this.cartJustUpdated = true;
              await this.open();
              this.loadSecondaryData();
            } else {
              console.error("Selldrawer: Failed to add to cart", await response.text());
            }
          } catch (error) {
            console.error("Selldrawer: Failed to add to cart", error);
          } finally {
            setTimeout(() => {
              isHandlingAddToCart = false;
            }, 500);
          }
        }
      }, true);
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        var _a2;
        const url = typeof args[0] === "string" ? args[0] : (_a2 = args[0]) == null ? void 0 : _a2.url;
        const isCartAdd = url && (url.includes("/cart/add.js") || url.includes("/cart/add"));
        const response = await originalFetch(...args);
        if (isCartAdd && !isHandlingAddToCart) {
          isHandlingAddToCart = true;
          const clonedResponse = response.clone();
          try {
            if (clonedResponse.ok) {
              if (!this.config) {
                await this.loadConfig();
              }
              const cartResponse = await fetch("/cart.js");
              this.cart = await cartResponse.json();
              this.cartJustUpdated = true;
              await this.open();
              this.loadSecondaryData();
            }
          } catch (error) {
            console.error("Selldrawer: Error handling cart add", error);
          } finally {
            setTimeout(() => {
              isHandlingAddToCart = false;
            }, 500);
          }
        }
        return response;
      };
    }
    attachCartTriggers() {
      const suppressThemeCartDrawer = () => {
        document.querySelectorAll("cart-drawer").forEach((el) => {
          el.style.display = "none";
          el.style.visibility = "hidden";
          if (el.show)
            el.show = () => {
            };
          if (el.open)
            el.open = () => {
            };
        });
        document.querySelectorAll("cart-notification").forEach((el) => {
          el.style.display = "none";
          if (el.renderContents)
            el.renderContents = () => {
            };
        });
      };
      suppressThemeCartDrawer();
      const mutationObserver = new MutationObserver(() => suppressThemeCartDrawer());
      mutationObserver.observe(document.body, { childList: true, subtree: false });
      const CART_TRIGGER_SELECTOR = [
        // Anchor tag cart links
        'a[href="/cart"]',
        'a[href*="/cart"]',
        // Button/element patterns used by theme
        "[data-cart-toggle]",
        "[data-cart-open]",
        "[data-open-cart]",
        '[aria-controls="cart-drawer"]',
        '[aria-controls="CartDrawer"]',
        '[aria-controls="cart-notification-product"]',
        '[aria-label*="cart" i]',
        '[aria-label*="Cart" i]',
        // Common class patterns
        ".cart-icon-bubble",
        ".cart__icon",
        ".header__icon--cart",
        ".site-header__cart",
        ".cart-link",
        ".js-cart-link",
        ".js-cart",
        ".cart-trigger",
        ".cart-toggle",
        ".mini-cart-icon",
        ".nav-cart-icon",
        '[class*="cart-icon"]',
        '[class*="CartIcon"]',
        // Icon-type selectors
        "a.icon-cart",
        ".icon-cart",
        // Shopify native custom elements as triggers
        "cart-icon-bubble"
      ].join(", ");
      const isCartTrigger = (target) => {
        if (!target)
          return false;
        let el = target;
        for (let i = 0; i < 5; i++) {
          if (!el || el === document.body)
            break;
          if (el.matches && el.matches(CART_TRIGGER_SELECTOR)) {
            const href = el.getAttribute("href") || "";
            if (href.includes("/checkout") || href.includes("/account") || href.includes("/collections")) {
            } else {
              return true;
            }
          }
          el = el.parentElement;
        }
        return false;
      };
      document.addEventListener("click", (e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && isCartTrigger(e.target)) {
          console.log("[Selldrawer] Cart trigger intercepted", e.target);
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.open();
        }
      }, true);
      const cartOpenEvents = ["cart:open", "open-cart", "CartDrawer:open", "cart-drawer:open", "theme:cart:open"];
      cartOpenEvents.forEach((eventName) => {
        document.addEventListener(eventName, (e) => {
          console.log(`[Selldrawer] Intercepted theme event: ${eventName}`);
          e.preventDefault();
          e.stopImmediatePropagation();
          this.open();
        }, true);
      });
      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === "C") {
          e.preventDefault();
          this.open();
        }
      });
      document.addEventListener("cart:updated", async (e) => {
        let cartData = e.detail;
        if (!cartData || !cartData.items || !Array.isArray(cartData.items)) {
          console.log("Selldrawer Cart Drawer: Event data is not a full cart, fetching fresh data");
          cartData = null;
        }
        if (this.isOpen) {
          await this.loadCart(cartData, false, true);
        } else {
          if (cartData) {
            this.cart = cartData;
          }
        }
      });
    }
    createDrawer() {
      const drawer = document.createElement("div");
      drawer.id = "selldrawer-cart-drawer";
      drawer.className = "selldrawer-drawer";
      drawer.innerHTML = `
      <div class="selldrawer-drawer-overlay"></div>
      <div class="selldrawer-drawer-content">
        <div class="selldrawer-drawer-inner"></div>
      </div>
    `;
      document.body.appendChild(drawer);
      const overlay = drawer.querySelector(".selldrawer-drawer-overlay");
      const drawerContent = drawer.querySelector(".selldrawer-drawer-content");
      drawer.addEventListener("click", (e) => {
        if (this.isOpen && e.target === drawer) {
          this.close();
        }
      });
      if (overlay) {
        overlay.addEventListener("click", (e) => {
          if (this.isOpen) {
            e.stopPropagation();
            this.close();
          }
        });
      }
      if (drawerContent) {
        drawerContent.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      }
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen) {
          this.close();
        }
      });
      this.loadStyles();
    }
    loadStyles() {
      if (document.querySelector("#selldrawer-cart-drawer-styles")) {
        return;
      }
    }
    render() {
      var _a2, _b;
      const drawer = document.getElementById("selldrawer-cart-drawer");
      if (!drawer) {
        console.error("Selldrawer: Drawer element not found");
        return;
      }
      const inner = drawer.querySelector(".selldrawer-drawer-inner");
      if (!inner) {
        console.error("Selldrawer: Drawer inner element not found");
        return;
      }
      if (!this.reactRoot) {
        this.reactRoot = (0, import_client.createRoot)(inner);
      }
      if (!this.cart || !this.config) {
        this.reactRoot.render(
          import_react12.default.createElement(
            "div",
            { style: { padding: "20px", textAlign: "center", color: "#6b7280" } },
            import_react12.default.createElement("div", { style: { fontSize: "14px", marginTop: "40px" } }, "Loading your cart...")
          )
        );
        return;
      }
      console.log("Selldrawer Cart Drawer Render:", {
        freeGifts: this.freeGifts,
        freeGiftsEnabled: (_b = (_a2 = this.config) == null ? void 0 : _a2.features) == null ? void 0 : _b.freeGiftsEnabled,
        selectedGiftId: this.selectedGiftId
      });
      const appliedDiscount = this.getDiscountFromCart();
      this.reactRoot.render(
        import_react12.default.createElement(UnifiedCartDrawer, {
          config: this.config,
          cart: this.cart,
          appliedDiscount,
          availableDiscounts: this.availableDiscounts,
          productCompareAtPrices: this.productCompareAtPrices,
          showingAllOffers: this.showingAllOffers,
          unlockedMilestone: this.unlockedMilestone,
          freeGifts: this.freeGifts,
          selectedGiftId: this.selectedGiftId,
          pendingOperations: this.pendingOperations,
          onClose: () => this.close(),
          onCheckout: () => this.handleCheckout(),
          onAddProductToCart: (variantId, quantity = 1, properties = {}) => this.addProductToCart(variantId, quantity, properties),
          onUpdateQuantity: (itemKey, newQuantity) => this.updateQuantity(itemKey, newQuantity),
          onRemoveItem: (itemKey) => this.removeItem(itemKey),
          onApplyCoupon: (code) => this.applyCouponWithCode(code),
          onRemoveDiscount: () => this.removeDiscount(),
          onSwitchDiscount: (code) => this.switchDiscount(code),
          onSelectGift: (giftId, variantId) => this.handleSelectGift(giftId, variantId),
          onUpdateNote: (note) => this.updateNote(note),
          onToggleShippingProtection: (variantId, enabled) => this.toggleShippingProtection(variantId, enabled),
          onImpression: () => {
            Analytics.track({
              eventType: "impression",
              component: "cart_drawer",
              value: 0
            });
          },
          onFeatureImpression: (feature) => {
            Analytics.track({
              eventType: "impression",
              component: feature,
              value: 0
            });
          },
          onFeatureClick: (feature, data) => {
            Analytics.track(__spreadValues({
              eventType: "click",
              component: feature,
              value: 0
            }, data));
          }
        })
      );
    }
    open() {
      const drawer = document.getElementById("selldrawer-cart-drawer");
      if (!drawer) {
        console.error("Selldrawer: Drawer container not found");
        return;
      }
      drawer.classList.add("open");
      this.isOpen = true;
      this.cartJustUpdated = false;
      this.render();
      Promise.all([
        this.loadConfig(),
        fetch("/cart.js").then((res) => res.json()).then((cart) => {
          this.cart = cart;
        })
      ]).then(() => {
        this.render();
        this.loadSecondaryData();
      }).catch((error) => {
        console.error("Selldrawer: Failed to load data while opening", error);
        this.render();
      });
    }
    async loadSecondaryData() {
      var _a2, _b, _c, _d, _e;
      try {
        if (!this.cart) {
          console.warn("Selldrawer: Cart not loaded, skipping secondary data");
          return;
        }
        const promises = [
          loadProductCompareAtPrices(this.cart),
          loadAvailableDiscounts(this.appUrl, this.shop, this.config),
          loadShopifyRecommendations(this.cart, this.config)
        ];
        const [productCompareAtPrices, availableDiscounts] = await Promise.all(promises);
        this.productCompareAtPrices = productCompareAtPrices;
        this.availableDiscounts = availableDiscounts;
        this.loadSecondaryDataAsync();
        if (((_b = (_a2 = this.config) == null ? void 0 : _a2.features) == null ? void 0 : _b.couponCodeField) && ((_e = (_d = (_c = this.config) == null ? void 0 : _c.features) == null ? void 0 : _d.couponCodeField) == null ? void 0 : _e.enableAutoApply) && !this.getDiscountFromCart() && this.availableDiscounts.length > 0 && !wasDiscountRemoved()) {
          await autoApplyBestDiscount(this.availableDiscounts, this.config, this.loadCart.bind(this));
        }
        this.render();
      } catch (error) {
        console.error("Selldrawer: Failed to load secondary data", error);
      }
    }
    close() {
      const drawer = document.getElementById("selldrawer-cart-drawer");
      if (drawer) {
        drawer.classList.remove("open");
      }
      this.isOpen = false;
    }
    // Handle gift selection
    async handleSelectGift(giftId, variantId) {
      const freeGift = this.freeGifts && this.freeGifts.length > 0 ? this.freeGifts[0] : null;
      if (!freeGift) {
        console.error("Selldrawer: No free gift available");
        return;
      }
      const success = await FreeGiftManager.selectGift(variantId, freeGift, async () => {
        const response = await fetch("/cart.js");
        this.cart = await response.json();
        this.render();
      });
      if (success) {
        this.selectedGiftId = giftId;
        this.render();
      }
    }
    // Handle checkout with milestone rewards and free gifts
    async handleCheckout() {
      var _a2;
      try {
        console.log("Selldrawer: Starting checkout process", {
          hasFreeGifts: this.freeGifts && this.freeGifts.length > 0,
          hasUnlockedMilestone: !!this.unlockedMilestone,
          cartTotal: ((_a2 = this.cart) == null ? void 0 : _a2.total_price) / 100
        });
        if (this.freeGifts && this.freeGifts.length > 0 && this.freeGifts[0].qualified) {
          console.log("Selldrawer: Free gift is qualified, checking discount code");
          if (this.freeGifts[0].discountCode) {
            console.log("Selldrawer: Using free gift discount code", this.freeGifts[0].discountCode);
            const checkoutUrl = FreeGiftManager.getCheckoutUrlWithDiscount(this.freeGifts[0]);
            window.location.href = checkoutUrl;
            return;
          } else {
            console.log("Selldrawer: Free gift has no discount code, proceeding to normal checkout");
          }
        }
        if (this.unlockedMilestone && this.unlockedMilestone.discountCode) {
          console.log("Selldrawer: Using milestone discount", this.unlockedMilestone.discountCode);
          const validation = await MilestoneRewardManager.validateMilestoneForCheckout(
            this.unlockedMilestone,
            this.cart
          );
          if (!validation.valid) {
            console.log("Selldrawer: Milestone validation failed", validation.message);
            return;
          }
          const checkoutUrl = MilestoneRewardManager.getCheckoutUrlWithDiscount(this.unlockedMilestone);
          console.log("Selldrawer: Redirecting to checkout with milestone discount", checkoutUrl);
          window.location.href = checkoutUrl;
          return;
        }
        const appliedDiscount = this.getDiscountFromCart();
        if (appliedDiscount && appliedDiscount.code) {
          console.log("Selldrawer: Using manually applied discount", appliedDiscount.code);
          const checkoutUrl = getCheckoutUrl(appliedDiscount.code);
          window.location.href = checkoutUrl;
          return;
        }
        console.log("Selldrawer: Proceeding to normal checkout");
        window.location.href = "/checkout";
      } catch (error) {
        console.error("Selldrawer: Error during checkout", error);
        setTimeout(() => {
          window.location.href = "/checkout";
        }, 1e3);
      }
    }
    // Cart operations
    async addProductToCart(variantId, quantity = 1, properties = {}) {
      await addProductToCart(variantId, quantity, this.loadCart.bind(this), properties);
      if (properties._upsell_source) {
        Analytics.track({
          eventType: "add_to_cart",
          component: properties._upsell_source,
          variantId: variantId.toString(),
          value: 0
          // Ideally we'd have price here, but we might not
        });
      }
    }
    async addProductToCartByHandle(productHandle, variantId, quantity = 1, properties = {}) {
      await addProductToCartByHandle(productHandle, variantId, quantity, this.loadCart.bind(this), properties);
    }
    async updateQuantity(itemKey, newQuantity) {
      if (this.pendingOperations.has(itemKey)) {
        console.log("Selldrawer: Operation already pending for item", itemKey);
        return;
      }
      this.pendingOperations.add(itemKey);
      try {
        await updateQuantity(itemKey, newQuantity, async (updatedCart) => {
          await this.loadCart(updatedCart);
        }, this.render.bind(this));
      } catch (error) {
        await this.loadCart();
        this.render();
      } finally {
        this.pendingOperations.delete(itemKey);
        document.dispatchEvent(new CustomEvent("cart:updated"));
      }
    }
    async removeItem(itemKey) {
      if (this.pendingOperations.has(itemKey)) {
        console.log("Selldrawer: Operation already pending for item", itemKey);
        return;
      }
      this.pendingOperations.add(itemKey);
      try {
        await removeItem(itemKey, async (updatedCart) => {
          await this.loadCart(updatedCart);
          document.dispatchEvent(new CustomEvent("cart:updated"));
        }, this.render.bind(this));
      } finally {
        this.pendingOperations.delete(itemKey);
      }
    }
    // Get discount from Shopify cart
    getDiscountFromCart() {
      return getDiscountFromCart(this.cart);
    }
    // Discount management
    async applyCoupon() {
      await applyCoupon(this.appUrl, this.shop, this.config, null, this.render.bind(this));
    }
    async applyCouponWithCode(code) {
      const success = await validateAndApplyCoupon(
        this.appUrl,
        this.shop,
        this.config,
        code,
        this.loadCart.bind(this)
      );
      if (success) {
        clearDiscountRemoval();
        await this.loadCart();
      }
    }
    async removeDiscount() {
      markDiscountRemoved();
      const success = await removeDiscount(async (cart) => {
        this.cart = cart;
        this.render();
        this.loadSecondaryData();
      });
    }
    toggleAllOffers() {
      this.showingAllOffers = !this.showingAllOffers;
      const dropdown = document.getElementById("selldrawer-all-offers-dropdown");
      const arrow = document.getElementById("selldrawer-offers-arrow");
      if (dropdown) {
        dropdown.style.display = this.showingAllOffers ? "block" : "none";
      }
      if (arrow) {
        arrow.textContent = this.showingAllOffers ? "\u25B2" : "\u25BC";
      }
    }
    async switchDiscount(discountCode) {
      const discount = this.availableDiscounts.find((d) => d.code === discountCode);
      if (!discount) {
        console.error("Selldrawer: Discount not found", discountCode);
        return;
      }
      const success = await applyDiscountCode(discountCode, this.loadCart.bind(this));
      if (success) {
        this.showingAllOffers = false;
        clearDiscountRemoval();
        await this.loadCart();
      }
    }
    async updateNote(note) {
      this.pendingOperations.add("note");
      this.render();
      try {
        await updateCartNote(note, async () => {
          const response = await fetch("/cart.js");
          const cart = await response.json();
          this.cart = cart;
        });
      } finally {
        this.pendingOperations.delete("note");
        this.render();
      }
    }
    async toggleShippingProtection(variantId, enabled) {
      this.pendingOperations.add("shipping_protection");
      this.render();
      try {
        await toggleShippingProtection(variantId, enabled, async () => {
          const response = await fetch("/cart.js");
          const cart = await response.json();
          this.cart = cart;
        });
      } finally {
        this.pendingOperations.delete("shipping_protection");
        this.render();
      }
    }
  };

  // extensions/cart-upsell/assets/modules/fbt-cart-monitor.js
  var FBTCartMonitor = class {
    constructor() {
      this.fbtBundles = /* @__PURE__ */ new Map();
      this.currentDiscountCode = null;
      this.isRemoving = false;
      this.init();
    }
    init() {
      console.log("FBT Monitor: Initialized (Production Mode)");
      document.addEventListener("cart:updated", () => {
        this.checkAndCleanup();
      });
      if (typeof window !== "undefined") {
        setTimeout(() => this.checkAndCleanup(), 1e3);
      }
    }
    async checkAndCleanup() {
      var _a2;
      if (this.isRemoving) {
        console.log("FBT Monitor: Already removing discount, skipping...");
        return;
      }
      try {
        const response = await fetch("/cart.js");
        if (!response.ok) {
          console.error("FBT Monitor: Failed to fetch cart");
          return;
        }
        const cart = await response.json();
        console.log("FBT Monitor: Checking cart...", {
          totalItems: cart.item_count,
          appliedDiscountCodes: ((_a2 = cart.cart_level_discount_applications) == null ? void 0 : _a2.map((d) => d.title)) || []
        });
        const currentFBTItems = /* @__PURE__ */ new Map();
        cart.items.forEach((item) => {
          var _a3, _b;
          const discountCode = (_a3 = item.properties) == null ? void 0 : _a3._fbt_discount_code;
          const bundleSize = (_b = item.properties) == null ? void 0 : _b._fbt_bundle_size;
          if (discountCode) {
            if (!currentFBTItems.has(discountCode)) {
              currentFBTItems.set(discountCode, {
                requiredCount: bundleSize ? parseInt(bundleSize) : 0,
                items: /* @__PURE__ */ new Set()
              });
            }
            currentFBTItems.get(discountCode).items.add(item.key);
          }
        });
        let shouldRemoveDiscount = false;
        let discountToRemove = null;
        if (currentFBTItems.size === 0 && this.currentDiscountCode) {
          console.log("FBT Monitor: No FBT items in cart, need to remove discount");
          shouldRemoveDiscount = true;
          discountToRemove = this.currentDiscountCode;
        }
        for (const [discountCode, bundleData] of currentFBTItems.entries()) {
          const currentCount = bundleData.items.size;
          const requiredCount = bundleData.requiredCount;
          console.log(`FBT Monitor: Bundle ${discountCode}:`, {
            current: currentCount,
            required: requiredCount
          });
          if (requiredCount > 0 && currentCount < requiredCount) {
            console.log(`FBT Monitor: Bundle ${discountCode} incomplete (${currentCount}/${requiredCount})`);
            shouldRemoveDiscount = true;
            discountToRemove = discountCode;
            break;
          }
          const previousBundle = this.fbtBundles.get(discountCode);
          if (previousBundle && currentCount < previousBundle.items.size) {
            console.log(`FBT Monitor: Items removed from bundle ${discountCode}`);
            shouldRemoveDiscount = true;
            discountToRemove = discountCode;
            break;
          }
        }
        if (shouldRemoveDiscount) {
          await this.removeDiscountFromCart(discountToRemove);
          this.currentDiscountCode = null;
          this.fbtBundles.clear();
        } else {
          this.fbtBundles = currentFBTItems;
          const appliedDiscounts = cart.cart_level_discount_applications || [];
          if (appliedDiscounts.length > 0 && currentFBTItems.size > 0) {
            const fbtDiscount = appliedDiscounts.find(
              (d) => d.title && d.title.startsWith("FBT_RULE_")
            );
            if (fbtDiscount) {
              this.currentDiscountCode = fbtDiscount.title;
            }
          }
        }
      } catch (error) {
        console.error("FBT Monitor: Error in checkAndCleanup:", error);
      }
    }
    async removeDiscountFromCart(discountCode) {
      if (this.isRemoving) {
        console.log("FBT Monitor: Already removing, skipping...");
        return;
      }
      this.isRemoving = true;
      try {
        console.log(`FBT Monitor: Removing discount ${discountCode || "current"} from cart...`);
        if (window.selldrawerDrawer && typeof window.selldrawerDrawer.removeDiscount === "function") {
          console.log("FBT Monitor: Using cart drawer removeDiscount method");
          await window.selldrawerDrawer.removeDiscount();
        } else {
          console.log("FBT Monitor: Using direct Shopify API");
          const response = await fetch("/cart/update.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              attributes: {
                discount_code: ""
                // Clear discount
              }
            })
          });
          if (!response.ok) {
            console.error("FBT Monitor: Failed to remove discount via API");
          }
        }
        console.log("FBT Monitor: Discount removed successfully");
        if (window.selldrawerDrawer && typeof window.selldrawerDrawer.loadCart === "function") {
          await window.selldrawerDrawer.loadCart();
        }
        document.dispatchEvent(new CustomEvent("cart:updated"));
      } catch (error) {
        console.error("FBT Monitor: Error removing discount:", error);
      } finally {
        this.isRemoving = false;
      }
    }
  };
  if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        window.fbtCartMonitor = new FBTCartMonitor();
      });
    } else {
      window.fbtCartMonitor = new FBTCartMonitor();
    }
  }

  // extensions/cart-upsell/assets/modules/cart-drawer-entry.js
  var APP_URL = true ? "https://drew-fix-america-insertion.trycloudflare.com" : "https://app.selldrawer.com";
  async function initializeCartDrawer() {
    if (typeof window === "undefined")
      return;
    console.log("[Selldrawer] Entry point executing. APP_URL:", APP_URL);
    window.UPSELLITY_APP_URL = APP_URL;
    window.selldrawerDrawer = new SelldrawerCartDrawer(APP_URL);
    if (window.selldrawerPendingOpen) {
      console.log("[Selldrawer] Opening drawer for queued click.");
      window.selldrawerPendingOpen = false;
      setTimeout(() => {
        if (window.selldrawerDrawer && typeof window.selldrawerDrawer.open === "function") {
          window.selldrawerDrawer.open();
        }
      }, 100);
    }
  }
  initializeCartDrawer().catch((e) => {
    console.error("[Selldrawer] Entry point failed:", e);
  });
})();
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.min.js:
  (**
   * @license React
   * scheduler.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.min.js:
  (**
   * @license React
   * react-dom.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.min.js:
  (**
   * @license React
   * react-jsx-runtime.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
