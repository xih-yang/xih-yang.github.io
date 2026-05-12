# 26、Swift 3 析构过程
- 来源：https://ddkk.com/zhuanlan/other/swift3/26.html
- 分类：Swift 3 教程
- 分组：教程目录
在一个类的实例不再被需要的时候，就要及时的删除，删除一个类的实例，垃圾回收期就会回收实例占用的内存。在一个类的实例被释放之前，析构函数被立即调用

Swift 使用 deinit 关键字来定义析构函数，类似于初始化函数用 init 来标示

析构函数只适用于类类型

每一个类只能有一个析构函数

## Swift 析构过程

Swift 会自动释放不再需要的实例以释放内存资源

Swift 通过自动引用计数（ARC）处理实例的内存管理

通常实例被释放时不需要手动地去清理

但是当使用自己的资源时，可能需要进行一些额外的清理

例如，如果创建了一个自定义的类来打开一个文件，并写入一些数据，就可能需要在类实例被释放之前关闭该文件

在类的定义中，每个类最多只能有一个析构函数

### 语法

Swift 使用 deint 声明一个析构函数，析构函数不带任何参数，在写法上不带括号

```swift
deinit {
    // 执行析构过程
}
```

### 范例

```swift
import Cocoa
var counter = 0;  // 引用计数器
class DemoClass
{
    init()
    {
        counter += 1;
    }
    deinit
    {
        counter -= 1;
    }
}
var show: DemoClass? = DemoClass()
print(counter)
show = nil
print(counter)
```

编译运行以上 Swift 范例，输出结果为

```swift
1
0
```

当show = nil 语句执行后，计算器减去 1，show 占用的内存就会释放

```swift
import Cocoa
var counter = 0;  // 引用计数器
class DemoClass
{
    init()
    {
        counter += 1;
    }
    deinit
    {
        counter -= 1;
    }
}
var show: DemoClass? = DemoClass()
print(counter)
print(counter)
```

编译运行以上 Swift 范例，输出结果为

```swift
1
1
```
