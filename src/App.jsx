import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'

const TABLE = 'orders'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function App() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchOrders = useCallback(async () => {
    setError(null)
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('order_date', { ascending: false })
    if (error) {
      setError('Could not load orders. Check your connection and try again.')
      console.error(error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const doneCount = orders.filter((o) => o.status === 'done').length

  let visible = orders.filter((o) => filter === 'all' || o.status === filter)
  if (search.trim()) {
    const t = search.toLowerCase()
    visible = visible.filter(
      (o) =>
        (o.party || '').toLowerCase().includes(t) ||
        (o.item || '').toLowerCase().includes(t) ||
        (o.order_no || '').toLowerCase().includes(t)
    )
  }
  visible = [...visible].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
    return new Date(b.order_date || 0) - new Date(a.order_date || 0)
  })

  async function markDone(id) {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'done', done_date: new Date().toISOString() })
      .eq('id', id)
    if (error) alert('Could not update order. Please try again.')
    else fetchOrders()
  }

  async function markPending(id) {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'pending', done_date: null })
      .eq('id', id)
    if (error) alert('Could not update order. Please try again.')
    else fetchOrders()
  }

  async function deleteOrder(id) {
    if (!confirm('Delete this order? This cannot be undone.')) return
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) alert('Could not delete order. Please try again.')
    else fetchOrders()
  }

  function openAdd() {
    setEditingOrder(null)
    setModalOpen(true)
  }

  function openEdit(order) {
    setEditingOrder(order)
    setModalOpen(true)
  }

  async function saveOrder(formData) {
    setSaving(true)
    if (editingOrder) {
      const { error } = await supabase
        .from(TABLE)
        .update(formData)
        .eq('id', editingOrder.id)
      if (error) {
        alert('Could not save changes. Please try again.')
        console.error(error)
      }
    } else {
      const { error } = await supabase
        .from(TABLE)
        .insert([{ ...formData, status: 'pending', done_date: null }])
      if (error) {
        alert('Could not add order. Please try again.')
        console.error(error)
      }
    }
    setSaving(false)
    setModalOpen(false)
    fetchOrders()
  }

  return (
    <div className="app-shell">
      <header>
        <div className="header-row">
          <div>
            <h1>
              Order <span className="accent">Register</span>
            </h1>
            <div className="subtitle">Textile Trading &mdash; Order Book</div>
          </div>
        </div>
        <div className="stats-bar">
          <div className="stat-pill">
            <span className="dot pending" /> {pendingCount} Pending
          </div>
          <div className="stat-pill">
            <span className="dot done" /> {doneCount} Done
          </div>
        </div>
      </header>

      <main>
        <div className="filter-tabs">
          {['all', 'pending', 'done'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="search-row">
          <input
            type="text"
            placeholder="Search by party name, item, or order no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <div className="loading-row">Loading orders...</div>}
        {error && <div className="loading-row" style={{ color: '#A8402E' }}>{error}</div>}

        {!loading && !error && visible.length === 0 && (
          <div className="empty-state">
            <div className="stitch">&#10022;</div>
            {orders.length === 0
              ? 'No orders yet. Tap + to add the first one.'
              : 'No orders match this view.'}
          </div>
        )}

        {!loading &&
          !error &&
          visible.map((o) => (
            <div key={o.id} className={`order-card ${o.status === 'done' ? 'done' : ''}`}>
              <div className="order-top">
                <div>
                  <p className="party-name">{o.party}</p>
                  <p className="order-meta">
                    {o.order_no ? `#${o.order_no} \u00b7 ` : ''}
                    {formatDate(o.order_date)}
                  </p>
                </div>
                <span className={`status-badge ${o.status}`}>
                  {o.status === 'done' ? 'Done' : 'Pending'}
                </span>
              </div>
              <div className="order-details">
                <span className="label">Item</span>
                <br />
                {o.item || '\u2014'}
                {o.quantity && (
                  <>
                    <br />
                    <span className="label">Quantity</span>
                    <br />
                    {o.quantity}
                  </>
                )}
                {o.notes && (
                  <>
                    <br />
                    <span className="label">Notes</span>
                    <br />
                    {o.notes}
                  </>
                )}
              </div>
              <div className="order-actions">
                {o.status === 'pending' ? (
                  <button className="btn-small primary" onClick={() => markDone(o.id)}>
                    Mark Done
                  </button>
                ) : (
                  <button className="btn-small undo" onClick={() => markPending(o.id)}>
                    Reopen
                  </button>
                )}
                <button className="btn-small" onClick={() => openEdit(o)}>
                  Edit
                </button>
                <button className="btn-small delete" onClick={() => deleteOrder(o.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
      </main>

      <button className="add-btn-fixed" onClick={openAdd} title="Add new order">
        +
      </button>

      <div className="sync-note">Shared with everyone using this register — updates sync live</div>

      {modalOpen && (
        <OrderModal
          order={editingOrder}
          onCancel={() => setModalOpen(false)}
          onSave={saveOrder}
          saving={saving}
        />
      )}
    </div>
  )
}

function OrderModal({ order, onCancel, onSave, saving }) {
  const [party, setParty] = useState(order?.party || '')
  const [orderNo, setOrderNo] = useState(order?.order_no || '')
  const [orderDate, setOrderDate] = useState(order?.order_date || todayISO())
  const [item, setItem] = useState(order?.item || '')
  const [quantity, setQuantity] = useState(order?.quantity || '')
  const [notes, setNotes] = useState(order?.notes || '')

  function handleSave() {
    if (!party.trim() || !item.trim()) {
      alert('Please fill in Party Name and Item.')
      return
    }
    onSave({
      party: party.trim(),
      order_no: orderNo.trim(),
      order_date: orderDate,
      item: item.trim(),
      quantity: quantity.trim(),
      notes: notes.trim(),
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h2>{order ? 'Edit Order' : 'New Order'}</h2>
        <div className="field">
          <label>Party Name *</label>
          <input
            type="text"
            autoFocus
            value={party}
            onChange={(e) => setParty(e.target.value)}
            placeholder="e.g. Shreeji Textiles"
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Order No.</label>
            <input
              type="text"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div className="field">
            <label>Order Date</label>
            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Item / Fabric *</label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. Cotton Print, 60x60"
          />
        </div>
        <div className="field">
          <label>Quantity</label>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 500 meters"
          />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="delivery instructions, rate, etc."
          />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : order ? 'Save Changes' : 'Add Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
