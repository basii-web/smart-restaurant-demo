import { useMemo, useRef, useState } from 'react'
import { Search, ShoppingCart, Plus, Minus, ReceiptText } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'
import { menuCategories, restaurantSettings as defaultRestaurantSettings } from '../data/demoData'
import { formatCurrency, generateOrderNumber } from '../services/supabase'
import { getTranslation } from '../translations'

export default function CustomerPage({
  language,
  restaurantSettings = defaultRestaurantSettings,
  setLanguage,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onPlaceOrder,
  menuItems,
  tableNumber = 5,
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const checkoutRef = useRef(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [orderNote, setOrderNote] = useState('')
  const requestedTableNumber = Number(searchParams.get('table'))
  const activeTableNumber = Number.isInteger(requestedTableNumber) && requestedTableNumber > 0
    ? requestedTableNumber
    : tableNumber

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.active) return false
      const matchesSearch = `${item.name} ${item.tamilName}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [activeCategory, menuItems, search])

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const tax = subtotal * (restaurantSettings.taxRate / 100)
  const total = subtotal + tax

  const handlePlaceOrder = async () => {
    if (!cart.length) return

    const req = {
      id: generateOrderNumber(),
      tableNumber: activeTableNumber,
      items: cart.map((entry) => ({
        id: entry.id,
        name: entry.name,
        quantity: entry.quantity,
        unitPrice: entry.price,
      })),
      instructions: orderNote,
      total,
      status: 'placed',
    }

    const placedOrder = await onPlaceOrder(req)
    navigate(`/order-confirmation/${placedOrder.id}`)
  }

  return (
    <div className="customer-layout">
      <header className="topbar premium-bar">
        <div className="table-badge customer-table-corner">
          <span>{getTranslation('tableLabel', language)}</span>
          <strong>#{activeTableNumber}</strong>
        </div>

        <div className="topbar-actions">
          <button type="button" className="cart-button" onClick={() => checkoutRef.current?.focus({ preventScroll: true })}>
            <ShoppingCart size={18} />
            <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </button>
          <LanguageToggle
            language={language}
            onToggle={() => setLanguage((current) => (current === 'en' ? 'ta' : 'en'))}
          />
        </div>
      </header>

      <main className="customer-shell">
        <aside className="category-sidebar">
          <button
            type="button"
            className={activeCategory === 'all' ? 'category-pill active' : 'category-pill'}
            onClick={() => setActiveCategory('all')}
            style={{ '--accent': '#2457e6' }}
          >
            All
          </button>
          {menuCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={activeCategory === category.id ? 'category-pill active' : 'category-pill'}
              onClick={() => setActiveCategory(category.id)}
              style={{ '--accent': category.color }}
            >
              {`${category.en} (${category.ta})`}
            </button>
          ))}
        </aside>

        <div className="customer-content">
        <section className="menu-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{getTranslation('customer', language)}</p>
              <h2>{getTranslation('menu', language)}</h2>
            </div>
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder={getTranslation('searchFood', language)}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="menu-grid">
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const isSoldOut = item.stock <= 0
                const displayName = `${item.name} (${item.tamilName})`
                return (
                  <article key={item.id} className="menu-card">
                    <div className="food-image-wrap">
                      <img src={item.image} alt={displayName} onError={(event) => {
                        event.currentTarget.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'
                      }} />
                      <span className={isSoldOut ? 'availability sold' : 'availability'}>
                        {isSoldOut ? getTranslation('soldOut', language) : getTranslation('available', language)}
                      </span>
                    </div>

                    <div className="menu-card-body">
                      <div className="card-head">
                        <div className="name-stack">
                          <h3>{displayName}</h3>
                        </div>
                        <span className="price">{formatCurrency(item.price, restaurantSettings.currency)}</span>
                      </div>

                      <div className="menu-meta compact">
                        <span>{item.stock} {getTranslation('available', language).toLowerCase()}</span>
                        <button
                          type="button"
                          className="add-button"
                          disabled={isSoldOut}
                          onClick={() => onAddToCart(item)}
                        >
                          {getTranslation('addToCart', language)}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="empty-state wide">{getTranslation('noItems', language)}</div>
            )}
          </div>

        </section>

        <section className="checkout-summary-card" ref={checkoutRef} tabIndex={-1}>
            <div className="summary-header">
              <div>
                <p className="eyebrow">{getTranslation('cart', language)}</p>
                <h3>{getTranslation('checkoutTitle', language)}</h3>
              </div>
              <span className="summary-count">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
            </div>

            {cart.length === 0 ? (
              <div className="empty-state">{getTranslation('emptyCart', language)}</div>
            ) : (
              <div className="checkout-body">
                <div className="summary-list">
                  {cart.map((entry) => (
                    <article key={entry.id} className="summary-line">
                      <div className="summary-product-visual">
                        <img
                          src={entry.image}
                          alt={`${entry.name}${entry.tamilName ? ` (${entry.tamilName})` : ''}`}
                          onError={(event) => {
                            event.currentTarget.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=240&q=80'
                          }}
                        />
                        <div className="quantity-controller">
                          <button type="button" aria-label={`Reduce ${entry.name} quantity`} onClick={() => onUpdateCartQuantity(entry.id, -1)}><Minus size={13} /></button>
                          <span>{entry.quantity}</span>
                          <button type="button" aria-label={`Add ${entry.name} quantity`} onClick={() => onUpdateCartQuantity(entry.id, 1)}><Plus size={13} /></button>
                        </div>
                      </div>
                      <div className="summary-item-meta">
                        <strong>{entry.name}{entry.tamilName ? ` (${entry.tamilName})` : ''}</strong>
                        <span>{formatCurrency(entry.price, restaurantSettings.currency)} each</span>
                      </div>
                      <strong className="summary-line-total">{formatCurrency(entry.quantity * entry.price, restaurantSettings.currency)}</strong>
                    </article>
                  ))}
                </div>

                <div className="checkout-side">
                  <div className="summary-totals">
                    <div><span>Subtotal</span><strong>{formatCurrency(subtotal, restaurantSettings.currency)}</strong></div>
                    <div><span>Tax</span><strong>{formatCurrency(tax, restaurantSettings.currency)}</strong></div>
                    <div className="grand-total"><span>{getTranslation('totalAmount', language)}</span><strong>{formatCurrency(total, restaurantSettings.currency)}</strong></div>
                  </div>

                  <div className="checkout-actions">
                    <details className="checkout-notes">
                      <summary>{getTranslation('prepareInstructions', language)}</summary>
                      <textarea
                        value={orderNote}
                        onChange={(event) => setOrderNote(event.target.value)}
                        placeholder="Extra roast, less spice, no onion..."
                      />
                    </details>

                    <button type="button" className="primary-button" onClick={handlePlaceOrder}>
                      <ReceiptText size={18} />
                      {getTranslation('placeOrder', language)}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </section>
        </div>
      </main>
    </div>
  )
}
