# 学习笔记
### proxy与双向绑定
proxy是强大且危险的一种设计，应用了proxy的代码，预期性会变差，其实proxy的这个特性是专门为底层库来设计的。

#### 基本用法
首先创建一个object，写一点属性；我们可以访问它的a属性，b属性，它其实是一个写死的一个过程，我们没办法在这中间，加入任何监听代码，这样它就是一个不可observe的一个对象，是一个单纯的数据存储；这也是javascript最底层的机制。

```
let object = {
    a: 1,
    b: 2
}
```

如果我们有一个对象，既想要让它设置起来像一个普通对象一样，又想让它能够被监听；就可以通过一个proxy来把它这个object去做一层包裹。

第一个是把object传进去，第二个对象是一个config对象，它包含了所有的我们要对这个po对象去做的钩子，这里做一个简单的钩子set。当我们去设置对象的属性的时候，它就会触发我们的set函数。

```
let po = new Proxy(object, {
    set(obj, prop, val){
        console.log(obj, prop, val);
    }
})
```
当调用(po.a=3)的时候，如果po是一个普通对象的话，那么它任何代码都不会去执行；除非a是一个setter。但是在proxy object上，不管去设置哪一个属性，它都会得到一个不一样的值；如果设置一个po上没有的属性(po.x=5)，可以看到它会默认触发这个set的值，这就是跟getter setter最主要的一个区别。

这个proxy不仅提供了get set属性这样的钩子，有很多原生的操作或者内置函数对对象的操作，它都提供了一个可以拦截它并且改变它行为的这样的一个东西。详情参考mdn。网址是： developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy

object收到的就是proxy这个被代理对象，实际上去调用原始 的object去设置它的值，并不会触发proxy上hook的这些函数。在使用po时，才会执行到proxy对象的行为。object还是原来的object。所以可以把po理解成一个特殊的对象，po这种对象它上面所有的行为都是可以被重新再去指定的。

所以这个object在使用可proxy后，对象行为的这种可预测性会降低；也就是看到一个代码（po.a=3），也许它后面就做了一系列很复杂的操作。所以proxy的特性是一个非常危险的特性。

#### proxy的应用
##### 模仿vue的reactive包
一般的proxy的使用，都是会对对象做某种监听或者是改变它的行为。所以一般对proxy的封装，没有直接去用new Proxy这样的去用；而是把它包进一个函数里。跟promise比较类似。

```
let object = {
    a: 1,
    b: 2
}

let po = reactive(object);

function reactive(object){
    return new Proxy(object, {
        set(obj, prop, val){
            obj[prop] = val;
            console.log(obj, prop, val);
            return obj[prop];
        },
        get(obj, prop){
            console.log(obj, prop);
            return obj[prop];
        }
    })
}
```
上面代码已经基本获得一个能够代理object的行为并且可以去监听它的所有设置属性或者改变属性的行为这样的一个对象了。

在Vue当中用了一个特别的有意思的API，就是可以直接通过effect传一个函数进去。它可以监听po上面的属性，以此来代替这个事件监听的一个机制。下面实现一下粗糙版，因为effect它是接受一个回调函数在这里面的。
```
let callbacks = [];

let object = {
    a: 1,
    b: 2
}

let po = reactive(object);

effect(()=> {
    console.log(po.a);
});

function effect(callback){
    callbacks.push(callback);
}

function reactive(object){
    return new Proxy(object, {
        set(obj, prop, val){
            obj[prop] = val;
            for(let callback of callbacks){
                callback();
            }
            return obj[prop];
        },
        get(obj, prop){
            console.log(obj, prop);
            return obj[prop];
        }
    })
}
```
接下来给reactive和effect之间建立一个这样的连接，在JavaScript里面，其实没有任何的办法能够获取一个函数，它能够访问到所有的变量。实际上即使能获得它访问到哪些变量，也没有任何数据结构可以表示它。

我们虽然没有办法去获得一个函数里面引了哪些变量，但是有办法去调用一下这个函数，看它实际用了哪些变量。如果它引了一个普通的变量，我们也没有办法去监听它，但是它引了一个reactive,就有办法在这个reactive的get里面去获得这样的一个监听的效果。

下面代码基本实现了reactive实现的原理。

```
//要把object作为一个key，让它去找到reactivities;所以改用map保存
let callbacks = new Map();

let usedReactivties = [];//全局的usedReactivties变量

let object = {
    a: 1,
    b: 2
}

let po = reactive(object);

effect(()=> {
    console.log(po.a);
});

function effect(callback){
    usedReactivties = [];//清空
    callback();
    console.log(usedReactivties);

    //循环一下reactivity，每个reactivity是个二元组，0就是这个对象
    for(let reactivity of usedReactivties){
        //对象没有的情况下加进去
        if(!callbacks.has(reactivity[0])){
            callbacks.set(reactivity[0], new Map());
        }
        //第二层是属性，没有话加进去
        if(!callbacks.get(reactivity[0]).has(reactivity[1])){
            callbacks.get(reactivity[0]).set(reactivity[1], []);
        }
        //往callbacks里面添加callback
        callbacks.get(reactivity[0]).get(reactivity[1]).push(callback);
    }

}

function reactive(object){
    return new Proxy(object, {
        set(obj, prop, val){
            obj[prop] = val;
            //有对象有属性的时候循环
            if(callbacks.get(obj))
                if(callbacks.get(obj).get(prop))
                    for(let callback of callbacks.get(obj).get(prop)){
                        callback();
                    }
            return obj[prop];
        },
        get(obj, prop){
            usedReactivties.push([obj, prop]);//往usedReactivties添加一对参数进去
            return obj[prop];
        }
    })
}
```
以上代码还有很多问题，把原始对象改成如下：

```
let object = {
    a: {b: 3},
    b: 2
}
```
如果要调用po.a.b，那么这个对象它是监听不到的，再进行一些处理。就需要对reactive的get和set有一定的要求，当我们get的prop是一个对象的时候，就需要给它套一个reactivity。

```
get(obj, prop){
    usedReactivties.push([obj, prop]);//往usedReactivties添加一对参数进去
    //当prop是个对象的时候
    if(typeof obj[prop] === "object")
        return reactive(obj[prop]);

    return obj[prop];
}
```
因为上面get里面reactive是生成了一个新的Proxy，所以说最后的po.a.b的时候它访问到的proxy跟我们的use effect调用的 那一遍它访问到的proxy，它其实不是同一个；所以需要一张全局的表格来保存它。

下面是实现的代码：
```
//要把object作为一个key，让它去找到reactivities;所以改用map保存
let callbacks = new Map();
//每个对象去调用reactive的时候去加一个缓存
let reactivties = new Map();

let usedReactivties = [];//全局的usedReactivties变量

let object = {
    a: {b: 3},
    b: 2
}

let po = reactive(object);

effect(()=> {
    console.log(po.a.b);
});

function effect(callback){
    usedReactivties = [];//清空
    callback();
    console.log(usedReactivties);
    //循环一下reactivity，每个reactivity是个二元组，0就是这个对象
    for(let reactivity of usedReactivties){
        //对象没有的情况下加进去
        if(!callbacks.has(reactivity[0])){
            callbacks.set(reactivity[0], new Map());
        }
        //第二层是属性，没有话加进去
        if(!callbacks.get(reactivity[0]).has(reactivity[1])){
            callbacks.get(reactivity[0]).set(reactivity[1], []);
        }
        //往callbacks里面添加callback
        callbacks.get(reactivity[0]).get(reactivity[1]).push(callback);
    }

}

function reactive(object){
    //reactive是一个无状态的函数
    //有了就直接获取
    if(reactivties.has(object))
        return reactivties.get(object);

    let proxy = new Proxy(object, {
        set(obj, prop, val){
            obj[prop] = val;
            //有对象有属性的时候循环
            if(callbacks.get(obj))
                if(callbacks.get(obj).get(prop))
                    for(let callback of callbacks.get(obj).get(prop)){
                        callback();
                    }
            return obj[prop];
        },
        get(obj, prop){
            usedReactivties.push([obj, prop]);//往usedReactivties添加一对参数进去
            //当prop是个对象的时候
            if(typeof obj[prop] === "object")
                return reactive(obj[prop]);

            return obj[prop];
        }
    });
    //保存
    reactivties.set(object, proxy);

    return proxy;
}
```
接下来实现双向绑定
```
effect(()=> {
    document.getElementById("r").value = po.r;
});
effect(()=> {
    document.getElementById("g").value = po.g;
});
effect(()=> {
    document.getElementById("b").value = po.b;
});

document.getElementById("r").addEventListener("input", event => po.r = event.target.value);
document.getElementById("g").addEventListener("input", event => po.g = event.target.value);
document.getElementById("b").addEventListener("input", event => po.b = event.target.value);

effect(()=> {
    document.getElementById("color").style.backgroundColor = `rgb(${po.r}, ${po.g}, ${po.b})`;
});
```
调色盘的案例是MVVM模式的一个经典案例

```
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>proxy</title>
        <style>
           
        </style>
    </head>
    <body>
        <input id="r" type="range" min="0" max="255">
        <input id="g" type="range" min="0" max="255">
        <input id="b" type="range" min="0" max="255">
        <div id="color" style="width: 100px;height: 100px;"></div>
    </body>
    <script>
        //要把object作为一个key，让它去找到reactivities;所以改用map保存
        let callbacks = new Map();
        //每个对象去调用reactive的时候去加一个缓存
        let reactivties = new Map();

        let usedReactivties = [];//全局的usedReactivties变量

        let object = {
            r: 1,
            g: 1,
            b: 1
        }

        let po = reactive(object);

        effect(()=> {
            document.getElementById("r").value = po.r;
        });
        effect(()=> {
            document.getElementById("g").value = po.g;
        });
        effect(()=> {
            document.getElementById("b").value = po.b;
        });

        document.getElementById("r").addEventListener("input", event => po.r = event.target.value);
        document.getElementById("g").addEventListener("input", event => po.g = event.target.value);
        document.getElementById("b").addEventListener("input", event => po.b = event.target.value);

        effect(()=> {
            document.getElementById("color").style.backgroundColor = `rgb(${po.r}, ${po.g}, ${po.b})`;
        });

        function effect(callback){
            usedReactivties = [];//清空
            callback();
            console.log(usedReactivties);
            //循环一下reactivity，每个reactivity是个二元组，0就是这个对象
            for(let reactivity of usedReactivties){
                //对象没有的情况下加进去
                if(!callbacks.has(reactivity[0])){
                    callbacks.set(reactivity[0], new Map());
                }
                //第二层是属性，没有话加进去
                if(!callbacks.get(reactivity[0]).has(reactivity[1])){
                    callbacks.get(reactivity[0]).set(reactivity[1], []);
                }
                //往callbacks里面添加callback
                callbacks.get(reactivity[0]).get(reactivity[1]).push(callback);
            }

        }

        function reactive(object){
            //reactive是一个无状态的函数
            //有了就直接获取
            if(reactivties.has(object))
                return reactivties.get(object);

            let proxy = new Proxy(object, {
                set(obj, prop, val){
                    obj[prop] = val;
                    //有对象有属性的时候循环
                    if(callbacks.get(obj))
                        if(callbacks.get(obj).get(prop))
                            for(let callback of callbacks.get(obj).get(prop)){
                                callback();
                            }
                    return obj[prop];
                },
                get(obj, prop){
                    usedReactivties.push([obj, prop]);//往usedReactivties添加一对参数进去
                    //当prop是个对象的时候
                    if(typeof obj[prop] === "object")
                        return reactive(obj[prop]);

                    return obj[prop];
                }
            });
            //保存
            reactivties.set(object, proxy);

            return proxy;
        }
    </script>
</html>
```
### 使用Range和CSSOM做一个综合练习
做一个简单的拖拽

drag有一个对应的dragdrop事件，但并不是我们想要的效果，要用mousedown等进行模拟。

CSS3的transform属性
旋转 div 元素

```
div
{
    transform:rotate(7deg);
    -ms-transform:rotate(7deg); /* IE 9 */
    -webkit-transform:rotate(7deg); /* Safari and Chrome */
}
```
Transform属性应用于元素的2D或3D转换。这个属性允许你将元素旋转，缩放，移动，倾斜等。

##### 语法

值 | 描述
---|---
none | 定义不进行转换。
matrix(n,n,n,n,n,n) | 定义 2D 转换，使用六个值的矩阵。
matrix3d(n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n) | 定义 3D 转换，使用 16 个值的 4x4 矩阵。
translate(x,y) | 定义 2D 转换。
translate3d(x,y,z) | 定义 3D 转换。
translateX(x) | 定义转换，只是用 X 轴的值。
translateY(y) | 定义转换，只是用 Y 轴的值。
translateZ(z) | 定义 3D 转换，只是用 Z 轴的值。
scale(x[,y]?) | 定义 2D 缩放转换。
scale3d(x,y,z) | 定义 3D 缩放转换。
scaleX(x) | 通过设置 X 轴的值来定义缩放转换。
scaleY(y) | 通过设置 Y 轴的值来定义缩放转换。
scaleZ(z) | 通过设置 Z 轴的值来定义 3D 缩放转换。
rotate(angle) | 定义 2D 旋转，在参数中规定角度。
rotate3d(x,y,z,angle) | 定义 3D 旋转。
rotateX(angle) | 定义沿着 X 轴的 3D 旋转。
rotateY(angle) | 定义沿着 Y 轴的 3D 旋转。
rotateZ(angle) | 定义沿着 Z 轴的 3D 旋转。
skew(x-angle,y-angle) | 定义沿着 X 和 Y 轴的 2D 倾斜转换。
skewX(angle) | 定义沿着 X 轴的 2D 倾斜转换。
skewY(angle) | 定义沿着 Y 轴的 2D 倾斜转换。
perspective(n) | 为 3D 转换元素定义透视视图。


```
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>drag</title>
        <style>
            #dragable {
                width: 100px;
                height: 100px;
                background-color: pink;
            }
        </style>
    </head>
    <body>
        <div id="dragable"></div>
    </body>
    <script>
        let dragable = document.getElementById("dragable");//获取元素

        let baseX = 0, baseY = 0;//原始坐标

        //在mousedown的时候监听mouseup和mousemove
        dragable.addEventListener("mousedown", function(event){
            let startX = event.clientX, startY = event.clientY;//开始坐标

            let up = event => {
                baseX = baseX + event.clientX - startX;
                baseY = baseY + event.clientY - startY;
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
            }
            let move = event => {
                //实现2D的旋转
                dragable.style.transform = `translate(${baseX + event.clientX - startX}px, ${baseY + event.clientY - startY}px)`;
            }
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        })
    </script>
</html>
```
以上代码是一个普通拖拽，接下来实现一下在正常流里面的拖拽

首先要看到文字是没有分节点的，需要用Range去找到它这个能拖拽的空位，建一个range表把所有能插的空隙列出来

childNodes 属性返回包含被选节点的子节点的 NodeList。

###### 提示： 
如果选定的节点没有子节点，则该属性返回不包含节点的 NodeList。如需循环子节点列表，使用 nextSibling 属性，要比使用父对象的 childNodes 列表效率更高。

textContent 属性设置或者返回指定节点的文本内容。

如果你设置了 textContent 属性, 任何的子节点会被移除及被指定的字符串的文本节点替换。

###### 提示： 
某些时候 textContent 属性可以被 nodeValue 属性取代，但是请记住这个属性同样可以返回所有子节点的文本。

### Range
#### 简介
Range是一种fragment（HTML片断），它包含了节点或文本节点的一部分。 可以通过document.createRange()或selection象的getRangeAt()方法获得。

createRange()是在2级DOM里定义的一个方法，它属于document对象。IE是不支持此方法的，因此需要检测浏览器的支持性。

```
if (document.implementation && document.implementation.hasFeature && document.implementation.hasFeature("Range", "2.0")) {
    var oRange = document.createRange();    // 支持
} else {
    // 不支持
}
```
#### 属性
当创建一个Range对象后，该对象就有了以下属性，以下属性全为“只读”。

**startContainer**

包含“起点”的节点。“包含”的意思是起点所属的节点。

**endContainer**

包含“结束点”的节点

**startOffset**

“起点”在startContainer中的偏移量。
如果startContainer是文本节点、注释节点或CDATA节点，则返回“起点”在startContainer中字符偏移量。
如果startContainer是元素节点，则返回“起点”在startContainer.childNodes中的次序。

**endOffset**

“起点”在endContainer中的偏移量，其它细节同startOffset。

**commonAncestorContainer**

第一个包含Range的节点，同时包含起点和结束点。

**collapsed**

起点和结束点在一起时为true；Range对象为空（刚createRange()时）也为true。

#### 定位（设置“起点”和“结束点”）的一些方法
##### setStart(node, offset)和setEnd(node, offset)

setStart：设置起点的位置，node是对startContainer的引用，偏移则是startOffset；

setEnd：设置结束点的位置，node是对endContainer的引用，偏移则是startOffset；

##### setStartBefore(referenceNode)、setStartAfter(referenceNode)
##### setEndBefore(referenceNode)、setEndAfter(referenceNode)

setStartBefore：将“起点”设置到referenceNode前

setStartAfter：将“起点”设置到referenceNode后

setEndBefore：将“结束点”设置到referenceNode前

setEndAfter：将“结束点”设置到referenceNode后

注意：使用这四个方法设置的“起点”或“结束点”的父节点与referenceNode的父节点是同一个元素。

##### selectNode(referenceNode)和selectNodeContents(referenceNode)

selectNode：设置Range的范围，包括referenceNode和它的所有后代(子孙)节点。

selectNodeContents：设置Range的范围，包括它的所有后代节点。

##### collapse(toStart)

折叠该范围，使它的“起点”和“结束点”重合。

参数toStart，true时折叠到Range边界的首部，为false时折叠到Range尾部，默认为false。

#### 修改范围的方法
**cloneContents()**

可以克隆选中Range的fragment并返回改fragment。这个方法类似于extractContents()，但是不是删除，而是克隆。

**deleteContents()**

从Dom中删除Range选中的fragment。注意该函数没有返回值（实际上为undefined）。

**extractContents()**

将选中的Range从DOM树中移到一个fragment中，并返回此fragment。

**insertNode**

方法可以插入一个节点到Range中，注意会插入到Range的“起点”。

**surroundContents()**

##### 其它的方法

**cloneRange()**

var oNewRange = oRange.cloneRange();
cloneRange()方法将返回一个当前Range的副本，它也是Range对象。
注意它和cloneContents()的区别在于返回值不同，一个是HTML片段，一个是Range对象

compareBoundaryPoints()

**detach()**

虽然GC（垃圾收集器）会将其收集，但用detach()释放range对象是一个好习惯。语法为：oRange.detach();

**toString()**

返回该范围表示的文档区域的纯文本内容，不包含任何标签。

实现代码
```
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>drag</title>
        <style>
            #dragable {
                display: inline-block;
                width: 100px;
                height: 100px;
                background-color: pink;
            }
        </style>
    </head>
    <body>
        <div id = "container">文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字 
            文字 文字 文字 文字 文字 文字 文字 文字</div>
        <div id="dragable"></div>
    </body>
    <script>
        let dragable = document.getElementById("dragable");//获取元素

        let baseX = 0, baseY = 0;//原始坐标

        dragable.addEventListener("mousedown", function(event){
            let startX = event.clientX, startY = event.clientY;

            let up = event => {
                baseX = baseX + event.clientX - startX;
                baseY = baseY + event.clientY - startY;
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
            }
            let move = event => {
                let range = getNearest(event.clientX, event.clientY);
                range.insertNode(dragable);//在dragable范围内容之前插入节点
            }
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        })

        let ranges = [];

        let container = document.getElementById("container");

        //列出所有能插的空隙
        for(let i = 0; i < container.childNodes[0].textContent.length; i++){
            let range = document.createRange();
            range.setStart(container.childNodes[0], i);//设置起始点的位置
            range.setEnd(container.childNodes[0], i);//设置结束点的位置

            console.log(range.getBoundingClientRect());//确定文本区域中选中的部分或光标的视窗坐标
            ranges.push(range);
        }

        //找到离某一个点最近的range
        function getNearest(x, y){
            let min = Infinity;
            let nearest = null;

            for(let range of ranges){
                //range是不会变的，但是BoundingClientRect是CSSOM，一旦页面发生变化，它就会发生变化
                let rect = range.getBoundingClientRect();//确定文本区域中选中的部分或光标的视窗坐标
                let distance = (rect.x - x) ** 2 + (rect.y - y) ** 2;//勾股定理
                if(distance < min){
                    nearest = range;
                    min = distance;
                }
            }
            return nearest;
        }

        document.addEventListener("selectstart", event => event.preventDefault());//去除选中效果
    </script>
</html>
```
