// Вызов не чаще раза в wait мс: первый проходит сразу, остальные за окно склеиваются в один в его конце
export function throttle(fn: () => void, wait: number) {
  let last = 0
  let timer: number | undefined

  const run = () => {
    last = Date.now()
    timer = undefined
    fn()
  }

  const call = () => {
    if (timer !== undefined) return
    const left = last + wait - Date.now()
    if (left <= 0) run()
    else timer = window.setTimeout(run, left)
  }

  call.cancel = () => {
    window.clearTimeout(timer)
    timer = undefined
  }

  return call
}
