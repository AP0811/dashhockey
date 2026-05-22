import type { AppUser, Role } from "@/types/domain";

export type LoginInput = {
  username: string;
  password: string;
};

export type SessionInfo = {
  user: AppUser;
  expiresAt: string;
};

export async function login(input: LoginInput): Promise<SessionInfo | null> {
  void input;
  // Placeholder: brancher ici un vrai provider d'authentification.
  return null;
}

export async function requireRole(role: Role): Promise<AppUser | null> {
  void role;
  // Placeholder: verifier la session et les permissions.
  return null;
}
