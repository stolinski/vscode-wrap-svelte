"use strict";

import * as vscode from "vscode";

let currentEditor: vscode.TextEditor;

export function activate(context: vscode.ExtensionContext) {
  currentEditor = vscode.window.activeTextEditor;

  vscode.window.onDidChangeActiveTextEditor((editor) => (currentEditor = editor));

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("svelte.wrap.inspect", (editor, edit) =>
      handle(Wrap.Down, true, "inspect")
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("svelte.wrap.effect", (editor, edit) =>
      handle(Wrap.Down, true, "effect")
    )
  );
}

function handle(target: Wrap, prefix?: boolean, type?: string) {
  new Promise((resolve, reject) => {
    let sel = currentEditor.selection;
    let doc = currentEditor.document;
    let lineNumber = sel.active.line;
    let selectedText = doc.getText(sel);

    let len = sel.end.character - sel.start.character;
    let entireLine = doc.lineAt(lineNumber).text;

    let ran =
      len == 0
        ? currentEditor.document.getWordRangeAtPosition(sel.anchor)
        : new vscode.Range(sel.start, sel.end);

    if (ran == undefined) {
      reject("NO_WORD");
    } else {
      let doc = currentEditor.document;
      let lineNumber = ran.start.line;
      let item = doc.getText(ran);

      let idx = doc.lineAt(lineNumber).firstNonWhitespaceCharacterIndex;
      let ind = doc.lineAt(lineNumber).text.substring(0, idx);
      const funcName = getSetting("functionName");
      let wrapData: any = {
        txt: getSetting("functionName"),
        item: item,
        doc: doc,
        ran: ran,
        idx: idx,
        ind: ind,
        line: lineNumber,
        sel: sel,
        lastLine: doc.lineCount - 1 == lineNumber,
      };

      if (type === "nameValue") {
        if (wrapData.item.includes(",")) {
          const items = wrapData.item
            .split(",")
            .map((item) => item?.split(":")?.[0]?.split("?")?.[0].trim())
            .filter((i) => i);
          wrapData.txt = "";
          for (const item of items) {
            wrapData.txt += funcName + "('".concat(item, "', ", item, ")") + "\n" + ind;
          }
        }
      } else if (type === "effect") {
        let inner = selectedText.length > 0 ? selectedText : entireLine;

        wrapData.txt = `$effect(() => {
		${inner}
	})`;
        wrapData.replace = true; // Flag to replace the selection instead of inserting below
      } else if (type === "inspect") {
        wrapData.txt = `$inspect(${wrapData.item});`;
      }
      // } else if (type === 'json') {
      //   wrapData.txt = funcName + "('".concat(wrapData.item, "', JSON.stringify(", wrapData.item, ", null, 2))", semicolon);
      // } else if (type === 'block') {
      //   wrapData.txt = "console.log('".concat("\\n\\n%c--------- ", wrapData.item, " ---------', 'background:yellow; color:blue; font-weight:600;')", semicolon);
      // }
      // else if (type === 'labelValue') {
      //   wrapData.txt = "console.info('".concat("%c ", wrapData.item, "', 'color:green; font-weight:600;', ", wrapData.item, ")", semicolon);
      // }
      //       else if (type === 'expect') {
      //         wrapData.txt = "expect(".concat(wrapData.item, ").toBeDefined();");
      //       } else if (type === 'map') {
      //         wrapData.txt = `${wrapData.item}.map((item) => {
      //   return {
      //     ...item,
      //   };
      // })`
      //       } else if (type === 'for') {
      //         wrapData.txt = `for (let index = 0; index < ${wrapData.item}.length; index++) {
      //           const item = ${wrapData.item}[index];

      //         }`
      //       } else if (type === 'forEach') {
      //         wrapData.txt = `${wrapData.item}.forEach(item => {

      //         });`
      //       } else {
      //         wrapData.txt = funcName + "('".concat(wrapData.item, "')", semicolon);
      //       }
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
        nxtLineInd = "";
      }
      currentEditor
        .edit((e) => {
          if (wrap.replace) {
            // Replace the selection with the wrapped content
            e.replace(wrap.sel, wrap.txt);
          } else {
            // Insert below as before
            e.insert(
              new vscode.Position(wrap.line, wrap.doc.lineAt(wrap.line).range.end.character),
              "\n" + wrap.ind + wrap.txt
            );
          }
        })
        .then(() => {
          if (!wrap.replace) {
            currentEditor.selection = wrap.sel;
          }
        });
    })
    .catch((message) => {});
}

function getSetting(setting: string) {
  return vscode.workspace.getConfiguration("wrap-svelte")[setting];
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
