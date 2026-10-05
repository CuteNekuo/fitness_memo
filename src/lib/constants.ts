export const BODY_PARTS = ['胸', '背中', '肩', '二頭', '三頭', '脚', '体幹', 'その他'] as const
export type BodyPart = typeof BODY_PARTS[number]

export const REST_PRESETS = [30, 60, 90, 120, 180] as const
export const REST_ADJUST_SECONDS = 15
// バックグラウンドから戻った時、終了からこれ以上経っていたら通知せず静かに消す
export const REST_STALE_MS = 30_000
