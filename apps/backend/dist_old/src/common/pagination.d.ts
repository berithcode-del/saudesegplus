export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare function paginate<T>(model: any, page?: number, limit?: number, args?: any): Promise<PaginatedResult<T>>;
