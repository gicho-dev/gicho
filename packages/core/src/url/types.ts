import type { Arrayable, Nullable } from '../types'

export type SearchParamsArray = [string, Arrayable<SearchParamsValue>][]
export type SearchParamsObject = Record<string, Arrayable<SearchParamsValue>>
export type SearchParamsValue = Nullable<bigint | boolean | number | string>

export type SearchParams = string | SearchParamsArray | SearchParamsObject | URLSearchParams
