import { apiClient } from './client';
import type { Duel } from '../types/api';

/**
 * Interface representing the backend payload envelope for duels.
 */
interface DuelResponse {
  data: Duel;
}

/**
 * Interface representing active song targets in challenges.
 */
interface CreateDuelPayload {
  song_id?: number; // Optional reference to song targets
}

/**
 * Duels API Client Endpoints
 * Bridges real-time multiplayer challenges: creating duel lobbies, querying match states,
 * joining matches via invite codes, and submitting scores/accuracy upon completion.
 */
export const duelsApi = {
  /**
   * Spawns a new multiplayer duel match lobby.
   */
  createDuel: (payload?: CreateDuelPayload) =>
    apiClient.post<DuelResponse>('/api/duels', payload),

  /**
   * Retrieves active duel lobby states by an invite code.
   */
  getDuel: (inviteCode: string) =>
    apiClient.get<DuelResponse>(`/api/duels/${inviteCode}`),

  /**
   * Joins a multiplayer duel lobby as Player 2 using an invite code.
   */
  joinDuel: (inviteCode: string) =>
    apiClient.post<DuelResponse>(`/api/duels/${inviteCode}/join`),

  /**
   * Marks the current user as "Ready" to play inside the challenge lobby.
   */
  readyDuel: (inviteCode: string) =>
    apiClient.post<DuelResponse>(`/api/duels/${inviteCode}/ready`),

  /**
   * Submits score and accuracy records upon finishing the dueling song.
   */
  finishDuel: (inviteCode: string, score: number, accuracyPercent?: number) =>
    apiClient.post<DuelResponse>(`/api/duels/${inviteCode}/finish`, {
      score,
      accuracy_percent: accuracyPercent,
    }),
};
