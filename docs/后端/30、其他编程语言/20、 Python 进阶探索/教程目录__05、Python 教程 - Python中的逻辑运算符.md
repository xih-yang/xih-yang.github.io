# 05、Python 教程 - Python中的逻辑运算符
- 来源：https://ddkk.com/zhuanlan/other/python/3/5.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、and逻辑运算符

条件1and 条件2

两个条件同时满足,就返回True

只要有一个条件不满足 就返回False

示例：

```java
python_score = 40
c_score = 90
# 只有当两门都及格时，输出pass 其他情况输出sorry
if python_score >= 60 and c_score >=60:
    print('pass')
else:
    print('sorry')
```

## 二、or逻辑运算符

条件1or 条件2

两个条件只要有一个满足,就返回True

两个条件都不满足的时候,才会返回False

示例：

```java
python_score = 40
c_score = 90
# 当两门有一门及格时，就输出pass 只有两门课都不及格时才输出sorry
if python_score >= 60 or c_score >=60:
    print('pass')
else:
    print('sorry')
```
