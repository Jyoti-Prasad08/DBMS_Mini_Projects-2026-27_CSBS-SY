function getOwnerId(item) {
  if (!item || !item.owner) return null;
  if (item.owner._id) return String(item.owner._id);
  return String(item.owner);
}

function getOwnerName(item) {
  if (item && item.owner && typeof item.owner === 'object' && item.owner.name) {
    return item.owner.name;
  }
  return 'Campus user';
}

function itemView(item) {
  const source = item && typeof item.toObject === 'function' ? item.toObject() : item || {};

  return {
    id: String(source._id),
    type: source.type,
    title: source.title,
    category: source.category,
    description: source.description,
    color: source.color,
    brand: source.brand || '',
    location: source.location,
    dateTime: source.dateTime,
    tags: Array.isArray(source.tags) ? source.tags : [],
    status: source.status,
    imageUrl: source.imageUrl || '',
    ownerName: getOwnerName(item),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

module.exports = {
  getOwnerId,
  getOwnerName,
  itemView,
};
