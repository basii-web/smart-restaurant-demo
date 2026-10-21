import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { CreditCard, LayoutDashboard, LogOut, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import CustomerPage from './pages/CustomerPage'
import KitchenPage from './pages/KitchenPage'
import BillingPage from './pages/BillingPage'
import AdminPage from './pages/AdminPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import { restaurantSettings as defaultSettings } from './data/demoData'
import { demoMode, signOutStaff, supabase } from './services/supabase'
import {
  createOrder,
  addRestaurantTable,
  deleteMenuItem,
  deleteRestaurantTable,
  fetchRestaurantTables,
  fetchMenuItems,
  fetchOrders,
  fetchRestaurantSettings,
  saveMenuItem,
  uploadMenuImage,
  subscribeToMenuItems,
  subscribeToOrders,
  updateOrderPayment,
  updateOrderStatus,
} from './services/restaurantService'
import { getTranslation } from './translations'
import './App.css'

const languageKey = 'smart-restaurant-language'

function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || 'en')
  const [menuItems, setMenuItems] = useState([])
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [cart, setCart] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [authReady, setAuthReady] = useState(demoMode)
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('smart-restaurant-demo-session')
    if (demoMode && savedSession) {
      try {
        return JSON.parse(savedSession)
      } catch {
        return { demo: true }
      }
    }
    return demoMode ? { demo: true } : null
  })
  const [userRole, setUserRole] = useState(() => {
    const savedRole = localStorage.getItem('smart-restaurant-demo-role')
    return demoMode ? (savedRole || 'admin') : null
  })
  const isAuthenticated = Boolean(session)

  useEffect(() => {
    localStorage.setItem(languageKey, language)
  }, [language])

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    const bootstrapSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        if (data.session?.user) {
          const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', data.session.user.id).maybeSingle()
          setUserRole(profile?.is_active ? profile.role : null)
        }
      } finally {
        setAuthReady(true)
      }
    }

    bootstrapSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        supabase.from('profiles').select('role, is_active').eq('id', nextSession.user.id).maybeSingle().then(({ data }) => {
          setUserRole(data?.is_active ? data.role : null)
        })
      } else {
        setUserRole(null)
      }
      setAuthReady(true)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authReady) return undefined

    let active = true

    const loadData = async () => {
      const [menu, orderData, tableData, restaurantConfig] = await Promise.all([
        fetchMenuItems(),
        fetchOrders(),
        fetchRestaurantTables(),
        fetchRestaurantSettings(),
      ])

      if (!active) return
      setMenuItems(menu)
      setOrders(orderData)
      setTables(tableData)
      setSettings(restaurantConfig)
    }

    loadData()

    const unsubscribeMenu = subscribeToMenuItems((nextMenu) => {
      if (active) setMenuItems(nextMenu)
    })
    const unsubscribeOrders = subscribeToOrders((nextOrders) => {
      if (active) setOrders(nextOrders)
    })

    return () => {
      active = false
      unsubscribeMenu()
      unsubscribeOrders()
    }
  }, [authReady, isAuthenticated])

  const addToCart = (item) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id)
      if (existing) {
        if (existing.quantity >= item.stock) return current
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        )
      }

      if (item.stock <= 0) return current
      return [
        ...current,
        {
          ...item,
          quantity: 1,
          tamilName: item.tamilName,
        },
      ]
    })
  }

  const updateCartQuantity = (itemId, delta) => {
    setCart((current) =>
      current
        .map((entry) =>
          entry.id === itemId ? { ...entry, quantity: Math.max(0, entry.quantity + delta) } : entry,
        )
        .filter((entry) => entry.quantity > 0),
    )
  }

  const removeFromCart = (itemId) => {
    setCart((current) => current.filter((entry) => entry.id !== itemId))
  }

  const placeOrder = async (payload) => {
    const orderPayload = await createOrder(payload)

    setOrders((current) => [orderPayload, ...current])
    setCart([])
    return orderPayload
  }

  const updateOrderStatusFlow = async (orderId, nextStatus) => {
    await updateOrderStatus(orderId, nextStatus)
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
    )
  }

  const updatePayment = async (orderId, paymentData) => {
    await updateOrderPayment(orderId, paymentData)
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, ...paymentData } : order,
      ),
    )
  }

  const saveMenuItemFlow = async (item) => {
    const savedItem = await saveMenuItem(item)
    setMenuItems((current) => item.id
      ? current.map((existing) => (existing.id === item.id ? savedItem : existing))
      : [savedItem, ...current])
    return savedItem
  }

  const deleteMenuItemFlow = async (itemId) => {
    await deleteMenuItem(itemId)
    setMenuItems((current) => current.filter((item) => item.id !== itemId))
  }

  const uploadMenuImageFlow = async (file) => uploadMenuImage(file)

  const addRestaurantTableFlow = async (number) => {
    const table = await addRestaurantTable(number)
    setTables((current) => [...current, table].sort((first, second) => first.number - second.number))
    return table
  }

  const deleteRestaurantTableFlow = async (tableId) => {
    await deleteRestaurantTable(tableId)
    setTables((current) => current.filter((table) => table.id !== tableId))
  }

  const handleLogin = async (credentials) => {
    if (demoMode || !supabase) {
      const nextRole = credentials.role || 'admin'
      const nextSession = { demo: true }
      setSession(nextSession)
      setUserRole(nextRole)
      localStorage.setItem('smart-restaurant-demo-session', JSON.stringify(nextSession))
      localStorage.setItem('smart-restaurant-demo-role', nextRole)
      return { role: nextRole }
    }

    const data = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (data.error) {
      throw data.error
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', data.data.user.id)
      .maybeSingle()

    if (profileError || !profile?.is_active) {
      await supabase.auth.signOut()
      throw new Error('This account does not have an active staff profile.')
    }

    setSession(data.data.session)
    setUserRole(profile.role)
    return { role: profile.role }
  }

  const handleLogout = async () => {
    if (demoMode || !supabase) {
      setSession(null)
      setUserRole(null)
      localStorage.removeItem('smart-restaurant-demo-session')
      localStorage.removeItem('smart-restaurant-demo-role')
      return
    }

    await signOutStaff()
    setSession(null)
    setUserRole(null)
  }

  const closeSession = (orderId) => {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: 'served' } : order)),
    )
  }

  const navItems = [
    { to: '/', label: 'Customer', icon: ShoppingBag },
    { to: '/kitchen', label: 'Kitchen', icon: UtensilsCrossed },
    { to: '/billing', label: 'Billing', icon: CreditCard },
    { to: '/admin', label: 'Admin', icon: LayoutDashboard },
  ]

  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="main-nav">
          <div className="nav-brand">
            <div className="brand-badge">R</div>
            <div>
              <p className="eyebrow">{getTranslation('appTitle', language)}</p>
              <strong>{settings.name}</strong>
            </div>
          </div>

          <div className="nav-items">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <Icon size={16} />
                {getTranslation(label.toLowerCase(), language) || label}
              </NavLink>
            ))}
          </div>

          <div className="nav-meta">
            <span className="status-dot" />
            {demoMode ? 'Demo mode' : 'Live data'}
          </div>

          {session ? (
            <button type="button" className="secondary-button" onClick={handleLogout}>
              <LogOut size={14} />
              Logout
            </button>
          ) : (
            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>
          )}
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <CustomerPage
                language={language}
                restaurantSettings={settings}
                setLanguage={setLanguage}
                cart={cart}
                onAddToCart={addToCart}
                onUpdateCartQuantity={updateCartQuantity}
                onRemoveFromCart={removeFromCart}
                onPlaceOrder={placeOrder}
                menuItems={menuItems}
                tableNumber={5}
              />
            }
          />
          <Route
            path="/login"
            element={<LoginPage onLogin={handleLogin} language={language} />}
          />
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute isAuthenticated={Boolean(session)} role={userRole} allowedRoles={['kitchen']}>
                <KitchenPage
                  orders={orders}
                  language={language}
                  onStatusChange={updateOrderStatusFlow}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute isAuthenticated={Boolean(session)} role={userRole} allowedRoles={['cashier', 'admin']}>
                <BillingPage
                  orders={orders}
                  language={language}
                  restaurantSettings={settings}
                  onUpdateOrderPayment={updatePayment}
                  onCloseSession={closeSession}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute isAuthenticated={Boolean(session)} role={userRole} allowedRoles={['admin']}>
                <AdminPage
                  language={language}
                  restaurantSettings={settings}
                  menuItems={menuItems}
                  orders={orders}
                  tables={tables}
                  onSaveMenuItem={saveMenuItemFlow}
                  onDeleteMenuItem={deleteMenuItemFlow}
                  onUploadMenuImage={uploadMenuImageFlow}
                  onAddTable={addRestaurantTableFlow}
                  onDeleteTable={deleteRestaurantTableFlow}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={<OrderConfirmationPage language={language} orders={orders} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
