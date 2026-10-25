// Tiny event bus between the battle simulation and the DOM interface.
type Handler = (...args: any[]) => void;
const handlers: Record<string, Handler[]> = {};
export const on = (name: string, h: Handler) => { (handlers[name] ||= []).push(h); };
export const emit = (name: string, ...args: any[]) => { (handlers[name] || []).forEach(h => h(...args)); };
