import type { Draft, Resume } from './resume';
export class ApiError extends Error { status: number; constructor(message: string, status = 0) { super(message); this.status = status; this.name = 'ApiError'; } }
export function safeUrl(value: string, allowLocal = false): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && !(allowLocal && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('The service returned an unsupported URL.');
  return url.href;
}
export type Session = { user: { id: string; name: string | null; email: string }; session: { id: string } } | null;
export type GitHubProfile = { user: { login: string; name?: string; bio?: string; location?: string; blog?: string; email?: string }; pinnedRepos: { name: string; description?: string; url?: string; primaryLanguage?: string }[]; languages: Record<string, number> };
export type LinkedInProfile = { name: string; headline?: string; location?: string; about?: string; url?: string; experience: { company: string; title: string; duration?: string }[]; education: { school: string; degree?: string; field?: string }[] };
export type RemoteGeneration = { id: string; versionName: string; templateId: string; createdAt: string; downloadUrl: string };
export type GenerationResult = { success: boolean; url: string; filename: string; remainingCredits?: { individualCredits: number; subscriptionCredits: number; totalCredits: number }; aiProvider?: string };
export function createApi(baseUrl: string) {
  const base = baseUrl ? safeUrl(baseUrl, true).replace(/\/+$/, '') : '';
  async function request<T>(path: string, body?: unknown): Promise<T> {
    if (!base) throw new ApiError('The live service is not connected. You can keep editing and exporting on this device.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), path === '/api/generate' ? 120000 : 30000);
    try {
      const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'include', headers: body === undefined ? { Accept: 'application/json' } : { 'Content-Type': 'application/json', Accept: 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: controller.signal });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) throw new ApiError('The service returned an unexpected response.', response.status);
      const result = await response.json();
      if (!response.ok) {
        const friendly: Record<number, string> = { 401: 'Sign in to use the live service.', 402: 'Your account does not have enough credits for this action.', 403: 'This action is not available for your account.', 429: 'Too many requests. Please wait a minute and try again.' };
        const problem = result && typeof result === 'object' ? result as Record<string, unknown> : {};
        const detail = typeof problem.message === 'string' ? problem.message : typeof problem.error === 'string' ? problem.error : '';
        throw new ApiError(friendly[response.status] || detail || 'The request could not be completed.', response.status);
      }
      return result as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw new ApiError('The service took too long to respond. Your local draft is safe.');
      throw new ApiError('Could not reach the live service. Your local draft is safe.');
    } finally { clearTimeout(timeout); }
  }
  return {
    configured: Boolean(base),
    session: () => request<Session>('/api/auth/get-session'),
    signIn: (email: string, password: string) => request<{ user: NonNullable<Session>['user'] }>('/api/auth/sign-in/email', { email, password }),
    signUp: (name: string, email: string, password: string) => request<{ user: NonNullable<Session>['user'] }>('/api/auth/sign-up/email', { name, email, password }),
    signOut: () => request('/api/auth/sign-out', {}),
    socialSignIn: (provider: 'github' | 'google', callbackURL: string) => request<{ url?: string; redirect?: boolean }>('/api/auth/sign-in/social', { provider, callbackURL }),
    github: (username: string) => request<{ success: boolean; data: GitHubProfile }>('/api/ingest/github', { username }),
    linkedin: (url: string) => request<{ success: boolean; data: LinkedInProfile }>('/api/ingest/linkedin', { url }),
    generate: (draft: Draft) => request<GenerationResult>('/api/generate', { resumeData: draft.resume, useAI: true, templateId: draft.template, versionName: draft.title, language: draft.language }),
    generations: () => request<{ generations: RemoteGeneration[] }>('/api/generations'),
    templates: () => request<{ templates: unknown[] }>('/api/templates'),
  };
}
export function mergeGitHub(resume: Resume, profile: GitHubProfile): Resume {
  if (!profile?.user || typeof profile.user.login !== 'string') throw new Error('The service returned an invalid GitHub profile.');
  const u = profile.user;
  const projects = (profile.pinnedRepos || []).filter(p => !resume.projects.some(existing => p.url ? existing.url === p.url : existing.name === p.name)).map((p, i) => ({ id: 'github-' + Date.now() + '-' + i, name: p.name, description: p.description || '', url: p.url || '', technologies: p.primaryLanguage || '' }));
  return { ...resume, name: u.name || resume.name, github: u.login, email: u.email || resume.email, location: u.location || resume.location, website: u.blog || resume.website, summary: u.bio || resume.summary, skills: [...new Set([...resume.skills, ...Object.keys(profile.languages || {})])], projects: [...resume.projects, ...projects] };
}
export function mergeLinkedIn(resume: Resume, profile: LinkedInProfile): Resume {
  if (!profile || typeof profile.name !== 'string') throw new Error('The service returned an invalid LinkedIn profile.');
  const experience = (profile.experience || []).filter(x => !resume.experience.some(existing => existing.company === x.company && existing.title === x.title && existing.years === (x.duration || ''))).map((x, i) => ({ id: 'linkedin-exp-' + Date.now() + '-' + i, company: x.company, title: x.title, years: x.duration || '', responsibilities: [] }));
  const education = (profile.education || []).filter(x => !resume.education.some(existing => existing.school === x.school && existing.degree === [x.degree, x.field].filter(Boolean).join(', '))).map((x, i) => ({ id: 'linkedin-edu-' + Date.now() + '-' + i, school: x.school, degree: [x.degree, x.field].filter(Boolean).join(', '), year: '' }));
  return { ...resume, name: profile.name || resume.name, title: profile.headline || resume.title, location: profile.location || resume.location, summary: profile.about || resume.summary, linkedin: profile.url || resume.linkedin, experience: [...resume.experience, ...experience], education: [...resume.education, ...education] };
}
