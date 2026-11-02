// Es torna a muntar a cada navegació: cada pàgina entra amb una animació suau.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="pagina-entra">{children}</div>;
}
