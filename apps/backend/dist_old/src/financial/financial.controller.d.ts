import { PaymentFlow, PriceItemCategory } from '@prisma/client';
import { FinancialService } from './financial.service';
export declare class FinancialController {
    private readonly financialService;
    constructor(financialService: FinancialService);
    getConfig(): Promise<{
        success: boolean;
        data: {
            id: string;
            updatedAt: Date;
            defaultClinicFeePercent: number;
            defaultDoctorFeePercent: number;
            defaultPlatformFeePercent: number;
        };
    }>;
    updateConfig(body: {
        defaultClinicFeePercent?: number;
        defaultDoctorFeePercent?: number;
        defaultPlatformFeePercent?: number;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            updatedAt: Date;
            defaultClinicFeePercent: number;
            defaultDoctorFeePercent: number;
            defaultPlatformFeePercent: number;
        };
    }>;
    listServicePrices(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            basePrice: number;
            clinicFeePercent: number;
            doctorFeePercent: number;
            platformFeePercent: number;
        }[];
    }>;
    createServicePrice(body: {
        name: string;
        description?: string;
        basePrice: number;
        clinicFeePercent: number;
        doctorFeePercent: number;
        platformFeePercent: number;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            basePrice: number;
            clinicFeePercent: number;
            doctorFeePercent: number;
            platformFeePercent: number;
        };
    }>;
    updateServicePrice(id: string, body: any): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            basePrice: number;
            clinicFeePercent: number;
            doctorFeePercent: number;
            platformFeePercent: number;
        };
    }>;
    deleteServicePrice(id: string): Promise<{
        success: boolean;
    }>;
    listExamItemPrices(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            category: import(".prisma/client").$Enums.PriceItemCategory;
            amount: number;
            clinicFeePercent: number;
            doctorFeePercent: number;
            platformFeePercent: number;
            code: string;
        }[];
    }>;
    createExamItemPrice(body: {
        code: string;
        name: string;
        category: PriceItemCategory;
        amount: number;
        clinicFeePercent?: number;
        doctorFeePercent?: number;
        platformFeePercent?: number;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            category: import(".prisma/client").$Enums.PriceItemCategory;
            amount: number;
            clinicFeePercent: number;
            doctorFeePercent: number;
            platformFeePercent: number;
            code: string;
        };
    }>;
    updateExamItemPrice(id: string, body: any): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            category: import(".prisma/client").$Enums.PriceItemCategory;
            amount: number;
            clinicFeePercent: number;
            doctorFeePercent: number;
            platformFeePercent: number;
            code: string;
        };
    }>;
    quote(body: {
        cboCode?: string;
        examPurpose?: string;
        specialClearances?: string[];
    }): Promise<{
        success: boolean;
        data: {
            cboCode?: string;
            examPurpose?: string;
            items: {
                code: string;
                name: string;
                category: PriceItemCategory;
                amount: number;
                clinicFeePercent: number;
                doctorFeePercent: number;
                platformFeePercent: number;
            }[];
            total: number;
        };
    }>;
    createPayment(body: {
        flow: PaymentFlow;
        companyId?: string;
        clinicId?: string;
        method?: string;
        cboCode?: string;
        examPurpose?: string;
        specialClearances?: string[];
        checkoutPayload?: Record<string, unknown>;
        externalId?: string;
    }, req: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            clinicId: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string | null;
            externalId: string | null;
            flow: import(".prisma/client").$Enums.PaymentFlow;
            amount: number;
            method: string | null;
            quoteSnapshot: string;
            checkoutPayload: string | null;
            confirmedAt: Date | null;
        };
    }>;
    confirmPayment(id: string, body: {
        method?: string;
    }, req: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            clinicId: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string | null;
            externalId: string | null;
            flow: import(".prisma/client").$Enums.PaymentFlow;
            amount: number;
            method: string | null;
            quoteSnapshot: string;
            checkoutPayload: string | null;
            confirmedAt: Date | null;
        };
    }>;
    listTransactions(query: any, req: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
        success: boolean;
        data: ({
            company: {
                id: string;
                razaoSocial: string;
                nomeFantasia: string | null;
            } | null;
            clinic: {
                id: string;
                name: string;
            } | null;
            doctor: {
                id: string;
                name: string;
            } | null;
            examRequest: {
                id: string;
                examPurpose: string;
            } | null;
            servicePrice: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            clinicId: string | null;
            createdAt: Date;
            description: string;
            type: import(".prisma/client").$Enums.FinancialType;
            paymentId: string | null;
            companyId: string | null;
            examRequestId: string | null;
            category: import(".prisma/client").$Enums.FinancialCategory;
            doctorId: string | null;
            amount: number;
            method: string | null;
            notes: string | null;
            servicePriceId: string | null;
            transactionDate: Date;
            paidAt: Date | null;
        })[];
    }>;
    createTransaction(body: any): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            clinicId: string | null;
            createdAt: Date;
            description: string;
            type: import(".prisma/client").$Enums.FinancialType;
            paymentId: string | null;
            companyId: string | null;
            examRequestId: string | null;
            category: import(".prisma/client").$Enums.FinancialCategory;
            doctorId: string | null;
            amount: number;
            method: string | null;
            notes: string | null;
            servicePriceId: string | null;
            transactionDate: Date;
            paidAt: Date | null;
        };
    }>;
    markAsPaid(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            clinicId: string | null;
            createdAt: Date;
            description: string;
            type: import(".prisma/client").$Enums.FinancialType;
            paymentId: string | null;
            companyId: string | null;
            examRequestId: string | null;
            category: import(".prisma/client").$Enums.FinancialCategory;
            doctorId: string | null;
            amount: number;
            method: string | null;
            notes: string | null;
            servicePriceId: string | null;
            transactionDate: Date;
            paidAt: Date | null;
        };
    }>;
    getSummary(month: string, year: string): Promise<{
        success: boolean;
        data: {
            receita: number;
            despesas: number;
            repasseClinica: number;
            repasseMedico: number;
            totalRepasses: number;
            lucroLiquido: number;
            pendentesClinica: number;
            pendentesMedico: number;
            totalTransactions: number;
        };
    }>;
}
