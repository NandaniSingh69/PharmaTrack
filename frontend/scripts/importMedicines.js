const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env' });

// Import Medicine model
const medicineSchema = new mongoose.Schema({
  name: String,
  composition: String,
  ingredients: [String],
  manufacturer: String,
  packSize: String,
  price: Number,
  category: String,
  prescriptionRequired: Boolean,
  usage: String,
  sideEffects: String,
  drugInteractions: String,
  subCategory: String,
});

const Medicine = mongoose.model('Medicine', medicineSchema);

const MONGODB_URI = process.env.MONGODB_URI;

// Function to extract active ingredients from salt_composition
function extractIngredients(saltComposition) {
  if (!saltComposition) return [];
  
  // Remove dosage information (e.g., "40IU", "100mg", etc.)
  let cleaned = saltComposition.replace(/\(\d+[A-Za-z\/]+\)/g, '');
  
  // Split by common separators: +, /, ,
  const ingredients = cleaned
    .split(/[+\/,]/)
    .map(ing => ing.trim())
    .filter(ing => ing.length > 0);
  
  return ingredients;
}

// Function to extract price from string (₹133.93 → 133.93)
// Function to extract price from string (₹133.93 → 133.93)
// Function to extract price from string (₹133.93 → 133.93)
function extractPrice(priceString) {
  if (!priceString) return 0;
  
  // Handle if it's already a number
  if (typeof priceString === 'number') {
    return priceString > 0 ? priceString : 0;
  }
  
  // Convert to string and clean
  const cleaned = String(priceString)
    .replace(/₹/g, '')       // Remove rupee symbol
    .replace(/,/g, '')       // Remove commas
    .replace(/\s/g, '')      // Remove spaces
    .trim();
  
  const price = parseFloat(cleaned);
  
  // Return 0 if invalid or negative
  return (isNaN(price) || price < 0) ? 0 : price;
}



// Function to determine category based on sub_category
function mapCategory(subCategory) {
  if (!subCategory) return 'Other';
  
  const sub = subCategory.toLowerCase();
  
  if (sub.includes('antibiotic') || sub.includes('anti-bacterial')) {
    return 'Antibiotics';
  } else if (sub.includes('malaria') || sub.includes('anti-malarial')) {
    return 'Antimalaria';
  } else if (sub.includes('analgesic') || sub.includes('pain') || sub.includes('paracetamol')) {
    return 'Analgestics';
  } else if (sub.includes('vitamin') || sub.includes('supplement') || sub.includes('calcium') || sub.includes('mineral')) {
    return 'Supplements';
  } else if (sub.includes('steroid') || sub.includes('corticosteroid')) {
    return 'Steroids';
  }
  
  return 'Other';
}

// Check if prescription required based on description
function isPrescriptionRequired(description, subCategory) {
  const text = (description + ' ' + subCategory).toLowerCase();
  
  // Certain categories typically require prescription
  if (text.includes('prescription')) return true;
  if (text.includes('antibiotic')) return true;
  if (text.includes('steroid')) return true;
  if (text.includes('insulin')) return true;
  
  return false;
}

async function importData() {
  try {
    // Connect to MongoDB
   await mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log('✅ Connected to MongoDB');
console.log('📦 Import script DB name:', mongoose.connection.name);

    // Clear existing data
    await Medicine.deleteMany({});
    console.log('🗑️  Cleared existing medicines');

    const medicines = [];
    const csvPath = './data/medicine_data.csv'; // Adjust if your filename is different

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found at:', csvPath);
      console.log('📁 Looking for CSV files in data folder...');
      const files = fs.readdirSync('./data').filter(f => f.endsWith('.csv'));
      if (files.length > 0) {
        console.log('Found CSV files:', files);
        console.log(`Please update csvPath to: './data/${files[0]}'`);
      }
      process.exit(1);
    }

    console.log('📖 Reading CSV file...');

    // Read CSV file
    fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    // Map CSV columns to our schema
    const medicine = {
      name: row.product_name || row.name || 'Unknown Medicine',
      composition: row.salt_composition || row.composition || '',
      manufacturer: row.product_manufactured || row.manufacturer || 'Unknown',
      price: extractPrice(row.product_price),  // Make sure this line is correct
      usage: row.medicine_desc || row.usage || '',
      sideEffects: row.side_effects || '',
      drugInteractions: row.drug_interactions || '',
      subCategory: row.sub_category || '',
    };

    // Extract ingredients from salt composition
    medicine.ingredients = extractIngredients(medicine.composition);
    
    // Determine category
    medicine.category = mapCategory(medicine.subCategory);
    
    // Check if prescription required
    medicine.prescriptionRequired = isPrescriptionRequired(
      medicine.usage, 
      medicine.subCategory
    );

    // Only add if we have essential data
    if (medicine.name && medicine.composition) {
      medicines.push(medicine);
    }
  })

      .on('end', async () => {
        try {
          console.log(`\n📊 Total medicines to import: ${medicines.length}`);

          // Insert medicines in batches
          const batchSize = 1000;
          let imported = 0;
          
          for (let i = 0; i < medicines.length; i += batchSize) {
            const batch = medicines.slice(i, i + batchSize);
            await Medicine.insertMany(batch, { ordered: false });
            imported += batch.length;
            console.log(`✅ Imported ${imported}/${medicines.length} medicines`);
          }

          console.log(`\n🎉 Successfully imported ${medicines.length} medicines!`);
          
          // Show statistics
          const stats = await Medicine.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]);
          
          console.log('\n📊 Category Statistics:');
          stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count}`);
          });

          // Show sample data
          console.log('\n📝 Sample Medicine Data:');
          const sample = await Medicine.findOne({ 
            ingredients: { $exists: true, $ne: [] } 
          });
          if (sample) {
            console.log('   Name:', sample.name);
            console.log('   Composition:', sample.composition);
            console.log('   Ingredients:', sample.ingredients);
            console.log('   Manufacturer:', sample.manufacturer);
            console.log('   Price: ₹', sample.price);
            console.log('   Category:', sample.category);
          }

          // Show ingredient statistics
          const withIngredients = await Medicine.countDocuments({ 
            ingredients: { $exists: true, $ne: [] } 
          });
          console.log(`\n✅ ${withIngredients} medicines have ingredient data`);
          console.log(`   This is ${((withIngredients/medicines.length)*100).toFixed(1)}% of total`);

          process.exit(0);
        } catch (error) {
          console.error('❌ Error importing data:', error);
          process.exit(1);
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        process.exit(1);
      });

  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

importData();
