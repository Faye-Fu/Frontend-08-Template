// const { match } = require('assert');
const css = require('css');

const EOF = Symbol("EOF");//EOF:End of File

let currentToken = null;
let currentAttribute = null;

let stack = [{type: "document",children:[]}];//设置栈的初始根节点
let currentTextNode = null;

//加入一个新的函数，addCSSRules，这里我们把css的规则暂存在一个数组里
let rules = [];
function addCSSRules(text){
    var ast = css.parse(text);
    console.log(JSON.stringify(ast, null, "    "));
    rules.push(...ast.stylesheet.rules);
    //js新特性ast.stylesheet.rules把它展开变成push的参数给它传进rules里面
}

//假设selector都是简单选择器：.a  #a  tagName;他们连起来就会形成复合选择器，之间是与的关系
function matcher(element, selector){
    //判断这个元素是否是文本节点，如果是文本节点，就不用去看它到底跟selector匹配不匹配了
    if(!selector || !element.attributes)
        return false;
    
    if(selector.charAt(0) == "#"){
        //id选择器
        var attr = element.attributes.filter(attr => attr.name === "id")[0];
        if(attr && attr.value === selector.replace("#", ''))
            return true;
    }else if(selector.charAt(0) == "."){
        //类选择器
        var attr = element.attributes.filter(attr => attr.name === "class")[0]
        if(attr && attr.value === selector.replace(".", ''))
            return true;
    }else{
        //tagName选择器
        if(element.tagName === selector){
            return true;
        }
    }
    return false;
}

//计算优先级四元组
function specificity(selector){
    var p = [0, 0, 0, 0];
    var selectorParts = selector.split(" ");
    for(var part of selectorParts){
        if(part.charAt(0) == "#"){
            p[1] += 1;
        }else if(part.charAt(0) == "."){
            p[2] += 1;
        }else{
            p[3] += 1;
        }
    }
    return p;
}
//比较优先级
function compare(sp1, sp2){
    if(sp1[0] - sp2[0])
        return sp1[0] - sp2[0];
    if(sp1[1] - sp2[1])
        return sp1[1] - sp2[1];
    if(sp1[2] - sp2[2])
        return sp1[2] - sp2[2];
    
    return sp1[3] - sp2[3];
}


function computeCSS(element){
    //slice函数不传参数，默认是把原数组复制一遍
    //把父元素的序列进行一次reverse，因为我们的标签匹配是会从当前元素开始逐级的往外匹配
    //就是一级一级的往父元素找
    var elements = stack.slice().reverse();
    //判断是否匹配
    if(!element.computedStyle)
        element.computedStyle = {};

    for(let rule of rules){
        //简单选择器
        var selectorParts = rule.selectors[0].split(" ").reverse();
        //简单选择器最后一个跟当前元素算是否匹配
        if(!matcher(element, selectorParts[0]))
            continue;

        let matched = false;
        //需要双循环选择器和元素的父元素来去找到它们是否能够进行匹配
        var j = 1;//j表示当前选择器的位置
        //表示当前选元素的位置
        for(var i = 0; i < elements.length; i++){
            //元素匹配到选择器，j自增
            if(matcher(elements[i], selectorParts[j])){
                j++;
            }
        }
        //结束的时候检查是否所有的选择器已经都被匹配到了，匹配到了，认为是个匹配成功的
        if(j >= selectorParts.length)
            matched = true;

        if(matched){
            //如果匹配到，我们要加入
            // console.log("Element", element, "matched rule", rule);
            var sp = specificity(rule.selectors[0]);
            var computedStyle = element.computedStyle;
            for(var declaration of rule.declarations){
                if(!computedStyle[declaration.property])
                    computedStyle[declaration.property] = {};//用一个对象来保存属性的值
                
                if(!computedStyle[declaration.property].specificity){
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                }else if(compare(computedStyle[declaration.property].specificity, sp) < 0){
                    //比较，旧的更小的话，就让新的区域覆盖它；根据这个来完成优先级的判断
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                }  
            }
        }
    }

    //inline 样式
    //let inlineStyle = element.attributes.filter(p=>p.name=="style");
    //...
}


function emit(token){
    // console.log(token.type)
     //if(token.type === "text")
      //  return;
    let top = stack[stack.length - 1];//取出栈顶
    //入栈操作
    if(token.type == "startTag"){
        let element = {
            type: "element",
            children: [],
            attributes: []
        };
        //创建元素
        element.tagName = token.tagName;

        for(let p in token){
            if(p != "type" && p != "tagName"){
                element.attributes.push({
                    name: p,
                    value: token[p]
                });
            }
        }

        computeCSS(element);//添加的computeCSS

        top.children.push(element);
        //element.parent = top;

        //不是自封闭的标签
        if(!token.isSelfClosing)
            stack.push(element);
        
        currentTextNode = null;
    }else if(token.type == "endTag"){
        console.log('top.tagName',top.tagName)
        console.log('token.tagName',token.tagName)
        //结束标签
        if(top.tagName != token.tagName){
            throw new Error("Tag start end doesn't match!");
        }else{
            //+++++++++++++遇到style标签时，执行添加CSS规则的操作++++++++++++++++//
            if(top.tagName === "style"){
                addCSSRules(top.children[0].content);
            }
            stack.pop();
        }
        currentTextNode = null;
    }else if(token.type == "text"){
        //文本节点的时候
        //相邻的文本节点会被合并
        if(currentTextNode == null){
            currentTextNode = {
                type: "text",
                content: ""
            }
            top.children.push(currentTextNode);//子节点
        }
        currentTextNode.content += token.content;//给当前的文本节点追加一个content
    }
}

function data(c){
    //在检测到左尖括号的时候，不知道它的字符到底是一个什么样的tag,这一步暂时什么都不做
    if(c == "<"){
        return tagOpen;//标签开始状态
    }else if(c == EOF){
        emit({
            type:"EOF"
        });
        return ;//截止
    }else{
        //文本节点
        //在tokenazition这一步会去一个一个字符的把它emit上去，等后面在想办法在构建树的时候再把这些text拼起来
        emit({
            type:"text",
            content:c
        });
        return data;//忽略了小于号之外的
    }
}

//标签开始状态
function tagOpen(c){
    //console.log(c);

    //判断它是不是结束标签</
    if(c == "/"){
        return endTagOpen;//结束标签的开头
    }else if(c.match(/^[a-zA-Z]$/)){
        //<字母
        //如果它是一个英文的字母，要么是一个开始标签，要么是一个自封闭标签
        //给currentToken赋一个初值
        currentToken = {
            type: "startTag",
            tagName: ""
        }
        return tagName(c);
    }else{
        // 改成tagOpen yf
        return ;
    }
}

function endTagOpen(c){
    if(c.match(/^[a-zA-Z]$/)){
        currentToken = {
            type: "endTag",
            tagName: ""
        }
        return tagName(c);
    }else if(c == ">"){
        //要报错
    }else if(c == EOF){
        //要报错
    }else{
        //要报错
    }
}

function tagName(c){
    //tag符，换行符，禁止符，空格
    //开始标签
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName;
    }else if(c == "/"){
        //自封闭标签
        return selfClosingStartTag;
    }else if(c.match(/^[a-zA-Z]$/)){
        //字符的时候追加tagName
        currentToken.tagName += c;
        return tagName;
    }else if(c == ">"){
        //普通的开始标签，结束掉这个标签，回到data状态，然后解析下一个标签
        return data;
    }else{
        return tagName;
    }
}

//处理属性
function beforeAttributeName(c){
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName;
    }else if(c == "/" || c == ">" || c == EOF){
        //终止标识
        return afterAttributeName(c);
    }else if(c == "="){
        
    }else{
        currentAttribute = {
            name: "",
            value: ""
        }
        return attributeName(c);
    }
}

function attributeName(c){
    //console.log(currentAttribute)
    if(c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF){
        return afterAttributeName(c);
    }else if(c == "="){
        return beforeAttributeValue;
    }else if(c == "\u0000"){

    }else if(c == "\"" || c == "'" || c == "<"){

    }else{
        currentAttribute.name += c;
        return attributeName;
    }
}

function beforeAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF){
        return beforeAttributeValue;
    }else if(c == "\""){
        return doubleQuotedAttributeValue;
    }else if(c == "\'"){
        return singleQuotedAttributeValue;
    }else if(c == ">"){

    }else{
        return UnquotedAttributeValue(c);
    }
}

//双引号
function doubleQuotedAttributeValue(c){
    if(c == "\""){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    }else if(c == "\u0000"){

    }else if(c == EOF){

    }else{
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

//单引号
function singleQuotedAttributeValue(c){
    if(c == "\'"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    }else if(c == "\u0000"){

    }else if(c == EOF){

    }else{
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

//以引号结束，这里会多一个跟beforeAttribute差不多的状态，它是不能够直接接受一个字符创建一个属性的
//<div id="a"x= 然后这个地方我们至少有一个空格，如果没有空格直接接着写x=就是不合法的
function afterQuotedAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName;
    }else if(c == "/"){
        return selfClosingStartTag;
    }else if(c == ">"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }else if(c == EOF){

    }else{
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function UnquotedAttributeValue(c){

    if(c.match(/^[\t\n\f ]$/)){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    }else if(c == "/"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    }else if(c == ">"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }else if(c == "\u0000"){

    }else if(c == "\"" || c == "'" || c == "<" || c == "=" || c == "`"){

    }else if(c == EOF){

    }else{
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }
}



function afterAttributeName(c){
    if(c.match(/^[\t\n\f ]$/)){
        return afterAttributeName;
    }else if(c == "/"){
        return selfClosingStartTag;
    }else if(c == "="){
        return beforeAttributeValue;
    }else if(c == ">"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }else if(c == EOF){

    }else{
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name : "",
            value : ""                                  
        };
        return attributeName(c);
    }
}

//<div/>杠后面只能是右尖括号，其他都报错
//自封闭标签 <div/>杠后面只能是右尖括号，其他都报错
function selfClosingStartTag(c){
    if(c == ">"){
        currentToken.isSelfClosing = true;
        return data;
    }else if(c == "EOF"){
        //报错
    }else{
        //报错    
    }
}

module.exports.parseHTML = function parseHTML(html){
    let state = data;//初始状态
    for(let c of html){
        state = state(c);
    }
    state = state(EOF);//状态机强迫一些节点最后完成截止的标识
    return stack[0];
}  