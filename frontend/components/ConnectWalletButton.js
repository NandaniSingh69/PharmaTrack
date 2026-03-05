import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function ConnectWalletButton({ onConnected }) {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        onConnected && onConnected(null);
      } else {
        setAccount(accounts[0]);
        onConnected && onConnected(accounts[0]);
      }
    });
  }, [onConnected]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        onConnected && onConnected(accounts[0]);
      }
    } catch (err) {
      console.error('MetaMask connection error:', err);
    }
  };

  return (
    <button
      onClick={connectWallet}
      className="px-4 py-2 bg-pharmaGreen-600 hover:bg-pharmaGreen-700 text-white text-sm font-medium rounded-lg"
    >
      {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
    </button>
  );
}
