export const ISO_DATE = 'YYYY-MM-DD'
export const ISO_DATE_HH = ISO_DATE + '_HH:mm'
export const ISO_DATE_HH_SS = ISO_DATE_HH + ':ss'

export type MObject<T = any> = {
  [key: string]: T
} & { [Symbol.iterator]?: never }

export const idFunction = (e: any) => e
