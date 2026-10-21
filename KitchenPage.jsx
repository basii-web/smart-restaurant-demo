import { useEffect, useMemo, useState } from 'react'
import { ChefHat, Bell, BellOff } from 'lucide-react'
import { getTranslation } from '../translations'

export default function KitchenPage({ orders, onStatusChange, language }) {
  const [mute, setMute] = useState(false)

  useEffect(() => {
    if (!mute && orders.some((order) => order.status === 'placed')) {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=')
      audio.play().catch(() => {})
    }
  }, [orders, mute])

  const groupedOrders = useMemo(() => ({
    placed: orders.filter((order) => order.status === 'placed' || order.status === 'cooking').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    ready: orders.filter((order) => order.status === 'ready' || order.status === 'served').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  }), [orders])

  return (
    <div className="board-page">
      <header className="board-header">
        <div>
          <p className="eyebrow">{getTranslation('kitchen', language)}</p>
          <h2>{getTranslation('kitchenOrders', language)}</h2>
        </div>
        <button type="button" className="mute-button" onClick={() => setMute((prev) => !prev)}>
          {mute ? <BellOff size={18} /> : <Bell size={18} />}
          {mute ? 'Mute' : 'Sound'}
        </button>
      </header>

      <div className="kitchen-grid two-col">
        <div className="kitchen-column">
          <div className="section-header new-order">
            <ChefHat size={18} />
            <strong>{getTranslation('newOrders', language)}</strong>
            <span>{groupedOrders.placed.length}</span>
          </div>

          <div className="ticket-stack">
            {groupedOrders.placed.length ? (
              groupedOrders.placed.map((order) => (
                <article key={order.id} className="ticket-card">
                  <div className="ticket-topline">
                    <strong>#{order.id}</strong>
                    <span className="table-pill">T{order.tableNumber}</span>
                  </div>
                  <div className="ticket-meta">
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <ul>
                    {order.items?.map((item) => (
                      <li key={`${order.id}-${item.id}`}>
                        {item.quantity} x {item.name}
                      </li>
                    ))}
                  </ul>
                  {order.instructions ? <p className="ticket-note">Note: {order.instructions}</p> : null}
                  <button type="button" className="primary-button" onClick={() => onStatusChange(order.id, 'ready')}>
                    {getTranslation('markReady', language)}
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state compact">{getTranslation('noData', language)}</div>
            )}
          </div>
        </div>

        <div className="kitchen-column">
          <div className="section-header ready-order">
            <ChefHat size={18} />
            <strong>{getTranslation('foodReady', language)}</strong>
            <span>{groupedOrders.ready.length}</span>
          </div>

          <div className="ticket-stack">
            {groupedOrders.ready.length ? (
              groupedOrders.ready.map((order) => (
                <article key={order.id} className="ticket-card">
                  <div className="ticket-topline">
                    <strong>#{order.id}</strong>
                    <span className="table-pill">T{order.tableNumber}</span>
                  </div>
                  <div className="ticket-meta">
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <ul>
                    {order.items?.map((item) => (
                      <li key={`${order.id}-${item.id}`}>
                        {item.quantity} x {item.name}
                      </li>
                    ))}
                  </ul>
                  {order.instructions ? <p className="ticket-note">Note: {order.instructions}</p> : null}
                  <button type="button" className="secondary-button" onClick={() => onStatusChange(order.id, 'served')}>
                    {getTranslation('served', language)}
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state compact">{getTranslation('noData', language)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
