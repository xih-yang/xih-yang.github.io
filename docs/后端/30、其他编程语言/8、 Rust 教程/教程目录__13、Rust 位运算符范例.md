# 13、Rust 位运算符范例
- 来源：https://ddkk.com/zhuanlan/other/rust/13.html
- 分类：Rust 教程
- 分组：教程目录
下表列出了 Rust 支持的所有位运算操作。

我们假设变量 A = 2 且变量 B = 3。

A的二进制格式为

000 0 0 0 1 0

B的二进制位格式为

000 0 0 0 1 1

名字
运算符
说明
范例

位与
&
相同位都是 1 则返回 1 否则返回 0
(A & B) 结果为 2

位或
|
相同位只要有一个是 1 则返回 1 否则返回 0
(A | B) 结果为 3

异或
^
相同位不相同则返回 1 否则返回 0
(A ^ B) 结果为 1

位非
!
把位中的 1 换成 0 ， 0 换成 1
(!B) 结果 -4

左移
>
操作数中的所有位向右移动指定位数，左边的位补 0
(A >> 1) 结果为 1

## 范例

下面的范例演示了我们上面提到的所有位运算符。

```sh
fn main() {
   let a:i32 = 2;     // 二进制表示为 0 0 0 0 0 0 1 0
   let b:i32 = 3;     // 二进制表示为 0 0 0 0 0 0 1 1
   let mut result:i32;
   result = a & b;
   println!("(a & b) => {} ",result);
   result = a | b;
   println!("(a | b) => {} ",result) ;
   result = a ^ b;
   println!("(a ^ b) => {} ",result);
   result = !b;
   println!("(!b) => {} ",result);
   result = a << b;
   println!("(a << b) => {}",result);
   result = a >> b;
   println!("(a >> b) => {}",result);
}
```

编译运行以上 Rust 代码，输出结果如下

```sh
(a & b) => 2
(a | b) => 3
(a ^ b) => 1
(!b) => -4
(a << b) => 16
(a >> b) => 0
```
