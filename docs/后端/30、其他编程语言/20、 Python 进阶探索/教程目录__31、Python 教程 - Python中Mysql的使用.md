# 31、Python 教程 - Python中Mysql的使用
- 来源：https://ddkk.com/zhuanlan/other/python/3/31.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、Python中mysql的使用

Linux（rhel7.0）中mysql的安装以及安全初始化（注意不要关闭端口）参见以下博客：

[Linux下数据库的基本管理](https://blog.csdn.net/qq_35887546/article/details/103170131)

Python中mysql的使用需要依赖模块`pymysql`，该模块安装后：

```java
import pymysql
# 1.连接数据库
conn = pymysql.connect(host='localhost',		#用户为本地用户
                       user='root',				#mysql的用户名
                       password='redhat',		#系统中mysql 'root'用户的密码
                       db='redhat',				#使用的database
                       charset='utf8'			#编码格式，支持中文
)
# 2.创建游标对象
cur = conn.cursor()
# 3.对数据库操作，实现数据表的操作
######创建数据表#############
try:
    create_sqli = 'create table hello (id int,name varchar(30));'
    cur.execute(create_sqli)
except Exception as e:
    print('创建数据表失败:',e)
else:
    print('创建数据成功')
```

## 二、使用python在mysql数据库中的数据表中添加数据

```java
import pymysql
# 1.连接数据库
conn = pymysql.connect(host='localhost',
                       user='root',
                       password='redhat',
                       db='westos',
                       charset='utf8',
                       autocommit='True'
)
# 2.创建游标对象
cur = conn.cursor()
# 3.对数据库操作
######插入数据
# try:
#     inser_sqli = "insert into hello values(3,'apple');"
#     cur.execute(inser_sqli)
# except Exception as e:
#     print('插入数据失败:',e)
# else:
#     如果是插入数据 一定要提交的 不然数据库中找不到要插入的数据
#     conn.commit()
#     print('插入数据成功！！')
#####插入多条数据
try:
    info = [(i,i) for i in range(100,1000)]
    第一种方式
    inser_sqli = "insert into hello values(%d,'%s');"
    for item in info:
        print('insert语句：',inser_sqli %item)
        cur.execute(inser_sqli %item)
    第二种方式
    inser_sqli = "insert into hello values('%s','%s');"
    cur.executemany(inser_sqli,info)
except Exception as e:
    print('插入多条数据失败:',e)
else:
    print('插入多条数据成功')
```

## 二、使用python在mysql数据库中查询数据

在查询数据时，会有像文件中的指针一样的指针，需要查询特定位置的数据可以通过`.scroll()`函数来移动指针到指定的位置。

```java
import pymysql
# 1.连接数据库
conn = pymysql.connect(host='localhost',
                       user='root',
                       password='redhat',
                       db='westos',
                       charset='utf8',
                       autocommit='True'
)
# 2.创建游标对象
cur = conn.cursor()
# 3.对数据库操作
#####查询数据库
sqli = 'select * from hello'
# 默认不返回查询结果集 返回的是数据记录数
result = cur.execute(sqli)
# print(result)
# a = cur.fetchone()
# print(a)
# 获取下一条查询结果集
# print(cur.fetchone())
# print(cur.fetchone())
# 获取指定个数查询结果集
# print(cur.fetchmany(4))
# info = cur.fetchall()
# print(info)
"""
# 可以通过cursor.scroll(position, mode="relative | absolute")方法，
# 来设置相对位置游标和绝对位置游标
# 当mode='absolute'时，代表绝对移动，
# value就代表移动的绝对位置，value=0就代表移动到位置0处，
# 就是结果集开头，
# value=3就是移动到位置3处，也就是第4条记录处
mode缺省值为'relative'，代表相对移
# 当mode='relative'时，value就是移动的长度，
# value>0向后移动（从位置0移动到位置2），
# value<0向前移动（比如从位置2移动到位置0）
"""
print(cur.fetchmany(3))
# print('移动到指针最开始的地方...')
# cur.scroll(0,'absolute')
# print(cur.fetchmany(3))
# print(cur.fetchmany(2))
# print(cur.fetchall())
cur.scroll(-2,mode='relative')
print(cur.fetchmany(2))
```

## 三、Python中mysql的练习

题目：

```java
随机生成100个人名和对应的密码;
人名由三个汉字或者2个汉字组成,
姓 = [许, 张, 赵, 钱, 孙, 李, 朱, 杨]
名 = [彬, 群, 宁, 盼, 龙, 欢, 丹]
密码统一6位, 由字母和字符组成;
存储上述用户信息到数据库中,
保存在数据库users中的userinfo表中;
```

解答：

```java
import random
from random import choice as choice
import string
import pymysql
# 生成指定位数密码, 前 n-1 位为数字, 最后一位为密码 ;
def create_passwd(count=6):
    nums = random.sample(string.digits, count - 1)
    letters = random.sample(string.ascii_letters, 1)
    return "".join(nums + letters)
a = create_passwd()
print(a,type(a))
# 生成随机的姓名, 有两个或三个汉字组成 ;
def create_name():
    first = ['许', '张', '赵', '钱', '孙', '李', '朱', '杨']
    second = ['彬', '群', '宁', '盼', '龙', '欢', '丹']
    last = ['彬', '群', '宁', '盼', '龙', '欢', '丹', ' ' ]
    name = choice(first) + choice(second)+ choice(last)
    return name.rstrip()			#删除末尾的空字符（当名字是两个字时）
def main():
    1.连接数据库 host user passwd charset
    conn = pymysql.connect(host='localhost',
                       user='root',
                       password='redhat',
                       db='westos',
                       charset='utf8'
    )
    2.创建游标对象
    cur = conn.cursor()
    n = int(input("生成数据数:"))
    往数据库表中插入 n 条随机数据 ;
    for i in range(n):
    cur.execute('insert into userinfo values("user1", "123");')
        sqli = 'insert into userinfo values ("%s", "%s");' %(create_name(), create_passwd())
        cur.execute(sqli)
        提交数据,并关闭连接 ;
    conn.commit()
    cur.close()
main()
```
