# 15、Linux 系统编程 - 信号量
- 来源：https://ddkk.com/zhuanlan/server/linux/3/15.html
- 分类：服务器框架
- 分组：教程目录
## 信号量

### 1 信号量

#### 1.1 信号量的概述

> 信号量广泛用于进程或线程间的同步和互斥，信号量本质上是一个非负的整数计数器，它被用来控制对公共资源的访问。编程时可根据操作信号量值的结果判断是否对公共资源具有访问的权限，当信号量值大于0时，则可以访问，否则将阻塞。PV原语是对信号量的操作，一次Р操作使信号量减1，一次V操作使信号量加1。信号量主要用于进程或线程间的同步和互斥这两种典型情况。
>
> 信号量数据类型为: sem_t。

**信号量用于互斥：**

> 不管多少个任务互斥，只需要一个信号量。先P操作，再V操作

**信号量用于同步：**

> 有多少个任务，就需要多少个信号量。最先执行的任务对应的信号量为1，其他信号量全部为0。
>
> 执行任务时，先P执行任务，执行完再V下一个执行任务

#### 1.2 信号量的API

##### 1.2.1 初始化信号量

> 创建一个信号量并初始化它的值。一个无名信号量在被使用前必须先初始化

```java
#include <semaphore.h>
int sem_init(sem_t *sem, int pshared, unsigned int value)
参数：
	sem：信号量的地址
	pshared：等于0，信号量在线程间共享（常用）；
			 不等于0，信号量在进程共享。
	value：信号量的初始值
返回值：
	成功：0
	失败：-1
```

##### 1.2.2 信号量减一（P操作）

> 将信号量减一，如果信号量的值为0则阻塞，大于0可以减一

```java
#include <semaphore.h>
int sem_wait(sem_t *sem);
参数：
	sem：信号量的地址
返回值：
	成功：0
	失败：-1
```

##### 1.2.3 尝试对信号量减一

> 尝试将信号量减一，如果信号量的值为0，不阻塞，立即返回，大于0可以减一

```java
#include <semaphore.h>
int sem_trywait(sem_t *sem);
参数：
	信号量的地址
返回值：
	成功：0
	失败：-1
```

##### 1.2.4 信号量加一（V操作）

> 将信号量加一

```java
#include <semaphore.h>
int sem_post(sem_t *sem);
参数：
	信号量的地址
返回值：
	成功：0
	失败：-1
```

##### 1.2.5 销毁信号量

> 销毁信号量

```java
#include <semaphore.h>
int sem_destroy(sem_t *sem);
参数：
	信号量的地址
返回值：
	成功：0
	失败：-1
```

#### 1.3 代码示例

##### 1.3.1 信号量用于线程的互斥

```java
#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>
//定义一个信号量（用于互斥）
sem_t sem;
void my_printf(char *str)
{
	int i = 0;
	while(str[i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);
		sleep(1);
	}
	return NULL;
}
void *task_fun01(void *arg)
{
	// P 操作
	sem_wait(&sem);
	my_printf((char *)arg);
	// V 操作
	sem_post(&sem);
	return NULL;
}
void *task_fun02(void *arg)
{
	// P 操作
	sem_wait(&sem);
	my_printf((char *)arg);
	// V 操作
	sem_post(&sem);
	return NULL;
}
void *task_fun03(void *arg)
{
	// P 操作
	sem_wait(&sem);
	my_printf((char *)arg);
	// V 操作
	sem_post(&sem);
	return NULL;
}
int main(int argc, char const *argv[])
{
	//信号量初始化为1，第二参数0表示用于线程
	sem_init(&sem, 0, 1);
	pthread_t tid1, tid2, tid3;
	pthread_create(&tid1, NULL, task_fun01, "hello");
	pthread_create(&tid2, NULL, task_fun02, "world");
	pthread_create(&tid3, NULL, task_fun03, "beijing");
	pthread_join(tid1, NULL);
	pthread_join(tid2, NULL);
	pthread_join(tid3, NULL);
	//销毁信号量
	sem_destroy(&sem);
	return 0;
}
```

##### 1.3.2 信号量用于线程的同步

```java
#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>
//定义三个信号量（用于同步）
sem_t sem1;
sem_t sem2;
sem_t sem3;
void my_printf(char *str)
{
	int i = 0;
	while(str[i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);
		sleep(1);
	}
	return NULL;
}
void *task_fun01(void *arg)
{
	// P 操作
	sem_wait(&sem1);
	my_printf((char *)arg);
	// V 操作
	sem_post(&sem2);
	return NULL;
}
void *task_fun02(void *arg)
{
	// P 操作
	sem_wait(&sem2);
	my_printf((char *)arg);
	// V 操作
	sem_post(&sem3);
	return NULL;
}
void *task_fun03(void *arg)
{
	// P 操作
	sem_wait(&sem3);
	my_printf((char *)arg);
	// V 操作
	sem_post(&sem1);
	return NULL;
}
int main(int argc, char const *argv[])
{
	//信号量初始化，第二参数0表示用于线程
	sem_init(&sem1, 0, 1);
	sem_init(&sem2, 0, 0);
	sem_init(&sem3, 0, 0);
	pthread_t tid1, tid2, tid3;
	pthread_create(&tid1, NULL, task_fun01, "hello");
	pthread_create(&tid2, NULL, task_fun02, "world");
	pthread_create(&tid3, NULL, task_fun03, "beijing");
	pthread_join(tid1, NULL);
	pthread_join(tid2, NULL);
	pthread_join(tid3, NULL);
	//销毁信号量
	sem_destroy(&sem1);
	sem_destroy(&sem2);
	sem_destroy(&sem3);
	return 0;
}
```

### 2 无名信号量用于有血缘关系的进程间互斥与同步

> 使用mmap完成无名信号量的定义

#### 2.1 代码示例

##### 2.1.1 无名信号量用于有血缘关系的进程间互斥

```java
#include <stdio.h>
#include <semaphore.h>
#include <unistd.h>
#include <sys/mman.h> 
void my_printf(char *str)
{
	int i = 0;
	while(str[i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//定义一个无名信号量
																//MAP_ANONYMOUS匿名映射     -1不需要文件描述符
	sem_t *sem = mmap(NULL, sizeof(sem_t), PROT_READ|PROT_WRITE, MAP_SHARED|MAP_ANONYMOUS, -1, 0);
	//无名信号量的初始化，参数2中的1表示进程，参数3中的1表示初始化值为1
	sem_init(sem, 1, 1);	
	pid_t pid = fork();
	if(pid == 0)//子进程
	{
		// P 操作
		sem_wait(sem);
		my_printf("hello");
		// V 操作
		sem_post(sem);
	}
	else if(pid > 0)//父进程
	{
		// P 操作
		sem_wait(sem);
		my_printf("world");
		// V 操作
		sem_post(sem);
	}
	//销毁信号量
	sem_destroy(sem);
	return 0;
}
```

##### 2.1.2 无名信号量用于有血缘关系的进程间同步

```java
#include <stdio.h>
#include <semaphore.h>
#include <unistd.h>
#include <sys/mman.h> 
void my_printf(char *str)
{
	int i = 0;
	while(str[i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//定义一个无名信号量
																//MAP_ANONYMOUS匿名映射     -1不需要文件描述符
	sem_t *sem1 = mmap(NULL, sizeof(sem_t), PROT_READ|PROT_WRITE, MAP_SHARED|MAP_ANONYMOUS, -1, 0);
	sem_t *sem2 = mmap(NULL, sizeof(sem_t), PROT_READ|PROT_WRITE, MAP_SHARED|MAP_ANONYMOUS, -1, 0);
	//无名信号量的初始化，参数2中的1表示进程，参数3中的1表示初始化值为1
	sem_init(sem1, 1, 1);	
	sem_init(sem2, 1, 0);
	pid_t pid = fork();
	if(pid == 0)//子进程
	{
		// P 操作
		sem_wait(sem1);
		my_printf("hello");
		// V 操作
		sem_post(sem2);
	}
	else if(pid > 0)//父进程
	{
		// P 操作
		sem_wait(sem2);
		my_printf("world");
		// V 操作
		sem_post(sem1);
	}
	//销毁信号量
	sem_destroy(sem1);
	sem_destroy(sem2);
	return 0;
}
```

### 3 有名信号量用于无血缘关系的进程间互斥与同步

#### 3.1 有名信号量的API

##### 3.1.1 创建一个有名信号量

> 创建一个有名信号量

```java
#include <fcntl.h>
#include <sys/stat.h>
#include <semaphore.h>
情况一：信号量存在
sem_t *sem_open(const char *name, int oflag);
情况二：信号量不存在
sem_t *sem_open(const char *name, int oflag, mode_t mode, unsigned int value);
参数：
	name：信号量的名字
	oflag：sem_open函数的权限标志
	mode：文件权限（可读、可写、可执行0777）的设置
	value：信号量的初始值
返回值：
	成功：信号量的地址
	失败：SEM_FALIED
```

##### 3.1.2 信号量的关闭

> 关闭信号量

```java
#include <fcntl.h>
#include <sys/stat.h>
#include <semaphore.h>
int sem_close(sem_t *sem);
参数：
	信号量的地址
返回值：
	成功：0
	失败：-1
```

##### 3.1.3 信号量文件的删除

> 删除信号量的文件

```java
#include <fcntl.h>
#include <sys/stat.h>
#include <semaphore.h>
int sem_unlink(const char *name);
参数：
	信号量的文件名
返回值：
	成功：0
	失败：-1
```

#### 3.2 代码示例

#### 3.2.1 有名信号量用于无血缘关系的进程间互斥

**进程A**

```java
#include <stdio.h>
#include <semapore.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
void my_printf(char *str)
{
	int i = 0;
	while(str[i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//创建一个有名信号量 sem_open
	sem_t *sem = sem_open("sem", O_RDWR|O_CREAT, 0666, 1);
	// P 操作
	sem_wait(sem);
	//任务
	my_printf("hello world");
	// V 操作
	sem_post(sem);
	//关闭信号量
	sem_close(sem);
	//销毁信号量
	sem_destroy(sem);
	return 0;
}
```

**进程B**

```java
#include <stdio.h>
#include <semapore.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
void my_printf(char *str)
{
	int i = 0;
	while(str[i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//创建一个有名信号量 sem_open
	sem_t *sem = sem_open("sem", O_RDWR|O_CREAT, 0666, 1);
	// P 操作
	sem_wait(sem);
	//任务
	my_printf("beijing 2022");
	// V 操作
	sem_post(sem);
	//关闭信号量
	sem_close(sem);
	//销毁信号量
	sem_destroy(sem);
	return 0;
}
```

#### 3.2.2 有名信号量用于无血缘关系的进程间同步

**进程A**

```java
#include <stdio.h>
#include <semapore.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
void my_printf(char *str)
{
	int i = 0;
	while(str[i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//创建两个有名信号量
	sem_t *sem1 = sem_open("sem1", O_RDWR|O_CREAT, 0666, 1);
	sem_t *sem2 = sem_open("sem2", O_RDWR|O_CREAT, 0666, 0);
	// P 操作
	sem_wait(sem1);
	//任务
	my_printf("hello world");
	// V 操作
	sem_post(sem2);
	//关闭信号量
	sem_close(sem1);
	sem_close(sem2);
	//销毁信号量
	sem_destroy(sem1);
	sem_destroy(sem2);
	return 0;
}
```

**进程B**

```java
#include <stdio.h>
#include <semapore.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
void my_printf(char *str)
{
	int i = 0;
	while(str[i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);
		sleep(1);
	}
	return NULL;
}
int main(int argc, char const *argv[])
{
	//创建两个有名信号量 sem_open
	sem_t *sem1 = sem_open("sem1", O_RDWR|O_CREAT, 0666, 1);
	sem_t *sem2 = sem_open("sem2", O_RDWR|O_CREAT, 0666, 0);
	// P 操作
	sem_wait(sem2);
	//任务
	my_printf("beijing 2022");
	// V 操作
	sem_post(sem1);
	//关闭信号量
	sem_close(sem1);
	sem_close(sem2);
	//销毁信号量
	sem_destroy(sem1);
	sem_destroy(sem2);
	return 0;
}
```
