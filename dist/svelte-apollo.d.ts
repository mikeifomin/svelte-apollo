import ApolloClient, { WatchQueryOptions, ApolloQueryResult, ObservableQuery, MutationOptions, SubscriptionOptions, OperationVariables } from 'apollo-client';
import { FetchResult } from 'apollo-link';
import { DataProxy } from 'apollo-cache';

declare function getClient<TCache = any>(): ApolloClient<TCache> | undefined;
declare function setClient<TCache = any>(client: ApolloClient<TCache>): void;

declare type Deferred<T> = T | Promise<T>;
declare type Next<T> = (value: T) => void;
declare type Unsubscribe = () => void;

interface QueryStore<TData = any> {
    subscribe: (subscription: Next<Deferred<ApolloQueryResult<TData>>>) => Unsubscribe;
    refetch: ObservableQuery['refetch'];
    result: ObservableQuery['result'];
    fetchMore: ObservableQuery['fetchMore'];
    setOptions: ObservableQuery['setOptions'];
    updateQuery: ObservableQuery['updateQuery'];
    startPolling: ObservableQuery['startPolling'];
    stopPolling: ObservableQuery['stopPolling'];
    subscribeToMore: ObservableQuery['subscribeToMore'];
}
declare function query<TData = any, TCache = any, TVariables = any>(client: ApolloClient<TCache>, options: WatchQueryOptions<TVariables>): QueryStore<TData>;

declare function mutate<T = any, TCache = any, TVariables = any>(client: ApolloClient<TCache>, options: MutationOptions<T, TVariables>): Promise<FetchResult<T>>;

interface ReadableStore<T> {
    subscribe(next: Next<T>): Unsubscribe;
}
declare function subscribe<TCache = any, TVariables = any, T = any>(client: ApolloClient<TCache>, options: SubscriptionOptions<TVariables>): ReadableStore<Deferred<T>>;

declare function restore<TCache = any, TData = any, TVariables = OperationVariables>(client: ApolloClient<TCache>, options: DataProxy.WriteQueryOptions<TData, TVariables>): void;

export { getClient, mutate, query, restore, setClient, subscribe };
