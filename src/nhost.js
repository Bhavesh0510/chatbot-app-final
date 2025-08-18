// src/nhost.js
import { NhostClient } from '@nhost/nhost-js';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

// 🚨 IMPORTANT: Replace with your Nhost project's subdomain and region
// You can find these in your Nhost project dashboard -> Settings -> Project Environment Variables
const NHOST_SUBDOMAIN = process.env.REACT_APP_NHOST_SUBDOMAIN;
const NHOST_REGION = process.env.REACT_APP_NHOST_REGION;

// Initialize Nhost Client
export const nhost = new NhostClient({
  subdomain: NHOST_SUBDOMAIN,
  region: NHOST_REGION,
});

// Create an HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: `https://${NHOST_SUBDOMAIN}.${NHOST_REGION}.nhost.run/v1/graphql`,
  fetch: async (uri, options) => {
    const accessToken = nhost.auth.getAccessToken();
    if (accessToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }
    return fetch(uri, options);
  },
});

// Create a WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: `wss://${NHOST_SUBDOMAIN}.${NHOST_REGION}.nhost.run/v1/graphql`,
    connectionParams: async () => {
      const accessToken = nhost.auth.getAccessToken();
      return accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : {};
    },
  })
);

// Use splitLink to send queries/mutations to HTTP and subscriptions to WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Initialize Apollo Client with the split link and in-memory cache
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});