// src/pages/Vendors/VendorsPage.jsx
// Matches reference: white bg, category tab pills, vendor grid with hatch placeholder,
// verified badge, rating, services, price range, "View profile →" button
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Star, ChevronDown } from 'lucide-react';
import { fetchVendors, setVendorFilter } from '../../features/vendors/slices/vendorsSlice';
import { VENDOR_CATEGORIES } from '../../constants/categories';
import { SkeletonGrid } from '../../components/ui/SkeletonCard/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import { buildRoute } from '../../constants/routes';
import { formatPriceRange } from '../../utils/formatPrice';

const VendorsPage = () => {
  const dispatch      = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchVal, setSearchVal] = useState('');
  const vendors  = useSelector((s) => s.vendors.list);
  const filters  = useSelector((s) => s.vendors.filters);
  const status   = useSelector((s) => s.vendors.listStatus);

  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    dispatch(setVendorFilter({ category: cat }));
    dispatch(fetchVendors({ category: cat }));
  }, [searchParams]);

  const handleSearch = (val) => {
    setSearchVal(val);
    dispatch(setVendorFilter({ search: val }));
    dispatch(fetchVendors({ ...filters, search: val }));
  };

  const cats = [{ id: 'all', label: 'All Vendors' }, ...VENDOR_CATEGORIES.filter(c => c.id !== 'all').map(c => ({ id: c.id, label: c.label }))];

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-black text-2xl text-gray-900">Vendor Directory</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {vendors.length} verified vendors in Bareilly — photographers, DJs, decorators, caterers and more
              </p>
            </div>
            {/* Search */}
            <div className="relative md:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchVal}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-0 overflow-x-auto scrollbar-none mt-4">
            {cats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSearchParams(cat.id !== 'all' ? { category: cat.id } : {})}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${filters.category === cat.id
                    ? 'border-brand-red text-brand-red'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Sort row */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-500">{vendors.length} vendors</span>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Sort</span>
            <div className="flex items-center gap-1 border border-gray-300 bg-white px-3 py-1.5">
              <span>Top rated</span>
              <ChevronDown size={13} />
            </div>
          </div>
        </div>

        {status === 'loading' && <SkeletonGrid count={6} />}
        {status === 'succeeded' && vendors.length === 0 && <EmptyState icon="🔍" title="No vendors found" message="Try a different category" />}

        {status !== 'loading' && vendors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="bg-white hover:shadow-md transition-shadow duration-200">
                {/* Cover image / hatch */}
                <div
                  className="relative h-40 overflow-hidden"
                  style={{
                    backgroundImage: vendor.coverImage
                      ? undefined
                      : 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 10px)',
                    backgroundColor: '#e5e7eb',
                  }}
                >
                  {vendor.coverImage && (
                    <img src={vendor.coverImage} alt={vendor.name} className="w-full h-full object-cover" />
                  )}
                  {vendor.verified && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-brand-red bg-white border border-brand-red px-2 py-0.5">
                      ◎ VERIFIED
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Logo */}
                    <div
                      className="w-12 h-12 shrink-0"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 6px)',
                        backgroundColor: '#e5e7eb',
                      }}
                    >
                      {vendor.logo && <img src={vendor.logo} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-base text-gray-900 mb-0.5 truncate">{vendor.name}</h3>
                      <p className="text-xs text-gray-500 mb-1">{vendor.services?.slice(0, 2).join(' · ')}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{vendor.rating}</span>
                        <span className="text-gray-400">{vendor.reviewCount} reviews · {vendor.location?.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Price range</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatPriceRange(vendor.priceRange?.min, vendor.priceRange?.max, vendor.priceRange?.currency)}
                      </p>
                    </div>
                    <Link
                      to={buildRoute.vendorProfile(vendor.id)}
                      className="bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold px-4 py-2 transition-colors"
                    >
                      View profile →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorsPage;
