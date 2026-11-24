import type { Sandbox } from '@vercel/sandbox'

export type SandboxInstance = Sandbox;

export type SandboxFile = {
    path: string;
    content: string;
}