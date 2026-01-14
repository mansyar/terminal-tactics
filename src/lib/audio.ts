export const playSFX = (
  type:
    | 'keystroke'
    | 'error'
    | 'success'
    | 'attack'
    | 'heal'
    | 'kernel_panic'
    | 'turn_end',
) => {
  const audio = new Audio(`/sfx/${type}.mp3`)
  audio.volume = 0.5
  audio.play().catch((err) => console.debug('Audio play blocked:', err))
}

export const playKeystroke = () => playSFX('keystroke')
export const playError = () => playSFX('error')
export const playSuccess = () => playSFX('success')
export const playAttack = () => playSFX('attack')
export const playHeal = () => playSFX('heal')
export const playKernelPanic = () => playSFX('kernel_panic')
export const playTurnEnd = () => playSFX('turn_end')
