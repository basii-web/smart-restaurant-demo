import { useMemo, useState } from 'react'
import { Search, ReceiptText, Wallet } from 'lucide-react'
import { formatCurrency } from '../services/supabase'
import { getTranslation } from '../translations'

export default function BillingPage({ orders, language, restaurantSettings, onUpdateOrderPayment, onCloseSession }) {
  const [query, setQuery] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const text = `${order.id} ${order.tableNumber}`.toLowerCase()
      return text.includes(query.toLowerCase())
    })
  }, [orders, query])

  const selectedOrder = filteredOrders.find((order) => order.id === selectedOrderId) || filteredOrders[0] || null

  const subtotal = selectedOrder?.items?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0
  const tax = subtotal * (restaurantSettings.taxRate / 100)
  const total = subtotal + tax

  const handlePayment = () => {
    onUpdateOrderPayment(selectedOrder?.id, {
      paymentMethod,
      paymentStatus: 'paid',
      amountPaid: total,
    })
  }

  return (
    <div className="billing-page">
      <header className="board-header">
        <div>
          <p className="eyebrow">{getTranslation('billing', language)}</p>
          <h2>{getTranslation('receipt', language)}</h2>
        </div>
      </header>

      <div className="billing-layout">
        <aside className="billing-sidebar">
          <div className="search-box wide">
            <Search size={16} />
            <input
              type="text"
              placeholder={getTranslation('searchBy', language)}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="order-list compact-list">
            {filteredOrders.length ? (
              filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={selectedOrder?.id === order.id ? 'order-item active' : 'order-item'}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <strong>{order.id}</strong>
                  <span>Table {order.tableNumber}</span>
                  <em>{order.status}</em>
                </button>
              ))
            ) : (
              <div className="empty-state">{getTranslation('noData', language)}</div>
            )}
          </div>
        </aside>

        <section className="receipt-panel">
          {selectedOrder ? (
            <>
              <div className="receipt-header">
                <div>
                  <p className="eyebrow">{restaurantSettings.name}</p>
                  <h3>{getTranslation('receipt', language)}</h3>
                </div>
                <button type="button" className="secondary-button" onClick={() => window.print()}>
                  <ReceiptText size={15} />
                  Print
                </button>
              </div>

              <div className="receipt-info">
                <span>{getTranslation('orderNumber', language)}: {selectedOrder.id}</span>
                <span>{getTranslation('tableNumber', language)}: {selectedOrder.tableNumber}</span>
              </div>

              <div className="receipt-items">
                {selectedOrder.items.map((item) => (
                  <div key={`${selectedOrder.id}-${item.id}`} className="receipt-line">
                    <span>{item.quantity}x {item.name}</span>
                    <strong>{formatCurrency(item.quantity * item.unitPrice, restaurantSettings.currency)}</strong>
                  </div>
                ))}
              </div>

              <div className="totals-box receipt-totals">
                <div><span>Subtotal</span><strong>{formatCurrency(subtotal, restaurantSettings.currency)}</strong></div>
                <div><span>Tax</span><strong>{formatCurrency(tax, restaurantSettings.currency)}</strong></div>
                <div><span>{getTranslation('totalAmount', language)}</span><strong>{formatCurrency(total, restaurantSettings.currency)}</strong></div>
              </div>

              <div className="payment-box">
                <label>
                  <span>{getTranslation('paymentMethod', language)}</span>
                  <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    <option value="cash">{getTranslation('cash', language)}</option>
                    <option value="upi">{getTranslation('upi', language)}</option>
                    <option value="card">{getTranslation('card', language)}</option>
                  </select>
                </label>

                <button type="button" className="primary-button" onClick={handlePayment}>
                  <Wallet size={16} />
                  Paid
                </button>
              </div>

              <button type="button" className="danger-button" onClick={() => onCloseSession(selectedOrder.id)}>
                {getTranslation('closeSession', language)}
              </button>
            </>
          ) : (
            <div className="empty-state">{getTranslation('noData', language)}</div>
          )}
        </section>
      </div>
    </div>
  )
}
