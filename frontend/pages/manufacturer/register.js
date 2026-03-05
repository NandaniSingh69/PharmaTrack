import React, { useState } from "react";
import { Contract } from "ethers";
import { PHARMA_ABI, PHARMA_ADDRESS } from "@/constants";
import useConnect from "@/hooks/useConnect";

export default function RegisterManufacturer() {
  const { walletConnected, getProviderOrSigner } = useConnect();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const register = async () => {
    if (!walletConnected) {
      alert("Connect wallet first");
      return;
    }

    try {
      const signer = await getProviderOrSigner(true);
      const contract = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
      const tx = await contract.registerManufacturer(name, email);
      await tx.wait();
      alert("Manufacturer registered!");
    } catch (err) {
      console.error(err);
      alert("Registration failed: " + err.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Register as Manufacturer</h1>

      <input
        type="text"
        placeholder="Name"
        className="border p-2 w-full mb-4"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        className="border p-2 w-full mb-4"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        className="bg-green-600 text-white p-2 rounded"
        onClick={register}
      >
        Register
      </button>
    </div>
  );
}
