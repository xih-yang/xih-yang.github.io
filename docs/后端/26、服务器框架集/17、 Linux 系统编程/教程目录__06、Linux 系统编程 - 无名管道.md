# 06、Linux 系统编程 - 无名管道
- 来源：https://ddkk.com/zhuanlan/server/linux/3/6.html
- 分类：服务器框架
- 分组：教程目录
## 无名管道

### 1 无名管道概述

> 管道(pipe)又称无名管道。无名管道是一种特殊类型的文件，在应用层体现为两个打开的文件描述符。

> 管道是最古老的UNIX IPC（进程间通信方式）方式，其特点是：
>
>
> 半双工，数据在同一时刻只能在一个方向上流动。
> 数据只能从管道的一端写入，从另一端读出。
> 写入管道中的数据遵循先入先出的规则。
> 管道所传送的数据是无格式的，这要求管道的读出方与写入方必须事先约定好数据的格式，如多少字节算一个消息等。
> 管道不是普通的文件，不属于某个文件系统，其只存在于内存(内核内存中，而不是进程内存中)中。
> 管道在内存中对应一个缓冲区。不同的系统其大小不一定相同。
> 从管道读数据是一次性操作，数据一旦被读走，它就从管道中被抛弃，释放空间以便写更多的数据。
> 管道没有名字，只能在具有血缘关系(公共祖先)的进程之间使用。

### 2 无名管道的创建

> 经由参数filedes返回两个文件描述符

```java
#include <unistd.h>
int pipe(int filedes[2]);
参数：
	filedes为int型数组的首地址，其存放了管道的文件描述符fd[0]、fd[1]
		filedes[0]为读而打开，filedes[1]为写而打开管道
返回值：
	成功：0
	失败：-1
```

注：在使用无名管道的时候，必须事先确定谁发，谁收

**例：父进程发、子进程收**

```java
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	//创建一个无名管道
	//父进程发、子进程收
	int fd[2];
	pipe(fd);
	//创建一个子进程
	pid_t pid = fork();
	if(pid == 0)		//子进程
	{
		//子进程的写端无意义（可以事先关闭）
		close(fd[1]);
		//子进程接受父进程消息
		printf("子进程%d正在等待父进程的消息\n",getpid());
		unsigned char buf[128] = "";
		read(fd[0], buf, sizeof(buf));
		printf("子进程%d读到的消息为：%s\n", getpid(), buf);
		//子进程读完数据，应该关闭读端
		close(fd[0]);
		//显示退出
		_exit(-1);
	}
	else if(pid > 0) 	//父进程
	{
		//父进程的读端无意义（可以事先关闭）
		close(fd[0]);
		//写段写入数据
		printf("父进程：%d将3秒后写入数据hello pipe\n", getpid());
		sleep(3);
		write(fd[1], "hello pipe", strlen("hello pipe"));
		printf("父进程：%d完成写入\n", getpid());
		//通信完成，应该关闭写端
		close(fd[1]);
		//等待子进程退出
		wait(NULL);
	}
	return 0;
}
```

注：为什么无名管道不需要名字，且只能血缘关系通信？

　　因为父进程创建好管道后再创建子进程，子进程会连同管道一起复制，这样父子进程就能操作同一管道了。

### 3 无名管道读写的特点

> 默认用read函数从管道中读数据是阻塞的。
> 调用write函数向管道里写数据，当缓冲区已满时write也会阻塞。
> 通信过程中，读端口全部关闭后，写进程向管道内写数据时，写进程会（收到SIGPIPE(管道退出)信号）退出。|

**例：管道写数据，缓冲区满时阻塞**

```java
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	//创建一个无名管道
	//父进程发、子进程收
	int fd[2];
	pipe(fd);
	//创建一个子进程
	pid_t pid = fork();
	if(pid == 0)		//子进程
	{
		getchar();
		//显示退出
		_exit(-1);
	}
	else if(pid > 0) 	//父进程
	{
		int i = 0;
		for(i = 0; i < 1000; i++)
		{
			char buf[128] = "";
			write(fd[1], buf, 128);
			printf("i=%d\n",i+1);
		}
		//等待子进程退出
		wait(NULL);
	}
	return 0;
}
```

**例：读端口全部关闭后，写进程向管道内写数据时，写进程会（收到SIGPIPE(管道退出)信号）退出**

```java
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	//创建一个无名管道
	//父进程发、子进程收
	int fd[2];
	pipe(fd);
	//创建一个子进程
	pid_t pid = fork();
	if(pid == 0)		//子进程
	{
		//子进程的写端无意义（可以事先关闭）
		close(fd[1]);
		int i = 0;
		while(1)
		{
			//子进程接受父进程消息
			printf("子进程%d正在等待父进程的消息\n",getpid());
			unsigned char buf[128] = "";
			read(fd[0], buf, sizeof(buf));
			printf("子进程%d读到的消息为：%s\n", getpid(), buf);
			if(++i == 3)
			{
				break;
			}
		}
		//子进程读完数据，应该关闭读端
		close(fd[0]);
		//显示退出
		_exit(-1);
	}
	else if(pid > 0) 	//父进程
	{
		//父进程的读端无意义（可以事先关闭）
		close(fd[0]);
		while(1)
		{
			//写段写入数据
			printf("父进程：%d将3秒后写入数据hello pipe\n", getpid());
			sleep(3);
			write(fd[1], "hello pipe", strlen("hello pipe"));
			printf("父进程：%d完成写入\n", getpid());
		}
		//通信完成，应该关闭写端
		close(fd[1]);
		//等待子进程退出
		wait(NULL);
	}
	return 0;
}
```

### 4 无名管道综合案例

**例：完成 ps -A | grep bash命令**

```java
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	//创建无名管道
	int fd[2];
	pipe(fd);
	//创建两个子进程
	int i = 0;
	for(i = 0; i < 2; i++)
	{
		pid_t pid = fork();
		if( pid == 0)
			break;
	}
	if(i == 0) //子进程1
	{
		// ps -A 写段
		//读端无意义，可以事先关闭
		close（fd[0]);
		//1要作为fd[1]的副本
		dup2(fd[1],1);
		//执行ps -A
		execlp("ps","ps","-A",NULL);
		_exit(-1)
	}
	else if(i == 1) //子进程2
	{
		//grap bash 读端
		//写端无意义 可以事先关闭
		close(fd[1]);
		//0作为fd[0]的副本
		dup2(fd[0],0);
		//执行grep bash
		execlp("grep","grep","bash",NULL);
		_exit(-1);
	}
	else if(i ==2) //父进程
	{
		//关闭管道读写端
		close(fd[0]);
		close(fd[1]);
		while(1)
		{
			pid_t pid = waitpid(-1, NULL, WNOHANG);
			if(pid > 0)
			{
				printf("子进程%d退出了\n", pid);
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
	rturn 0;
}
```
