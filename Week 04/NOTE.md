# 学习笔记
### 字符串分析算法
- 字典树（大量高重复字符串的存储与分析）
- KMP（在长字符串里找模式）
- Wildcard（带通配符的字符串模式）
- 正则（字符串通用模式匹配）
- 状态机（通用的字符串分析）
- LL LR（字符串多层级机构分析） 

#### 字典树（trie）
3499

0015

0002

0007
```
graph LR
A{-}-->B[3]
A{-}-->C[0]

B-->D[4]
C-->E{0}
D-->F[9]

E-->G[1]
E-->H{0}
G-->I[5]
F-->J[9]

H-->K[2]
H-->L[7]
```
#### 在代码中实现字典树
在JavaScript中最适合保存字典树里面分支的一种数据结构就是Object和Map；因为字典树里面只会存字符串，所以说对象和map没有本质的区别；

字典树是哈希树的一种特例，哈希树在字符串领域里面，最直接的应用体现就是字典树；
#### 字典树实现代码

```
//因为字符串会有大量的重复，ab和abc其实它是两个不同的字符串，所以ab后面我们要有一个截止符，用$符不太合适，
//因为字符串里可能含有$内容；为了防止出问题，用Symbol的不可重复的特点来防止
let $ = Symbol("$");
class Trie {
    constructor(){
        this.root = Object.create(null);//为了避免受到Object.prototype原型上面的污染
    }
    //把字符串插入字典树里面
    insert(word){
        //从root开始逐级的把字符串放进树的子树里面去
        let node = this.root;
        for(let c of word){
            //如果子树不存在，就先创建子树
            if(!node[c])
                    node[c] = Object.create(null);
                node = node[c];//翻到对应的位置
        }
        //用一个$来表示截止
        if(!($ in node))
                node[$] = 0;
            node[$] ++;
    }
    //访问树里面出现最多次数的字符串
    most(){
        let max = 0;
        let maxWord = null;
        //遍历整棵树
        let visit = (node, word) => {
            if(node[$] && node[$] > max){
                max = node[$];//重复最多单词的数量
                maxWord = word;//记录下出现最多次数的单词
            }
            for(let p in node){
                visit(node[p], word + p);//在word上追加一个当前的树的名字
            }
        }
        visit(this.root, "");
        console.log(maxWord, max);
    }
}

//产生一个随机的单词
function randomWord(length){
        var s = "";
        for(let i = 0; i < length; i++)
            s += String.fromCharCode(Math.random() * 26 + "a".charCodeAt(0));
        return s;
}

let trie = new Trie();

for (let i = 0; i < 100000; i++) {
        trie.insert(randomWord(4));
}
```

#### KMP匹配算法
是字符串的模式匹配算法，所谓的模式匹配：就是我们差一个字符串里有没有另一个字符串。

Brute-Force(BF)暴力解：时间复杂度 m（原串长度）* n（模式串长度）

#### for example:

pattern：abcdabce

source：abcd==abcdabce==x

通过上帝视角可以一下子看出来，黄的部分跟上面一样，可以匹配上；

通过暴力解的话,

abcdabc==e==（j代表e所在位置）

abcdabc==d==abcex（i代表d所在位置）

从上面可以看出，这个字符串本身就有重复；如果这个字符串自身不重复呢。那么它只要有一个不匹配；那我们可以认为，它可以从头开始了；

abcdabc==e==（j代表e所在位置）

abcdabc==d==abcex（i代表d所在位置）

因为它自身重复，所以匹配搭配d的位置的时候，发现d和e不匹配的时候，就可以了证明它前面的abc肯定是已经匹配的;所以j应该直接移回到d的位置，这时候两个i，j的位置上的d匹配上了。

++abc++==d==abce（j代表d所在位置）

abcd++abc++==d==abcex（i代表d所在位置）

我们就又可以继续同事移动i，j往前走；就不需要回到最前面去，再从b开始再重新匹配了；这种现象，说起来简单，计算机里面要实现的话，我们要关注字符串的自重复行为；

逐位截断字符串，然后再看他们有没有公共的最长子串，

==abc==d++abc++e

bcdabce

cdabce

dabce

==abc==e

bce

ce

e

下面是采用一个表格的形式，我们创建一个跟模式串长度相同的一个数组；然后在这个里面填上到此的时候，已经有几个字母是重复的了；
a | b| c|d|a|b|c|e
---|---|---|---|---|---|---|---
0 | 0| 0|0|0|1|2|3

表格1，在到b的时候前面已经有一个a匹配上了，所以b的下面填1；到c的时候，前面的ab已经匹配上了，所以c的下面填2；到e的时候，前面的abc已经匹配上了，所以e的下面填3；当我们做原串和模式串的对比的时候；如果发现模式串里面的e它不能够匹配的话，那么我们不着急回到最开始的状态，我们先看看前面有几位是重复的。先把模式串里面的位置跳到重复的位置，就是d所在的位置；那么看看d匹配不匹配；如果d也不匹配，d的前面是零；那就要从头再来了。

a | b| ==a==|b|a|b|c
---|---|---|---|---|---|---
0 | 0| ==0==|1|2|3|4
表格2，到c的时候已经有4位匹配上了，那它就会回到a位置处；如果原串里面和c，a都不匹配的话，那它会回到==a==(0)这个位置这；如果还不匹配，就要从头开始了。

上面两个就是kmp回退机制的表格；KMP算法首先我们要根据模式串去算出跳转表格；然后拿跳转表格，去比对原串和模式串。这就是KMP算法的两个部分：第一部分求跳转表格；第二个部分就是进行真正的匹配。

#### KMP实现代码

```
function kmp(source, pattern){
    //计算跳转表格
    let table = new Array(pattern.length).fill(0);
    //开始位置i,已重复的字数j
    {
        let i = 1,j = 0;
        while(i < pattern.length){
            //匹配上了
            if(pattern[i] === pattern[j]){
                ++j , ++i;
                table[i] = j;
            }else{
                if(j > 0){
                    j = table[j];
                }else{
                    ++i;
                }        
            }
        }
    }
    //匹配
    {
        let i = 0; j = 0;
        while(i < source.length){    
            if(pattern[j] === source[i]){
                ++i,++j;
            }else{
                if(j > 0){
                    j = table[j];
                }else{
                    ++i;
                }  
            }
            if(j === pattern.length)
            return true;
        }
        return false;
    }
}
```


#### Wildcard
wildcard有两种通配符：*和?

要想解wildcard这个问题，先简化一下这个问题。考虑两种情况：第一种情况是只有星号的情况；第二种是只有问号的情况。

for example:  

==ab== * cd * abc * ==a ? d==

上面这个模式串，星号到底是匹配多还是匹配少？最后一个星号是尽可能的匹配多的字符，前面两个星号是尽量少匹配；开头ab这段只匹配开头的几个字符，a?b部分只匹配尾巴上的几个字符，这是wildcard里面比较特殊的。剩下的中间的部分，不管有多少段，这个星号相当于一个星号加上一段字符作为一组（就是在这个字符串里面去找一个特定pattern的字符，也就是上面的KMP算法），*cd就是在这个源字符串里面找cd字符； *abc就是在这个源字符串里面找abc这个字符。

如果去掉后面的问号，一个wildcard其实就是若干个KMP来组成的一个格式。如果加上问号，就要写一个比较复杂的算法（带？的KMP），由于带？的KMP有点复杂，除了KMP算法还有正则表达式的exec也可以实现。

如果把wildcard整个转换成正则表达式，它的性能肯定是不合格的。但是可以通过逐段的转换成exec去处理正则表达式的话，那么它的性能就没有什么大问题了。

#### 转换成代码实现

```
function find(source, pattern){
    let startCount = 0;
    //循环pattern串，找出里面有多少个*
    for(let i = 0; i < pattern.length; i++){
        if(pattern[i] === "*")
            startCount ++;
    }
    //处理没有*的情况，就是字符串和pattern串严格的一一匹配
    if(startCount === 0){
        for (let i = 0; i < pattern.length; i++) {
            //除了问号，问号是可以匹配任意字符的；其他的符号就直接过去，一个个比，不一样的话就是不匹配
            if(pattern[i] !== source[i] && pattern[i] !== "?")
                return false;
        }
        return;
    }

    let i = 0;//pattern的位置
    let lastIndex = 0;//原字符串的source的位置

    //逐个的循环，把第一个*之前的匹配过去
    for (i = 0; pattern[i] !== "*"; i++) {
        if(pattern[i] !== source[i] && pattern[i] !== "?")
            return false;
    }

    lastIndex = i;//更新现在源字符串的位置为上面匹配过的i位置

    //循环每个*加模式串的位置；首先找到*，
    for (let p = 0; p < startCount - 1; p++) {
        i++;
        let subPattern = "";//星号后面的格式 参数
        while (pattern[i] !== "*") {
            subPattern += pattern[i];
            i++;
        }
        //把subPattern模式串里面的？替换成正则表达式的语法
        let reg = new RegExp(subPattern.replace(/\?/g, "[\\s\\S]"), "g");//[\\s\\S]正则里面的任意字符，就是？的意思
        reg.lastIndex = lastIndex;//把之前更新的lastIndex(上面匹配到的i位置)赋值给 正则的lastIndex（就是正则开始匹配的位置）

        //console.log(reg.exec(source));
        //没有匹配到，跳出
        if(!reg.exec(source))
            return false;

        lastIndex = reg.lastIndex;
    }

    //从source的尾部开始匹配，匹配最后一节（最后一个*后面的部分）
    for(let j = 0; j <= source.length - lastIndex && pattern[pattern.length - j] !== "*"; j++){
        if(pattern[pattern.length - j] !== source[source.length - j] && pattern[pattern.length - j] !== "?")
            return false;
    }
    return true;
}
```
