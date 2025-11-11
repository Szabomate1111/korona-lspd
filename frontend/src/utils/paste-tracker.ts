import { PasteEvent } from '../types';

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export class PasteTracker {
  private events: PasteEvent[] = [];

  trackPaste(field: string, currentValue: string) {
    this.events.push({
      field,
      initialHash: simpleHash(currentValue),
      pasteAt: Date.now(),
      initialLength: currentValue.length,
    });
  }

  getEvents(): PasteEvent[] {
    return this.events;
  }

  clear() {
    this.events = [];
  }
}
