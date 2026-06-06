// Supabase connection configuration helper
export function isMockEnabled(): boolean {
  // Access environment variables
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_PROVIDER;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    useMock === "true" ||
    !url ||
    url === "" ||
    url.includes("mock") ||
    url.includes("your-supabase-project")
  );
}
