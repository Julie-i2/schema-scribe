type ChainedWhen<T, R> = {
  on: <A>(
    pred: (v: T) => boolean,
    fn: () => A
  ) => ChainedWhen<T, R|A>
  otherwise: <A>(fn: () => A) => R|A
}

const match = <T, R>(val: any): ChainedWhen<T, R> => ({
  on: <A>(
    pred: (v: T) => boolean,
    fn: () => A
  ) => match<T, R|A>(val),
  otherwise: <A>(fn: () => A): A|R => val
})

const chain = <T, R>(val: T): ChainedWhen<T, R> => ({
  on: <A>(
    pred: (v: T) => boolean,
    fn: () => A
  ) => pred(val) ? match(fn()) : chain<T, A|R>(val),
  otherwise: <A>(fn: () => A) => fn()
})

export const when = <T>(val: T) => ({
  on: <A>(
    pred: (v: T) => boolean,
    fn: () => A
  ) => pred(val) ? match<T, A>(fn()) : chain<T, A>(val)
})

/**
 * エラーメッセージを解析して返す
 * @param err
 * @returns
 */
export function findErrorMessage(err: any) {
  let errMess = ''
  if (typeof errMess === 'string') {
    errMess = err
  } else if (err instanceof Error) {
    errMess = err.toString()
  }
  return errMess
}

/**
 * スネイクケースからロウワーキャメルケースに変換する
 * @param source スネイクケース
 * @returns キャメルケース
 */
export function lowerCamelize(source: string): string {
  return source
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+(.)/g, ($1) => $1.toUpperCase())
    .replace(/\s/g, '')
    .replace(/^[a-z]/g, (val) => val.toUpperCase())
}

/**
 * スネイクケースからアッパーキャメルケースに変換する
 * @param source スネイクケース
 * @returns キャメルケース
 */
export function upperCamelize(source: string): string {
  return lowerCamelize(source).replace(/^(.)/g, ($1) => $1.toUpperCase())
}

/**
 * オブジェクト型判定
 * @param value 値
 * @returns 成否結果
 */
export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}
