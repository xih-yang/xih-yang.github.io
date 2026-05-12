# 08、jQuery 实战 - jQuery 表单选择器
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/8.html
- 分类：前端框架
- 分组：教程目录
## 表单选择器

### 1、:input

用法:`$(”:input”);`

返回值：集合元素。

说明：匹配所有 input, textarea, select 和 button 元素。

### 2、:text

用法:`$(”:text”);`

返回值：集合元素。

说明：匹配所有的单行文本框。

### 3、:password

用法:`$(”:password”);`

返回值：集合元素。

说明：匹配所有密码框。

### 4、:radio

用法：`$(”:radio”);`

返回值：集合元素。

说明：匹配所有单选按钮。

### 5、:checkbox

用法:`$(”:checkbox”);`

返回值：集合元素。

说明：匹配所有复选框。

### 6、:submit

用法:`$(”:submit”);`

返回值：集合元素。

说明：匹配所有提交按钮。

### 7、:image

用法:`$(”:image”);`

返回值：集合元素。

说明：匹配所有图像域。

### 8、:reset

用法:`$(”:reset”);`

返回值：集合元素。

说明：匹配所有重置按钮。

### 9、:button

用法:`$(”:button”);`

返回值：集合元素。

说明：匹配所有按钮。这个包括直接写的元素 button。

### 10、:file

用法:`$(”:file”);`

返回值：集合元素。

说明：匹配所有文件域。

### 11、:hidden

用法:`$(”input:hidden”);`

返回值：集合元素。

说明：匹配所有不可见元素，或者 type 为 hidden 的元素。这个选择器就不仅限于表单了，除了匹配 input 中的 hidden 外，那些 style 为 hidden 的也会被匹配。

注意:要选取 input 中为 hidden 值的方法就是上面例子的用法，但是直接使用 `“:hidden”` 的话就是匹配页面中所有的不可见元素，包括宽度或高度为 0 的！

如有错误，欢迎指正！
