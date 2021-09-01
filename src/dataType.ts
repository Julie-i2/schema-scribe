import { DBTableColumn } from './dbAccessor'
import { when } from './utility'

/** データ型 */
enum DataType {
  int = 1,
  float = 2,
  dateTime = 3,
  date = 4,
  time = 5,
  string = 6,
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
      .on((v) => v === DataType.int, () => this.typeInt)
      .on((v) => v === DataType.float, () => this.typeFloat)
      .on((v) => v === DataType.dateTime, () => this.typeDateTime)
      .on((v) => v === DataType.date, () => this.typeDate)
      .on((v) => v === DataType.time, () => this.typeTime)
      .otherwise(() => this.typeString)
  }
  public getHungarian(dataType: DataType): string {
    return when(dataType)
      .on((v) => v === DataType.int, () => this.hungarianInt)
      .on((v) => v === DataType.float, () => this.hungarianFloat)
      .on((v) => v === DataType.dateTime, () => this.hungarianDatetime)
      .on((v) => v === DataType.date, () => this.hungarianDate)
      .on((v) => v === DataType.time, () => this.hungarianTime)
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
      .on((v) => /(int|bit)/i.test(v), () => DataType.int)
      .on((v) => /(decimal|float|double)/i.test(v), () => DataType.float)
      .on((v) => /(datetime)/i.test(v), () => DataType.dateTime)
      .on((v) => /(date)/i.test(v), () => DataType.date)
      .on((v) => /(time)/i.test(v), () => DataType.time)
      .otherwise(() => DataType.string)
  }
}

/**
 * PHP用データ種別パーサー
 */
export class DataTypeFinderForPHP extends DataTypeFinder {
  /** データ型名称リスト */
  private static get dataTypeList(): Map<DataType, string> {
    return new Map<DataType, string>([
      [DataType.int, 'int'],
      [DataType.float, 'float'],
      [DataType.string, 'string'],
      [DataType.dateTime, 'datetime'],
      [DataType.date, 'date'],
      [DataType.time, 'time'],
    ])
  }

  /** データ型デフォルト値リスト */
  private static get defaultValueList(): object {
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
    super(DataTypeFinderForPHP.defaultValueList)
    this.defaultValues.overwrite(defaultValues)
  }

  /**
   * データ種別ラベルを求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns データ種別ラベル
   */
  protected createDataTypeLabel(fieldInfo: DBTableColumn, dataType: DataType) : string {
    let dataTypeLabel = DataTypeFinderForPHP.dataTypeList.get(dataType) ?? ''
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
        .on((v) => v === DataType.int, () => value)
        .on((v) => v === DataType.float, () => value)
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
  private static get dataTypeList(): Map<DataType, string> {
    return new Map<DataType, string>([
      [DataType.int, 'number'],
      [DataType.float, 'number'],
      [DataType.string, 'string'],
      [DataType.dateTime, 'Date'],
      [DataType.date, 'Date'],
      [DataType.time, 'Date'],
    ])
  }

  /** データ型デフォルト値リスト */
  private static get defaultValueList(): object {
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
    super(DataTypeFinderForTS.defaultValueList)
    this.defaultValues.overwrite(defaultValues)
  }

  /**
   * データ種別ラベルを求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns データ種別ラベル
   */
  protected createDataTypeLabel(fieldInfo: DBTableColumn, dataType: DataType) : string {
    const dataTypeLabel = DataTypeFinderForTS.dataTypeList.get(dataType) ?? ''
    const nullable = fieldInfo.null === 'YES' || [DataType.dateTime, DataType.date, DataType.time].includes(dataType)
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
      .on((v) => v === DataType.int, () => value)
      .on((v) => v === DataType.float, () => value)
      .on((v) => v === DataType.dateTime, () => 'null')
      .on((v) => v === DataType.date, () => 'null')
      .on((v) => v === DataType.time, () => 'null')
      .otherwise(() => `'${value}'`)
  }
}
