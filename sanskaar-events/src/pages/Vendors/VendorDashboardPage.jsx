import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { ROUTES, buildRoute } from '../../constants/routes';

const VendorDashboardPage = () => {
  const navigate = useNavigate();
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

  const handleDelete = async (serviceId) => {
    try {
      await vendorCatalogService.deleteService(vendor._id, serviceId);
      toast.success('Service removed.');
      loadServices(vendor._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove service.');
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;

  if (!vendor) {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="font-black text-2xl text-gray-900 mb-2">No vendor profile yet</h2>
          <p className="text-gray-500 mb-6">Register as a vendor to start listing your services.</p>
          <button onClick={() => navigate(ROUTES.VENDOR_REGISTER)} className="bg-brand-red hover:bg-brand-red-hover text-white font-bold px-6 py-3 text-sm">
            Register as Vendor →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl text-gray-900">{vendor.businessName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {vendor.isApproved ? (
                <span className="text-green-600 font-bold">Verified</span>
              ) : (
                <span className="text-amber-600 font-bold">Pending admin verification</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={ROUTES.VENDOR_LEADS} className="text-xs font-bold text-gray-700 border border-gray-300 px-3 py-2 hover:border-gray-900">
              Leads
            </Link>
            <Link to={ROUTES.VENDOR_BOOKINGS} className="text-xs font-bold text-gray-700 border border-gray-300 px-3 py-2 hover:border-gray-900">
              Jobs & Bookings
            </Link>
            <Link to={ROUTES.VENDOR_PAYOUTS} className="text-xs font-bold text-gray-700 border border-gray-300 px-3 py-2 hover:border-gray-900">
              Payouts
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg text-gray-900">Your Services</h2>
          <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 text-xs font-bold text-brand-red border border-brand-red px-3 py-2">
            <Plus size={14} /> Add Service
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddService} className="bg-white border border-gray-200 p-5 space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Service name e.g. Wedding Photography" required className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <input value={occasions} onChange={(e) => setOccasions(e.target.value)} placeholder="Occasions, comma separated (wedding, birthday)" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <input value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} type="number" placeholder="Lead time (days)" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <button type="submit" disabled={saving} className="bg-brand-red hover:bg-brand-red-hover text-white font-bold px-4 py-2 text-sm disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Service'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {services.length === 0 && <p className="text-sm text-gray-500">No services added yet.</p>}
          {services.map((s) => (
            <div key={s._id} className="bg-white border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{s.occasions?.join(', ') || 'No occasions set'} · {s.leadTimeDays} days lead time</p>
              </div>
              <div className="flex gap-2">
                <Link to={buildRoute.vendorPackages(vendor._id, s._id)} className="text-xs font-bold text-brand-red border border-brand-red px-3 py-2">
                  Manage Packages
                </Link>
                <button onClick={() => handleDelete(s._id)} className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:border-red-400 hover:text-red-500">
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

export default VendorDashboardPage;