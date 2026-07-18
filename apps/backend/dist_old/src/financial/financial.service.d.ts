import { PaymentFlow, PriceItemCategory } from '@prisma/client';
import { PrismaService } from '../prisma.service';
type QuoteItem = {
    code: string;
    name: string;
    category: PriceItemCategory;
    amount: number;
    clinicFeePercent: number;
    doctorFeePercent: number;
    platformFeePercent: number;
};
type PaymentQuote = {
    cboCode?: string;
    examPurpose?: string;
    items: QuoteItem[];
    total: number;
};
export declare class FinancialService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getConfig(): Promise<{
        id: string;
        updatedAt: Date;
        defaultClinicFeePercent: number;
        defaultDoctorFeePercent: number;
        defaultPlatformFeePercent: number;
    }>;
    updateConfig(data: {
        defaultClinicFeePercent?: number;
        defaultDoctorFeePercent?: number;
        defaultPlatformFeePercent?: number;
    }): Promise<{
        id: string;
        updatedAt: Date;
        defaultClinicFeePercent: number;
        defaultDoctorFeePercent: number;
        defaultPlatformFeePercent: number;
    }>;
    listServicePrices(): Promise<{
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
    }[]>;
    createServicePrice(data: {
        name: string;
        description?: string;
        basePrice: number;
        clinicFeePercent: number;
        doctorFeePercent: number;
        platformFeePercent: number;
    }): Promise<{
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
    }>;
    updateServicePrice(id: string, data: Partial<{
        name: string;
        description: string;
        basePrice: number;
        clinicFeePercent: number;
        doctorFeePercent: number;
        platformFeePercent: number;
        isActive: boolean;
    }>): Promise<{
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
    }>;
    deleteServicePrice(id: string): Promise<{
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
    }>;
    listExamItemPrices(): Promise<{
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
    }[]>;
    createExamItemPrice(data: {
        code: string;
        name: string;
        category: PriceItemCategory;
        amount: number;
        clinicFeePercent?: number;
        doctorFeePercent?: number;
        platformFeePercent?: number;
    }): Promise<{
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
    }>;
    updateExamItemPrice(id: string, data: Partial<{
        code: string;
        name: string;
        category: PriceItemCategory;
        amount: number;
        clinicFeePercent: number;
        doctorFeePercent: number;
        platformFeePercent: number;
        isActive: boolean;
    }>): Promise<{
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
    }>;
    quote(data: {
        cboCode?: string;
        examPurpose?: string;
        specialClearances?: string[];
    }): Promise<PaymentQuote>;
    createPayment(data: {
        flow: PaymentFlow;
        companyId?: string;
        clinicId?: string;
        method?: string;
        cboCode?: string;
        examPurpose?: string;
        specialClearances?: string[];
        checkoutPayload?: Record<string, unknown>;
        externalId?: string;
    }): Promise<{
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
    }>;
    assertPaymentAccess(paymentId: string, user: {
        role: string;
        profileId?: string | null;
    }): Promise<void>;
    confirmPayment(id: string, method?: string): Promise<{
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
    }>;
    private validatePriceItem;
    private parseQuote;
    private money;
    listTransactions(filters: {
        type?: string;
        category?: string;
        status?: string;
        clinicId?: string;
        doctorId?: string;
        companyId?: string;
        month?: number;
        year?: number;
    }): Promise<({
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
    })[]>;
    resolveClinicId(role: string, profileId?: string | null): Promise<string | null>;
    createTransaction(data: {
        type: 'RECEITA' | 'DESPESA' | 'REPASSE';
        category: 'EXAME_ASO' | 'HONORARIO_MEDICO' | 'TAXA_CLINICA' | 'CUSTO_OPERACIONAL' | 'OUTROS';
        description: string;
        amount: number;
        method?: string;
        notes?: string;
        examRequestId?: string;
        clinicId?: string;
        doctorId?: string;
        companyId?: string;
        servicePriceId?: string;
        transactionDate?: Date;
    }): Promise<{
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
    }>;
    markAsPaid(id: string): Promise<{
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
    }>;
    getSummary(month?: number, year?: number): Promise<{
        receita: number;
        despesas: number;
        repasseClinica: number;
        repasseMedico: number;
        totalRepasses: number;
        lucroLiquido: number;
        pendentesClinica: number;
        pendentesMedico: number;
        totalTransactions: number;
    }>;
    generateExamTransactions(examRequestId: string): Promise<{
        success: boolean;
        doctorAmount: number;
        existing?: undefined;
        basePrice?: undefined;
        clinicAmount?: undefined;
    } | {
        success: boolean;
        doctorAmount: number;
        existing: boolean;
        basePrice?: undefined;
        clinicAmount?: undefined;
    } | {
        success: boolean;
        basePrice: number;
        clinicAmount: number;
        doctorAmount: number;
        existing?: undefined;
    }>;
}
export {};
