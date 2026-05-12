# 02、Linux 系统编程 - Linux文件IO操作
- 来源：https://ddkk.com/zhuanlan/server/linux/3/2.html
- 分类：服务器框架
- 分组：教程目录
## Linux文件IO操作

### 1 系统调用

> 系统调用：就是操作系统（内核）提供给用户程序调用的一组“特殊”接口（函数接口）。
>
> 用户程序可以通过这组“特殊”接口来获得操作系统内核提供的服务，比如用户可以通过文件系统相关的调用请求系统打开文件、关闭文件或读写文件，可以通过时钟相关的系统调用获得系统时间或设置定时器等。
>
> 从逻辑上来说，系统调用可被看成是一个内核与用户空间程序交互的接口——它好比一个中间人，把用户进程的请求传达给内核，待内核把请求处理完毕后再将处理结果送回给用户空间。

> 进程的空间分为：内核空间和用户空间

系统服务之所以需要通过系统调用来提供给用户空间的根本原因是为了对系统进行"保护"，因为我们知道Linux的运行空间分为内核空间与用户空间，它们各自运行在不同的级别中，逻辑上相互隔离。

所以用户进程在通常情况下不允许访问内核数据，也无法使用内核函数，它们只能在用户空间操作用户数据，调用用户空间函数。

比如我们熟悉的"hello world"程序（执行时）就是标准的用户空间进程，它使用的打印函数 printf就属于用户空间函数，打印的字符"hello word"字符串也属干用户空间数据。

但是很多情况下，用户进程需要获得系统服务（调用系统程序），这时就必须利用系统提供给用户的“特殊接口”――系统调用了，它的特殊性主要在于规定了用户进程进入内核的具体位置。

换句话说，用户访问内核的路径是事先规定好的，只能从规定位置进入内核，而不准许肆意跳入内核。有了这样的陷入内核的统一访问路径限制才能保证内核安全无误。我们可以形象地描述这种机制：作为一个游客，你可以买票要求进入野生动物园，但你必须老老实实地坐在观光车上，按照规定的路线观光游览。当然，不准下车，因为那样太危险，不是让你丢掉小命，就是让你吓坏了野生动物。

系统调用是属于操作系统内核的一部分的，必须以某种方式提供给进程让它们去调用。CPU可以在不同的特权级别下运行，而相应的操作系统也有不同的运行级别，用户态和内核态。运行在内核态的进程可以毫无限制的访问各种资源，而在用户态下的用户进程的各种操作都有着限制，比如不能随意的访问内存、不能开闭中断以及切换运行的特权级别。显然，属于内核的系统调用一定是运行在内核态下，但是如何切换到内核态呢?

答案是软件中断。软件中断和我们常说的中断（硬件中断）不同之处在于，它是通过软件指令触发而并非外设引发的中断，也就是说，又是编程人员开发出的一种异常（该异常为正常的异常）。操作系统一般是通过软件中断从用户态切换到内核态。

### 2 系统调用和库函数的区别

> Linux下对文件操作有两种方式：系统调用（system call）和库函数调用（Library functions）。

系统调用：是内核提供的一组函数接口（内核提供）。

库函数：是第三方的函数接口（用户提供）。

**1、** 不需要调用系统调用；

不需要切换到内核空间即可完成函数全部功能，并且将结果反馈给应用程序，如strcpy、bzexo 等字符串操作函数。
**2、** 需要调用系统调用；

需要切换到内核空间，这类函数通过封装系统调用去实现相应功能，如 printf、fread等。

> 系统调用是需要时间的，程序中频繁的使用系统调用会降低程序的运行效率。当运行内核代码时，CPU工作在内核态，在系统调用发生前需要保存用户态的栈和内存环境，然后转入内核态工作。系统调用结束后，又要切换回用户态。这种环境的切换会消耗掉许多时间。

### 3 C库中IO函数工作流程

> 库函数访问文件的时候根据需要，设置不同类型的缓冲区，从而减少了直接调用IO系统调用的次数，提高了访问效率。

这个过程类似于快递员给某个区域(内核空间)送快递一样，快递员有两种方式送：

**1、** 来一件快递就马上送到目的地，来一件送一件，这样导致来回走比较频繁（系统调用）；

**2、** 等快递攒着差不多后（缓冲区），才一次性送到目的地（库函数调用）；

### 4 文件描述符

> Linux将系统调用打开或新建的文件用非负整数来表示。而这个非负整数就是文件描述符。
>
> 系统会为每一个进程分配文件描述符表，管理该进程的所有文件描述符。

在Linux的世界里，一切设备皆文件。我们可以系统调用中I/O的函数（I：input，输入； O：output，输出），对文件进行想应的操作( open()、close()、write() 、read() 等）。

打开现存文件或新建文件时，系统（内核）会返回一个文件描述符，文件描述符用来指定已打开的文件。这个文件描述符相当于这个已打开文件的标号，文件描述符是非负整数，是文件的标识，操作这个文件描述符相当于操作这个描述符所指定的文件。

程序运行起来后（每个进程）都有一张文件描述符的表，标准输入、标准输出、标准错误输出设备文件被打开，对应的文件描述符0、1、2记录在表中。程序运行起来后这三个文件描述符是默认打开的。

0：标注输入设备（键盘）scanf

1：标准输出设备（终端）printf

2：标准错误输出（终端）perror

#### 4.1 文件描述符表是如何管理文件描述符的呢？

> 文件描述符表是通过“位图”来管理文件描述符。使用1024位二进制位管理，位数代表的就是文件描述符，位上的值1表示打开，0表示关闭。

#### 4.2 查看当前系统文件描述最大数量

> 查看当前系统文件描述最大数量：ulimit -a

> 修改当前系统文件描述最大数量：ulimit -n 2048

### 5 文件IO的操作

> 文件常用操作IO：open、close、read、write

#### 5.1 open 打开文件

> 打开文件，如果文件不存在则可以选择创建

```java
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
//用于打开已存在的文件
int open(const char *pathname, int flags);
//用于打开不存在的文件
int open(const char *pathname, int flags, mode_t mode);
/* 
参数
	pathname：文件的路劲及文件名
	flags：打开文件的权限，系选项O_RDONLY，O_WRONLY，O_RDWR
	mode：这个参数只有在文件不存在时有效，指新建文件时指定文件的权限
返回值：
	成功：成功返回打开的文件描述符
	失败：-1
*/
```

##### 5.1.1 flags文件的操作权限（read write）

**必选项**

取值
含义

O_RDONLY
以只读的方式打开

O_WRONLY
以只写的方式打开

O_RDWR
以可读、可写的方式打开

**可选项**

取值
含义

O_CREAT
文件不存在则创建文件，使用此选项时需使用mode说明文件的权限

O_EXCL
如果同时指定了O_CREAT，且文件已经存在，则出错

O_TRUNC
如果文件存在，则清空文本内容

O_APPEND
写文件时，数据添加到文件末尾

O_NONBLOCK
对于设备文件，以O_NONBLOCK方式打开可以做非阻塞I/O

##### 5.1.2 mode文件在磁盘的用户权限

> 磁盘文件的用户权限分类：所有拥有者权限（u）、同组用户权限（g）、其他用户权限 （o）

任何选项都分为：`读（4）`、`写（2）`、`执行（1）`

这3个数值可以组合，如7---->0111（可读可写可执行）

mode的权限表示0xxx每一个x都是（4,2，1）的组合

0777 所有者、同组用户、其他用户都是可读可写可执行

0666所有者、同组用户、其他用户都是可读可写

0651所有者可读可写、同组用户可读可执行、其他用户可执行

##### 5.1.3 mode的系统掩码

> 查看掩码：umask

文件的最终权限 = 给定的权限 & ~umask

> 查看各组用户的默认操作权限：umask -S

#### 5.2 close 关闭文件文件描述符

> 关闭已打开的文件

```java
#include <unistd.h>
int close(int fd);
/*
参数：
   fd：文件描述符，open()的返回值
返回值：
   成功：0
   失败：-1，并设置errno
*/
```

注：close工作步骤，先将文件描述符的数量-1

#### 5.3 write 向文件写数据

> 把指定数目的数据写到文件（fd）

```java
#include <unistd.h>
ssize_t write(int fd, const void *buf, size_t count);
/*
参数：
	fd：文件描述符
	buf：数据首地址
	count：写入数据的长度（字节）
返回值：
	成功：实际写入数据的字节个数
	失败：-1
*/
```

#### 5.4 read 读取文件数据

> 把指定数据的数据读到内存（缓冲区）

```java
#include <unistd.h>
ssize_t read(int fd, void *buf, size_t count);
/*
参数：
	fd：文件描述符
	buf：内存首地址
	count：读取的字节个数
返回值：
	成功：实际读到的字节个数
		 读完数据返回0
	失败：-1
*/
```

#### 5.5 案例：实现cp命令

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
int main(int argc, char const *arfv[])
{
	//判断参数是否正确（./a.out b.txt test)
	if(argc != 3)
	{
		printf("./a.out b.txt test);
		return 0;
	}
	//以只读的方式 打开b.txt文件
	int fd_r = open(argv[1], O_RDONLY);
	if(fd_r < 0)
	{
		perror("open");
		return 0;
	}
	//以写的方式，在test目录中打开b.txt
	char file_name[32]="";
	sprintf(file_name, "%s/%s",argv[2], argv[1]);    //文件路劲
	int fd_w = open(file_name, O_WRONLY | O_CREAT, 0666);
	if(fd_w < 0)
	{
		perror("open");
		return 0;
	}
	//不停的从fd_r中读取文件数据写入到fd_w文件中
	while(1)
	{
		unsigned char buf[128] = "";
		int len = read(fd_r, buf, sizeof(buf));
		write(fd_w, buf, len);
		printf("len=%d\n",len);
		if(len <=  0)
			break();
	}
	//关闭文件
	close(fd_r);
	close(fd_w);
	return 0;
}
```

### 6 文件的阻塞特性

> 阻塞和非阻塞针对的是文件描述符而不是read write函数
>
> 文件描述符默认为阻塞的

#### 6.1 通过open函数在打开文件的时候设置文件描述符为非阻塞

> 文件描述符事先不存在才用 open

**案列1：open打开文件 默认为阻塞特性**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
void test01()
{
	//打开终端
	int fd = open("/dev/tty", O_RDONLY);
	if(fd < 0)
	{
		perror("open");
		return;
	}
	printf("准备读取数据......\n");
	unsigned char buf[128]="";
	read(fd, buf, sizeof(buf));   //默认为阻塞（直到有数据才解阻塞）
	printf("读到终端数据：%s\n",buf);
	close(fd);
}
int main(int argc, char const *argv[])
{
	test01();
	return 0;
}
```

**案列2：open打开文件 设置为非阻塞特性**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
void test01()
{
	//打开终端
	int fd = open("/dev/tty", O_RDONLY | O_NONBLOCK); //默认为阻塞，加上O_NONBLOCK后为不阻塞
	if(fd < 0)
	{
		perror("open");
		return;
	}
	printf("准备读取数据......\n");
	unsigned char buf[128]="";
	read(fd, buf, sizeof(buf));   //不阻塞
	printf("读到终端数据：%s\n",buf);
	close(fd);
}
int main(int argc, char const *argv[])
{
	test01();
	return 0;
}
```

#### 6.2 通过fcntl设置文件的阻塞特性

> 文件描述符事先存在用 fcntl

```java
#include <unistd.h>
#include <fcntl.h>
int fcntl(int fd, int cmd, ... /*arg*/);
/*
功能：改变已打开的文件性质，fcntl针对描述符提供控制
参数：
	fd: 操作的文件描述符
	cmd: 操作方式
	arg: 针对cmd的值，fcntl能够接受第三个参数int arg
返回值：
	成功：返回某个其他值
	失败：-1
*/
```

> fcntl 函数有5种功能：
>
>
> 复制一个现有的描述符（cmd = F_DUPFD）
> 获得/设置文件描述符标记（cmd = F_GETFD或F_SETFD)
> 获得/设置文件状态标记（cmd = F_GETFL或F_SETFL）
> 获得/设置异步I/O所有权（cmd = F_GETOWN或F_SETOWN）
> 获得/设置记录锁（cmd = GETLK，F_SETLK或F_SETKW）

**设置一个存在的文件描述符的阻塞特性的步骤**

**1、** fcntl获取文件描述符的状态标记；

**2、** 修改获取到的文件描述符的状态标记；

**3、** 将修改后的状态标记使用fcntl设置到文件描述符中；

**案列1：设置一个存在的文件描述符的阻塞特性**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
void test01()
{
	// 获取文件状态标记
	int flag = fcntl(0, F_GETFL);
	// 修改文件的状态标记（具备非阻塞）
	flag = flag | O_NONBLOCK;
	// 设置 让新的文件状态标记生效
	fcntl(0, F_SETFL, &flag);
	printf("准备读取数据......\n");
	unsigned char buf[128]="";
	read(0, buf, sizeof(buf));   //不阻塞
	printf("读到终端数据：%s\n",buf);
}
int main(int argc, char const *argv[])
{
	test01();
	return 0;
}
```

### 7 获取文件的状态信息

> 获取文件状态信息
>
> stat和lstat的区别：
>
> 当文件是一个符号链接时，lstat返回的是该符号链接本身的信息；
>
> 而stat返回的是该链接指向的文件信息。

```java
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
int stat(const char *path, struct stat *buf);
int lstat(const char *pathname, struct stat *buf);
/*
参数：
	path：文件名
	buf：保存文件信息的结构体
返回值：
	成功：0
	失败：-1
*/
```

`strcut stat`结构体说明

```java
struct stat{
	dev_t			st_dev;			//文件的设备编号
	ino_t			st_ino;			//节点
	mode_t			st_mode;		//文件的类型和存取的权限
	nlink_t			st_nlink;		//连到该文件的硬连接数目，刚建立的文件值为1
	uid_t			st_uid;			//用户ID
	git_t			st_gid;			//组ID
	dev_t			st_rdev;		//（设备类型）若此文件为设备文件，则为其设备编...
	off_t			st_size;		//文件字节数（文件大小）
	blksize_t 		st_blksize;		//块大小（文件系统的I/O缓冲区大小）
	blkcnt_t		st_blocks;		//块数
	time_t			st_atime;		//最后一次访问时间
	time_t			st_mtime;		//最后一次修改时间
	time_t			st_ctime;		//最后一次改变时间
```

`st_mode`（16位整数）参数说明：

**案列1：获取文件的属性、大小**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
void test01()
{
	//获取文件的状态信息
	struct stat s;
	stat("b.txt", &s);
	//分析文件的状态类型（重要）
	if(S_ISREG(s.st_mode))
	{
		printf("为普通文件\n");
	}
	else if(S_ISDIR(s.st_mode))
	{
		printf("为目录文件\n");
	}
	//获取文件的权限
	if((s.st_mode & S_IRUSR) == S_IRUSR)
	{
		printf("所拥有者具备读权限\n");
	}
	if((s.st_mode & S_IWUSR) == S_IWUSR)
	{
		printf("所拥有者具备写权限\n");
	}
	if((s.st_mode & S_IXUSR) == S_IXUSR)
	{
		printf("所拥有者具备执行权限\n");
	}
}
int main(int argc, char const *argv[])
{
	test01();
	return 0;
}
```

### 8 文件目录操作

#### 8.1 得到文件目录的句柄

```java
#include <sys/types.h>
#include <dirent.h>
DIR *opendir(const char *name);
功能：打开一个目录
参数：
	name：目录名
返回值：
	成功：返回指向该目录结构体指针
	失败：NULL
```

**例**

```java
#include <stdio.h>
#include <sys/types.h>
#include <dirent.h>
int main(int argc, char const *argv[])
{
	//1. 获取文件目录句柄
	DIR *dir = opendir("./");
	if(dir == NULL)
	{
		perror("opendir");
		return 0;
	}
}
```

#### 8.2 读取目录

```java
#include <dirent.h>
struct dirent *readdir(DIR *direp);
功能：读取目录（调用一次只能读取一个文件）
参数：
	dirp：opendir的返回值
返回值：
	成功：目录结构体指针
	失败：NULL
相关结构体说明：
struct dirent
{
	ino_t d_ino;				//此目录进入点的inode
	off_t d_off;				//目录文件开头至此目录进入点得位移
	signed short int d_reclen;	//d_name的内容长度，不包含NULL字符
	unsigned char d_type;		//d_type所指的文件类型
	char d_name[256];			//文件名
}
```

**例**

```java
#include <stdio.h>
#include <sys/types.h>
#include <dirent.h>
int main(int argc, char const *argv[])
{
	//1. 获取文件目录句柄
	DIR *dir = opendir("./");
	if(dir == NULL)
	{
		perror("opendir");
		return 0;
	}
	//2. 读取文件
	struct dirent *ret;
	while(ret = readdir(dir))
	{
		if((ret->d_type & DT_REG) == DT_REG)
		{
			printf("%s是普通文件\n", ret->d_name);
		}
		else if(ret->d_type &DT_DIR) == DT_DIR)
		{
			printf("%s是目录文件\n", ret->d_name);
		}
	}
}
```

#### 8.3 关闭目录

```java
#include <sys/types.h>
#include <dirent.h>
int closedir(DIR *dirp);
功能：
	关闭目录
参数：
	dirp：opendir返回的指针
返回值：
	成功：0
	失败：-1
```

**例**

```java
#include <stdio.h>
#include <sys/types.h>
#include <dirent.h>
int main(int argc, char const *argv[])
{
	//1. 获取文件目录句柄
	DIR *dir = opendir("./");
	if(dir == NULL)
	{
		perror("opendir");
		return 0;
	}
	//2. 读取文件
	struct dirent *ret;
	while(ret = readdir(dir))
	{
		if((ret->d_type & DT_REG) == DT_REG)
		{
			printf("%s是普通文件\n", ret->d_name);
		}
		else if(ret->d_type &DT_DIR) == DT_DIR)
		{
			printf("%s是目录文件\n", ret->d_name);
		}
	}
	//3. 关闭目录句柄
	closedir(dir);
	return 0;
}
```
