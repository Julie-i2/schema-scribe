import { DataType } from '../builder/DataType'
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
 * Oracle: データベーステーブルカラム情報クラス
 */
export class DBTableColumnOracle implements DBTableColumnBase {
  public field: string
  public type: string
  public null: string
  public default: string|null
  public precision: number|null
  public scale: number|null
  public comment: string

  /**
   * コンストラクタ
   * @param columnData テーブル情報
   */
  public constructor(columnData: any) {
    this.field = columnData.COLUMN_NAME ?? ''
    this.type = columnData.DATA_TYPE ?? ''
    this.null = columnData.NULLABLE ?? ''
    this.default = columnData.DATA_DEFAULT ?? null
    this.precision = columnData.DATA_PRECISION ?? null;
    this.scale = columnData.DATA_SCALE ?? null;
    this.comment = columnData.COMMENTS ?? ''
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
    return ''
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
    if (/(number)/i.test(this.type)) {
      const precision = this.precision ?? 0;
      const scale = this.scale ?? 0;
      if (scale > 0) {
        return DataType.double;
      } else if (precision > 10) {
        return DataType.long;
      } else {
        return DataType.int;
      }
    } else if (/(binary_float)/i.test(this.type)) {
      return DataType.float;
    } else if (/(binary_double)/i.test(this.type)) {
      return DataType.double;
    } else if (/(date|timestamp)/i.test(this.type)) {
      return DataType.dateTime;
    } else {
      return DataType.string;
    }
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
  public constraintType: string

  /**
   * コンストラクタ
   * @param indexData インデックス情報
   */
  public constructor(indexData: any) {
    this.uniqueness = indexData.UNIQUENESS ?? ''
    this.keyName = indexData.CONSTRAINT_NAME ?? ''
    this.seqInIndex = indexData.POSITION ?? 0
    this.columnName = indexData.COLUMN_NAME ?? ''
    this.constraintType = indexData.CONSTRAINT_TYPE ?? ''
  }

  public isPrimary(): boolean {
    return this.constraintType === 'P'
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
