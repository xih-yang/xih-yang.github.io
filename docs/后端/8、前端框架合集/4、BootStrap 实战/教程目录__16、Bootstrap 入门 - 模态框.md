# 16、Bootstrap 入门 - 模态框
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/16.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

模态框这个名字有点高雅了，其实就是对话框，用来弹出一个新的界面。

模态框的使用非常的场景，例如在用户管理页面，当进行用户新增时，可以点击新增按钮，弹出一个窗体供填入用户信息然后保存。

注意Bootstrap的模态框一次只能显示一个，不能在打开一个模态框后尝试继续打开第二个。

## 2. 模态框样式

模态框相关的样式类比较多，我个人是感觉有些过于复杂了，当然这里也不排除Bootstrap开发人员有意为之，毕竟复杂之后拓展时就更加容易。

我们直接来看一个示例：

```java
<!-- 模态框 -->
<div class="modal" id="myModal">
    <!-- 模态的对话框 -->
    <div class="modal-dialog">
        <!-- 内容部分 -->
        <div class="modal-content">
            <!-- 头部 -->
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"
                    aria-hidden="true">×</button>
                <h4 class="modal-title">标题</h4>
            </div>
            <!-- 身体 -->
            <div class="modal-body">内容</div>
            <!-- 尾部 -->
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary">保存</button>
            </div>
        </div>
    </div>
</div>
```

需要注意的是，大多数情况下，我们只需要调整标题、内容和尾部的按钮即可。

另外模态框默认是不显示的，需要触发后显示。

## 3. 按钮直接关联模态框

可以将按钮设置为点击后切换模态框状态，代码如下：

```java
<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">
    打开模态框
</button>
```

当点击按钮后，就会打开id为myModal的模态框，效果如下：

此时点击标题右上角的x，或者点击关闭按钮即可关闭当前模态框。

## 4. 通过JS方法打开/关闭模态框

通过按钮打开模态框的方式比较死板，因为大多数情况下，我们在打开模态框之前需要进行条件判断/数据加载相关工作。

此时我们可以通过JS方法控制模态框，常用的方法有3个。

1. `$`('#myModal').modal('show')：打开模态框
2. `$`('#myModal').modal('hide')：关闭模态框
3. `$`('#myModal').modal('toggle')：切换模态框的状态

假设我们通过按钮打开模态框则代码如下：

```java
<button type="button" class="btn btn-primary" onclick="btnOpenModal()">
    JS打开模态框
</button>
<script>
    function btnOpenModal() {
        $('#myModal').modal('toggle');
    }
</script>
```

点击按钮后即可打开模态框。

## 5. 调整大小

可以为`modal-dialog`类修饰的元素追加`modal-lg`或`modal-sm`类，将显示大号的或者小号的模态框，根据具体显示的内容调整即可。

## 6. 动画效果

在某些较低性能的设备，或者某些浏览器上，弹出模态框时的动画效果会导致页面卡顿，用户体验较差。

但是大部分设备，增加动画效果后，会更加的高端大气上档次。

可以为`.modal`修饰的元素添加`.fade`类，这样模态框弹出时会自带动画效果。

## 7. 小结

模态框使用非常常见，Bootstrap模态框样式还是比较大气的，模态框的body部分可以放置各种各样的内容。

另外对于Bootstrap模态框的动画效果，我个人建议慎用，毕竟还是要先追求稳定。
