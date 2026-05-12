# 16、AWK 比较（关系）运算符
- 来源：https://ddkk.com/zhuanlan/other/awk/16.html
- 分类：Awk 教程
- 分组：教程目录
比较运算符，又称之为关系运算符，包括 ==、!= 、>`、``=、``** 表示，如果左操作数大于右操作数，返回 true，否则返回 false

```sh
[www.ddkk.com]$ awk 'BEGIN { x = 25; y = 25; if (x > y ) print x " > " y }'
[www.ddkk.com]$ awk 'BEGIN { x = 25; y = 24; if (x > y ) print x " > " y }'
[www.ddkk.com]$ awk 'BEGIN { x = 25; y = 26; if (x > y ) print x " > " y }'
```

运行以上命令，返回结果如下

```sh
25 > 24
```

可以看到，只有一个输出，那是因为第一个和第三个都不满足条件

## 大于等于运算符

AWK中的大于等于比较运算符用 **>`=** 表示，如果左操作数大于或等于右操作数，返回 true，否则返回 false

```sh
[www.ddkk.com]$ awk 'BEGIN { x = 25; y = 25; if (x >= y ) print x " >= " y }'
[www.ddkk.com]$ awk 'BEGIN { x = 25; y = 24; if (x >= y ) print x " >= " y }'
[www.ddkk.com]$ awk 'BEGIN { x = 25; y = 26; if (x >= y ) print x " >= " y }'
```

运行以上命令，返回结果如下

```sh
25 >= 25
25 >= 24
```

第三个没有输出，是因为它不满足条件
