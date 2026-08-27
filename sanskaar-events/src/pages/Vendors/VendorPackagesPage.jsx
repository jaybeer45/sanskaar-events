import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import { ROUTES, buildRoute } from '../../constants/routes';
import { formatPaise, rupeesToPaise } from '../../utils/formatPrice';

const PRICING_MODELS = ['FIXED', 'PER_PERSON', 'PER_HOUR', 'PER_DAY', 'PER_UNIT', 'STARTING_FROM', 'CUSTOM_QUOTE'];

const VendorPackagesPage = () => {
  const { vendorId, serviceId } = useParams();
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', pricingModel: 'FIXED', price: '', inclusions: '', advancePercent: 50 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    vendorCatalogService.getPackages(vendorId, serviceId).then((res) => setPackages(res.data.results || []));
  };

  useEffect(() => { load(); }, [vendorId, serviceId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const inclusionsArr = form.inclusions.split(',').map((i) => i.trim()).filter(Boolean);
      await vendorCatalogService.createPackage(vendorId, serviceId, {
        name: form.name,
        pricingModel: form.pricingModel,
        pricePaise: form.pricingModel === 'CUSTOM_QUOTE' ? undefined : rupeesToPaise(form.price),
        inclusions: inclusionsArr,
        advancePercent: Number(form.advancePercent) || 50,
      });
      toast.success('Package added!');
      setForm({ name: '', pricingModel: 'FIXED', price: '', inclusions: '', advancePercent: 50 });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add package.');
    }
    setSaving(false);
  };

  const handleDelete = async (packageId) => {
    try {
      await vendorCatalogService.deletePackage(vendorId, serviceId, packageId);
      toast.success('Package removed.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove package.');
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
          <h1 className="font-black text-xl text-gray-900">Packages</h1>
          <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 text-xs font-bold text-brand-red border border-brand-red px-3 py-2">
            <Plus size={14} /> Add Package
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-white border border-gray-200 p-5 space-y-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Package name e.g. Haldi Half-Day" required className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <select value={form.pricingModel} onChange={(e) => setForm({ ...form, pricingModel: e.target.value })} className="w-full border border-gray-300 px-3 py-2.5 text-sm bg-white">
              {PRICING_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {form.pricingModel !== 'CUSTOM_QUOTE' && (
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" placeholder="Price (₹)" required className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            )}
            <input value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} placeholder="Inclusions, comma separated (min 2) e.g. 4 hours coverage, 200 photos" required className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <input value={form.advancePercent} onChange={(e) => setForm({ ...form, advancePercent: e.target.value })} type="number" placeholder="Advance %" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <button type="submit" disabled={saving} className="bg-brand-red hover:bg-brand-red-hover text-white font-bold px-4 py-2 text-sm disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Package'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {packages.length === 0 && <p className="text-sm text-gray-500">No packages added yet.</p>}
          {packages.map((p) => (
            <div key={p._id} className="bg-white border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {p.pricingModel === 'CUSTOM_QUOTE' ? 'Custom quote' : formatPaise(p.pricePaise)} · {p.inclusions?.length} inclusions
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={buildRoute.vendorAddons(vendorId, p._id)} className="text-xs font-bold text-brand-red border border-brand-red px-3 py-2">
                  Manage Add-ons
                </Link>
                <button onClick={() => handleDelete(p._id)} className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:border-red-400 hover:text-red-500">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorPackagesPage;