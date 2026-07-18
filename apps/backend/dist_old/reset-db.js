"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🗑️  Limpando banco de dados...');
    await prisma.examTimelineEvent.deleteMany();
    await prisma.asoDocument.deleteMany();
    await prisma.examResult.deleteMany();
    await prisma.teleconsultation.deleteMany();
    await prisma.queueEntry.deleteMany();
    await prisma.patientDocument.deleteMany();
    await prisma.anamnese.deleteMany();
    await prisma.examRequest.deleteMany();
    await prisma.examInvite.deleteMany();
    await prisma.financialTransaction.deleteMany();
    await prisma.calendarEvent.deleteMany();
    await prisma.companyPatientRelation.deleteMany();
    await prisma.companyDocument.deleteMany();
    await prisma.companyAdmin.deleteMany();
    await prisma.operator.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.company.deleteMany();
    await prisma.clinic.deleteMany();
    await prisma.userAccount.deleteMany();
    await prisma.servicePrice.deleteMany();
    await prisma.financialConfig.deleteMany();
    console.log('✅ Banco limpo!');
    const passwordHash = await bcrypt.hash('admin', 10);
    await prisma.userAccount.create({
        data: {
            email: 'admin@saudeseg.com',
            passwordHash,
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin criado: admin@saudeseg.com / admin');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=reset-db.js.map