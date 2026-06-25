import { messageTemplates } from "@/lib/messages";
import MessageCard from "@/components/MessageCard";

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-sans text-3xl font-extrabold text-ink">Messages types</h1>
        <p className="font-light text-ink/60">
          Les éléments entre crochets sont à personnaliser avant l&apos;envoi.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-6">
        {messageTemplates.map((t) => (
          <MessageCard key={t.id} template={t} />
        ))}
      </div>
    </div>
  );
}
