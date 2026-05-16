import { apiClient } from './client';
import type { Duel } from '../types/api';

interface DuelResponse {
  data: Duel;
}

interface CreateDuelPayload {
  song_id?: number;
}

export const duelsApi = {
  createDuel: (payload?: CreateDuelPayload) =>
    apiClient.post<DuelResponse>('/api/duels', payload),

  getDuel: (inviteCode: string) =>
    apiClient.get<DuelResponse>(`/api/duels/${inviteCode}`),

  joinDuel: (inviteCode: string) =>
    apiClient.post<DuelResponse>(`/api/duels/${inviteCode}/join`),

  readyDuel: (inviteCode: string) =>
    apiClient.post<DuelResponse>(`/api/duels/${inviteCode}/ready`),

  finishDuel: (inviteCode: string, score: number, accuracyPercent?: number) =>
    apiClient.post<DuelResponse>(`/api/duels/${inviteCode}/finish`, {
      score,
      accuracy_percent: accuracyPercent,
    }),
};
