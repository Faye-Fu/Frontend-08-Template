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