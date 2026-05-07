export function getOrSetUserId(): string {
  const KEY = 'terminal_tactics_user_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 9)
    localStorage.setItem(KEY, id)
  }
  return id
}

export const cleanErrorMessage = (message: string) => {
  return message
    .replace(/\[CONVEX M\(.*?\)\]/g, '')
    .replace(/\[Request ID: .*?\]/g, '')
    .replace(/Server Error/g, '')
    .replace(/Uncaught Error:/g, '')
    .split(' at handler')[0]
    .trim()
    .toUpperCase()
}

export const parseCoord = (coord: string) => {
  if (!coord) return null
  const xChar = coord.charAt(0).toUpperCase()
  const yNum = parseInt(coord.slice(1))
  if (isNaN(yNum) || xChar < 'A' || xChar > 'L' || yNum < 1 || yNum > 12)
    return null
  return {
    x: xChar.charCodeAt(0) - 65,
    y: 12 - yNum,
    label: coord.toUpperCase(),
  }
}
