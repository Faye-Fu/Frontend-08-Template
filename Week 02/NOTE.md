# 学习笔记
#### 寻路|实现一个地图编辑器
在练习map.html的时候未设置#contrainer的行高导致地图显示的cell下面空隙大；由于严格模式下有默认的line-height。
#####  关于line-height设置的问题
    定义：设置行间的距离（行高）
---

    注释：不允许使用负值

> 默认值：normal

> 继承性：yes

###### 可能的值
- normal:***默认***。相当于***1或者1*.2**
- number:设置数字，此数字会与当前的字体尺寸相乘来设置行间距。
- length:设置固定的行间距。
- %：基于当前字体尺寸的百分比行间距。
- inherit:规定应该从父级元素继承line-height属性的值。

###### 计算line-height
1.百分比

```
body{
    font-size: 16px;
    line-height: 120%;
}
h1{ font-size: 32px; }
p{ font-size: 16px; }
#footer { font-size: 12px; }
```
line-height的百分比值120%和body的文字大小值16px倍用来计算值

16px * 120% = 19.2px

这个值会被层叠下去的元素所继承

所有继承下来的元素会忽略本身的font-size,而使用计算出来的line-height

element | font-size  |  line-height | 计算后的line-height
---|---|---|---
body | 16px|120%|16px*120%=19.2px
h1 | 32px|继承的计算后的值19.2px|19.2px
p | 16px|继承的计算后的值19.2px|19.2px
#footer | 12px|继承的计算后的值19.2px|19.2px

2. 长度

```
    line-height: 20px;
```
长度值20px会被后代元素继承

所有继承下来的元素会忽略本身font-size，而使用继承的line-height;
element | font-size  |  line-height | 计算后的line-height
---|---|---|---
body | 16px|20px|20px
h1 | 32px|继承的值20px|20px
p | 16px|继承的值20px|20px
#footer | 12px|继承的值20px|20px

3. normal

```
    line-height: normal;
```
现在所有继承下来的元素不会忽略font-size,而使用基于font-size算出来的line-height
element | font-size  |  line-height | 计算后的line-height
---|---|---|---
body | 16px|normal|16px*1.2=19.2px
h1 | 32px|normal|32px*1.2=38.4px
p | 16px|normal|16px*1.2=19.2px
#footer | 12px|normal|12px*1.2=13.44px
4. 纯数字

```
    line-height: 1.5;
```
现在所有继承下来的元素使用系数1.5计算line-height
element | font-size  |  line-height | 计算后的line-height
---|---|---|---
body | 16px|1.5|16px*1.5=24px
h1 | 32px|1.5|32px*1.5=48px
p | 16px|1.5|16px*1.5=24px
#footer | 12px|1.5|12px*1.5=18px

一般来说，设置行高为值：纯数字 是最理想的方式，因为其会随着对应的font-size而缩放；

##### 准备数据
首先设计一个数据结构保存这个地图,它有1万个格子 
1. 可以用100*100的二维数组来表示，但是二维数组本身，调用方式的开销很大
2. 一维数组Array(10000).fill(0)

##### 绘制地图
用两层for循环来访问它，便于获得X Y

```
for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
        ...
    }
}
```
##### 编辑地图部分
用一维数组来表示二维矩阵的技巧，用的同余的特性
```
//有墙用 1 表示，没有墙用 0 表示
//画地图
if(map[100 * y + x] == 1)
    cell.style.backgroundColor = "black";
//编辑地图部分
//左键是建墙，右键是清除
cell.addEventListener("mousemove", ()=>{
    if(mousedown){
        if(clear){
            cell.style.backgroundColor = "";
            map[100 * y + x] = 0;
        }else{
            //视觉上的墙，修改背景颜色
            cell.style.backgroundColor = "black";
            //逻辑上的墙，写好地图的位置
            map[100 * y + x] = 1;
        }
    }
});
```
#### 寻路|广度优先搜索
把这个点加入这个集合里面，所有搜索算法的差异部分就在这个集合里面
- queue集合用数组表示，一种数据结构：先进先出，一边进一边出
- javascript的数组是一个天然的对列，天然的栈
- 有shift unshift 和 push pop
- 所以在js里面，它的push如果跟shift相对，那么它就是一个队列
- 它的pop如果跟unshift联合去使用，那么它也是一个队列
- 如果pop 和 push联合去使用，那么它就是一个栈 shift unshift同理（但是一般不用，考虑到js的数组的实现，可能这样的性能会变低）

###### 广度优先搜索 
push和shift
```
function path(map, start, end){
    var queue = [start];

    function insert(x, y){
        if(x < 0 || x >= 100 || y < 0 || y >= 100)
            return ;
        if(map[y * 100 + x])
            return ;
        
        //找到一个点，修改值，以防重复
        map[y * 100 + x] = 2;
        queue.push([x, y]);
    }

    while(queue.length){
        let [x, y] = queue.shift();
        console.log(x, y);
        if(x === end[0] && y === end[1]){
            return true;
        }
        //上下左右 入队的逻辑
        insert(x - 1, y);
        insert(x, y - 1);
        insert(x + 1, y);
        insert(x, y + 1);
    }
    return false;
}
```
如果把上面的push和shift改成push和pop它就变成深度优先搜索
#### 寻路|通过异步编程可视化寻路算法

```
function sleep(t){
    return new Promise(function(resolve){
        setTimeout(resolve, t);
    });
}
async function path(map, start, end){
    ...
    async function insert(x, y){
        ...
        await sleep(30);
        //可视化寻路过程，给走过的点加颜色
        container.children[y * 100 + x].style.backgroundColor = "lightgreen";
        ...
    }

    while(queue.length){
        ...
        await insert(x - 1, y);
        ...
    }
    ...
}
```
#### 寻路|处理路径问题

```
let path = [];
                    
while(x != start[0] || y != start[1]){
    path.push(map[y*100 + x]);
    [x, y] = table[y*100 + x];//解构赋值
    await sleep(30);
    container.children[y*100 + x].style.backgroundColor = "purple";
}
return path;
```
#### 寻路|启发式搜索
修改数据结构：以一定的优先级来提供点的数据结构。

保证每次取的时候都是最小的数据
少挪动数组里面的数据

splice方法不好，它把原位删除了，后面就前移了

Optional作业：将Sorted替换成更好的数据结构  推荐二叉堆

```
class Sorted{
    constructor(data, compare){
        this.data = data.slice();
        this.compare = compare || ((a, b) => a - b);
    }
    take(){
        if(!this.data.length)
            return;
        let min = this.data[0];
        let minIndex = 0;

        for(let i = 1; i < this.data.length; i++){
            if(this.compare(this.data[i], min) < 0){
                min = this.data[i];//最小值保存
                minIndex = i;//最小值的位置保存
            }
        }

        this.data[minIndex] = this.data[this.data.length - 1];//把现在的位置用最后一个元素覆盖
        this.data.pop();//把最后一个元素删除
        return min;//返回这个最小值
    }
    give(v){
        this.data.push(v);//往里面填入值
    }
    get length(){
        return this.data.length;
    }
}
```
