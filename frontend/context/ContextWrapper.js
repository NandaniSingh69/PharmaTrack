import AppContext from "./AppContext";
import { ethers, Contract } from "ethers";
import { useEffect, useState } from "react";
import { getCustomDateEpoch } from '../utils/utils';
import { PHARMA_ABI, PHARMA_ADDRESS } from '../constants/index';
import useConnect from '../hooks/useConnect'; // Use your updated hook

function ContextWrapper({ children }) {
  const [users, setUsers] = useState([]);
  const [usersList, setUsersList] = useState();
  const [loading, setLoading] = useState(false);

  // Use wallet connection from your hook
  const { walletConnected, account, getProviderOrSigner } = useConnect();

  // user state
  const [user, setUser] = useState({
    role: 1,
    accountId: '',
    name: '',
    email: '',
  });

  const handleUserChange = (e, name) => {
    setUser((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const saveUser = async () => {
    try {
      if (walletConnected) {
        const signer = await getProviderOrSigner(true);
        const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
        const tx = await contractInstance.addParty(user);
        setLoading(true);
        await tx.wait();
        setLoading(false);
        await getMyAccountsList();
      }
    } catch (error) {
      console.log('Could not add user', error);
    }
  };

  const getMyAccountsList = async () => {
    try {
      if (walletConnected) {
        const signer = await getProviderOrSigner(true);
        const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
        const myUsersList = await contractInstance.getMyAccountsList();
        setUsersList(myUsersList);
      }
    } catch (error) {
      console.log('Could not get user list', error);
    }
  };

  const getAccountDetails = async () => {
    try {
      if (walletConnected) {
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();
        const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
        const myDetails = await contractInstance.getAccountDetails(address);
        return myDetails;
      }
      return null;
    } catch (error) {
      console.log('Could not get account details', error);
      return null;
    }
  };

  const saveItem = async (item) => {
    try {
      if (walletConnected) {
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();
        item.manufacturedDate = getCustomDateEpoch(item.manufacturedDate);
        item.expiringDate = getCustomDateEpoch(item.expiringDate);
        item.isInBatch = false;
        item.batchCount = 0;
        item = { ...item, manufacturer: address };
        const currentTimestamp = Math.round(Date.now() / 1000);
        const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
        await contractInstance.addNewItem(item, currentTimestamp);
      }
    } catch (error) {
      console.log('Could not add item', error);
    }
  };

  const getAllItems = async () => {
    try {
      if (walletConnected) {
        const signer = await getProviderOrSigner(true);
        const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
        const allItems = await contractInstance.getAllItems();
        return allItems;
      }
    } catch (error) {
      console.log('Could not get items', error);
    }
  };

  const getMyItems = async () => {
    try {
      if (walletConnected) {
        const signer = await getProviderOrSigner(true);
        const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
        const myItems = await contractInstance.getMyItems();
        return myItems;
      }
    } catch (error) {
      console.log('Could not get my items', error);
    }
  };

  const getSingleItem = async (barcodeId) => {
    try {
      if (walletConnected) {
        const signer = await getProviderOrSigner(true);
        const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
        const item = await contractInstance.getSingleItem(barcodeId);
        return item;
      }
    } catch (error) {
      console.log('Could not get item', error);
      return null;
    }
  };

  const sellItem = async (partyId, barcodeId) => {
    try {
      if (walletConnected) {
        const signer = await getProviderOrSigner(true);
        const currentTimestamp = Math.round(Date.now() / 1000);
        const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
        await contractInstance.sellItem(partyId, barcodeId, currentTimestamp);
      }
    } catch (error) {
      console.log('Could not sell item', error);
      return null;
    }
  };

  // product history
  const [productHistory, setProductHistory] = useState({
    manufacturer: null,
    supplier: null,
    vendor: null,
    customers: null,
  });

  const handleProductHistoryChange = (e, name) => {
    setProductHistory((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  return (
    <AppContext.Provider value={{
      loading,
      walletConnected,
      productHistory,
      user,
      users,
      usersList,
      handleUserChange,
      setUser,
      setProductHistory,
      handleProductHistoryChange,
      saveUser,
      saveItem,
      getAllItems,
      getAccountDetails,
      getMyAccountsList,
      getMyItems,
      sellItem,
      getSingleItem,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export default ContextWrapper;
