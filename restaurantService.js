import { menuItems as demoMenuItems, restaurantSettings as defaultSettings, sampleOrders as demoOrders, tables as demoTables } from '../data/demoData'
import { demoMode, getTableLink, supabase } from './supabase'

const normalizeMenuItem = (record) => ({
  id: record.id,
  name: record.name_en || record.name || 'Unnamed item',
  tamilName: record.name_ta || '',
  description: record.description_en || '',
  descriptionTa: record.description_ta || '',
  price: Number(record.price || 0),
  stock: Number(record.stock || 0),
  category: record.category?.slug || record.category || 'breakfast',
  image: record.image_url || record.image || '',
  active: record.is_active ?? true,
})

export const fetchRestaurantSettings = async () => {
  if (demoMode || !supabase) {
    return defaultSettings
  }

  const { data, error } = await supabase
    .from('restaurant_settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Restaurant settings fetch failed', error)
    return defaultSettings
  }

  if (!data) return defaultSettings

  return {
    ...defaultSettings,
    name: data.restaurant_name || defaultSettings.name,
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    currency: data.currency || defaultSettings.currency,
    taxRate: Number(data.tax_rate ?? defaultSettings.taxRate),
    discountRate: Number(data.discount_rate ?? defaultSettings.discountRate),
    logo: data.logo_url || '',
    language: data.language_preference || defaultSettings.language,
    theme: data.theme || defaultSettings.theme,
  }
}

export const fetchMenuItems = async () => {
  if (demoMode || !supabase) {
    return demoMenuItems
  }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*, category:menu_categories(slug)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Menu fetch failed', error)
    return []
  }

  return (data || []).map(normalizeMenuItem)
}

export const fetchOrders = async () => {
  if (demoMode || !supabase) {
    return demoOrders
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), restaurant_tables(table_number)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Orders fetch failed', error)
    return []
  }

  return (data || []).map((order) => ({
    id: order.order_number || order.id,
    tableNumber: order.restaurant_tables?.table_number || 0,
    status: order.status || 'placed',
    createdAt: order.created_at || new Date().toISOString(),
    total: Number(order.total_amount || 0),
    paymentStatus: order.payment_status || 'pending',
    paymentMethod: order.payment_method || 'cash',
    items: (order.order_items || []).map((item) => ({
      id: item.menu_item_id || item.id,
      name: item.item_name_en,
      tamilName: item.item_name_ta || '',
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
    })),
    instructions: order.instructions || '',
  }))
}

export const fetchRestaurantTables = async () => {
  if (demoMode || !supabase) {
    return demoTables
  }

  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('*')
    .order('table_number', { ascending: true })

  if (error) {
    console.error('Table fetch failed', error)
    return []
  }

  return (data || []).map((table) => ({
    id: table.id,
    number: table.table_number,
    qrCode: table.qr_code || getTableLink(table.table_number),
    status: table.status,
  }))
}

export const saveMenuItem = async (item) => {
  if (demoMode || !supabase) {
    return { ...item, id: item.id || Date.now().toString() }
  }

  const { data: category, error: categoryError } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('slug', item.category)
    .single()

  if (categoryError) {
    throw categoryError
  }

  const record = {
    category_id: category.id,
    name_en: item.name,
    name_ta: item.tamilName || null,
    description_en: item.description || '',
    description_ta: item.descriptionTa || '',
    image_url: item.image || null,
    price: Number(item.price || 0),
    stock: Number(item.stock || 0),
    is_active: Boolean(item.active),
    updated_at: new Date().toISOString(),
  }

  const result = item.id
    ? await supabase.from('menu_items').update(record).eq('id', item.id).select('*, category:menu_categories(slug)').single()
    : await supabase.from('menu_items').insert(record).select('*, category:menu_categories(slug)').single()

  if (result.error) {
    throw result.error
  }

  return normalizeMenuItem(result.data)
}

export const uploadMenuImage = async (file) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!file || !allowedImageTypes.includes(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP, or GIF image.')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image files must be 5MB or smaller.')
  }

  if (demoMode || !supabase) {
    return URL.createObjectURL(file)
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
  const imagePath = `${Date.now()}-${safeName}`
  const { error } = await supabase.storage
    .from('menu-images')
    .upload(imagePath, file, { cacheControl: '3600', contentType: file.type, upsert: false })

  if (error) throw error

  return supabase.storage.from('menu-images').getPublicUrl(imagePath).data.publicUrl
}

export const deleteMenuItem = async (itemId) => {
  if (demoMode || !supabase) {
    return { success: true }
  }

  const { error } = await supabase.from('menu_items').delete().eq('id', itemId)
  if (error) throw error
  return { success: true }
}

export const addRestaurantTable = async (number) => {
  if (demoMode || !supabase) {
    return {
      id: `tbl-${number}`,
      number,
      qrCode: getTableLink(number),
      status: 'available',
    }
  }

  const { data, error } = await supabase
    .from('restaurant_tables')
    .insert({ table_number: number, qr_code: getTableLink(number) })
    .select('*')
    .single()

  if (error) throw error

  return {
    id: data.id,
    number: data.table_number,
    qrCode: data.qr_code,
    status: data.status,
  }
}

export const deleteRestaurantTable = async (tableId) => {
  if (demoMode || !supabase) {
    return { success: true }
  }

  const { error } = await supabase.from('restaurant_tables').delete().eq('id', tableId)
  if (error) throw error
  return { success: true }
}

export const subscribeToMenuItems = (onChange) => {
  if (demoMode || !supabase) {
    return () => undefined
  }

  const channel = supabase
    .channel('smart-restaurant-menu-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, async () => {
      const nextItems = await fetchMenuItems()
      onChange(nextItems)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export const subscribeToOrders = (onChange) => {
  if (demoMode || !supabase) {
    return () => undefined
  }

  const channel = supabase
    .channel('smart-restaurant-orders-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
      const nextOrders = await fetchOrders()
      onChange(nextOrders)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export const createOrder = async (payload) => {
  if (demoMode || !supabase) {
    return {
      ...payload,
      createdAt: new Date().toISOString(),
      status: payload.status || 'placed',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
    }
  }

  const { data, error } = await supabase.rpc('place_order', {
    p_order_number: payload.id,
    p_table_number: payload.tableNumber,
    p_instructions: payload.instructions || '',
    p_items: payload.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    })),
  })

  if (error) {
    throw error
  }

  return {
    ...data,
    id: data.id,
    items: data.items || [],
  }
}

export const updateOrderStatus = async (orderId, nextStatus) => {
  if (demoMode || !supabase) {
    return { success: true }
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('order_number', orderId)

  if (error) {
    throw error
  }

  return { success: true }
}

export const updateOrderPayment = async (orderId, paymentData) => {
  if (demoMode || !supabase) {
    return { success: true }
  }

  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: paymentData.paymentStatus || 'pending',
      payment_method: paymentData.paymentMethod || 'cash',
      updated_at: new Date().toISOString(),
    })
    .eq('order_number', orderId)

  if (error) {
    throw error
  }

  return { success: true }
}
