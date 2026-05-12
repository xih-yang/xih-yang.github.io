# 25、CSS高级技巧 - 解决图片底部默认空白缝隙问题
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/25.html
- 分类：前端框架
- 分组：教程目录
## 项目场景：

> bug：图片底侧会有一个空白缝隙，原因是行内块元素会和文字的基线对齐。

## 解决方法

> 1. 给图片添加 vertical-align:middle | top| bottom 等。 （提倡使用的）
>
> 2. 把图片转换为块级元素 display: block;
