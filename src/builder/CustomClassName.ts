import { upperCamelize } from '../application/Utility'

/** フォーマット種別 */
enum FormatType {
  plain = 1,
  camelize = 2,
}

/**
 * カスタムクラス名
 */
export default class CustomClassName {
  private trim?: RegExp
  private ltrim?: RegExp
  private rtrim?: RegExp
  private format: FormatType = FormatType.plain
  private prefix: string = ''
  private suffix: string = ''

  /**
   * コンストラクタ
   * @param classNameFormat クラス名フォーマット
   */
  public constructor(className: string) {
    const optionRegResult = /\((.*)\)/.exec(className)
    if (optionRegResult) {
      const optionString = optionRegResult[1] ?? ''
      const trimRegResult = optionString.match(/trim:"(.*)"/)
      if (trimRegResult) {
        this.trim = new RegExp(`${trimRegResult[1]}`)
      }
      const ltrimRegResult = optionString.match(/ltrim:"(.*)"/)
      if (ltrimRegResult) {
        this.ltrim = new RegExp(`^${ltrimRegResult[1]}`)
      }
      const rtrimRegResult = optionString.match(/rtrim:"(.*)"/)
      if (rtrimRegResult) {
        this.rtrim = new RegExp(`${rtrimRegResult[1]}$`)
      }
    }
    const formatRegResult = /^(.*)\${(plain|camelize)\(?.*\)?}(.*)$/i.exec(className)
    if (formatRegResult) {
      if (formatRegResult[2] === 'camelize') {
        this.format = FormatType.camelize
      }
      this.prefix = formatRegResult[1]
      this.suffix = formatRegResult[3]
    }
  }

  /**
   * クラス名変換
   * @param baseName 基本名
   * @returns 変換後の名前
   */
  public convert(baseName: string): string {
    if (this.trim) {
      baseName = baseName.replace(this.trim, '')
    }
    if (this.rtrim) {
      baseName = baseName.replace(this.rtrim, '')
    }
    if (this.ltrim) {
      baseName = baseName.replace(this.ltrim, '')
    }
    baseName = baseName.replace(/\.|\"|\/|\\|\[|\]|\:|\;|\||\=|\,/g, ' ')
    if (this.format === FormatType.camelize) {
      baseName = upperCamelize(baseName)
    }
    return `${this.prefix}${baseName}${this.suffix}`
  }
}
