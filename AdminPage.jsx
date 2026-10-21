import { useMemo, useState } from 'react'
import { BarChart3, QrCode, Users, UtensilsCrossed, Plus, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { menuCategories, restaurantSettings as defaultRestaurantSettings, staffRoles } from '../data/demoData'
import { formatCurrency } from '../services/supabase'
import { getTranslation } from '../translations'

const getOrderTotal = (order, taxRate) => {
  if (Number.isFinite(Number(order.total))) return Number(order.total)
  const subtotal = order.items?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0
  return subtotal * (1 + taxRate / 100)
}

export default function AdminPage({ language, restaurantSettings = defaultRestaurantSettings, menuItems, orders = [], tables, onSaveMenuItem, onDeleteMenuItem, onAddTable, onDeleteTable, onUploadMenuImage }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [tableNumber, setTableNumber] = useState(6)
  const [editingItemId, setEditingItemId] = useState(null)
  const [formError, setFormError] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [today] = useState(() => new Date().toDateString())
  const [formData, setFormData] = useState({
    name: '',
    tamilName: '',
    price: 0,
    stock: 0,
    category: 'breakfast',
    active: true,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  })

  const filteredMenu = useMemo(() => {
    if (selectedCategory === 'all') return menuItems
    return menuItems.filter((item) => item.category === selectedCategory)
  }, [menuItems, selectedCategory])

  const todayOrders = useMemo(() => {
    return orders.filter((order) => new Date(order.createdAt).toDateString() === today)
  }, [orders, today])

  const pendingOrderCount = orders.filter((order) => ['placed', 'cooking', 'ready'].includes(order.status)).length
  const occupiedTableCount = tables.filter((table) => table.status === 'occupied').length
  const todaySales = todayOrders.reduce((sum, order) => sum + getOrderTotal(order, restaurantSettings.taxRate), 0)
  const monthSales = orders
    .filter((order) => {
      const orderDate = new Date(order.createdAt)
      const currentDate = new Date(today)
      return orderDate.getFullYear() === currentDate.getFullYear()
        && orderDate.getMonth() === currentDate.getMonth()
    })
    .reduce((sum, order) => sum + getOrderTotal(order, restaurantSettings.taxRate), 0)

  const generateQrCode = (number) => `https://restaurant.local/order?table=${number}`

  const addOrUpdateMenuItem = async () => {
    if (!formData.name.trim()) return

    const payload = {
      id: editingItemId || undefined,
      name: formData.name,
      tamilName: formData.tamilName,
      description: 'Freshly prepared in-house.',
      descriptionTa: 'இருக்கையில் தயாரிக்கப்பட்டது.',
      price: Number(formData.price || 0),
      stock: Number(formData.stock || 0),
      category: formData.category,
      active: formData.active,
      image: formData.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    }

    setFormError('')
    try {
      await onSaveMenuItem(payload)
    } catch (error) {
      setFormError(error.message || 'Unable to save menu item.')
      return
    }

    setEditingItemId(null)
    setFormData({
      name: '',
      tamilName: '',
      price: 0,
      stock: 0,
      category: 'breakfast',
      active: true,
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    })
  }

  const editMenuItem = (item) => {
    setEditingItemId(item.id)
    setFormData({
      name: item.name,
      tamilName: item.tamilName,
      price: item.price,
      stock: item.stock,
      category: item.category,
      active: item.active,
      image: item.image,
    })
  }

  const removeMenuItem = async (itemId) => {
    setFormError('')
    try {
      await onDeleteMenuItem(itemId)
    } catch (error) {
      setFormError(error.message || 'Unable to remove menu item.')
      return
    }
    if (editingItemId === itemId) {
      setEditingItemId(null)
      setFormData({
        name: '',
        tamilName: '',
        price: 0,
        stock: 0,
        category: 'breakfast',
        active: true,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      })
    }
  }

  const addTable = async () => {
    const nextNumber = tableNumber || (tables.at(-1)?.number || 0) + 1
    try {
      await onAddTable(nextNumber)
      setTableNumber(nextNumber + 1)
    } catch (error) {
      setFormError(error.message || 'Unable to add table.')
    }
  }

  const removeTable = async (tableId) => {
    try {
      await onDeleteTable(tableId)
    } catch (error) {
      setFormError(error.message || 'Unable to remove table.')
    }
  }

  return (
    <div className="admin-page">
      <header className="board-header">
        <div>
          <p className="eyebrow">{getTranslation('admin', language)}</p>
          <h2>{getTranslation('dashboard', language)}</h2>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card accent"><BarChart3 size={18} /><span>{getTranslation('todaysOrders', language)}</span><strong>{todayOrders.length}</strong></div>
        <div className="stat-card"><UtensilsCrossed size={18} /><span>{getTranslation('salesTotal', language)}</span><strong>{formatCurrency(todaySales, restaurantSettings.currency)}</strong></div>
        <div className="stat-card"><Users size={18} /><span>{getTranslation('activeTables', language)}</span><strong>{occupiedTableCount}/{tables.length}</strong></div>
        <div className="stat-card"><QrCode size={18} /><span>{getTranslation('pendingOrders', language)}</span><strong>{pendingOrderCount}</strong></div>
      </div>

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">{getTranslation('menuManagement', language)}</p>
              <h3>{getTranslation('menu', language)}</h3>
            </div>
          </div>

          <div className="category-row admin-categories">
            <button type="button" className={selectedCategory === 'all' ? 'category-pill active' : 'category-pill'} onClick={() => setSelectedCategory('all')}>All</button>
            {menuCategories.map((category) => (
              <button key={category.id} type="button" className={selectedCategory === category.id ? 'category-pill active' : 'category-pill'} onClick={() => setSelectedCategory(category.id)}>
                {language === 'ta' ? category.ta : category.en}
              </button>
            ))}
          </div>

          <div className="table-list admin-table-list">
            {filteredMenu.map((item) => (
              <div key={item.id} className="admin-row">
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.tamilName}</small>
                </div>
                <span>{item.stock} in stock</span>
                <span>{item.active ? 'Available' : 'Unavailable'}</span>
                <div className="inline-actions">
                  <button type="button" className="secondary-button small" onClick={() => editMenuItem(item)}>Edit</button>
                  <button type="button" className="danger-button small" onClick={() => removeMenuItem(item.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">{getTranslation('settings', language)}</p>
              <h3>{editingItemId ? 'Update item' : getTranslation('menuManagement', language)}</h3>
            </div>
          </div>

          <div className="admin-form">
            <input value={formData.name} placeholder="English item name" onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
            <input value={formData.tamilName} placeholder="Tamil item name" onChange={(event) => setFormData((current) => ({ ...current, tamilName: event.target.value }))} />
                    <input value={formData.image} placeholder="Image URL" onChange={(event) => setFormData((current) => ({ ...current, image: event.target.value }))} />
                    <label className="image-upload-field">
                      <span>{getTranslation('uploadFoodImage', language)}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={isUploadingImage}
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          setFormError('')
                          setIsUploadingImage(true)
                          try {
                            const image = await onUploadMenuImage(file)
                            setFormData((current) => ({ ...current, image }))
                          } catch (error) {
                            setFormError(error.message || 'Unable to upload image.')
                          } finally {
                            setIsUploadingImage(false)
                            event.target.value = ''
                          }
                        }}
                      />
                    </label>
                    {formData.image ? <img className="admin-image-preview" src={formData.image} alt="Selected food preview" /> : null}
            <div className="split-row">
              <input type="number" value={formData.price} onChange={(event) => setFormData((current) => ({ ...current, price: Number(event.target.value) }))} />
              <input type="number" value={formData.stock} onChange={(event) => setFormData((current) => ({ ...current, stock: Number(event.target.value) }))} />
            </div>
            <select value={formData.category} onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}>
              {menuCategories.map((category) => (
                <option key={category.id} value={category.id}>{language === 'ta' ? category.ta : category.en}</option>
              ))}
            </select>
            <label className="check-row">
              <input type="checkbox" checked={formData.active} onChange={() => setFormData((current) => ({ ...current, active: !current.active }))} />
              <span>{formData.active ? 'Available' : 'Unavailable'}</span>
            </label>
            {formError ? <div className="form-error">{formError}</div> : null}
            <button type="button" className="primary-button" onClick={addOrUpdateMenuItem} disabled={isUploadingImage}>{editingItemId ? 'Update item' : 'Save item'}</button>
          </div>
        </section>
      </div>

      <div className="admin-grid lower-grid">
        <section className="admin-panel">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">{getTranslation('qrManagement', language)}</p>
              <h3>Table QR Codes</h3>
            </div>
          </div>

          <div className="table-tools">
            <input type="number" value={tableNumber} min="1" onChange={(event) => setTableNumber(Number(event.target.value) || 1)} />
            <button type="button" className="primary-button small" onClick={addTable}><Plus size={14} /> Add table</button>
          </div>

          <div className="qr-grid">
            {tables.map((table) => (
              <div key={table.id} className="qr-card">
                <QRCodeSVG value={table.qrCode || generateQrCode(table.number)} size={92} />
                <strong>Table {table.number}</strong>
                <button type="button" className="danger-button small" onClick={() => removeTable(table.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">{getTranslation('reports', language)}</p>
              <h3>Revenue</h3>
            </div>
          </div>

          <div className="earnings-grid">
            <article className="earning-metric">
              <span>{getTranslation('todayEarnings', language)}</span>
              <strong>{formatCurrency(todaySales, restaurantSettings.currency)}</strong>
            </article>
            <article className="earning-metric">
              <span>{getTranslation('monthEarnings', language)}</span>
              <strong>{formatCurrency(monthSales, restaurantSettings.currency)}</strong>
            </article>
          </div>
        </section>
      </div>

      <section className="admin-panel full-width">
        <div className="panel-header compact">
          <div>
            <p className="eyebrow">{getTranslation('staff', language)}</p>
            <h3>Roles</h3>
          </div>
        </div>

        <div className="staff-list">
          {staffRoles.map((role) => (
            <div key={role.id} className="staff-role">
              <span>{role.label}</span>
              <button type="button" className="secondary-button">Manage</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
