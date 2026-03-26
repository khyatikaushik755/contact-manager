import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const fetchContacts = async () => {
    const res = await axios.get("http://localhost:5000/api/contacts");
    setContacts(res.data);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/api/contacts", form);
    fetchContacts();
  };

  const deleteContact = async (id) => {
    await axios.delete(`http://localhost:5000/api/contacts/${id}`);
    fetchContacts();
  };

  return (
    <div>
      <h1>Contact Manager</h1>

      <form onSubmit={handleSubmit}>
        <input placeholder="Name" onChange={(e) => setForm({...form, name: e.target.value})} />
        <input placeholder="Phone" onChange={(e) => setForm({...form, phone: e.target.value})} />
        <input placeholder="Email" onChange={(e) => setForm({...form, email: e.target.value})} />
        <button>Add</button>
      </form>

      <ul>
        {contacts.map((c) => (
          <li key={c._id}>
            {c.name} - {c.phone}
            <button onClick={() => deleteContact(c._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;