import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Chicken Biryani',
    image: '',
    priceQuarter: '',
    priceHalf: '',
    priceFull: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    'Chicken Biryani', 'Mutton Biryani', 'Veg Biryani',
    'Starters', 'Combos', 'Sides', 'Beverages', 'Other'
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/menu`);
      setItems(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Construct variants array
    const variants = [];
    if (formData.priceQuarter) variants.push({ name: 'Quarter', price: Number(formData.priceQuarter) });
    if (formData.priceHalf) variants.push({ name: 'Half', price: Number(formData.priceHalf) });
    if (formData.priceFull) variants.push({ name: 'Full', price: Number(formData.priceFull) });

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('variants', JSON.stringify(variants));
    data.append('price', variants.length > 0 ? variants[0].price : 0);
    data.append('available', 'true'); // Default available

    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (editItem) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/menu/${editItem._id}`, data, config);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/menu`, data, config);
      }
      setIsModalOpen(false);
      setEditItem(null);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error(error);
      alert('Error saving item: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', category: 'Chicken Biryani', image: '',
      priceQuarter: '', priceHalf: '', priceFull: ''
    });
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/menu/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchItems();
      } catch (error) {
        alert('Error deleting item');
      }
    }
  };

  const openEdit = (item) => {
    setEditItem(item);

    // Map variants back to form fields
    let pQ = '', pH = '', pF = '';
    if (item.variants) {
      item.variants.forEach(v => {
        if (v.name === 'Quarter') pQ = v.price;
        if (v.name === 'Half') pH = v.price;
        if (v.name === 'Full') pF = v.price;
      });
    }

    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      image: item.image,
      priceQuarter: pQ,
      priceHalf: pH,
      priceFull: pF
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display text-white">Menu Management</h1>
        <button
          onClick={() => {
            setEditItem(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-gold text-black px-6 py-2 rounded font-bold flex items-center gap-2 hover:bg-white transition-colors"
        >
          <Plus size={20} /> Add Item
        </button>
      </div>

      {loading ? (
        <p className="text-white">Loading...</p>
      ) : (
        <div className="bg-dark-800 rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full text-left text-gray-300">
            <thead className="bg-black/40 text-gold uppercase text-sm font-bold">
              <tr>
                <th className="p-4">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Prices (Q/H/F)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <img
                      src={item.image || 'https://placehold.co/100?text=No+Image'}
                      alt={item.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  </td>
                  <td className="p-4 font-bold text-white">{item.name}</td>
                  <td className="p-4"><span className="px-2 py-1 rounded bg-white/10 text-xs">{item.category}</span></td>
                  <td className="p-4 text-gold font-bold">
                    {item.variants && item.variants.map(v => `${v.name.charAt(0)}:${v.price} `)}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openEdit(item)} className="text-blue-400 hover:text-blue-300"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(item._id)} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 p-8 rounded-lg w-full max-w-lg border border-white/10 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display text-gold mb-6">{editItem ? 'Edit Item' : 'Add New Item'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-gold focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-gold focus:outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Price Variants */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Quarter ₹</label>
                  <input
                    type="number"
                    value={formData.priceQuarter}
                    onChange={(e) => setFormData({ ...formData, priceQuarter: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-gold focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Half ₹</label>
                  <input
                    type="number"
                    value={formData.priceHalf}
                    onChange={(e) => setFormData({ ...formData, priceHalf: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-gold focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Full ₹</label>
                  <input
                    type="number"
                    value={formData.priceFull}
                    onChange={(e) => setFormData({ ...formData, priceFull: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-gold focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-gold focus:outline-none"
                  rows="3"
                  required
                ></textarea>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Upload Image (S3)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-gold focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-black hover:file:bg-white"
                />
                {editItem && editItem.image && !imageFile && (
                  <p className="text-xs text-green-500 mt-1">Current Image: {editItem.image.split('/').pop()}</p>
                )}
              </div>
              <button className="w-full bg-gold text-black font-bold py-3 mt-4 hover:bg-white transition-colors uppercase tracking-widest rounded">
                {editItem ? 'Update Item' : 'Add Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
