export interface LoginResponseDTO {
  success: boolean;
  token?: string;
  user?: {
    usrCodigo: string;
    usrNome: string;
    usrEmail: string;
    usrAtivo: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}