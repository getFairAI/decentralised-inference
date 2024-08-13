/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

import { Container } from '@mui/material';
import { stagger, useAnimate } from 'framer-motion';
import { useEffect } from 'react';

const staggerCards = stagger(0.1, { startDelay: 0.1 });

function useCardsAnimation() {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(
      '.stagger-card',
      { y: [-60, 0], opacity: [0, 1] },
      { duration: 0.4, delay: staggerCards },
    );
  });

  return scope;
}

const OnboadingPage = () => {
  const scope = useCardsAnimation();

  return (
    <Container
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        className='grid grid-flow-row grid-cols-1 md:grid-cols-2 grid-rows-1 gap-8 w-full'
        ref={scope}
      >
        <div className='stagger-card rounded-xl bg-[#3aaaaa] font-semibold p-5 flex flex-col justify-between gap-5 text-white shadow-lg'>
          <div className='flex flex-col gap-4'>
            <p className='text-2xl flex gap-3 items-center'>
              <img src='./fair-protocol-face-transp-eyes.png' className='w-[38px] h-[26px]' />
              Why connect a wallet?
            </p>
            <p>Connecting a wallet will unlock all the features on our app.</p>
            <p>Chat, create, generate, get help, do thousands of things within our app.</p>
          </div>
          <img
            src='./onboarding-images/home-screen-zoomed.png'
            className='rounded-xl shadow-lg border-white border-2'
          />
        </div>

        <div className='stagger-card rounded-xl bg-white font-semibold p-5 flex flex-col justify-between gap-5 shadow-lg'>
          <p className='text-2xl flex gap-3 items-center'>
            <img
              src='./fair-protocol-face-transp-eyes.png'
              className='w-[38px] h-[26px] invert brightness-75'
            />
            Connect your wallet in seconds
          </p>
          <p>
            Install a wallet extension on your browser, and then click connect here on FairAI.
            It&apos;s that simple.
          </p>
          <p>
            If you already have one, just click connect and you will be in and ready to begin right
            away!
          </p>
          <img
            src='./onboarding-images/choose-wallet.png'
            className='rounded-xl shadow-lg border-white border-2'
          />
        </div>

        <div className='stagger-card rounded-xl bg-white font-semibold p-5 flex flex-col justify-between gap-5 shadow-lg'>
          <p className='text-2xl flex gap-3 items-center'>
            <img
              src='./fair-protocol-face-transp-eyes.png'
              className='w-[38px] h-[26px] invert brightness-75'
            />
            Use your existing wallet
          </p>

          <p>
            We throughoutly test our recommended wallets, but you can use whatever wallet you
            already have!
          </p>
          <p>
            {"If you don't have a wallet yet, creating one just takes 1-2 minutes!"} <br />
            {`To start,
            first install a wallet extension from the recommended ones, by clicking the "Connect"
            button at the top of this page, then, follow the quick instructions on the wallet itself.`}
          </p>

          <img
            src='./onboarding-images/wallet-metamask.jpeg'
            className='rounded-xl shadow-xl border-2'
          />
        </div>

        <div className='stagger-card rounded-xl bg-neutral-800 font-semibold p-5 flex flex-col justify-between gap-5 text-white shadow-lg'>
          <p className='text-2xl flex gap-3 items-center'>
            <img src='./fair-protocol-face-transp-eyes.png' className='w-[38px] h-[26px]' />
            Privacy and security guaranteed
          </p>

          <p>
            We work inside the blockchain. Every transaction is tested and confirmed for complete
            legitimacy.
          </p>

          <p>
            FairAI and its components are completely open-source and built with privacy in mind from
            the ground up.
          </p>

          <p>
            FairAI and its components are completely open-source and built with privacy in mind from
            the ground up.
          </p>

          <img
            src='./onboarding-images/lock-icon.png'
            className='rounded-xl shadow-xl border-white border-2'
          />
        </div>
      </div>
    </Container>
  );
};

export default OnboadingPage;
