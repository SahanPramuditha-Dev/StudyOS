export const toggleSelectionId = (prevIds, id) => (
  prevIds.includes(id) ? prevIds.filter((x) => x !== id) : [...prevIds, id]
);

export const toggleSelectAll = (prevIds, visibleIds) => {
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => prevIds.includes(id));
  return allSelected
    ? prevIds.filter((id) => !visibleIds.includes(id))
    : [...new Set([...prevIds, ...visibleIds])];
};

export const softArchiveByIds = (items, ids, extra = {}) => {
  const selected = new Set(ids);
  const now = new Date().toISOString();
  return items.map((item) => (selected.has(item.id) ? { ...item, archived: true, updatedAt: now, ...extra } : item));
};

export const restoreByIds = (items, ids, extra = {}) => {
  const selected = new Set(ids);
  const now = new Date().toISOString();
  return items.map((item) => (selected.has(item.id) ? { ...item, archived: false, updatedAt: now, ...extra } : item));
};

export const hardDeleteByIds = (items, ids) => {
  const selected = new Set(ids);
  return items.filter((item) => !selected.has(item.id));
};
