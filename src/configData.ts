import * as vscode from 'vscode';
import { readFileSync } from 'fs';

/**
 * 設定データ
 */
export class ConfigData
{
    public database: SettingDataBase;
    public io: SettingIO;
    public format: SettingFormat;
    public tableList: string[];
    public constructor(config: any, workspaceRoot: string) {
        config = config || {};
        this.database = new SettingDataBase(config.database);
        this.io = new SettingIO(config.io, workspaceRoot);
        this.format = new SettingFormat(config.format);
        this.tableList = config.tableList || [];
    }

    /**
     * 設定ファイル読み込み
     */
    public static read(): ConfigData[]
    {
        if (!vscode.workspace.workspaceFolders) {
            throw Error('WorkSpace上でないと使用できません');
        }
        let configs: ConfigData[] = [];
        const outputChannel = vscode.window.createOutputChannel('DTO Maker');
        vscode.workspace.workspaceFolders.forEach((folder) => {
            try {
                const configFilePath = folder.uri.fsPath + '\\.dtomaker\\config.json';
                const configText = readFileSync(configFilePath, 'utf8');
                const configList = JSON.parse(configText)['DTOMaker.configs'] || [];
                configList.forEach((configJSON: any) => {
                    const configData = new ConfigData(configJSON, folder.uri.fsPath);
                    configs.push(configData);
                });
            } catch (err) {
                outputChannel.appendLine(err.toString());
            }
        });
        console.log(configs);
        return configs;
    }
}

/**
 * DB設定
 */
export class SettingDataBase {
    public host: string;
    public port: number;
    public user: string;
    public password: string;
    public database: string;
    constructor(config: any) {
        config = config || {};
        this.host = config.host || 'localhost';
        this.port = config.port || 3306;
        this.user = config.user || 'root';
        this.password = config.password || '';
        this.database = config.database || '';
    }
}

/**
 * 入出力設定
 */
export class SettingIO {
    public outputReset: boolean;
    public outputPath: string;
    public templatePath: string;
    constructor(config: any, workspaceRoot: string) {
        config = config || {};
        this.outputReset = !!config.outputReset;
        this.outputPath =  (config.outputPath || '${workspaceRoot}\\output').replace(/\${workspaceRoot}/g, workspaceRoot);
        this.templatePath = (config.templatePath || '').replace(/\${workspaceRoot}/g, workspaceRoot);
    }
}

/**
 * フォーマット設定
 */
export class SettingFormat {
    public className: string;
    public ltrimTableName: string;
    public defaultValues: any;
    constructor(config: any) {
        config = config || {};
        this.className = config.className || '';
        this.ltrimTableName = config.ltrimTableName || '';
        this.defaultValues = config.defaultValues;
    }
}
