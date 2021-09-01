import * as fs from 'fs'
import { ConfigData } from './ConfigData'
import { DataTypeFinder, DataTypeFinderForPHP, DataTypeFinderForTS } from './dataType'
import { DBAccessor, DBTable, DBTableColumn } from './dbAccessor'


/** 正規表現パターン：クラス名 */
const PATTERN_CLASS_NAME = /\{\{class_name\}\}/g
/** 正規表現パターン：クラス説明 */
const PATTERN_CLASS_DESCRIPTION = /\{\{class_desc\}\}/g
/** 正規表現パターン：テーブル名 */
const PATTERN_TABLE_NAME = /\{\{table_name\}\}/g
/** 正規表現パターン：エンジン */
const PATTERN_ENGINE = /\{\{engine\}\}/g
/** 正規表現パターン：プライマリID */
const PATTERN_PRIMARY_ID = /\{\{primary_id\}\}/g
/** 正規表現パターン：フィールドリスト */
const PATTERN_FIELD_LIST_WHOLE = /<<<fields_list(\r\n|\n).*?>>>fields_list(\r\n|\n)/gs
/** 正規表現パターン：フィールドリスト */
const PATTERN_FIELD_LIST_PARTS = /<<<fields_list(\r\n|\n)(.*?)>>>fields_list(\r\n|\n)/s
/** 正規表現パターン(フィールド)：フィールドコメント */
const PATTERN_FIELD_COMMENT = /\{\{field_comment\}\}/g
/** 正規表現パターン(フィールド)：フィールド型 */
const PATTERN_FIELD_TYPE = /\{\{field_type\}\}/g
/** 正規表現パターン(フィールド)：フィールド名 */
const PATTERN_FIELD_NAME = /\{\{field_name\}\}/g
/** 正規表現パターン(フィールド)：フィールド名(大文字) */
const PATTERN_FIELD_NAME_UPPERCASE = /\{\{field_name_uppercase\}\}/g
/** 正規表現パターン(フィールド)：Null許容 */
const PATTERN_FIELD_NULLABLE = /\{\{field_nullable\}\}/g
/** 正規表現パターン(フィールド)：フィールドの既定値 */
const PATTERN_FIELD_DEFAULT_VALUE = /\{\{field_default_value\}\}/g


/**
 * DTOメーカー
 */
export class DTOMaker {
  /**
   * 生成
   * @param config 設定データ
   */
  public static build(config: ConfigData): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbAccessor = new DBAccessor(config.database)
        const template = new Template(config)

        // すでにあるファイルをすべて削除する
        if (config.io.outputReset) {
          const fileNames = fs.readdirSync(config.io.outputPath)
          for (const fileName of fileNames) {
            fs.unlinkSync(`${config.io.outputPath}\\${fileName}`)
          }
        }

        // テーブル名リストを取得
        const tableNames = (config.tableList.length > 0) ? config.tableList : await dbAccessor.getTables()

        // テーブル詳細取得＆テンプレート置き換え
        const dtoWriters: DTOWriter[] = []
        for (const tableName of tableNames) {
          const dbTable = await dbAccessor.getTableInfo(tableName)
          const dtoWriter = template.createMaker(dbTable)
          const tableColumns = await dbAccessor.getTableColumns(dbTable.name)
          for (const dbTableColumn of tableColumns) {
            dtoWriter.addField(dbTableColumn)
          }
          dtoWriter.replace()
          dtoWriters.push(dtoWriter)
        }

        // 出力
        if (config.io.combine) {
          let content = ''
          for (const dtoWriter of dtoWriters) {
            content += dtoWriter.getContent(config.format.fileExtension)
          }
          fs.writeFileSync(`${config.io.outputPath}\\${config.io.combineFileNam}.${config.format.fileExtension}`, content, 'utf8')
        } else {
          for (const dtoWriter of dtoWriters) {
            dtoWriter.output(config.io.outputPath, config.format.fileExtension)
          }
        }
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }
}

/**
 * DTOテンプレート
 */
class Template
{
  /** テンプレートコンテンツ */
  private template: string
  private fieldTemplates: string[] = []
  private classNameFormat: string
  private ltrimTableName: string
  private dataTypeFinder: DataTypeFinder

  /**
   * コンストラクタ
   * @param config 設定データ
   */
  public constructor(config: ConfigData) {
    this.template = fs.readFileSync(config.io.templatePath, 'utf8')
    this.classNameFormat = config.format.className
    this.ltrimTableName = config.format.ltrimTableName
    if (config.format.fileExtension === 'php') {
      this.dataTypeFinder = new DataTypeFinderForPHP(config.format.defaultValues)
    } else {
      this.dataTypeFinder = new DataTypeFinderForTS(config.format.defaultValues)
    }

    // テンプレートからフィールドテンプレートを抜き出す
    let counter = 1
    this.template = this.template.replace(PATTERN_FIELD_LIST_WHOLE, (match) => {
      const fieldListContents = match.match(PATTERN_FIELD_LIST_PARTS) || []
      this.fieldTemplates.push(fieldListContents[2] || '')
      return `FIELD_LIST_NO_${counter++}`
    })
  }

  /**
   * データベースDTOメーカーを生成して返す
   * @param {DBTable} dbTable テーブル名
   * @returns {DTOWriter}
   */
  public createMaker(dbTable: DBTable): DTOWriter {
    return new DTOWriter(this.template, this.fieldTemplates, this.createClassName(dbTable.name), dbTable, this.dataTypeFinder)
  }

  /**
   * テーブル名からクラス名を生成
   * @param tableName テーブル名
   */
  private createClassName(tableName: string): string {
    if (this.ltrimTableName) {
      const ltrimRegex = new RegExp(`^${this.ltrimTableName}`)
      tableName = tableName.replace(ltrimRegex, '')
    }
    tableName = tableName.replace(/\.|\"|\/|\\|\[|\]|\:|\;|\||\=|\,/g, ' ')
    tableName = this.camelize(tableName)
    const classNameRegex = /\${className}/
    if (this.classNameFormat && classNameRegex.test(this.classNameFormat)) {
      tableName = this.classNameFormat.replace(classNameRegex, tableName)
    }
    return tableName
  }

  /**
   * スネイクケースからキャメルケースに変換する
   * @param source スネイクケース
   * @returns キャメルケース
   */
  private camelize(source: string): string {
    return source
      .replace(/_/g, ' ')
      .replace(/^(.)|\s+(.)/g, ($1) => $1.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^[a-z]/g, (val) => val.toUpperCase())
  }
}

/**
 * テンプレート置き換えクラス
 */
class DTOWriter {
  /** コンテンツ */
  private content: string
  /** フィールドテンプレート */
  private fieldTemplates: string[]
  /** クラス名 */
  private className: string
  /** テーブル名 */
  private tableInfo: DBTable
  /** プライマリフィールド名 */
  private primaryKey: string = ''
  /** 置き換えフィールド保持配列 */
  private replaceFieldMap: Map<number, string[]>
  /** デフォルト値 */
  private dataTypeFinder: DataTypeFinder

  /**
   * コンストラクタ
   * @param content コンテンツ
   * @param fieldTemplates フィールドリストテンプレート
   * @param className テーブル名
   */
  public constructor(content: string, fieldTemplates: string[], className: string, tableInfo: DBTable, dataTypeFinder: DataTypeFinder) {
    this.content = content
    this.fieldTemplates = fieldTemplates
    this.className = className
    this.tableInfo = tableInfo
    this.dataTypeFinder = dataTypeFinder
    this.replaceFieldMap = new Map<number, string[]>()
    for (let i = 0; i < fieldTemplates.length; i++) {
      this.replaceFieldMap.set(i, [])
    }
  }

  /**
   * フィールド情報追加
   * @param array $aFieldInfo フィールド情報配列
   */
  public addField(fieldInfo: DBTableColumn) {
    if (fieldInfo.key === 'PRI') {
      this.primaryKey = fieldInfo.field
    }
    const dataType = this.dataTypeFinder.find(fieldInfo)
    for (const [index, fieldTemplate] of this.fieldTemplates.entries()) {
      let tmpField = fieldTemplate
      tmpField = tmpField.replace(PATTERN_FIELD_COMMENT, fieldInfo.comment)
      tmpField = tmpField.replace(PATTERN_FIELD_TYPE, dataType.label)
      tmpField = tmpField.replace(PATTERN_FIELD_NAME, fieldInfo.field)
      tmpField = tmpField.replace(PATTERN_FIELD_NAME_UPPERCASE, fieldInfo.field.toUpperCase())
      tmpField = tmpField.replace(PATTERN_FIELD_NULLABLE, fieldInfo.null)
      tmpField = tmpField.replace(PATTERN_FIELD_DEFAULT_VALUE, dataType.defaultValue)
      const list = this.replaceFieldMap.get(index) || []
      list.push(tmpField)
    }
  }

  /**
   * 置き換え
   */
  public replace() {
    const comment = this.tableInfo.comment.replace(/(\r\n|\n)/g, '$1 * ')
    this.content = this.content.replace(PATTERN_CLASS_NAME, this.className)
    this.content = this.content.replace(PATTERN_CLASS_DESCRIPTION, comment)
    this.content = this.content.replace(PATTERN_TABLE_NAME, this.tableInfo.name)
    this.content = this.content.replace(PATTERN_ENGINE, this.tableInfo.engine)
    this.content = this.content.replace(PATTERN_PRIMARY_ID, this.primaryKey)
    for (const [index, fields] of this.replaceFieldMap) {
      const number = index + 1
      const regExp = new RegExp(`FIELD_LIST_NO_${number}`)
      this.content = this.content.replace(regExp, fields.join(''))
    }
  }

  /**
   * DTOファイル出力
   * @param string eol 改行コード指定
   */
  public output(path: string, fileExtension: string, eol: string|null = null) {
    const content = this.getContent(eol)
    fs.writeFileSync(`${path}\\${this.className}.${fileExtension}`, content, 'utf8')
  }

  /**
   * コンテンツ取得
   * @param eol 改行コード
   */
  public getContent(eol: string|null = null): string {
    if (eol && ['\r\n', '\r', '\n'].indexOf(eol) > -1) {
      this.content = this.content.replace('/\r\n|\r|\n/', eol)
    }
    return this.content
  }
}
