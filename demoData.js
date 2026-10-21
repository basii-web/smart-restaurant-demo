export const restaurantSettings = {
  name: 'Restaurant',
  logo: '',
  address: '',
  phone: '',
  email: '',
  currency: 'INR',
  taxRate: 5,
  discountRate: 0,
  theme: 'cobalt',
  language: 'en',
}

export const menuCategories = [
  { id: 'breakfast', en: 'Breakfast', ta: 'காலை உணவு', color: '#ff8fab' },
  { id: 'meals', en: 'Meals', ta: 'சாப்பாடு', color: '#4ecdc4' },
  { id: 'biriyani', en: 'Biriyani', ta: 'பிரியாணி', color: '#ffb703' },
  { id: 'snacks', en: 'Snacks', ta: 'சிற்றுண்டி', color: '#7c6cff' },
  { id: 'drinks', en: 'Drinks', ta: 'பானங்கள்', color: '#36c1ff' },
  { id: 'desserts', en: 'Desserts', ta: 'இனிப்புகள்', color: '#ff7b54' },
]

export const menuItems = [
  {
    id: 'dosa-classic',
    name: 'Classic Masala Dosa',
    tamilName: 'கிளாசிக் மசாலா தோசை',
    description: 'Crisp dosa with spiced potato filling and chutneys.',
    descriptionTa: 'மசாலா உருண்டை, சட்னி மற்றும் இனிப்பு சுவை.',
    price: 120,
    stock: 18,
    category: 'breakfast',
    image:
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'idli-sambar',
    name: 'Idli with Sambar',
    tamilName: 'இட்லி சாம்பார்',
    description: 'Soft steamed rice cakes served with hot sambar and chutney.',
    descriptionTa: 'மென்மையான இட்லி, சாம்பார் மற்றும் சட்னி.',
    price: 90,
    stock: 22,
    category: 'breakfast',
    image:
      'https://images.unsplash.com/photo-1617093928842-7d7d3f4d3076?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'mini-meal',
    name: 'South Indian Meal',
    tamilName: 'தென்னிந்திய உணவு',
    description: 'A complete meal with sambar, poriyal, rice, rasam, and curd.',
    descriptionTa: 'சாம்பார், பருப்பு, அரிசி, ரசம் மற்றும் தயிர் உள்ள உணவு.',
    price: 180,
    stock: 14,
    category: 'meals',
    image:
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'chicken-biriyani',
    name: 'Chicken Biriyani',
    tamilName: 'சிக்கன் பிரியாணி',
    description: 'Aromatic rice layered with tender chicken and biriyani spices.',
    descriptionTa: 'சுவையான அரிசி, மென்மையான சிக்கன் மற்றும் பிரியாணி மசாலா.',
    price: 240,
    stock: 9,
    category: 'biriyani',
    image:
      'https://images.unsplash.com/photo-1633945274408-d3b0c8794f59?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'veg-biriyani',
    name: 'Veg Biriyani',
    tamilName: 'வெஜ் பிரியாணி',
    description: 'Fragrant biriyani rice with vegetables and rich masala.',
    descriptionTa: 'காய்கறி மற்றும் பிரியாணி மசாலா சேர்த்த மணமான அரிசி.',
    price: 210,
    stock: 0,
    category: 'biriyani',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'vada',
    name: 'Crispy Medu Vada',
    tamilName: 'க்ரிஸ்பி மேது வடை',
    description: 'Golden-fried lentil fritters with coconut chutney.',
    descriptionTa: 'தேங்காய் சட்னியுடன் முந்திரி பருப்பு வடை.',
    price: 85,
    stock: 16,
    category: 'snacks',
    image:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'fresh-lime',
    name: 'Fresh Lime Soda',
    tamilName: 'புதிது நொறுக்கு எலுமிச்சை சோடா',
    description: 'Refreshing fizzy lime soda with mint and a pinch of salt.',
    descriptionTa: 'புதிதான எலுமிச்சை, மின்ட் மற்றும் காரமான சோடா.',
    price: 70,
    stock: 27,
    category: 'drinks',
    image:
      'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'mango-lassi',
    name: 'Mango Lassi',
    tamilName: 'மாம்பழ லசெ',
    description: 'Sweet mango yoghurt drink blended smooth and chilled.',
    descriptionTa: 'மாங்கனியில் இருந்து தயாரிக்கப்பட்ட இனிப்பு தயிர் பானம்.',
    price: 90,
    stock: 12,
    category: 'drinks',
    image:
      'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'gulab-jamun',
    name: 'Gulab Jamun',
    tamilName: 'குலாப் ஜாமுன்',
    description: 'Soft dumplings soaked in warm saffron syrup.',
    descriptionTa: 'மென்மையான இழைவுடன் குங்குமப்பூ சர்பத்தில் ஊறவைத்த இனிப்பு.',
    price: 80,
    stock: 11,
    category: 'desserts',
    image:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
]

export const tables = [
  { id: 'tbl-1', number: 1, qrCode: 'https://example.com/order?table=1', status: 'available' },
  { id: 'tbl-2', number: 2, qrCode: 'https://example.com/order?table=2', status: 'occupied' },
  { id: 'tbl-3', number: 3, qrCode: 'https://example.com/order?table=3', status: 'available' },
  { id: 'tbl-4', number: 4, qrCode: 'https://example.com/order?table=4', status: 'occupied' },
  { id: 'tbl-5', number: 5, qrCode: 'https://example.com/order?table=5', status: 'available' },
]

export const sampleOrders = [
  {
    id: 'ORD-1001',
    tableNumber: 2,
    status: 'placed',
    createdAt: '2026-10-15T09:15:00',
    items: [
      { id: 'dosa-classic', name: 'Classic Masala Dosa', quantity: 2, unitPrice: 120 },
      { id: 'fresh-lime', name: 'Fresh Lime Soda', quantity: 1, unitPrice: 70 },
    ],
    instructions: 'Less spicy, extra chutney.',
  },
  {
    id: 'ORD-1002',
    tableNumber: 4,
    status: 'cooking',
    createdAt: '2026-10-15T09:20:00',
    items: [
      { id: 'mini-meal', name: 'South Indian Meal', quantity: 1, unitPrice: 180 },
      { id: 'mango-lassi', name: 'Mango Lassi', quantity: 2, unitPrice: 90 },
    ],
    instructions: 'No onion in the meal.',
  },
  {
    id: 'ORD-1003',
    tableNumber: 5,
    status: 'ready',
    createdAt: '2026-10-15T09:25:00',
    items: [
      { id: 'chicken-biriyani', name: 'Chicken Biriyani', quantity: 1, unitPrice: 240 },
    ],
    instructions: '',
  },
]

export const staffRoles = [
  { id: 'admin', label: 'Admin' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'cashier', label: 'Cashier' },
]

export const defaultLanguage = 'en'
