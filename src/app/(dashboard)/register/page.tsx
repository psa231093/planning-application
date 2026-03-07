import { TopNav } from "@/components/layout/top-nav";
import { RegisterView } from "@/components/register/register-view";

export default function RegisterPage() {
  return (
    <div className="flex h-full flex-col">
      <TopNav title="Register" />
      <div className="flex-1 overflow-hidden">
        <RegisterView />
      </div>
    </div>
  );
}
