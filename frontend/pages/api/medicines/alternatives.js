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

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        message: 'Medicine ID is required',
      });
    }

    // Get the target medicine WITH extra fields
    const targetMedicine = await Medicine.findById(medicineId)
      .select(
        'name composition ingredients manufacturer price category prescriptionRequired subCategory sideEffects drugInteractions'
      )
      .lean();

    if (!targetMedicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    // Build filter for potential alternatives
    const filter = {
      _id: { $ne: medicineId }, // Exclude the medicine itself
    };

    // Filter by same category (usually want alternatives in same category)
    if (category || targetMedicine.category) {
      filter.category = category || targetMedicine.category;
    }

    // Filter by max price if provided
    if (maxPrice) {
      filter.price = { $lte: parseFloat(maxPrice) };
    }

    // Get candidate medicines (limit to reasonable number for performance)
    const candidateMedicines = await Medicine.find(filter)
      .limit(1000)
      .select(
        'name composition ingredients manufacturer price category prescriptionRequired subCategory sideEffects drugInteractions'
      )
      .lean();

    // Find alternatives using similarity algorithm
    const alternatives = findAlternatives(targetMedicine, candidateMedicines, {
      minScore: parseFloat(minScore),
      maxResults: parseInt(maxResults),
      excludeSameName: true,
      preferDifferentManufacturer: true,
    });

    // Enhance results with additional information
    const enrichedAlternatives = alternatives.map((alt) => {
      const commonIngredients = getCommonIngredients(
        targetMedicine,
        alt.medicine
      );
      const priceDiff = calculatePriceDifference(
        targetMedicine.price,
        alt.medicine.price
      );

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
          score: Math.round(alt.similarity.score * 100), // percentage
          ingredientMatch: Math.round(alt.similarity.ingredientMatch * 100),
          categoryMatch: alt.similarity.categoryMatch,
        },
        comparison: {
          commonIngredients,
          priceDifference: Math.round(priceDiff),
          priceStatus:
            priceDiff < 0 ? 'cheaper' : priceDiff > 0 ? 'expensive' : 'same',
          savings: targetMedicine.price - alt.medicine.price,
        },
      };
    });

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
