import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
  },
  composition: {
    type: String,
    required: true,
  },
  ingredients: [{
    type: String,
  }],
  manufacturer: {
    type: String,
    required: true,
  },
  packSize: {
    type: String,
  },
  price: {
    type: Number,
    default: null,  // Changed from no default
  },
  category: {
    type: String,
    enum: ['Antibiotics', 'Antimalaria', 'Analgestics', 'Supplements', 'Steroids', 'Other'],
    default: 'Other',
  },
  prescriptionRequired: {
    type: Boolean,
    default: false,
  },
  usage: {
    type: String,
  },
  sideEffects: {
    type: String,
  },
  drugInteractions: {
    type: String,
  },
  subCategory: {
    type: String,
  },
  barcodeId: {
    type: String,
    unique: true,
    sparse: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Create text index for search
MedicineSchema.index({ name: 'text', composition: 'text', manufacturer: 'text' });

export default mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
