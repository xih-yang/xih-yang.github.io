# 15、Bootstrap 入门 - 警告框、弹出框、工具提示框
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/15.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

本篇介绍的几种显示提示信息的方式，这几种方式并不常用，大家了解即可。

## 2. 警告框

### 2.1 普通警告框

警告框用来显示一些希望让用户注意到的内容，例如上传文件时的主要注意的警示信息，或者更加严重的上传失败的提示信息。

警告框有4中具体样式类，我们通过一个示例来演示下：

```java
<div class="col-md-12">
    <div class="alert alert-info">
        alert-info警告框
    </div>
    <div class="alert alert-success">
        alert-success警告框
    </div>
    <div class="alert alert-warning">
        alert-warning警告框
    </div>
    <div class="alert alert-danger">
        alert-danger警告框
    </div>
</div>
```

具体效果如下：

### 2.2 可关闭警告框

通过为警告框添加`alert-dismissible`，然后为其添加带有`data-dismiss="alert"属性的关闭按钮，即可创建可关闭的警告框。

```java
<div class="col-md-12">
    <div class="alert alert-info alert-dismissible">
        <button type="button" data-dismiss="alert">关闭</button>
        可关闭警告框
    </div>
</div>
```

效果如下：

这种关闭按钮比较丑陋，可以通过添加`close`样式类，将按钮设置为符合气质的关闭按钮样式，同时将关闭文字改为关闭图标。

```java
<div class="col-md-12">
    <div class="alert alert-info alert-dismissible">
        <button type="button" data-dismiss="alert" class="close"><span class="glyphicon glyphicon-remove"></span></button>
        可关闭警告框
    </div>
</div>
```

效果如下：

## 3. 弹出框

### 3.1 弹出框初始化

弹出框属于Bootstrap提供的JS插件，需要在页面加载完成后手动对其进行初始化，否则无法正常使用。

```java
<script>
    $(function () {
        $('[data-toggle="popover"]').popover()
    });
</script>
```

### 3.2 弹出框显示

显示框一般在点击按钮时显示，通过为按钮添加`data-toggle="popover"`属性，即可在点击按钮后显示弹出框。弹出框的标题和内容分别通过`title`和`data-content`属性设置，代码如下：

```java
<div class="col-md-12">
    <button type="button" class="btn btn-default" data-toggle="popover" title="弹出框标题"
        data-content="弹出框内容">按钮文字</button>
</div>
```

效果如下：

再次点击按钮，弹出框即可关闭。

## 4. 工具提示框

工具提示框与弹出框非常类似，只是说不用点击按钮，鼠标指向目标时，工具提示框即可显示。

### 4.1 工具提示框初始化

工具提示框同样需要初始化

```java
<script>
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });
</script>
```

### 4.2 工具提示框显示

工具提示框显示方式与弹出框也类似，直接看代码：

```java
<div class="col-md-12">
    <button type="button" class="btn btn-default" data-toggle="tooltip" title="tooltip内容">
        按钮文字
    </button>
</div>
```

效果如下，注意工具提示框不需要点击按钮，鼠标移动到按钮上方即可显示。

## 5. 小结

本篇提到的警告框、弹出框、工具提示框主要是提供一些提示/警告/说明信息，平时用的也不多，了解即可。
