# 11、Linux 系统编程 - 线程
- 来源：https://ddkk.com/zhuanlan/server/linux/3/11.html
- 分类：服务器框架
- 分组：教程目录
## 线程

### 1 线程概述

> 在许多经典的操作系统教科书中，总是把进程定义为程序的执行实例，它并不执行什么，只是维护应用程序所需的各种资源，而线程则是真正的执行实体。所以，线程是轻量级的进程（LWP:light weight process），在Linux环境下线程的本质伋是进程。为了让进程完成一定的工作，进程必须至少包含一个线程。
>
>
> 进程是系统分配资源的基本单位
>
> 线程是CPU执行调度的基本单位
>
> 线程依赖于进程，线程共享进程的资源，线程有独立的资源（计算器，一组寄存器和栈等）
>
> 进程结束，当前进程的所有线程都将立即结束

> 进程，直观点说，保存在硬盘上的程序运行以后，会在内存空间里形成一个独立的内存体，这个内存体有自己的地址空间，有自己的堆，上级挂靠单位是操作系统。操作系统会以进程为单位，分配系统资源，所以我们也说，进程是系统分配资源的最小单位。线程存在于进程当中(进程可以认为是线程的容器)，是CPU调度执行的最小单位。说通俗点，线程就是干活的。进程是具有一定独立功能的程序关于某个数据集合上的一次运行活动，进程是系统进行资源分配的一个独立单位。

> 线程是进程的一个实体，是CPU调度和分派的基本单位，它是比进程更小的能独立运行的基本单位。线程自己基本上不拥有系统资源，只拥有一点在运行中必不可少的资源（如程序计数器，一组寄存器和栈），但是它可与同属一个进程的其他的线程共享进程所拥有的全部资源。如果说进程是一个资源管家负责从主人那里要资源的话，那么线程就是干活的苦力。一个管家必须完成一项工作，就需要最少一个苦力，也就是说，一个进程最少包含一个线程，也可以包含多个线程。苦力要干活，就需要依托于管家，所以说一个线程，必须属于某一个进程。进程有自己的地址空间，线程使用进程的地址空间，也就是说，进程里的资源，线程都是有权访问的，比如说堆啊，栈啊，静态存储区什么的。

### 2 线程函数列表安装

> 命令：
>
> manpages-posix-dev
>
> 说明：
>
> manpages-posix-dev包含POSIX的header files和library calls的用法
>
> 查看：
>
> man -k pthred

注：线程为第三方库，不是C语言自带的库

### 3 线程的特点

> 类Unix系统中，早起是没有“线程”概念的，80年代才引入，借助进程机制实现出了线程的概念。
>
> 因此在这类系统中，进程和线程关系密切：
>
>
> 线程是轻量级进程（light-weight process），也有PCB，创建线程使用的底层函数和进程一样，都是clone
> 从内核里看进程和线程是一样的，都有各自不同的PCB
> 进程可以脱变成线程
> 在Linux下，线程是最小的执行单位，进程是最小的分配资源单位

> 查看指定进程的LWP号：ps -Lf pid
>
> 实际上，无论是创建进程的fork，还是创建线程的pthread_create，底层实现都是调用同一个内核函数的clone。
>
>
> 如果复制对方的地址空间，那么就产出一个“进程”；
> 如果共享对方的地址空间，就产生一个“线程”；
> Linux内核是不区分进程和线程的，只是用户层面上进程区分；
> 所以，线程所有操作函数pthread*是库函数，而非系统调用。

#### 3.1 线程共享资源

> 文件描述符
> 每种信号的处理方式
> 当前工作目录
> 用户ID和组ID内存地址空间（.text/ .data/ .bss/ heap/ 共享库）
> 信号屏蔽字
> 调度优先级

#### 3.2 线程非共享资源

> 线程ID
> 处理器现场和栈指针（内核栈）
> 独立的栈空间（用户空间栈）
> errno 变量
> 信号屏蔽字
> 调度优先级

#### 3.3 线程的优缺点

> 优点：
>
>
> 提高程序并发性
> 开销小
> 数据通信、共享数据方便
>
> 缺点：
>
>
> 库函数，不稳定
> 调试、编写困难，gdb支持
> 对信号支持不好
>
> 总结：
>
>
> 优点相对突出，缺点均不是硬伤。Linux下由于实现方法导致进程、线程差别不是很大

### 2 线程的API

#### 2.1 获取线程号

> 获取线程号

```java
#include <pthread.h>
pthread_t pthread_self(void);
参数：
	无
返回值：
	调用线程的线程ID（pthread_t类型：unsigned long int）
```

##### 2.1.1 代码示例：获取线程号

```java
#include <stdio.h>
#include <pthread.h>
int main(int argc, char const *argv[])
{
	//查看线程号
	printf("线程号：%d\n", pthread_self());
	getchar();
	return 0;
}
```

注：使用库，编译时需要加`-lpthread`

#### 2.2 线程的创建

> 创建一个线程

```java
#include <pthread.h>
int pthread_create(pthread_t *thread, const pthread_attr_t *attr, void *(*start_routine)(void *), void *arg);
参数：
	thread：线程标识符地址
	attr：线程属性结构体地址，通常设置为NULL
	start_routine：线程函数的入口地址
	arg：传给线程函数的参数
返回值：
	成功：0
	失败：非0 
```

注：进程结束，线程就结束

##### 2.2.1 代码示例：每个线程有独立的线程函数

```java
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
void *pthread_fun01(void *arg)
{
	int i = 0;
	while(1)
	{
		printf("%s---------i=%d\n",(char *)arg,i++);
		sleep(1);
	}
	return NULL;
}
void *pthread_fun02(void *arg)
{
	int i = 0;
	while(1)
	{
		printf("%s---------i=%d\n",(char *)arg,i++);
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//创建两个线程
	pthread_t tidi, tid2;
	pthread_create(&tid1, NULL, pthread_fun01, "任务01");
	pthread_create(&tid2, NULL, pthread_fun02, "任务02");
	printf("tid1=%lu\n", tid1);
	printf("tid2=%lu\n", tid2);
	getchar();
	return 0;
}
```

##### 2.2.2 代码示例：每个线程共用同一线程函数

```java
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
void *pthread_fun(void *arg)
{
	if(strcmp(arg, "任务A") == 0)
	{
		int i = 0;
		while(1)
		{
			printf("%s---------i=%d\n",(char *)arg,i++);
			sleep(1);
		}
	}
	else if(strcmp(arg, "任务B") == 0)
	{
		int i = 0;
		while(1)
		{
			printf("%s---------i=%d\n",(char *)arg,i++);
			sleep(1);
		}
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//创建两个线程
	pthread_t tidi, tid2;
	pthread_create(&tid1, NULL, pthread_fun, "任务01");
	pthread_create(&tid2, NULL, pthread_fun, "任务02");
	printf("tid1=%lu\n", tid1);
	printf("tid2=%lu\n", tid2);
	getchar();
	return 0;
}
```

#### 2.3 回收线程资源（阻塞）

> 等待线程结束（此函数会阻塞），并回收线程资源，类似进程的wait()函数。如果线程已经结束，那么该函数会立即返回

```java
#include <pthread.h>
int pthread_join(pthread_t thread, void **retval);
参数：
	thread：被等待的线程号
	retval：用来存储线程退出状态的指针的地址
返回值：
	成功：0
	失败：非0
```

##### 2.3.1 代码示例：回收线程资源

```java
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
void *pthread_fun01(void *arg)
{
	int i = 0;
	for(; i < 5; i++)
	{
		printf("%s---------i=%d\n",(char *)arg,i++);
		sleep(1);
	}
	return NULL;
}
void *pthread_fun02(void *arg)
{
	int i = 0;
	for(; i < 3; i++)
	{
		printf("%s---------i=%d\n",(char *)arg,i++);
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//创建两个线程
	pthread_t tidi, tid2;
	pthread_create(&tid1, NULL, pthread_fun01, "任务A");
	pthread_create(&tid2, NULL, pthread_fun02, "任务B");
	//回收线程资源(带阻塞)
	pthread_join(tid1, NULL);	//不关心返回值
	printf("tid1结束了\n");
	pthread_join(tid2, NULL);	//不关心返回值
	printf("tid2结束了\n");
	getchar();
	return 0;
}
```

##### 2.3.2 代码示例：回收线程资源并获取线程返回值的值

```java
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
void *pthread_fun01(void *arg)
{
	int i = 0;
	for(; i < 5; i++)
	{
		printf("%s---------i=%d\n",(char *)arg,i++);
		sleep(1);
	}
	return （void *）"任务A";
}
void *pthread_fun02(void *arg)
{
	int i = 0;
	for(; i < 3; i++)
	{
		printf("%s---------i=%d\n",(char *)arg,i++);
		sleep(1);
	}
	return （void *）"任务B";
}
int main(int argc, char const *argv[])
{
	//创建两个线程
	pthread_t tidi, tid2;
	pthread_create(&tid1, NULL, pthread_fun01, "任务A");
	pthread_create(&tid2, NULL, pthread_fun02, "任务B");
	//回收线程资源(带阻塞)
	void *p1 = NULL;
	pthread_join(tid1, &p1);	//不关心返回值
	printf("tid1结束了,返回值为%s\n", (char *)p1);
	pthread_join(tid2, &p1);	//不关心返回值
	printf("tid2结束了,返回值为%s\n", (char *)p2);
	getchar();
	return 0;
}
```

#### 2.4 线程分离（不阻塞）

> 一般情况下，线程终止后，其终止状态一直保留到其它线程调用pthread _join获取它的状态为止。但是线程也可以被置为detach状态，这样的线程一旦终止就立刻回收它占用的所有资源，而不保留终止状态。不能对一个已经处于detach状态的线程调pthread_join，这样的调用将返回EINVAL 错误。也就是说，如果已经对一个线程调用了pthread_detach就不能再调用pthread_join了。

> 使调用线程与当前进程分离，分离后不代表此线程不依赖与当前进程，线程分离的目的是将线程资源的回收工作交由系统自动来完成，也就是说当被分离的线程结束之后，系
>
> 统会自动回收它的资源。所以，此函数不会阻塞

```java
#include <pthread.h>
int pthread_detach(pthread_t thread);
参数：
	thread：线程号
返回值：
	成功：0
	失败：非0
```

##### 2.4.1 代码示例：线程分离

```java
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
void *pthread_fun01(void *arg)
{
	int i = 0;
	for(; i < 5; i++)
	{
		printf("%s---------i=%d\n",(char *)arg,i++);
		sleep(1);
	}
	return （void *）"任务A";
}
int main(int argc, char const *argv[])
{
	//创建两个线程
	pthread_t tidi, tid2;
	pthread_create(&tid1, NULL, pthread_fun01, "任务A");
	//线程分离
	pthread_detach(tid1);
	//主函数也是个线程
	int i = 0;
	while(1)
	{
		printf("%s---------i=%d\n", "任务B", i++);
		sleep(1);
	}
	return 0;
}
```

#### 2.5 线程的退出

> 退出调用线程。一个进程中的多个线程是共享该进程的数据段，因此，通常线程退出后占用的资源并不会释放。

```java
#include <pthread.h>
void pthread_exit(void *retval);
参数：
	retval：存储线程退出状态的指针
返回值：
	无
```

##### 2.5.1 代码示例：线程的退出

```java
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
void *pthread_fun01(void *arg)
{
	int i = 0;
	while(1)
	{
		printf("%s---------i=%d\n",(char *)arg,i++);
		if(i == 5)
		{
			pthread_exit(NULL);
		}
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//创建两个线程
	pthread_t tidi, tid2;
	pthread_create(&tid1, NULL, pthread_fun01, "任务A");
	pthread_join(tid1, NULL);
	printf("任务A结束了\n");
	return 0;
}
```

#### 2.6 线程的取消

> 取消自己，也可以取消当前进程的其他线程，杀死线程

注：线程的取消并不是实时的，而有一定的延时。需要等待线程到达某个取消点(检查点)。类似于玩游戏存档，必须到达指定的场所(存档点，如：客栈、仓库、城里等)才能存储进度。杀死线程也不是立刻就能完成，必须要到达取消点。取消点：是线程检查是否被取消，并按请求进行动作的一个位置。通常是一些系统调用creat，`open`，`pause`，`close`，`read`，`write`…执行命令`man 7 pthreads`可以查看具备这些取消点的系统调用表。可粗略认为一个系统调用（进入内核）即为一个取消点。

```java
#include <pthread.h>
int pthread_cancel(pthread_t thread);
参数：
	thread：目标线程ID
返回值：
	成功：0
	失败：出错编号
```

##### 2.6.1 代码示例：线程的取消

```java
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
void *pthread_fun01(void *arg)
{
	int i = 0;
	while(1)
	{
		printf("%s---------i=%d\n",(char *)arg,i++);
		if(i == 5)
		{
			pthread_exit(NULL);
		}
		sleep(1);  //取消点
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//创建两个线程
	pthread_t tidi, tid2;
	pthread_create(&tid1, NULL, pthread_fun01, "任务A");
	//线程分离
	pthread_detach(tid1);
	printf("5秒后结束任务A\n");
	sleep(5);
	//取消线程
	pthread_detach(tid1);
	getchar();
	return 0;
}
```

### 3 线程的属性

> Linux下线程的属性是可以根据实际项目需要，进行设置，之前我们讨论的线程都是采用线程的默认属性，默认属性已经可以解决绝大多数开发时遇到的问题。如我们对程序的性能提出更高的要求那么需要设置线程属性，比如可以通过设置线程栈的大小来降低内存的使用，增加最大线程个数。

> 主要结构成员：
>
>
> 线程分离状态
> 线程栈大小（默认平均分配）
> 线程栈警戒缓冲区大小（位于栈末尾）
> 线程栈最低地址
>
> 属性值不能直接设置，必须使用相关函数进程操作，初始化的函数为pthread_attr_init，这个函数必须在 pthread_create 函数之前调用。之后须用pthread_attr_destroy函数来释放资源。线程属性主要包括如下属性：作用域(scope)、栈尺寸(stack size）、栈地址(stack address）、优先级(priority)、分离的状态(detached state)、调度策略和参数(scheduling policy and parameters）。默认的属性为非绑定、非分离，缺省的堆栈与父进程同样级别的优先级。

#### 3.1 线程属性初始化

> 注：应先初始化线程属性，在pthread_create创建线程

```java
int pthread_init(pthread_attr_t *attr);
参数：
	attr：
		typedef struct
		{
			int		etachstate;			//线程的分离状态
			int		schdpolicy;			//线程调度策略
			struct	schedparam;			//线程的调度参数
			int 	inheritsched;		//线程的继承性
			int		scope;				//线程的作用域
			size_t	guardsize;			//线程栈末尾的警械缓冲区大小
			int		stackaddr_set;		//线程的栈设置
			void*	stackaddr;			//线程栈的位置
			size_t	stacksize;			//线程栈的大小
		}pthread_attr_t;	
返回值：
	成功：0
	失败：错误号
```

#### 3.2 销毁线程属性所占用的资源

```java
int pthread_attr_destroy(pthread_attr_t *attr);
参数：
	attr
返回值:
	成功：0
	失败：错误号
```

#### 3.3 设置线程属性中的分离状态

> 设置线程属性，分离或非分离

```java
int pthread_attr_setdetachstate(pthread_attr_t *attr, int detachstat);
参数：
	attr：已初始化的线程属性
	detachstate：
		分离状态：PTHREAD_CREATE_DETACHED（分离线程）
				 PTHREAD_CREATE_JOINABLE（非分离线程）
```

#### 3.4 获取线程属性中的分离状态

> 获取线程属性，分离状态为分离或非分离

```java
int pthread_attr_getdetachstate(pthread_attr_t *attr, int detachstat);
参数：
	attr：已初始化的线程属性
	detachstate：
		分离状态：PTHREAD_CREATE_DETACHED（分离线程）
				 PTHREAD_CREATE_JOINABLE（非分离线程）
```

##### 3.1 代码示例：使用线程的属性使线程分离

**以前的方案**

注：如果线程先结束，pthread_detach后执行，就存在问题

```java
pthread_t tid1;
pthread_create(&tid1, NULL, pthread_fun01, "任务A");
//线程分离
pthread_detach(tid1);
```

**现在的方案**

注：创建线程的时候，通过线程属性设置线程分离，就定义保存，先分离后执行线程（解决了上面的问题）

```java

```

### 4 创建多线程

```java
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
typedef struct
{
	char task_name[32];
	int time;
}MSG;
void *deal_fun(void *arg)
{
	MSG p = *(MSG *)arg;
	int i = 0;
	for( i = msg.time; i > 0; i--)
	{
		printf("%s剩余时间%d\n",msg.task_name, i);
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argcv[])
{
	while(1)
	{
		MSG msg;
		printf("输入新增的任务名：");
		fgets(msg.task_name, sizeof(msg.task_name), stdin);
		msg.task_name[strlen(msg.task_name)-1] = 0;
		printf("输入运行时间：");
		scanf("%d", &msg.time);
		getchar();	//	获取换行符
		//创建线程    注：此tid只是用来记录当时创建线程的编号
		pthread_t tid;
		pthread_create(&tid, NULL, deal_fun, (void *)&msg);
		pthread_detach(tid);	//现场分离
	}
	return 0;
}
```
