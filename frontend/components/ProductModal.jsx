// frontend/components/ProductModal.jsx
import React from "react";
import { AiFillCloseCircle } from "react-icons/ai";
import { useForm } from "react-hook-form";

function ProductModal({ isVisible, onClose, modalItem = {}, shouldCloseOnOverlayClick = true, sellItem }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { item = {}, myAccountList = [] } = modalItem;

  if (!isVisible) return null;

  const onSubmit = async (formData) => {
    // formData will contain { accountId, barcodeId } — ensure both present
    const accountId = formData.accountId;
    const barcodeId = formData.barcodeId || item.barcodeId;

    if (!accountId) {
      alert("Please select a buyer.");
      return;
    }

    try {
      await sellItem({ accountId, barcodeId });
      reset();
      onClose();
    } catch (err) {
      // sellItem is expected to handle and show its own errors, but guard here
      console.error("Sell failed", err);
      alert("Failed to sell item: " + (err.message || err));
    }
  };

  return (
    <div
      onClick={() => (shouldCloseOnOverlayClick ? onClose() : null)}
      className="fixed inset-0 bg-black/50 bg-opacity-25 backdrop-blur-sm flex justify-center items-center z-50"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-11/12 md:w-6/12 lg:w-4/12">
        <div className="bg-white p-4 rounded-md shadow-lg">
          <div className="flex items-center justify-end">
            <AiFillCloseCircle onClick={() => onClose()} className="w-6 h-6 hover:text-red-600 cursor-pointer" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-2">
              <div className="mb-4 flex items-start gap-4">
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  {/* Use <img> for external url safety during dev */}
                  {item.itemImage ? (
                    // If item.itemImage is a bytes/URI or URL string
                    <img src={item.itemImage} alt={item.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-xs text-gray-400 p-2">No image</div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="mt-1 text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-gray-600">{item.barcodeId}</p>
                  <p className="mt-1 text-xs text-gray-600">MFG: {item.manufacturedDate}</p>
                  <p className="mt-1 text-xs text-gray-600">Exp: {item.expiringDate}</p>
                </div>
              </div>

              {/* hidden barcodeId input */}
              <input
                type="hidden"
                {...register("barcodeId")}
                value={item.barcodeId || ""}
              />

              <div className="mb-4">
                <label className="text-sm font-semibold mb-2 block">Sell to:</label>
                <select
                  {...register("accountId", { required: true })}
                  defaultValue={myAccountList && myAccountList.length > 0 ? myAccountList[0].accountId : ""}
                  className="w-full h-9 rounded-md p-2 text-sm border"
                >
                  <option value="">-- Select buyer --</option>
                  {(myAccountList || []).map((account, index) => (
                    <option key={index} value={account.accountId}>
                      {account.name} — {account.accountId}
                    </option>
                  ))}
                </select>
                {errors.accountId && <p className="text-xs text-red-600 mt-1">Please select a buyer.</p>}
                {(!myAccountList || myAccountList.length === 0) && (
                  <p className="text-xs text-gray-500 mt-2">No buyers available. Add accounts for your role first.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center space-x-2 p-2">
              <button type="button" onClick={() => { reset(); onClose(); }} className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded">
                Close
              </button>
              <button type="submit" className="bg-pharmaGreen-700 hover:bg-pharmaGreen-800 text-white py-1 px-4 rounded">
                Sell Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
