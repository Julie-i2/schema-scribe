import { DataType } from '../builder/DataType'
import { when } from '../application/Utility'
import { DBTableBase, DBTableIndexBase, DBTableColumnBase } from './DBResultBase'

/**
 * MySQL: データベーステーブル情報クラス
 */
export class DBTableMySQL implements DBTableBase {
  public name: string
  public engine: string
  public version: number
  public rowFormat: string
  public rows: number
  public avgRowLength: number
  public dataLength: number
  public maxDataLength: number
  public indexLength: number
  public dataFree: number
  public autoIncrement: number|null
  public createTime: string
  public updateTime: string|null
  public checkTime: string|null
  public collation: string|null
  public checksum: string|null
  public createOptions: string
  public comment: string

  /**
   * コンストラクタ
   * @param tableData テーブル情報
   */
  public constructor(tableData: any = {}) {
    this.name = tableData.Name ?? ''
    this.engine = tableData.Engine ?? ''
    this.version = tableData.Version ?? 0
    this.rowFormat = tableData.Row_format ?? ''
    this.rows = tableData.Rows ?? 0
    this.avgRowLength = tableData.Avg_row_length ?? 0
    this.dataLength = tableData.Data_length ?? 0
    this.maxDataLength = tableData.Max_data_length ?? 0
    this.indexLength = tableData.Index_length ?? 0
    this.dataFree = tableData.Data_free ?? 0
    this.autoIncrement = tableData.Auto_increment ?? null
    this.createTime = tableData.Create_time ?? ''
    this.updateTime = tableData.Update_time ?? null
    this.checkTime = tableData.Check_time ?? null
    this.collation = tableData.Collation ?? null
    this.checksum = tableData.Checksum ?? null
    this.createOptions = tableData.Create_options ?? ''
    this.comment = tableData.Comment ?? ''
  }

  public getName(): string {
    return this.name
  }

  public getEngine(): string {
    return this.engine
  }

  public getComment(): string {
    return this.comment
  }
}

/**
 * MySQL: データベーステーブルカラム情報クラス
 */
export class DBTableColumnMySQL implements DBTableColumnBase {
  public field: string
  public type: string
  public collation: string|null
  public null: string
  public key: string
  public default: string|null
  public extra: string
  public privileges: string
  public comment: string

  /**
   * コンストラクタ
   * @param columnData テーブル情報
   */
  public constructor(columnData: any) {
    this.field = columnData.Field ?? ''
    this.type = columnData.Type ?? ''
    this.collation = columnData.Collation ?? null
    this.null = columnData.Null ?? ''
    this.key = columnData.Key ?? ''
    this.default = columnData.Default ?? null
    this.extra = columnData.Extra ?? ''
    this.privileges = columnData.Privileges ?? ''
    this.comment = columnData.Comment ?? ''
  }

  public isNull(): boolean {
    return this.null === 'YES'
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
    return this.extra
  }

  public getComment(): string {
    return this.comment
  }

  public findDataType(): DataType {
    return when(this.type)
      .on((v) => /(int|bit)/i.test(v), () => DataType.int)
      .on((v) => /(float)/i.test(v), () => DataType.float)
      .on((v) => /(decimal|double)/i.test(v), () => DataType.double)
      .on((v) => /(datetime)/i.test(v), () => DataType.dateTime)
      .on((v) => /(date)/i.test(v), () => DataType.date)
      .on((v) => /(time)/i.test(v), () => DataType.time)
      .otherwise(() => DataType.string)
  }
}

/**
 * MySQL: データベースインデックス情報クラス
 */
export class DBTableIndexMySQL implements DBTableIndexBase {
  public table: string
  public nonUnique: number
  public keyName: string
  public seqInIndex: number
  public columnName: string
  public collation: string|null
  public cardinality: number|null
  public subPart: number|null
  public packed: string|null
  public nullable: string
  public indexType: string
  public comment: string|null

  /**
   * コンストラクタ
   * @param indexData インデックス情報
   */
  public constructor(indexData: any) {
    this.table = indexData.Table ?? ''
    this.nonUnique = indexData.Non_unique ?? 0
    this.keyName = indexData.Key_name ?? ''
    this.seqInIndex = indexData.Seq_in_index ?? 0
    this.columnName = indexData.Column_name ?? ''
    this.collation = indexData.Collation ?? null
    this.cardinality = indexData.Cardinality ?? null
    this.subPart = indexData.Sub_part ?? null
    this.packed = indexData.Packed ?? null
    this.nullable = indexData.Null ?? ''
    this.indexType = indexData.Index_type ?? ''
    this.comment = indexData.Comment ?? null
  }

  public isPrimary(): boolean {
    return this.keyName === 'PRIMARY'
  }

  public isUnique(): boolean {
    return !Boolean(this.nonUnique);
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
    return this.nullable
  }
}
