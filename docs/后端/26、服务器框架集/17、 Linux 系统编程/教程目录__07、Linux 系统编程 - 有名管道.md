# 07、Linux 系统编程 - 有名管道
- 来源：https://ddkk.com/zhuanlan/server/linux/3/7.html
- 分类：服务器框架
- 分组：教程目录
## 有名管道（命名管道）

> 主要用于没有血缘关系的进程间通信。

### 1 有名管道的特点

> 命名管道(FIFO)和管道(pipe)基本相同，但也有一些显著的不同，其特点是：
>
>
> 半双工，数据在同一时刻只能在一个方向上流动。
> 写入FIFO中的数据遵循先入先出的规则。
> FIFO所传送的数据是无格式的，这要求FIFO的读出方与写入方必须事先约定好数据的格式，如多少字节算一个消息等。
> FIFO在文件系统中作为一个特殊的文件而存在，但FIFO中的内容却存放在内存中。
> 管道在内存中对应一个缓冲区。不同的系统其大小不一定相同。
> 从FIFO读数据是一次性操作数据一旦被读，它就从FIFO中被抛弃，释放空间以便写更多的数据。
> 当使用FIFO的进程退出后，FIFO文件将继续保存在文件系统中以便以后使用。
> FIFO有名字，不相关的进程可以通过打开命名管道进程通信（重要）。

### 2 有名管道的创建

> FIFO文件的创建

```java
#include <sys/types.h>
#include <sys/stat.h>
int mkfifo(const char *pathname, mode_t mode);
参数：
	pathname：FIFO的路劲名 + 文件名
	mode：mode_t类型的权限描述符
返回值：
	成功：0
	失败：如果文件已经存在，则会出错且返回-1
```

**例**

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
int main(int argc, char const *argv[])
{
	//创建有名管道(两个进程要通信，必须保证两个进程访问的有名管道是同一路劲、名)
	mkfifo("my_fifo", 0666);
	return 0;
}	
```

### 3 有名管道的使用案例

#### 3.1 两个程序，一个写FIFO，一个读FIFO

##### 3.1 写FIFO

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <string.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	//创建有名管道(两个进程要通信，必须保证两个进程访问的有名管道是同一路劲、名)
	mkfifo("my_fifo", 0666);
	//open以写的方式打开有名管道(阻塞到有进程以读的方式打开）
	int fd = open("my_fifo", O_WRONLY);
	if(fd < 0)
	{
		perror("open");
		return 0;
	}
	printf("写端open成功了\n");
	//循环写入数据
	while(1)
	{
		//获取键盘输入
		char buf[128] = "";
		printf("请输入需要发送的数据：");
		fgets(buf, sizeof(buf), stdin);
		buf(strlen(buf)-1] = 0;
		//发送数据
		write(fd, buf, strlen(buf));
		//退出循环
		if(strcmp(buf, "bye") == 0)
		{
			break;
		}
	}
	close(fd);
	return 0;
}	
```

注：open 打开有名管代是带阻塞的，直到有进程以读的方式打开此有名管道

##### 3.2 读FIFO

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <string.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	//创建有名管道(两个进程要通信，必须保证两个进程访问的有名管道是同一路劲、名)
	mkfifo("my_fifo", 0666);
	//open以写的方式打开有名管道(阻塞到有进程以写的方式打开）
	int fd = open("my_fifo", O_RDONLY);
	if(fd < 0)
	{
		perror("open");
		return 0;
	}
	printf("读端open成功了\n");
	//循环的读取数据
	while(1)
	{
		//接受数据
		char buf[128] = "";
		read(fd, buf, sizeof(buf));
		printf("收到数据为：%s\n",buf);
		//退出循环
		if(strcmp(buf, "bye") == 0)
		{
			break;
		}
	}
	close(fd);
	return 0;
}	
```

注：open 打开有名管代是带阻塞的，直到有进程以写的方式打开此有名管道

#### 3.2 将收、发FIFO合并成一个代码

> 编译时加入宏名
>
> -D 宏名
>
> 如：gcc 01_code.c -o test -D WRITE

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <string.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	//创建有名管道(两个进程要通信，必须保证两个进程访问的有名管道是同一路劲、名)
	mkfifo("my_fifo", 0666);
#ifdef WRITE
	int fd = open("my_fifo", O_WRONLY);
#endif
#ifdef READ
	int fd = open("my_fifo", O_RDONLY);
#endif
	if(fd < 0)
	{
		perror("open");
		return 0;
	}
	printf("open成功了\n");
#ifdef WRITE
	while(1)
	{
		//获取键盘输入
		char buf[128] = "";
		printf("请输入需要发送的数据：");
		fgets(buf, sizeof(buf), stdin);
		buf(strlen(buf)-1] = 0;
		//发送数据
		write(fd, buf, strlen(buf));
		//退出循环
		if(strcmp(buf, "bye") == 0)
		{
			break;
		}
	}
#endif
#ifdef READ
	while(1)
	{
		//接受数据
		char buf[128] = "";
		read(fd, buf, sizeof(buf));
		printf("收到数据为：%s\n",buf);
		//退出循环
		if(strcmp(buf, "bye") == 0)
		{
			break;
		}
	}
#endif
	return 0;
}	
```

### 4 有名管道读写的特点

> 操作FIFO文件时的特点，系统调用的I/O函数都可以作用于FIFO，如open、close、read、write等。

#### 4.1 打开FIFO时，非阻寨标志(O_NONBLOCK)产生下列影响

##### 4.1.1 以阻塞方式打开管道

> 不指定O_NONBLOCK(即open没有位或O_NONBLOCK)
>
>
> open 以只读方式打开FIFO时，要阻塞到某个进程为写而打开此FIFO
> open 以只写方式打开FIFO时，要阻塞到某个进程为读而打开此FIFO
> open 以只读、只写方式打开FIFO时会阻塞，调用read函数从FIFO里读数据时read也会阻塞
> 通信过程中若写进程先退出了，则调用read函数从FIFO里读数据时不阻塞；若写进程又重新运行，则调用read 函数从FIFO里读数据时又恢复阻塞
> 通信过程中，读进程退出后，写进程向有名管道内写数据时，写进程也会（收到SIGPIPE信号）退出
> 调用write函数向FIFO里写数据，当缓冲区已满时write也会阻塞

##### 4.1.2 以非阻塞方式打开管道

> 指定O_NONBLOCK(即open没有位或O_NONBLOCK)
>
>
> 先以只读方式打开：如果没有进程已经为写而打开一个FIFO，只读open成功，并且open不阻塞
> 先以只写方式打开：如果没有进程已经为读而打开一个FIFO，只写open将出错返回-1
> read、write读写有名管道中读数据时不阻塞
> 通信过程中，读进程退出后，写进程向有名管道内写数据时，写进程也会（收到SIGPIPE信号）退出。

注：open函数以可读可写方式打开FIFO文件时的特点：

**1、** open不阻塞；

**2、** 调用read函数从FIFO里读数据时read会阻塞；

**3、** 调用write函数向FIFO里写数据，当缓冲区已满时write也会阻塞；

### 5 单机QQ聊天程序

> 实现单机QQ聊天：父进程创建子进程，实现多任务。父进程负责发信息（向FIFO里写数据），子进程负责接受信息（从FIFO里读数据）。打开有名管道的用阻塞的方法。

#### 5.1 两个程序实现单机聊天

##### 5.1.1 用户 bob

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <string.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	//创建两个有名管道
	mkfifo("bob_to_lucy", 0666);
	mkfifo("lucy_to_bob", 0666);
	int i = 0;
	for(; i < 2; i++)
	{
		pid_t pid = fork();
		if(pid == 0)
			break;
	}
	if(i == 0)  		//子进程1 负责发消息 (bod 发给lucy)
	{
		int fd = open("bob_to_lucy", O_WRONLY);
		if(fd < 0)
		{
			perror("open");
			_exit(-1)
		}
		//获取键盘输入
		while(1)
		{
			//获取键盘输入
			char buf[128] = "";
			printf("\rbob：");
			fgets(buf, sizeof(buf), stdin);
			buf(strlen(buf)-1] = 0;
			//发送数据
			write(fd, buf, strlen(buf));
			//退出循环
			if(strcmp(buf, "bye") == 0)
			{
				break;
			}
		}
		close(fd);
		//退出进程
		_exit(-1);
	}
	else if(i == 1)		//子进程2 负责收消息 (lucy 发给 bob)
	{
		int fd = open("lucy_to_bob", O_RDONLY);
		if(fd < 0)
		{
			perror("open");
			_exit(-1)
		}
		//循环的读取数据
		while(1)
		{
			//接受数据
			char buf[128] = "";
			read(fd, buf, sizeof(buf));
			printf("\rlucy：%s\n\rbob：",buf);
			//退出循环
			if(strcmp(buf, "bye") == 0)
			{
				break;
			}
		}
		close(fd);
		return 0;
	}
	else if(i == 2) 	//父进程负责回收资源
	{
		while(1)
		{
			pid_t pid = waitpid(-1, NULL, WNOHANG);
			if(pid > 0)
			{
				printf("子进程%d退出了\n",pid);
			}
			else if(pid == 0)
			{
				continue;
			}
			else if(pid < 0)
			{
				break;
			}
		}
	}
	return 0;
}
```

##### 5.1.2 用户 lucy

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <string.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	//创建两个有名管道
	mkfifo("bob_to_lucy", 0666);
	mkfifo("lucy_to_bob", 0666);
	int i = 0;
	for(; i < 2; i++)
	{
		pid_t pid = fork();
		if(pid == 0)
			break;
	}
	if(i == 0)  		//子进程1 负责发消息 (lucy 发给 bob)
	{
		int fd = open("lucy_to_bob", O_WRONLY);
		if(fd < 0)
		{
			perror("open");
			_exit(-1)
		}
		//获取键盘输入
		while(1)
		{
			//获取键盘输入
			char buf[128] = "";
			printf("\rlucy：");
			fgets(buf, sizeof(buf), stdin);
			buf(strlen(buf)-1] = 0;
			//发送数据
			write(fd, buf, strlen(buf));
			//退出循环
			if(strcmp(buf, "bye") == 0)
			{
				break;
			}
		}
		close(fd);
		//退出进程
		_exit(-1);
	}
	else if(i == 1)		//子进程2 负责收消息 (bob 发给 lucy)
	{
		int fd = open("bob_to_lucy", O_RDONLY);
		if(fd < 0)
		{
			perror("open");
			_exit(-1)
		}
		//循环的读取数据
		while(1)
		{
			//接受数据
			char buf[128] = "";
			read(fd, buf, sizeof(buf));
			printf("\rbob：%s\n\rlucy:",buf);
			//退出循环
			if(strcmp(buf, "bye") == 0)
			{
				break;
			}
		}
		close(fd);
		return 0;
	}
	else if(i == 2) 	//父进程负责回收资源
	{
		while(1)
		{
			pid_t pid = waitpid(-1, NULL, WNOHANG);
			if(pid > 0)
			{
				printf("子进程%d退出了\n",pid);
			}
			else if(pid == 0)
			{
				continue;
			}
			else if(pid < 0)
			{
				break;
			}
		}
	}
	return 0;
}
```

#### 5.2 两个程序合并为一个实现单机聊天

> 同3.2节
