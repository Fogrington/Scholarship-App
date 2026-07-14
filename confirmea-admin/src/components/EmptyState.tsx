import { LogoIcon } from "./Icons";

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <LogoIcon />
      <p>{message}</p>
    </div>
  );
}
