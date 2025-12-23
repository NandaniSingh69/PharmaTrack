import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { PHARMA_ABI, PHARMA_ADDRESS } from '@/constants';

export default function VerifyPage() {
  const router = useRouter();
  const { barcodeId: queryBarcode } = router.query;

  const [barcodeId, setBarcodeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [onChainItem, setOnChainItem] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof queryBarcode === 'string') {
      setBarcodeId(queryBarcode);
      handleVerify(queryBarcode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryBarcode]);

  const handleVerifyClick = async (e) => {
    e.preventDefault();
    if (!barcodeId.trim()) return;
    await handleVerify(barcodeId.trim());
  };

  const handleVerify = async (id) => {
    setLoading(true);
    setError(null);
    setOnChainItem(null);
    setHistory(null);

    try {
      if (!window.ethereum) {
        throw new Error('Web3 wallet (MetaMask) is required for verification.');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);

      const [item, itemHistory] = await contract.getSingleItem(id);

      if (!item.name || item.name === '') {
        throw new Error('No on-chain record found for this barcode.');
      }

      setOnChainItem(item);
      setHistory(itemHistory);
    } catch (err) {
      console.error('Verify error:', err);
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const isVerified = !!onChainItem;

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Verify Medicine
        </h1>

        {/* Input / scan */}
        <form
          onSubmit={handleVerifyClick}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <label
            htmlFor="barcode"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter or scan barcode ID
          </label>
          <input
            id="barcode"
            type="text"
            value={barcodeId}
            onChange={(e) => setBarcodeId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            placeholder="e.g. 1234-5678-ABCD"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-pharmaGreen-600 hover:bg-pharmaGreen-700 text-white font-semibold rounded-lg disabled:bg-gray-400"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Result */}
        {isVerified && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Verification Result
              </h2>
              <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                Verified on blockchain
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Name:</span> {onChainItem.name}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Manufacturer:</span>{' '}
              {onChainItem.manufacturerName}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Barcode ID:</span>{' '}
              {onChainItem.barcodeId}
            </p>
          </div>
        )}

        {!isVerified && !loading && barcodeId && !error && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Verification Result
              </h2>
              <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
                Not found / suspicious
              </span>
            </div>
            <p className="text-sm text-gray-600">
              No on-chain record was found for this barcode ID. This package may
              not be authentic.
            </p>
          </div>
        )}

        {/* Simplified timeline */}
        {history && isVerified && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Supply Chain Timeline
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>
                <span className="font-medium">Manufacturer:</span>{' '}
                {history.manufacturer.accountId}
              </li>
              {history.distributor.accountId !==
                '0x0000000000000000000000000000000000000000' && (
                <li>
                  <span className="font-medium">Distributor:</span>{' '}
                  {history.distributor.accountId}
                </li>
              )}
              {history.retailer.accountId !==
                '0x0000000000000000000000000000000000000000' && (
                <li>
                  <span className="font-medium">Retailer:</span>{' '}
                  {history.retailer.accountId}
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600">
            Disclaimer: Blockchain verification reduces the risk of counterfeit
            medicines but does not replace professional medical advice. Always
            consult a healthcare provider before taking any medication.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
