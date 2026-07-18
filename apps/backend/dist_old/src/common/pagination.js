"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
async function paginate(model, page = 1, limit = 20, args = {}) {
    const [data, total] = await Promise.all([
        model.findMany({ skip: (page - 1) * limit, take: limit, ...args }),
        model.count({ where: args.where }),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
//# sourceMappingURL=pagination.js.map