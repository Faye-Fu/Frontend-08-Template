# 学习笔记
#### JS表达式|运算符和表达式
- Atom
- Expression
- Statement
- Structure
- Program/Module

Atom
##### Grammar
- Grammar Tree vs Priority
- Left hand side & Right hand side

##### Runtime
- Type Convertion
- Reference

主要讲语法树和运算符优先级的关系，以及运算符的左值和右值的一个区别，关于运行时主要讲类型转换和引用类型两个新的知识。

#### 语法树和运算符优先级
- +-
- */
- ()

乘除是我优先级高于加减，括号的优先级比乘除更高，所以当我们去构造一棵语法树的时候，必须要考虑到这个因素，乘除会优先形成更小一级的语法结构，然后加减就会形成更高一级的这样的语法结构。

比如说1+2*3就会形成下图这样的一个结构，2乘以3是一棵子树，然后1 + 2乘以3的结果 是这个语法结构，这个图不是很严谨，但是它大概表示了，运算符的优先级会影响到语法树的构成，所以说我们会发现在JavaScript的标准中，它是用产生式来描述运算符的优先级的。
```
graph TD
A{+}-->B(1)
A-->C(乘号)
C-->D(2)
C-->E(3)
```
#### 表达式
##### Member
- a.b
- a[b]
- foo'string'此处是反引号
- super.b
- super['b']
- new.target
- new Foo()

首先运算符优先级最高的是Member运算，Member运算它的典型代表就是a.b这样的一个结构，但是虽然说叫做Member类的运算符，但是其实它也不完全是Member，它只是一个分级的这样的一个名称，那么member运算也就是点运算符，只是它一个典型的代表。

事实上在Member expressions语法结构中，一共可以出现几种非常不一样的表达式的方式。

a.b这个是成员访问，a[b]也是成员访问，它们两个的区别就是b要不要是一个字符串，像JavaScript这样的语言，用中括号里面写b的这种形式，它就是可以支持运行时的字符串，如果换成比较静态的语言，它就不会允许你传一个变量进去这个位置。

然后Function，反引号的字符串，那么它的前面如果加一个函数名，那么它会把这个反引号的字符串部分拆开，然后传进这个函数当作参数，这个运算它的优先级也是比较高的，跟Member运算是属于同一级，但是跟Member没有关系。

另外使用super关键字，这个是只有在class的构造函数里面可以用，super.b和super[b]这种都属于Member运算，优先级跟变量点和变量方括号是一样的。

new.target的前后两个词都是固定的，一个字都不能换，这个用法也是跟Member运算优先级一致的。

带括号的new，它的优先级跟咱们前面的这些是相同的。

##### New
- new Foo

然后不带括号的new被单独的设为一个优先级称为new expression。

new a()():第一个括号跟着前面的new运算的，

new new a():因为带括号的new运算级别更高，所以它的括号会跟第二个new优先级结合，

不带括号的优先级更低

##### Reference
- Object
- Key
- delete
- assign

因为a.b访问了一个属性，但是它从属性取出来的可不是属性的值，它取出来的是一个引用，引用类型并非JavaScript的7种基本类型之一，但是引用类型也是个确确实实存在于运行时中的一个JavaScript的类型，这种我们把它称作标准中的类型。而不是语言中的类型。

一个reference它分成两个部分，第一个部分是一个对象，第二个部分是一个key。对象当然就是JavaScript的对象，key可以是String也可以是symbol，一个reference类型取出来是一个object和一个key,那么所以说它就完全记录了Member的前半部分和后半部分。

那么delete和assign这样的基础设施，它其实就会用到reference类型，如果我们做加法或者减法的运算，就会直接把reference直接解引用，然后像普通的变量一样去使用，但是Member表达式出来的，如果是放在delete之后，那么我们就需要用到引用的特性，因为我们要知道哪一个对象哪一个key，

assign也是一样，当我们进行赋值的时候，也就是说当我们把Member运算放在一个等号的左边，当然了加等于减等于乘等于除等于这类的assign运算都是一样的，我们把它放在左边的时候，我们同样也知道我们把右边的这个表达式赋值给哪一个对象的哪一个属性，这个就是引用类型的一个关键的特征，我们的JavaScript语言就是用引用类型在运行时来处理删除或者是赋值这样的写相关的操作的。

##### Expressions
##### Call
- foo()
- super()
- foo()['b']
- foo().b
- foo()'abc'此处是反引号

最基础的一个Expression就是一个函数后边跟了一对圆括号，它的优先级要低于new，同时也低于前面的所有的Member运算。

但是在这个括号之后，如果加上取属性，比如说方括号，比如说.b又比如说反引号，那么它会让表达式降级为Call Expression，也就是后面的点运算它的优先级也降低了。

所以说，我们的语法结构能够表达的内容要多于运算符优先级所能表达的。像这种点运算它本身就可以有不同的优先级，它是它前面的语法结构来决定自己的优先级，带圆括号的属性它的优先级就比这个不带圆括号的要低两级，所以有的时候用优先级来解释运算符，其实它并不是一个非常严谨的一种说法，真正严谨的还是使用产生式，一级一级的语法结构。来描述运算的优先顺序。

Example:new a()['b']

圆括号先跟new相结合，是一个Member Expression它的优先级要高于Call Expression，同时后面带方括号的属性访问，它也因为被圆括号Call Expression拉低了优先级，所以它的优先级也变低了。

正确的理解：new出来一个a对象，然后访问它的b属性。

##### 左手和右手运算
Example：a.b = c;a + b = c

可以使用a.b=c但是不能使用a + b = c，因为a.b是一个left handside Expression；a+b是一个Right Handside Expression，只有left handside expression才有资格放在等号的左边，这个是一个各种编程语言都会使用的一个概念，所以在JavaScript里面其实并不会定义所谓的Right Handside Expression，因为所有的Expression默认它只要不属于Left Handside Expression，就一定属于Right Handside Expression。

Left Handside Expression就是根据能不能够放到等号左边来的。

##### Update自增自减
- a++
- a--
- --a
- ++a

Update Expression它就已经是Right Handside Expression了，update就是自增自减，假如我们写了++ a ++的话，那么它所表示的是这个a是优先跟后面的运算的，所以最后的结果是不合法的。

##### Unary单目运算
- delete a.b
- void foo()
- typeof a
- +a
- -a
- ~a
- !a
- await a

##### Exponental乘方
JavaScript中唯一一个右结合的运算符，**

##### Multiplicative
*/%
##### Additive
+-
##### Shift
<< >> >>>
##### Relationship
< > <= >= instanceof in

##### Equality
- ==
- ！=
- ===
- ！==

##### Bitwise
& ^ |

##### Logial
&& ||

##### Conditional
?:

## JS表达式|类型转换
- a + b
- "false" == false
- a[0] = 1;

a+b是一定要作用于字符串或者是作用于两个数字之间的，那么一旦a和b属于别的类型，那么它就会发生一个类型转换，比如说我们一个字符串和一个数字相加，那么我们就要把这个数字转成字符串，如果说其中的一个是布尔类型，那么我们要根据相加的关系进行一下转换，类型转换是一个比较复杂的话题。

对表达式来说，类型转换也是一个重要的基础设施，在整个JavaScript中，最复杂的一个类型转换就是双等号，比如说字符串的false，它跟布尔变量的false,它们两个相比较并不相等。

这就会造成一个直觉的错误，而事实上因为双等号的类型转换规则非常的复杂，总的来说，如果类型相同它可以比较，类型不同，它基本上是把它全转为Number，然后再互相比较。

所以说如果你敲一个空格，让它跟布尔变量false比较，它就相等了。你敲一堆空格跟false比较它也相等，敲一个0跟false比较它也相等，所以这块是非常违背人类直觉的，也被认为是JavaScript的语言设计初期最大的一个失误。推荐尽量使用三等号，或者是做完了类型转换，再进行比较，这样可以避免很多不必要的麻烦。

Member Expression里面的object的key部分，它也会发生类型转换，这都是一些表达式中发生类型转换的例子，像位运算不但会要转换成Number类型，还必须要把Number再转成整数类型，这就是一个类型转换对表达式的意义。

#### 7种类型的互相转换

~| Number|String|Boolean|Underfined|Null|Object|Symbol
---|---|---|---|---|---|---|---
Number |-|-|0false|×|×|Boxing|×
String| -|-|""false|×|×|Boxing|×
Boolean|true1 false0|'true' 'false'|-|×|×|Boxing|×
Underfined| NaN|'Undefined'|false|-|×|×|×
Null| 0|'null'|false|×|-|×|×
Object| valueOf|valueOf toString|true|×|×|-|×
Symbol| ×|×|×|×|×|Boxing|-

##### Unboxing拆箱转换
- ToPremitive
- toString vs valueOf
- Symbol.toPrimitive

拆箱转换是指我们把一个Object转成一个普通的类型，里面最主要的一个过程叫做ToPremitive，ToPremitive发生在我们的表达式定义的方方面面，比如说我们的加法，如果说遇到了Object加Object或者Object参与运算的情况，它都会调用ToPremitive过程。

```
var o = {
    toString(){ return "2"},
    valueOf(){ return 1},
    [Symbol.toPrimitive](){ return 3}
}
```

一个对象o身上有三个方法的定义，第一个是toString方法，第二个是valueOf方法，第三个是Symbol.toPrimitive的方法，这是一个Symbol的key值，如果定义了Symbol.toPrimitive那么它就会忽略toString和valueOf，否则我们在进行不同的转换的时候，它会根据提示来决定调用toString和valueOf的先后。

比如说加法它就会优先调用valueOf，即使调用一个字符串参与的加法，x加o这个时候也会先调用valueOf，那么它就会得到1。如果把valueOf和toPrimitive两个都注释掉，那么x加o的结果就会得到x2，只要有toPrimitive它就一定会得到x3。
```
var x = {},
x[o] = 1,
console.log("x" + o);
```
当这个o作为属性名的时候，则会优先调用它的toString方法，如果把toPrimitive两个都注释掉，最后得到的结果就是x2发生了改变，而不是x1发生了改变，我们的每一个表达式它都有一定的类型转换的机制，大部分时候类型转换的机制很清晰，除了像==这样的一个特殊的场景，建议不要使用。

##### Boxing装箱操作

类型 | 对象 | 值
---|---|---
Number | new Number(1)|1
String | new String("a")|"a"
Boolean|new Boolean(true)|true
Symbol|new Object(Symbol("a"))|Symbol("a")

因为Object它是可以有类概念的，那么对每个基础类型，Object都提供了一个包装的类，当然也不是每一个基础类型。比如说Undefined和Null是没有包装类的，那么剩下的4个基础类型它都有一个对应的包装类，比如说Number它就是一个构造器名为Number,直接调用就返回一个值，new调用就返回一个对象，这个时候，我们就称这个对象和这个值1存在一个装箱关系。

需要注意Symbol，没办法用new调用，需要用Object构造器给它包上一层，我们只能通过调用Symbol来获得一个Symbol类型的值，但是我们要加了new,它就会抛错，这是一个奇怪的机制，但是事实上我们也是能够得到Symbol的包装类型的，所以它跟前面的三种略有一点点的区别。

使用Member也就是使用点或者方括号去访问属性的时候，如果点和方括号之前的变量或者表达式得到的是一个基础类型，那么就会自动调用装箱的过程。不需要再去调用规则里面的Number String等这些构造器。

所以在Number这个Class上定义了什么样的值，那么我们的正常的Number类型的值它也可以通过点运算去访问。

##### 练习
StringToNumber

NumberToString

## JS语句|运行时相关概念
#### Statement语句
##### Grammar
- 简单语句
- 组合语句
- 声明

##### Runtime
- Completion Record(语句执行的结果记录)
- Lexical Environment(作用域相关知识)

##### Completion Record

```
if(x == 1)
    return 10;
```
可以发现上面语句它其实完成状态有可能是不一样的，return 有可能它有return，也有可能它最后没有return。这取决于这个x具体的值，所以对运行时来说，JavaScript引擎在解析if语句的时候，就需要知道它完成了之后到底是怎么完成的，于是就需要一种数据结构来存储语句的完成的结果，这就是Completion Record类型了。

Completion Record类型不在语言的基本类型里面，因为在JavaScript里面无论如何都没有办法真正的访问到数据，它没有办法复制给变量。也没有办法作为参数，任何环节都没有办法得到它，但又确实存在于运行JavaScript的电脑里面，每写一个语句就会产生Completion Record这样的东西，这个可能包括说是否返回，返回值是什么等等一系列的信息，所以说Completion Record它一定是有一些字段的。

Completion Record它分成了三个部分
- [[type]]: nomal, break, continue, return, throw
- [[value]]: 基本类型
- [[target]]: label（就是在语句前面加上一个标识符和一个冒号）

## JS语句|简单语句和复合语句
##### 简单语句
- ExpressionStatement 表达式语句
- EmptyStatement 空语句
- DebuggerStatement
- ThrowStatement
- ContinueStatement
- BreakStatement
- ReturnStatement

在语句里面，只有表达式语句是完全由表达式组成的，因为表达式里面存在着等号赋值的可能性，所以简单语句里面会存在有Expression来单独的成一个语句，简单表达式后面接一个分号就是一个简单语句了。

单独的一个分号就是空语句。

DebuggerStatement是一个非常奇特的语句的形式，就是debugger关键字后面接一个分号，debugger语句其实它是一种专门给调试的时候使用的一种语句， 然后它在实际的用户的电脑上运行的时候，是不会发生任何作用的，建议的用法是触发一个debugger的一个断点，所以说debugger语句就有这样的一个作用。

ThrowStatement会抛出一个异常，除了ThrowStatement也有其他的方法可以抛出异常，但是如果不想让它真的发生个错误，可以主动在代码里面用throw空格接一个表达式，然后来抛出一个异常的。

Continue和Break它两是跟循环语句相匹配的，Continue表示结束当次循环，那么后面的循环继续，如果说在1~100的这样的一个循环里，可能在第68次循环的最前面写了个if i === 68,continue,那么这次循环后面的代码就不执行了，但是第69次到100次是执行的。而break是结束整个循环，相当于循环条件被破坏了。

ReturnStatement一定得在函数里面去用，它会返回一个函数的值，另外语句还会有跟比较新的generator相关的yield，等到结构化的时候去讲。

其实简单语句里面最核心的就是ExpressionStatement，它是真正的驱动计算机去进行计算的这样的一种语句，剩下的throw，continue，break,return其实都是流程控制，其实整个的JavaScript语言其实就是让计算机完成计算，并且完成一定的流程控制。

##### 复合语句
- BlockStatement
- IfStatement
- SwitchStatement
- IterationStatement
- WithStatement
- LabelledStatement
- TryStatement

BlockStatement是最重要的语句，它是一对花括号中间一个语句的列表，它能够把所有需要单条语句的地方都变成可以用多条语句，是完成语句的树状结构的重要的基础设施。

IfStatement分支结构，条件语句

SwitchStatement多分支结构，不建议在JavaScript里面使用。因为它在C++或者C里面，它其实性能是会比连续的if要高的，但在JavaScript里面肯定是没有区别的，而且特别容易写错，它每一个case后面都要写一个break，如果写错了就会出一定的问题，可以用多个if else结构去代替switch。

IterationStatement循环，它不是一个语句，有一大堆，while循环do-while循环， for循环，for await循环。

WithStatement是广受诟病的一个表达式，它可以通过with打开一个对象，然后把这个对象的所有属性直接放进作用域里面去，而这个在写法上是可以节约一些空间，也可以节约一些记忆的成本，它实际上带来的不确定性非常的高，所以说一般的现代的JavaScript的编程规范里面，都是拒绝使用WithStatement的。

LabelledStatement就是在简单的语句的前面加上一个label，当然它也可以在复合语句的前面加上一个label，一个相当于给语句取了一个名字，所以说LabelledStatement是可以给任何语句用的，但是实际上真正有效的地方，比如说给if语句起一个label，它其实是没有任何意义的，但是IterationStatement配上Labelled然后再配上break，continue这种后面带label的，那么它就会产生意义了。

TryStatement是一个三段结构，它包含了try catch 和 finally 三个结构，要注意在try里面它其实不是BlockStatement，它的花括号是由try语句去定义的，在这个上面要注意一下，所以try是不能够省略花括号的。

##### Block
BlockStatement

{
    
    ...
    
    ...
    
    ...
    
}
- [[type]]:normal
- [[value]]: --
- [[target]]: --

它是一个可以容纳多个语句的这样的一个Block，一般来说返回值是normal，它的value和target不明，如果里面有break continue这种东西，它也随时可以变成相应的值。

##### Iteration
-  while(...)...
- do...while(...);
- for(==...==;...;...)......
- for(==...== in ...)......
- for(==...== of ...)......
- for await(of)

- var
- const/let
- in

while圆括号里面跟一个表达式，然后后面是一个Statement；do-while是先一个Statement然后后面有一个while表达式；while和do-while非常的相似，它们两个其实没有本质上的区别，然后它只是说do-while它至少会执行一次，while有可能一次都不执行，它这个里面是一个表达式跟语句的复合的结构关系，还跟实际的它的表达式有一个结构的关系，这就是语句里面的结构的一个复杂性。

for家族主要可以分为for;(分号)，for in 和 for of,for of是一个比较新的特性，for;(分号)，for in都是JavaScript语言。
黄色部分都是可以加变量声明的，所以说可以加var 可以加const也可以加let，它们各自会产生不同的声明的效果，要注意的是let声明的域，for语句是会产生一个独立的let声明的作用域的，它跟它里面的部分的语句，它是两个作用域，但是它在作用域的外层，所以说不同的循环之间是可以改变声明的变量，比如i的值有for i =0~100，它的值是能够改变并且是跨循环保存的。

for await(of)介绍异步的时候讲，它其实是for of的一个await的版本，它对应的是Async Generator.

因为for in 用掉了in 这个字符，所以说在for循环的结构里面，大部分是不允许in操作符的出现，JavaScript标准里面所有的语句基本上都会有in的版本和没有in 的版本两个。

##### 标签、循环、break、continue
- LabelledStatement
- IterationStatement
- ContinueStatement
- BreakStatement
- SwitchStatement

- [[type]]:break continue
- [[value]]:--
- [[target]]: label

break后面可以跟一个标识符的名字，就是label;当多层循环嵌套的时候，break适合在多层嵌套的循环语言语句里面去使用，这种带label的break，它可以一下子跳出多层的循环，就可以节省很多if语句的判断和一些逻辑。

##### try
try{
    
}catch(){
    
}finally{
    
}

- [[type]]:return
- [[value]]: --
- [[target]]: label

try的花括号一定得有，然后catch会产生一个作用域，那么再catch里面就会让catch后边圆括号里面的变量被赋值为try里面抛出来的错误，同样是可以有label的，return按理说它会造成一种打断性的结构，即使在try里面return了，finally里面的代码也一定会继续执行。

## JS语句|声明
#### 声明
- FunctionDeclaration
- GeneratorDeclaration
- AsyncFunctionDeclaration
- AsyncGeneratorDeclaration
- VariableStatement
- ClassDeclaration
- LexicalDeclaration

印象里有函数声明还有类的声明和变量声明这么几种，在JavaScript语法树里面声明的定义不是特别的统一，一般来说我们认为是声明的变量声明它基于就是用var关键字进行的变量声明，它也会被归类到语句里面去，看语法会发现有一堆的函数声明，const和let被归为LexicalDeclaration。

其实凡是这些有对后续的语句发生作用的这种语句，都把它归类成了声明，所以这里分出来的声明是一个跟JavaScript标准并不完全一致。

function是一个非常特殊的一种声明，它有四种形态，function关键字后面加*它就是一个generator声明，function前面加Async关键字，那么就是一个异步的函数声明，两个都加就是异步的产生器，这样的一个声明。

VariableStatement变量声明，既有声明的作用，又有实际的执行计算的能力，在JavaScript里面它的语法上把它划归了语句。

ClassDeclaration const 和let这三个新加的行为相对来说比较统一，老的function和var它的行为又是比较统一的。

const 和let又被统称为LexicalDeclaration。


function ,function * ,async function ,async function * ,var这5个都有一个共同的特点，作用范围只认function body;而且它是没有先后关系的，永远被当做出现在函数的第一行一样去处理，所以function你写在这个函数尾也是没有关系的，那么你在一个函数体里面，你再声明一个局部的function，写在最尾巴上面，但是你在前面一样可以访问到这个function。

var它比较特殊，var的声明作用是相当于出现在函数的头部，但是实际上后面的表达式，var a=1,这个变量已经被声明为了一个函数级的局部变量，但是它后面的一个赋值并没有发生，这是它跟function声明的一个区别。

class const和let这三个声明也有一个共性，当在声明之前去使用的时候，它就会报错，这个并不是说他们的声明就没有作用，比如你在外面声明了一个class a，你在函数的里面又声明了一个class a ，这个时候你在里面class a的声明之前，访问这个a它就会给你抛错，然后const和let也一样，它实际上也是有一个预处理的能力的，只是说它确保了你只要在它声明之前使用，这三个是新加的特性，

可以看到上面的function和var的行为，可以理解为一种历史包袱，下面才是现代JavaScript的语言编委会希望它变成的一种样子，鼓励尽量使用class const 和let这种风格的声明。

#### 预处理(pre-process)
预处理是指在一段代码执行之前，JavaScript引擎会对代码本身做一次预先处理，这样的一种机制。

```
var a = 2;
void function(){
    a = 1;
    return;
    var a;
}();
console.log(a);
```
在上面的例子中，理论上讲var a在return之后并不会执行到，但是预处理不管这些，预处理会提前找到所有的var声明的变量，并且让它生效，所以这个a = 1;确实被声明到了这个function的作用域之内，

如果执行这段代码，会发现打印出来的结果是2，就是说a=1并没有改到外面这个var a=2的这个a,它被里面的var a给占据了，这就是所谓的预处理机制造成的咱们的代码的一个执行的效果。

需要特别注意，var不管是写在函数的里面的哪一个位置，不管是写在if里面还是写在return之后，甚至写在catch里面finally里面，都没有任何区别，都会被预处理挑出来，把这个变量声明到这个函数的作用域级别。

```
var a = 2;
void function (){
    a = 1;
    return;
    const a;
}();
console.log(a);
```
把var换成const之后，会发现这个变量a成为了一个局部的变量，它还是会执行抛错，并且它其实并没有影响到外边的变量a，也就是说如果我们给这个函数的外面套一个try catch，最后你会发现打印出来的结果仍然是2.

这里需要强调的是，所有的声明都是有预处理机制的，它都能够把变量变成一个局部变量，区别是const声明，它在声明之前使用的话，它会抛错，而且这个错误是可以被try和catch去处理的。

#### 作用域

```
var a = 2;
void function (){
    a=1;
    {
        var a;
    }
}();
console.log(a);
```

```
var a = 2;
void function (){
    a=1;
    {
        const a;
    }
}();
console.log(a);
```
早期的JavaScript中，var和function这样的声明它的作用范围是整个的函数体，不管你把var写在哪里，外面套什么，它最终的作用域都是这个函数体。

const的作用域就在它所在的花括号，如果是在循环语句，用了const或者let声明，它的作用域就是整个循环语句，它比循环语句里面的花括号范围要大，因为它每次循环都不产生新的。

const声明的范围就是自己外层的block语句。

## JS结构化|宏任务和微任务
#### JS执行粒度
- 宏任务
- 微任务(Promise)
- 函数调用(Execution Context)
- 语句/声明(Completion Record)
- 表达式(Reference)
- 直接量/变量/this......

宏任务就是传给JavaScript引擎的任务，微任务就是在JavaScript引擎内部的任务，宏任务是最大粒度的一个范围，而微任务是一个由Promise来产生的，在JavaScript里面只有Promise会产生微任务，微任务里面可能会分成几个不同的函数调用，然后在下一层就是这个语句和声明，在下一层就是讲过的表达式和再下层的直接量。

#### 宏任务和微任务

```
var x = 1;
var p = new Promise(resolve => resolve());
p.then(()=> x = 3);
x = 2;
```

对于JavaScript引擎来讲，它其实是一个静态的库的这样的一个形式，那么我们在使用JavaScript引擎的时候，我们会把一段代码传给它，这段代码并不是一个完全顺次执行的代码,这个代码里有一个promise和then的这样的一个逻辑，因为这个then已经被resolve掉了，所以说它会立即继续执行，在JavaScript标准里定义，then后面的代码应该是异步执行的，所以最后得到的结论是：

```
x = 1
p = ...
x = 2
```
```
x = 3
```
上面这两个异步任务我们就把它称作一个MicroTask(Job)，然后最后会得到运行的结果就是3，因为有两个微任务，所以说其实最后输出的结果是其中的一个微任务的结论。

那么把这段代码塞给引擎并且进行执行的整个过程，我们就会把它称作一个MicroTask，一个宏任务。这就是宏任务和微任务的区别。

#### 事件循环

```
graph LR
A[wait]-->B[get code]
B-->C[execute]
C-->A
```
其实事件循环也是跳出了JavaScript的这样的一个概念，它是我们如何去使用JavaScript引擎的这样的过程，事件循环这个词event loop本身是来自于node里面的一个概念，而浏览器里面的有类似的东西，但是一般来说不会叫这个名字。

事件循环其实掰开了说其实它只有三个部分，第一个部分就是获取了一段代码，第二步就是把代码执行掉，然后等待，然后继续获取代码，这个等待的过程中有可能是在等待一个时间，有可能是在等待一个事件，那么一般来说在OC里会把它实现成等待一个锁，然后有不同的条件去触发锁，然后来继续进行执行，所以事件循环它将会是一个独立的线程里面去执行这个事情。

## JS结构化|JS函数调用
#### 函数调用

```
import {foo} from "foo.js"
var i = 0;
console.log(i);
foo();
console.log(i);
i++;
```

```
function foo(){
    console.log(i);
}
export foo;
```
我们假设这里面有一个foo来自一个别的模块很遥远的地方，它也不一定是从模块引入的，也可能是通过全局变量传递的。

这里面一共有5次访问i，这5个i它们访问的是一个吗？答案时否，这个foo函数它里面的代码，它访问的i是foo环境里面定义的i,如果说没有定义这句就会出错。

把代码展开去看

var i = 0;

console.log(i);

==console.log(i);==

console.log(i);

i++;

黑色的部分可以去访问i,被黄色高亮的这段代码，它访问不了这个i=0声明的i，这就出现了一个问题，我们的代码究竟是怎么样去控制才让有些语句能够访问i，有些语句不能访问i。


```
import {foo} from "foo.js"
var i = 0;
console.log(i);
foo();
console.log(i);
i++;
```

```
import {foo2} from "foo.js"
var x = 1;
function foo(){
    console.log(x);
    foo2();
    console.log(x);
}
export foo;
```
```
var y = 2;
function foo2(){
    console.log(y);
}
export foo2;
```
把上面代码展开：

var i = 0;

console.log(i);

==console.log(x);==

++console.log(y);++

==console.log(x);==

console.log(i);

i++;

黄色高亮部分可以访问x变量，下划线代码就可以访问y这个变量，没有高亮的黑字代码就可以访问i这个变量，可以发现它是一个互相对称的一个结构，如果再做一些处理

i：0

```
var i = 0;
console.log(i);
console.log(i);
i++;
```
x:1

```
console.log(x);
console.log(x);
```
y:2

```
console.log(y);
```
这个里面其实形成了一个栈式的这样的一个调用关系，它是一个stack这样的数据结构，所以函数调用本身也会形成一个stack，那么它能访问的变量其实也是可以用一个stack去描述的。

#### Execution Context
##### ECMAScript Code Execution Context
- code evaluation state
- Function 
- Script or Module
- Realm
- LexicalEnvironment
- VariableEnviroment

##### Generator Execution Contexts
- code evaluation state
- Function 
- Script or Module
- Realm
- LexicalEnvironment
- VariableEnviroment
- Generator

实际上Execution Context分成几个不同的种类。

##### LexicalEnvironment
- this
- new.target
- super
- 变量

在更老的版本里面，它是表示里边只存变量；但在新的标准里，2018以后的ES标准里，它就存的东西所有我们执行的时候存的东西几乎都保存在了LexicalEnvironment里面，比如说this值，new.target所创造的Object还有super还有一些我们声明的时候所使用的变量。

##### VariableEnviroment
VariableEnviroment是个历史遗留的包袱，仅仅用于处理var声明。我们var的规则，它是会在函数的body被预处理的时候就把var声明都给处理掉了，但是var声明如果说出现在了eval里面，我们就没有办法通过预处理去识别它，那么专门给eval加var这个去进行处理。

所以所多数时候VariableEnviroment和LexicalEnvironment它两是重合的。

##### Function-Closure
闭包包含代码部分和环境部分

环境部分由一个Object和一个变量的序列来组成的，在JavaScript里面，我们每一个函数它都会带一个它定义时所在的Environment Records，它会把这个Environment Records保存到自己函数对象身上，变成一个属性。

每个函数当然有自己的code,所以不管这个foo2最后被通过参数或者是export，import这样的东西传到哪里去，那么它都会带上y=2的Environment Records，那么这个就是我们的闭包。也是我们Environment Records最后能形成链的这样的一个关键的设施。

##### Realm
就是JavaScript里面就在标准里面定义了一个Realm的东西，规定了在一个JavaScript引擎的实例里面，它所有内置对象都会被放进Realm里面去，那么在不同的realm实例之间，它们是完全互相独立的，所以说也就意味着我们用instanceof有可能会失效，比如使用点做隐式转换的时候，我们也会创建出来这种对象，可能产生Number对象，它们也同样需要用到Realm，然后有了这个Realm之后，我们就可以去执行这些对应的表达式，去描述它们的行为了，而Realm这个东西它是会根据一些外部的条件去创建不同的realm,然后不同的realm实例之间，它们也可以互相传递对象，但是传递过来之后，它的prototype是不一致的.