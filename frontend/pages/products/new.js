import React, { useState } from 'react';
import { AiFillPlusCircle, AiFillMinusCircle } from "react-icons/ai";
import { useListState } from '@mantine/hooks';
import { useForm } from 'react-hook-form';
import { Contract } from 'ethers';
import { getCustomDateEpoch } from '@/utils/utils';
import { PHARMA_ABI, PHARMA_ADDRESS } from '@/constants';
import useConnect from '@/hooks/useConnect';
import { useRouter } from 'next/router';

function AddProduct() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { walletConnected, getProviderOrSigner } = useConnect();
  const router = useRouter();

  const [ingredient, setIngredient] = useState('');
  const [ingredientsList, ingredientsListHandlers] = useListState([]);
  const [isLoading, setIsLoading] = useState(false);

  const appendIngredient = () => {
    if (!ingredient.trim()) return;
    ingredientsListHandlers.append(ingredient.trim());
    setIngredient('');
  };

  const deleteIngredient = (index) => {
    ingredientsListHandlers.remove(index);
  };

  const saveItem = async (item) => {
    try {
      if (!walletConnected) {
        alert("Please connect your wallet");
        return;
      }

      setIsLoading(true);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();

      // force safe defaults right before calling contract
      item.ingredients = Array.isArray(ingredientsList) ? ingredientsList : [];
      item.quantity = Number(item.quantity || 0);
      item.manufacturer = address; // ensure manufacturer exists


      const contractInstance = new Contract(PHARMA_ADDRESS, PHARMA_ABI, signer);

      // Configure item object
      item.manufacturedDate = getCustomDateEpoch(item.manufacturedDate);
      // Here expiringDate remains days as earlier (if that's your logic). If you store epoch you can convert similarly.
      item.isInBatch = false;
      item.batchCount = 0;
      item.manufacturer = address;
      item.ingredients = ingredientsList;
      item.quantity = Number(item.quantity || 0); // ensure uint
      // keep other fields: usage, itemImage etc.

      const currentTimestamp = Math.round(Date.now() / 1000);
      const tx = await contractInstance.addNewItem(item, currentTimestamp);
      await tx.wait();

      // Reset form and lists
      reset();
      ingredientsListHandlers.setState([]);
      setIngredient('');
      alert("Product added successfully!");
      router.push('/products');
    } catch (error) {
      console.log('Could not add item', error);
      alert("Failed to add product: " + (error.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='p-4 md:w-10/12 md:mx-auto'>
      <div className='flex flex-col gap-12 md:flex-row bg-white w-full h-full shadow-md rounded-md p-10'>
        <div className='w-full'>
          <p className='text-xl md:text-2xl font-bold mb-4'>Add Product</p>
          <form onSubmit={handleSubmit(saveItem)}>
            <div className='mb-4'>
              <label className='text-sm font-semibold'>Manufacturer Name</label>
              <input {...register("manufacturerName", { required: true })} className='w-full h-9 rounded-md p-2 text-sm border' type="text" />
              {errors.manufacturerName && <span className='text-xs text-red-600'>This field is required</span>}
            </div>

            <div className='mb-4'>
              <label className='text-sm font-semibold'>Manufacturing Date</label>
              <input {...register("manufacturedDate", { required: true })} className='w-full h-9 rounded-md p-2 text-sm border' type="date" />
              {errors.manufacturedDate && <span className='text-xs text-red-600'>This field is required</span>}
            </div>

            <div className='mb-4'>
              <label className='text-sm font-semibold'>Expires in (Days)</label>
              <input {...register("expiringDate", { required: true })} className='w-full h-9 rounded-md p-2 text-sm border' type="number" />
              {errors.expiringDate && <span className='text-xs text-red-600'>This field is required</span>}
            </div>

            <div className='mb-4'>
              <label className='text-sm font-semibold'>Product Name</label>
              <input {...register("name", { required: true })} className='w-full h-9 rounded-md p-2 text-sm border' type="text" />
              {errors.name && <span className='text-xs text-red-600'>This field is required</span>}
            </div>

            <div className='mb-4'>
              <label className='text-sm font-semibold'>Product Type</label>
              <select {...register("itemType", { required: true })} className='w-full h-9 rounded-md p-2 text-sm border'>
                <option value="0">Antibiotics</option>
                <option value="1">Antimalaria</option>
                <option value="2">Analgestics</option>
                <option value="3">Supplements</option>
                <option value="4">Steroids</option>
              </select>
            </div>

            <div className='mb-4'>
              <label className='text-sm font-semibold'>Product ID (barcode)</label>
              <input {...register("barcodeId", { required: true })} className='w-full h-9 rounded-md p-2 text-sm border' type="text" />
            </div>

            <div className='mb-4'>
              <label className='text-sm font-semibold'>Product Image (URL)</label>
              <input {...register("itemImage", { required: true })} className='w-full h-9 rounded-md p-2 text-sm border' type="url" />
              {errors.itemImage && <span className='text-xs text-red-600'>This field is required and must be a valid URL</span>}
            </div>

            {/* Quantity */}
            <div className='mb-4'>
              <label className='text-sm font-semibold'>Quantity (number of units)</label>
              <input {...register("quantity", { required: true, valueAsNumber: true })} className='w-full h-9 rounded-md p-2 text-sm border' type="number" min={0} />
              {errors.quantity && <span className='text-xs text-red-600'>This field is required</span>}
            </div>

            {/* Ingredients */}
            <div className='mb-4'>
              <label className='text-sm font-semibold'>Ingredients</label>
              <div className='flex gap-4'>
                <input
                  className='w-full h-9 rounded-md p-2 text-sm border'
                  value={ingredient}
                  onChange={(e) => setIngredient(e.target.value)}
                  type="text"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), appendIngredient())}
                />
                <AiFillPlusCircle onClick={appendIngredient} className='text-pharmaGreen-800 cursor-pointer' size={25} />
              </div>
              <div>
                {ingredientsList.map((ing, index) => (
                  <div key={index} className='flex gap-4 my-2 p-2 bg-gray-100 rounded'>
                    <div className='w-full'>{ing}</div>
                    <AiFillMinusCircle onClick={() => deleteIngredient(index)} className='text-red-800 cursor-pointer' size={25} />
                  </div>
                ))}
              </div>
            </div>

            {/* Usage */}
            <div className='mb-4'>
              <label className='text-sm font-semibold'>Usage</label>
              <textarea {...register("usage", { required: true })} className='w-full h-20 rounded-md p-2 text-sm border' />
              {errors.usage && <span className='text-xs text-red-600'>This field is required</span>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className='bg-pharmaGreen-800 cursor-pointer text-white rounded-md text-sm py-2 px-4 hover:bg-pharmaGreen-700 transition ease-linear duration-150 disabled:opacity-50'
            >
              {isLoading ? 'Adding Product...' : 'Add Product'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
