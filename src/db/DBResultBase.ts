import { DataType } from "../builder/DataType"

/**
 * データベーステーブル情報インターフェース
 */
export interface DBTableBase {
  getName(): string
  getEngine(): string
  getComment(): string
}

/**
 * データベーステーブルカラム情報インターフェース
 */
export interface DBTableColumnBase {
  isNull(): boolean
  getField(): string
  getType(): string
  getNull(): string
  getKey(): string
  getDefault(): string|null
  getExtra(): string
  getComment(): string
  findDataType(): DataType
}

/**
 * データベースインデックス情報インターフェース
 */
export interface DBTableIndexBase {
  isPrimary(): boolean
  isUnique(): boolean
  getKeyName(): string
  getSeqInIndex(): number
  getColumnName(): string
  getNullable(): string
}
