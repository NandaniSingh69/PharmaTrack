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

    // Execute search
    const medicines = await Medicine.find(filter)
      .limit(parseInt(limit))
      .select('name composition ingredients manufacturer price category prescriptionRequired subCategory')
      .lean();

    return res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
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
