/*
@Author: Aloha
@Time: 2025/5/15 11:31
@ProjectName: pdd_AntiContent
@FileName: ast.py
@Software: PyCharm
*/

const files = require('fs');
const types = require("@babel/types");
const parser = require("@babel/parser");
const template = require("@babel/template").default;
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const NodePath = require("@babel/traverse").NodePath;


class AntiContent {
    constructor(file_path) {
        this.ast = parser.parse(files.readFileSync(file_path, "utf-8"));
        this.stringPool = {};
        this.countValue = null;
        this.otr = null;
        this.obj = [];
        this.encodeData = [];
        this.transCode = null;
    }

    save_file() {
        const {code: newCode} = generator(this.ast);
        files.writeFileSync(
            "./antiContent/decode.js",
            newCode,
            "utf-8"
        );
    }

    convert_code() {
        let fn, cfn, sfn, func, strFunc, initFunc, initFuncName = 'g', strFuncObj = {}, decodeFunc, transCode, sbl, finalCallFunc;
        traverse(this.ast, {
            CallExpression: (path) => {
                let {parentPath, parent, node} = path;
                let {callee, arguments: args} = node;
                let dataList = [];
                if (!types.isIdentifier(callee)) return;
                if (args.length !== 2) return;
                if (types.isSequenceExpression(parentPath.node)) {}
                if (types.isUnaryExpression(args[0]) || types.isUnaryExpression(args[args.length - 1])) {
                    if (types.isUnaryExpression(args[0])) {
                        if (args[0].operator !== '-') return;
                        if (types.isIdentifier(args[1])) return;
                        if (!types.isLiteral(args[0].argument)) return;
                        cfn = path.scope.getBinding(callee.name).path.node;
                        dataList.push(cfn);
                        dataList.push('-' + args[0].argument.value);
                        dataList.push(args[args.length - 1].value);
                        dataList.push(path);
                        this.encodeData.push(dataList);
                        return;
                    }
                    if (types.isUnaryExpression(args[args.length - 1])) {
                        if (args[args.length - 1].operator !== '-') return;
                        if (types.isIdentifier(args[0])) return;
                        if (!types.isLiteral(args[args.length - 1].argument)) return;
                        cfn = path.scope.getBinding(callee.name).path.node;
                        dataList.push(cfn);
                        dataList.push(args[0].value);
                        dataList.push('-' + args[args.length - 1].argument.value);
                        dataList.push(path);
                        this.encodeData.push(dataList);
                        return;
                    }
                }
                if (!types.isLiteral(args[0]) || !types.isLiteral(args[args.length - 1])) return;
                cfn = path.scope.getBinding(callee.name).path.node;
                dataList.push(cfn);
                dataList.push(args[0].value);
                dataList.push(args[args.length - 1].value);
                dataList.push(path);
                this.encodeData.push(dataList)
            }
        });
        traverse(this.ast, {
            CallExpression: (path) => {
                let {parent, node} = path;
                let code, retName, retNode, f, data_list = [], poc = [], fn_node;
                if (!types.isUnaryExpression(parent)) return;
                if (parent.operator !== '!') return;
                let {callee, arguments: args} = node;
                if (!types.isFunctionExpression(callee)) return;
                // if (args.length !== 2) return;
                let {id, params, body} = callee;
                if (id !== null) return;
                if (params.length === 0) return;
                if (!types.isForStatement(body.body[body.body.length - 1])) return;
                types.isVariableDeclaration(body.body[0]) && body.body[body.body.length - 1].init === null ? (sfn = body.body[0].declarations[0].init.callee.name, retName = body.body[0].declarations[0].id.name) : (sfn = body.body[body.body.length - 1].init.declarations[0].init.callee.name, retName = body.body[body.body.length - 1].init.declarations[0].id.name);
                retNode = types.returnStatement(types.identifier(retName));
                body.body.push(retNode);
                fn = body.body[body.body.length - 3].body.body[0].argument.callee.name;
                fn_node = path.scope.getBinding(fn).path.node;
                decodeFunc = generator(path.scope.getBinding(fn).path.node).code;
                traverse(this.ast, {
                    FunctionDeclaration: (path) => {
                        let {id, params, body} = path.node;
                        if (id.name !== fn) return;
                        if (params.length === 0) return;
                        if (body.body.length < 2) return;
                        func = generator(path.node).code;
                        data_list.push(func);
                        path.stop()
                    }
                });
                f = types.functionDeclaration(types.identifier(initFuncName), params, body);
                initFunc = generator(f).code;
                traverse(this.ast, {
                    FunctionDeclaration: (path) => {
                        let {id, params, body} = path.node;
                        if (id.name !== sfn) return;
                        if (params.length !== 0) return;
                        strFunc = generator(path.node).code;
                        data_list.push(strFunc);
                        path.stop()
                    }
                });
                data_list.push(generator(path.node).code);
                strFuncObj[sfn] = data_list;
                code = args.length !== 0 ? data_list[0] + '\n' + data_list[1] + '\n' + initFunc + '\n' + initFuncName + `(${args[0].value}, ${args[args.length - 1].value})` : data_list[0] + '\n' + data_list[1] + '\n' + initFunc + '\n' + initFuncName + '()';
                poc.push(sfn);
                poc.push(eval(code));
                transCode = `function ${sfn}(){return ${JSON.stringify(poc[1])}}` + '\n' + decodeFunc + '\n';
                poc.push(transCode);
                poc.push(fn_node);
                this.stringPool[fn] = poc;
            }
        })
    }

    trans_code() {
        let dfn, middleFunc, countValue, countValue_, sbl, sbl_, decodeValue, run, transCode, finalValue, dfn_node, middleFuncPath, dfnPath;
        this.encodeData.forEach(res => {
            console.log(res[0].id.name, res[1], res[2]);
            traverse(this.ast, {
                FunctionDeclaration: (path) => {
                    let {parentPath, node} = path;
                    let {id, params, body} = node;
                    if (res[0].id.name !== id.name) return;
                    if (res[0] !== path.node) return;
                    if (params.length === 0) return;
                    if (!types.isReturnStatement(body.body[0])) return;
                    dfn = body.body[0].argument.callee.name;
                    console.log(generator(path.node).code);
                    dfn_node = path.scope.getBinding(dfn).path.node;
                    if (types.isBinaryExpression(body.body[0].argument.arguments[0])) {
                        countValue = body.body[0].argument.arguments[0].right.value;
                        sbl = body.body[0].argument.arguments[0].operator;
                        if (countValue === undefined) {
                            countValue = body.body[0].argument.arguments[0].right.argument.value;
                            sbl = sbl === '-' ? '+' : '-';
                        }
                        if (typeof res[1] === 'string' && res[1][0] !== '-') {
                            finalValue = eval(res[2] + sbl + countValue);
                            run = dfn + `(${finalValue}, ${JSON.stringify(res[1])})`
                        } else {
                            finalValue = eval(res[1] + sbl + countValue);
                            run = dfn + `(${finalValue}, ${JSON.stringify(res[2])})`;
                        }
                    } else {
                        countValue = body.body[0].argument.arguments.at(-1).right.value;
                        sbl = body.body[0].argument.arguments.at(-1).operator;
                        if (countValue === undefined) {
                            countValue = body.body[0].argument.arguments.at(-1).right.argument.value;
                            sbl = sbl === '-' ? '+' : '-';
                        }
                        typeof res[1] === 'string' && res[1][0] !== '-'
                            ? (finalValue = eval(res[2] + sbl + countValue), run = dfn + `(${finalValue}, ${JSON.stringify(res[1])})`)
                            : (finalValue = eval(res[1] + sbl + countValue), run = dfn + `(${finalValue}, ${JSON.stringify(res[2])})`);
                    }
                    middleFuncPath = path.scope.getBinding(body.body[0].argument.callee.name).path;
                    middleFunc = middleFuncPath.node;
                    while (!this.stringPool[dfn] || !(this.stringPool[dfn][3] === dfn_node)) {
                        dfn = middleFunc.body.body[0].argument.callee.name;
                        dfnPath = middleFuncPath.scope.getBinding(dfn).path;
                        dfn_node = dfnPath.node;
                        if (types.isBinaryExpression(middleFunc.body.body[0].argument.arguments[0])) {
                            countValue_ = middleFunc.body.body[0].argument.arguments[0].right.value;
                            sbl_ = middleFunc.body.body[0].argument.arguments[0].operator;

                            if (countValue_ === undefined) {
                                countValue_ = middleFunc.body.body[0].argument.arguments[0].right.argument.value;
                                sbl_ = sbl_ === '-' ? '+' : '-';
                            }
                            if (typeof res[1] === 'string' && res[1][0] !== '-') {
                                finalValue = eval(finalValue + sbl_ + countValue_);
                                run = dfn + `(${finalValue}, ${JSON.stringify(res[1])})`
                            } else {
                                finalValue = eval(finalValue + sbl_ + countValue_);
                                run = dfn + `(${finalValue}, ${JSON.stringify(res[2])})`
                            }
                        } else {
                            countValue_ = middleFunc.body.body[0].argument.arguments.at(-1).right.value;
                            sbl_ = middleFunc.body.body[0].argument.arguments.at(-1).operator;

                            if (countValue_ === undefined) {
                                countValue_ = middleFunc.body.body[0].argument.arguments.at(-1).right.argument.value;
                                sbl_ = sbl_ === '-' ? '+' : '-';
                            }

                            typeof res[1] === 'string'
                                ? (finalValue = eval(finalValue + sbl_ + countValue_), run = dfn + `(${finalValue}, ${JSON.stringify(res[1])})`)
                                : (finalValue = eval(finalValue + sbl_ + countValue_), run = dfn + `(${finalValue}, ${JSON.stringify(res[2])})`);
                        }
                        middleFuncPath = dfnPath.scope.getBinding(dfn).path;
                        middleFunc = middleFuncPath.node;
                    }
                    transCode = this.stringPool[dfn][2] + run;
                    decodeValue = eval(transCode);
                    res[3].replaceWith(types.stringLiteral(decodeValue));
                    path.stop();
                }
            })
        })
    }

    count_code() {
        traverse(this.ast, {
            BinaryExpression(path) {
                if (path.node.operator !== '+') return;

                const result = path.evaluate();
                if (result.confident && typeof result.value === 'string') {
                    path.replaceWith(types.stringLiteral(result.value));
                }
            }
        });
    }

    start() {
        this.convert_code();
        this.trans_code();
        this.count_code();
        this.save_file();
    }

}

console.time('处理完毕，耗时');

let ac_ast = new AntiContent('./antiContent/AntiContent.js');
ac_ast.start();


console.timeEnd('处理完毕，耗时');



