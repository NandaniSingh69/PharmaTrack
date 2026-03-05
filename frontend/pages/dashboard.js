// frontend/pages/dashboard.js
import React, { useEffect, useState } from "react";
import useConnect from "@/hooks/useConnect";
import { Contract } from "ethers";
import { PHARMA_ABI, PHARMA_ADDRESS } from "@/constants";
import Link from "next/link";

const ROLE_LABELS = ["Manufacturer","Distributor","Retailer","Customer"];

export default function Dashboard() {
  const { walletConnected, getProviderOrSigner } = useConnect();
  const [role, setRole] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyDetails = async () => {
    try {
      if (!walletConnected) return;
      setLoading(true);
      const signer = await getProviderOrSigner(true);
      const contract = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
      const details = await contract.getMyDetails();
      setRole(Number(details.role)); // 0..3
    } catch (err) {
      console.warn("Could not fetch my details", err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyItems = async () => {
    try {
      if (!walletConnected) return;
      const signer = await getProviderOrSigner(true);
      const contract = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
      const myItems = await contract.getMyItems();
      // format items if you have a formatter - keep minimal here
      setItems(myItems || []);
    } catch (err) {
      console.error("Could not fetch my items", err);
      setItems([]);
    }
  };

  useEffect(() => {
    if (!walletConnected) return;
    fetchMyDetails();
    fetchMyItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletConnected]);

  const renderManufacturerView = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Manufacturer Dashboard</h2>
        <Link href="/products/new" className="bg-pharmaGreen-700 px-4 py-2 rounded text-white">Add Product</Link>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">My Products</h3>
        {items.length === 0 ? <p className="text-gray-500">No items found</p> : (
          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="bg-white p-3 rounded shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">{it.name}</p>
                  <p className="text-xs text-gray-500">{it.barcodeId}</p>
                </div>
                <Link href={`/products/${it.barcodeId}`} className="text-sm bg-pharmaGreen-700 text-white px-3 py-1 rounded">Details</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSimpleList = (title) => (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {items.length === 0 ? <p className="text-gray-500">No items</p> : (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="bg-white p-3 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-semibold">{it.name}</p>
                <p className="text-xs text-gray-500">{it.barcodeId}</p>
              </div>
              <Link href={`/products/${it.barcodeId}`} className="text-sm bg-pharmaGreen-700 text-white px-3 py-1 rounded">Details</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 md:w-10/12 md:mx-auto">
      {!walletConnected && <p className="text-gray-500">Please connect your wallet to see your dashboard.</p>}
      {walletConnected && (
        <div>
          {loading ? <p>Loading...</p> : (
            <>
              <div className="mb-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Role: {role === null ? "Unknown" : ROLE_LABELS[role]}</p>
              </div>

              {role === 0 && renderManufacturerView()}
              {role === 1 && renderSimpleList("Distributor - Items you hold")}
              {role === 2 && renderSimpleList("Retailer - Items you hold")}
              {role === 3 && renderSimpleList("Customer - Your purchases")}

              {role === null && <p className="text-gray-500">You are not registered with a role yet.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
