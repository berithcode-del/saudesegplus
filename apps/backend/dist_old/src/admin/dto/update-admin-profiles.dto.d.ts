import { CompanyStatus } from '@prisma/client';
export declare class UpdateAdminDoctorDto {
    name?: string;
    gender?: string;
    crmNumber?: string;
    crmState?: string;
    city?: string;
    state?: string;
    specialties?: string;
    rqeNumber?: string;
    phone?: string;
    contactEmail?: string;
    accessEmail?: string;
}
export declare class UpdateAdminCompanyDto {
    razaoSocial?: string;
    nomeFantasia?: string;
    cnpj?: string;
    address?: string;
    cep?: string;
    city?: string;
    state?: string;
    phone?: string;
    contactEmail?: string;
    accessEmail?: string;
    status?: CompanyStatus;
}
export declare class UpdateAdminClinicDto {
    name?: string;
    cnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    contactEmail?: string;
    accessEmail?: string;
}
export declare class SetMatrizClinicDto {
    setAsMatriz: boolean;
}
