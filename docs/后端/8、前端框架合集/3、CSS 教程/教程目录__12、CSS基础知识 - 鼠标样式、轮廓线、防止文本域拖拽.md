# 12、CSS基础知识 - 鼠标样式、轮廓线、防止文本域拖拽
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/12.html
- 分类：前端框架
- 分组：教程目录
## 一、鼠标样式 cursor

> cursor： 设置或检索在对象上移动的鼠标指针采用何种系统预定义的光标形状

```css
li {
  cursor: pointer; 
} 
```

属性值
描述

default
小白，默认

pointer
小手

move
移动

text
文本

not-allowed
静止

## 二、轮廓线 outline

> 给表单添加 outline: 0; 或者 outline: none; 样式之后，就可以去掉默认的蓝色边框

```css
 input {
     outline: none; 
   }
```

## 三、防止拖拽文本域 resize

> 文本域可以随意变大变小可能会影响其他页面的布局
>
> 实际开发中，我们文本域右下角是不可以拖拽的
>
> textarea{
>
> resize: none;
>
> }
