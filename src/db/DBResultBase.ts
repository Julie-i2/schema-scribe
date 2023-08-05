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
 * データベースインデックス情報インターフェース
 */
export interface DBTableIndexBase {
  isUnique(): boolean
  getKeyName(): string
  getSeqInIndex(): number
  getColumnName(): string
  getNullable(): string
}

/**
 * データベーステーブルカラム情報インターフェース
 */
export interface DBTableColumnBase {
  isPrimary(): boolean
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
