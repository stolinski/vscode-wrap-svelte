'use strict';

import * as _ from 'lodash';
import * as vscode from 'vscode';

let currentEditor: vscode.TextEditor;

export function activate(context: vscode.ExtensionContext) {
  currentEditor = vscode.window.activeTextEditor;

  vscode.window.onDidChangeActiveTextEditor((editor) => (currentEditor = editor));

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.nameValue',
      (editor, edit) => handle(Wrap.Down, true, 'nameValue')
    )
  );


  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.name',
      (editor, edit) => handle(Wrap.Down, true, 'name')
    )
  );


  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.arguments',
      (editor, edit) => handle(Wrap.Down, true, 'arguments')
    )
  );


  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.get',
      (editor, edit) => handle(Wrap.Down, true, 'get')
    )
  );


  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.return',
      (editor, edit) => handle(Wrap.Down, true, 'return')
    )
  );


  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.json',
      (editor, edit) => handle(Wrap.Down, true, 'json')
    )
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.block',
      (editor, edit) => handle(Wrap.Down, true, 'block')
    )
  );
  // context.subscriptions.push(
  //   vscode.commands.registerTextEditorCommand('console.log.wrap.labelValue',
  //     (editor, edit) => handle(Wrap.Down, true, 'labelValue')
  //   )
  // );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.map',
      (editor, edit) => handle(Wrap.Down, true, 'map')
    )
  );


  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.for',
      (editor, edit) => handle(Wrap.Down, true, 'for')
    )
  );


  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.forEach',
      (editor, edit) => handle(Wrap.Down, true, 'forEach')
    )
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('console.log.wrap.expect',
      (editor, edit) => handle(Wrap.Down, true, 'expect')
    )
  );

}

function handle(target: Wrap, prefix?: boolean, type?: string) {
  new Promise((resolve, reject) => {
    let sel = currentEditor.selection;
    let len = sel.end.character - sel.start.character;

    let ran =
      len == 0
        ? currentEditor.document.getWordRangeAtPosition(sel.anchor)
        : new vscode.Range(sel.start, sel.end);

    if (ran == undefined) {
      reject('NO_WORD');
    } else {
      let doc = currentEditor.document;
      let lineNumber = ran.start.line;
      let item = doc.getText(ran);

      let idx = doc.lineAt(lineNumber).firstNonWhitespaceCharacterIndex;
      let ind = doc.lineAt(lineNumber).text.substring(0, idx);
      const funcName = getSetting('functionName');
      let wrapData: any = {
        txt: getSetting('functionName'),
        item: item,
        doc: doc,
        ran: ran,
        idx: idx,
        ind: ind,
        line: lineNumber,
        sel: sel,
        lastLine: doc.lineCount - 1 == lineNumber,
      };
      const semicolon = ';';
      if (type === 'nameValue') {
        if (wrapData.item.includes(',')) {
          const items = wrapData.item.split(',').map((item) => item?.split(':')?.[0]?.split('?')?.[0].trim()).filter(i => i)
          wrapData.txt = '';
          for (const item of items) {
            wrapData.txt += (funcName + "('".concat(item, "', ", item, ')', semicolon) + "\n" + ind);
          }
        } else {
          wrapData.txt = funcName + "('".concat(wrapData.item, "', ", wrapData.item, ')', semicolon);
        }
      } else if (type === 'arguments') {
        wrapData.txt = funcName + "('".concat(wrapData.item, "', ", 'arguments', ')', semicolon);
      } else if (type === 'get') {
        wrapData.txt = "const aaa = get(".concat(wrapData.item, ", '", 'aaa', "', '')", semicolon);
      } else if (type === 'return') {
        wrapData.txt = "return ".concat(wrapData.item, semicolon);
      } else if (type === 'json') {
        wrapData.txt = funcName + "('".concat(wrapData.item, "', JSON.stringify(", wrapData.item, ", null, 2))", semicolon);
      } else if (type === 'block') {
        wrapData.txt = "console.log('".concat("\\n\\n%c--------- ", wrapData.item, " ---------', 'background:yellow; color:blue; font-weight:600;')", semicolon);
      }
      // else if (type === 'labelValue') {
      //   wrapData.txt = "console.info('".concat("%c ", wrapData.item, "', 'color:green; font-weight:600;', ", wrapData.item, ")", semicolon);
      // }
      else if (type === 'expect') {
        wrapData.txt = "expect(".concat(wrapData.item, ").toBeDefined();");
      } else if (type === 'map') {
        wrapData.txt = `${wrapData.item}.map((item) => {
  return {
    ...item,
  };
})`
      } else if (type === 'for') {
        wrapData.txt = `for (let index = 0; index < ${wrapData.item}.length; index++) {
          const item = ${wrapData.item}[index];
          
        }`
      } else if (type === 'forEach') {
        wrapData.txt = `${wrapData.item}.forEach(item => {
          
        });`
      } else {
        wrapData.txt = funcName + "('".concat(wrapData.item, "')", semicolon);
      }
      resolve(wrapData);
    }
  })
    .then((wrap: WrapData) => {
      let nxtLine: vscode.TextLine;
      let nxtLineInd: string;

      if (!wrap.lastLine) {
        nxtLine = wrap.doc.lineAt(wrap.line + 1);
        nxtLineInd = nxtLine.text.substring(0, nxtLine.firstNonWhitespaceCharacterIndex);
      } else {
        nxtLineInd = '';
      }
      currentEditor
        .edit((e) => {
          e.insert(
            new vscode.Position(
              wrap.line,
              wrap.doc.lineAt(wrap.line).range.end.character
            ),
            '\n'.concat(nxtLineInd > wrap.ind ? nxtLineInd : wrap.ind, wrap.txt)
          );
        })
        .then(() => {
          currentEditor.selection = wrap.sel;
        });
    })
    .catch((message) => {
    });
}

function getSetting(setting: string) {
  return vscode.workspace.getConfiguration('wrap-console-log-simple')[setting];
}


interface WrapData {
  txt: string;
  item: string;
  sel: vscode.Selection;
  doc: vscode.TextDocument;
  ran: vscode.Range;
  ind: string;
  idx: number;
  line: number;
  lastLine: boolean;
}

enum Wrap {
  Inline,
  Down,
  Up,
}

export function deactivate() {
  return undefined;
}
