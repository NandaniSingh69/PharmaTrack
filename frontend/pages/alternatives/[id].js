import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

// Parse drugInteractions JSON safely
function parseDrugInteractions(raw) {
  if (!raw) return null;

  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const drugs = Array.isArray(obj.drug) ? obj.drug : [];
    const brands = Array.isArray(obj.brand) ? obj.brand : [];
    const effects = Array.isArray(obj.effect) ? obj.effect : [];

    return { drugs, brands, effects };
  } catch (e) {
    console.error('Failed to parse drugInteractions:', e);
    return null;
  }
}

// Get common interaction drugs between two medicines
function getCommonInteractionDrugs(m1, m2) {
  const d1 = m1?.parsedInteractions?.drugs || [];
  const d2 = m2?.parsedInteractions?.drugs || [];
  if (!d1.length || !d2.length) return [];

  const set1 = new Set(d1.map((x) => x.toLowerCase()));
  return d2.filter((x) => set1.has(x.toLowerCase()));
}

export default function MedicineAlternatives() {
  const router = useRouter();
  const { id } = router.query;

  const [targetMedicine, setTargetMedicine] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection state for interaction checker
  const [selectedIds, setSelectedIds] = useState([]);
  const [interactionMessage, setInteractionMessage] = useState(null);

  // AI Explanation states
  const [aiExplanations, setAiExplanations] = useState({});
  const [loadingExplanations, setLoadingExplanations] = useState({});

  const toggleSelect = (alt) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(alt.medicine._id);
      const next = exists
        ? prev.filter((val) => val !== alt.medicine._id)
        : [...prev, alt.medicine._id];
      return next.slice(0, 2); // max 2
    });
  };

  // Get AI Explanation
  const getAIExplanation = async (alt) => {
    if (aiExplanations[alt.medicine._id]) return; // Already loaded
    
    setLoadingExplanations(prev => ({ ...prev, [alt.medicine._id]: true }));

    try {
      const response = await fetch('/api/ai-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMedicine: {
            name: targetMedicine.name,
            composition: targetMedicine.composition
          },
          alternative: {
            name: alt.medicine.name,
            composition: alt.medicine.composition
          },
          commonIngredients: alt.comparison.commonIngredients || []
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiExplanations(prev => ({
          ...prev,
          [alt.medicine._id]: data.explanation
        }));
      } else {
        setAiExplanations(prev => ({
          ...prev,
          [alt.medicine._id]: 'Unable to generate explanation at this time.'
        }));
      }
    } catch (error) {
      console.error('Failed to get AI explanation:', error);
      setAiExplanations(prev => ({
        ...prev,
        [alt.medicine._id]: 'Error generating explanation. Please try again.'
      }));
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [alt.medicine._id]: false }));
    }
  };

useEffect(() => {
  if (!router.isReady) return;
  
  if (id) {
    fetchAlternatives();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id, router.isReady]); // Disable warning for fetchAlternatives


const fetchAlternatives = async () => {
  setLoading(true);
  setError(null);
  setInteractionMessage(null);
  setSelectedIds([]);

  try {
    const response = await fetch(
      `/api/medicines/alternatives?medicineId=${id}&maxResults=10&minScore=0.3`
    );
    const data = await response.json();

    // DEBUG: Log the response
    console.log('API Response:', {
      success: data.success,
      alternativesCount: data.alternatives?.length,
      firstAlt: data.alternatives?.[0],
      medicineName: data.alternatives?.[0]?.medicine?.name
    });

    if (data.success) {
      const parsedTarget = {
        ...data.targetMedicine,
        parsedInteractions: parseDrugInteractions(
          data.targetMedicine.drugInteractions
        ),
        sideEffectsList: (data.targetMedicine.sideEffects || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const parsedAlternatives = data.alternatives.map((alt) => ({
        ...alt,
        medicine: {
          ...alt.medicine,
          parsedInteractions: parseDrugInteractions(
            alt.medicine.drugInteractions
          ),
          sideEffectsList: (alt.medicine.sideEffects || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }));

      // DEBUG: Log parsed data
      console.log('Parsed alternatives:', parsedAlternatives.length);
      console.log('First parsed medicine:', parsedAlternatives[0]?.medicine?.name);

      setTargetMedicine(parsedTarget);
      setAlternatives(parsedAlternatives);
    } else {
      setError(data.message || 'Failed to fetch alternatives');
    }
  } catch (err) {
    setError('Failed to load alternatives. Please try again.');
    console.error('Alternatives error:', err);
  } finally {
    setLoading(false);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="relative mx-auto mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-100 border-t-pharmaGreen-700"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <svg className="w-6 h-6 text-pharmaGreen-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-gray-700 font-medium text-lg">Finding alternatives...</p>
            <p className="text-gray-500 text-sm mt-2">Analyzing medicine database</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-red-800 font-semibold mb-1">Error Loading Alternatives</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <Link href="/alternatives" className="inline-flex items-center text-pharmaGreen-700 hover:text-pharmaGreen-800 font-medium mt-6 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Search
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <Link href="/alternatives" className="inline-flex items-center text-pharmaGreen-700 hover:text-pharmaGreen-800 font-medium mb-4 transition-colors group">
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Search
          </Link>
          
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 text-pharmaGreen-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">Medicine Alternatives</h1>
            </div>
            <p className="text-gray-600 text-sm">Compare and find suitable alternatives for your prescribed medication</p>
          </div>
        </div>

        {/* Target Medicine Info */}
        {targetMedicine && (
          <div className="bg-white rounded-xl shadow-md border border-green-200 p-6 mb-8">
            <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
              <div className="bg-pharmaGreen-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-pharmaGreen-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Original Medicine</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  {targetMedicine.name}
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pharmaGreen-100 text-pharmaGreen-700 text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                      C
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Composition</p>
                      <p className="text-sm text-gray-600">{targetMedicine.composition}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pharmaGreen-100 text-pharmaGreen-700 text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                      M
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Manufacturer</p>
                      <p className="text-sm text-gray-600">{targetMedicine.manufacturer}</p>
                    </div>
                  </div>
                </div>

                {/* Side Effects for target medicine */}
                {targetMedicine.sideEffectsList &&
                  targetMedicine.sideEffectsList.length > 0 && (
                    <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Common Side Effects
                      </p>
                      <ul className="space-y-1.5">
                        {targetMedicine.sideEffectsList
                          .slice(0, 5)
                          .map((se, idx) => (
                            <li key={idx} className="text-sm text-amber-800 flex items-start">
                              <span className="text-amber-500 mr-2">•</span>
                              <span>{se}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
              </div>

              <div className="bg-gradient-to-br from-pharmaGreen-50 to-emerald-50 rounded-lg p-5 flex flex-col justify-between">
                {targetMedicine.price > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <p className="text-3xl font-bold text-pharmaGreen-700">
                      ₹{targetMedicine.price.toFixed(2)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="inline-block bg-white border border-pharmaGreen-300 text-pharmaGreen-800 text-sm font-medium px-4 py-2 rounded-lg shadow-sm">
                    {targetMedicine.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alternatives Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="bg-pharmaGreen-100 text-pharmaGreen-800 text-lg font-bold rounded-lg px-3 py-1 mr-3">
                {alternatives.length}
              </span>
              Alternative Medicines
            </h2>
          </div>

          {alternatives.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 text-lg font-medium">No suitable alternatives found</p>
              <p className="text-gray-500 text-sm mt-2">Try searching for a different medicine</p>
            </div>
          ) : (
            <>
              <div className="space-y-5">
                {alternatives.map((alt, index) => {
                  const commonInteractionWithTarget =
                    getCommonInteractionDrugs(targetMedicine, alt.medicine);
                  const isSelected = selectedIds.includes(alt.medicine._id);

                  return (
                    <div
                      key={alt.medicine._id}
                      className={`bg-white rounded-xl shadow-md border-2 transition-all duration-200 hover:shadow-lg ${
                        isSelected ? 'border-pharmaGreen-500 ring-2 ring-pharmaGreen-100' : 'border-gray-200 hover:border-pharmaGreen-300'
                      }`}
                    >
                      <div className="p-6">
                        {/* Header with selection */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start flex-1">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pharmaGreen-100 text-pharmaGreen-800 text-sm font-bold mr-3 flex-shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {alt.medicine.name}
                              </h3>
                              {alt.medicine.prescriptionRequired && (
                                <span className="inline-flex items-center bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  Prescription Required
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <div className="bg-gradient-to-r from-pharmaGreen-100 to-green-100 text-pharmaGreen-800 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm">
                              {alt.similarity.score}% Match
                            </div>

                            <label className="flex items-center cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(alt)}
                                className="w-5 h-5 text-pharmaGreen-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-pharmaGreen-500 cursor-pointer"
                              />
                              <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 font-medium">
                                Compare
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Medicine Details */}
                          <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-start">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pharmaGreen-100 text-pharmaGreen-700 text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                                C
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Composition</p>
                                <p className="text-sm text-gray-600">{alt.medicine.composition}</p>
                              </div>
                            </div>

                            {/* Common Ingredients */}
                            {alt.comparison.commonIngredients && alt.comparison.commonIngredients.length > 0 && (
                              <div className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                                  ✓
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Common Ingredients</p>
                                  <div className="flex flex-wrap gap-2">
                                    {alt.comparison.commonIngredients.map((ing, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1 rounded-full"
                                      >
                                        {ing}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* AI Explanation Section - NEW HYBRID FEATURE */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-semibold text-purple-900 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  AI-Powered Analysis
                                </p>
                                
                                {!aiExplanations[alt.medicine._id] && !loadingExplanations[alt.medicine._id] && (
                                  <button
                                    onClick={() => getAIExplanation(alt)}
                                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full transition-colors font-medium flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Get Explanation
                                  </button>
                                )}
                              </div>

                              {loadingExplanations[alt.medicine._id] && (
                                <div className="flex items-center text-sm text-purple-700">
                                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Generating AI explanation...
                                </div>
                              )}

                              {aiExplanations[alt.medicine._id] && (
                                <div className="bg-white/60 rounded p-3 border border-purple-100">
                                  <p className="text-sm text-purple-900 leading-relaxed">
                                    {aiExplanations[alt.medicine._id]}
                                  </p>
                                </div>
                              )}

                              {!aiExplanations[alt.medicine._id] && !loadingExplanations[alt.medicine._id] && (
                                <p className="text-xs text-purple-700 italic">
                                  Click "Get Explanation" to see AI-generated analysis of why this is a suitable alternative
                                </p>
                              )}
                            </div>

                            <div className="flex items-start">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pharmaGreen-100 text-pharmaGreen-700 text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                                M
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Manufacturer</p>
                                <p className="text-sm text-gray-600">{alt.medicine.manufacturer}</p>
                              </div>
                            </div>

                            {/* Side Effects for alternative */}
                            {alt.medicine.sideEffectsList &&
                              alt.medicine.sideEffectsList.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                  <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Common Side Effects
                                  </p>
                                  <ul className="space-y-1">
                                    {alt.medicine.sideEffectsList
                                      .slice(0, 4)
                                      .map((se, idx) => (
                                        <li key={idx} className="text-xs text-amber-800 flex items-start">
                                          <span className="text-amber-500 mr-2">•</span>
                                          <span>{se}</span>
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              )}

                            {/* Interaction warning vs target */}
                            {commonInteractionWithTarget.length > 0 && (
                              <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r-lg p-4">
                                <div className="flex items-start">
                                  <svg className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-semibold text-orange-900 mb-1">
                                      Potential Drug Interaction Alert
                                    </p>
                                    <p className="text-xs text-orange-800">
                                      This alternative shares interaction alerts with the original medicine for{' '}
                                      <span className="font-semibold">
                                        {commonInteractionWithTarget.slice(0, 3).join(', ')}
                                        {commonInteractionWithTarget.length > 3 ? '…' : ''}
                                      </span>
                                      . Consult your healthcare provider before switching.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Price Comparison */}
                          <div className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-gray-50 to-pharmaGreen-50 border border-gray-200 rounded-xl p-5 h-full">
                              <div className="mb-4">
                                <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide font-medium">
                                  Price
                                </p>
                                {alt.medicine.price > 0 ? (
                                  <p className="text-3xl font-bold text-gray-900">
                                    ₹{alt.medicine.price.toFixed(2)}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">
                                    Price not available
                                  </p>
                                )}
                              </div>

                              {alt.medicine.price > 0 && targetMedicine.price > 0 && (
                                <div
                                  className={`rounded-lg p-4 mb-4 ${
                                    alt.comparison.priceStatus === 'cheaper'
                                      ? 'bg-green-100 border border-green-300'
                                      : alt.comparison.priceStatus === 'expensive'
                                      ? 'bg-red-100 border border-red-300'
                                      : 'bg-gray-100 border border-gray-300'
                                  }`}
                                >
                                  {alt.comparison.priceStatus === 'cheaper' ? (
                                    <div className="flex items-center">
                                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-bold text-green-800">
                                          Save ₹{Math.abs(alt.comparison.savings).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-green-700">
                                          {Math.abs(alt.comparison.priceDifference)}% cheaper
                                        </p>
                                      </div>
                                    </div>
                                  ) : alt.comparison.priceStatus === 'expensive' ? (
                                    <div className="flex items-center">
                                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-bold text-red-800">
                                          ₹{Math.abs(alt.comparison.savings).toFixed(2)} more
                                        </p>
                                        <p className="text-xs text-red-700">
                                          {alt.comparison.priceDifference}% expensive
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-800 text-center">
                                      Same price
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Ingredient Match Progress Bar */}
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 mb-2 font-medium">Ingredient Match</p>
                                <div className="flex items-center">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-3">
                                    <div
                                      className="bg-pharmaGreen-600 h-2.5 rounded-full transition-all duration-500"
                                      style={{ 
                                        width: `${Math.min(100, Math.max(0, alt.similarity?.ingredientMatch || 0))}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-bold text-pharmaGreen-700">
                                    {alt.similarity?.ingredientMatch || 0}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Check interaction between selected */}
              {alternatives.length > 0 && (
                <div className="mt-8 bg-white rounded-xl shadow-md border border-green-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                        <svg className="w-5 h-5 text-pharmaGreen-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Drug Interaction Checker
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Select exactly two medicines using the checkboxes above to check for potential interactions
                      </p>
                      <button
                        onClick={() => {
                          if (selectedIds.length !== 2) {
                            setInteractionMessage(
                              'Please select exactly two medicines to check interactions.'
                            );
                            return;
                          }
                          const [id1, id2] = selectedIds;
                          const m1 =
                            alternatives.find((a) => a.medicine._id === id1)?.medicine || null;
                          const m2 =
                            alternatives.find((a) => a.medicine._id === id2)?.medicine || null;

                          if (!m1 || !m2) {
                            setInteractionMessage('Could not find selected medicines.');
                            return;
                          }

                          const common = getCommonInteractionDrugs(m1, m2);

                          if (common.length > 0) {
                            setInteractionMessage(
                              `⚠️ Potential interaction detected: Both medicines have interaction alerts for ${common
                                .slice(0, 3)
                                .join(', ')}. Consult your healthcare professional before combining these medications.`
                            );
                          } else {
                            setInteractionMessage(
                              '✓ No shared interaction alerts found in our database. However, this does not guarantee safety. Always consult your healthcare professional before combining medications.'
                            );
                          }
                        }}
                        disabled={selectedIds.length !== 2}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                          selectedIds.length === 2
                            ? 'bg-pharmaGreen-700 hover:bg-pharmaGreen-800 text-white shadow-md hover:shadow-lg'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {selectedIds.length === 0
                          ? 'Select 2 Medicines'
                          : selectedIds.length === 1
                          ? 'Select 1 More Medicine'
                          : 'Check Interaction'}
                      </button>
                    </div>
                  </div>

                  {interactionMessage && (
                    <div
                      className={`mt-4 rounded-lg p-4 border-l-4 ${
                        interactionMessage.includes('⚠️')
                          ? 'bg-orange-50 border-orange-400'
                          : 'bg-green-50 border-green-400'
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          interactionMessage.includes('⚠️') ? 'text-orange-900' : 'text-green-900'
                        }`}
                      >
                        {interactionMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Medical disclaimer */}
        <div className="mt-10 bg-pharmaGreen-50 border-l-4 border-pharmaGreen-500 rounded-r-xl shadow-sm p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-pharmaGreen-700 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-bold text-pharmaGreen-900 mb-1">Medical Disclaimer</h4>
              <p className="text-xs text-pharmaGreen-800 leading-relaxed">
                This tool is for educational and informational purposes only and does not constitute medical advice, diagnosis, or treatment recommendation. 
                The information provided should not be used as a substitute for professional medical advice. Always consult a qualified healthcare professional 
                before starting, stopping, or switching any medication. Individual health conditions vary, and only a licensed medical practitioner can provide 
                personalized advice for your specific situation.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
