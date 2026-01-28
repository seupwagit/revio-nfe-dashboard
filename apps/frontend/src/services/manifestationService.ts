/**
 * Serviço de Manifestação de NFe
 * 
 * Responsável pela comunicação com o backend para agendamento e consulta
 * de manifestações de documentos fiscais.
 */

import { ManifestationRecord } from '@fiscal/shared/types/manifestation/manifestation-record.interface';
import { ManifestationScheduleResult } from '@fiscal/shared/types/manifestation/manifestation-schedule-result.interface';
import { ManifestationType } from '@fiscal/shared/types/manifestation/manifestation-type.interface';
import { PaginatedResponse } from '@fiscal/shared/types/paginated-response.interface';
import { httpService } from './httpService';

export interface ManifestationStatusFilters {
  manifestationType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

class ManifestationService {
  /**
   * Obtém os tipos de manifestação disponíveis para o usuário
   */
  async getAvailableTypes(): Promise<ManifestationType[]> {
    try {
      const response = await httpService.get<{ success: boolean; data: ManifestationType[] }>(
        '/api/manifestations/types',
        { errorContext: 'Carregar tipos de manifestação' }
      );
      return response.data || [];
    } catch (error) {
      console.error('[ManifestationService] Erro ao carregar tipos de manifestação:', error);
      throw error;
    }
  }

  /**
   * Agenda manifestações para as chaves de acesso selecionadas
   */
  async scheduleManifestations(manifestationType: string, chaves: string[]): Promise<ManifestationScheduleResult> {
    try {
      const response = await httpService.post<{ success: boolean; data: ManifestationScheduleResult }>(
        '/api/manifestations/schedule',
        { manifestationType, chaves },
        { 
          errorContext: 'Agendar manifestações',
          showSuccessMessage: true
        }
      );
      return response.data!;
    } catch (error) {
      console.error('[ManifestationService] Erro ao agendar manifestações:', error);
      throw error;
    }
  }

  /**
   * Consulta o status das manifestações com filtros e paginação
   */
  async getManifestationStatus(filters: ManifestationStatusFilters = {}): Promise<PaginatedResponse<ManifestationRecord>> {
    try {
      const params = new URLSearchParams();
      if (filters.manifestationType) params.append('manifestationType', filters.manifestationType);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

      const response = await httpService.get<{ success: boolean; data: PaginatedResponse<ManifestationRecord> }>(
        `/api/manifestations/status?${params.toString()}`,
        { errorContext: 'Consultar status de manifestações' }
      );
      return response.data!;
    } catch (error) {
      console.error('[ManifestationService] Erro ao consultar status de manifestações:', error);
      throw error;
    }
  }
}

export const manifestationService = new ManifestationService();
