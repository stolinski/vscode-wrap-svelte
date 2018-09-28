# source code
https://github.com/WooodHead/vscode-wrap-console-log-simple

# original project
https://github.com/midnightsyntax/vscode-wrap-console-log

# Features

This extension read the word under your cursor and insert a statement with the word:

alt + L: `console.log('variable');`
cmd + L: `console.log('variable', variable);`

In settings, replace `console.log` with your own function name,
example:
```
Wrap-console-log-simple: Function Name
debug
```

will output
`debug('variable');`
`debug('variable', variable);`
