import type { GroceryCategory, GroceryProduct } from '@/types';

export const GROCERY_TILES = [
  { name: 'Fresh Vegetables', icon: '🥬', tint: '#E4EFDE', count: 99, cat: 'produce' },
  { name: 'Fresh Fruits', icon: '🍎', tint: '#F6E2DC', count: 84, cat: 'produce' },
  { name: 'Dairy, Bread & Eggs', icon: '🥛', tint: '#EDE9FC', count: 110, cat: 'dairy' },
  { name: 'Rice, Atta & Dal', icon: '🍚', tint: '#F5EFD6', count: 99, cat: 'staples' },
  { name: 'Oils, Ghee & Masala', icon: '🫒', tint: '#F0EAD6', count: 110, cat: 'oils' },
  { name: 'Chicken, Meat & Fish', icon: '🍗', tint: '#F6E0EC', count: 114, cat: 'produce' },
  { name: 'Breakfast & Cereal', icon: '🥣', tint: '#E0EAF6', count: 107, cat: 'dairy' },
  { name: 'Chocolates & Ice-cream', icon: '🍫', tint: '#F6E2DC', count: 121, cat: 'snacks' },
  { name: 'Chips & Namkeen', icon: '🍟', tint: '#F5EFD6', count: 96, cat: 'snacks' },
  { name: 'Cold Drinks & Juices', icon: '🥤', tint: '#E4EFDE', count: 114, cat: 'beverages' },
  { name: 'Tea, Coffee & More', icon: '🍵', tint: '#EDE9FC', count: 107, cat: 'beverages' },
  { name: 'Cleaning & Household', icon: '🧼', tint: '#E0EAF6', count: 114, cat: 'household' },
];

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  { id: 'produce', name: 'Fresh Produce', icon: '🥬', tint: '#E4EFDE', count: 320, subs: ['Fruits', 'Vegetables', 'Herbs', 'Organic'] },
  { id: 'dairy', name: 'Dairy & Breakfast', icon: '🥛', tint: '#EDE9FC', count: 148, subs: ['Milk', 'Curd', 'Paneer', 'Butter', 'Cheese', 'Eggs'] },
  { id: 'oils', name: 'Oils, Ghee & Masala', icon: '🫒', tint: '#F0EAD6', count: 214, subs: ['Sunflower Oil', 'Mustard Oil', 'Peanut Oil', 'Rice Bran Oil', 'Olive Oil', 'Coconut Oil', 'Ghee', 'Garam Masala', 'Turmeric', 'Chilli Powder'] },
  { id: 'staples', name: 'Rice, Atta & Pulses', icon: '🌾', tint: '#F5EFD6', count: 176, subs: ['Rice', 'Atta', 'Flour', 'Pulses'] },
  { id: 'snacks', name: 'Snacks & Biscuits', icon: '🍪', tint: '#F6E2DC', count: 260, subs: ['Biscuits', 'Chips', 'Namkeen', 'Chocolates'] },
  { id: 'beverages', name: 'Beverages', icon: '🥤', tint: '#E4EFDE', count: 190, subs: ['Tea', 'Coffee', 'Juices', 'Soft Drinks'] },
  { id: 'frozen', name: 'Frozen Foods', icon: '🧊', tint: '#E0EAF6', count: 84, subs: ['Frozen Veg', 'Ready Meals', 'Ice Cream'] },
  { id: 'personal', name: 'Personal Care', icon: '🧴', tint: '#F6E0EC', count: 210, subs: ['Haircare', 'Skincare', 'Oral Care'] },
  { id: 'household', name: 'Household', icon: '🧼', tint: '#E0EAF6', count: 168, subs: ['Detergents', 'Cleaners', 'Tissues'] },
  { id: 'baby', name: 'Baby Care', icon: '🍼', tint: '#EDE9FC', count: 72, subs: ['Diapers', 'Baby Food', 'Wipes'] },
];

const A = '/assets/grocery/';

export const GROCERY_PRODUCTS: GroceryProduct[] = [
  { id: 'dhara-mus-1', cat: 'oils', sub: 'Mustard Oil', brand: 'Dhara', name: 'Mustard Oil', img: A + 'dhara-mus.png', emoji: '🟡', size: 1, unit: 'L', price: 159, mrp: 185, rating: 4.4, bestValue: true },
  { id: 'amul-ghee-1', cat: 'oils', sub: 'Ghee', brand: 'Amul', name: 'Cow Ghee', img: A + 'amul-ghee.png', emoji: '🧈', size: 1, unit: 'L', price: 585, mrp: 640, rating: 4.8, bestValue: true },
  { id: 'mdh-garam', cat: 'oils', sub: 'Garam Masala', brand: 'MDH', name: 'Garam Masala', img: A + 'mdh-garam.png', emoji: '🧂', size: 100, unit: 'g', price: 78, mrp: 90, rating: 4.7, bestValue: true },
  { id: 'sundrop-sf-1', cat: 'oils', sub: 'Sunflower Oil', brand: 'Sundrop', name: 'Heart Sunflower Oil', img: A + 'sundrop-sf.png', emoji: '🌻', size: 1, unit: 'L', price: 162, mrp: 185, rating: 4.5 },
  { id: 'fort-sf-5', cat: 'oils', sub: 'Sunflower Oil', brand: 'Fortune', name: 'Sunflower Oil Jar', img: A + 'fortune-jar.png', emoji: '🛢️', size: 5, unit: 'L', price: 685, mrp: 799, rating: 4.7 },
  { id: 'everest-turm', cat: 'oils', sub: 'Turmeric', brand: 'Everest', name: 'Turmeric Powder', img: A + 'everest-turm.png', emoji: '🟠', size: 200, unit: 'g', price: 66, mrp: 78, rating: 4.6 },
  { id: 'catch-chilli', cat: 'oils', sub: 'Chilli Powder', brand: 'Catch', name: 'Red Chilli Powder', img: A + 'catch-chilli.png', emoji: '🌶️', size: 200, unit: 'g', price: 88, mrp: 99, rating: 4.5 },
  { id: 'gowardhan-ghee', cat: 'oils', sub: 'Ghee', brand: 'Gowardhan', name: 'Cow Ghee', img: A + 'gowardhan-ghee.png', emoji: '🧈', size: 500, unit: 'ml', price: 315, mrp: 360, rating: 4.6 },
  { id: 'figaro-olive', cat: 'oils', sub: 'Olive Oil', brand: 'Figaro', name: 'Olive Oil', img: A + 'figaro-olive.png', emoji: '🫒', size: 500, unit: 'ml', price: 429, mrp: 520, rating: 4.5 },
  { id: 'amul-milk-1', cat: 'dairy', sub: 'Milk', brand: 'Amul', name: 'Taaza Toned Milk', emoji: '🥛', size: 1, unit: 'L', price: 68, mrp: 72, rating: 4.7, bestValue: true },
  { id: 'amul-butter', cat: 'dairy', sub: 'Butter', brand: 'Amul', name: 'Butter', emoji: '🧈', size: 500, unit: 'g', price: 275, mrp: 295, rating: 4.8 },
  { id: 'eggs-12', cat: 'dairy', sub: 'Eggs', brand: 'Farm Made', name: 'Brown Eggs', emoji: '🥚', size: 12, unit: 'pc', price: 84, mrp: 96, rating: 4.4 },
  { id: 'india-rice-5', cat: 'staples', sub: 'Rice', brand: 'India Gate', name: 'Basmati Rice', emoji: '🍚', size: 5, unit: 'kg', price: 545, mrp: 620, rating: 4.7, bestValue: true },
  { id: 'aashir-atta-5', cat: 'staples', sub: 'Atta', brand: 'Aashirvaad', name: 'Whole Wheat Atta', emoji: '🌾', size: 5, unit: 'kg', price: 265, mrp: 310, rating: 4.7 },
  { id: 'parle-g', cat: 'snacks', sub: 'Biscuits', brand: 'Parle', name: 'Parle-G', emoji: '🍪', size: 800, unit: 'g', price: 85, mrp: 95, rating: 4.7, bestValue: true },
  { id: 'tata-tea', cat: 'beverages', sub: 'Tea', brand: 'Tata Tea', name: 'Premium Leaf Tea', emoji: '🍵', size: 1, unit: 'kg', price: 465, mrp: 540, rating: 4.6 },
];

export const GROCERY_STORES = [
  { name: 'Blinkit', logo: 'b', bg: '#E4A800', mult: 1, delivery: '10 min', basket: 0.945 },
  { name: 'Zepto', logo: 'Z', bg: '#5433EB', mult: 1.02, delivery: '10 min', basket: 0.97 },
  { name: 'Amazon', logo: 'a', bg: '#232F3E', mult: 1.04, delivery: '2 days', basket: 1.008 },
  { name: 'BigBasket', logo: 'bb', bg: '#84C225', mult: 1.07, delivery: '2 days', basket: 0.99 },
] as const;

export const SAMPLE_LIST = '2L milk\n5kg basmati rice\nFortune sunflower oil 5L\nAmul butter\n1 dozen eggs\nAashirvaad atta 5kg\nParle-G biscuits';
