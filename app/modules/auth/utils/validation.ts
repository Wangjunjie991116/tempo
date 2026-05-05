export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/\d/.test(password)) errors.push("At least 1 number");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    errors.push("Both upper and lower case letters");
  }
  return { valid: errors.length === 0, errors };
}

export function validateSignIn(email: string, password: string): string | null {
  if (!email.trim()) return "Email is required";
  if (!isValidEmail(email)) return "Invalid email format";
  if (!password) return "Password is required";
  return null;
}

export function validateSignUp(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
): string | null {
  if (!fullName.trim()) return "Full name is required";
  if (!email.trim()) return "Email is required";
  if (!isValidEmail(email)) return "Invalid email format";
  if (!password) return "Password is required";
  const pwdCheck = validatePassword(password);
  if (!pwdCheck.valid) return "Password does not meet requirements";
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
}

export function validateForgotPassword(email: string): string | null {
  if (!email.trim()) return "Email is required";
  if (!isValidEmail(email)) return "Invalid email format";
  return null;
}

export function validateChangePassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (!password) return "Password is required";
  const pwdCheck = validatePassword(password);
  if (!pwdCheck.valid) return "Password does not meet requirements";
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
}
