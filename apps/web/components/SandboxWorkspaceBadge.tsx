export default function SandboxWorkspaceBadge({
  visible,
}: {
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Perfil no ambiente Sandbox"
      title="Este perfil utiliza apenas dados de teste"
      style={{
        position: "sticky",
        top: 8,
        zIndex: 70,
        minHeight: 30,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "6px 11px",
          border: "1px solid #ddd6fe",
          borderRadius: 999,
          color: "#6d28d9",
          background: "rgba(255, 255, 255, 0.96)",
          boxShadow: "0 5px 18px rgba(76, 29, 149, 0.14)",
          backdropFilter: "blur(8px)",
          fontSize: 10,
          fontWeight: 850,
          letterSpacing: "0.08em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#8b5cf6",
            boxShadow: "0 0 0 3px #ede9fe",
          }}
        />
        SANDBOX · AMBIENTE DE TESTE
      </span>
    </div>
  );
}
