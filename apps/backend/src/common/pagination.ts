export interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function paginate<T>(
  model: any,
  page: number = 1,
  limit: number = 20,
  args: any = {},
): Promise<PaginatedResult<T>> {
  const [data, total] = await Promise.all([
    model.findMany({ skip: (page - 1) * limit, take: limit, ...args }),
    model.count({ where: args.where }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
