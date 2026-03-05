import dbConnect from '../../../lib/mongodb';
import Medicine from '../../../models/Medicine';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { query, category, maxPrice, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Build search filter
    const filter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { composition: { $regex: query, $options: 'i' } },
        { ingredients: { $regex: query, $options: 'i' } },
      ],
    };

    // Add category filter if provided
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Add price filter if provided
    if (maxPrice) {
      filter.price = { $lte: parseFloat(maxPrice) };
    }

    // Execute search - get more results to account for deduplication
    let medicines = await Medicine.find(filter)
      .limit(parseInt(limit) * 3) // ✅ Get 3x more to compensate for duplicates
      .select('name composition ingredients manufacturer price category prescriptionRequired subCategory')
      .lean();

    console.log('Search results before dedup:', medicines.length);

    // ✅ Deduplicate by name + ingredients
    const uniqueByKey = new Map();
    for (const medicine of medicines) {
      const ingredientsKey = (medicine.ingredients || [])
        .map(i => i.toLowerCase().trim())
        .sort()
        .join('|');
      const key = `${medicine.name.toLowerCase().trim()}::${ingredientsKey}`;
      
      if (!uniqueByKey.has(key)) {
        uniqueByKey.set(key, medicine);
      }
    }
    
    // ✅ Convert back to array and limit to requested amount
    const dedupedMedicines = Array.from(uniqueByKey.values()).slice(0, parseInt(limit));

    console.log('Search results after dedup:', dedupedMedicines.length);

    return res.status(200).json({
      success: true,
      count: dedupedMedicines.length,
      data: dedupedMedicines, // ✅ Use dedupedMedicines instead of medicines
    });

  } catch (error) {
    console.error('Search API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}
