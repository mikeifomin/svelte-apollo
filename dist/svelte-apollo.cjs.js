'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var svelte = require('svelte');
var apolloUtilities = require('apollo-utilities');
var store = require('svelte/store');
var svelteObservable = require('svelte-observable');

var CLIENT = typeof Symbol !== 'undefined' ? Symbol('client') : '@@client';
function getClient() {
    return svelte.getContext(CLIENT);
}
function setClient(client) {
    svelte.setContext(CLIENT, client);
}

var restoring = typeof WeakSet !== 'undefined' ? new WeakSet() : new Set();
function restore(client, options) {
    restoring.add(client);
    afterHydrate(function () {
        restoring.delete(client);
    });
    client.writeQuery(options);
}
function afterHydrate(callback) {
    // Attempt to wait for onMount (hydration of current component is complete),
    // but if that fails (e.g. outside of component initialization)
    // wait for next event loop for hydrate to complete
    try {
        svelte.onMount(callback);
    }
    catch (_error) {
        setTimeout(callback, 1);
    }
}

function query(client, options) {
    var subscribed = false;
    var initial_value;
    // If client is restoring (e.g. from SSR)
    // attempt synchronous readQuery first (to prevent loading in {#await})
    if (restoring.has(client)) {
        try {
            // undefined = skip initial value (not in cache)
            initial_value = client.readQuery(options) || undefined;
            initial_value = { data: initial_value };
        }
        catch (err) {
            // Ignore preload errors
        }
    }
    // Create query and observe,
    // but don't subscribe directly to avoid firing duplicate value if initialized
    var observable_query = client.watchQuery(options);
    var subscribe_to_query = svelteObservable.observe(observable_query, initial_value).subscribe;
    // Wrap the query subscription with a readable to prevent duplicate values
    var subscribe = store.readable(initial_value, function (set) {
        subscribed = true;
        var skip_duplicate = initial_value !== undefined;
        var initialized = false;
        var skipped = false;
        var unsubscribe = subscribe_to_query(function (value) {
            if (skip_duplicate && initialized && !skipped) {
                skipped = true;
            }
            else {
                if (!initialized)
                    initialized = true;
                set(value);
            }
        });
        return unsubscribe;
    }).subscribe;
    return {
        subscribe: subscribe,
        refetch: function (variables) {
            // If variables have not changed and not subscribed, skip refetch
            if (!subscribed && apolloUtilities.isEqual(variables, observable_query.variables))
                return observable_query.result();
            return observable_query.refetch(variables);
        },
        result: function () { return observable_query.result(); },
        fetchMore: function (options) { return observable_query.fetchMore(options); },
        setOptions: function (options) { return observable_query.setOptions(options); },
        updateQuery: function (map) { return observable_query.updateQuery(map); },
        startPolling: function (interval) { return observable_query.startPolling(interval); },
        stopPolling: function () { return observable_query.stopPolling(); },
        subscribeToMore: function (options) { return observable_query.subscribeToMore(options); }
    };
}

function mutate(client, options) {
    return client.mutate(options);
}

function subscribe(client, options) {
    var observable = client.subscribe(options);
    return svelteObservable.observe(observable);
}

exports.getClient = getClient;
exports.mutate = mutate;
exports.query = query;
exports.restore = restore;
exports.setClient = setClient;
exports.subscribe = subscribe;
//# sourceMappingURL=svelte-apollo.cjs.js.map
