import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import { ROUTES } from '../../constants/routes';
import { formatPaise, rupeesToPaise } from '../../utils/formatPrice';
import Input from '../../components/ui/Input/Input';
import DashboardShell from '../../components/dashboard/DashboardShell';

const EMPTY_FORM = { name: '', price: '', maxQuantity: 1, description: '' };

const VendorAddonsPage = () => {
  const { vendorId, packageId } = useParams();
  const [addons, setAddons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    vendorCatalogService.getAddons(vendorId, packageId).then((res) => setAddons(res.data.results || []));
  };

  useEffect(() => { load(); }, [vendorId, packageId]);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add add-on.');
    }
    setSaving(false);
  };

  const handleDelete = async (addon) => {
    if (!window.confirm(`Remove the add-on "${addon.name}"?`)) return;
    try {
      await vendorCatalogService.deleteAddon(vendorId, packageId, addon._id);
      toast.success('Add-on removed.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove add-on.');
    }
  };

  return (
    <DashboardShell
      backTo={ROUTES.VENDOR_DASHBOARD}
      backLabel="Back to services"
      title="Add-ons"
      subtitle="Extras customers can add to this package."
      action={
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          aria-expanded={showForm}
          className="btn-outline inline-flex shrink-0 items-center gap-1.5 !py-2 text-sm"
        >
          <Plus size={15} /> Add add-on
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleAdd} className="card mb-6 space-y-4 p-5">
          <Input label="Add-on name" required placeholder="e.g. Drone coverage" value={form.name} onChange={update('name')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Price (₹)" type="number" min="0" required value={form.price} onChange={update('price')} />
            <Input label="Max quantity" type="number" min="1" value={form.maxQuantity} onChange={update('maxQuantity')} />
          </div>
          <Input label="Short description" value={form.description} onChange={update('description')} />
          <button type="submit" disabled={saving} className="btn-brand text-sm disabled:opacity-60">
            {saving ? 'Saving...' : 'Save add-on'}
          </button>
        </form>
      )}

      {addons.length === 0 ? (
        <div className="card px-6 py-10 text-center">
          <p className="font-heading text-lg font-semibold text-night">No add-ons yet</p>
          <p className="mt-1 text-sm text-ink/60">Add-ons are optional. Add one if customers often ask for extras.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {addons.map((a) => (
            <li key={a._id} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-heading font-bold text-night">{a.name}</p>
                <p className="text-sm text-ink/60">
                  {formatPaise(a.pricePaise)}, up to {a.maxQuantity}
                  {a.description ? `, ${a.description}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(a)}
                aria-label={`Remove ${a.name}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-mist text-ink/60 transition-colors hover:border-red-400 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
};

export default VendorAddonsPage;