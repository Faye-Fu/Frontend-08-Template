# 学习笔记
### 使用LL算法构建AST
AST：抽象语法树

构建抽象语法树的过程被叫做语法分析，最著名的语法分析算法核心的思想有两种：LL算法 和 LR算法

LL算法：从左到右扫描，从左到右规约
### 四则运算
#### 词法定义：
TokenNumber: .123456789的组合

Operator：+ - * / 之一

Whitespace  空格

LineTerminator  换行

> 在四则运算中，真正有意义的输入元素就是Token，一种是==Number==数字，一种是==Operator==运算符

#### 语法定义：
加法和乘法是有一个优先级关系的，所以用JavaScript的产生式来定义它的加法和乘法。

这里我们把加减乘除做成一个嵌套的结构。可以把加法当成由左往右两个乘法组成，并且加法是可以进行连加的，所以说加法应该是一个重复自身的序列。（这里也会有一个递归的产生式结构，这也是产生式当中用来处理无限列表的常用手法）

MultiplicativeExpression 就是乘法运算，一个单独的数字我们也可以当成是一种特殊的乘法，就是只有一项的乘法（任何数*1 = 自身，也属于乘法）同样我们可以把只有一个乘号认为是一种特殊的加法，只有一项的加法。这样方便我们去递归定义整个表达式。

#### 乘法表达式
> <MultiplicativeExpression>::=
>
>==<Number>==
>
> |<MultiplicativeExpression>==<*>== ==<Number>==
>
> |<MultiplicativeExpression> ==</>== ==<Number>==

它的定义是一个用乘号或者除号相连接的Number的序列。参考比较熟悉的递归思想的话，就是规定它可以是一个单独的Number，也可以是一个乘法表达式，后面连上一个乘号再加上一个Number。

上面加了黄色背景的部分，就是产生式定义里面的终结符，也就是Terminal Symbol。它是我们直接从词法里面扫描出来的。没有背景的就是None Terminal Symbol非终结符，它是用终结符的组合定义出来的。

定义乘法表达式的非终结符有：
- <Number>      —— 一个单独的Number
- <*><Number>   —— 自身加上一个乘号再加上一个Number
- </><Number> —— 自身加上一个除号在加上一个Number

这就是乘法表达式的一个结构了，当我们遇到这样一个结构的时候，就可以认为它是一个乘法表达式。

#### 加法表达式

加法表达式和乘法类似，基本的单元换成一个非终结符MulplicativeExpression。
> <AdditiveExpression>::=
>
><MultiplicativeExpression>
>
> |<AdditiveExpression>==<+>== <MultiplicativeExpression>
>
> |<AdditiveExpression> ==<->== <MultiplicativeExpression>

这里我们拥有一个单独的==MultiplicativeExpression==乘法表达式，或者是加法表达式自身加上==加号==在加上一个==乘法表达式==。也可以是自身加上==减号==在加上一个==乘法表达式==。

总的来说就是数个乘法用加号或者减号连接在一起，那么就是一个加法表达式的结构了。

#### 整体的表达式
> <Expression>::=
>
><AdditiveExpression>==<EOF>==

最后我们认为一个能处理的表达式Expression，它就是一个AdditiveExpression（加法表达式）。最后引入一个特殊的符号EOF，EOF不是一个真实可见的字符。但是语法需要一个终结，在分析过程中有一些结构要求一定要有尾巴才结束。所以EOF就是这个尾巴符号。标识了源代码的结束点。

EOF是End of File 的缩写，常常被用在计算机里面的各种表示终结的场景。

### LL语法分析
通过上面的语法定义，下面来了解LL语法分析是怎么去操作的。
> <AdditiveExpression>::=
>
>==<MultiplicativeExpression>==
>
> |<AdditiveExpression>==<+>== <MultiplicativeExpression>
>
> |<AdditiveExpression> ==<->== <MultiplicativeExpression>

以上面的加法为例，乘法比较简单，我们总是从输入的序列里面，去看它当前能够取到是什么，在上面的三条产生式的规则里面，单去看AdditiveExpression，做一个策划分析：

找到的第一个符号symbol可能是：第一种是开头是一个MultiplicativeExpression;第二种就是AdditiveExpression

由于乘法可能是未解析的状态，下面把它展开：
> <AdditiveExpression>::=
>
> <Number>
>
> |<MultiplicativeExpression><*><Number>
>
> |<MultiplicativeExpression></><Number>
>
> |<AdditiveExpression>==<+>== <MultiplicativeExpression>
>
> |<AdditiveExpression> ==<->== <MultiplicativeExpression>

由上可见，它的第一个符号有三种可能性：
- Number   
- MultiplicativeExpression 
- AdditiveExpression
判断是否乘法，加法；还得看第二个符号是乘号除号还是加号减号。通过这个可以得出从左到右扫描，从左到右归并的语法分析（LL语法分析）

### 代码实现
#### 词法分析
词法分析的正则表达式
> var regexp = /([0-9\.]+)|([ \t]+)|([\r\n]+)|(\*)|(\/)|(\+)|(\-)/g;

-  0-9 包含了所有数字
- \t 前面的是空格，而 \t 就是 tab
- \r 就是回车，而 \n 就是新行
- 加减乘除

用或分隔开，每次匹配一个分支（数字）（空格\t）（换行符\r \n）(加减乘除)

圆括号里面内容表示捕获，除了正则表达式整体被匹配，圆括号里面的内容也会被匹配出来。这是正则表达式的一个特性，专门为词法分析而准备的正则语法。
```
var regexp = /([0-9\.]+)|([ \t]+)|([\r\n]+)|(\*)|(\/)|(\+)|(\-)/g;

var dictionary = ["Number", "Whitespace", "LineTerminator", "*","/","+","-"];

function tokenize(source){
    var result = null;
    while(true){
        //查找匹配的RegExp方法，返回一个数组（未匹配返回null）
        //不断扫描整个字符串里面的内容
        result = regexp.exec(source);

        if(!result) break;
        //0是整个的正则，从1开始到1234567的范围里，匹配到哪一种输入元素，就打印出对应dictionary
        for(var i = 1; i <= dictionary.length; i++){
            if(result[i])
                console.log(dictionary[i - 1]);
        }
        console.log(result);
    }
}

tokenize("1024 + 10 * 25");
```
我们的 tokenize 是 1024 + 10 * 25，结果如下：

- 首先出来的会是 1024，这个是 Number
- 接下来就是空格符，也就是 Whitespace
- 然后就是 +，对应的就是 +
- 接下来还是一个 空格符，对应的dictionary 是 Whitespace
- 然后就是 10，对应的dictionary  是 Number
- 以此类推，我们发现这个代码是会从左到右扫描我们的字符，找到所有对应的 dictionary 。

一个初步词法分析的正则就实现了。

接下来做一些完善
添加lastIndex

取出来的lastIndex和新生成的lastIndex去做一个比较，如果长度超了，就说明里面有不认识的字符

当调用exec( )的正则表达式对象具有修饰符g时，它将把当前正则表达式对象的lastIndex属性设置为紧挨着匹配子串的字符位置，当同一个正则表达式第二次调用exec( )，它会将从lastIndex属性所指示的字符串处开始检索，如果exec( )没有发现任何匹配结果，它会将lastIndex重置为0。
```
var regexp = /([0-9\.]+)|([ \t]+)|([\r\n]+)|(\*)|(\/)|(\+)|(\-)/g;
        
var dictionary = ["Number", "Whitespace", "LineTerminator", "*","/","+","-"];

function* tokenize(source){
    var result = null;
    var lastIndex = 0;
    while(true){
        //存储在整个字符串中下一次检索的开始位置
        lastIndex = regexp.lastIndex;
        //查找匹配的RegExp方法，返回一个数组（未匹配返回null）
        //不断扫描整个字符串里面的内容
        result = regexp.exec(source);

        if(!result) 
            break;
        if(regexp.lastIndex - lastIndex > result[0].length)
            break;

        let token = {
            type:null,
            value:null
        } 
        //0是整个的正则，从1开始到1234567的范围里，匹配到哪一种输入元素，就打印出对应dictionary
        for(var i = 1; i <= dictionary.length; i++){
            if(result[i])
                token.type = dictionary[i - 1];
        }
        token.value = result[0];
        yield token;
    }
    yield {
        type:"EOF"
    }
}

for(let token of tokenize("1024 + 10 * 25")){
    console.log(token);
}
```
#### 语法分析
MultiplicativeExpression它的开头的第一个有可能有两个输入：一个是Number；一个是MultiplicativeExpression；它的第二个输入又有两个情况：一个是*，一个是/

处理上分成三个逻辑分支：

第一个是Number的情况：
一个Number就可以形成一个MultiplicativeExpression这样的一个结构
新建一个节点，一个新的非终结符(NoneTerminalSymbol)。这个新的非终结符会有一个children，因为是从Number构造起来的，所以把source[0]的Number给它放进去
```
let node = {
    type:"MultiplicativeExpression",
    children:[source[0]]
}
source[0] = node;
return MultiplicativeExpression(source);
```
这个新的非终结符他会有一个 children 属性。因为它是从 Number 构造起来的，所以它的 children 里面我们就把 source[0] 里面的 Number 放入 children 里面。

因为我们产生式是一个递归的结构，我们的表达式也是一个递归的结构，所以当我们生成好了 MultiplicativeExpression 之后，后面还有可能是* 或者是 /。所以我们要递归的去调用 MultiplicativeExpression 函数。

第二个就是MultiplicativeExpression后面跟着*

```
let node = {
    type:"MultiplicativeExpression",
    operator:"*",
    children:[]
}
node.children.push(source.shift());//把source里面的第一个元素添加到node的末尾
node.children.push(source.shift());
node.children.push(source.shift());
source.unshift(node);//把node添加到source的开头
return MultiplicativeExpression(source);
```
这里也一样我们先定义一个新的 node，唯一的区别就是这个新节点里面多了一个属性叫 operator。因为这里我们遇到了一个星号，所以我们就把*赋予这个 operator属性。

然后我们把 source 的前三项都用 .shift() 获取出来放入 node 的 children 里面，最后把新生成的结构放回 source 里面。最后同样我们需要去递归一次。

第三个是MultiplicativeExpression后面跟着/

```
let node = {
    type:"MultiplicativeExpression",
    operator:"/",
    children:[]
}
node.children.push(source.shift());
node.children.push(source.shift());
node.children.push(source.shift());
source.unshift(node);
return MultiplicativeExpression(source);
```
除法与乘法的逻辑没有任何的本质区别，就是抄写一遍，把乘号变成了除号而已。

最后我们这里需要加入递归结束的条件，递归结束的条件就是 source[0] 的 type 是 MultiplicativeExpression 但是它的后面又不是乘号也不是除号。因为前面两个 if 都有 return 的分支， 所以这一段自然就是一个 else 分支。

我们已经把所有的乘法都处理完毕了。因为除了乘法和除法，我们还有可能遇到不认识的情况，所以这里最后我们加了一个默认递归自己，应该不会执行；因为如果遇到了不符合的字符，那肯定就已经在前面的步骤被退出了。

```
//递归结束的条件就是source[0].type === "MulitiplicativeExpression"，然后后面没有乘号或者除号
if(source[0].type === "MultiplicativeExpression"){
    return source[0];
}
    
return MultiplicativeExpression(source);//默认给一个递归自己，应该是永远不会执行的
```
AddictiveExpression的三种情况是与我们的 MultiplicativeExpression的逻辑是基本一样的，但是AddictiveExpression是需要处理它的产生式的三种情况之外，还有MultiplicativeExpression所有的逻辑。

加法的表达式的第一部分是 MultiplicativeExpression，所以上面的表达式当中的头三个其实是MultiplicativeExpression，在处理加法的时候，我们也需要去调用 MultiplicativeExpression() 函数，先处理掉 乘法，然后再执行我们加法中的情况。（加法中的情况也就是上面表达式里面的最后两条）。


```
//数字
if(source[0].type === "MultiplicativeExpression"){
    let node = {
        type:"AdditiveExpression",
        children:[source[0]]
    }
    source[0] = node;
    return AdditiveExpression(source);
}
//加法
if(source[0].type === "AdditiveExpression" && source[1] && source[1].type === "+"){
    let node = {
        type:"AdditiveExpression",
        operator:"+",
        children:[]
    }
    node.children.push(source.shift());
    node.children.push(source.shift());
    MultiplicativeExpression(source);
    node.children.push(source.shift());
    source.unshift(node);
    return AdditiveExpression(source);
}
//减法
if(source[0].type === "AdditiveExpression" && source[1] && source[1].type ==="-"){
    let node = {
        type:"AdditiveExpression",
        operator:"-",
        children:[]
    }
    node.children.push(source.shift());
    node.children.push(source.shift());
    MultiplicativeExpression(source);
    node.children.push(source.shift());
    source.unshift(node);
    return AdditiveExpression(source);
}
```
最后就是把 Expression 的整体加上 EOF 的结构，进入 Expression() 的时候我们就判断一下 source 的第一个元素是不是 AdditiveExpression。因为它同样会包含了 AdditiveExpression的所有逻辑，所以这里判断 source 第一个是 AdditiveExpression，然后第二个是 EOF 的话，Expression 就会总结，然后给我们的 source resolve 成一个最终节点。


```
if(source[0].type === "AdditiveExpression" && source[1] && source[1].type === "EOF"){
    let node = {
        type:"Expression",
        children:[source.shift(), source.shift()]
    }
    source.unshift(node);
    return node;
}
AdditiveExpression(source);
return Expression(source);
```


### 正则表达式
#### RegExp对象方法
- regexp.test() 判断有没有匹配片段 返回true或false
- regexp.compile() 编译正则表达式
- regexp.exec() exec()命名捕获分组，提取便签属性文本示例
>     1.不加g regexp.lastIndex不变
> 
>     2.regexp.exec(str) == null regexp.lastIndex 重置
>     
>     3.regexp.exec(str) 匹配根据regexp.lastIndex 匹配

#### 支持正则表达式的string对象方法    
- str.match() 字符串内检索制定的值，并返回
- str.replace() 与正则表达式相匹配的值替换
- str.search() 检索与正则表达式相匹配的值 返回索引 -1没有匹配到
- str.split() 字符串分成字符串数组
#### 两种创建方式
1. 直接量（推荐）
1. new RegExp();

```
var reg = /abc/i;

var reg = new RegExp('abc','i');
var reg = new RegExp(/abc/,'i');

var str = 'abcd';
reg.test(str);
```
#### 修饰符
1. i：忽略大小写
2. g：执行全局匹配（查找所有匹配，而非找到第一个匹配后停止，返回结果可以是多个，不加g只会匹配一个）
3. m：执行多行匹配（要配合g一起使用）；就是匹配换行符两端的潜在匹配，影响正则中的^$符号
4. []：用于查找某个范围内的内容
```
var reg = /[0-9][0-9][0-9]/g;
var str = "dsklfjdsfj34324fdsf335sdf9998hhf090jj";

str.match(reg);//["343","335","999","090"]
```
5. ^：  用法一：限定开头；用法二：在[^] 是 “否” 取反
```
var str = "abc2341abcffhdsfhhuabc232abcfdshjf";
var regexp = /^abc/g;
str.match(regexp);//["abc"]

var reg = /[^a][^b]/g;//查看字符串两位连续不是ab的匹配
str.match(reg);
//["bc", "23", "41", "bc", "ff", "hd", "sf", "hh", "ua", "bc", "23", "2a", "bc", "fd", "sh", "jf"]
```
6. ()
```
var reg = /(abc|bcd)/g;//查看字符串 匹配abc或者bcd
var str = "abcjfakfjbcddsad";
str.match(reg);//["abc", "bcd"]
```
#### 元字符

元字符 | 解释 | 相当于
---|---|---
.| 查找单个字符，除了换行和行结束符|[^\r\n]
\w | 查找单词字符|[0-9A-z_]
\W | 查找非单词字符|[^\w]
\d | 查找数字字符|[0-9]
\D | 查找非数字字符|[^\d]
\s |查找空白字符(空格符，制表符\t，回车符\r，换行符\n，垂直换行符\v，换页符\f)|[\n\f\t]
\S |查找非空白字符| [^\s]
\b |匹配单词边界|
\B |匹配非单词边界|
\0 |查找null字符|
\n |换行符|
\f |换页符|
\r |行结束符|
\t |缩进符 Tab|
\v |垂直换行符|
\xxx |查找以八进制数 xxx规定的字符|
\xdd |查找以十六进制数 dd 规定的字符|
\uxxxx |查找以十六进制数 xxxx 规定的 Unicode 字符|
\r |行结束符|
#### 量词
用于设定某个模式出现的次数

量词 |描述
---|---
n+ | 匹配任何包含至少一个n的字符串
n* | 匹配任何包含0个n或多个n的字符串
n? | 匹配任何包含0个n或一个n的字符串
n{x}|匹配包含x个n的序列字符串
n{x,y}|匹配包含x至y个n的序列字符串 中间不要有空格
n{x,}|匹配包含至少x个n的序列字符串
n$|匹配任意结尾为n的字符串
^n|匹配任意开头为n的字符串
?=n|匹配任意字符其后紧接字符为n的字符
?!n|匹配任意字符其后紧接字符不为n的字符

```
var reg = /s+/g;
var str = "fsdfgess";
str.match(reg);//["s", "ss"]
```

```
var reg = /\w+/g;//单词字符可以出现一次或者多次
var str = "dfsdfsdfvsf"
str.match(reg);//["dfsdfsdfvsf"]
```

```
// 贪婪匹配 能匹配多个就不匹配少
var reg = /\w*/g;// \w 能识别到 + 最后一个光标定位点
var str = "sdsd"
str.match(reg);// ["sdsd",""]

var reg = /\d*/g; //\d 不能识别到 光标定位点 下一个字符 光标定位点 。。。
var str = "sdsd"
str.match(reg);// ["","","",""]

var reg = /\w?/g; 
var str = "aaa"
str.match(reg);// ["a","a","a",""]

var reg = /\w{2}/g; 
var str = "aaa"
str.match(reg);// ["aa"]

// 贪婪匹配 能匹配多个就不匹配少
var reg = /\w{2,3}/g; // 匹配包含x至y个n的序列字符串
var str = "aaaaa"
str.match(reg);// ["aaa", "aa"]

var reg = /\w{2,}/g; // 匹配包含至少x个n的序列字符串
var str = "aaaa"
str.match(reg);// ["aaaa"]

var reg = /\w$/g; // 匹配任意结尾为n的字符串
var str = "abcd"
str.match(reg);// ["d"]

var reg = /^abc$/g; // abc既是开头又是结尾
var str = "abc"
str.match(reg);['abc']

// 正向预查  正向断言
var reg = /\w(?=c)/g; // 后面链接c的\w
var str = "abc"
str.match(reg);// ["b"] 后面的b

var reg = /b(?!c)/g; // 后面不链接c的b
var str = "abcbb"
str.match(reg);// ["b","b"]
```
检验一个字符串收尾是否有数字

```
var str = "123rdsfdsf448";
var reg = /^\d|\d$/g;
str.match(reg);//["1", "8"]
```
#### RegExp对象属性
- regexp.ignoreCase 正则写了 i 返回true
- regexp.global 正则写了 g 返回true
- regexp.multiline 正则写了 m 返回true
- regexp.source 正则内容
- regexp.lastIndex 游标


#### 一些示例
匹配xxxx格式

```
// \1 反向引用第一个子表达式（(\w)）引用的内容
var reg = /(\w)\1\1\1/g;
var str = "dddd-ghjhjfgh-kkkk"
str.match(reg);//["dddd", "kkkk"]
```
匹配aabb格式

```
var reg = /(\w)\1(\w)\2/g;
var str = "ddff-ghjhjfgh-kkkk"
str.match(reg);//["ddff", "kkkk"]
console.log(reg.exec(str))
```
aabb->bbaa

```
var reg = /(\w)\1(\w)\2/g;
var str = 'aabb'
str.replace(reg,"$2$2$1$1");//aabb
```
the-first-name 小驼峰式写法 theFirstName
```
var reg = /-(\w)/g;
var str = 'the-first-name'
// str.replace(reg,'$1'.toUpperCase()); 无效还是 thefirstname
str.replace(reg,function($,$1){
	return $1.toUpperCase()
});// theFirstName
```
aaaaabbbbbbbbbbbbccccccc — abc
```
var str = 'aaaaabbbbbbbbbbbbccccccc';
reg = /(\w)\1*/g;
str.replace(reg,'$1');//abc
```
科学计数法
```
var str = "10000000000"
var reg = /(?=(\B)(\d{3})+$)/g ; // 空后面跟着 非单词边界 3的位数个 1到多个数字 重后往前($)
str.match(reg)
str.replace(reg,'.');//"10.000.000.000"
```
匹配 xx-xx 格式

```
var str = 'xxyyzlkk' 
str.match(/\w{2}/g).join('-') //xx-yy-zl-kk
```
匹配 aa-bb 格式

```
var str = 'xxyyzzkkjklo' 
str.match(/(\w)\1/g).join('-');//"xx-yy-zz-kk"
```
匹配非 汉字字母数字

```
var str = 'wer123!@#$_}{||_ =4+' 
str.match(/[^A-Za-z0-9\u4e00-\u9fa5]/g)//["!", "@", "#", "$", "_", "}", "{", "|", "|", "_", " ", "=", "+"]

// 排除其它特殊字符 _
var str1 = 'wer123!_____&&&88+4+'
str1.match(/[^A-Za-z0-9_\u4e00-\u9fa5]/g)  // ["!", "&", "&", "&", "+", "+"]
```
邮箱：
```
var mailReg = /^\w+[-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
```
手机：
```
var phoneReg = /^1\d{10}$/;
```
身份证：
```
var idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
```
姓名（汉字）：
```
var nameReg = /^[\u4e00-\u9fa5]{2,4}$/; // 2-4位的汉字名字
```
普通域名：
```
var urlReg = /^(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*([\?&]\w+=\w*)*$/; // https或http协议的url
```
用户名：
```
var userNameReg = /^[A-Za-z0-9-_]*$/; // 用户名为数字英文下划线或短划线
```
QQ号：
```
var qqReg = /^[1-9][0-9]{4,}$/;
```
邮编：

```
var mailReg = /^[1-9][0-9]{5}$/;
```
HTML标签：
```
var tagReg = /<[^>]+>/; //可以用来去掉html文本中的标签，得到纯文字
```
日期：
```
var dateReg = /^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[1-2]\d|3[0-1])$/; //YYYY-MM-dd格式，短线可以视情况替换
```
时间：
```
var timeReg = /^([0-1]\d|2[0-3]):[0-5]\d:[0-5]\d$/; //HH:mm:ss格式，冒号可以视情况替换
```
