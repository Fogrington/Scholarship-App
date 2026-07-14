export default function Pill({ status, label }: { status: string; label?: string }) {
  return <span className={`pill ${status}`}>{label ?? status}</span>;
}
