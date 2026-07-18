import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: LoginDto): Promise<{
        token: string;
        user: {
            companyAdminProfile: ({
                company: {
                    id: string;
                    cnpj: string;
                    razaoSocial: string;
                    nomeFantasia: string | null;
                    name: string | null;
                    planType: string | null;
                    address: string | null;
                    cep: string | null;
                    city: string | null;
                    state: string | null;
                    phone: string | null;
                    contactEmail: string | null;
                    lat: number | null;
                    lng: number | null;
                    status: import(".prisma/client").$Enums.CompanyStatus;
                    clinicId: string | null;
                    pcmsoDocumentUrl: string | null;
                    ppraDocumentUrl: string | null;
                    pcmsoValidUntil: Date | null;
                    ppraValidUntil: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                companyId: string;
            }) | null;
            doctorProfile: {
                id: string;
                name: string;
                city: string | null;
                state: string | null;
                phone: string | null;
                contactEmail: string | null;
                status: string;
                userId: string;
                gender: string | null;
                crmNumber: string;
                crmState: string;
                signaturePin: string | null;
                rqeNumber: string | null;
                specialties: string | null;
                verifiedAt: Date | null;
                credentialSource: string | null;
            } | null;
            operatorProfile: ({
                clinic: {
                    id: string;
                    cnpj: string;
                    name: string;
                    address: string | null;
                    city: string | null;
                    state: string | null;
                    phone: string | null;
                    contactEmail: string | null;
                    lat: number | null;
                    lng: number | null;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string | null;
                    credentialSource: string | null;
                    isActive: boolean;
                    isFranchise: boolean;
                    isMatriz: boolean;
                    parentClinicId: string | null;
                };
            } & {
                id: string;
                name: string;
                clinicId: string;
                userId: string;
            }) | null;
            patientProfile: {
                id: string;
                name: string;
                phone: string | null;
                status: string;
                createdAt: Date;
                userId: string;
                cpf: string;
                birthDate: Date | null;
                functionCboCode: string | null;
            } | null;
            clinicProfile: {
                id: string;
                cnpj: string;
                name: string;
                address: string | null;
                city: string | null;
                state: string | null;
                phone: string | null;
                contactEmail: string | null;
                lat: number | null;
                lng: number | null;
                createdAt: Date;
                updatedAt: Date;
                userId: string | null;
                credentialSource: string | null;
                isActive: boolean;
                isFranchise: boolean;
                isMatriz: boolean;
                parentClinicId: string | null;
            } | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    me(req: any): Promise<{
        companyAdminProfile: ({
            company: {
                id: string;
                cnpj: string;
                razaoSocial: string;
                nomeFantasia: string | null;
                name: string | null;
                planType: string | null;
                address: string | null;
                cep: string | null;
                city: string | null;
                state: string | null;
                phone: string | null;
                contactEmail: string | null;
                lat: number | null;
                lng: number | null;
                status: import(".prisma/client").$Enums.CompanyStatus;
                clinicId: string | null;
                pcmsoDocumentUrl: string | null;
                ppraDocumentUrl: string | null;
                pcmsoValidUntil: Date | null;
                ppraValidUntil: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            companyId: string;
        }) | null;
        doctorProfile: {
            id: string;
            name: string;
            city: string | null;
            state: string | null;
            phone: string | null;
            contactEmail: string | null;
            status: string;
            userId: string;
            gender: string | null;
            crmNumber: string;
            crmState: string;
            signaturePin: string | null;
            rqeNumber: string | null;
            specialties: string | null;
            verifiedAt: Date | null;
            credentialSource: string | null;
        } | null;
        operatorProfile: ({
            clinic: {
                id: string;
                cnpj: string;
                name: string;
                address: string | null;
                city: string | null;
                state: string | null;
                phone: string | null;
                contactEmail: string | null;
                lat: number | null;
                lng: number | null;
                createdAt: Date;
                updatedAt: Date;
                userId: string | null;
                credentialSource: string | null;
                isActive: boolean;
                isFranchise: boolean;
                isMatriz: boolean;
                parentClinicId: string | null;
            };
        } & {
            id: string;
            name: string;
            clinicId: string;
            userId: string;
        }) | null;
        patientProfile: {
            id: string;
            name: string;
            phone: string | null;
            status: string;
            createdAt: Date;
            userId: string;
            cpf: string;
            birthDate: Date | null;
            functionCboCode: string | null;
        } | null;
        clinicProfile: {
            id: string;
            cnpj: string;
            name: string;
            address: string | null;
            city: string | null;
            state: string | null;
            phone: string | null;
            contactEmail: string | null;
            lat: number | null;
            lng: number | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            credentialSource: string | null;
            isActive: boolean;
            isFranchise: boolean;
            isMatriz: boolean;
            parentClinicId: string | null;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    changePassword(req: any, body: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
