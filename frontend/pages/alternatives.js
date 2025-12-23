import { useState } from 'react';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function Alternatives() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Antibiotics', 'Antimalaria', 'Analgestics', 'Supplements', 'Steroids', 'Other'];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const categoryParam = selectedCategory !== 'All' ? `&category=${selectedCategory}` : '';
      const response = await fetch(
        `/api/medicines/search?query=${encodeURIComponent(searchQuery)}${categoryParam}&limit=20`
      );
      
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        console.log('First medicine:', data.data[0]);
  console.log('Price:', data.data[0]?.price);
  console.log('Price type:', typeof data.data[0]?.price);
      } else {
        setError(data.message || 'Search failed');
      }
    } catch (err) {
      setError('Failed to search medicines. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFindAlternatives = (medicineId) => {
    router.push(`/alternatives/${medicineId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Find Alternative Medicines
          </h1>
          <p className="text-lg text-gray-600">
            Search for medicines and discover verified alternatives from trusted manufacturers
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2 ">
                  Search Medicine
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter medicine name, composition, or ingredient..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 px-6 rounded-lg 
           bg-pharmaGreen-800 
           hover:bg-pharmaGreen-700 
           hover:scale-[1.02]
           transition duration-200 
           disabled:bg-gray-400">
                {loading ? 'Searching...' : 'Search Medicines'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((medicine) => (
                <div
                  key={medicine._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200"
                >
                  {/* Medicine Name */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {medicine.name}
                  </h3>

                  {/* Composition */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Composition:</p>
                    <p className="text-sm text-gray-600">{medicine.composition}</p>
                  </div>

                  {/* Ingredients */}
                  {medicine.ingredients && medicine.ingredients.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Active Ingredients:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {medicine.ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manufacturer */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Manufacturer:</span> {medicine.manufacturer}
                    </p>
                  </div>

                  {/* Price & Category */}
                  {/* Price & Category */}
<div className="flex justify-between items-center mb-4">
  <div>
    {typeof medicine.price === 'number' && medicine.price > 0 ? (
      <p className="text-lg font-bold text-green-600">
        ₹{Number(medicine.price).toFixed(2)}
      </p>
    ) : (
      <p className="text-sm text-gray-500">Price not available</p>
    )}
  </div>
  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
    {medicine.category}
  </span>
</div>


                  {/* Prescription Badge */}
                  {medicine.prescriptionRequired && (
                    <div className="mb-4">
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                        ⚕️ Prescription Required
                      </span>
                    </div>
                  )}

                  {/* Find Alternatives Button */}
                     {/* Find Alternatives Button */}
    <button
      onClick={() => router.push(`/alternatives/${medicine._id}`)}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 mt-4"
    >
      Find Alternatives
    </button>
  </div>
))}

            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && searchResults.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No medicines found for "{searchQuery}". Try a different search term.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && searchResults.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Enter a medicine name to search for alternatives
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
