# 31、Perl 循环嵌套
- 来源：https://ddkk.com/zhuanlan/other/perl/31.html
- 分类：Perl 教程
- 分组：教程目录
Perl 语言允许在一个循环内使用另一个循环，下面是几种嵌套循环的写法

### 嵌套循环语句语法

嵌套for 循环语句的语法：

```sh
for ( init; condition; increment ){
   for ( init; condition; increment ){
      statement(s);
   }
   statement(s);
}
```

嵌套while 循环语句的语法：

```sh
while(condition){
   while(condition){
      statement(s);
   }
   statement(s);
}
```

嵌套do...while 循环语句的语法：

```sh
do{
   statement(s);
   do{
      statement(s);
   }while( condition );
}while( condition );
```

嵌套until 循环语句的语法：

```sh
until(condition){
   until(condition){
      statement(s);
   }
   statement(s);
}
```

嵌套foreach 循环语句的语法：

```sh
foreach $a (@listA){
   foreach $b (@listB){
      statement(s);
   }
   statement(s);
}
```

## 范例 : Perl 嵌套循环的使用

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$x = 0;
$y = 0;
# 外部循环
while($x < 3){
   $y = 0;
   # 内部循环
   while( $y < 3 ){
      print "x = $x, y = $y\n";
      $y += 1;
   }
   $x += 1;
   print "x = $x\n\n";
}
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
x = 0, y = 0
x = 0, y = 1
x = 0, y = 2
x = 1
x = 1, y = 0
x = 1, y = 1
x = 1, y = 2
x = 2
x = 2, y = 0
x = 2, y = 1
x = 2, y = 2
x = 3
```
