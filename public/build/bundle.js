
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const createOptions = () => {
        const {subscribe, set } = writable({
            sortable: true,
            pagination: true,
            rowPerPage: 50,
            columnFilter: false,
            scrollY: true,
            css: true,
            labels: {
                search: 'Search...',
                filter: 'Filter',
                noRows: 'No entries to found',
                info: 'Showing {start} to {end} of {rows} entries',
                previous: 'Previous',
                next: 'Next',
            },
            blocks: {
                searchInput: true, 
                paginationButtons: true,
                paginationRowCount: true,
            }
        });
        return {
            subscribe, set, 
            get: () => {
                let $store;
                options.subscribe(store => $store = store);
                return $store
            },
            update: (opt) => {
                opt.labels = opt.labels ? opt.labels : {};
                const labels = {
                    search:   typeof opt.labels.search   === 'string' ? opt.labels.search   : 'Search...',
                    filter:   typeof opt.labels.filter   === 'string' ? opt.labels.filter   : 'Filter',
                    noRows:   typeof opt.labels.noRows   === 'string' ? opt.labels.noRows   : 'No entries to found',
                    info:     typeof opt.labels.info     === 'string' ? opt.labels.info     : 'Showing {start} to {end} of {rows} entries',
                    previous: typeof opt.labels.previous === 'string' ? opt.labels.previous : 'Previous',
                    next:     typeof opt.labels.next     === 'string' ? opt.labels.next     : 'Next',                
                };   
                opt.blocks = opt.blocks ? opt.blocks : {};
                const blocks = {
                    searchInput:        typeof opt.blocks.searchInput        === 'boolean' ? opt.blocks.searchInput        : true, 
                    paginationButtons:  typeof opt.blocks.paginationButtons  === 'boolean' ? opt.blocks.paginationButtons  : true,
                    paginationRowCount: typeof opt.blocks.paginationRowCount === 'boolean' ? opt.blocks.paginationRowCount : true,
                };
                const parsed = {
                    sortable:     typeof opt.sortable     === 'boolean' ? opt.sortable     : true,
                    pagination:   typeof opt.pagination   === 'boolean' ? opt.pagination   : true,
                    rowPerPage:   typeof opt.rowPerPage   === 'number'  ? opt.rowPerPage   : 50,
                    columnFilter: typeof opt.columnFilter === 'boolean' ? opt.columnFilter : false, 
                    scrollY:      typeof opt.scrollY      === 'boolean' ? opt.scrollY      : true, 
                    css:          typeof opt.css          === 'boolean' ? opt.css          : true, 
                    labels: labels,
                    blocks: blocks
                };
                options.set(parsed);
            }
        }
    };
    const options = createOptions();

    const rowCount = writable(0);

    const createPageNumber = () => {
    	const { subscribe, update } = writable(1);
    	return {
    		subscribe, update,
    		set: (number) => update(store => {
    			let $rowPerPage, $rowCount;
    			rowCount.subscribe(store => $rowCount = store);
    			options.subscribe(store => $rowPerPage = store.rowPerPage);
    			if ( number >= 1 && number <= Math.ceil($rowCount / $rowPerPage) ) {
    				store = parseInt(number);
    			}
    			document.querySelector('section.datatable .dt-table').scrollTop = 0;
    			return store
    		})
    	}
    };
    const pageNumber = createPageNumber();

    const datatableWidth = writable(null);

    const createLocal = () => {
    	const { subscribe, update } = writable([]);
    	return {
    		subscribe, update,
    		add: (key, value) => update(store => {
    			const filter = {key: key, value: value}; 
    			store = store.filter(item => { return item.key !== key && item.value.length > 0 });
    			store.push(filter);
    			return store
    		}),
    		remove: () => update(store => [])
    	}
    };
    const local = createLocal();

    const createGlobal = () => {
    	const { subscribe, update } = writable(null);
    	return {
    		subscribe, 
    		set: (value) => update(store => {
    			store = (value.length > 0) ? value : null;
    			return store
    		}),
    		remove: () => update(store => null)
    	}
    };
    const global$1 = createGlobal();

    const createData = () => {
    	const { subscribe, set, update } = writable([]);
    	return {
    		subscribe, set,
    		sortAsc: (key) => update(store => {
    			try {
    				store.sort( (a, b) => key(b).localeCompare(key(a)) );
    			} catch (e) {
    				return store.sort( (a, b) => parseFloat(key(b)) - parseFloat(key(a)))
    			}
    			return store.sort( (a, b) => key(b).localeCompare(key(a)) )
    			
    		}),
    		sortDesc: (key) => update(store => {
    			try {
    				store.sort( (a, b) => key(a).localeCompare(key(b)) );
    			} catch (e) {
    				return store.sort( (a, b) => parseFloat(key(a)) - parseFloat(key(b)))
    			}
    			return store.sort( (a, b) => key(a).localeCompare(key(b)) )
    		}),
    	}
    };
    const data = createData();

    const filtered = derived(
    	[data, global$1, local],
        ([$data, $global, $local]) => {
    		if ($global) {
    			$data = $data.filter( item => {
    				return Object.keys(item).some( k => {
    					return item[k].toString().toLowerCase().indexOf($global.toString().toLowerCase()) > -1
    				})
    			});
    		}
    		if ($local.length > 0) {
    			$local.forEach(filter => {
    				return $data = $data.filter( item => filter.key(item).toString().toLowerCase().indexOf(filter.value.toString().toLowerCase()) > -1)
    			});
    		}
    		rowCount.set($data.length);
    		return $data
    	} 	
    );

    const rows = derived(
    	[filtered, options, pageNumber],
        ([$filtered, $options, $pageNumber]) => {
    		if (!$options.pagination) {
    			return $filtered
    		}
    		return $filtered.slice( ($pageNumber - 1) * $options.rowPerPage, $pageNumber * $options.rowPerPage) 
    	} 
    );

    const createColumns = () => {
    	const { subscribe, set, update } = writable([]);
    	return {
    		subscribe, set, update,
    		get: () => {
    			let $columns;
    			columns.subscribe(store => $columns = store);
    			return $columns
    		},
    		sort: (element, key) => {
    			if (options.get().sortable !== true || typeof key === 'undefined') {
    				return
    			}
    			if (
    				element.classList.contains('sortable') &&
    				element.classList.contains('asc')
    			) {
    				Array.from(element.parentNode.children).forEach((item) =>
    					item.classList.remove('asc', 'desc')
    				);
    				element.classList.add('desc');
    				data.sortDesc(key);
    				pageNumber.set(1);
    			} else {
    				Array.from(element.parentNode.children).forEach((item) =>
    					item.classList.remove('desc', 'asc')
    				);
    				element.classList.add('asc');
    				data.sortAsc(key);
    				pageNumber.set(1);
    			}
    			columns.redraw();
    		},
    		filter: (key, value) => {
    			pageNumber.set(1);
    			local.add(key, value);
    			columns.redraw();
    		},
    		draw: () => {
    			setTimeout(() => {
    				const tbody = document.querySelector('.datatable table tbody tr');
    				if (tbody === null) return
    				const thead = document.querySelectorAll('.dt-header thead tr');
    				const $columns = columns.get();
    				thead.forEach(tr => {
    					let i = 0;
    					Array.from(tbody.children).forEach(td => {
    						let th = tr.children[i];
    						let thW = th.getBoundingClientRect().width;
    						let tdW = td.getBoundingClientRect().width;
    						// let columnMinWidth = parseFloat(columns.get()[i].minWidth.replace('px', ''))
    						if (tdW > thW) { 
    							th.style.minWidth = tdW + 'px';
    							th.style.maxWidth = tdW + 'px';
    							$columns[i].minWidth = tdW;
    						}
    						else {
    							td.style.minWidth = thW + 'px';
    							td.style.maxWidth = thW + 'px';
    							$columns[i].minWidth = thW;
    						} 
    						i++;
    					});
    				});
    			}, 50);	
    		},
    		redraw: () => {
    			if ( options.get().scrollY === false ) {
    				return
    			}
    			setTimeout(() => {
    				const tbody = document.querySelector('.datatable table tbody tr');
    				if (tbody === null) return
    				const thead = document.querySelectorAll('.dt-header thead tr');
    				thead.forEach(tr => {
    					let i = 0;
    					Array.from(tbody.children).forEach(td => {
    						let th = tr.children[i];
    						let thW = th.getBoundingClientRect().width;
    						let tdW = td.getBoundingClientRect().width;
    						let columnMinWidth = parseFloat(columns.get()[i].minWidth);
    						if (tdW > thW || thW > columnMinWidth) { 
    							th.style.minWidth = tdW + 'px';
    							th.style.maxWidth = tdW + 'px';
    						}
    						else {
    							td.style.minWidth = thW + 'px';
    							td.style.maxWidth = thW + 'px';
    						} 
    						i++;
    					});
    				});
    			}, 50);			
    		},
    	}
    };
    const columns = createColumns();

    const datatable = {
        init: () => {
            datatable.resize();
            datatable.addEventScrollX();
            datatable.getColumns();
            new ResizeObserver((mutations) => {
                datatable.resize();
            }).observe(document.querySelector('section.datatable').parentElement);
        },
        reset: () => {
            pageNumber.update(store => 1);
            global$1.remove();
            local.remove();
            columns.set([]);
        },
        setRows: (arr) => {
            arr.forEach( (item) => {
                Object.keys(item).forEach( (k) => {
                    if (item[k] === null) {
                        item[k] = '';
                    }
                });
            });
            data.set(arr);
            return
        },
        getSize: () => {
            const parent = document.querySelector('section.datatable').parentNode;
            const style = getComputedStyle(parent);
            const rect = parent.getBoundingClientRect();
            const getNumber = (pxValue) => { return parseFloat(pxValue.replace('px', ''))  }; 
            return {
                parentWidth: rect.width,
                parentHeight: rect.height,
                width: (rect.width - getNumber(style.paddingLeft) - getNumber(style.paddingRight) - getNumber(style.borderLeftWidth) - getNumber(style.borderRightWidth)) / rect.width,
                height: (rect.height - getNumber(style.paddingTop) - getNumber(style.paddingBottom) - getNumber(style.borderTopWidth) - getNumber(style.borderBottomWidth)) / rect.height,
                top: style.paddingTop,
                right: style.paddingRight,
                bottom: style.paddingBottom,
                left: style.paddingLeft
            }
        },
        resize: () => {
            if ( !document.querySelector('section.datatable') ) return
            const size = datatable.getSize();
            const tableContainer = document.querySelector('section.datatable .dt-table');
            if ( options.get().scrollY ) {
                tableContainer.style.height = datatable.getTableContainerHeight(size.parentHeight * size.height) + 'px';
                columns.redraw();
            }
            datatableWidth.set( size.parentWidth * size.width );
            if (size.parentWidth * size.width < document.querySelector('section.datatable table').offsetWidth) {
                tableContainer.style.overflowX = 'auto';
            }
        },
        getTableContainerHeight: (height) => {
            let paginationBlock;
            if (options.get().pagination && (options.get().blocks.paginationButtons || options.get().blocks.paginationRowCount)) {
                paginationBlock = true;
            }
            const calc = [
                (options.get().blocks.searchInput) ? document.querySelector('.datatable .dt-search').getBoundingClientRect().height : 0,
                (paginationBlock) ? document.querySelector('.datatable .dt-pagination').getBoundingClientRect().height : 0
            ];
            const sum = (a, b) => a + b;
            document.querySelector('section.datatable .dt-table').style.height = height - calc.reduce(sum) + 'px';
        },
        addEventScrollX: () => {
            if ( options.get().scrollY ) {
                document.querySelector('section.datatable .dt-table').addEventListener('scroll', (e) => {
                    document.querySelector('.dt-header').style.left = (-1 * e.target.scrollLeft) + 'px';
                });
            }
        },
        getColumns: () => {
            const columnList = [];
            let i = 0;
            document.querySelectorAll('.datatable table thead th').forEach(th => {
                columnList.push({
                    index: i,
                    html: th.innerHTML,
                    key: datatable.getKey(th.dataset.key),
                    sort: null,
                    classList: th.classList,
                    minWidth: th.getBoundingClientRect().width
                });
                th.addEventListener('click', (e) => {
                    columns.sort(e.target, datatable.getKey(th.dataset.key));
                }, true);
                i++;
            });
            columns.set(columnList);
        },
        getKey: (key) => {
            if (!key)  return 
            if (key && key.indexOf('=>') > 0) {
                return new Function(`'use strict';return (${key})`)()
            }
            return (x) => x[key]
        },
    };

    /* node_modules\svelte-simple-datatables\src\SearchInput.svelte generated by Svelte v3.38.2 */
    const file$7 = "node_modules\\svelte-simple-datatables\\src\\SearchInput.svelte";

    function create_fragment$7(ctx) {
    	let input;
    	let input_class_value;
    	let input_placeholder_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*classList*/ ctx[1]) + " svelte-1kn6xvh"));
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", input_placeholder_value = /*$options*/ ctx[2].labels.search);
    			attr_dev(input, "ref", /*ref*/ ctx[0]);
    			toggle_class(input, "css", /*$options*/ ctx[2].css);
    			add_location(input, file$7, 14, 0, 403);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*classList*/ 2 && input_class_value !== (input_class_value = "" + (null_to_empty(/*classList*/ ctx[1]) + " svelte-1kn6xvh"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*$options*/ 4 && input_placeholder_value !== (input_placeholder_value = /*$options*/ ctx[2].labels.search)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}

    			if (dirty & /*ref*/ 1) {
    				attr_dev(input, "ref", /*ref*/ ctx[0]);
    			}

    			if (dirty & /*classList, $options*/ 6) {
    				toggle_class(input, "css", /*$options*/ ctx[2].css);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $options;
    	validate_store(options, "options");
    	component_subscribe($$self, options, $$value => $$invalidate(2, $options = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SearchInput", slots, []);
    	let { ref = "" } = $$props;
    	let { classList = "" } = $$props;

    	const search = value => {
    		pageNumber.set(1);
    		global$1.set(value);
    		columns.redraw();
    	};

    	const writable_props = ["ref", "classList"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SearchInput> was created with unknown prop '${key}'`);
    	});

    	const input_handler = e => search(e.target.value);

    	$$self.$$set = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("classList" in $$props) $$invalidate(1, classList = $$props.classList);
    	};

    	$$self.$capture_state = () => ({
    		options,
    		pageNumber,
    		columns,
    		global: global$1,
    		ref,
    		classList,
    		search,
    		$options
    	});

    	$$self.$inject_state = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("classList" in $$props) $$invalidate(1, classList = $$props.classList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ref, classList, $options, search, input_handler];
    }

    class SearchInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { ref: 0, classList: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchInput",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get ref() {
    		throw new Error("<SearchInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<SearchInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classList() {
    		throw new Error("<SearchInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classList(value) {
    		throw new Error("<SearchInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-simple-datatables\src\components\Search.svelte generated by Svelte v3.38.2 */
    const file$6 = "node_modules\\svelte-simple-datatables\\src\\components\\Search.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let searchinput;
    	let current;
    	searchinput = new SearchInput({ $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(searchinput.$$.fragment);
    			attr_dev(section, "class", "dt-search svelte-11nchoy");
    			toggle_class(section, "css", /*$options*/ ctx[0].css);
    			add_location(section, file$6, 5, 0, 128);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(searchinput, section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$options*/ 1) {
    				toggle_class(section, "css", /*$options*/ ctx[0].css);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(searchinput);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $options;
    	validate_store(options, "options");
    	component_subscribe($$self, options, $$value => $$invalidate(0, $options = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Search", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ SearchInput, options, $options });
    	return [$options];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* node_modules\svelte-simple-datatables\src\PaginationRowCount.svelte generated by Svelte v3.38.2 */
    const file$5 = "node_modules\\svelte-simple-datatables\\src\\PaginationRowCount.svelte";

    // (19:4) {:else}
    function create_else_block_1(ctx) {
    	let html_tag;
    	let raw_value = `<b>${/*start*/ ctx[0]}</b>-<b>${/*end*/ ctx[2]}</b>/<b>${/*rows*/ ctx[3]}</b>` + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*start, end, rows*/ 13 && raw_value !== (raw_value = `<b>${/*start*/ ctx[0]}</b>-<b>${/*end*/ ctx[2]}</b>/<b>${/*rows*/ ctx[3]}</b>` + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(19:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if $datatableWidth > 600}
    function create_if_block$4(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*rows*/ ctx[3] > 0) return create_if_block_1$4;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(13:4) {#if $datatableWidth > 600}",
    		ctx
    	});

    	return block;
    }

    // (16:8) {:else}
    function create_else_block$2(ctx) {
    	let html_tag;
    	let raw_value = /*$options*/ ctx[1].labels.noRows + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$options*/ 2 && raw_value !== (raw_value = /*$options*/ ctx[1].labels.noRows + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(16:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if rows > 0}
    function create_if_block_1$4(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(/*info*/ ctx[4], target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*info*/ 16) html_tag.p(/*info*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(14:8) {#if rows > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let aside;

    	function select_block_type(ctx, dirty) {
    		if (/*$datatableWidth*/ ctx[5] > 600) return create_if_block$4;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			if_block.c();
    			attr_dev(aside, "class", "dt-pagination-rowcount svelte-jt0h2f");
    			toggle_class(aside, "css", /*$options*/ ctx[1].css);
    			add_location(aside, file$5, 11, 0, 470);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			if_block.m(aside, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(aside, null);
    				}
    			}

    			if (dirty & /*$options*/ 2) {
    				toggle_class(aside, "css", /*$options*/ ctx[1].css);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let start;
    	let end;
    	let rows;
    	let info;
    	let $pageNumber;
    	let $options;
    	let $rowCount;
    	let $datatableWidth;
    	validate_store(pageNumber, "pageNumber");
    	component_subscribe($$self, pageNumber, $$value => $$invalidate(6, $pageNumber = $$value));
    	validate_store(options, "options");
    	component_subscribe($$self, options, $$value => $$invalidate(1, $options = $$value));
    	validate_store(rowCount, "rowCount");
    	component_subscribe($$self, rowCount, $$value => $$invalidate(7, $rowCount = $$value));
    	validate_store(datatableWidth, "datatableWidth");
    	component_subscribe($$self, datatableWidth, $$value => $$invalidate(5, $datatableWidth = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PaginationRowCount", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PaginationRowCount> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		options,
    		pageNumber,
    		rowCount,
    		datatableWidth,
    		start,
    		$pageNumber,
    		$options,
    		end,
    		$rowCount,
    		rows,
    		info,
    		$datatableWidth
    	});

    	$$self.$inject_state = $$props => {
    		if ("start" in $$props) $$invalidate(0, start = $$props.start);
    		if ("end" in $$props) $$invalidate(2, end = $$props.end);
    		if ("rows" in $$props) $$invalidate(3, rows = $$props.rows);
    		if ("info" in $$props) $$invalidate(4, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$pageNumber, $options*/ 66) {
    			$$invalidate(0, start = $pageNumber * $options.rowPerPage - $options.rowPerPage + 1);
    		}

    		if ($$self.$$.dirty & /*$pageNumber, $options, $rowCount*/ 194) {
    			$$invalidate(2, end = Math.min($pageNumber * $options.rowPerPage, $rowCount));
    		}

    		if ($$self.$$.dirty & /*$rowCount*/ 128) {
    			$$invalidate(3, rows = $rowCount);
    		}

    		if ($$self.$$.dirty & /*$options, start, end, rows*/ 15) {
    			$$invalidate(4, info = $options.labels.info.replace("{start}", `<b>${start}</b>`).replace("{end}", `<b>${end}</b>`).replace("{rows}", `<b>${rows}</b>`));
    		}
    	};

    	return [start, $options, end, rows, info, $datatableWidth, $pageNumber, $rowCount];
    }

    class PaginationRowCount extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PaginationRowCount",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* node_modules\svelte-simple-datatables\src\PaginationButtons.svelte generated by Svelte v3.38.2 */
    const file$4 = "node_modules\\svelte-simple-datatables\\src\\PaginationButtons.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    // (70:0) {:else}
    function create_else_block$1(ctx) {
    	let section;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let section_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			button0 = element("button");
    			button0.textContent = "❬❬";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "❮";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "❯";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "❭❭";
    			attr_dev(button0, "class", "svelte-9qvh1i");
    			toggle_class(button0, "disabled", /*$pageNumber*/ ctx[4] === 1);
    			add_location(button0, file$4, 71, 8, 2390);
    			attr_dev(button1, "class", "svelte-9qvh1i");
    			toggle_class(button1, "disabled", /*$pageNumber*/ ctx[4] === 1);
    			add_location(button1, file$4, 72, 8, 2496);
    			attr_dev(button2, "class", "svelte-9qvh1i");
    			toggle_class(button2, "disabled", /*$pageNumber*/ ctx[4] === /*pageCount*/ ctx[2].length);
    			add_location(button2, file$4, 73, 8, 2608);
    			attr_dev(button3, "class", "svelte-9qvh1i");
    			toggle_class(button3, "disabled", /*$pageNumber*/ ctx[4] === /*pageCount*/ ctx[2].length);
    			add_location(button3, file$4, 74, 8, 2736);
    			attr_dev(section, "class", section_class_value = "dt-pagination-buttons mobile " + /*classList*/ ctx[1] + " svelte-9qvh1i");
    			toggle_class(section, "css", /*$options*/ ctx[3].css);
    			add_location(section, file$4, 70, 4, 2297);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, button0);
    			append_dev(section, t1);
    			append_dev(section, button1);
    			append_dev(section, t3);
    			append_dev(section, button2);
    			append_dev(section, t5);
    			append_dev(section, button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_5*/ ctx[14], false, false, false),
    					listen_dev(button1, "click", /*click_handler_6*/ ctx[15], false, false, false),
    					listen_dev(button2, "click", /*click_handler_7*/ ctx[16], false, false, false),
    					listen_dev(button3, "click", /*click_handler_8*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$pageNumber*/ 16) {
    				toggle_class(button0, "disabled", /*$pageNumber*/ ctx[4] === 1);
    			}

    			if (dirty & /*$pageNumber*/ 16) {
    				toggle_class(button1, "disabled", /*$pageNumber*/ ctx[4] === 1);
    			}

    			if (dirty & /*$pageNumber, pageCount*/ 20) {
    				toggle_class(button2, "disabled", /*$pageNumber*/ ctx[4] === /*pageCount*/ ctx[2].length);
    			}

    			if (dirty & /*$pageNumber, pageCount*/ 20) {
    				toggle_class(button3, "disabled", /*$pageNumber*/ ctx[4] === /*pageCount*/ ctx[2].length);
    			}

    			if (dirty & /*classList*/ 2 && section_class_value !== (section_class_value = "dt-pagination-buttons mobile " + /*classList*/ ctx[1] + " svelte-9qvh1i")) {
    				attr_dev(section, "class", section_class_value);
    			}

    			if (dirty & /*classList, $options*/ 10) {
    				toggle_class(section, "css", /*$options*/ ctx[3].css);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(70:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:0) {#if $datatableWidth > 600}
    function create_if_block$3(ctx) {
    	let section;
    	let button0;
    	let raw0_value = /*$options*/ ctx[3].labels.previous + "";
    	let t0;
    	let button1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let button2;
    	let raw1_value = /*$options*/ ctx[3].labels.next + "";
    	let section_class_value;
    	let mounted;
    	let dispose;
    	let if_block0 = /*pageCount*/ ctx[2].length > 6 && /*$pageNumber*/ ctx[4] >= 5 && create_if_block_4(ctx);
    	let each_value = /*buttons*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	let if_block1 = /*pageCount*/ ctx[2].length > 6 && /*$pageNumber*/ ctx[4] <= /*pageCount*/ ctx[2].length - 3 && create_if_block_2$2(ctx);
    	let if_block2 = /*pageCount*/ ctx[2].length > 1 && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			button0 = element("button");
    			t0 = space();
    			button1 = element("button");
    			button1.textContent = "1";
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			button2 = element("button");
    			attr_dev(button0, "class", "text svelte-9qvh1i");
    			toggle_class(button0, "disabled", /*$pageNumber*/ ctx[4] === 1);
    			add_location(button0, file$4, 26, 8, 905);
    			attr_dev(button1, "class", "svelte-9qvh1i");
    			toggle_class(button1, "active", /*$pageNumber*/ ctx[4] === 1);
    			add_location(button1, file$4, 33, 8, 1128);
    			attr_dev(button2, "class", "text svelte-9qvh1i");
    			toggle_class(button2, "disabled", /*$pageNumber*/ ctx[4] === /*pageCount*/ ctx[2].length);
    			add_location(button2, file$4, 61, 8, 2042);
    			attr_dev(section, "class", section_class_value = "dt-pagination-buttons " + /*classList*/ ctx[1] + " svelte-9qvh1i");
    			attr_dev(section, "ref", /*ref*/ ctx[0]);
    			toggle_class(section, "css", /*$options*/ ctx[3].css);
    			add_location(section, file$4, 25, 4, 813);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, button0);
    			button0.innerHTML = raw0_value;
    			append_dev(section, t0);
    			append_dev(section, button1);
    			append_dev(section, t2);
    			if (if_block0) if_block0.m(section, null);
    			append_dev(section, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			append_dev(section, t4);
    			if (if_block1) if_block1.m(section, null);
    			append_dev(section, t5);
    			if (if_block2) if_block2.m(section, null);
    			append_dev(section, t6);
    			append_dev(section, button2);
    			button2.innerHTML = raw1_value;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false),
    					listen_dev(button2, "click", /*click_handler_4*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$options*/ 8 && raw0_value !== (raw0_value = /*$options*/ ctx[3].labels.previous + "")) button0.innerHTML = raw0_value;
    			if (dirty & /*$pageNumber*/ 16) {
    				toggle_class(button0, "disabled", /*$pageNumber*/ ctx[4] === 1);
    			}

    			if (dirty & /*$pageNumber*/ 16) {
    				toggle_class(button1, "active", /*$pageNumber*/ ctx[4] === 1);
    			}

    			if (/*pageCount*/ ctx[2].length > 6 && /*$pageNumber*/ ctx[4] >= 5) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(section, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*$pageNumber, buttons, setPage, pageCount*/ 180) {
    				each_value = /*buttons*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(section, t4);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*pageCount*/ ctx[2].length > 6 && /*$pageNumber*/ ctx[4] <= /*pageCount*/ ctx[2].length - 3) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					if_block1.m(section, t5);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*pageCount*/ ctx[2].length > 1) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$3(ctx);
    					if_block2.c();
    					if_block2.m(section, t6);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*$options*/ 8 && raw1_value !== (raw1_value = /*$options*/ ctx[3].labels.next + "")) button2.innerHTML = raw1_value;
    			if (dirty & /*$pageNumber, pageCount*/ 20) {
    				toggle_class(button2, "disabled", /*$pageNumber*/ ctx[4] === /*pageCount*/ ctx[2].length);
    			}

    			if (dirty & /*classList*/ 2 && section_class_value !== (section_class_value = "dt-pagination-buttons " + /*classList*/ ctx[1] + " svelte-9qvh1i")) {
    				attr_dev(section, "class", section_class_value);
    			}

    			if (dirty & /*ref*/ 1) {
    				attr_dev(section, "ref", /*ref*/ ctx[0]);
    			}

    			if (dirty & /*classList, $options*/ 10) {
    				toggle_class(section, "css", /*$options*/ ctx[3].css);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(25:0) {#if $datatableWidth > 600}",
    		ctx
    	});

    	return block;
    }

    // (37:8) {#if pageCount.length > 6 && $pageNumber >= 5}
    function create_if_block_4(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "...";
    			attr_dev(button, "class", "ellipse svelte-9qvh1i");
    			add_location(button, file$4, 37, 12, 1303);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(37:8) {#if pageCount.length > 6 && $pageNumber >= 5}",
    		ctx
    	});

    	return block;
    }

    // (42:12) {#if n > 0 && n < pageCount.length - 1}
    function create_if_block_3(ctx) {
    	let button;
    	let t_value = /*n*/ ctx[19] + 1 + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[11](/*n*/ ctx[19]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-9qvh1i");
    			toggle_class(button, "active", /*$pageNumber*/ ctx[4] === /*n*/ ctx[19] + 1);
    			add_location(button, file$4, 42, 12, 1453);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*buttons*/ 32 && t_value !== (t_value = /*n*/ ctx[19] + 1 + "")) set_data_dev(t, t_value);

    			if (dirty & /*$pageNumber, buttons*/ 48) {
    				toggle_class(button, "active", /*$pageNumber*/ ctx[4] === /*n*/ ctx[19] + 1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(42:12) {#if n > 0 && n < pageCount.length - 1}",
    		ctx
    	});

    	return block;
    }

    // (41:8) {#each buttons as n}
    function create_each_block$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*n*/ ctx[19] > 0 && /*n*/ ctx[19] < /*pageCount*/ ctx[2].length - 1 && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*n*/ ctx[19] > 0 && /*n*/ ctx[19] < /*pageCount*/ ctx[2].length - 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(41:8) {#each buttons as n}",
    		ctx
    	});

    	return block;
    }

    // (52:8) {#if pageCount.length > 6 && $pageNumber <= pageCount.length - 3}
    function create_if_block_2$2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "...";
    			attr_dev(button, "class", "ellipse svelte-9qvh1i");
    			add_location(button, file$4, 52, 12, 1754);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(52:8) {#if pageCount.length > 6 && $pageNumber <= pageCount.length - 3}",
    		ctx
    	});

    	return block;
    }

    // (56:8) {#if pageCount.length > 1}
    function create_if_block_1$3(ctx) {
    	let button;
    	let t_value = /*pageCount*/ ctx[2].length + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-9qvh1i");
    			toggle_class(button, "active", /*$pageNumber*/ ctx[4] === /*pageCount*/ ctx[2].length);
    			add_location(button, file$4, 56, 12, 1857);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pageCount*/ 4 && t_value !== (t_value = /*pageCount*/ ctx[2].length + "")) set_data_dev(t, t_value);

    			if (dirty & /*$pageNumber, pageCount*/ 20) {
    				toggle_class(button, "active", /*$pageNumber*/ ctx[4] === /*pageCount*/ ctx[2].length);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(56:8) {#if pageCount.length > 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*$datatableWidth*/ ctx[6] > 600) return create_if_block$3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let pageCount;
    	let buttons;
    	let $rowCount;
    	let $options;
    	let $pageNumber;
    	let $datatableWidth;
    	validate_store(rowCount, "rowCount");
    	component_subscribe($$self, rowCount, $$value => $$invalidate(8, $rowCount = $$value));
    	validate_store(options, "options");
    	component_subscribe($$self, options, $$value => $$invalidate(3, $options = $$value));
    	validate_store(pageNumber, "pageNumber");
    	component_subscribe($$self, pageNumber, $$value => $$invalidate(4, $pageNumber = $$value));
    	validate_store(datatableWidth, "datatableWidth");
    	component_subscribe($$self, datatableWidth, $$value => $$invalidate(6, $datatableWidth = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PaginationButtons", slots, []);
    	let { ref = "" } = $$props;
    	let { classList = "" } = $$props;

    	const slice = (arr, page) => {
    		if (page < 5) {
    			return arr.slice(0, 5);
    		} else if (page > arr.length - 4) {
    			return arr.slice(arr.length - 5, arr.length);
    		}

    		return arr.slice(page - 2, page + 1);
    	};

    	const setPage = number => {
    		pageNumber.set(number);
    		columns.redraw();
    	};

    	const writable_props = ["ref", "classList"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PaginationButtons> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => setPage($pageNumber - 1);
    	const click_handler_1 = () => setPage(1);
    	const click_handler_2 = n => setPage(n + 1);
    	const click_handler_3 = () => setPage(pageCount.length);
    	const click_handler_4 = () => setPage($pageNumber + 1);
    	const click_handler_5 = () => setPage(1);
    	const click_handler_6 = () => setPage($pageNumber - 1);
    	const click_handler_7 = () => setPage($pageNumber + 1);
    	const click_handler_8 = () => setPage(pageCount.length);

    	$$self.$$set = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("classList" in $$props) $$invalidate(1, classList = $$props.classList);
    	};

    	$$self.$capture_state = () => ({
    		options,
    		rowCount,
    		pageNumber,
    		datatableWidth,
    		columns,
    		ref,
    		classList,
    		slice,
    		setPage,
    		pageCount,
    		$rowCount,
    		$options,
    		buttons,
    		$pageNumber,
    		$datatableWidth
    	});

    	$$self.$inject_state = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("classList" in $$props) $$invalidate(1, classList = $$props.classList);
    		if ("pageCount" in $$props) $$invalidate(2, pageCount = $$props.pageCount);
    		if ("buttons" in $$props) $$invalidate(5, buttons = $$props.buttons);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$rowCount, $options*/ 264) {
    			$$invalidate(2, pageCount = Array.from(Array(Math.ceil($rowCount / $options.rowPerPage)).keys()));
    		}

    		if ($$self.$$.dirty & /*pageCount, $pageNumber*/ 20) {
    			$$invalidate(5, buttons = slice(pageCount, $pageNumber));
    		}
    	};

    	return [
    		ref,
    		classList,
    		pageCount,
    		$options,
    		$pageNumber,
    		buttons,
    		$datatableWidth,
    		setPage,
    		$rowCount,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8
    	];
    }

    class PaginationButtons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { ref: 0, classList: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PaginationButtons",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get ref() {
    		throw new Error("<PaginationButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<PaginationButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classList() {
    		throw new Error("<PaginationButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classList(value) {
    		throw new Error("<PaginationButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-simple-datatables\src\components\Pagination.svelte generated by Svelte v3.38.2 */
    const file$3 = "node_modules\\svelte-simple-datatables\\src\\components\\Pagination.svelte";

    // (7:0) {#if $options.pagination && ($options.blocks.paginationRowCount || $options.blocks.paginationButtons)}
    function create_if_block$2(ctx) {
    	let section;
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block_2$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$options*/ ctx[0].blocks.paginationRowCount) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*$options*/ ctx[0].blocks.paginationButtons && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(section, "class", "dt-pagination svelte-195bjyp");
    			toggle_class(section, "css", /*$options*/ ctx[0].css);
    			add_location(section, file$3, 7, 4, 315);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			if_blocks[current_block_type_index].m(section, null);
    			append_dev(section, t);
    			if (if_block1) if_block1.m(section, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(section, t);
    			}

    			if (/*$options*/ ctx[0].blocks.paginationButtons) {
    				if (if_block1) {
    					if (dirty & /*$options*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(section, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*$options*/ 1) {
    				toggle_class(section, "css", /*$options*/ ctx[0].css);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(7:0) {#if $options.pagination && ($options.blocks.paginationRowCount || $options.blocks.paginationButtons)}",
    		ctx
    	});

    	return block;
    }

    // (11:8) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$3, 11, 12, 488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(11:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (9:8) {#if $options.blocks.paginationRowCount}
    function create_if_block_2$1(ctx) {
    	let paginationrowcount;
    	let current;
    	paginationrowcount = new PaginationRowCount({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(paginationrowcount.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(paginationrowcount, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(paginationrowcount.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(paginationrowcount.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(paginationrowcount, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(9:8) {#if $options.blocks.paginationRowCount}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if $options.blocks.paginationButtons}
    function create_if_block_1$2(ctx) {
    	let paginationbuttons;
    	let current;
    	paginationbuttons = new PaginationButtons({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(paginationbuttons.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(paginationbuttons, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(paginationbuttons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(paginationbuttons.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(paginationbuttons, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(14:8) {#if $options.blocks.paginationButtons}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$options*/ ctx[0].pagination && (/*$options*/ ctx[0].blocks.paginationRowCount || /*$options*/ ctx[0].blocks.paginationButtons) && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$options*/ ctx[0].pagination && (/*$options*/ ctx[0].blocks.paginationRowCount || /*$options*/ ctx[0].blocks.paginationButtons)) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$options*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $options;
    	validate_store(options, "options");
    	component_subscribe($$self, options, $$value => $$invalidate(0, $options = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Pagination", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pagination> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		PaginationRowCount,
    		PaginationButtons,
    		options,
    		$options
    	});

    	return [$options];
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pagination",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const header = {
        removeOriginalThead: () => {
            setTimeout(() => {
                const thead = document.querySelector('.datatable table thead');
                const originHeight = thead.getBoundingClientRect().height;
                // const tableContainer = document.querySelector('section.datatable .dt-table')
                // const scrollXHeight = tableContainer.offsetHeight - tableContainer.clientHeight
                // - (scrollXHeight > 5 ? scrollXHeight + 10 : 1)
                thead.parentNode.style.marginTop = '-' + (originHeight) + 'px';
                thead.style.visibility = 'hidden';
            }, 50);
        },
        getOrginalTHeadClassList: () => {
            return document.querySelector('.datatable table thead').classList
        },
    };

    /* node_modules\svelte-simple-datatables\src\components\StickyHeader.svelte generated by Svelte v3.38.2 */
    const file$2 = "node_modules\\svelte-simple-datatables\\src\\components\\StickyHeader.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (17:12) {#each $columns as th}
    function create_each_block_1(ctx) {
    	let th;
    	let html_tag;
    	let raw_value = /*th*/ ctx[5].html + "";
    	let span;
    	let t;
    	let th_class_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*th*/ ctx[5], ...args);
    	}

    	const block = {
    		c: function create() {
    			th = element("th");
    			span = element("span");
    			t = space();
    			html_tag = new HtmlTag(span);
    			attr_dev(span, "class", "svelte-1sonwgi");
    			add_location(span, file$2, 24, 35, 911);
    			attr_dev(th, "nowrap", "");
    			set_style(th, "min-width", /*th*/ ctx[5].minWidth + "px");
    			attr_dev(th, "class", th_class_value = "" + (null_to_empty(/*th*/ ctx[5].classList) + " svelte-1sonwgi"));
    			toggle_class(th, "sortable", /*th*/ ctx[5].key && /*$options*/ ctx[1].sortable === true);
    			add_location(th, file$2, 17, 16, 582);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			html_tag.m(raw_value, th);
    			append_dev(th, span);
    			append_dev(th, t);

    			if (!mounted) {
    				dispose = listen_dev(th, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$columns*/ 4 && raw_value !== (raw_value = /*th*/ ctx[5].html + "")) html_tag.p(raw_value);

    			if (dirty & /*$columns*/ 4) {
    				set_style(th, "min-width", /*th*/ ctx[5].minWidth + "px");
    			}

    			if (dirty & /*$columns*/ 4 && th_class_value !== (th_class_value = "" + (null_to_empty(/*th*/ ctx[5].classList) + " svelte-1sonwgi"))) {
    				attr_dev(th, "class", th_class_value);
    			}

    			if (dirty & /*$columns, $columns, $options*/ 6) {
    				toggle_class(th, "sortable", /*th*/ ctx[5].key && /*$options*/ ctx[1].sortable === true);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(17:12) {#each $columns as th}",
    		ctx
    	});

    	return block;
    }

    // (29:8) {#if $options.columnFilter === true}
    function create_if_block$1(ctx) {
    	let tr;
    	let each_value = /*$columns*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(tr, file$2, 29, 12, 1038);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$columns, $options, columns*/ 6) {
    				each_value = /*$columns*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(29:8) {#if $options.columnFilter === true}",
    		ctx
    	});

    	return block;
    }

    // (33:24) {#if th.key}
    function create_if_block_1$1(ctx) {
    	let input;
    	let input_placeholder_value;
    	let mounted;
    	let dispose;

    	function input_handler(...args) {
    		return /*input_handler*/ ctx[4](/*th*/ ctx[5], ...args);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", input_placeholder_value = /*$options*/ ctx[1].labels.filter);
    			attr_dev(input, "class", "browser-default svelte-1sonwgi");
    			add_location(input, file$2, 33, 28, 1229);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$options*/ 2 && input_placeholder_value !== (input_placeholder_value = /*$options*/ ctx[1].labels.filter)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(33:24) {#if th.key}",
    		ctx
    	});

    	return block;
    }

    // (31:16) {#each $columns as th}
    function create_each_block$1(ctx) {
    	let th;
    	let t;
    	let if_block = /*th*/ ctx[5].key && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			th = element("th");
    			if (if_block) if_block.c();
    			t = space();
    			attr_dev(th, "class", "filter svelte-1sonwgi");
    			set_style(th, "width", /*th*/ ctx[5].width);
    			set_style(th, "height", "25px");
    			add_location(th, file$2, 31, 20, 1104);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			if (if_block) if_block.m(th, null);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (/*th*/ ctx[5].key) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(th, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$columns*/ 4) {
    				set_style(th, "width", /*th*/ ctx[5].width);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(31:16) {#each $columns as th}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let section;
    	let thead;
    	let tr;
    	let t;
    	let thead_class_value;
    	let each_value_1 = /*$columns*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*$options*/ ctx[1].columnFilter === true && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			add_location(tr, file$2, 15, 8, 524);
    			attr_dev(thead, "class", thead_class_value = "" + (null_to_empty(/*theadClassList*/ ctx[0]) + " svelte-1sonwgi"));
    			add_location(thead, file$2, 14, 4, 484);
    			attr_dev(section, "class", "dt-header svelte-1sonwgi");
    			toggle_class(section, "sortable", /*$options*/ ctx[1].sortable === true);
    			toggle_class(section, "css", /*$options*/ ctx[1].css);
    			add_location(section, file$2, 13, 0, 382);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, thead);
    			append_dev(thead, tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(thead, t);
    			if (if_block) if_block.m(thead, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$columns, $options, columns*/ 6) {
    				each_value_1 = /*$columns*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*$options*/ ctx[1].columnFilter === true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(thead, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*theadClassList*/ 1 && thead_class_value !== (thead_class_value = "" + (null_to_empty(/*theadClassList*/ ctx[0]) + " svelte-1sonwgi"))) {
    				attr_dev(thead, "class", thead_class_value);
    			}

    			if (dirty & /*$options*/ 2) {
    				toggle_class(section, "sortable", /*$options*/ ctx[1].sortable === true);
    			}

    			if (dirty & /*$options*/ 2) {
    				toggle_class(section, "css", /*$options*/ ctx[1].css);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $options;
    	let $columns;
    	validate_store(options, "options");
    	component_subscribe($$self, options, $$value => $$invalidate(1, $options = $$value));
    	validate_store(columns, "columns");
    	component_subscribe($$self, columns, $$value => $$invalidate(2, $columns = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StickyHeader", slots, []);
    	let theadClassList;

    	onMount(() => {
    		columns.draw();
    		header.removeOriginalThead();
    		$$invalidate(0, theadClassList = header.getOrginalTHeadClassList());
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StickyHeader> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (th, e) => columns.sort(e.target, th.key);
    	const input_handler = (th, e) => columns.filter(th.key, e.target.value);

    	$$self.$capture_state = () => ({
    		options,
    		columns,
    		header,
    		onMount,
    		theadClassList,
    		$options,
    		$columns
    	});

    	$$self.$inject_state = $$props => {
    		if ("theadClassList" in $$props) $$invalidate(0, theadClassList = $$props.theadClassList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [theadClassList, $options, $columns, click_handler, input_handler];
    }

    class StickyHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StickyHeader",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* node_modules\svelte-simple-datatables\src\Datatable.svelte generated by Svelte v3.38.2 */
    const file$1 = "node_modules\\svelte-simple-datatables\\src\\Datatable.svelte";

    // (20:1) {#if $options.blocks.searchInput === true}
    function create_if_block_2(ctx) {
    	let search;
    	let current;
    	search = new Search({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(search.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(search, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(search, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(20:1) {#if $options.blocks.searchInput === true}",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#if $options.scrollY}
    function create_if_block_1(ctx) {
    	let stickyheader;
    	let current;
    	stickyheader = new StickyHeader({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(stickyheader.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stickyheader, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stickyheader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stickyheader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(stickyheader, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(24:2) {#if $options.scrollY}",
    		ctx
    	});

    	return block;
    }

    // (31:1) {#if $options.blocks.paginationRowCount === true || $options.blocks.paginationButtons === true}
    function create_if_block(ctx) {
    	let pagination;
    	let current;
    	pagination = new Pagination({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(pagination.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pagination, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagination.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagination.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pagination, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(31:1) {#if $options.blocks.paginationRowCount === true || $options.blocks.paginationButtons === true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section;
    	let t0;
    	let article;
    	let t1;
    	let table;
    	let t2;
    	let section_class_value;
    	let current;
    	let if_block0 = /*$options*/ ctx[1].blocks.searchInput === true && create_if_block_2(ctx);
    	let if_block1 = /*$options*/ ctx[1].scrollY && create_if_block_1(ctx);
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let if_block2 = (/*$options*/ ctx[1].blocks.paginationRowCount === true || /*$options*/ ctx[1].blocks.paginationButtons === true) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			article = element("article");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			table = element("table");
    			if (default_slot) default_slot.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(table, "class", "svelte-udk322");
    			add_location(table, file$1, 26, 2, 801);
    			attr_dev(article, "class", "dt-table svelte-udk322");
    			add_location(article, file$1, 22, 1, 716);
    			attr_dev(section, "class", section_class_value = "datatable " + /*classList*/ ctx[0] + " svelte-udk322");
    			toggle_class(section, "scroll-y", /*$options*/ ctx[1].scrollY);
    			toggle_class(section, "css", /*$options*/ ctx[1].css);
    			add_location(section, file$1, 18, 0, 548);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			if (if_block0) if_block0.m(section, null);
    			append_dev(section, t0);
    			append_dev(section, article);
    			if (if_block1) if_block1.m(article, null);
    			append_dev(article, t1);
    			append_dev(article, table);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			append_dev(section, t2);
    			if (if_block2) if_block2.m(section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$options*/ ctx[1].blocks.searchInput === true) {
    				if (if_block0) {
    					if (dirty & /*$options*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(section, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$options*/ ctx[1].scrollY) {
    				if (if_block1) {
    					if (dirty & /*$options*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(article, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			if (/*$options*/ ctx[1].blocks.paginationRowCount === true || /*$options*/ ctx[1].blocks.paginationButtons === true) {
    				if (if_block2) {
    					if (dirty & /*$options*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(section, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*classList*/ 1 && section_class_value !== (section_class_value = "datatable " + /*classList*/ ctx[0] + " svelte-udk322")) {
    				attr_dev(section, "class", section_class_value);
    			}

    			if (dirty & /*classList, $options*/ 3) {
    				toggle_class(section, "scroll-y", /*$options*/ ctx[1].scrollY);
    			}

    			if (dirty & /*classList, $options*/ 3) {
    				toggle_class(section, "css", /*$options*/ ctx[1].css);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(default_slot, local);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(default_slot, local);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $options;
    	validate_store(options, "options");
    	component_subscribe($$self, options, $$value => $$invalidate(1, $options = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Datatable", slots, ['default']);
    	let { data = [] } = $$props;
    	let { settings = {} } = $$props;
    	let { classList = "" } = $$props;
    	onMount(() => datatable.init());
    	onDestroy(() => datatable.reset());
    	const writable_props = ["data", "settings", "classList"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Datatable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("settings" in $$props) $$invalidate(3, settings = $$props.settings);
    		if ("classList" in $$props) $$invalidate(0, classList = $$props.classList);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		options,
    		datatable,
    		Search,
    		Pagination,
    		StickyHeader,
    		onMount,
    		onDestroy,
    		data,
    		settings,
    		classList,
    		$options
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("settings" in $$props) $$invalidate(3, settings = $$props.settings);
    		if ("classList" in $$props) $$invalidate(0, classList = $$props.classList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, settings*/ 12) {
    			{
    				datatable.setRows(data);
    				options.update(settings);
    			}
    		}
    	};

    	return [classList, $options, data, settings, $$scope, slots];
    }

    class Datatable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 2, settings: 3, classList: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Datatable",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get data() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get settings() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classList() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classList(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios$1 = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios$1.Axios = Axios_1;

    // Factory for creating new instances
    axios$1.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios$1.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios$1.Cancel = Cancel_1;
    axios$1.CancelToken = CancelToken_1;
    axios$1.isCancel = isCancel;

    // Expose all/spread
    axios$1.all = function all(promises) {
      return Promise.all(promises);
    };
    axios$1.spread = spread;

    // Expose isAxiosError
    axios$1.isAxiosError = isAxiosError;

    var axios_1 = axios$1;

    // Allow use of default import syntax in TypeScript
    var _default = axios$1;
    axios_1.default = _default;

    var axios = axios_1;

    /* src\App.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;

    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (130:3) {#each $rows as row1}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*row1*/ ctx[12].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*row1*/ ctx[12].x + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*row1*/ ctx[12].y + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*row1*/ ctx[12].clase + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*row1*/ ctx[12].departamento + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = /*row1*/ ctx[12].distrito + "";
    	let t10;
    	let t11;
    	let td6;
    	let t12_value = /*row1*/ ctx[12].grupo_riesgo + "";
    	let t12;
    	let t13;
    	let td7;
    	let t14_value = /*row1*/ ctx[12].distancia + "";
    	let t14;
    	let t15;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td6 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td7 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			attr_dev(td0, "class", "svelte-1lmjejk");
    			add_location(td0, file, 131, 4, 3359);
    			attr_dev(td1, "class", "svelte-1lmjejk");
    			add_location(td1, file, 132, 4, 3382);
    			attr_dev(td2, "class", "svelte-1lmjejk");
    			add_location(td2, file, 133, 4, 3404);
    			attr_dev(td3, "class", "svelte-1lmjejk");
    			add_location(td3, file, 134, 4, 3426);
    			attr_dev(td4, "class", "svelte-1lmjejk");
    			add_location(td4, file, 135, 4, 3452);
    			attr_dev(td5, "class", "svelte-1lmjejk");
    			add_location(td5, file, 136, 4, 3485);
    			attr_dev(td6, "class", "svelte-1lmjejk");
    			add_location(td6, file, 137, 4, 3514);
    			attr_dev(td7, "class", "svelte-1lmjejk");
    			add_location(td7, file, 138, 4, 3547);
    			add_location(tr, file, 130, 3, 3350);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td6);
    			append_dev(td6, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td7);
    			append_dev(td7, t14);
    			append_dev(tr, t15);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rows*/ 4 && t0_value !== (t0_value = /*row1*/ ctx[12].id + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$rows*/ 4 && t2_value !== (t2_value = /*row1*/ ctx[12].x + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$rows*/ 4 && t4_value !== (t4_value = /*row1*/ ctx[12].y + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$rows*/ 4 && t6_value !== (t6_value = /*row1*/ ctx[12].clase + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*$rows*/ 4 && t8_value !== (t8_value = /*row1*/ ctx[12].departamento + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*$rows*/ 4 && t10_value !== (t10_value = /*row1*/ ctx[12].distrito + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*$rows*/ 4 && t12_value !== (t12_value = /*row1*/ ctx[12].grupo_riesgo + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*$rows*/ 4 && t14_value !== (t14_value = /*row1*/ ctx[12].distancia + "")) set_data_dev(t14, t14_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(130:3) {#each $rows as row1}",
    		ctx
    	});

    	return block;
    }

    // (118:1) <Datatable settings={settings} data={datosTabla}>
    function create_default_slot(ctx) {
    	let thead;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let th5;
    	let t11;
    	let th6;
    	let t13;
    	let th7;
    	let t15;
    	let tbody;
    	let each_value = /*$rows*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			th0 = element("th");
    			th0.textContent = "Vecino";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Edad";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Cod Grupo de Riesgo";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Fabricante";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Departamento";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "Distrito";
    			t11 = space();
    			th6 = element("th");
    			th6.textContent = "Grupo de Riesgo";
    			t13 = space();
    			th7 = element("th");
    			th7.textContent = "Dist. Euclideana";
    			t15 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "data-key", "id");
    			add_location(th0, file, 119, 3, 2964);
    			attr_dev(th1, "data-key", "x");
    			add_location(th1, file, 120, 3, 2997);
    			attr_dev(th2, "data-key", "y");
    			add_location(th2, file, 121, 3, 3027);
    			attr_dev(th3, "data-key", "clase");
    			add_location(th3, file, 122, 3, 3072);
    			attr_dev(th4, "data-key", "departamento");
    			add_location(th4, file, 123, 3, 3112);
    			attr_dev(th5, "data-key", "distrito");
    			add_location(th5, file, 124, 3, 3161);
    			attr_dev(th6, "data-key", "grupo_riesgo");
    			add_location(th6, file, 125, 3, 3202);
    			attr_dev(th7, "data-key", "distancia");
    			add_location(th7, file, 126, 3, 3254);
    			attr_dev(thead, "class", "svelte-1lmjejk");
    			add_location(thead, file, 118, 2, 2953);
    			add_location(tbody, file, 128, 2, 3314);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, th0);
    			append_dev(thead, t1);
    			append_dev(thead, th1);
    			append_dev(thead, t3);
    			append_dev(thead, th2);
    			append_dev(thead, t5);
    			append_dev(thead, th3);
    			append_dev(thead, t7);
    			append_dev(thead, th4);
    			append_dev(thead, t9);
    			append_dev(thead, th5);
    			append_dev(thead, t11);
    			append_dev(thead, th6);
    			append_dev(thead, t13);
    			append_dev(thead, th7);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, tbody, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rows*/ 4) {
    				each_value = /*$rows*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(tbody);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(118:1) <Datatable settings={settings} data={datosTabla}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h2;
    	let t2;
    	let form;
    	let input0;
    	let t3;
    	let p0;
    	let t4;
    	let input1;
    	let t5;
    	let p1;
    	let t6;
    	let input2;
    	let t7;
    	let p2;
    	let t8;
    	let button;
    	let t10;
    	let p3;
    	let t11;
    	let datatable;
    	let t12;
    	let p4;
    	let t13;
    	let p5;
    	let current;
    	let mounted;
    	let dispose;

    	datatable = new Datatable({
    			props: {
    				settings: /*settings*/ ctx[3],
    				data: /*datosTabla*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = `${"Bienvenidos a la interfaz del servicio de KNN!"}!`;
    			t2 = space();
    			form = element("form");
    			input0 = element("input");
    			t3 = space();
    			p0 = element("p");
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			p1 = element("p");
    			t6 = space();
    			input2 = element("input");
    			t7 = space();
    			p2 = element("p");
    			t8 = space();
    			button = element("button");
    			button.textContent = "Ejecutar KNN";
    			t10 = space();
    			p3 = element("p");
    			t11 = space();
    			create_component(datatable.$$.fragment);
    			t12 = space();
    			p4 = element("p");
    			t13 = space();
    			p5 = element("p");
    			add_location(h2, file, 96, 1, 2343);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", "0.001");
    			attr_dev(input0, "class", "form-control svelte-1lmjejk");
    			attr_dev(input0, "placeholder", "Inserte la edad");
    			attr_dev(input0, "width", "10");
    			add_location(input0, file, 99, 1, 2445);
    			add_location(p0, file, 101, 0, 2565);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "0.001");
    			attr_dev(input1, "class", "form-control svelte-1lmjejk");
    			attr_dev(input1, "placeholder", "Inserte el tipo de persona");
    			add_location(input1, file, 103, 1, 2575);
    			add_location(p1, file, 104, 0, 2694);
    			attr_dev(input2, "type", "string");
    			attr_dev(input2, "class", "form-control svelte-1lmjejk");
    			attr_dev(input2, "placeholder", "Inserte la cantidad de vecinos");
    			add_location(input2, file, 107, 1, 2706);
    			add_location(p2, file, 108, 0, 2816);
    			attr_dev(button, "class", "btn-primary");
    			add_location(button, file, 111, 1, 2828);
    			add_location(form, file, 97, 0, 2407);
    			add_location(p3, file, 115, 0, 2891);
    			add_location(p4, file, 145, 0, 3620);
    			add_location(p5, file, 146, 0, 3628);
    			attr_dev(main, "class", "svelte-1lmjejk");
    			add_location(main, file, 95, 0, 2335);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t2);
    			append_dev(main, form);
    			append_dev(form, input0);
    			set_input_value(input0, /*analisis*/ ctx[0].x);
    			append_dev(form, t3);
    			append_dev(form, p0);
    			append_dev(form, t4);
    			append_dev(form, input1);
    			set_input_value(input1, /*analisis*/ ctx[0].y);
    			append_dev(form, t5);
    			append_dev(form, p1);
    			append_dev(form, t6);
    			append_dev(form, input2);
    			set_input_value(input2, /*analisis*/ ctx[0].k);
    			append_dev(form, t7);
    			append_dev(form, p2);
    			append_dev(form, t8);
    			append_dev(form, button);
    			append_dev(main, t10);
    			append_dev(main, p3);
    			append_dev(main, t11);
    			mount_component(datatable, main, null);
    			append_dev(main, t12);
    			append_dev(main, p4);
    			append_dev(main, t13);
    			append_dev(main, p5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(form, "submit", /*onSubmitHandler*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*analisis*/ 1 && to_number(input0.value) !== /*analisis*/ ctx[0].x) {
    				set_input_value(input0, /*analisis*/ ctx[0].x);
    			}

    			if (dirty & /*analisis*/ 1 && to_number(input1.value) !== /*analisis*/ ctx[0].y) {
    				set_input_value(input1, /*analisis*/ ctx[0].y);
    			}

    			if (dirty & /*analisis*/ 1) {
    				set_input_value(input2, /*analisis*/ ctx[0].k);
    			}

    			const datatable_changes = {};
    			if (dirty & /*datosTabla*/ 2) datatable_changes.data = /*datosTabla*/ ctx[1];

    			if (dirty & /*$$scope, $rows*/ 32772) {
    				datatable_changes.$$scope = { dirty, ctx };
    			}

    			datatable.$set(datatable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(datatable);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $rows;
    	validate_store(rows, "rows");
    	component_subscribe($$self, rows, $$value => $$invalidate(2, $rows = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const settings = { columnFilter: true };
    	const settings2 = { columnFilter: false };
    	let analisis = { x: null, y: null, k: "" };

    	//var dataKNN
    	//let data
    	var datosTabla = [];

    	var datosRutas = [];

    	//$: cols = selectedCols.map(key => COLUMNS[key]);
    	const onSubmitHandler = e => {
    		//impedir que se limpie pantalla
    		$$invalidate(1, datosTabla = []);

    		datosRutas = [];
    		e.preventDefault();
    		console.log(analisis);
    		console.log(typeof analisis.k);
    		let strings;

    		if (typeof analisis.k === "string") {
    			console.log("Es un string");
    			strings = analisis.k.split(",");

    			for (let i = 0; i < strings.length; i++) {
    				strings[i] = Number(strings[i]);
    			}

    			$$invalidate(0, analisis.k = strings, analisis);
    		}

    		axios.post(axios.defaults.baseURL + "/api/knn", analisis).then(res => {
    			console.log("Resultados del análisis");
    			console.log(res.data);
    			let data1 = res.data.data;

    			//let data2 = res.clone()
    			procesar_datos(data1);
    		}).catch(err => {
    			console.log("Error:"); //procesar_caminos(data2.data.caminos)
    			console.log(err);
    		});
    	};

    	function procesar_datos(dataKNN) {
    		let datos = {};

    		for (let i = 0; i < dataKNN.length; i++) {
    			datos.id = i + 1;
    			datos.x = dataKNN[i].punto.x;
    			datos.y = dataKNN[i].punto.y;
    			datos.clase = dataKNN[i].punto.clase;
    			datos.distancia = dataKNN[i].distancia;
    			datos.departamento = dataKNN[i].departamento;
    			datos.distrito = dataKNN[i].distrito;
    			datos.grupo_riesgo = dataKNN[i].grupo_riesgo;
    			$$invalidate(1, datosTabla = [...datosTabla, datos]);

    			//document.getElementById('#datatable').reload();
    			//document.getElementById("#datatable").dataTable().fnDraw();
    			//datosTabla = datosTabla
    			datos = {};
    		}

    		console.log(datosTabla);
    	}

    	function procesar_caminos(resKNN) {
    		let rutas = {};

    		for (let i = 0; i < resKNN.length; i++) {
    			for (let j = 0; j < resKNN[i].length; j++) {
    				rutas.nombre = resKNN[i][j].nombre;
    				rutas.conteo = resKNN[i][j].conteo;
    				datosRutas = [...datosRutas, rutas];
    				rutas = {};
    			}
    		}

    		console.log(datosRutas);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		analisis.x = to_number(this.value);
    		$$invalidate(0, analisis);
    	}

    	function input1_input_handler() {
    		analisis.y = to_number(this.value);
    		$$invalidate(0, analisis);
    	}

    	function input2_input_handler() {
    		analisis.k = this.value;
    		$$invalidate(0, analisis);
    	}

    	$$self.$capture_state = () => ({
    		Datatable,
    		rows,
    		settings,
    		settings2,
    		axios,
    		analisis,
    		datosTabla,
    		datosRutas,
    		onSubmitHandler,
    		procesar_datos,
    		procesar_caminos,
    		$rows
    	});

    	$$self.$inject_state = $$props => {
    		if ("analisis" in $$props) $$invalidate(0, analisis = $$props.analisis);
    		if ("datosTabla" in $$props) $$invalidate(1, datosTabla = $$props.datosTabla);
    		if ("datosRutas" in $$props) datosRutas = $$props.datosRutas;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		analisis,
    		datosTabla,
    		$rows,
    		settings,
    		onSubmitHandler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    axios.defaults.baseURL = "http://localhost:8080";
    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
