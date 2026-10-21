import { CheckCircle2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTranslation } from '../translations'

export default function OrderConfirmationPage({ language, orders }) {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const order = orders.find((item) => item.id === orderId)

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <CheckCircle2 size={52} />
        <p className="eyebrow">{getTranslation('orderConfirmation', language)}</p>
        <h2>{getTranslation('orderPlaced', language)}</h2>
        <div className="confirmation-number">#{order?.id || orderId}</div>
        <p>
          {order?.status || 'placed'} • Table {order?.tableNumber || '-'}
        </p>
        <button type="button" className="primary-button" onClick={() => navigate('/')}>
          Back to menu
        </button>
      </div>
    </div>
  )
}
