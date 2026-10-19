import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Inbox, Briefcase, Wallet, BadgeCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import Input from '../../components/ui/Input/Input';
import { ROUTES, buildRoute } from '../../constants/routes';

const TILES = [
  { label: 'Leads', text: 'Customers who approved you', to: ROUTES.VENDOR_LEADS, icon: Inbox },
  { label: 'Jobs and bookings', text: 'Confirmed work from accepted quotes', to: ROUTES.VENDOR_BOOKINGS, icon: Briefcase },
  { label: 'Payouts', text: 'Settlements and bank details', to: ROUTES.VENDOR_PAYOUTS, icon: Wallet },
];

const VendorDashboardPage = () => {
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [occasions, setOccasions] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [saving, setSaving] = useState(false);

  const loadServices = (vendorId) => {
    vendorCatalogService.getServices(vendorId).then((res) => setServices(res.data.results || []));
  };

  useEffect(() => {
    vendorCatalogService.getMine()
      .then((res) => {
        setVendor(res.data);
        loadServices(res.data._id);
      })
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, []);

  const handleAddService = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vendorCatalogService.createService(vendor._id, {
        name,
        occasions: occasions.split(',').map((o) => o.trim()).filter(Boolean),
        leadTimeDays: Number(leadTimeDays) || 7,
      });
      toast.success('Service added!');
      setName(''); setOccasions(''); setLeadTimeDays(7); setShowForm(false);
      loadServices(vendor._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add service.');
    }
    setSaving(false);
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`Remove "${service.name}"? Its packages and add-ons go with it.`)) return;
    try {
      await vendorCatalogService.deleteService(vendor._id, service._id);
      toast.success('Service removed.');
      loadServices(vendor._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove service.');
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!vendor) {
    return (
      <EmptyState
        icon="🏪"
        title="No vendor profile yet"
        message="Register as a vendor to start listing your services."
        action={<Link to={ROUTES.VENDOR_REGISTER} className="btn-brand inline-block">Register as vendor</Link>}
      />
    );
  }

  return (
    <div>
      {/* Banner */}
      <section className="surface-night bg-night text-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-10">
          <p className="text-sm text-white/60">Vendor dashboard</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl">{vendor.businessName}</h1>
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold ${vendor.isApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
          >
            {vendor.isApproved ? <BadgeCheck size={13} /> : <Clock size={13} />}
            {vendor.isApproved ? 'Verified' : 'Pending admin verification'}
          </span>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        {/* Where to go next */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TILES.map(({ label, text, to, icon: Icon }) => (
            <Link key={label} to={to} className="card flex items-start gap-3 p-5 transition-colors hover:border-night">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marigold-soft text-night">
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block font-heading font-bold text-night">{label}</span>
                <span className="block text-sm text-ink/60">{text}</span>
              </span>
            </Link>
          ))}
        </div>

        {/* Services */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold text-night">Your services</h2>
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              aria-expanded={showForm}
              className="btn-outline inline-flex items-center gap-1.5 !py-2 text-sm"
            >
              <Plus size={15} /> Add service
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddService} className="card mb-4 space-y-4 p-5">
              <Input
                label="Service name"
                required
                placeholder="e.g. Wedding photography"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Occasions"
                placeholder="wedding, birthday"
                helperText="Separate with commas."
                value={occasions}
                onChange={(e) => setOccasions(e.target.value)}
              />
              <Input
                label="Lead time (days)"
                type="number"
                min="0"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
              />
              <button type="submit" disabled={saving || !name.trim()} className="btn-brand text-sm disabled:opacity-60">
                {saving ? 'Saving...' : 'Save service'}
              </button>
            </form>
          )}

          {services.length === 0 ? (
            <div className="card px-6 py-10 text-center">
              <p className="font-heading text-lg font-semibold text-night">No services yet</p>
              <p className="mt-1 text-sm text-ink/60">Add your first service, then create packages under it.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-night">{s.name}</p>
                    <p className="text-sm text-ink/60">
                      {s.occasions?.join(', ') || 'No occasions set'}, {s.leadTimeDays} days lead time
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={buildRoute.vendorPackages(vendor._id, s._id)}
                      className="h-10 rounded-pill border border-night/30 px-4 text-sm font-semibold leading-10 text-night transition-colors hover:bg-night/5"
                    >
                      Manage packages
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      aria-label={`Remove ${s.name}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-mist text-ink/60 transition-colors hover:border-red-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default VendorDashboardPage;