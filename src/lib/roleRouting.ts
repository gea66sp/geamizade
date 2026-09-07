// Função pura (sem imports de servidor) para que possa ser usada tanto em
// Server Components/Actions quanto em Client Components (ex: LoginClient).
export function getHomeRouteForRole(role: string | null | undefined): string {
  switch (role) {
    case "ADMIN":
    case "DEVELOPER":
    case "FINANCEIRO":
      return "/admin";
    case "CHEFE":
      return "/chefe";
    case "MEMBER":
      return "/membro";
    case "RESPONSAVEL":
      return "/responsavel";
    default:
      return "/";
  }
}
