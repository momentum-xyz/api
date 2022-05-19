export interface PaginatedCollection {
  results: any[];
  itemCount: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export function paginateCollection(array: any, page = 1, limit = 20): PaginatedCollection {
  const slicedCollection = array.slice((page - 1) * limit, page * limit);

  return {
    results: slicedCollection,
    itemCount: slicedCollection.length,
    totalItems: array.length,
    itemsPerPage: Number(limit),
    totalPages: Math.ceil(array.length / limit),
    currentPage: Number(page),
  };
}
