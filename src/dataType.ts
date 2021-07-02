import { DBTableColumn } from './dbAccessor'
import { when } from './utility'

/** データ型 */
enum DataType {
  INT = 1,
  FLOAT = 2,
  DATETIME = 3,
  DATE = 4,
  TIME = 5,
  STRING = 6,
}

/**
 * デフォルト値管理クラス
 */
class DefaultValues
{
  private typeInt: string
  private typeFloat: string
  private typeDateTime: string
  private typeDate: string
  private typeTime: string
  private typeString: string
  private hungarianInt: string
  private hungarianFloat: string
  private hungarianString: string
  private hungarianDatetime: string
  private hungarianDate: string
  private hungarianTime: string
  public constructor(config: any) {
    config = config ?? {}
    this.typeInt = config.int ?? '0'
    this.typeFloat = config.float ?? '0.0'
    this.typeDateTime = config.datetime ?? "'0000-00-00 00:00:00'"
    this.typeDate = config.date ?? "'0000-00-00'"
    this.typeTime = config.time ?? "'00:00:00'"
    this.typeString = config.string ?? "''"
    this.hungarianInt = 'n'
    this.hungarianFloat = 'n'
    this.hungarianString = 's'
    this.hungarianDatetime = 'dt'
    this.hungarianDate = 'd'
    this.hungarianTime = 't'
  }
  public overwrite(config: any): void {
    config = config || {}
    this.typeInt = config.int || this.typeInt
    this.typeFloat = config.float || this.typeFloat
    this.typeDateTime = config.datetime || this.typeDateTime
    this.typeDate = config.date || this.typeDate
    this.typeTime = config.time || this.typeTime
    this.typeString = config.string || this.typeString
  }
  public getDefaultValue(dataType: DataType): string {
    return when(dataType)
      .on((v) => v === DataType.INT, () => this.typeInt)
      .on((v) => v === DataType.FLOAT, () => this.typeFloat)
      .on((v) => v === DataType.DATETIME, () => this.typeDateTime)
      .on((v) => v === DataType.DATE, () => this.typeDate)
      .on((v) => v === DataType.TIME, () => this.typeTime)
      .otherwise(() => this.typeString)
  }
  public getHungarian(dataType: DataType): string {
    return when(dataType)
      .on((v) => v === DataType.INT, () => this.hungarianInt)
      .on((v) => v === DataType.FLOAT, () => this.hungarianFloat)
      .on((v) => v === DataType.DATETIME, () => this.hungarianDatetime)
      .on((v) => v === DataType.DATE, () => this.hungarianDate)
      .on((v) => v === DataType.TIME, () => this.hungarianTime)
      .otherwise(() => this.hungarianString)
  }
}

class DataTypeInformation
{
  public label: string
  public hungarian: string
  public defaultValue: string
  public constructor(label: string, hungarian: string, defaultValue: string) {
    this.label = label
    this.hungarian = hungarian
    this.defaultValue = defaultValue
  }
}

/**
 * データ種別パーサー
 */
export abstract class DataTypeFinder {
  protected defaultValues: DefaultValues

  /**
   * コンストラクタ
   * @param defaultValues 初期値リスト
   */
  public constructor(defaultValues: object) {
    this.defaultValues = new DefaultValues(defaultValues)
  }

  /**
   * ソースから型を割り出し結果を返す
   * @param source ソース
   */
  public find(fieldInfo: DBTableColumn): DataTypeInformation {
    const dataType = this.findType(fieldInfo.type)
    return new DataTypeInformation(
      this.createDataTypeLabel(fieldInfo, dataType),
      this.defaultValues.getHungarian(dataType),
      this.createDefaultValue(fieldInfo, dataType),
    )
  }

  /**
   * データ種別ラベルを求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns データ種別ラベル
   */
  protected abstract createDataTypeLabel(fieldInfo: DBTableColumn, dataType: DataType) : string

  /**
   * 初期値を求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns 初期値
   */
  protected abstract createDefaultValue(fieldInfo: DBTableColumn, dataType: DataType) : string

  /**
   * DBの型から型種別を返す
   * @param source DB型情報
   * @returns 型種別
   */
  private findType(source: string) : DataType {
    return when(source)
      .on((v) => /(int|bit)/i.test(v), () => DataType.INT)
      .on((v) => /(decimal|float|double)/i.test(v), () => DataType.FLOAT)
      .on((v) => /(datetime)/i.test(v), () => DataType.DATETIME)
      .on((v) => /(date)/i.test(v), () => DataType.DATE)
      .on((v) => /(time)/i.test(v), () => DataType.TIME)
      .otherwise(() => DataType.STRING)
  }
}

/**
 * PHP用データ種別パーサー
 */
export class DataTypeFinderForPHP extends DataTypeFinder {
  /** データ型名称リスト */
  private static get DATA_TYPE_LIST(): Map<DataType, string> {
    return new Map<DataType, string>([
      [DataType.INT, 'int'],
      [DataType.FLOAT, 'float'],
      [DataType.STRING, 'string'],
      [DataType.DATETIME, 'datetime'],
      [DataType.DATE, 'date'],
      [DataType.TIME, 'time'],
    ])
  }

  /** データ型デフォルト値リスト */
  private static get DEFAULT_VALUE_LIST(): object {
    return {
      int: '0',
      float: '0.0',
      string: "''",
      datetime: "'0000-00-00 00:00:00'",
      date: "'0000-00-00'",
      time: "'00:00:00'",
    }
  }

  /**
   * コンストラクタ
   * @param defaultValues 初期値リスト
   */
  public constructor(defaultValues: object) {
    super(DataTypeFinderForPHP.DEFAULT_VALUE_LIST)
    this.defaultValues.overwrite(defaultValues)
  }

  /**
   * データ種別ラベルを求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns データ種別ラベル
   */
  protected createDataTypeLabel(fieldInfo: DBTableColumn, dataType: DataType) : string {
    let dataTypeLabel = DataTypeFinderForPHP.DATA_TYPE_LIST.get(dataType) ?? ''
    if (fieldInfo.null === 'YES') {
      dataTypeLabel += '|null'
    }
    return dataTypeLabel
  }

  /**
   * 初期値を求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns 初期値
   */
  protected createDefaultValue(fieldInfo: DBTableColumn, dataType: DataType) : string {
    const value = fieldInfo.default
    if (value === null) {
      return (fieldInfo.null === 'YES') ? 'null' : this.defaultValues.getDefaultValue(dataType)
    } else {
      return when(dataType)
        .on((v) => v === DataType.INT, () => value)
        .on((v) => v === DataType.FLOAT, () => value)
        .otherwise(() => `'${value}'`)
    }
  }
}

/**
 * TypeScript用データ種別パーサー
 */
export class DataTypeFinderForTS extends DataTypeFinder
{
  /** データ型名称リスト */
  private static get DATA_TYPE_LIST(): Map<DataType, string> {
    return new Map<DataType, string>([
      [DataType.INT, 'number'],
      [DataType.FLOAT, 'number'],
      [DataType.STRING, 'string'],
      [DataType.DATETIME, 'Date'],
      [DataType.DATE, 'Date'],
      [DataType.TIME, 'Date'],
    ])
  }

  /** データ型デフォルト値リスト */
  private static get DEFAULT_VALUE_LIST(): object {
    return {
      int: '0',
      float: '0.0',
      string: '',
      datetime: 'null',
      date: 'null',
      time: 'null',
    }
  }

  /**
   * コンストラクタ
   * @param defaultValues 初期値リスト
   */
  public constructor(defaultValues: object) {
    super(DataTypeFinderForTS.DEFAULT_VALUE_LIST)
    this.defaultValues.overwrite(defaultValues)
  }

  /**
   * データ種別ラベルを求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns データ種別ラベル
   */
  protected createDataTypeLabel(fieldInfo: DBTableColumn, dataType: DataType) : string {
    const dataTypeLabel = DataTypeFinderForTS.DATA_TYPE_LIST.get(dataType) ?? ''
    const nullable = fieldInfo.null === 'YES' || [DataType.DATETIME, DataType.DATE, DataType.TIME].includes(dataType)
    return nullable ? dataTypeLabel + '|null' : dataTypeLabel
  }

  /**
   * 初期値を求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns 初期値
   */
  protected createDefaultValue(fieldInfo: DBTableColumn, dataType: DataType) : string {
    const defaultValue = (fieldInfo.null === 'YES') ? 'null' : this.defaultValues.getDefaultValue(dataType)
    const value = fieldInfo.default ?? defaultValue
    return when(dataType)
      .on((v) => v === DataType.INT, () => value)
      .on((v) => v === DataType.FLOAT, () => value)
      .on((v) => v === DataType.DATETIME, () => 'null')
      .on((v) => v === DataType.DATE, () => 'null')
      .on((v) => v === DataType.TIME, () => 'null')
      .otherwise(() => `'${value}'`)
  }
}
