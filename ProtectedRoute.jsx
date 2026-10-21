import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, allowedRoles = [], role, isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />
  }

  return children
}
