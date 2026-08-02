// Simple script to populate the database with sample products.
// Run with: npm run seed
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Product = require('../models/Product');

dotenv.config();

const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Over-ear headphones with active noise cancellation and 30-hour battery life.',
    brand: 'SoundCore',
    category: 'Electronics',
    image: 'https://via.placeholder.com/400x400?text=Headphones',
    price: 59.99,
    countInStock: 25
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Insulated 32oz bottle that keeps drinks cold for 24 hours or hot for 12.',
    brand: 'HydroFlow',
    category: 'Home & Kitchen',
    image: 'https://via.placeholder.com/400x400?text=Water+Bottle',
    price: 24.99,
    countInStock: 60
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description: 'RGB backlit mechanical keyboard with blue switches and programmable macros.',
    brand: 'KeyForge',
    category: 'Electronics',
    image: 'https://via.placeholder.com/400x400?text=Keyboard',
    price: 79.99,
    countInStock: 15
  },
  {
    name: 'Yoga Mat with Carrying Strap',
    description: 'Non-slip 6mm thick exercise mat, eco-friendly TPE material.',
    brand: 'FlexFit',
    category: 'Sports & Outdoors',
    image: 'https://via.placeholder.com/400x400?text=Yoga+Mat',
    price: 19.99,
    countInStock: 40
  },
  {
    name: 'Ceramic Non-Stick Frying Pan',
    description: '10-inch frying pan, PFOA-free ceramic coating, oven safe to 500F.',
    brand: 'CookWell',
    category: 'Home & Kitchen',
    image: 'https://via.placeholder.com/400x400?text=Frying+Pan',
    price: 34.99,
    countInStock: 30
  }
];

const importData = async () => {
  try {
    await connectDB();
    await Product.deleteMany();
    await Product.insertMany(sampleProducts);
    console.log('Sample products imported successfully');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    process.exit(1);
  }
};

importData();
