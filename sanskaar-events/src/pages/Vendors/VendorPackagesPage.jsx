import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import { ROUTES, buildRoute } from '../../constants/routes';
import { formatPaise, rupeesToPaise } from '../../utils/formatPrice';
import Input from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Input/Fields';
import DashboardShell from '../../components/dashboard/DashboardShell';

const PRICING_MODELS = {
  FIXED: 'Fixed price',
  PER_PERSON: 'Per person',
  PER_HOUR: 'Per hour',
  PER_DAY: 'Per day',
  PER_UNIT: 'Per unit',
  STARTING_FROM: 'Starting from',
  CUSTOM_QUOTE: 'Custom quote',
};

const EMPTY_FORM = { name: '', pricingModel: 'FIXED', price: '', inclusions: '', advancePercent: 50 };

const VendorPackagesPage = () => {
  const { vendorId, serviceId } = useParams();
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    vendorCatalogService.getPackages(vendorId, serviceId).then((res) => setPackages(res.data.results || []));
  };

  useEffect(() => { load(); }, [vendorId, serviceId]);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add package.');
    }
    setSaving(false);
  };

  const handleDelete = async (pkg) => {
    if (!window.confirm(`Remove the package "${pkg.name}"?`)) return;
    try {
      await vendorCatalogService.deletePackage(vendorId, serviceId, pkg._id);
      toast.success('Package removed.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove package.');
    }
  };

  return (
    <DashboardShell
      backTo={ROUTES.VENDOR_DASHBOARD}
      backLabel="Back to services"
      title="Packages"
      subtitle="What customers can book under this service."
      action={
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          aria-expanded={showForm}
          className="btn-outline inline-flex shrink-0 items-center gap-1.5 !py-2 text-sm"
        >
          <Plus size={15} /> Add package
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleAdd} className="card mb-6 space-y-4 p-5">
          <Input label="Package name" required placeholder="e.g. Haldi half-day" value={form.name} onChange={update('name')} />
          <Select label="Pricing model" value={form.pricingModel} onChange={update('pricingModel')}>
            {Object.entries(PRICING_MODELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          {form.pricingModel !== 'CUSTOM_QUOTE' && (
            <Input label="Price (₹)" type="number" min="0" required value={form.price} onChange={update('price')} />
          )}
          <Input
            label="Inclusions"
            required
            placeholder="4 hours coverage, 200 photos"
            helperText="Separate with commas. At least 2."
            value={form.inclusions}
            onChange={update('inclusions')}
          />
          <Input label="Advance (%)" type="number" min="0" max="100" value={form.advancePercent} onChange={update('advancePercent')} />
          <button type="submit" disabled={saving} className="btn-brand text-sm disabled:opacity-60">
            {saving ? 'Saving...' : 'Save package'}
          </button>
        </form>
      )}

      {packages.length === 0 ? (
        <div className="card px-6 py-10 text-center">
          <p className="font-heading text-lg font-semibold text-night">No packages yet</p>
          <p className="mt-1 text-sm text-ink/60">Add a package so customers know what you offer and what it costs.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {packages.map((p) => (
            <li key={p._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-heading font-bold text-night">{p.name}</p>
                <p className="text-sm text-ink/60">
                  {p.pricingModel === 'CUSTOM_QUOTE'
                    ? 'Custom quote'
                    : `${formatPaise(p.pricePaise)}, ${(PRICING_MODELS[p.pricingModel] || '').toLowerCase()}`}
                  {', '}
                  {p.inclusions?.length || 0} inclusions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={buildRoute.vendorAddons(vendorId, p._id)}
                  className="h-10 rounded-pill border border-night/30 px-4 text-sm font-semibold leading-10 text-night transition-colors hover:bg-night/5"
                >
                  Manage add-ons
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  aria-label={`Remove ${p.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-mist text-ink/60 transition-colors hover:border-red-400 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
};

export default VendorPackagesPage;