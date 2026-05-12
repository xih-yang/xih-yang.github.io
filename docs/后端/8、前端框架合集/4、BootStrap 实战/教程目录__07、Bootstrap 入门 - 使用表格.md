# 07、Bootstrap 入门 - 使用表格
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/7.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

HTML自带的表格样式实在是一言难尽，非常难看。有了Bootstrap框架后，终于可以拥有一款通用的、大气的表格可以拿来即用了。

本篇就来讲述下Bootstrap框架下表格的用法。

## 2. 基本表格

为table添加`.table`类，即可设置Bootstrap样式的表格，代码如下：

```java
<!DOCTYPE html>
<html>
<head>
    <title>boostrap-table</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <!-- 最新版本的 Bootstrap 核心 CSS 文件 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css">
    <!-- 引入jQuery -->
    <script src=" https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js"></script>
    <!-- 最新的 Bootstrap 核心 JavaScript 文件 -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js"></script>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <table class="table">
                    <caption>基本表格</caption>
                    <thead>
                        <th>姓名</th>
                        <th>课程</th>
                        <th>成绩</th>
                    </thead>
                    <tbody>
                        <tr>
                            <td>张三</td>
                            <td>语文</td>
                            <td>80</td>
                        </tr>
                        <tr>
                            <td>张三</td>
                            <td>数学</td>
                            <td>90</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3">2020年期末考试成绩单</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
```

效果如下，可以看出基本表格的显示效果还是非常规范大气的。

## 3. 表格样式类

Bootstrap还提供了更加高级的表格样式，应用之后更加好看，包括：

- .table-striped，为表格行添加斑马纹
- .table-bordered，为表格添加边框
- .table-hover，为表格的行添加悬停效果
- .table-condensed，使表格更加紧凑

下面我们来对比演示下各个表格的效果，代码如下：

```java
<div class="col-md-12">
    <table class="table table-striped">
        <caption>table-striped表格</caption>
        <thead>
            <th>姓名</th>
            <th>课程</th>
            <th>成绩</th>
        </thead>
        <tbody>
            <tr>
                <td>张三</td>
                <td>语文</td>
                <td>80</td>
            </tr>
            <tr>
                <td>张三</td>
                <td>数学</td>
                <td>90</td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">2020年期末考试成绩单</td>
            </tr>
        </tfoot>
    </table>
</div>
<div class="col-md-12">
    <table class="table table-bordered">
        <caption>table-bordered表格</caption>
        <thead>
            <th>姓名</th>
            <th>课程</th>
            <th>成绩</th>
        </thead>
        <tbody>
            <tr>
                <td>张三</td>
                <td>语文</td>
                <td>80</td>
            </tr>
            <tr>
                <td>张三</td>
                <td>数学</td>
                <td>90</td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">2020年期末考试成绩单</td>
            </tr>
        </tfoot>
    </table>
</div>
<div class="col-md-12">
    <table class="table table-hover">
        <caption>table-hover表格</caption>
        <thead>
            <th>姓名</th>
            <th>课程</th>
            <th>成绩</th>
        </thead>
        <tbody>
            <tr>
                <td>张三</td>
                <td>语文</td>
                <td>80</td>
            </tr>
            <tr>
                <td>张三</td>
                <td>数学</td>
                <td>90</td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">2020年期末考试成绩单</td>
            </tr>
        </tfoot>
    </table>
</div>
<div class="col-md-12">
    <table class="table table-condensed">
        <caption>table-condensed表格</caption>
        <thead>
            <th>姓名</th>
            <th>课程</th>
            <th>成绩</th>
        </thead>
        <tbody>
            <tr>
                <td>张三</td>
                <td>语文</td>
                <td>80</td>
            </tr>
            <tr>
                <td>张三</td>
                <td>数学</td>
                <td>90</td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">2020年期末考试成绩单</td>
            </tr>
        </tfoot>
    </table>
</div>
```

对应效果如下，当然这些样式类可以叠加设置到一个表格上，根据需求选择即可。

## 4. 设置表格行、列的样式

可以为表格的行、列单独设置样式，可选择的类包括：

- .active，显示悬停颜色
- .info，显示蓝色，表示提示意味
- .success，显示绿色，表示成功意味
- .warning，黄色，表示警告意味
- .danger，显示红色，表示危险、警告意味

我们尝试使用下上面的类，代码如下：

```java
<table class="table table-bordered table-condensed">
    <caption>设置行列样式</caption>
    <thead>
        <th>姓名</th>
        <th>课程</th>
        <th>成绩</th>
    </thead>
    <tbody>
        <tr class="info">
            <td>张三</td>
            <td>语文</td>
            <td>80</td>
        </tr>
        <tr>
            <td>张三</td>
            <td>数学</td>
            <td class="success">90</td>
        </tr>
    </tbody>
    <tfoot>
        <tr>
            <td colspan="3">2020年期末考试成绩单</td>
        </tr>
    </tfoot>
</table>
```

对应效果如下：

## 5. 响应式表格

当屏幕宽度比较窄时，表格的样式会变得很难看。如下图，当某行文字比较长时，会导致换行效果，表格变得混乱。

此时可以使用一个`.table-responsive`类的元素将表格包围起来，这样表格变为响应式表格，当宽度不足时，会自动显示横向滚动条，样式会更加美观。代码如下：

```java
<div class="table-responsive">
    <table class="table table-bordered table-condensed">
        <caption>响应式表格</caption>
        <thead>
            <th>姓名</th>
            <th>课程</th>
            <th>成绩</th>
        </thead>
        <tbody>
            <tr>
                <td>张三张三张三张三张三张三张三张三张三张三张三张三张三张三</td>
                <td>语文</td>
                <td>80</td>
            </tr>
            <tr>
                <td>张三</td>
                <td>数学</td>
                <td>90</td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">2020年期末考试成绩单</td>
            </tr>
        </tfoot>
    </table>
</div>
```

效果如下，这样在手机等小型设备使用时，会比较方便。

## 6. 小结

建议为所有表格应用响应式的样式，便于兼容各类设备。
