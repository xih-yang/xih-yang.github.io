# 22、Python 教程 - Python中的os模块
- 来源：https://ddkk.com/zhuanlan/other/python/3/22.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、os模块

**1简介**

Python os模块包含普遍的操作系统功能，在python中使用该模块需要先导入该模块：

```java
import os
```

以下介绍该模块的常见用法：

**2查看操作系统类型**

```java
print(os.name)
print('Linux' if os.name== 'posix' else 'Windows')		#直接返回linux或者windows
```

返回值
对应操作系统

posix
linux

nt
windows

**3查看操作系统的详细信息**

```java
info = os.uname()			#不支持windows系统
print(info)
print(info.sysname)
print(info.nodename)
```

**4查看系统的环境边量**

```java
print(os.environ)
print(os.environ.get('PATH'))
```

**5判断是否是绝对路径**

```java
print(os.path.isabs('/tmp/gf'))
print(os.path.isabs('hello'))
```

输出结果为：

```java
True
False
```

**注意：该方法仅能判断是否是绝对路径，并不能判断路径是否存在**

**6生成绝对路径**

```java
print(os.path.abspath('hello.png'))		#生成绝对路径
print(os.path.join(os.path.abspath('.'),'hello'))		#路径的拼接，“ . ”表示当前路径
print(os.path.join('/home/kiosk','python.jpg'))			#路径的拼接
```

输出结果为：

```java
C:\Users\lenovo\Desktop\westos\12.28资料\day06\hello.png
C:\Users\lenovo\Desktop\westos\12.28资料\day06\hello
/home/kiosk\python.jpg
```

**7获取目录名和文件名**

```java
filename = '/home/dd/Desktop/filename'
print(os.path.basename(filename))		#获取文件名
print(os.path.dirname(filename))		#获取目录名
```

输出结果为：

```java
filename
/home/dd/Desktop
```

**8创建与删除目录**

```java
os.mkdir('img')				#创建单个目录
os.makedirs('img/1/2')		#递归创建目录
os.rmdir('img')				删除目录(不能递归删除)
```

**9创建文件 删除文件**

```java
os.mknod('00_ok.txt')		#创建文件，linux运行
os.remove('00_ok.txt')		#删除文件，linux运行
```

**10 文件的重命名**

```java
os.rename('ips.txt','ips2.txt')		#将'ips.txt'重命名为'ips2.txt'
```

**11 判断文件或目录名是否存在**

```java
print(os.path.exists('ips2.txt'))
```

返回`True`或者`False`

**12 分离后缀名和文件名**

```java
print(os.path.splitext('hello.jpg'))
```

返回一个元组，元组元素为分离的元素

输出结果为：

```java
('hello', '.jpg')
```

**13 将目录名和文件名分离**

```java
print(os.path.split('/tmp/hello/hello.png'))
```

返回一个元组，元组元素为分离的元素

输出结果为：

```java
('/tmp/hello', 'hello.png')
```

## 二、os模块的练习

**1练习一**

> 在当前目录新建目录img, 里面包含多个文件,
>
> 文件名各不相同(如：X4G5.png)
>
> import random
>
> import string
>
> import os

```java
def gen_code(len=4):
    随机生成四位随机数
    li = random.sample(string.ascii_letters+string.digits,len)
    print(li)
    return  ''.join(li)
gen_code()
def creat_file():
    随机生成多个文件名
    li = {
     gen_code() for i in range(100)}
    os.mkdir('img')
    for name in li:
        os.mknod('img/' + name + '.png')
creat_file()
```

**2练习二**

> 将当前img目录所有以.png结尾的后缀名改为.jpg

即批量重命名文件：

```java
def modify_suffix(dirname,old_suffix,new_suffix):
    """
    :param dirname: 要操作的目录
    :param old_suffix: 只前的后缀名
    :param new_suffix: 新的后缀名
    :return:
    """
    1.要判断查找的目录是否存在 如果不存在 报错
    if os.path.exists(dirname):
        2.找出所有以old_suffix(.png)结尾的文件
        pngfile = [filename for filename in os.listdir(dirname)
                   if filename.endswith(old_suffix)]
        3.将后缀名和文件名分离 留下文件名
        basefile = [os.path.splitext(filename)[0]
                    for filename in pngfile]
        4.重明名文件
        for filename in basefile:
            oldname = os.path.join(dirname,filename+old_suffix)
            newname = os.path.join(dirname,filename+new_suffix)
            os.rename(oldname,newname)
            print('%s命名为%s成功' %(oldname,newname))
    else:
        print('%s 不存在，不能操作' %(dirname))
modify_suffix('img','.html','.php')
```

**3练习三**

> 利用time.time()方法，我们可以计算两个时间点 之间的时间间隔，但是有些时候我们想要得到/etc/group文件的最后m/a/c/time的时间，对应的年月日这些信息 并保存再文件date.txt文件中

解答：

```java
import os
import time
time1 = os.path.getctime('/etc/group')
print(time1)
tuple_time = time.localtime(time1)
print(tuple_time)
year = tuple_time.tm_year
month = tuple_time.tm_mon
day = tuple_time.tm_mday
print(year,month,day)
print(type(year))
print(type(month))
print(type(day))
with open('data.txt','a') as f:
    f.write('%d %d %d' %(year,month,day))
    f.write('\n')
```
