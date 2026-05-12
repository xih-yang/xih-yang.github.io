# 74- Redis 实战 - GETBIT命令的实现
- 来源：https://ddkk.com/zhuanlan/db/redis-action/74.html
- 分类：缓存数据库
- 分组：教程目录
GETBIT 命令用于返回位数组 bitarray 在 offset 偏移量上的二进制位的值：

```sh
GETBIT <bitarray> <offset>
```

GETBIT 命令的执行过程如下：

**1、** 计算，byte值记录了offset偏移量指定的二进制位保存在位数组的哪个字节；

**2、** 计算，bit值记录了offset偏移量指定的二进制位是byte字节的第几个二进制位；

**3、** 根据byte值和bit值，在位数组bitarray中定位offset偏移量指定的二进制位，并返回这个位的值；

举个例子， 对于图 IMAGE_BIT_EXAMPLE 所示的位数组来说， 命令：

```sh
GETBIT <bitarray> 3
```

将执行以下操作：

**1、**的值为0；

**2、**的值为4；

**3、** 定位到buf[0]字节上面，然后取出该字节上的第4个二进制位（从左向右数）的值；

**4、** 向客户端返回二进制位的值1；

命令的执行过程如图 IMAGE_SEARCH_EXAMPLE 所示。

再举一个例子， 对于图 IMAGE_ANOTHER_BIT_EXAMPLE 所示的位数组来说， 命令：

```sh
GETBIT <bitarray> 10
```

将执行以下操作：

**1、**的值为1；

**2、**的值为3；

**3、** 定位到buf[1]字节上面，然后取出该字节上的第3个二进制位的值；

**4、** 向客户端返回二进制位的值0；

命令的执行过程如图 IMAGE_ANOTHER_SEARCH_EXAMPLE 所示。

因为GETBIT 命令执行的所有操作都可以在常数时间内完成， 所以该命令的算法复杂度为  。
