import { writeFile, readFileSync, writeFileSync } from 'fs';
import { DBTable, DBTableColumn } from './dbAccessor';

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
 * DTOテンプレート
 */
export class Template
{
    /** テンプレートコンテンツ */
    template: string = '';
    fieldTemplate: string = '';
    classNameFormat: string = '';
    ltrimTableName: string = '';

    /**
     * コンストラクタ
     * @param fileName ファイル名
     */
    public constructor(fileName: string, classNameFormat: string | null, ltrimTableName: string | null)
    {
        this.template = readFileSync(fileName, 'utf8');
        this.classNameFormat = classNameFormat || '';
        this.ltrimTableName = ltrimTableName || '';

        // テンプレートからフィールドテンプレートを抜き出す
        const matches = this.template.match(PATTERN_FIELD_LIST);
        if (!matches) {
            throw new Error('fields_listキーワード書いてないんじゃない？');
        }
        this.fieldTemplate = matches[2];
    }

    /**
     * データベースDTOメーカーを生成して返す
     * @param string $sTableName テーブル名
     * @returns DTOWriter
     */
    public createMaker(tableName: string)
    {
        if (this.ltrimTableName) {
            const ltrimRegex = new RegExp('/^' + this.ltrimTableName + '/');
            tableName = tableName.replace(ltrimRegex, '');
        }
        tableName = Text.camelize(tableName);
        const classNameRegex = /\${className}/;
        if (this.classNameFormat && classNameRegex.test(this.classNameFormat)) {
            tableName = this.classNameFormat.replace(classNameRegex, tableName);
        }
        return new DTOWriter(this.template, this.fieldTemplate, tableName);
    }
}


/**
 * テンプレート置き換えクラス
 */
export class DTOWriter {
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

    /**
     * コンストラクタ
     * @param content コンテンツ
     * @param fieldTemplate フィールドリストテンプレート
     * @param className テーブル名
     */
    public constructor(content: string, fieldTemplate: string, className: string)
    {
        this.content = content;
        this.fieldTemplate = fieldTemplate;
        this.className = className;
        this.tableInfo = new DBTable();
    }

    /**
     * クラス名を取得する
     */
    public getClassName() : string
    {
        return this.className;
    }

    /**
     * テーブル情報設定
     * @param array $aTableInfo テーブル情報配列
     */
    public setTableInfo(tableInfo: DBTable)
    {
        this.tableInfo = tableInfo;
    }

    /**
     * フィールド情報追加
     * @param array $aFieldInfo フィールド情報配列
     */
    public addField(fieldInfo: DBTableColumn)
    {
        if (fieldInfo.key === 'PRI') {
            this.primaryKey = fieldInfo.field;
        }
        const type = Text.findType(fieldInfo.type);
        const defaultValue = Text.findDefaultValue(fieldInfo.type);
        let tmpField = this.fieldTemplate;
        tmpField = tmpField.replace(PATTERN_FIELD_COMMENT, fieldInfo.comment);
        tmpField = tmpField.replace(PATTERN_FIELD_TYPE, type);
        tmpField = tmpField.replace(PATTERN_FIELD_NAME, fieldInfo.field);
        tmpField = tmpField.replace(PATTERN_FIELD_DEFAULT_VALUE, defaultValue);
        this.replaceFields.push(tmpField);
    }

    /**
     * 置き換え
     */
    public replace()
    {
        const comment = this.tableInfo.comment.replace('/(\r\n|\n)/', '$1 * ');
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
    public output(path: string, eol: string | null = null)
    {
        if (eol && ["\r\n", "\r", "\n"].indexOf(eol) > -1) {
            this.content = this.content.replace('/\r\n|\r|\n/', eol);
        }
        writeFileSync(path + '\\' + this.className + '.php', this.content, 'utf8');
    }
}


/**
 * テキスト変換まとめ
 * @author k.maeda <maeken@nexmedia.jp>
 */
class Text
{
    /**
     * スネイクケースからキャメルケースに変換する
     * @param source スネイクケース
     * @returns キャメルケース
     */
    public static camelize(source: string) : string
    {
        return source
            .replace(/_/g, ' ')
            .replace(/^(.)|\s+(.)/g, ($1) => $1.toUpperCase())
            .replace(/\s/g, '')
            .replace(/^[a-z]/g, (val) => val.toUpperCase());
    }

    /**
     * DBの型からPHP型を返す
     * @param source DB型情報
     * @returns PHP型
     */
    public static findType(source: string) : string
    {
        if (/(int|bit)/i.test(source)) {
            return 'int';
        } else if (/(decimal|float|double)/i.test(source)) {
            return 'float';
        } else if (/datetime/i.test(source)) {
            return 'datetime';
        } else if (/date/i.test(source)) {
            return 'date';
        } else if (/time/i.test(source)) {
            return 'time';
        } else {
            return 'string';
        }
    }

    /**
     * DBの型からPHP型を返す
     * @param source DB型情報
     * @returns PHP型
     */
    public static findHungarian(source: string)
    {
        if (/(int|bit|decimal|float|double)/i.test(source)) {
            return 'n';
        } else if (/datetime/i.test(source)) {
            return 'dt';
        } else if (/date/i.test(source)) {
            return 'd';
        } else if (/time/i.test(source)) {
            return 't';
        } else {
            return 's';
        }
    }

    /**
     * DBの型から初期値を返す
     * @param source DB型情報
     * @returns 初期値
     */
    public static findDefaultValue(source: string) : string
    {
        if (/(int|bit|decimal|float|double)/i.test(source)) {
            return '0';
        } else if (/datetime/i.test(source)) {
            return "'0000-00-00 00:00:00'";
        } else if (/date/i.test(source)) {
            return "'0000-00-00'";
        } else if (/time/i.test(source)) {
            return "'00:00:00'";
        } else {
            return "''";
        }
    }
}
