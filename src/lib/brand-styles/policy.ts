export function ownsBrandStyle(userId: string, style: { user_id: string }) {
  return Boolean(userId) && style.user_id === userId;
}
