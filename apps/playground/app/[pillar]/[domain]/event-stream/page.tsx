import { EventStreamClient } from "./EventStreamClient";

export default function EventStreamPage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>📡</span> Event Stream
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Real-time scrolling log of all EventBus emissions</p>
      <EventStreamClient />
    </div>
  );
}
