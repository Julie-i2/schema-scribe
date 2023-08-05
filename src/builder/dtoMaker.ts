import { SettingFormat } from '../application/ConfigData'
import DataTypeFinder from './DataTypeFinder'
import DataTypeFinderBase from './DataTypeFinderBase'
import { DBTableBase, DBTableColumnBase, DBTableIndexBase } from '../db/DBResultBase'
import { camelize } from '../application/Utility'


/** 正規表現パターン：クラス名 */
const PATTERN_CLASS_NAME = /\{\{class_name\}\}/g
/** 正規表現パターン：クラス説明 */
const PATTERN_CLASS_DESCRIPTION = /\{\{class_desc\}\}/g
/** 正規表現パターン：テーブル名 */
const PATTERN_TABLE_NAME = /\{\{table_name\}\}/g
/** 正規表現パターン：テーブルコメント */
const PATTERN_TABLE_COMMENT = /\{\{table_comment\}\}/g
/** 正規表現パターン：エンジン */
const PATTERN_ENGINE = /\{\{engine\}\}/g
/** 正規表現パターン：プライマリID */
const PATTERN_PRIMARY_ID = /\{\{primary_id\}\}/g
const PATTERN_PRIMARY_IDS = /\{\{primary_ids\}\}/g
const PATTERN_PRIMARY_IDS_SINGLE_QUOTE = /\{\{primary_ids_sq\}\}/g
const PATTERN_PRIMARY_IDS_DOUBLE_QUOTE = /\{\{primary_ids_dq\}\}/g
/** 正規表現パターン：フィールドリスト */
const PATTERN_FIELD_LIST_WHOLE = /<<<fields_list(\r\n|\n).*?>>>fields_list(\r\n|\n)/gs
/** 正規表現パターン：フィールドリスト */
const PATTERN_FIELD_LIST_PARTS = /<<<fields_list(\r\n|\n)(.*?)>>>fields_list(\r\n|\n)/s
/** 正規表現パターン：インデックスリスト */
const PATTERN_INDEX_LIST_WHOLE = /<<<indexes_list(\r\n|\n).*?>>>indexes_list(\r\n|\n)/gs
/** 正規表現パターン：インデックスリスト */
const PATTERN_INDEX_LIST_PARTS = /<<<indexes_list(\r\n|\n)(.*?)>>>indexes_list(\r\n|\n)/s
/** 正規表現パターン(フィールド)：フィールドコメント */
const PATTERN_FIELD_COMMENT = /\{\{field_comment\}\}/g
/** 正規表現パターン(フィールド)：フィールド型 */
const PATTERN_FIELD_TYPE = /\{\{field_type\}\}/g
/** 正規表現パターン(フィールド)：プログラム言語型 */
const PATTERN_FIELD_LANG_TYPE = /\{\{field_lang_type\}\}/g
/** 正規表現パターン(フィールド)：フィールド名 */
const PATTERN_FIELD_NAME = /\{\{field_name\}\}/g
/** 正規表現パターン(フィールド)：フィールド名(大文字) */
const PATTERN_FIELD_NAME_UPPERCASE = /\{\{field_name_uppercase\}\}/g
/** 正規表現パターン(フィールド)：Null許容 */
const PATTERN_FIELD_NULLABLE = /\{\{field_nullable\}\}/g
/** 正規表現パターン(フィールド)：フィールドの既定値 */
const PATTERN_FIELD_DEFAULT_VALUE = /\{\{field_default_value\}\}/g
/** 正規表現パターン(フィールド)：プログラム言語の既定値 */
const PATTERN_FIELD_LANG_DEFAULT_VALUE = /\{\{field_lang_default_value\}\}/g
/** 正規表現パターン(フィールド)：フィールドのキー */
const PATTERN_FIELD_KEY = /\{\{field_key\}\}/g
/** 正規表現パターン(フィールド)：フィールドのExtra */
const PATTERN_FIELD_EXTRA = /\{\{field_extra\}\}/g
/** 正規表現パターン(インデックス)：インデックス名 */
const PATTERN_INDEX_NAME = /\{\{index_name\}\}/g
/** 正規表現パターン(インデックス)：カラム */
const PATTERN_INDEX_COLUMNS = /\{\{index_columns\}\}/g
/** 正規表現パターン(インデックス)：複合キー順序 */
const PATTERN_INDEX_ORDER = /\{\{index_order\}\}/g
/** 正規表現パターン(インデックス)：NULL */
const PATTERN_INDEX_NULLABLE = /\{\{index_nullable\}\}/g
/** 正規表現パターン(インデックス)：ユニーク */
const PATTERN_INDEX_UNIQUE = /\{\{index_unique\}\}/g

/**
 * DTOメーカー
 */
export class DTOMaker
{
  /** テンプレートコンテンツ */
  private template: string
  private fieldTemplates: string[] = []
  private indexTemplates: string[] = []
  private dataTypeFinder: DataTypeFinderBase|null
  private classNameFormat: string
  private ltrimTableName: string

  /**
   * コンストラクタ
   * @param template テンプレート文
   * @param config 設定データ
   */
  public constructor(template: string, { className, ltrimTableName, fileExtension, defaultValues }: SettingFormat) {
    // テンプレートからフィールドテンプレートとインデックステンプレートを抜き出す
    let fieldCounter = 1
    template = template.replace(PATTERN_FIELD_LIST_WHOLE, (match) => {
      const fieldListContents = match.match(PATTERN_FIELD_LIST_PARTS) ?? []
      this.fieldTemplates.push(fieldListContents[2] ?? '')
      return `FIELD_LIST_NO_${fieldCounter++}`
    })
    let indexCounter = 1
    template = template.replace(PATTERN_INDEX_LIST_WHOLE, (match) => {
      const indexListContents = match.match(PATTERN_INDEX_LIST_PARTS) ?? []
      this.indexTemplates.push(indexListContents[2] ?? '')
      return `INDEX_LIST_NO_${indexCounter++}`
    })
    this.template = template
    this.classNameFormat = className
    this.ltrimTableName = ltrimTableName
    this.dataTypeFinder = DataTypeFinder.create(defaultValues, fileExtension)
  }

  /**
   * DBテーブル情報からDTO構築機を取得する
   * @param {DBTableBase} dbTable テーブル名
   * @returns {DTOBuilder}
   */
  public createBuilder(dbTable: DBTableBase): DTOBuilder {
    return new DTOBuilder(this, dbTable)
  }

  public getContent(): string {
    return this.template
  }

  public getFieldTemplates(): string[] {
    return this.fieldTemplates
  }

  public getIndexTemplates(): string[] {
    return this.indexTemplates
  }

  public getDataTypeFinder(): DataTypeFinderBase|null {
    return this.dataTypeFinder
  }

  /**
   * テーブル名からクラス名を生成
   * @param tableName テーブル名
   */
  public createClassName(tableName: string): string {
    if (this.ltrimTableName) {
      const ltrimRegex = new RegExp(`^${this.ltrimTableName}`)
      tableName = tableName.replace(ltrimRegex, '')
    }
    tableName = tableName.replace(/\.|\"|\/|\\|\[|\]|\:|\;|\||\=|\,/g, ' ')
    tableName = camelize(tableName)
    const classNameRegex = /\${className}/
    if (this.classNameFormat && classNameRegex.test(this.classNameFormat)) {
      tableName = this.classNameFormat.replace(classNameRegex, tableName)
    }
    return tableName
  }
}

/**
 * テンプレートを元に置き換えをするクラス
 */
class DTOBuilder {
  /** 共通部メーカー */
  private maker: DTOMaker
  /** クラス名 */
  private className: string
  /** テーブル情報 */
  private tableInfo: DBTableBase
  /** プライマリフィールド名 */
  private primaryKeys: string[] = []
  /** 置き換えフィールド保持配列 */
  private replaceFieldMap: Map<number, string[]> = new Map()
  /** 置き換えインデックス保持配列 */
  private replaceIndexMap: Map<number, string[]> = new Map()

  /**
   * コンストラクタ
   * @param maker 共通部メーカー
   * @param tableInfo DBテーブル情報
   */
  public constructor(maker: DTOMaker, tableInfo: DBTableBase) {
    this.maker = maker
    this.className = maker.createClassName(tableInfo.getName())
    this.tableInfo = tableInfo
  }

  /**
   * フィールド情報追加
   * @param fieldInfo フィールド情報
   */
  public addField(fieldInfo: DBTableColumnBase): void {
    if (fieldInfo.isPrimary()) {
      this.primaryKeys.push(fieldInfo.getField())
    }
    const dataTypeFinder = this.maker.getDataTypeFinder()
    const dataType = dataTypeFinder?.find(fieldInfo)
    for (const [index, fieldTemplate] of this.maker.getFieldTemplates().entries()) {
      let tmpField = fieldTemplate
      tmpField = tmpField.replace(PATTERN_FIELD_COMMENT, fieldInfo.getComment())
      tmpField = tmpField.replace(PATTERN_FIELD_TYPE, fieldInfo.getType())
      tmpField = tmpField.replace(PATTERN_FIELD_LANG_TYPE, dataType?.label ?? '')
      tmpField = tmpField.replace(PATTERN_FIELD_NAME, fieldInfo.getField())
      tmpField = tmpField.replace(PATTERN_FIELD_NAME_UPPERCASE, fieldInfo.getField().toUpperCase())
      tmpField = tmpField.replace(PATTERN_FIELD_NULLABLE, fieldInfo.getNull())
      tmpField = tmpField.replace(PATTERN_FIELD_DEFAULT_VALUE, fieldInfo.getDefault() ?? 'n/a')
      tmpField = tmpField.replace(PATTERN_FIELD_LANG_DEFAULT_VALUE, dataType?.defaultValue ?? '')
      tmpField = tmpField.replace(PATTERN_FIELD_KEY, fieldInfo.getKey())
      tmpField = tmpField.replace(PATTERN_FIELD_EXTRA, fieldInfo.getExtra())
      const list = this.replaceFieldMap.get(index) ?? []
      this.replaceFieldMap.set(index, list)
      list.push(tmpField)
    }
  }

  /**
   * インデックス情報追加
   * @param indexInfo インデックス情報
   */
  public addIndex(indexInfo: DBTableIndexBase): void {
    for (const [index, indexTemplate] of this.maker.getIndexTemplates().entries()) {
      let tmpIndex = indexTemplate
      tmpIndex = tmpIndex.replace(PATTERN_INDEX_NAME, indexInfo.getKeyName())
      tmpIndex = tmpIndex.replace(PATTERN_INDEX_COLUMNS, indexInfo.getColumnName())
      tmpIndex = tmpIndex.replace(PATTERN_INDEX_ORDER, indexInfo.getSeqInIndex().toString())
      tmpIndex = tmpIndex.replace(PATTERN_INDEX_NULLABLE, indexInfo.getNullable() ?? 'NO')
      tmpIndex = tmpIndex.replace(PATTERN_INDEX_UNIQUE, indexInfo.isUnique() ? 'YES' : 'NO')
      const list = this.replaceIndexMap.get(index) ?? []
      this.replaceIndexMap.set(index, list)
      list.push(tmpIndex)
    }
  }

  /**
   * クラス名（DTOファイル名）を取得
   * @returns
   */
  public getClassName(): string {
    return this.className
  }

  /**
   * 生成したコンテンツを取得する
   * @param eol 改行コード
   */
  public generateContent(eol: string | null = null): string {
    const comment = this.tableInfo.getComment().replace(/(\r\n|\n)/g, '$1 * ')
    let content = this.maker.getContent()
    content = content.replace(PATTERN_CLASS_NAME, this.className)
    content = content.replace(PATTERN_CLASS_DESCRIPTION, comment)
    content = content.replace(PATTERN_TABLE_NAME, this.tableInfo.getName())
    content = content.replace(PATTERN_TABLE_COMMENT, this.tableInfo.getComment())
    content = content.replace(PATTERN_ENGINE, this.tableInfo.getEngine())
    content = content.replace(PATTERN_PRIMARY_ID, this.primaryKeys[0] ?? '')
    content = content.replace(PATTERN_PRIMARY_IDS, this.primaryKeys.join(','))
    content = content.replace(PATTERN_PRIMARY_IDS_SINGLE_QUOTE, this.primaryKeys.map(key => `'${key}'`).join(','))
    content = content.replace(PATTERN_PRIMARY_IDS_DOUBLE_QUOTE, this.primaryKeys.map(key => `"${key}"`).join(','))
    for (const [index, fields] of this.replaceFieldMap) {
      const number = index + 1
      const regExp = new RegExp(`FIELD_LIST_NO_${number}`)
      content = content.replace(regExp, fields.join(''))
    }
    for (const [index, indexes] of this.replaceIndexMap) {
      const number = index + 1
      const regExp = new RegExp(`INDEX_LIST_NO_${number}`)
      content = content.replace(regExp, indexes.join(''))
    }
    if (eol && ['\r\n', '\r', '\n'].indexOf(eol) > -1) {
      content = content.replace('/\r\n|\r|\n/', eol)
    }
    return content
  }
}
