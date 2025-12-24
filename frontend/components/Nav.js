// frontend/components/Nav.jsx
import Image from 'next/image';
import React from 'react';
import logo from '../public/logo1-1.png';
import { HiOutlineMoon } from "react-icons/hi";
import MobileMenu from './MobileMenu';
import Link from 'next/link';
import useConnect from '@/hooks/useConnect';
import ConnectWalletButton from './ConnectWalletButton';


function MetaMaskButton() {
  const { walletConnected, connectWallet, switchAccount, account } = useConnect();


  const onClick = async () => {
    try {
      if (!walletConnected) {
        await connectWallet();
      } else {
        // Attempt to prompt MetaMask to show account chooser / permissions
        await switchAccount();
      }
    } catch (err) {
      console.error("MetaMask action failed", err);
      alert("Could not change account: " + (err.message || err));
    }
  };


  const short = (a) => (a ? `${a.slice(0,6)}...${a.slice(-4)}` : '');


  return (
    <button
      onClick={onClick}
      className="text-white text-xs font-semibold py-1 px-4 bg-pharmaGreen-600 rounded-md hover:bg-pharmaGreen-700 transition ease-linear duration-200"
    >
      {walletConnected ? `Connected: ${short(account)} (Switch)` : 'Connect MetaMask'}
    </button>
  );
}


function Nav() {
  return (
    <div className='w-full h-24 bg-pharmaGreen-800'>
      <div className='flex justify-between items-center p-4 md:w-10/12 md:mx-auto'>
        <div>
          <Image className='w-40 cursor-pointer' src={logo} alt="logo" />
          <p className='flex justify-end text-xs text-white font-normal pl-2 cursor-pointer'>by Team G9</p>
        </div>
        <div className='hidden md:flex'>
          <ul className='text-white flex space-x-4'>
            <li className='font-normal p-1 cursor-pointer transition ease-linear duration-150 text-orange-400'>
              <Link href='/'>Home</Link>
            </li>
            <li className='font-normal p-1 cursor-pointer hover:text-orange-400 transition ease-linear duration-150'>
              <Link href='/products'>Products</Link>
            </li>
            <li className='font-normal p-1 cursor-pointer hover:text-orange-400 transition ease-linear duration-150'>
              <Link href='/alternatives'>Find Alternatives</Link>
            </li>
            <li className='font-normal p-1 cursor-pointer hover:text-orange-400 transition ease-linear duration-150'>
              <Link href='/users'>Users</Link>
            </li>
             <li className='font-normal p-1 cursor-pointer hover:text-orange-400 transition ease-linear duration-150'>
              <Link href='/users'><ConnectWalletButton /></Link>
            </li>
          </ul>
        </div>


        <div className='md:hidden'>
          <div className='flex items-center space-x-2 text-white'>
            <div className='p-1 rounded-lg border border-pharmaGreen-700'>
              <HiOutlineMoon className='text-pharmaGreen-700 cursor-pointer' size={21} />
            </div>
            <div className='p-1 rounded-lg border border-pharmaGreen-700'>
              {/* You can add MetaMaskButton here for mobile if needed */}
              
            </div>
            <MobileMenu />
          </div>
        </div>
      </div>
    </div>
  )
}


export default Nav;
