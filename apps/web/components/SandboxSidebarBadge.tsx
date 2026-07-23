export default function SandboxSidebarBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      aria-label="Perfil no ambiente sandbox"
      title="Este perfil utiliza apenas dados de teste"
      style={{
        alignSelf: "center",
        margin: "2px 8px 10px",
        padding: "4px 7px",
        border: "1px solid rgba(216, 180, 254, 0.72)",
        borderRadius: 999,
        color: "#f3e8ff",
        background: "rgba(124, 58, 237, 0.34)",
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.08em",
        lineHeight: 1,
        textAlign: "center",
      }}
    >
      SANDBOX
    </div>
  );
}
