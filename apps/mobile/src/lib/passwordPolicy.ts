/** Backend `RegisterDto` / `ResetPasswordDto` bilan mos */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export function getPasswordPolicyError(password: string): string | null {
  if (!password || password.length < 8) {
    return "Parol kamida 8 ta belgi bo'lishi kerak";
  }
  if (!PASSWORD_REGEX.test(password)) {
    return "Parolda kamida 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo'lishi kerak";
  }
  return null;
}
