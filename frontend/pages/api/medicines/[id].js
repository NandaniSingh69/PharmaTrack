import dbConnect from '../../../lib/mongodb';
import Medicine from '../../../models/Medicine';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { id } = req.query;

    const medicine = await Medicine.findById(id).lean();

    if (!medicine) {
      return res.status(404).json({ 
        success: false,
        message: 'Medicine not found' 
      });
    }

    return res.status(200).json({
      success: true,
      data: medicine,
    });

  } catch (error) {
    console.error('Medicine Details API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}
