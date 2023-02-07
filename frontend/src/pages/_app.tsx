import Layout from '@/components/layout'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
// import { WalletProvider } from '@/context/wallet';

const client = new ApolloClient({
  uri: "/api/graphql",
  cache: new InMemoryCache(),
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      {/* <WalletProvider>
        
      </WalletProvider> */}
      <Layout>
          <Component {...pageProps} />
        </Layout>
    </ApolloProvider>
  )
}
