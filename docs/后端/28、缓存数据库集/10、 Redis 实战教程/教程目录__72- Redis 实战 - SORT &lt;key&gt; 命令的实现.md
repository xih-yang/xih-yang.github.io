# 72- Redis 实战 - SORT &lt;key&gt; 命令的实现
- 来源：https://ddkk.com/zhuanlan/db/redis-action/72.html
- 分类：缓存数据库
- 分组：教程目录
SORT 命令的最简单执行形式为：

```sh
SORT <key>
```

这个命令可以对一个包含数字值的键 key 进行排序。

以下示例展示了如何使用 SORT 命令对一个包含三个数字值的列表键进行排序：

```sh
redis> RPUSH numbers 3 1 2
(integer) 3
redis> SORT numbers
1) "1"
2) "2"
3) "3"
```

服务器执行 SORT numbers 命令的详细步骤如下：

**1、** 创建一个和numbers列表长度相同的数组，该数组的每个项都是一个redis.h/redisSortObject结构，如图IMAGE_CREATE_ARRAY所示；

**2、** 遍历数组，将各个数组项的obj指针分别指向numbers列表的各个项，构成obj指针和列表项之间的一对一关系，如图IMAGE_POINT_OBJ所示；

**3、** 遍历数组，将各个obj指针所指向的列表项转换成一个double类型的浮点数，并将这个浮点数保存在相应数组项的u.score属性里面，如图IMAGE_SET_SCORE所示；

**4、** 根据数组项u.score属性的值，对数组进行数字值排序，排序后的数组项按u.score属性的值从小到大排列，如图IMAGE_SORTED所示；

**5、** 遍历数组，将各个数组项的obj指针所指向的列表项作为排序结果返回给客户端：程序首先访问数组的索引0，返回u.score值为1.0的列表项"1"；然后访问数组的索引1，返回u.score值为2.0的列表项"2"；最后访问数组的索引2，返回u.score值为3.0的列表项"3"；

其他SORT `` 命令的执行步骤也和这里给出的 SORT numbers 命令的执行步骤类似。

以下是redisSortObject 结构的完整定义：

```sh
typedef struct _redisSortObject {
    // 被排序键的值
    robj *obj;
    // 权重
    union {
        // 排序数字值时使用
        double score;
        // 排序带有 BY 选项的字符串值时使用
        robj *cmpobj;
    } u;
} redisSortObject;
```

SORT 命令为每个被排序的键都创建一个与键长度相同的数组， 数组的每个项都是一个 redisSortObject 结构， 根据 SORT 命令使用的选项不同， 程序使用 redisSortObject 结构的方式也不同， 稍后介绍 SORT 命令的各种选项时我们会看到这一点。
