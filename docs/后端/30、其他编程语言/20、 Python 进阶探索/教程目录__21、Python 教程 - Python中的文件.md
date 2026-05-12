# 21、Python 教程 - Python中的文件
- 来源：https://ddkk.com/zhuanlan/other/python/3/21.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、python中的文件

文件的操作：**打开—>操作—>关闭**

打开文件的参数：

**r(readonly)默认参数**

- 只能读 不能写
- 读取文件不存在 会报错

**w**
- 写文件(write only)
- 文件存在时，会清空文件的内容并写入新的文件内容
- 文件不存在，会创建新的文件并写入内容

**a**
- 写文件(write only)
- 写：不会清空文件内容 会在文件末尾追加
- 写：文件不存在的时候，不会报错 会创建新的文件并写入内容

**w+**

- r/w
- 文件不存在 不报错 会创建新文件并写入
- 会清空文件(w) #**读文件时会清空原文件内容**

**r+**

- r/w
- 文件不存在 报错
- 会清空文件

**a+**

- r/w
- 不会清空文件内容 会在文件末尾追加
- 读文件的时候 一定要移动文件指针(a/a+ 在文件对象创建的时候 指针默认

就在文件末尾)

“”"
**1打开文件**

```java
f = open('/tmp/westosdddd','r+')
```

**2操作**

```java
 print(f)
 content = f.read()
 print(content)				#打印文件内容
# 告诉当前文件指针的位置
# 判断文件对象拥有的权限
# print(f.readable())				#判断是否可读，若是返回True，否返回False
# print(f.writable())				#判断是否可写，若是返回True，否返回False
print(f.tell())				#输出文件指针位置
# 移动文件指针
# f.seek(0,0)
# print(f.read())
# print(f.tell())
# print('~~~~~~')
# print(f.read())
f.write('python')			#在文件中写入内容
```

注意：读文件时和文件的指针有很大的关系

**3关闭**

```java
f.close()
```

## 二、二进制方式读取文件

如果读取的是 **图片 音频 视频(非纯文本文件)**

需要通过二进制的方式读取和写入

- 读取纯文本文件

```java
 r r+ w w+ a a+ === rt rt+ wt wt+ at at+
```

- 读取非纯文本文件

```java
rb rb+ wb wb+ ab ab+
```

```java
# 读取二进制文件内容
f1 = open('hello.jpg',mode='rb')
content = f1.read()
f1.close()
f2 = open('happy.jpg',mode='wb')
# 写入要复制的文件的内容
f2.write(content)
f2.close()
```

## 三、按字节、行读取

默认情况下 读取文件的内容 小的文件：直接read读取即可

如果是一个大文件(文件大小 >=内存大小) 使用 readline()

“”"

```java
f = open('/tmp/passwd','rb')
# 按行读取
# print(f.readline())
# print(f.readline())
# 按照字节读
print(f.read(3))
print(f.read())
print(f.tell())
# 读取文件内容 并返回一个列表 列表元素分别为文件的行的内容
# 读取文件内容 返回一个列表 去掉后面的\n
f = open('/tmp/passwd')
# print(list(map(lambda x:x.strip(),f.readlines())))
print([line.strip() for line in f.readlines()])
f.close()
```

## 四、文件中指针的移动

seek():移动文件指针

第一个参数：偏移量 >0:向后移动  题目：创建文件data.txt 文件共有100000行
>
> 每行存放一个1～100之间的整数

解答：

```java
import random
f = open('data.txt','a+')
for i in range(100000):
    f.write(str(random.randint(1,100)) + '\n')			#使其换行
f.seek(0,0)
print(f.read())
f.close()
```

**2练习2**

> 生成100个MAC地址并写入文件中，MAC地址前6位（16进制）为01-AF-3B
>
> 01-AF-3B(-xx)(-xx)(-xx)
>
>
> xx
>
> 01-AF-3B-xx
> xx
>
> 01-AF-3B-xx-xx
> xx
>
> 01-AF-3B-xx-xx-xx

解答：

```java
import random
import string
def create_mac():
    mac = '01-AF-3B'
    生成16进制的数
    hex_num = string.hexdigits
    for i in range(3):
        从16进制字符串中随机选择两个数字
        返回值是一个列表
        n = random.sample(hex_num,2)
        拼接内容 将小写字母转换称大写字母
        sn = '-' + ''.join(n).upper()
        mac += sn
    return mac
# 主函数 随机生成100个mac地址
def main():
    with open('mac.txt','w') as f:
        for i in range(100):
            mac = create_mac()
            print(mac)
            f.write(mac + '\n')
main()
```
