import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api/contacts";

function App() {
  const [contacts, setContacts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState({
    q: "",
    category: "",
    favorite: false,
    sort: "recent"
  });
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    category: "Friends",
    favorite: false
  });

  const fileInputRef = useRef(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit,
        sort: filter.sort
      };
      if (filter.q) params.q = filter.q;
      if (filter.category) params.category = filter.category;
      if (filter.favorite) params.favorite = true;

      const res = await axios.get(API_URL, { params });
      setContacts(res.data.data || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setError("Unable to load contacts. Check API and backend.");
    } finally {
      setLoading(false);
    }
  }, [filter, page, limit]);

  useEffect(() => {
    fetchContacts();
  }, [filter, page, fetchContacts]);

  const validateForm = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError("Name, phone, and email are required.");
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      setError("Please provide a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    try {
      await axios.post(API_URL, form);
      setForm({ name: "", phone: "", email: "", category: "Friends", favorite: false });
      setPage(1);
      fetchContacts();
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.message || err.message;
      setError(`Unable to create contact. ${backendError}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id) => {
    setLoading(true);
    setError("");
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchContacts();
    } catch (err) {
      console.error(err);
      setError("Unable to delete contact.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    setLoading(true);
    setError("");
    try {
      await axios.patch(`${API_URL}/${id}/favorite`);
      fetchContacts();
    } catch (err) {
      console.error(err);
      setError("Unable to update favorite.");
    } finally {
      setLoading(false);
    }
  };

  const markContacted = async (id) => {
    setLoading(true);
    setError("");
    try {
      await axios.patch(`${API_URL}/${id}/contacted`);
      fetchContacts();
    } catch (err) {
      console.error(err);
      setError("Unable to mark contacted.");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = ["name,phone,email,category,favorite,lastContacted", ...contacts.map((c) => `${c.name},${c.phone},${c.email},${c.category},${c.favorite},${c.lastContacted || ''}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts-${Date.now()}.csv`);
    link.click();
  };

  const importCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split("\n").slice(1).filter(Boolean);
    const importPromises = rows.map((line) => {
      const [name, phone, email, category] = line.split(",");
      if (!name || !phone || !email) return Promise.resolve();
      return axios.post(API_URL, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        category: category?.trim() || "Friends"
      });
    });

    setLoading(true);
    try {
      await Promise.all(importPromises);
      setPage(1);
      fetchContacts();
    } catch (err) {
      console.error(err);
      setError("CSV import failed.");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const stats = {
    total: totalCount,
    favorites: contacts.filter((c) => c.favorite).length,
    family: contacts.filter((c) => c.category === "Family").length,
    friends: contacts.filter((c) => c.category === "Friends").length,
    work: contacts.filter((c) => c.category === "Work").length,
    recently: contacts.filter((c) => c.lastContacted).length
  };

  return (
    <div className={darkMode ? "App dark" : "App"}>
      <header className="top-bar">
        <h1>Contact Manager</h1>
        <button className="mode-toggle" onClick={() => setDarkMode((p) => !p)}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      <section className="dashboard">
        <div className="card">Total: <strong>{stats.total}</strong></div>
        <div className="card">Favorites: <strong>{stats.favorites}</strong></div>
        <div className="card">Family: <strong>{stats.family}</strong></div>
        <div className="card">Friends: <strong>{stats.friends}</strong></div>
        <div className="card">Work: <strong>{stats.work}</strong></div>
        <div className="card">Contacted: <strong>{stats.recently}</strong></div>
      </section>

      <section className="controls">
        <input type="text" placeholder="Search..." value={filter.q} onChange={(e) => setFilter((p) => ({ ...p, q: e.target.value, page: 1 }))} />
        <select value={filter.category} onChange={(e) => setFilter((p) => ({ ...p, category: e.target.value, page: 1 }))}>
          <option value="">All Categories</option>
          <option value="Family">Family</option>
          <option value="Friends">Friends</option>
          <option value="Work">Work</option>
        </select>
        <label>
          <input type="checkbox" checked={filter.favorite} onChange={(e) => setFilter((p) => ({ ...p, favorite: e.target.checked, page: 1 }))} /> Favorites only
        </label>
        <select value={filter.sort} onChange={(e) => setFilter((p) => ({ ...p, sort: e.target.value }))}>
          <option value="recent">Recently Updated</option>
          <option value="name">A → Z</option>
          <option value="lastContacted">Last Contacted</option>
        </select>
      </section>

      <section className="form-panel">
        <h2>Add Contact</h2>
        <form onSubmit={handleSubmit} className="contact-form">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
            <option value="Family">Family</option>
            <option value="Friends">Friends</option>
            <option value="Work">Work</option>
          </select>
          <label className="favorite-switch">
            <input type="checkbox" checked={form.favorite} onChange={(e) => setForm((p) => ({ ...p, favorite: e.target.checked }))} /> Favorite
          </label>
          <button type="submit" disabled={loading} className="primary-btn">{loading ? "Saving..." : "Add Contact"}</button>
        </form>
        <div className="csv-actions">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={() => fileInputRef.current?.click()}>Import CSV</button>
          <input type="file" ref={fileInputRef} accept=".csv" style={{ display: "none" }} onChange={importCSV} />
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="contact-list">
        <h2>Contacts</h2>
        {loading && <div className="loader">Loading…</div>}
        {!loading && contacts.length === 0 && <div className="empty-state">No contacts found. Add your first contact now!</div>}

        <ul>
          {contacts.map((c) => (
            <li key={c._id} className="contact-item">
              <div>
                <div className="name-row">
                  <span className="name">{c.name}</span>
                  {c.favorite && <span className="badge">⭐</span>}
                </div>
                <div>{c.phone}</div>
                <div>{c.email}</div>
                <div className="meta">{c.category} • Created: {new Date(c.createdAt).toLocaleDateString()}</div>
                <div className="meta">Last Contacted: {c.lastContacted ? new Date(c.lastContacted).toLocaleString() : "N/A"}</div>
              </div>

              <div className="action-group">
                <button onClick={() => markContacted(c._id)}>Mark Contacted</button>
                <button onClick={() => toggleFavorite(c._id)}>{c.favorite ? "Unfavorite" : "Favorite"}</button>
                <button onClick={() => deleteContact(c._id)} className="danger">Delete</button>
                <a href={`tel:${c.phone}`} className="link-btn">Call</a>
                <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="link-btn">WhatsApp</a>
              </div>
            </li>
          ))}
        </ul>

        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span>Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= totalCount}>Next</button>
        </div>
      </section>
    </div>
  );
}

export default App;