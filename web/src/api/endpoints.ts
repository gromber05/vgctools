import type { Team } from '@/state/types';
import { request } from './client';

export interface User {
  id: number;
  username: string;
  showdownNames: string[];
  createdAt: string;
}

export interface Session {
  accessToken: string;
  user: User;
}

interface TeamResponse extends Omit<Team, 'created'> {
  createdAt: string;
  updatedAt: string;
}

const fromApi = ({ createdAt, updatedAt: _updatedAt, ...team }: TeamResponse): Team => ({ ...team, created: Date.parse(createdAt) });
const toApi = ({ id: _id, created: _created, ...team }: Team) => team;

export const api = {
  register: (username: string, password: string, acceptTerms: boolean) =>
    request<Session>('/auth/register', { method: 'POST', body: { username, password, acceptTerms } }),
  login: (username: string, password: string) => request<Session>('/auth/login', { method: 'POST', body: { username, password } }),

  me: (token: string) => request<User>('/me', { token }),
  updateMe: (token: string, showdownNames: string[]) => request<User>('/me', { method: 'PATCH', body: { showdownNames }, token }),
  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<Session>('/me/password', { method: 'POST', body: { currentPassword, newPassword }, token }),
  exportData: (token: string) => request<unknown>('/me/export', { token }),
  deleteAccount: (token: string, password: string) => request<void>('/me', { method: 'DELETE', body: { password }, token }),

  listTeams: async (token: string) => (await request<TeamResponse[]>('/teams', { token })).map(fromApi),
  saveTeam: (token: string, team: Team) => request<TeamResponse>(`/teams/${team.id}`, { method: 'PUT', body: toApi(team), token }),
  deleteTeam: (token: string, teamId: string) => request<void>(`/teams/${teamId}`, { method: 'DELETE', token }),
};
