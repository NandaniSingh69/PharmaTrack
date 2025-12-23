import { useEffect, useState } from "react";
import { ethers, utils } from "ethers";
import { PHARMA_ABI, PHARMA_ADDRESS } from '../constants';

function useConnect() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Connect to MetaMask wallet (opens prompt only if not already connected)
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setWalletConnected(true);
      }
      const c = await window.ethereum.request({ method: 'eth_chainId' }).catch(()=>null);
      setChainId(c);
    } catch (err) {
      console.error("User rejected wallet connection", err);
    }
  };

  // Force MetaMask to prompt for permissions (useful to request new accounts)
  const switchAccount = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected");
      return;
    }
    try {
      // This will prompt the permission UI; user can grant access to other accounts
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      // After permission request, fetch current accounts
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setWalletConnected(true);
      }
    } catch (err) {
      console.error("Could not switch accounts / request permissions", err);
    }
  };

  // Get Ethers provider or signer
  const getProviderOrSigner = async (needSigner = false) => {
    if (!window.ethereum) throw new Error("MetaMask not detected");
    // avoid automatic ENS resolution on unknown networks
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    if (needSigner) {
      return provider.getSigner();
    }
    return provider;
  };

  // Get contract instance
  const getContract = async (needSigner = false) => {
    const providerOrSigner = await getProviderOrSigner(needSigner);

    if (!PHARMA_ADDRESS || !utils.isAddress(PHARMA_ADDRESS)) {
      throw new Error("Invalid contract address. PHARMA_ADDRESS is missing or not a valid hex address.");
    }

    return new ethers.Contract(PHARMA_ADDRESS, PHARMA_ABI, providerOrSigner);
  };

  // Auto-connect if already authorized and set listeners for account/network changes
  useEffect(() => {
    if (!window.ethereum) return;

    // initial check
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setWalletConnected(true);
      }
    }).catch(()=>{});

    // account change handler
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // MetaMask locked or user disconnected the site
        setAccount(null);
        setWalletConnected(false);
      } else {
        setAccount(accounts[0]);
        setWalletConnected(true);
      }
    };

    // chain change handler
    const handleChainChanged = (chainIdHex) => {
      setChainId(chainIdHex);
      // Optional: reload page on network change
      // window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // cleanup on unmount
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    walletConnected,
    connectWallet,
    switchAccount,
    account,
    chainId,
    getProviderOrSigner,
    getContract,
    setWalletConnected,
  };
}

export default useConnect;
