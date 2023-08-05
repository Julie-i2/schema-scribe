import { DataType } from '../builder/DataType'
import { when } from '../application/Utility'
import { DBTableBase, DBTableIndexBase, DBTableColumnBase } from './DBResultBase'

/**
 * Oracle: データベーステーブル情報クラス
 */
export class DBTableOracle implements DBTableBase {
  public name: string
  public comment: string

  /**
   * コンストラクタ
   * @param tableData テーブル情報
   */
  public constructor(tableData: any = {}) {
    this.name = tableData.TABLE_NAME ?? ''
    this.comment = tableData.COMMENTS ?? ''
  }

  public getName(): string {
    return this.name
  }

  public getEngine(): string {
    return ''
  }

  public getComment(): string {
    return this.comment
  }
}

/**
 * Oracle: データベースインデックス情報クラス
 */
export class DBTableIndexOracle implements DBTableIndexBase {
  public uniqueness: string
  public keyName: string
  public seqInIndex: number
  public columnName: string

  /**
   * コンストラクタ
   * @param indexData インデックス情報
   */
  public constructor(indexData: any) {
    this.uniqueness = indexData.UNIQUENESS ?? ''
    this.keyName = indexData.CONSTRAINT_NAME ?? ''
    this.seqInIndex = indexData.POSITION ?? 0
    this.columnName = indexData.COLUMN_NAME ?? ''
  }

  public isUnique(): boolean {
    return this.uniqueness === 'UNIQUE'
  }

  public getKeyName(): string {
    return this.keyName
  }

  public getSeqInIndex(): number {
    return this.seqInIndex
  }

  public getColumnName(): string {
    return this.columnName
  }

  public getNullable(): string {
    return ''
  }
}

/**
 * Oracle: データベーステーブルカラム情報クラス
 */
export class DBTableColumnOracle implements DBTableColumnBase {
  public field: string
  public type: string
  public null: string
  public key: string
  public default: string|null
  public comment: string

  /**
   * コンストラクタ
   * @param columnData テーブル情報
   */
  public constructor(columnData: any) {
    this.field = columnData.COLUMN_NAME ?? ''
    this.type = columnData.DATA_TYPE ?? ''
    this.null = columnData.NULLABLE ?? ''
    this.key = columnData.CONSTRAINT_TYPE ?? ''
    this.default = columnData.DATA_DEFAULT ?? null
    this.comment = columnData.COMMENTS ?? ''
  }

  public isPrimary(): boolean {
    return this.key === 'P'
  }

  public isNull(): boolean {
    return this.null === 'Y'
  }

  public getField(): string {
    return this.field
  }

  public getType(): string {
    return this.type
  }

  public getNull(): string {
    return this.null
  }

  public getKey(): string {
    return this.key
  }

  public getDefault(): string|null {
    return this.default
  }

  public getExtra(): string {
    return ''
  }

  public getComment(): string {
    return this.comment
  }

  public findDataType(): DataType {
    return when(this.type)
      .on((v) => /(number)/i.test(v), () => DataType.int)
      .on((v) => /(binary_float)/i.test(v), () => DataType.float)
      .on((v) => /(binary_double)/i.test(v), () => DataType.double)
      .on((v) => /(date|timestamp)/i.test(v), () => DataType.dateTime)
      .otherwise(() => DataType.string)
  }
}
