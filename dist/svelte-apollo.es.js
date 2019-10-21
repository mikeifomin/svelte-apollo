import { getContext, setContext, onMount } from 'svelte';
import { isEqual } from 'apollo-utilities';
import { readable } from 'svelte/store';
import { observe } from 'svelte-observable';

var CLIENT = typeof Symbol !== 'undefined' ? Symbol('client') : '@@client';
function getClient() {
    return getContext(CLIENT);
}
function setClient(client) {
    setContext(CLIENT, client);
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
        onMount(callback);
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
    var subscribe_to_query = observe(observable_query, initial_value).subscribe;
    // Wrap the query subscription with a readable to prevent duplicate values
    var subscribe = readable(initial_value, function (set) {
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
            if (!subscribed && isEqual(variables, observable_query.variables))
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
    return observe(observable);
}

export { getClient, mutate, query, restore, setClient, subscribe };
//# sourceMappingURL=svelte-apollo.es.js.map
