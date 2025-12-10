// frontend/pages/users/index.js
import React, { useEffect, useState } from 'react';
import { CiMail } from "react-icons/ci";
import { RiWallet2Line } from "react-icons/ri";
import { BsSearch } from "react-icons/bs";
import { PHARMA_ABI, PHARMA_ADDRESS } from '@/constants';
import { Contract, ethers } from 'ethers';
import { useForm } from "react-hook-form";
import useConnect from '@/hooks/useConnect';

const ROLE_LABELS = ["Manufacturer", "Distributor", "Retailer", "Customer"];

function UserCard({ user }) {
  return (
    <div className='space-y-2 border border-gray-300 p-4 rounded-md backdrop-blur-sm bg-pharmaGreen-700/5'>
      <div><p className='font-semibold'>{user.name}</p></div>
      <div className='flex items-center space-x-2'>
        <CiMail size={18} />
        <p className='text-xs'>{user.email}</p>
      </div>
      <div className='flex items-center space-x-2'>
        <RiWallet2Line size={18} />
        <p className='text-xs'>{user.accountId}</p>
      </div>
      <div><p className='text-xs text-gray-500'>Role: {ROLE_LABELS[Number(user.role)]}</p></div>
    </div>
  );
}

function UsersIndex() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { walletConnected, getProviderOrSigner } = useConnect();

  const [search, setSearch] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myRole, setMyRole] = useState(null); // Number enum of current user

  // Determine which role(s) current user can add
  // Manufacturer(0) can add Distributor(1)
  // Distributor(1) can add Retailer(2)
  // Retailer(2) can add Customer(3)
  const allowedRolesToAdd = () => {
    if (myRole === null) return [];
    if (myRole === 0) return [1];
    if (myRole === 1) return [2];
    if (myRole === 2) return [3];
    return [];
  };

  // Replace fetchMyRole with this
 const fetchMyRole = async () => {
  try {
    if (!walletConnected) return;
    // Use signer so msg.sender inside contract is your connected account
    const signer = await getProviderOrSigner(true);
    const contract = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
    const myDetails = await contract.getMyDetails(); // returns Types.AccountDetails for msg.sender
    setMyRole(Number(myDetails.role));
  } catch (err) {
    console.warn("Could not fetch my details", err);
    setMyRole(null);
  }
};



  const saveUser = async (user) => {
    try {
      if (!walletConnected) {
        alert("Please connect your wallet");
        return;
      }

      // Validate and checksum address
      user.accountId = ethers.utils.getAddress(user.accountId);

      // Validate selected role is allowed
      const allowed = allowedRolesToAdd();
      const requestedRole = Number(user.role);
      if (!allowed.includes(requestedRole)) {
        alert("You are not allowed to create this role.");
        return;
      }

      setLoading(true);
      const signer = await getProviderOrSigner(true);
      const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);

      // Build the Types.AccountDetails struct object
      const accountStruct = {
        role: requestedRole,
        accountId: user.accountId,
        name: user.name,
        email: user.email
      };

      const tx = await contractInstance.addParty(accountStruct);
      await tx.wait();

      setLoading(false);
      reset();
      await getMyAccountsList();
      alert("User added successfully!");

    } catch (error) {
      console.log('Could not add user', error);
      alert("Failed to add user: " + (error.message || error));
      setLoading(false);
    }
  };

  // Replace getMyAccountsList with this
const getMyAccountsList = async () => {
  try {
    if (!walletConnected) return;

    setRefreshing(true);
    // Use signer so msg.sender inside contract is your connected account
    const signer = await getProviderOrSigner(true);
    const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
    const myUsersList = await contractInstance.getMyAccountsList();
    setUsersList(myUsersList || []);
  } catch (error) {
    console.log('Could not get user list', error);
    const isEnsError =
      error &&
      (error.code === 'UNSUPPORTED_OPERATION' ||
       (error.message && (error.message.includes('ENS') || error.message.includes('getResolver'))));
    if (isEnsError) {
      console.warn('ENS not supported on this network — skipping ENS resolution (expected on localhost).');
      setUsersList([]);
    } else {
      alert("Failed to fetch users: " + (error.message || error));
    }
  } finally {
    setRefreshing(false);
  }
};


  const refreshUsers = async () => {
    await getMyAccountsList();
  };

  useEffect(() => {
    if (!walletConnected) return;
    fetchMyRole();
    getMyAccountsList();
    // eslint-disable-next-line
  }, [walletConnected]);

  return (
    <div className='p-4 md:w-10/12 md:mx-auto'>
      <div className='flex flex-col-reverse gap-12 md:flex-row bg-white w-full h-full shadow-md rounded-md p-10'>
        <div className='w-full md:w-1/2 mb-12'>
          <div className="flex justify-between items-center mb-4">
            <p className='text-xl md:text-2xl font-bold'>Existing Users</p>
            <button
              onClick={refreshUsers}
              disabled={refreshing}
              className='border border-blue-500 py-1 px-3 rounded-md text-xs text-blue-500 hover:bg-blue-100 disabled:opacity-50'
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className='flex items-center my-4 border border-gray-400 rounded-md px-2 space-x-4'>
            <BsSearch size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              className='w-full h-9 border-none p-2 text-sm focus-within:border-none active:border-none'
              type="search"
              placeholder='Filter by name or email...'
            />
          </div>

          <div className='mt-12 space-y-4'>
            {usersList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {refreshing ? "Loading users..." : "No users found"}
              </p>
            ) : (
              usersList
                .filter((user) => {
                  const query = search.toLowerCase();
                  return query === '' ? user :
                    (user.name.toLowerCase().includes(query) ||
                      user.email.toLowerCase().includes(query));
                })
                .map((user, idx) => <UserCard key={idx} user={user} />)
            )}
          </div>
        </div>

        <div className='w-full md:w-1/2 mb-12'>
          <p className='text-xl md:text-2xl font-bold mb-4'>Add New User</p>
          <form onSubmit={handleSubmit(saveUser)}>
            <div className='mb-4'>
              <label className='text-sm font-semibold'>Name</label>
              <input {...register("name", { required: true })} className='w-full h-9 rounded-md p-2 text-sm border' type="text" />
              {errors.name && <span className='text-red-600 text-xs'>This field is required</span>}
            </div>
            <div className='mb-4'>
              <label className='text-sm font-semibold'>Email</label>
              <input {...register("email", { required: true })} className='w-full h-9 rounded-md p-2 text-sm border' type="email" />
              {errors.email && <span className='text-red-600 text-xs'>This field is required</span>}
            </div>
            <div className='mb-4'>
              <label className='text-sm font-semibold'>Wallet Address</label>
              <input
                {...register("accountId", {
                  required: "This field is required",
                  pattern: {
                    value: /^0x[a-fA-F0-9]{40}$/,
                    message: "Please enter a valid Ethereum address"
                  }
                })}
                className='w-full h-9 rounded-md p-2 text-sm border'
                type="text"
                placeholder="0x..."
              />
              {errors.accountId && <span className='text-red-600 text-xs'>{errors.accountId.message}</span>}
            </div>

            <div className='mb-4'>
              <label className='text-sm font-semibold'>Role</label>
              <select
                {...register("role", { required: true })}
                className='w-full h-9 rounded-md p-2 text-sm border'
                defaultValue=""
              >
                <option value="" disabled>Select role</option>
                {
                  allowedRolesToAdd().map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))
                }
              </select>
              {errors.role && <span className='text-red-600 text-xs'>This field is required</span>}
              {myRole === null && <p className='text-xs text-gray-500 mt-2'>You may only create roles permitted by your account. Connect wallet to see options.</p>}
            </div>

            <div className='mb-4'>
              <button
                type='submit'
                disabled={loading}
                className='bg-pharmaGreen-800 px-4 py-2 text-white rounded-md hover:bg-pharmaGreen-900 disabled:opacity-50'
              >
                {loading ? 'Adding User...' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UsersIndex;
