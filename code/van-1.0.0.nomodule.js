(() => {
  // van.js
  var Obj = Object;
  var _undefined;
  var protoOf = Obj.getPrototypeOf;
  var doc = document;
  var addAndScheduleOnFirst = (set, s, func, waitMs) => (set ?? (setTimeout(func, waitMs), /* @__PURE__ */ new Set())).add(s);
  var changedStates;
  var curDeps;
  var runAndCaptureDeps = (f, deps, arg) => {
    let prevDeps = curDeps;
    curDeps = deps;
    let r = f(arg);
    curDeps = prevDeps;
    return r;
  };
  var filterBindings = (s) => s.bindings = s.bindings.filter((b) => b.dom?.isConnected);
  var stateProto = {
    get "val"() {
      curDeps?.add(this);
      return this._val;
    },
    get "oldVal"() {
      curDeps?.add(this);
      return this._oldVal;
    },
    set "val"(v) {
      let s = this, curV = s._val;
      if (v !== curV) {
        changedStates = addAndScheduleOnFirst(changedStates, s, updateDoms);
        s._val = v;
        let boundStates = /* @__PURE__ */ new Set();
        for (let l of [...s.listeners])
          effect(l.f), l.executed = 1, l.deps.forEach(boundStates.add, boundStates);
        for (let _s of boundStates)
          _s.listeners = _s.listeners.filter((l) => !l.executed);
      }
    }
  };
  var objProto = protoOf(stateProto);
  var funcProto = protoOf(runAndCaptureDeps);
  var state = (initVal) => ({
    __proto__: stateProto,
    _val: initVal,
    _oldVal: initVal,
    bindings: [],
    listeners: []
  });
  var isState = (s) => protoOf(s ?? 0) === stateProto;
  var val = (s) => isState(s) ? s.val : s;
  var oldVal = (s) => isState(s) ? s.oldVal : s;
  var toDom = (v) => v == _undefined ? _undefined : v.nodeType ? v : new Text(v);
  var gcCycleInMs = 1e3;
  var statesToGc;
  var bind = (f, dom) => {
    let deps = /* @__PURE__ */ new Set(), binding = { f, dom: toDom(runAndCaptureDeps(f, deps, dom)) };
    for (let s of deps) {
      statesToGc = addAndScheduleOnFirst(
        statesToGc,
        s,
        () => (statesToGc.forEach(filterBindings), statesToGc = _undefined),
        gcCycleInMs
      );
      s.bindings.push(binding);
    }
    return binding.dom;
  };
  var effect = (f) => {
    let deps = /* @__PURE__ */ new Set(), listener = { f, deps };
    runAndCaptureDeps(f, deps);
    for (let s of deps)
      s.listeners.push(listener);
  };
  var add = (dom, ...children) => {
    for (let c of children.flat(Infinity)) {
      let child = isState(c) ? bind(() => c.val) : protoOf(c ?? 0) === funcProto ? bind(c) : toDom(c);
      if (child != _undefined)
        dom.appendChild(child);
    }
    return dom;
  };
  var derive = (f) => (f.isDerived = 1, f);
  var propSetterCache = {};
  var tagsNS = (ns) => new Proxy((name, ...args) => {
    let [props, ...children] = protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args];
    let dom = ns ? doc.createElementNS(ns, name) : doc.createElement(name);
    for (let [k, v] of Obj.entries(props)) {
      let getPropDescriptor = (proto) => proto ? Obj.getOwnPropertyDescriptor(proto, k) ?? getPropDescriptor(protoOf(proto)) : _undefined;
      let cacheKey = name + "," + k;
      let propSetter = propSetterCache[cacheKey] ?? (propSetterCache[cacheKey] = getPropDescriptor(protoOf(dom))?.set ?? 0);
      let setter = propSetter ? propSetter.bind(dom) : dom.setAttribute.bind(dom, k);
      if (isState(v))
        bind(() => (setter(v.val), dom));
      else if (protoOf(v ?? 0) === funcProto && (!k.startsWith("on") || v.isDerived))
        bind(() => (setter(v()), dom));
      else
        setter(v);
    }
    return add(dom, ...children);
  }, { get: (tag, name) => tag.bind(_undefined, name) });
  var updateDoms = () => {
    let changedStatesArray = [...changedStates].filter((s) => s._val !== s._oldVal);
    changedStates = _undefined;
    for (let b of new Set(changedStatesArray.flatMap(filterBindings))) {
      let dom = b.dom, newDom = bind(b.f, dom);
      b.dom = _undefined;
      if (newDom !== dom)
        newDom != _undefined ? dom.replaceWith(newDom) : dom.remove();
    }
    for (let s of changedStatesArray)
      s._oldVal = s._val;
  };
  var van_default = { add, "derive": derive, tags: tagsNS(), "tagsNS": tagsNS, state, val, oldVal, effect };

  // van.forbundle.js
  window.van = van_default;
})();
