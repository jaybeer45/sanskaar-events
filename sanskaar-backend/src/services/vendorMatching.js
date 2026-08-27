    const Vendor = require('../models/Vendor');
    const RequestMatch = require('../models/RequestMatch');

    // Haversine formula — straight-line distance in km between two lat/lng points
    const distanceKm = (lat1, lng1, lat2, lng2) => {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const isDateBlocked = (blockedDates, eventDate) => {
    const target = new Date(eventDate).toDateString();
    return (blockedDates || []).some((d) => new Date(d).toDateString() === target);
    };

    // Runs the full match: hard filters (M1-M5) + scoring (M6) + caps (M7)
    // Returns nothing — writes RequestMatch documents directly.
    const matchVendorsToRequest = async (request) => {
    const candidates = await Vendor.find({
        isApproved: true,      // M1
        isActive: true,
        categories: { $in: request.services }, // M2 (category overlap, evaluated per-service below)
    });

    const matchesToCreate = [];

    for (const service of request.services) {
        const serviceCandidates = candidates.filter((v) => v.categories.includes(service));
        const scored = [];

        for (const vendor of serviceCandidates) {
        // M3 — within service radius, or outstation available
        const dist = distanceKm(vendor.lat, vendor.lng, request.lat, request.lng);
        const withinRadius = dist !== null && dist <= vendor.serviceRadiusKm;
        const outstationOk = vendor.outstationAvailable;
        if (dist !== null && !withinRadius && !outstationOk) continue; // hard filter fail

        // M4 — not blocked on the requested date (daily-ceiling check pending VendorBooking model in Phase C)
        if (isDateBlocked(vendor.blockedDates, request.eventDate)) continue;

        // M5 — budget fit: vendor's price should sit within 0.2x-1.2x of the request budget
        const vendorPrice = vendor.priceRange?.min || 0;
        const budgetMid = (request.budgetMin + request.budgetMax) / 2;
        const budgetFitOk = vendorPrice === 0 || (vendorPrice >= budgetMid * 0.2 && vendorPrice <= budgetMid * 1.2);
        if (!budgetFitOk) continue;

        // M6 — scoring (0-1 normalized components)
        const ratingScore = (vendor.ratingAvg || 0) / 5;
        const reviewScore = Math.min((vendor.ratingCount || 0) / 50, 1); // saturates at 50 reviews
        const budgetScore = budgetMid > 0 ? 1 - Math.min(Math.abs(vendorPrice - budgetMid) / budgetMid, 1) : 0.5;
        const distanceScore = dist === null ? 0.5 : Math.max(0, 1 - dist / (vendor.serviceRadiusKm || 30));
        const responseRateScore = 0.5; // no response-rate tracking yet — neutral placeholder
        const portfolioScore = Math.min((vendor.portfolio?.length || 0) / 10, 1);

        const score =
            0.35 * ratingScore +
            0.20 * reviewScore +
            0.15 * budgetScore +
            0.15 * distanceScore +
            0.10 * responseRateScore +
            0.05 * portfolioScore;

        const reasonParts = [];
        if (ratingScore > 0.7) reasonParts.push('highly rated');
        if (budgetScore > 0.7) reasonParts.push('fits your budget');
        if (distanceScore > 0.7) reasonParts.push('nearby');
        const reason = reasonParts.length > 0 ? reasonParts.join(', ') : 'matches your requirements';

        scored.push({ vendor, service, score, reason });
        }

        // M7 — top 3-5 per service
        scored.sort((a, b) => b.score - a.score);
        matchesToCreate.push(...scored.slice(0, 5));
    }

    // M7 — max 8 vendors total across the whole request (dedupe by vendor, keep highest score)
    const byVendor = new Map();
    for (const m of matchesToCreate) {
        const existing = byVendor.get(m.vendor._id.toString());
        if (!existing || m.score > existing.score) byVendor.set(m.vendor._id.toString(), m);
    }
    const finalMatches = [...byVendor.values()].sort((a, b) => b.score - a.score).slice(0, 8);

    if (finalMatches.length === 0) return 0;

    await RequestMatch.insertMany(
        finalMatches.map((m) => ({
        request: request._id,
        vendor: m.vendor._id,
        service: m.service,
        score: m.score,
        reason: m.reason,
        approvedByUser: false, // privacy gate stays shut until the customer acts
        }))
    );

    return finalMatches.length;
    };

    module.exports = { matchVendorsToRequest, distanceKm }; 