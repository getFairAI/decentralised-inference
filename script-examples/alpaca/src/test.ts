import CONFIG from '../config.json';
import fs from 'fs';
import Bundlr from '@bundlr-network/client';
import Arweave from 'arweave';
import { graphql, buildSchema } from 'graphql';
import { ApolloClient, gql, InMemoryCache } from '@apollo/client/core';
import { JWKInterface } from 'arweave/node/lib/wallet';

async function cycle() {
  while (true) {
	var bundlr = "test";
    console.log(
      `Slept for ${CONFIG.sleepTimeSeconds} second(s). Restarting cycle now...`
    );
  }
}

cycle();
