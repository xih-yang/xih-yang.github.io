# 26、CSS高级技巧 - 溢出的文字省略号显示
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/26.html
- 分类：前端框架
- 分组：教程目录
## 溢出的文字省略号显示

### 1.单行文本溢出显示省略号–必须满足三个条件

```css
/*1. 先强制一行内显示文本*/    
white-space: nowrap;  （ 默认 normal 自动换行）   
/*2. 超出的部分隐藏*/    
overflow: hidden;   
/*3. 文字用省略号替代超出的部分*/    
text-overflow: ellipsis;
```

### 2.多行文本溢出显示省略号

```css
overflow: hidden; 
text-overflow: ellipsis; /* 弹性伸缩盒子模型显示 */ 
display: -webkit-box; /* 限制在一个块元素显示的文本的行数 */ 
-webkit-line-clamp: 2; /* 设置或检索伸缩盒对象的子元素的排列方式 */ 
-webkit-box-orient: vertical; 
```

多行文本溢出显示省略号，有较大兼容性问题， 适合于webKit浏览器或移动端（移动端大部分是webkit内 核）
