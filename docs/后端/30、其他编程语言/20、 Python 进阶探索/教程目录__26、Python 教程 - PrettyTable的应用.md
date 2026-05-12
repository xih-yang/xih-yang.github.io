# 26、Python 教程 - PrettyTable的应用
- 来源：https://ddkk.com/zhuanlan/other/python/3/26.html
- 分类：Python 进阶探索
- 分组：教程目录
Python通过prettytable模块将输出内容如表格方式整齐输出，python本身并不内置，需要独立安装该第三方库。

**1安装**

```java
pip install PrettyTable
```

**2使用示例**

```java
from prettytable import PrettyTable
field_names = ("ID",'名字','英语成绩','Python成绩','C语言成绩')
table = PrettyTable(field_names=field_names)
print(table)
```

输出结果为：

```java
+----+------+----------+------------+-----------+
| ID | 名字 | 英语成绩 | Python成绩 | C语言成绩 |
+----+------+----------+------------+-----------+
+----+------+----------+------------+-----------+
```

示例二：

```java
from prettytable import PrettyTable
x = PrettyTable(["姓名", "性别", "年龄", "存款"])
x.align["姓名"] = "1"以姓名字段左对齐
x.padding_width = 1  填充宽度
x.add_row(["赵一","男", 20, 100000])
x.add_row(["钱二","男", 21, 500])
x.add_row(["孙三", "男", 22, 400.7])
x.add_row(["李四", "男", 23, 619.5])
x.add_row(["周五", "男", 24, 1214.8])
x.add_row(["吴六", "女", 25, 646.9])
x.add_row(["郑七", "女", 26, 869.4])
x.add_row(["王七加一", "男", 21, 869.4])
print(x)
```

输出结果为：

```java
+----------+------+------+--------+
|   赵一   |  男  |  20  | 100000 |
|   钱二   |  男  |  21  |  500   |
|   孙三   |  男  |  22  | 400.7  |
|   李四   |  男  |  23  | 619.5  |
|   周五   |  男  |  24  | 1214.8 |
|   吴六   |  女  |  25  | 646.9  |
|   郑七   |  女  |  26  | 869.4  |
| 王七加一 |  男  |  21  | 869.4  |
+----------+------+------+--------+
```
