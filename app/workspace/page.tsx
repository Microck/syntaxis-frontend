import Workspace from '@/components/syntaxis/workspace';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Your workspace — Syntaxis', description: 'Write, edit, and export your next chapter.' };
export default function WorkspacePage() {
  return <Workspace apiBaseUrl={process.env.NEXT_PUBLIC_SYNTAXIS_API_URL || ''} aiEnabled={process.env.NEXT_PUBLIC_SYNTAXIS_AI_ENABLED === 'true'} importsEnabled={process.env.NEXT_PUBLIC_SYNTAXIS_IMPORTS_ENABLED === 'true'} />;
}
