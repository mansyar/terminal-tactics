export function getOrSetUserId(): string {
  const KEY = 'terminal_tactics_user_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 9)
    localStorage.setItem(KEY, id)
  }
  return id
}
