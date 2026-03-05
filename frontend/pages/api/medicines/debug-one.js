import dbConnect from '../../../lib/mongodb';
import Medicine from '../../../models/Medicine';

export default async function handler(req, res) {
  try {
    await dbConnect();

    // Replace with a real _id from Atlas that has a non-zero price
    const id = '694a57fe5993a7aa625467ec';

    const doc = await Medicine.findById(id).lean();

    return res.status(200).json({ doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
