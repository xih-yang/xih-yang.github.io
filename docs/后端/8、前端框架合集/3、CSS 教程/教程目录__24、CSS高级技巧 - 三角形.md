# 24、CSS高级技巧 - 三角形
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/24.html
- 分类：前端框架
- 分组：教程目录
## 三角形

> 三角形：将盒子的宽和高设置为0，只给盒子的边框设置宽度

```css
 div {
     width: 0; 
     height: 0; 
     border: 50px solid transparent;  
     border-left-color: pink; 
 }
 //transparent:设置边框颜色为透明色
 //设置左边框颜色为粉色
 //上下左右边框设置相同的大小，并且设置三个边框颜色透明，剩下的边框以三角形的形式展现
```
