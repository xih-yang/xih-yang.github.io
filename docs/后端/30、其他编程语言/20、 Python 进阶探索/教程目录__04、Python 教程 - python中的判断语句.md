# 04、Python 教程 - python中的判断语句
- 来源：https://ddkk.com/zhuanlan/other/python/3/4.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、 if 语句

```java
if 要判断的条件(True):
    条件成立的时候,要做的事情
else:
    条件不成立的时候要做的事情
```

示例：

```java
age = 2 			# 定义一个变量
if age >= 18:		# 判断年龄是否满18岁
    print('~~~~~~~~',age)
else:
    print('sorry!!')
```

## 二、 if 语句中elif的使用：

示例：

```java
 score = 99
 if 90 < score <= 100:
     grade = 'A'
 elif 80 < score <= 90:
     grade = 'B'
 else:
     grade = 'C'
 print(grade)
```

## 三、使用if语句实现剪刀石头布

需求：
**1、** 从控制台输入要出的拳—石头(1)/剪刀(2)/布(3)；

**2、** 电脑随即出拳；

**3、** 比较胜负；

规则：
石头胜 剪刀

剪刀胜 布

布胜石头

提示：python中random模块可以返回随机值

```java
 >>> import random    			#python的第三方模块
 >>> random.randint(12,20) 		# 返回[12,20]之间的整数，包含20，下限必须小于上限
 18
```

实现：

```java
import random
# 1.从控制台输入要出的拳---石头(1)/剪刀(2)/布(3)
player = int(input('请输入你要出的拳头: ---石头(1)/剪刀(2)/布(3)'))
# 2.让电脑随机出拳
computer = random.randint(1,3)
print('玩家:%d,电脑:%d' %(player,computer))
if ((player == 1 and computer == 2) or
        (player == 2 and computer == 3) or
        (player == 3 and computer == 1)):
    print('玩家胜利!!!')
elif player == computer:
    print('平局!!!')
else:
    print('玩家输了!!!')
```
