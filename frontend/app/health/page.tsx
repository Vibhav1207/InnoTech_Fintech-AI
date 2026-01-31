export default function HealthPage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Health</h1>
      <pre
        style={{
          background: "#f5f5f5",
          padding: "1rem",
          borderRadius: "8px",
          overflow: "auto",
        }}
      >
        {JSON.stringify(
          {
            status: "ok",
            service: "frontend",
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}
