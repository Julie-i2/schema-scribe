import * as fs from 'fs';
import { ConfigData } from './ConfigData';
import { DataTypeFinder } from './dataType';
import { DBAccessor, DBTable, DBTableColumn } from './dbAccessor';


/** 正規表現パターン：クラス名 */
const PATTERN_CLASS_NAME = /\{\{class_name\}\}/g;
/** 正規表現パターン：クラス説明 */
const PATTERN_CLASS_DESCRIPTION = /\{\{class_desc\}\}/g;
/** 正規表現パターン：テーブル名 */
const PATTERN_TABLE_NAME = /\{\{table_name\}\}/g;
/** 正規表現パターン：エンジン */
const PATTERN_ENGINE = /\{\{engine\}\}/g;
/** 正規表現パターン：プライマリID */
const PATTERN_PRIMARY_ID = /\{\{primary_id\}\}/g;
/** 正規表現パターン：フィールドリスト */
const PATTERN_FIELD_LIST = /<<<fields_list(\r\n|\n)(.*)>>>fields_list(\r\n|\n)/s;
/** 正規表現パターン(フィールド)：フィールドコメント */
const PATTERN_FIELD_COMMENT = /\{\{field_comment\}\}/g;
/** 正規表現パターン(フィールド)：フィールド型 */
const PATTERN_FIELD_TYPE = /\{\{field_type\}\}/g;
/** 正規表現パターン(フィールド)：フィールド名 */
const PATTERN_FIELD_NAME = /\{\{field_name\}\}/g;
/** 正規表現パターン(フィールド)：フィールドの既定値 */
const PATTERN_FIELD_DEFAULT_VALUE = /\{\{field_default_value\}\}/g;


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
                const dbAccessor: DBAccessor = new DBAccessor(config.database);
                const template: Template = new Template(config);

                // すでにあるファイルをすべて削除する
                if (config.io.outputReset) {
                    fs.readdirSync(config.io.outputPath).forEach(fileName => {
                        fs.unlinkSync(config.io.outputPath + '\\' + fileName);
                    });
                }

                // テーブル名リストを取得
                const tableNames = (config.tableList.length > 0) ? config.tableList : await dbAccessor.getTables();

                // テーブル詳細取得＆テンプレート置き換え＆出力
                tableNames.forEach(async (table: string) => {
                    const dbTable: DBTable = await dbAccessor.getTableInfo(table);
                    const dtoWriter = template.createMaker(dbTable);
                    const tableColumns: DBTableColumn[] = await dbAccessor.getTableColumns(dbTable.name);
                    tableColumns.forEach((dbTableColumn: DBTableColumn) => {
                        dtoWriter.addField(dbTableColumn);
                    });
                    dtoWriter.replace();
                    dtoWriter.output(config.io.outputPath);
                });
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }
}

/**
 * DTOテンプレート
 */
class Template
{
    /** テンプレートコンテンツ */
    template: string = '';
    fieldTemplate: string = '';
    classNameFormat: string = '';
    ltrimTableName: string = '';
    dataTypeFinder: DataTypeFinder;

    /**
     * コンストラクタ
     * @param config 設定データ
     */
    public constructor(config: ConfigData) {
        this.template = fs.readFileSync(config.io.templatePath, 'utf8');
        this.classNameFormat = config.format.className;
        this.ltrimTableName = config.format.ltrimTableName;
        this.dataTypeFinder = new DataTypeFinder(config.format.defaultValues);

        // テンプレートからフィールドテンプレートを抜き出す
        const matches = this.template.match(PATTERN_FIELD_LIST);
        if (!matches) {
            throw new Error('fields_listキーワード書いてないんじゃない？');
        }
        this.fieldTemplate = matches[2];
    }

    /**
     * データベースDTOメーカーを生成して返す
     * @param {DBTable} dbTable テーブル名
     * @returns DTOWriter
     */
    public createMaker(dbTable: DBTable) {
        return new DTOWriter(this.template, this.fieldTemplate, this.createClassName(dbTable.name), dbTable, this.dataTypeFinder);
    }

    /**
     * テーブル名からクラス名を生成
     * @param tableName テーブル名
     */
    private createClassName(tableName: string): string {
        if (this.ltrimTableName) {
            const ltrimRegex = new RegExp('^' + this.ltrimTableName);
            tableName = tableName.replace(ltrimRegex, '');
        }
        tableName = tableName.replace(/\.|\"|\/|\\|\[|\]|\:|\;|\||\=|\,/g, ' ');
        tableName = this.camelize(tableName);
        const classNameRegex = /\${className}/;
        if (this.classNameFormat && classNameRegex.test(this.classNameFormat)) {
            tableName = this.classNameFormat.replace(classNameRegex, tableName);
        }
        return tableName;
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
            .replace(/^[a-z]/g, (val) => val.toUpperCase());
    }
}


/**
 * テンプレート置き換えクラス
 */
class DTOWriter {
    /** コンテンツ */
    private content: string = '';
    /** フィールドテンプレート */
    private fieldTemplate: string = '';
    /** クラス名 */
    private className: string = '';
    /** テーブル名 */
    private tableInfo: DBTable;
    /** プライマリフィールド名 */
    private primaryKey: string = '';
    /** 置き換えフィールド保持配列 */
    private replaceFields: Array<string> = [];
    /** デフォルト値 */
    private dataTypeFinder: DataTypeFinder;

    /**
     * コンストラクタ
     * @param content コンテンツ
     * @param fieldTemplate フィールドリストテンプレート
     * @param className テーブル名
     */
    public constructor(content: string, fieldTemplate: string, className: string, tableInfo: DBTable, dataTypeFinder: DataTypeFinder) {
        this.content = content;
        this.fieldTemplate = fieldTemplate;
        this.className = className;
        this.tableInfo = tableInfo;
        this.dataTypeFinder = dataTypeFinder;
    }

    /**
     * フィールド情報追加
     * @param array $aFieldInfo フィールド情報配列
     */
    public addField(fieldInfo: DBTableColumn) {
        if (fieldInfo.key === 'PRI') {
            this.primaryKey = fieldInfo.field;
        }
        const dataType = this.dataTypeFinder.find(fieldInfo.type);
        let tmpField = this.fieldTemplate;
        tmpField = tmpField.replace(PATTERN_FIELD_COMMENT, fieldInfo.comment);
        tmpField = tmpField.replace(PATTERN_FIELD_TYPE, dataType.label);
        tmpField = tmpField.replace(PATTERN_FIELD_NAME, fieldInfo.field);
        tmpField = tmpField.replace(PATTERN_FIELD_DEFAULT_VALUE, dataType.defaultValue);
        this.replaceFields.push(tmpField);
    }

    /**
     * 置き換え
     */
    public replace() {
        const comment = this.tableInfo.comment.replace(/(\r\n|\n)/g, '$1 * ');
        this.content = this.content.replace(PATTERN_CLASS_NAME, this.className);
        this.content = this.content.replace(PATTERN_CLASS_DESCRIPTION, comment);
        this.content = this.content.replace(PATTERN_TABLE_NAME, this.tableInfo.name);
        this.content = this.content.replace(PATTERN_ENGINE, this.tableInfo.engine);
        this.content = this.content.replace(PATTERN_PRIMARY_ID, this.primaryKey);
        this.content = this.content.replace(PATTERN_FIELD_LIST, this.replaceFields.join(''));
    }

    /**
     * DTOファイル出力
     * @param string $sEOL 改行コード指定
     */
    public output(path: string, eol: string | null = null) {
        if (eol && ["\r\n", "\r", "\n"].indexOf(eol) > -1) {
            this.content = this.content.replace('/\r\n|\r|\n/', eol);
        }
        fs.writeFileSync(path + '\\' + this.className + '.php', this.content, 'utf8');
    }
}
