// frontend/pages/products/[barcodeId].js
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Contract } from "ethers";
import { PHARMA_ABI, PHARMA_ADDRESS } from "@/constants";
import useConnect from "@/hooks/useConnect";
import { FaIndustry, FaTruck, FaStore, FaUser } from "react-icons/fa";
import { formatItem, firstAndLastFour } from "@/utils/utils";
import QRCode from "react-qr-code";

function TimelineItem({ icon, title, roleLabel, name, email, accountId, ts }) {
  return (
    <div className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-md">
      <div className="flex-shrink-0 mt-1 text-pharmaGreen-700">{icon}</div>
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">{title || name}</h4>
          {roleLabel && (
            <span className="text-xs uppercase text-gray-500 ml-4">
              {roleLabel}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{email}</p>
        <p className="text-xs text-gray-400 mt-1">
          {firstAndLastFour(accountId)}
        </p>
        {ts && (
          <p className="text-xs text-gray-400 mt-2">
            {new Date(Number(ts) * 1000).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ItemDetails() {
  const router = useRouter();
  const { barcodeId } = router.query;

  const { walletConnected, getProviderOrSigner } = useConnect();
  const [item, setItem] = useState(null);
  const [history, setHistory] = useState(null);

  // account details
  const [manufacturer, setManufacturer] = useState(null);
  const [distributor, setDistributor] = useState(null);
  const [retailer, setRetailer] = useState(null);
  const [customers, setCustomers] = useState([]);

  const fetchAccountDetails = async (address, setter) => {
    try {
      if (
        !address ||
        address === "0x0000000000000000000000000000000000000000"
      )
        return;
      const signer = await getProviderOrSigner(true);
      const contract = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
      const details = await contract.getAccountDetails(address);
      setter(details);
    } catch (err) {
      console.warn("Could not fetch account details:", err?.message || err);
    }
  };

  const getSingleItem = async () => {
    try {
      if (!walletConnected || !barcodeId) return;
      const signer = await getProviderOrSigner(true);
      const contract = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);
      const res = await contract.getSingleItem(barcodeId);
      // res[0] = Item, res[1] = ItemHistory
      const itemObj = formatItem(res[0]);
      setItem(itemObj);
      setHistory(res[1] || {});

      // fetch accounts for timeline
      const manAddr = res[1]?.manufacturer?.accountId;
      const distAddr = res[1]?.distributor?.accountId;
      const retAddr = res[1]?.retailer?.accountId;
      const custArray = res[1]?.customers || [];

      await Promise.all([
        fetchAccountDetails(manAddr, setManufacturer),
        fetchAccountDetails(distAddr, setDistributor),
        fetchAccountDetails(retAddr, setRetailer),
      ]);

      // customers may be array of {accountId, timestamp}
      const customersWithMeta = [];
      for (let i = 0; i < custArray.length; i++) {
        const c = custArray[i];
        if (!c || !c.accountId) continue;
        try {
          const signer2 = await getProviderOrSigner(true);
          const contract2 = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer2);
          const details = await contract2.getAccountDetails(c.accountId);
          customersWithMeta.push({
            ...details,
            timestamp: c.timestamp,
          });
        } catch (err) {
          customersWithMeta.push({
            name: "Customer",
            email: "",
            accountId: c.accountId,
            timestamp: c.timestamp,
          });
        }
      }
      setCustomers(customersWithMeta);
    } catch (err) {
      console.error("Could not get single item:", err);
      setItem(null);
      setHistory(null);
      setCustomers([]);
    }
  };

  useEffect(() => {
    if (!walletConnected) return;
    getSingleItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletConnected, barcodeId]);

  // Build verification URL for QR code
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  const verifyUrl =
    item?.barcodeId && baseUrl
      ? `${baseUrl}/verify?barcodeId=${item.barcodeId}`
      : "";

  return (
    <div className="p-6 md:w-10/12 md:mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Item summary */}
        <div className="md:w-5/12 bg-white p-6 rounded-lg shadow">
          <img
            src={item?.itemImage || "/logo3.png"}
            alt={item?.name}
            className="w-28 h-28 object-cover rounded-md mb-4"
          />
          <h2 className="text-2xl font-bold">{item?.name}</h2>
          <p className="text-sm text-gray-600 mt-3">
            MFG: {item?.manufacturedDate}
          </p>
          <p className="text-sm text-gray-600">EXP: {item?.expiringDate}</p>
          <p className="text-sm text-gray-600 mt-2">
            Barcode: {item?.barcodeId}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Qty: {item?.quantity ?? "-"}
          </p>

          {item?.ingredients && item.ingredients.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold">Ingredients</h4>
              <ul className="text-xs text-gray-700 list-disc list-inside">
                {item.ingredients.map((ing, idx) => (
                  <li key={idx}>{ing}</li>
                ))}
              </ul>
            </div>
          )}

          {/* QR code for blockchain verification */}
          {item?.barcodeId && verifyUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Scan to verify on blockchain:
              </p>
              <div className="bg-white p-3 rounded-lg inline-block border border-gray-200">
                <QRCode value={verifyUrl} size={128} />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This QR encodes the verification link for barcode ID{" "}
                <span className="font-mono">{item.barcodeId}</span>.
              </p>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="md:w-7/12 space-y-6">
          <h3 className="text-2xl font-bold">Item History</h3>

          {/* Manufacturer */}
          {manufacturer && (
            <TimelineItem
              icon={<FaIndustry size={22} />}
              title={manufacturer.name}
              roleLabel="Manufacturer"
              name={manufacturer.name}
              email={manufacturer.email}
              accountId={manufacturer.accountId}
              ts={history?.manufacturer?.timestamp}
            />
          )}

          {/* Distributor */}
          {distributor && (
            <TimelineItem
              icon={<FaTruck size={22} />}
              title={distributor.name}
              roleLabel="Distributor"
              name={distributor.name}
              email={distributor.email}
              accountId={distributor.accountId}
              ts={history?.distributor?.timestamp}
            />
          )}

          {/* Retailer */}
          {retailer && (
            <TimelineItem
              icon={<FaStore size={22} />}
              title={retailer.name}
              roleLabel="Retailer"
              name={retailer.name}
              email={retailer.email}
              accountId={retailer.accountId}
              ts={history?.retailer?.timestamp}
            />
          )}

          {/* Customers list */}
          {customers.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Customers</h4>
              <div className="space-y-3">
                {customers.map((c, idx) => (
                  <TimelineItem
                    key={idx}
                    icon={<FaUser size={20} />}
                    title={c.name || `Customer ${idx + 1}`}
                    roleLabel="Customer"
                    name={c.name}
                    email={c.email}
                    accountId={c.accountId}
                    ts={c.timestamp}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
