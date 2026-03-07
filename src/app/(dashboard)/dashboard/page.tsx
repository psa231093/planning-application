import { TopNav } from "@/components/layout/top-nav";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function DashboardPage() {
  return (
    <>
      <TopNav title="Dashboard" />
      <DashboardView />
    </>
  );
}
