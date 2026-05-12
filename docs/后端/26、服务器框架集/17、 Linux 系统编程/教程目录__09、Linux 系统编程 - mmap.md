# 09、Linux 系统编程 - mmap
- 来源：https://ddkk.com/zhuanlan/server/linux/3/9.html
- 分类：服务器框架
- 分组：教程目录
## mmap

### 1 mmap原理

> 存储映射I/O (Memory-mapped I/O)使一个磁盘文件与存储空间中的一个缓冲区相映射。于是当从缓冲区中取数据，就相当于读文件中的相应字节。于此类似，将数据存入缓冲区，则相应的字节就自动写入文件。这样，就可在不适用read和write函数的情况下，使用地址（指针）完成I/O操作。使用存储映射这种方法，首先应通知内核，将一个指定文件映射到存储区域中。这个映射工作可以通过mmap函数来实现。

### 2 mmap的API

#### 2.1 建立文件和内存的映射

```java
#include <sys/mman.h>
void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);
参数：
	addr：地址，一般填NULL（系统就会自己去寻找，然后通过返回值返回）
	length：长度，要申请的映射区的长度
	prot：权限
		PROT_READ：可读
		PROT_WRITE：可写
	flags：标志位
		MAP_SHARED：共享的--对映射区的修改会影响源文件
		MAP_PRIVATE：私有的
		MAP_ANONYMOUS：匿名映射，映射不受任何文件的支持，它的内容被初始化为零
					   fd和offset参数被忽略，如果指定MAP_ANONYMOUS，有些实现要求fd为-1
					   Linux从2.4内核开始支持MAP_ANONYMOUS与MAP_SHARED结合使用
	fd：文件描述符，需要打开一个文件
	offset：指定一个便宜位置，从该位置开始映射
返回值：
	成功：返回映射区的首地址
	失败：返回MAP_FAILED((void *)-1)
```

#### 2.2 扩展文件大小

```java
#include <unistd.h>
#include <sys/types.h>
int truncate(const char *path, off_t length);
参数：
	path：要扩展的文件
	length：要扩展的长度
```

#### 2.3 释放映射区域

```java
int munmap(void *addr, size_t length);
参数：
	addr：映射区的首地址
	length：映射区的长度
返回值：
	成功：0
	失败：-1
```

#### 2.4 例：mmap的实用

##### 2.4.1 write.c

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <string.h>
int main(int argc, char const *argv[])
{
	//通过open事先打开文件
	int fd = open("tmp", O_RDWR | O_CREAT, 0666);
	if(fd < 0)
	{
		perroe("open");
		return 0;
	}
	//扩展文件大小
	truncate("tmp", 16);
	//建立映射
	char *buf = (char *)mmap(NULL, 16, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);
	//使用区域
	strcpy(buf, "hello mmap");
	//断开映射
	munmap(buf, 16);
	return 0;
}
```

##### 2.4.2 read.c

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <sys/mman.h>
int main(int argc, char const *argv[])
{
	//通过open事先打开文件
	int fd = open("tmp", O_RDWR | O_CREAT, 0666);
	if(fd < 0)
	{
		perroe("open");
		return 0;
	}
	//扩展文件大小
	truncate("tmp", 16);
	//建立映射
	char *buf = (char *)mmap(NULL, 16, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);
	//使用区域
	printf("%s\n", buf);
	//断开映射
	munmap(buf, 16);
	return 0;
}
```
