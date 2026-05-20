import { REGISTRATION_ENABLED } from "@/domain/auth/config";
import { LoginView } from "./login-view";

type LoginPageProps = {
  searchParams: Promise<{
    mode?: string;
    redirectTo?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <LoginView
      mode={
        REGISTRATION_ENABLED && params.mode === "registro" ? "registro" : "login"
      }
      redirectTo={params.redirectTo}
      errorCode={params.error}
    />
  );
}
