import { TopNav } from "@/components/layout/top-nav";
import { SettingsView } from "@/components/settings/settings-view";

export default function SettingsPage() {
  return (
    <>
      <TopNav title="Settings" />
      <SettingsView />
    </>
  );
}
