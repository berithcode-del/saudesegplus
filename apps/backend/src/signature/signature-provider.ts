export interface SignatureProviderInput {
  documentId: string;
  doctorId: string;
  certificateThumbprint?: string | null;
}

export interface SignatureProviderResult {
  providerName: string;
  signatureProviderId: string;
  certificateThumbprint?: string | null;
  signaturePolicy?: string | null;
  signatureTimestamp?: Date | null;
}

export interface SignatureProvider {
  readonly name: string;
  sign(input: SignatureProviderInput): Promise<SignatureProviderResult>;
}

export class MockSignatureProvider implements SignatureProvider {
  readonly name = 'MOCK';

  async sign(input: SignatureProviderInput): Promise<SignatureProviderResult> {
    const timestamp = new Date();
    return {
      providerName: this.name,
      signatureProviderId: `MOCK:${input.certificateThumbprint ?? input.documentId}:${timestamp.getTime()}`,
      certificateThumbprint: input.certificateThumbprint ?? null,
      signaturePolicy: 'MOCK',
      signatureTimestamp: timestamp,
    };
  }
}

export class A3SignatureProvider implements SignatureProvider {
  constructor(readonly name: string) {}

  async sign(): Promise<SignatureProviderResult> {
    throw new Error(
      `Provider ${this.name} ainda precisa ser conectado ao fornecedor A3 contratado.`,
    );
  }
}

export function createSignatureProvider(providerName = 'MOCK'): SignatureProvider {
  if (providerName === 'MOCK') return new MockSignatureProvider();
  if (['A3_GOVBR', 'A3_BRY', 'A3_PKCS11'].includes(providerName)) {
    return new A3SignatureProvider(providerName);
  }
  return new MockSignatureProvider();
}
