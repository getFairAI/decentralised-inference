import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import Layout from "./components/layout";

const client = new ApolloClient({
  // uri: "http://localhost:1984/graphql",
  uri: 'https://arweave.dev/graphql',
  cache: new InMemoryCache(),
});


export const Root = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
          <Outlet />
        </Layout>
      </ThemeProvider>
    </ApolloProvider>
  )
};

export default Root;