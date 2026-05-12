# 10、Rust 算术运算符
- 来源：https://ddkk.com/zhuanlan/other/rust/10.html
- 分类：Rust 教程
- 分组：教程目录
算术运算符就是我们日常所使用的 **加减乘除求余** 五则运算。

下表列出了 Rust 语言支持的所有算术运算符。

在下表中，我们假设 a = 10 且 b = 5。

详细的范例请访问 算术运算符

名称
运算符
范例

加
+
a+b 的结果为 15

减
-
a-b 的结果为 5

乘
*
a*b 的结果为 50

除
/
a / b 的结果为 2

求余
%
a % b 的结果为 0

## 注意

> Rust 语言不支持自增自减运算符 ++ 和 --。

## 范例

下面的范例演示了我们上面提到的所有算术运算符。

```sh
fn main() {
   let num1 = 10 ;
   let num2 = 2;
   let mut res:i32;
   res = num1 + num2;
   println!("Sum: {} ",res);
   res = num1 - num2;
   println!("Difference: {} ",res) ;
   res = num1*num2 ;
   println!("Product: {} ",res) ;
   res = num1/num2 ;
   println!("Quotient: {} ",res);
   res = num1%num2 ;
   println!("Remainder: {} ",res);
}
```

编译运行以上 Rust 代码，输出结果如下

```sh
Sum: 12
Difference: 8
Product: 20
Quotient: 5
Remainder: 0
```
