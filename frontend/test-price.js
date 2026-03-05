function extractPrice(priceString) {
  if (!priceString) return 0;
  
  if (typeof priceString === 'number') {
    return priceString > 0 ? priceString : 0;
  }
  
  const cleaned = String(priceString)
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();
  
  const price = parseFloat(cleaned);
  return (isNaN(price) || price < 0) ? 0 : price;
}

// Test with your actual data
const testPrices = [
  '₹133.93',
  '₹121.91',
  '₹133.45',
  '₹364.96',
  '',
  null,
  undefined
];

console.log('Testing price extraction:');
testPrices.forEach(price => {
  console.log(`Input: "${price}" → Output: ${extractPrice(price)}`);
});
