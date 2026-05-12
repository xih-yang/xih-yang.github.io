# 09、Bootstrap 入门 - 使用表单控件
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/9.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

表单控件用来获取表单中输入的信息，HTML5提供了各种不同的表单控件，而在Bootstrap中这些控件的样式得到了进一步的加强。

## 2. 基本输入控件

在Bootstrap中，只需为基本输入控件添加`.form-control`类，即可将控件的样式设置为Bootstrap提供的预设样式。接下来我们用一个实例来展示下常用的输入控件。

```java
<!-- 基本输入控件 -->
<div class="col-md-12">
    <form action="#" class="form-horizontal">
        <div class="form-group">
            <label class="control-label col-md-3">文本框:</label>
            <div class="col-md-9">
                <input type="text" class="form-control">
            </div>
        </div>
        <div class="form-group">
            <label class="control-label col-md-3">密码框:</label>
            <div class="col-md-9">
                <input type="password" class="form-control">
            </div>
        </div>
        <div class="form-group">
            <label class="control-label col-md-3">单选框:</label>
            <div class="col-md-9">
                <input type="radio" class="form-control">
            </div>
        </div>
        <div class="form-group">
            <label class="control-label col-md-3">复选框:</label>
            <div class="col-md-9">
                <input type="checkbox" class="form-control">
            </div>
        </div>
        <div class="form-group">
            <label class="control-label col-md-3">文本域:</label>
            <div class="col-md-9">
                <textarea rows="10" class="form-control"></textarea>
            </div>
        </div>
    </form>
</div>
```

对应效果如下，可见Bootstrap对样式进行了优化，但是对功能是没啥影响的。

## 3. 调整表单控件的大小

有时候我们需要手工调整控件的大小，主要是设置控件的宽度和高度。

一般我们为了提供响应式的实现效果，对宽度的调节是通过调节`.col-md-*`网格类实现的。

而对于高度的调节，除了默认的大小，BootStrap还提供了`.input-lg`、`.input-sm`类，来提供大号、小号的显示效果。

代码如下：

```java
<!-- 调整控件大小 -->
<div class="col-md-12">
    <form action="#" class="form-horizontal">
        <div class="form-group">
            <label class="control-label col-md-3">正常:</label>
            <div class="col-md-9">
                <input type="text" class="form-control">
            </div>
        </div>
        <div class="form-group">
            <label class="control-label col-md-3">大号:</label>
            <div class="col-md-9">
                <input type="text" class="form-control input-lg">
            </div>
        </div>
        <div class="form-group">
            <label class="control-label col-md-3">小号:</label>
            <div class="col-md-9">
                <input type="text" class="form-control input-sm">
            </div>
        </div>
    </form>
</div>
```

效果如下：

## 4. 表单控件的特殊用法

Bootstrap还针对单选框、复选框提供了特殊用法，使这些控件使用起来更加符合用户习惯。

### 4.1 单选框用法

在上面的示例中，单选框的描述文字在左侧，单选按钮在右侧。

而在实际使用场景中，一般是单选框在左侧，而相应的描述文字在右侧，所以Bootstrap提供了`.radio`样式，用于包裹单选按钮及其描述。代码如下：

```java
<div class="radio">
    <label>
        <input type="radio" name="sex" value="radio-male">
        男
    </label>
</div>
<div class="radio">
    <label>
        <input type="radio" name="sex" value="radio-femal">
        女
    </label>
</div>
```

还可使用`.radio-inline`样式创建内联的单选框组，代码如下：

```java
<div class="radio-inline">
    <label>
        <input type="radio" name="sex2" value="radio-male">
        男
    </label>
</div>
<div class="radio-inline">
    <label>
        <input type="radio" name="sex2" value="radio-femal">
        女
    </label>
</div>
```

上述两段代码效果如下：

### 4.2 复选框用法

复选框的用法与单选框类似，Bootstrap提供了`.checkbox`和`.checkbox-inline`样式用来设置复选框的样式。代码如下：

```java
 <div class="col-md-12">
    <div class="checkbox">
        <label>
            <input type="checkbox">
            篮球
        </label>
    </div>
    <div class="checkbox">
        <label>
            <input type="checkbox">
            足球
        </label>
    </div>
    <div class="checkbox-inline">
        <label>
            <input type="checkbox">
            篮球
        </label>
    </div>
    <div class="checkbox-inline">
        <label>
            <input type="checkbox">
            足球
        </label>
    </div>
</div>
```

对应效果如下：

## 5. 小结

Bootstrap为表单控件提供了几个样式，使表单控件的显示更加规范且符合用户习惯，简单且优雅，极具实用和借鉴价值。
