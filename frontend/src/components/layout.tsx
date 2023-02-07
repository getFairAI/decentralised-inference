// components/layout.js
import { ReactElement } from 'react';
import Navbar from './navbar';

export default function Layout({ children }: { children: ReactElement}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  )
}