import { TopNav } from "@/components/layout/top-nav";
import { AgendaView } from "@/components/agenda/agenda-view";

export default function AgendaPage() {
  return (
    <>
      <TopNav title="Agenda" />
      <AgendaView />
    </>
  );
}
