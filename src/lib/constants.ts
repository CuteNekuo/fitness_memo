export const BODY_PARTS = ['胸', '背中', '肩', '腕', '脚', '体幹', 'その他'] as const
export type BodyPart = typeof BODY_PARTS[number]
