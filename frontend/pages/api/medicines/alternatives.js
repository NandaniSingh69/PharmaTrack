import dbConnect from '../../../lib/mongodb';
import Medicine from '../../../models/Medicine';
import {
  findAlternatives,
  getCommonIngredients,
  calculatePriceDifference,
} from '../../../utils/medicineSimilarity';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const {
      medicineId,
      minScore = 0.3,
      maxResults = 10,
      category,
      maxPrice,
    } = req.query;

    console.log('\n=== ALTERNATIVES API CALLED ===');
    console.log('Medicine ID:', medicineId);
    console.log('Query params:', { minScore, maxResults, category, maxPrice });

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        message: 'Medicine ID is required',
      });
    }

    const targetMedicine = await Medicine.findById(medicineId)
      .select('name composition ingredients manufacturer price category prescriptionRequired subCategory sideEffects drugInteractions')
      .lean();

    console.log('Target Medicine:', {
      name: targetMedicine?.name,
      category: targetMedicine?.category,
      ingredients: targetMedicine?.ingredients
    });

    if (!targetMedicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    // Extract and clean target ingredients for regex matching
    const targetIngredients = targetMedicine.ingredients || [];
    const cleanedIngredients = targetIngredients
      .map(ing => 
        ing.toLowerCase().trim()
          .replace(/\([^)]*\)/g, '') // Remove parentheses content
          .replace(/\d+\s*(mg|g|ml|mcg|iu|%|w\/w|v\/v)/gi, '') // Remove dosages
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(ing => ing.length > 2);

    console.log('Searching for ingredients:', cleanedIngredients);

    // STEP 1: Find medicines with matching ingredients (highest priority)
    let candidateMedicines = [];
    
    if (cleanedIngredients.length > 0) {
      const ingredientPatterns = cleanedIngredients.map(ing => new RegExp(ing, 'i'));
      
      const filter = {
        _id: { $ne: medicineId },
        $or: ingredientPatterns.map(pattern => ({ 
          ingredients: { $regex: pattern } 
        })),
      };

      if (maxPrice) {
        filter.price = { $lte: parseFloat(maxPrice) };
      }

      candidateMedicines = await Medicine.find(filter)
        .limit(500)
        .select('name composition ingredients manufacturer price category prescriptionRequired subCategory sideEffects drugInteractions')
        .lean();

      console.log('✓ Candidates with matching ingredients:', candidateMedicines.length);
    }

    // STEP 2: If not enough, add random same-category medicines
    if (candidateMedicines.length < 100) {
      console.log('→ Expanding to same category (random sample)...');
      
      const categoryFilter = {
        _id: { $ne: medicineId },
        category: category || targetMedicine.category,
      };

      if (maxPrice) {
        categoryFilter.price = { $lte: parseFloat(maxPrice) };
      }

      const additionalCandidates = await Medicine.aggregate([
        { $match: categoryFilter },
        { $sample: { size: 1500 } }, // Random sampling
        {
          $project: {
            name: 1,
            composition: 1,
            ingredients: 1,
            manufacturer: 1,
            price: 1,
            category: 1,
            prescriptionRequired: 1,
            subCategory: 1,
            sideEffects: 1,
            drugInteractions: 1,
          },
        },
      ]);

      // Combine and remove duplicates by _id
      const existingIds = new Set(candidateMedicines.map(m => m._id.toString()));
      const uniqueAdditional = additionalCandidates.filter(
        m => !existingIds.has(m._id.toString())
      );

      candidateMedicines = [...candidateMedicines, ...uniqueAdditional];
      console.log('✓ Total after category expansion:', candidateMedicines.length);
    }

    // Find alternatives using similarity algorithm
    let alternatives = findAlternatives(targetMedicine, candidateMedicines, {
  minScore: parseFloat(minScore),
  maxResults: parseInt(maxResults),
  excludeSameName: true,
  preferDifferentManufacturer: true,
});

// ✅ ADD DEDUPLICATION HERE (right after first findAlternatives)
// Replace the dedup code with this stronger version
console.log('Alternatives before dedup:', alternatives.length);

const uniqueByNameAndIngredients = new Map();
for (const alt of alternatives) {
  // Create a unique key using name + sorted ingredients
  const ingredientsKey = (alt.medicine.ingredients || [])
    .map(i => i.toLowerCase().trim())
    .sort()
    .join('|');
  const key = `${alt.medicine.name.toLowerCase().trim()}::${ingredientsKey}`;
  
  if (!uniqueByNameAndIngredients.has(key)) {
    uniqueByNameAndIngredients.set(key, alt);
  } else {
    console.log(`  Skipping duplicate: ${alt.medicine.name}`);
  }
}
alternatives = Array.from(uniqueByNameAndIngredients.values());

console.log('Alternatives after dedup:', alternatives.length);

// ✅ END DEDUP CODE

// STEP 3: If still no matches, search ALL categories (last resort)
if (alternatives.length === 0 && candidateMedicines.length < 2000) {
  console.log('→ No matches found, expanding to ALL categories...');
  
  const allCategoriesFilter = {
    _id: { $ne: medicineId },
  };

  if (maxPrice) {
    allCategoriesFilter.price = { $lte: parseFloat(maxPrice) };
  }

  const allCategoriesCandidates = await Medicine.aggregate([
    { $match: allCategoriesFilter },
    { $sample: { size: 3000 } },
    {
      $project: {
        name: 1,
        composition: 1,
        ingredients: 1,
        manufacturer: 1,
        price: 1,
        category: 1,
        prescriptionRequired: 1,
        subCategory: 1,
        sideEffects: 1,
        drugInteractions: 1,
      },
    },
  ]);

  console.log('✓ All categories sample:', allCategoriesCandidates.length);

  alternatives = findAlternatives(targetMedicine, allCategoriesCandidates, {
    minScore: parseFloat(minScore),
    maxResults: parseInt(maxResults),
    excludeSameName: true,
    preferDifferentManufacturer: true,
  });

  // ✅ ALSO DEDUPLICATE AFTER SECOND findAlternatives
  console.log('All-categories alternatives before dedup:', alternatives.length);
  
  const uniqueById2 = new Map();
  for (const alt of alternatives) {
    const id = alt.medicine._id.toString();
    if (!uniqueById2.has(id)) {
      uniqueById2.set(id, alt);
    }
  }
  alternatives = Array.from(uniqueById2.values());
  
  console.log('All-categories alternatives after dedup:', alternatives.length);
  // ✅ END SECOND DEDUP
}

console.log('Final alternatives:', alternatives.length);

// Handle no results
if (alternatives.length === 0) {
  console.log('=== END (No alternatives found) ===\n');
  return res.status(200).json({
    success: true,
    targetMedicine: {
      _id: targetMedicine._id,
      name: targetMedicine.name,
      composition: targetMedicine.composition,
      ingredients: targetMedicine.ingredients,
      manufacturer: targetMedicine.manufacturer,
      price: targetMedicine.price,
      category: targetMedicine.category,
      prescriptionRequired: targetMedicine.prescriptionRequired,
      subCategory: targetMedicine.subCategory,
      sideEffects: targetMedicine.sideEffects,
      drugInteractions: targetMedicine.drugInteractions,
    },
    alternatives: [],
    count: 0,
    message: `No suitable alternatives found for ${targetMedicine.name} with matching active ingredients.`
  });
}

    // Enrich alternatives with comparison data
    const enrichedAlternatives = alternatives.map((alt) => {
      const commonIngredients = getCommonIngredients(targetMedicine, alt.medicine);
      const priceDiff = calculatePriceDifference(targetMedicine.price, alt.medicine.price);

      return {
        medicine: {
          _id: alt.medicine._id,
          name: alt.medicine.name,
          composition: alt.medicine.composition,
          ingredients: alt.medicine.ingredients,
          manufacturer: alt.medicine.manufacturer,
          price: alt.medicine.price,
          category: alt.medicine.category,
          prescriptionRequired: alt.medicine.prescriptionRequired,
          subCategory: alt.medicine.subCategory,
          sideEffects: alt.medicine.sideEffects,
          drugInteractions: alt.medicine.drugInteractions,
        },
        similarity: {
          score: Math.round(alt.similarity.score * 100),
          ingredientMatch: Math.round(alt.similarity.ingredientMatch * 100),
          categoryMatch: alt.similarity.categoryMatch,
        },
        comparison: {
          commonIngredients,
          priceDifference: Math.round(priceDiff),
          priceStatus: priceDiff < 0 ? 'cheaper' : priceDiff > 0 ? 'expensive' : 'same',
          savings: targetMedicine.price - alt.medicine.price,
        },
      };
    });

    console.log('First alternative:', enrichedAlternatives[0]?.medicine?.name);
    console.log('=== END ===\n');

    return res.status(200).json({
      success: true,
      targetMedicine: {
        _id: targetMedicine._id,
        name: targetMedicine.name,
        composition: targetMedicine.composition,
        ingredients: targetMedicine.ingredients,
        manufacturer: targetMedicine.manufacturer,
        price: targetMedicine.price,
        category: targetMedicine.category,
        prescriptionRequired: targetMedicine.prescriptionRequired,
        subCategory: targetMedicine.subCategory,
        sideEffects: targetMedicine.sideEffects,
        drugInteractions: targetMedicine.drugInteractions,
      },
      alternatives: enrichedAlternatives,
      count: enrichedAlternatives.length,
    });
  } catch (error) {
    console.error('Alternatives API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}
