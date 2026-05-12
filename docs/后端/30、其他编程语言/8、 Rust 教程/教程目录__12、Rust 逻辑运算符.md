# 12、Rust 逻辑运算符
- 来源：https://ddkk.com/zhuanlan/other/rust/12.html
- 分类：Rust 教程
- 分组：教程目录
**逻辑运算符** 用于组合两个或多个条件并返回这些条件的逻辑运算的结果。

所有的编程语言都有 **逻辑运算符**。

逻辑运算符的返回结果是 **布尔类型** 也就是只有两个值，要么是 true ，那么是 false。

逻辑运算符只有简单的三个：**逻辑与 &&**、**逻辑或 || 和** 逻辑非 !**。

下表列出了我们刚刚说的三个逻辑运算符。下表中，我们假设 A = 10 且 B = 20。

名称
运算符
描述
范例

逻辑与
&&
所有的表达式结果为真则返回 true，否则返回 false
(A > 10 && B > 10) 的结果为 false

逻辑或
||
有一个表达式结果为真则返回 true 否则返回 false
(A > 10 || B >10) 的结果为 true

逻辑非
!
如果表达式的结果为真则返回 false 否则返回 true
!(A >10 ) 的结果为 true

## 范例

逻辑运算符很简单，因为只有三个。

我们写一小段代码演示下如何使用逻辑运算符以及它们的计算结果。

```sh
fn main() {
   let a = 20;
   let b = 30;
   if (a > 10) && (b > 10) {
      println!("true");
   }
   let c = 0;
   let d = 30;
   if (c>10) || (d>10){
      println!("true");
   }
   let is_elder = false;
   if !is_elder {
      println!("Not Elder");
   }
}
```

编译运行以上 Rust 代码，输出结果如下

```sh
true
true
Not Elder
```
