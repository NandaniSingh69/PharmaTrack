// Jaccard Similarity: measures similarity between two sets
export function jaccardSimilarity(set1, set2) {
  if (set1.length === 0 && set2.length === 0) return 1;
  if (set1.length === 0 || set2.length === 0) return 0;

  const s1 = new Set(set1.map(item => item.toLowerCase().trim()));
  const s2 = new Set(set2.map(item => item.toLowerCase().trim()));

  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);

  return intersection.size / union.size;
}

// Calculate similarity score between two medicines
export function calculateSimilarity(medicine1, medicine2) {
  // Ingredient similarity (most important - 70% weight)
  const ingredientScore = jaccardSimilarity(
    medicine1.ingredients || [],
    medicine2.ingredients || []
  );

  // Category match (20% weight)
  const categoryScore = medicine1.category === medicine2.category ? 1 : 0;

  // Manufacturer diversity bonus (10% weight - prefer different manufacturers)
  const manufacturerScore = medicine1.manufacturer !== medicine2.manufacturer ? 1 : 0;

  // Weighted total score
  const totalScore = (
    ingredientScore * 0.7 +
    categoryScore * 0.2 +
    manufacturerScore * 0.1
  );

  return {
    score: totalScore,
    ingredientMatch: ingredientScore,
    categoryMatch: categoryScore === 1,
    sameName: medicine1.name === medicine2.name,
  };
}

// Find alternatives for a given medicine
export function findAlternatives(targetMedicine, allMedicines, options = {}) {
  const {
    minScore = 0.3,           // Minimum similarity score
    maxResults = 10,          // Maximum number of results
    excludeSameName = true,   // Exclude medicines with same name
    preferDifferentManufacturer = true,
  } = options;

  const alternatives = [];

  for (const medicine of allMedicines) {
    // Skip the medicine itself
    if (medicine._id.toString() === targetMedicine._id.toString()) continue;

    // Skip if same name and excludeSameName is true
    if (excludeSameName && medicine.name === targetMedicine.name) continue;

    // Calculate similarity
    const similarity = calculateSimilarity(targetMedicine, medicine);

    // Only include if score is above threshold
    if (similarity.score >= minScore) {
      alternatives.push({
        medicine,
        similarity,
      });
    }
  }

  // Sort by similarity score (descending)
  alternatives.sort((a, b) => b.similarity.score - a.similarity.score);

  // Return top results
  return alternatives.slice(0, maxResults);
}

// Extract common ingredients between medicines
export function getCommonIngredients(medicine1, medicine2) {
  const ingredients1 = new Set(medicine1.ingredients.map(i => i.toLowerCase()));
  const ingredients2 = new Set(medicine2.ingredients.map(i => i.toLowerCase()));

  return [...ingredients1].filter(i => ingredients2.has(i));
}

// Calculate price difference percentage
export function calculatePriceDifference(price1, price2) {
  if (price1 === 0) return 0;
  return ((price2 - price1) / price1) * 100;
}