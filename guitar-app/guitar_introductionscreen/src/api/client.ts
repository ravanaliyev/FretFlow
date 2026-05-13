const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token expiry - attempt refresh
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          ...options,
          headers,
        });
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Request failed',
        code: 'UNKNOWN_ERROR',
      }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // Auth endpoints
  async register(email: string, password: string, username: string) {
    const data = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });

    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async logout() {
    try {
      await this.request('auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  async getProfile() {
    return this.request<any>('gamification/profile');
  }

  // Lessons
  async getLessons(page = 1, limit = 20) {
    return this.request<any>(`lessons?page=${page}&limit=${limit}`);
  }

  async getLesson(id: number) {
    return this.request<any>(`lessons/${id}`);
  }

  // Progress
  async submitLessonProgress(lessonId: number, accuracy: number, notesPlayed: string[]) {
    return this.request<any>('progress/lessons', {
      method: 'POST',
      body: JSON.stringify({
        lesson_id: lessonId,
        accuracy,
        notes_played: notesPlayed,
      }),
    });
  }

  // Songs
  async getSongs(page = 1, limit = 20) {
    return this.request<any>(`songs?page=${page}&limit=${limit}`);
  }

  async getSong(id: number) {
    return this.request<any>(`songs/${id}`);
  }

  async createSong(title: string, artist: string, difficulty: number, xp_reward: number, notes: string) {
    return this.request<any>('songs', {
      method: 'POST',
      body: JSON.stringify({ title, artist, difficulty, xp_reward, notes }),
    });
  }

  // Scores
  async submitScore(songId: number, score: number, accuracyPercent: number) {
    return this.request<any>('scores', {
      method: 'POST',
      body: JSON.stringify({
        song_id: songId,
        score,
        accuracy_percent: accuracyPercent,
      }),
    });
  }

  async getMyScores(page = 1, limit = 20) {
    return this.request<any>(`scores/me?page=${page}&limit=${limit}`);
  }

  async getLeaderboard(page = 1, limit = 20) {
    return this.request<any>(`scores/leaderboard?page=${page}&limit=${limit}`);
  }

  // Gamification
  async getQuests() {
    return this.request<any>('gamification/quests');
  }

  async claimQuest(questId: number) {
    return this.request<any>(`gamification/quests/${questId}/claim`, {
      method: 'POST',
    });
  }

  async getAchievements() {
    return this.request<any>('gamification/achievements');
  }

  async getMilestones() {
    return this.request<any>('gamification/milestones');
  }

  // Stats
  async getStatsSummary() {
    return this.request<any>('stats/summary');
  }

  async getPracticeStats(period = 'week') {
    return this.request<any>(`stats/practice?period=${period}`);
  }
}

export const apiClient = new ApiClient();

// Individual exports for convenience
export const register = (email: string, password: string, username: string) =>
  apiClient.register(email, password, username);
export const login = (email: string, password: string) =>
  apiClient.login(email, password);
export const logout = () => apiClient.logout();
export const getProfile = () => apiClient.getProfile();
export const getLessons = (page?: number, limit?: number) =>
  apiClient.getLessons(page, limit);
export const getLesson = (id: number) => apiClient.getLesson(id);
export const submitLessonProgress = (lessonId: number, accuracy: number, notesPlayed: string[]) =>
  apiClient.submitLessonProgress(lessonId, accuracy, notesPlayed);
export const getSongs = (page?: number, limit?: number) =>
  apiClient.getSongs(page, limit);
export const getSong = (id: number) => apiClient.getSong(id);
export const createSong = (title: string, artist: string, difficulty: number, xp_reward: number, notes: string) =>
  apiClient.createSong(title, artist, difficulty, xp_reward, notes);
export const submitScore = (songId: number, score: number, accuracyPercent: number) =>
  apiClient.submitScore(songId, score, accuracyPercent);
export const getMyScores = (page?: number, limit?: number) =>
  apiClient.getMyScores(page, limit);
export const getLeaderboard = (page?: number, limit?: number) =>
  apiClient.getLeaderboard(page, limit);
export const getQuests = () => apiClient.getQuests();
export const claimQuest = (questId: number) => apiClient.claimQuest(questId);
export const getAchievements = () => apiClient.getAchievements();
export const getMilestones = () => apiClient.getMilestones();
export const getStatsSummary = () => apiClient.getStatsSummary();
export const getPracticeStats = (period?: string) => apiClient.getPracticeStats(period);