'use strict';

import * as vscode from 'vscode';
import { window, QuickPickItem, workspace } from 'vscode';

let currentEditor: vscode.TextEditor;

export function activate(context: vscode.ExtensionContext) {

    currentEditor = vscode.window.activeTextEditor;

    vscode.window.onDidChangeActiveTextEditor(editor => currentEditor = editor);

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('console.log.wrap.simple', (editor, edit) => handle(Wrap.Down, true)),
    );
}

function handle(target: Wrap, prefix?: boolean, input?: boolean, formatAs?: FormatAs) {

    new Promise((resolve, reject) => {
        let sel = currentEditor.selection;
        let len = sel.end.character - sel.start.character;

        let ran = len == 0 ? currentEditor.document.getWordRangeAtPosition(sel.anchor) :
            new vscode.Range(sel.start, sel.end);

        if (ran == undefined) {
            reject('NO_WORD');
        }
        else {

            let doc = currentEditor.document;
            let lineNumber = ran.start.line;
            let item = doc.getText(ran);
            let idx = doc.lineAt(lineNumber).firstNonWhitespaceCharacterIndex;
            let ind = doc.lineAt(lineNumber).text.substring(0, idx);
            const funcName = getSetting('wrapText');
            let wrapData = { txt: getSetting('wrapText'), item: item, doc: doc, ran: ran, idx: idx, ind: ind, line: lineNumber, sel: sel, lastLine: doc.lineCount - 1 == lineNumber };

            wrapData.txt = funcName + "('".concat(wrapData.item, "', ", wrapData.item, ");");
            resolve(wrapData)
        };

    }).then((wrap: WrapData) => {
        currentEditor.edit((e) => {
            e.insert(new vscode.Position(wrap.line, wrap.doc.lineAt(wrap.line).range.end.character), "\n".concat(wrap.txt));
        }).then(() => {
            currentEditor.selection = wrap.sel;
        })

    }).catch(message => {
        console.log('vscode-wrap-console REJECTED_PROMISE : ' + message);
    });

}

function getSetting(setting: string) {
    return vscode.workspace.getConfiguration("wrap-console-log")[setting]
}

interface WrapData {
    txt: string,
    item: string,
    sel: vscode.Selection,
    doc: vscode.TextDocument,
    ran: vscode.Range,
    ind: string,
    idx: number,
    line: number,
    lastLine: boolean
}

enum FormatAs {
    String
}

enum Wrap {
    Inline,
    Down,
    Up
}

export function deactivate() {
    return undefined;
}
