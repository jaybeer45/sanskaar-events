export const normalizeId = (obj) => (obj?._id ? { ...obj, id: obj._id } : obj);
export const normalizeIdList = (list) => (list || []).map(normalizeId);