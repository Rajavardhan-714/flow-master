import type { BusMessage } from "./schemas";

type Listener = (msg: BusMessage) => void;

class EventBus {
  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  publish(msg: BusMessage) {
    // Simulate WS network latency 50-90ms to mirror the FastAPI delay.
    const delay = 50 + Math.random() * 40;
    setTimeout(() => {
      this.listeners.forEach((l) => {
        try { l(msg); } catch (e) { console.error("[bus listener]", e); }
      });
    }, delay);
  }
}

export const bus = new EventBus();
