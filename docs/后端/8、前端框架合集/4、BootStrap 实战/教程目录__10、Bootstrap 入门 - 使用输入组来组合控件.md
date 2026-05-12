# 10、Bootstrap 入门 - 使用输入组来组合控件
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/10.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

Bootstrap还提供了一种组合使用表单控件的方式，即输入组。可以为输入控件添加前置、后置的补充内容。

注意补充内容可以是文本，也可以是其他表单控件。

## 2. 使用输入组

输入组的使用并不复杂，通过`.input-group`类修饰的元素包裹输入控件，然后在输入控件的前、后添加`.input-group-addon`类修饰的元素即可。

代码如下：

```java
<div class="col-md-6">
    <div class="form-group">
        <div class="input-group">
            <div class="input-group-addon">￥</div>
            <input type="text" class="form-control">
            <div class="input-group-addon">元</div>
        </div>
    </div>
</div>
<div class="col-md-6">
    <div class="form-group">
        <div class="input-group">
            <div class="input-group-addon">
                <input type="checkbox">
            </div>
            <input type="text" class="form-control">
        </div>
    </div>
</div>
```

效果如下，可见使用输入组后，确实样式好看了许多。

## 3. 调整输入组的大小

输入组同样可以通过设置样式类，来调整整个输入组元素的大小。

代码如下，我们为输入组设置了`.input-group-lg`和`.input-group-sm`。

```java
<div class="col-md-6">
    <div class="form-group">
        <div class="input-group input-group-lg">
            <div class="input-group-addon">￥</div>
            <input type="text" class="form-control">
            <div class="input-group-addon">元</div>
        </div>
    </div>
</div>
<div class="col-md-6">
    <div class="form-group">
        <div class="input-group input-group-sm">
            <div class="input-group-addon">￥</div>
            <input type="text" class="form-control">
            <div class="input-group-addon">元</div>
        </div>
    </div>
</div>
```

对比效果如下，左上角为默认尺寸，左下角为大号尺寸，右下角为小号尺寸。

## 4. 小结

Bootstrap输入组提供了一种组合使用控件的方式，样式更加美观，也比较实用。
