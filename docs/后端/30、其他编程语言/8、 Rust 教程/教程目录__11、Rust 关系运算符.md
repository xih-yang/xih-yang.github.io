# 11、Rust 关系运算符
- 来源：https://ddkk.com/zhuanlan/other/rust/11.html
- 分类：Rust 教程
- 分组：教程目录
**关系运算符** 用于测试或定义两个实体之间的关系类型。

**关系运算符** 用于比较两个或多个值，并返回一个 **布尔类型** 的值，也就是 true 或 false。

Rust 支持 6 种关系运算符，我们罗列于下表。

在下面这个表格中，假设 A = 10 和 B = 20。下表列出了各个关系运算符的说明以及它们的范例结果

关系操作符
说明
示例

>
Greater than
(A > B) 返回 false

=
Greater than or equal to
(A >= B) 返回 false

<=
Lesser than or equal to
(A <= B) 返回 true

==
Equality
(A == B) 返回 false

!=
Not equal
(A != B) 返回 true

## 范例

下面我们就用一小段代码来演示下上面提到的这些关系运算符的作用和结果

```sh
fn main() {
   let A:i32 = 10;
   let B:i32 = 20;
   println!("Value of A:{} ",A);
   println!("Value of B : {} ",B);
   let mut res = A>B ;
   println!("A greater than B: {} ",res);
   res = A<B ;
   println!("A lesser than B: {} ",res) ;
   res = A>=B ;
   println!("A greater than or equal to B: {} ",res);
   res = A<=B;
   println!("A lesser than or equal to B: {}",res) ;
   res = A==B ;
   println!("A is equal to B: {}",res) ;
   res = A!=B ;
   println!("A is not equal to B: {} ",res);
}
```

编译运行以上 Rust 代码，输出结果如下

```sh
Value of A:10
Value of B : 20
A greater than B: false
A lesser than B: true
A greater than or equal to B: false
A lesser than or equal to B: true
A is equal to B: false
A is not equal to B: true
```
