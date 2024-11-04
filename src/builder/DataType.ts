import { when } from '../application/Utility'

/** データ型 */
export enum DataType {
  int = 1,
  long = 2,
  float = 3,
  double = 4,
  dateTime = 5,
  date = 6,
  time = 7,
  string = 8,
}

/**
 * デフォルト値管理クラス
 */
export class DefaultValues
{
  private typeInt: string
  private typeFloat: string
  private typeDouble: string
  private typeDateTime: string
  private typeDate: string
  private typeTime: string
  private typeString: string
  private hungarianInt: string
  private hungarianFloat: string
  private hungarianDouble: string
  private hungarianString: string
  private hungarianDatetime: string
  private hungarianDate: string
  private hungarianTime: string
  public constructor(config: any) {
    config = config ?? {}
    this.typeInt = config.int ?? '0'
    this.typeFloat = config.float ?? '0.0'
    this.typeDouble = config.double ?? '0.0'
    this.typeDateTime = config.datetime ?? "'0000-00-00 00:00:00'"
    this.typeDate = config.date ?? "'0000-00-00'"
    this.typeTime = config.time ?? "'00:00:00'"
    this.typeString = config.string ?? "''"
    this.hungarianInt = 'n'
    this.hungarianFloat = 'n'
    this.hungarianDouble = 'n'
    this.hungarianString = 's'
    this.hungarianDatetime = 'dt'
    this.hungarianDate = 'd'
    this.hungarianTime = 't'
  }
  public overwrite(config: any): void {
    config = config ?? {}
    this.typeInt = config.int ?? this.typeInt
    this.typeFloat = config.float ?? this.typeFloat
    this.typeDateTime = config.datetime ?? this.typeDateTime
    this.typeDate = config.date ?? this.typeDate
    this.typeTime = config.time ?? this.typeTime
    this.typeString = config.string ?? this.typeString
  }
  public getDefaultValue(dataType: DataType): string {
    return when(dataType)
      .on((v) => v === DataType.int, () => this.typeInt)
      .on((v) => v === DataType.float, () => this.typeFloat)
      .on((v) => v === DataType.double, () => this.typeDouble)
      .on((v) => v === DataType.dateTime, () => this.typeDateTime)
      .on((v) => v === DataType.date, () => this.typeDate)
      .on((v) => v === DataType.time, () => this.typeTime)
      .otherwise(() => this.typeString)
  }
  public getHungarian(dataType: DataType): string {
    return when(dataType)
      .on((v) => v === DataType.int, () => this.hungarianInt)
      .on((v) => v === DataType.float, () => this.hungarianFloat)
      .on((v) => v === DataType.double, () => this.hungarianDouble)
      .on((v) => v === DataType.dateTime, () => this.hungarianDatetime)
      .on((v) => v === DataType.date, () => this.hungarianDate)
      .on((v) => v === DataType.time, () => this.hungarianTime)
      .otherwise(() => this.hungarianString)
  }
}

/**
 * データ情報
 */
export class DataTypeInformation
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
