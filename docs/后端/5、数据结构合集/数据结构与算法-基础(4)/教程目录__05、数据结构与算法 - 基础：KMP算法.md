# 05、数据结构与算法 - 基础：KMP算法
- 来源：https://ddkk.com/zhuanlan/algorithm/5/5.html
- 分类：数据结构
- 分组：教程目录
## 串的模式匹配算法

子串（模式串）的定位操作通常称为串的模式匹配。

这是串的一种重要操作，很多 软件，若有“编辑”菜单项的话， 则其中必有“查找”子菜单项。

串的顺序存储实现

```java
#include<stdio.h>
#include<string.h>
#define MaxLen 256  /*定义能处理的最大的串长度*/
typedef struct {
    char str[MaxLen]; 
    int  curlen;  /*定义当前实际串长度*/
}SString; 
```

## BF算法设计思想：

- 将主串的第pos个字符和模式的第1个字符比较， 若相等，继续逐个比较后续字符； 若不等，从主串的下一字符（pos+1）起，重新与第一个字符比较。
- 直到主串的一个连续子串字符序列与模式相等 。返回值为S中与T匹配的子序列第一个字符的序号，即匹配成功。
- 否则，匹配失败，返回值 0

```java
int Index(SString *s,SString *t) 
{ * 返回子串t在主串s中的位置。若不存在，则函数值为-1*/   
   int i,j;  i=0; j=0; 
   while(i<s->curlen &&j<t->curlen) {    
       if(s->str[i]==t->str[j]) 
       {  i++; j++;  } 
       else /* 指针后退重新开始匹配 */
       {  i=i-j+1; j=0;  } 
     }
     if(j>=t->curlen) 
         return i-t->curlen+1; 
     else
         return -1;
} 
```

若n为主串长度，m为子串长度，则串的BF匹配算法最坏的情况下需要比较字符的总次数为：

最恶劣情况是：主串前面n-m个位置都部分匹配到子串的最后一位，即这n-m位比较了m次.

但一般情况下BF算法的时间复杂度为O(n+m)

## 模式匹配的一种改进算法——KMP

KMP算法的基本思想：每一趟匹配完成后，利用上一趟匹配的结果，将模式向右滑动尽可能远的一段距离。

其方法是：不回溯指针i，找出主串中第i个字符应和模式串的第几个字符比较。

显然next[j]只与模式串有关，与主串无关

## KMP算法实现

```java
int Index_KMP(SString *s, SString *t)
{
   int next[100],i=0,j=0,v;
   getnext(t,next);/*先求得模式串的next函数值*/
   while(i<s->curlen && j<t->curlen){
      if(j==-1 || s->str[i]==t->str[j])
      { i++; j++;}
      else j=next[j]; /*i不变，j回退*/
   }
   if(j>=t->curlen)
       v=i-t->curlen+1; /*匹配成功*/
   else
       v=-1;   /*匹配失败*/
   return v;
}
```

求next:

```java
void getnext(SString *t, int *next)
{  /*串t即作为目标串又作为模式串*/
    int j,k;
    j=0;k=-1;next[0]=-1;
    while(j<t->curlen-1)  {
       if(k==-1||t->str[j]==t->str[k]) {
          j++;k++;
          if(t->str[j]!=t->str[k])
              next[j]=k;
          else
              next[j]=next[k];
       }
       else k=next[k];
    }
}
```
