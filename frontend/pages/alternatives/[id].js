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

  // NEW: selection state for interaction checker
  const [selectedIds, setSelectedIds] = useState([]);
  const [interactionMessage, setInteractionMessage] = useState(null);

  const toggleSelect = (alt) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(alt.medicine._id);
      const next = exists
        ? prev.filter((val) => val !== alt.medicine._id)
        : [...prev, alt.medicine._id];
      return next.slice(0, 2); // max 2
    });
  };

  useEffect(() => {
    if (id) {
      fetchAlternatives();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

      if (data.success) {
        // Parse target medicine
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

        // Parse alternatives
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
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Finding alternatives...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
          <Link href="/alternatives"
            className="text-pharmaGreen-800 hover:underline mt-4 inline-block">
              ← Back to Search
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/alternatives"
           className="text-pharmaGreen-800 hover:underline mb-6 inline-block">
            ← Back to Search
          
        </Link>

        {/* Target Medicine Info */}
        {targetMedicine && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Original Medicine
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {targetMedicine.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Composition:</span>{' '}
                  {targetMedicine.composition}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Manufacturer:</span>{' '}
                  {targetMedicine.manufacturer}
                </p>

                {/* Side Effects for target medicine */}
                {targetMedicine.sideEffectsList &&
                  targetMedicine.sideEffectsList.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Common side effects:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {targetMedicine.sideEffectsList
                          .slice(0, 5)
                          .map((se, idx) => (
                            <li key={idx}>{se}</li>
                          ))}
                      </ul>
                    </div>
                  )}
              </div>
              <div className="flex flex-col justify-center">
                {targetMedicine.price > 0 && (
                  <p className="text-2xl font-bold text-green-600 mb-2">
                    ₹{targetMedicine.price.toFixed(2)}
                  </p>
                )}
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded inline-block w-fit">
                  {targetMedicine.category}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Alternatives Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Alternative Medicines ({alternatives.length})
          </h2>

          {alternatives.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">
                No suitable alternatives found for this medicine.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {alternatives.map((alt, index) => {
                  const commonInteractionWithTarget =
                    getCommonInteractionDrugs(targetMedicine, alt.medicine);

                  return (
                    <div
                      key={alt.medicine._id}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Medicine Details */}
                        <div className="lg:col-span-2">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {index + 1}. {alt.medicine.name}
                            </h3>

                            <div className="flex items-center space-x-3">
                              <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                                <span className="text-sm font-medium">
                                  {alt.similarity.score}% Match
                                </span>
                              </div>

                              {/* Selection checkbox */}
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(
                                    alt.medicine._id
                                  )}
                                  onChange={() => toggleSelect(alt)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <span className="text-xs text-gray-600">
                                  Select
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Composition:</span>{' '}
                            {alt.medicine.composition}
                          </p>

                          {/* Common Ingredients */}
                          {alt.comparison.commonIngredients.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Common Ingredients:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {alt.comparison.commonIngredients.map(
                                  (ing, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                    >
                                      {ing}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Manufacturer:</span>{' '}
                            {alt.medicine.manufacturer}
                          </p>

                          {/* Side Effects for alternative */}
                          {alt.medicine.sideEffectsList &&
                            alt.medicine.sideEffectsList.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Common side effects:
                                </p>
                                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                  {alt.medicine.sideEffectsList
                                    .slice(0, 4)
                                    .map((se, idx) => (
                                      <li key={idx}>{se}</li>
                                    ))}
                                </ul>
                              </div>
                            )}

                          {/* Interaction warning vs target */}
                          {commonInteractionWithTarget.length > 0 && (
                            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-yellow-800 mb-1">
                                Possible interaction warning
                              </p>
                              <p className="text-xs text-yellow-800">
                                This alternative shares interaction alerts with
                                the original medicine for{' '}
                                <span className="font-medium">
                                  {commonInteractionWithTarget
                                    .slice(0, 3)
                                    .join(', ')}
                                  {commonInteractionWithTarget.length > 3
                                    ? '…'
                                    : ''}
                                </span>
                                . Always consult a healthcare professional before
                                switching.
                              </p>
                            </div>
                          )}

                          {alt.medicine.prescriptionRequired && (
                            <span className="mt-3 inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                              ⚕️ Prescription Required
                            </span>
                          )}
                        </div>

                        {/* Price Comparison */}
                        <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4">
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-1">
                              Alternative Price
                            </p>
                            {alt.medicine.price > 0 ? (
                              <p className="text-2xl font-bold text-gray-900">
                                ₹{alt.medicine.price.toFixed(2)}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Price not available
                              </p>
                            )}
                          </div>

                          {alt.medicine.price > 0 &&
                            targetMedicine.price > 0 && (
                              <div
                                className={`p-3 rounded-lg ${
                                  alt.comparison.priceStatus === 'cheaper'
                                    ? 'bg-green-100'
                                    : alt.comparison.priceStatus ===
                                      'expensive'
                                    ? 'bg-red-100'
                                    : 'bg-gray-100'
                                }`}
                              >
                                {alt.comparison.priceStatus === 'cheaper' ? (
                                  <>
                                    <p className="text-sm font-medium text-green-800">
                                      Save ₹
                                      {Math.abs(
                                        alt.comparison.savings
                                      ).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-green-700">
                                      {Math.abs(
                                        alt.comparison.priceDifference
                                      )}
                                      % cheaper
                                    </p>
                                  </>
                                ) : alt.comparison.priceStatus ===
                                  'expensive' ? (
                                  <>
                                    <p className="text-sm font-medium text-red-800">
                                      ₹
                                      {Math.abs(
                                        alt.comparison.savings
                                      ).toFixed(2)}{' '}
                                      more
                                    </p>
                                    <p className="text-xs text-red-700">
                                      {alt.comparison.priceDifference}%
                                      expensive
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm font-medium text-gray-800">
                                    Same price
                                  </p>
                                )}
                              </div>
                            )}

                          <div className="mt-4">
                            <p className="text-xs text-gray-600">
                              Ingredient Match: {alt.similarity.ingredientMatch}
                              %
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Check interaction between selected */}
              {alternatives.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (selectedIds.length !== 2) {
                        setInteractionMessage(
                          'Select exactly two medicines to check interactions.'
                        );
                        return;
                      }
                      const [id1, id2] = selectedIds;
                      const m1 =
                        alternatives.find(
                          (a) => a.medicine._id === id1
                        )?.medicine || null;
                      const m2 =
                        alternatives.find(
                          (a) => a.medicine._id === id2
                        )?.medicine || null;

                      if (!m1 || !m2) {
                        setInteractionMessage(
                          'Could not find selected medicines.'
                        );
                        return;
                      }

                      const common = getCommonInteractionDrugs(m1, m2);

                      if (common.length > 0) {
                        setInteractionMessage(
                          `Possible interaction: both medicines have interaction alerts for ${common
                            .slice(0, 3)
                            .join(
                              ', '
                            )}. Always consult a healthcare professional.`
                        );
                      } else {
                        setInteractionMessage(
                          'No shared interaction alerts found in our dataset, but this is not a medical guarantee. Always consult a healthcare professional.'
                        );
                      }
                    }}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md transition"
                  >
                    Check interaction between selected
                  </button>

                  {interactionMessage && (
                    <p className="mt-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      {interactionMessage}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Medical disclaimer */}
        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600">
            Disclaimer: This tool is for educational and demonstration purposes
            only and does not constitute medical advice, diagnosis, or a
            prescription. Always consult a qualified healthcare professional
            before starting, stopping, or switching any medication.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
