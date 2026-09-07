import axiosInstance from "./axios.instance";

const normalize = (doc) => (doc?._id ? { ...doc, id: doc._id } : doc);
const normalizeList = (docs) => (docs || []).map(normalize);

export const adminService = {
  // Events
  getPendingEvents: async () => {
    const res = await axiosInstance.get("/admin/events/pending");
    return normalizeList(res.data.results);
  },
  approveEvent: (id) => axiosInstance.patch(`/admin/events/${id}/approve`),
  rejectEvent: (id, reason) =>
    axiosInstance.patch(`/admin/events/${id}/reject`, { reason }),

  // Organizers
  getPendingOrganizers: async () => {
    const res = await axiosInstance.get("/admin/organizers/pending");
    return normalizeList(res.data.results ?? res.data);
  },
  verifyOrganizer: (id) =>
    axiosInstance.patch(`/admin/organizers/${id}/verify`),
  rejectOrganizer: (id) =>
    axiosInstance.patch(`/admin/organizers/${id}/reject`),

  // Vendors
  getPendingVendors: async () => {
    const res = await axiosInstance.get("/admin/vendors/pending");
    return normalizeList(res.data.results);
  },
  verifyVendor: (id) => axiosInstance.patch(`/admin/vendors/${id}/verify`),

  // Vendor Payouts
  getVendorPayouts: async (status) => {
    const res = await axiosInstance.get("/admin/vendor-payouts", {
      params: status ? { status } : {},
    });
    return normalizeList(res.data.results);
  },
  markPayoutPaid: (id, bankRef) =>
    axiosInstance.patch(`/admin/vendor-payouts/${id}/mark-paid`, { bankRef }),

  // Coupons
  getManualCoupons: async () => {
    const res = await axiosInstance.get("/admin/coupons");
    return normalizeList(res.data.results);
  },
  createManualCoupon: (payload) =>
    axiosInstance.post("/admin/coupons", payload),
};
