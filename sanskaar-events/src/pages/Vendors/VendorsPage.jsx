// src/pages/Vendors/VendorsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Star, ChevronDown, ChevronRight, BadgeCheck } from 'lucide-react';
import { fetchVendors, setVendorFilter } from '../../features/vendors/slices/vendorsSlice';
import { VENDOR_CATEGORIES } from '../../constants/categories';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import { buildRoute, ROUTES } from '../../constants/routes';
import { formatPriceRange } from '../../utils/formatPrice';
import { useDebounce } from '../../hooks/useDebounce';

const SORT_OPTIONS = ['Top rated', 'Most reviewed', 'Price: Low to High'];

const hasPriceRange = (v) => Number.isFinite(v.priceRange?.min) && Number.isFinite(v.priceRange?.max);

const VendorCard = ({ vendor }) => (
  <Link to={buildRoute.vendorProfile(vendor.id)} className="card block h-full">
    <div className="relative h-40 bg-gradient-to-br from-night via-night-soft to-night">
      {vendor.coverImage && (
        <img src={vendor.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
      )}
      {vendor.verified && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-white/90 px-2.5 py-1 text-xs font-semibold text-night">
          <BadgeCheck size={13} /> Verified
        </span>
      )}
    </div>

    <div className="px-5 pb-5">
      <div className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-night font-heading text-xl font-extrabold text-marigold">
        {vendor.logo ? (
          <img src={vendor.logo} alt="" className="h-full w-full object-cover" />
        ) : (
          vendor.name?.[0]?.toUpperCase()
        )}
      </div>

      <h3 className="mt-3 truncate font-heading text-lg font-bold text-night">{vendor.name}</h3>
      <p className="mt-0.5 truncate text-sm text-ink/60">{vendor.services?.slice(0, 3).join(', ')}</p>

      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/70">
        {vendor.reviewCount > 0 ? (
          <>
            <Star size={14} className="fill-marigold text-marigold" />
            <span className="font-semibold text-night">{vendor.rating}</span>
            <span>
              ({vendor.reviewCount} {vendor.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </>
        ) : (
          <span>New on Sanskaar</span>
        )}
        {vendor.location?.city && <span className="truncate">, {vendor.location.city}</span>}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-mist pt-3">
        <div className="min-w-0">
          <p className="text-xs text-ink/60">Price range</p>
          <p className="truncate font-heading font-bold text-night">
            {hasPriceRange(vendor)
              ? formatPriceRange(vendor.priceRange.min, vendor.priceRange.max, vendor.priceRange.currency)
              : 'Ask for a quote'}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center text-sm font-semibold text-night">
          View profile <ChevronRight size={16} />
        </span>
      </div>
    </div>
  </Link>
);

const VendorsPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchVal, setSearchVal] = useState('');
  const [sort, setSort] = useState('Top rated');
  const debouncedSearch = useDebounce(searchVal, 400);

  const vendors = useSelector((s) => s.vendors.list);
  const status = useSelector((s) => s.vendors.listStatus);

  const activeCat = searchParams.get('category') || 'all';

  useEffect(() => {
    dispatch(setVendorFilter({ category: activeCat, search: debouncedSearch }));
    dispatch(fetchVendors({ category: activeCat, search: debouncedSearch }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat, debouncedSearch]);

  const sortedVendors = useMemo(() => {
    const list = [...vendors];
    switch (sort) {
      case 'Most reviewed':
        return list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      case 'Price: Low to High':
        return list.sort((a, b) => (a.priceRange?.min ?? Infinity) - (b.priceRange?.min ?? Infinity));
      default:
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  }, [vendors, sort]);

  const cats = [
    { id: 'all', label: 'All vendors' },
    ...VENDOR_CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div>
      {/* Header */}
      <section className="surface-night bg-night text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
          <h1 className="font-heading text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            Find vendors for your event
          </h1>
          <p className="mt-3 max-w-xl text-white/70">
            Photographers, DJs, decorators, caterers and more. Browse profiles, compare prices and ask for a quote.
          </p>
          <div className="relative mt-6 max-w-xl">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-night/50" />
            <input
              type="search"
              aria-label="Search vendors"
              placeholder="Search vendors"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="h-12 w-full rounded-pill bg-white pl-11 pr-4 text-ink placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-marigold"
            />
          </div>
        </div>
      </section>

      {/* Category chips */}
      <div className="sticky top-16 z-30 border-b border-mist bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div role="group" aria-label="Filter by category" className="scrollbar-none flex items-center gap-2 overflow-x-auto py-3">
            {cats.map((cat) => {
              const isActive = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSearchParams(cat.id !== 'all' ? { category: cat.id } : {})}
                  className={`h-10 shrink-0 whitespace-nowrap rounded-pill px-4 text-sm font-medium transition-colors ${isActive ? 'bg-night text-white' : 'border border-mist bg-white text-ink/80 hover:border-night/40'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-ink/60">
            {sortedVendors.length} {sortedVendors.length === 1 ? 'vendor' : 'vendors'}
          </p>
          <div className="relative">
            <select
              aria-label="Sort vendors"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-10 appearance-none rounded-pill border border-mist bg-white pl-4 pr-9 text-sm text-ink transition-colors focus:border-night focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-night/50" />
          </div>
        </div>

        {status === 'loading' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-72" />
            ))}
          </div>
        )}

        {status === 'succeeded' && sortedVendors.length === 0 && (
          <EmptyState icon="🔍" title="No vendors found" message="Try a different category or search." />
        )}

        {status !== 'loading' && sortedVendors.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}

        {/* Hand over to the marketplace for people who do not want to browse */}
        <div className="surface-night mt-12 flex flex-col items-start justify-between gap-5 rounded-3xl bg-night p-8 text-white md:flex-row md:items-center">
          <div>
            <h2 className="font-heading text-2xl font-extrabold">Not sure who to pick?</h2>
            <p className="mt-1 max-w-lg text-white/70">
              Tell us what you need and your budget. Matching vendors will send you quotes.
            </p>
          </div>
          <Link to={ROUTES.MARKETPLACE} className="btn-marigold shrink-0">
            Get free quotes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VendorsPage;