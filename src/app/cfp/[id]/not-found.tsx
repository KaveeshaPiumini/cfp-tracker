export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "'Inter', sans-serif",
        textAlign: "center",
        padding: 24,
      }}
    >
      <span style={{ fontSize: 56 }}>🔍</span>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>CFP Not Found</h1>
      <p style={{ color: "var(--text-secondary)", maxWidth: 360 }}>
        This CFP may have been removed or the link is incorrect.
      </p>
      <a
        href="/"
        style={{
          padding: "10px 24px",
          background: "var(--accent)",
          color: "white",
          borderRadius: 10,
          fontWeight: 600,
          textDecoration: "none",
          marginTop: 8,
        }}
      >
        ← Back to All CFPs
      </a>
    </div>
  );
}
