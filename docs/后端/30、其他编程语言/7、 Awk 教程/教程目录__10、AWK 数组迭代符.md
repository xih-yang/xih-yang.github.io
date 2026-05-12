# 10、AWK 数组迭代符
- 来源：https://ddkk.com/zhuanlan/other/awk/10.html
- 分类：Awk 教程
- 分组：教程目录
很多翻译就将这个翻译成数组成员访问符，但我一直觉得不妥，于是这里我将它改成数组成员迭代符。

数组成员迭代符，也就是 in 关键字啦。用于访问数组的元素。

in 关键字，一般和 for 循环一起使用，用于迭代数组。

例如下面的命令，我们使用 for in 来迭代数组

```sh
[jerry]$ awk 'BEGIN { 
   arr[0] = 1; arr[1] = 2; arr[2] = 3; for (i in arr) printf "arr[%d] = %d\n", i, arr[i]
}'
```

运行上面的 awk 命令，输出结果如下

```sh
arr[0] = 1
arr[1] = 2
arr[2] = 3
```
