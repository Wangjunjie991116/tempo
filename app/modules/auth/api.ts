import { apiPost, type ApiEnvelope } from "../../core/api/client";

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string | null;
};

export async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const envelope = await apiPost<ApiEnvelope<AuthUser>>("/api/v1/auth/login", {
    email,
    password,
  });
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.msg || "login_failed");
  }
  return envelope.data;
}

export async function apiRegister(
  email: string,
  password: string,
  fullName?: string,
): Promise<AuthUser> {
  const envelope = await apiPost<ApiEnvelope<AuthUser>>("/api/v1/auth/register", {
    email,
    password,
    full_name: fullName,
  });
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.msg || "register_failed");
  }
  return envelope.data;
}

export async function apiForgotPassword(email: string): Promise<void> {
  const envelope = await apiPost<ApiEnvelope>("/api/v1/auth/forgot-password", {
    email,
    password: "",
  });
  if (envelope.code !== 0) {
    throw new Error(envelope.msg || "forgot_password_failed");
  }
}

export async function apiResetPassword(email: string, newPassword: string): Promise<AuthUser> {
  const envelope = await apiPost<ApiEnvelope<AuthUser>>("/api/v1/auth/reset-password", {
    email,
    new_password: newPassword,
  });
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.msg || "reset_password_failed");
  }
  return envelope.data;
}
