function getStyle(element){
    if(!element.style)
        element.style = {};
    
    for(let prop in element.computedStyle){
        var p = element.computedStyle.value;
        //新加的style对象用来存最后计算出来的属性
        element.style[prop] = element.computedStyle[prop].value;

        //px标识的属性变成数字
        if(element.style[prop].toString().match(/px$/)){
            element.style[prop] = parseInt(element.style[prop]);
        }
        //纯数字的转换一下类型
        if(element.style[prop].toString().match(/^[0-9\.]+$/)){
            element.style[prop] = parseInt(element.style[prop]);
        }
    }
    return element.style;
}

function layout(element){
    //没有computedStyle元素跳过
    if(!element.computedStyle)
        return ;
    //对style进行预处理
    var elementStyle = getStyle(element);
    //不是flex的就跳过
    if(elementStyle.display !== 'flex')
        return
    //过滤element文本节点
    var items = element.children.filter(e => e.type === 'element');

    items.sort(function(a,b){
        return (a.order || 0) - (b.order || 0);
    });

    var style = elementStyle;

    ['width', 'height'].forEach(size => {
        if(style[size] === 'auto' || style[size] === ''){
            style[size] = null;
        }
    });

    if(!style.flexDirection || style.flexDirection === 'auto')
        style.flexDirection = 'row';
    if(!style.alignItems || style.alignItems === 'auto')
        style.alignItems = 'stretch';
    if(!style.justifyContent || style.justifyContent === 'auto')
        style.justifyContent = 'flex-start';
    if(!style.flexWrap || style.flexWrap === 'auto')
        style.flexWrap = 'nowrap';
    if(!style.alignContent || style.alignContent === 'auto')
        style.alignContent = 'stretch';
    
    var mainSize,mainStart,mainEnd,mainSign,mainBase,
        crossSize,crossStart,crossEnd,crossSign,crossBase;
    if(style.flexDirection === 'row'){
        mainSize = 'width';//主轴尺寸
        mainStart = 'left';
        mainEnd = 'right';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    if(style.flexDirection === 'row-reverse'){
        mainSize = 'width';
        mainStart = 'right';
        mainEnd = 'left';
        mainSign = -1;
        mainBase = style.width;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }

    if(style.flexDirection === 'column'){
        mainSize = 'height';
        mainStart = 'top';
        mainEnd = 'bottom';
        mainSize = +1;
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    if(style.flexDirection === 'column-reverse'){
        mainSize = 'height';
        mainStart = 'bottom';
        mainEnd = 'top';
        mainSign = -1;
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }
    //反向换行
    if(style.flexWrap === 'wrap-reverse'){
        var tmp = crossStart;
        crossStart = crossEnd;
        crossEnd = tmp;
        crossSign = -1;
    }else{
        crossBase = 0;
        crossSign = 1;
    }

    //首先判断一个情况，如果父元素没有设置主轴尺寸，比如说它的主轴是width属性，
    //那么父元素是没有width的，那么就会进入一个模式叫做AutoMainSize
    //AutoMainSize意思是因为父元素反正也没设置主轴尺寸，所以说由子元素把它撑开，这种情况下，它的尺寸无论如何都不会超
    var isAutoMainSize = false;
    if(!style[mainSize]){
        elementStyle[mainSize] = 0;
        for(var i = 0; i < items.length; i++){
            var item = items[i];
            if(itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0))
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
        }
        isAutoMainSize = true;
    }

    var flexLine = [];
    var flexLines = [flexLine];
    
    var mainSpace = elementStyle[mainSize];//剩余空间
    var crossSpace = 0;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var itemStyle = getStyle(item);

        if(itemStyle[mainSize] === null){
            itemStyle[mainSize] = 0;//没设主轴尺寸，默认值给设置成0
        }

        //有flex属性的时候，说明这个元素是可伸缩的
        if(itemStyle.flex){
            flexLine.push(item);
        }else if(style.flexWrap === 'nowrap' && isAutoMainSize){
            mainSpace -= itemStyle[mainSize];
            //如果item的交叉轴尺寸不是null
            if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);//取最高的元素的高
            flexLine.push(item);
        }else{
            //换行
            if(itemStyle[mainSize] > style[mainSize]){
                itemStyle[mainSize] = style[mainSize];//父元素尺寸过大压缩到和主轴尺寸一样大
            }
            //主轴里面剩余空间不足的时候采取换行
            if(mainSpace < itemStyle[mainSize]){
                //在行上存上
                flexLine.mainSpace = mainSpace;//主轴的剩余空间
                flexLine.crossSpace = crossSpace;//交叉轴的空间
                flexLine = [item];//创建一个新行
                flexLines.push(flexLine);
                mainSpace = style[mainSize];
                crossSpace = 0;
            }else{
                flexLine.push(item);//放得下就存进去
            }
            if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
                crossSpace = Math.max(crossSpace, itemStyle[crossSpace]);
            mainSpace -= itemStyle[mainSize];//减掉主轴空间里面

        }
    }    
    flexLine.mainSpace = mainSpace;//给最后一行加上mainspace

    // console.log(items);

    if(style.flexWrap === 'nowrap' || isAutoMainSize){
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
    }else{
        flexLine.crossSpace = crossSpace;
    }

    //做等比压缩
    if(mainSpace < 0){
        //style[mainSize]是容器的主轴尺寸 - mainSpace就相当于期望的尺寸
        var scale = style[mainSize] / (style[mainSize] - mainSpace);
        var currentMain = mainBase;
        for(var i = 0; i < items.length; i++){
            var item = items[i];
            var itemStyle = getStyle(item);
            //flex不参加等比压缩
            if(itemStyle.flex){
                itemStyle[mainSize] = 0;
            }
            //主轴尺寸乘以压缩比例
            itemStyle[mainSize] = itemStyle[mainSize] * scale;

            itemStyle[mainStart] = currentMain;//当前排到的位置
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];//当前的位置设置成mainEnd
        }
    }else{
        //多行的时候
        flexLines.forEach(function (items){
            var mainSpace = items.mainSpace;
            var flexTotal = 0;
            for(var i = 0; i < items.length; i++){
                var item = items[i];
                var itemStyle = getStyle(item);

                if((itemStyle.flex !== null) && (itemStyle.flex !== (void 0))){
                    flexTotal += itemStyle.flex;
                    continue;
                }
            }

            if(flexTotal > 0){
                //有flex元素的时候
                var currentMain = mainBase;
                for(var i =0; i < items.length; i++){
                    var item = items[i];
                    var itemStyle = getStyle(item);
                    //（每一行主轴元素剩余的空间mainSpace/flex总值）再乘以自己的flex实现等比划分
                    if(itemStyle.flex){
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                }
            }else{
                //没有flex元素的时候，主轴方向的剩余空间根据justifyContent规则去进行分配
                //从左往右排
                if(style.justifyContent === 'flex-start'){
                    var currentMain = mainBase;
                    var step = 0;
                }
                //从右往左排
                if(style.justifyContent === 'flex-end'){
                    var currentMain = mainSpace * mainSign + mainBase;
                    var step = 0;
                }
                //左右各留一个边
                if(style.justifyContent === 'center'){
                    var currentMain = mainSpace / 2 * mainSign + mainBase;
                    var step = 0;
                }
                //所有元素的间隔 items.length - 1的间隔
                if(style.justifyContent === 'space-between'){
                    var step = mainSpace / (items.length - 1) * mainSign;
                    var currentMain = mainBase;
                }
                //前后也有间隔
                if(style.justifyContent === 'space-around'){
                    var step = mainSpace / items.length * mainSign;
                    var currentMain = step / 2 + mainBase;
                }

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    itemStyle[mainStart, currentMain];
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                }
            }
        });
    }

    var crossSpace;

    if(!style[crossSize]){
        //父元素没有行高，那么crossSpace永远为0
        crossSpace = 0;
        elementStyle[crossSize] = 0;
        //加上撑开的高度
        for(var i = 0; i < flexLines.length; i++){
            elementStyle[crossSize] = elementStyle[crossSize] + flexLines[i].crossSpace;
        }
    }else{
        //有行高，就要把总的crossSize依次减掉每一行的crossSize
        crossSpace = style[crossSize];
        for(var i = 0; i < flexLines.length; i++){
            crossSpace -= flexLines[i].crossSpace;
        }
    }

    //从尾巴往头去排布
    if(style.flexWrap === 'wrap-reverse'){
        crossBase = style[crossSize];
    }else{
        crossBase = 0;
    }
    //每一行的lineSize会等于总体的交叉轴尺寸除以行数
    var lineSize = style[crossSize] / flexLines.length;

    var step;
    if(style.alignContent === 'flex-start'){
        crossBase += 0;
        step = 0;
    }
    if(style.alignContent === 'flex-end'){
        //起始位置尾部
        crossBase += crossSign * crossSpace;
        step = 0;
    }
    if(style.alignContent === 'center'){
        //起始位置中间
        crossBase += crossSign * crossSpace / 2;
        step = 0;
    }
    if(style.alignContent === 'space-between'){
        //起始位置左
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);
    }
    if(style.alignContent === 'space-around'){
        step = crossSpace / (flexLines.length);
        crossBase += crossSign * step / 2;
    }
    if(style.alignContent === 'stretch'){
        crossBase += 0;
        step = 0; 
    }
    flexLines.forEach(function (items){
        //当前行的真实的交叉轴尺寸
        var lineCrossSize = style.alignContent === 'stretch' ?
            items.crossSpace + crossSpace / flexLines.length :
            items.crossSpace;
        
        for(var i = 0; i <  items.length; i++){
            var item = items[i];
            var itemStyle = getStyle(item);
            
            //align受每个元素的alignSelf影响或者父元素的alignItems
            var align = itemStyle.alignSelf || style.alignItems;
            
            //没有交叉轴尺寸
            if(itemStyle[crossSize] === null)
                itemStyle[crossSize] = (align === 'stretch') ?
                lineCrossSize : 0;
            
            if(align === 'flex-start'){
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            
            if(align === 'flex-end'){
                itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
            }

            if(align === 'center'){
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }

            if(align === 'stretch'){
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) ? 
                itemStyle[crossSize] : lineCrossSize);

                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart]);
            }
        }
        //每一行都会去影响交叉轴的位置
        crossBase += crossSign * (lineCrossSize + step);
    });
    console.log('items',items);
    
}

module.exports = layout;