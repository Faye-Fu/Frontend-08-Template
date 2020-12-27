#学习笔记
## 实现三子棋的技术点
1. 绘制棋盘 
    循环遍历一维数组
    
```
for(let i = 0; i < 3; i++){
	for(let j = 0; j < 3; j++){
		//i * 3 + j用来对应一维数组里面的索引
	}
}
```

2. 落子
    在点击的格子里面写入棋子

```
cell.innerText = 
	pattern[i * 3 + j] == 1 ? "⭕️" :
	pattern[i * 3 + j] == 2 ? "❌" :
	"";
```

3. 判断输赢
    分别检查同行，同列，左斜，右斜

```
pattern[i * 3 + j] !== color //行
pattern[j * 3 + i] !== color //列
pattern[j * 3 + j] !== color //左斜
pattern[j * 3 + 2-j] !== color  //右斜
```

4. 选择最优落子位置

```
//循环查找最优落子点
outer:for(let i = 0; i < 3; i++){
	for(let j = 0; j < 3; j++){
		if(pattern[i * 3 + j] !== 0)
			continue;
		let tmp = clone(pattern);
		tmp[i * 3 + j] = color;
		let opp = bestChoice(tmp, 3 - color);

		if(- opp.result >= result){
			point = [j, i];
			result = - opp.result;
		}
		if(result == 1)
			break outer;
	}
}
```
## 异步机制
- callback回调
- Promise（v5后）
- async/await（基于Promise语法上的支持和封装，实际上也是靠的promise机制）
#### 红绿灯的实现 绿灯10秒，黄灯2秒，红灯5秒，依次循环
#### callback

```
function go(){
    green();
    setTimeout(function(){
        yellow();
        setTimeout(function(){
           red();
           setTimeout(function(){
               go();
           },5000);
        },2000);
    },10000);
}

```
#### Promise

```
function sleep(t){
    return new Promise((resolve,reject)=>{
        setTimeout(resolve,t);
    });
}
function go(){
    green();
    sleep(10000).then(()=>{
        yellow();
        return sleep(2000);
    }).then(()=>{
        red();
        return sleep(5000);
    }).then(go)
}
```
#### async/await


```
function sleep(t){
    return new Promise((resolve,reject)=>{
        setTimeout(resolve,t);
    });
}

async function go(){
    while(true){
        green();
        await sleep(10000);
        yellow();
        await sleep(2000);
        red();
        await sleep(5000);
    }
}
```
