import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import { ROUTES } from '../../constants/routes';
import { formatPaise, rupeesToPaise } from '../../utils/formatPrice';

const VendorAddonsPage = () => {
  const { vendorId, packageId } = useParams();
  const [addons, setAddons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', maxQuantity: 1, description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    vendorCatalogService.getAddons(vendorId, packageId).then((res) => setAddons(res.data.results || []));
  };

  useEffect(() => { load(); }, [vendorId, packageId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vendorCatalogService.createAddon(vendorId, packageId, {
        name: form.name,
        pricePaise: rupeesToPaise(form.price),
        maxQuantity: Number(form.maxQuantity) || 1,
        description: form.description,
      });
      toast.success('Add-on added!');
      setForm({ name: '', price: '', maxQuantity: 1, description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add add-on.');
    }
    setSaving(false);
  };

  const handleDelete = async (addonId) => {
    try {
      await vendorCatalogService.deleteAddon(vendorId, packageId, addonId);
      toast.success('Add-on removed.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove add-on.');
    }
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <Link to={ROUTES.VENDOR_DASHBOARD} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <ChevronLeft size={15} /> Back to services
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-black text-xl text-gray-900">Add-ons</h1>
          <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 text-xs font-bold text-brand-red border border-brand-red px-3 py-2">
            <Plus size={14} /> Add Add-on
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-white border border-gray-200 p-5 space-y-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Add-on name e.g. Drone Coverage" required className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" placeholder="Price (₹)" required className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <input value={form.maxQuantity} onChange={(e) => setForm({ ...form, maxQuantity: e.target.value })} type="number" placeholder="Max quantity" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <button type="submit" disabled={saving} className="bg-brand-red hover:bg-brand-red-hover text-white font-bold px-4 py-2 text-sm disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Add-on'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {addons.length === 0 && <p className="text-sm text-gray-500">No add-ons yet.</p>}
          {addons.map((a) => (
            <div key={a._id} className="bg-white border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 text-sm">{a.name}</p>
                <p className="text-xs text-gray-500">{formatPaise(a.pricePaise)} · max {a.maxQuantity} · {a.description}</p>
              </div>
              <button onClick={() => handleDelete(a._id)} className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:border-red-400 hover:text-red-500">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorAddonsPage;