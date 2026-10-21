import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { demoMode } from '../services/supabase'

export default function LoginPage({ onLogin, language }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@restaurant.local', password: '', role: 'admin' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await onLogin(form)
      const nextRole = result?.role || form.role

      if (nextRole === 'kitchen') {
        navigate('/kitchen')
        return
      }

      if (nextRole === 'cashier') {
        navigate('/billing')
        return
      }

      navigate('/admin')
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="confirmation-page">
      <form className="confirmation-card login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Staff access</p>
        <h2>{language === 'ta' ? 'உள்நுழை' : 'Login'}</h2>

        {demoMode ? (
          <p className="demo-note">Demo mode is active. Use any email/password to preview the dashboard.</p>
        ) : null}

        <label className="field-block">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>

        <label className="field-block">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            autoComplete="current-password"
          />
        </label>

        <label className="field-block">
          <span>Role</span>
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
            <option value="admin">Admin</option>
            <option value="kitchen">Kitchen</option>
            <option value="cashier">Cashier</option>
          </select>
        </label>

        {error ? <div className="form-error">{error}</div> : null}

        <button type="submit" className="primary-button wide" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
