# 12、Linux 系统编程 - 互斥锁
- 来源：https://ddkk.com/zhuanlan/server/linux/3/12.html
- 分类：服务器框架
- 分组：教程目录
## 线程的同步与互斥

### 1 同步与互斥的概述

> 现代操作系统基本都是多任务操作系统，即同时有大量可调度实体在运行。在多任务操作系统中，同时运行的多个任务可能：都需要访问/使用同一种资源多个任务之间有依赖关系，某个任务的运行依赖于另一个任务这两种情形是多任务编程中遇到的最基本的问题，也是多任务编程中的核心问题，同步和互斥就是用于解决这两个问题的。

#### 1.1互斥

> 是指散步在不同任务之间的若干程序片断，当某个任务运行其中一个程序片段时，其它任务就不能运行它们之中的任一程序片段，只能等到该任务运行完这个程序片段后才可以运行。最基本的场景就是：一个公共资源同一时刻只能被一个进程或线程使用，多个进程或线程不能同时使用公共资源。

同一时间，只能一个任务（进程或线程）执行，谁先运行不确定。

#### 1.2 同步

> 是指散步在不同任务之间的若干程序片断，它们的运行必须严格按照规定的某种先后次序来运行，这种先后次序依赖于要完成的特定的任务。最基本的场景就是：两个或两个以上的进程或线程在运行过程中协同步调，按预定的先后次序运行。比如A任务的运行依赖于B任务产生的数据。显然，同步是一种更为复杂的互斥，而互斥是一种特殊的同步。也就是说互斥是两个任务之间不可以同时运行，他们会相互排斥，必须等待一个线程运行完毕，另一个才能运行，而同步也是不能同时运行，但他是必须要按照某种次序来运行相应的线程（也是一种互斥）! 因此互斥具有唯一性和排它性，但互斥并不限制任务的运行顺序，即任务是无序的，而同步的任务之间则有顺序关系。

同一时间，只能一个任务（进程或线程）执行，有顺序的运行，是特殊的互斥。

### 2 互斥锁

> 互斥锁（mutex），也叫互斥量，互斥锁是一种简单的加锁的方法来控制对共享资源的访问，互斥锁只有两种状态，即加锁（lock）和解锁（unlock）。

#### 2.1 互斥锁的操作流程

> 在访问共享资源临界区域前，对互斥锁进程加锁
> 在访问完成后释放互斥锁上的锁
> 在互斥锁进程加锁后，任何其他试图再次对互斥锁加锁的线程将会阻塞，直到锁被释放

**互斥锁的数据类型是**：`pthread_mutex_t`

**安装对应帮助手册**：`$ sudo apt-get install manpages-posix-dev`

#### 2.2 互斥锁的API

##### 2.2.1 初始化互斥锁

> 初始化一个互斥锁

```java
#include <pthread.h>
int pthread_mutex_init(pthread_mutex_t *mutex, const pthread_mutexattr_t *arrt);
参数：
	mutex：互斥锁地址（类型：pthread_mutex_t）
	attr：设置互斥量的属性，通常可采样默认属性，即可将attr设为NULL。
		  可以使用宏PTHREAD_MUTEX_INITIALIZER静态初始化互斥锁。
		  比如：pthread_mutex_t mutex = PTHREAD_MUTEX_initializer；
		  这种方法等价于使用NULL指定的attr参数调用pthread_mutex_init()来完成动态初始化，不同之处在于PTHREAD_MUTEX_INITIALIZER宏不进行错误检查
返回值：
	成功：0，成功申请的默认是打开的
	失败：非0 ，错误码
```

##### 2.2.2 销毁互斥锁

> 销毁指定的一个互斥锁。互斥锁在使用完毕后，必须要对互斥锁进程销毁，以释放资源。

```java
#include <pthread.h>
int pthread_mutex_destroy(pthread_mutex_t *mutex);
参数：
	mutex：互斥锁地址
返回值：
	成功：0
	失败：非0，错误码
```

##### 2.2.3 申请上锁

> 对互斥锁上锁，若互斥锁已经上锁，则调用者阻塞，知道互斥锁解锁后再上锁。

```java
#include <pthread.h>
int pthread_mutex_lock(pthread_mutex_t *mutex);
参数：
	mutex：互斥锁地址
返回值：
	成功：0
	失败：非0，错误码
```

##### 2.2.4 试着上锁

> 调用该函数时，若互斥锁未加锁，则上锁，返回0；若互斥锁已加锁，则函数直接返回失败，即EBUSY。

```java
#include <pthread.h>
int pthread_mutex_trylock(pthread_mutex_t *mutex);
参数：
	mutex：互斥锁地址
返回值：
	成功：0
	失败：非0，错误码
```

##### 2.2.5 解锁

> 对指定的互斥锁解锁

```java
#include <pthread.h>
int pthread_mutex_unlock(pthread_mutex_t *mutex);
参数：
	mutex：互斥锁地址
返回值：
	成功：0
	失败：非0，错误码
```

#### 2.3 代码示例

##### 2.3.1 没有互斥锁多任务的运行情况

```java
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
void *deal_fun01(void *arg)
{
	char *str = (char *)arg;
	int i = 0;
	while(str [i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);			//强制刷新
		sleep(1);
	}
	return NULL；
}
void *deal_fun02(void *arg)
{
	char *str = (char *)arg;
	int i = 0;
	while(str [i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);			//强制刷新
		sleep(1);
	}
	return NULL；
}
int main(int argc, char const *argv[])
{
	//创建两个线程
	pthread_t tid1, tid2;
	pthread_create(&tid1, NULL, deal_fun01, "hello");
	pthread_create(&tid2, NULL, deal_fun02, "world");
	pthread_join(tid1, NULL);
	pthread_join(tid2, NULL);
	return 0;
}
```

##### 2.3.2 有互斥锁多任务的运行情况

```java
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
//定义一把锁
pthread_mutex_t mutex;
void *deal_fun01(void *arg)
{
	char *str = (char *)arg;
	int i = 0;
	//上锁
	pthread_mutex_lock(&mutex);
	while(str [i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);			//强制刷新
		sleep(1);
	}
	//解锁
	pthread_mutex_unlock(&mutex);
	return NULL；
}
void *deal_fun02(void *arg)
{
	char *str = (char *)arg;
	int i = 0;
	//上锁
	pthread_mutex_lock(&mutex);
	while(str [i] != '\0')
	{
		printf("%c", str[i++]);
		fflush(stdout);			//强制刷新
		sleep(1);
	}
	//解锁
	pthread_mutex_unlock(&mutex);
	return NULL；
}
int main(int argc, char const *argv[])
{
	//初始化一把锁
	pthread_mutex_init(&mutex, NULL);
	//创建两个线程
	pthread_t tid1, tid2;
	pthread_create(&tid1, NULL, deal_fun01, "hello");
	pthread_create(&tid2, NULL, deal_fun02, "world");
	pthread_join(tid1, NULL);
	pthread_join(tid2, NULL);
	//销毁锁
	pthread_mutex_destroy(&mutex);
	return 0;
}
```

##### 2.3.3 代码示例总结

如果是互斥，不管有多少个任务，只需要一把锁，所有任务的流程：上锁->访问资源->解锁

### 3 死锁

> 互斥条件，某资源只能被一个进程使用，其他进程请求该资源时，只能等待，直到资源使用完毕后释放资源。请求和保持条件程序已经保持了至少一个资源，但是又提出了新要求，而这个资源被其他进程占用，自己占用资源却保持不放。不可抢占条件进程已获得的资源没有使用完，不能被抢占。循环等待条件必然存在一个循环链。

**出现死锁的情况**

> 情况1：上完锁，未解锁
>
>
> 解决方式：上锁和解锁一一对应

> 情况2：多把锁的上锁顺序问题，导致死锁
>
>
> 解决方式：规定好上锁和解锁的顺序

> 情况3：任务中的阻塞，导致无法解锁，形成死锁
>
>
> 解决方式：修改任务为非阻塞

### 4 读写锁

> 读写锁的特点：
>
>
> 如果有其他线程读数据，则允许其他线程读操作，但不允许写操作
> 如果有其他线程写数据，则其它线程都不允许读、写操作
>
> 读写锁分为读锁和写锁，规则如下
>
>
> 如果某线程申请了读锁，其他线程可以再申请读锁，但不能申请写锁
> 如果某线程申请了写锁，其他线程不能申请读锁，也不能申请写锁

POSIX定义的读写锁的数据类型是：`pthread_rwlock_t`

#### 4.1 初始化读写锁

> 用来初始化rwlock所指向的读写锁

```java
#include <pthread.h>
int pthread_rwlock_init(pthread_rwlock_t *rwlock, const pthread_rwlockattr_t *attr);
参数：	
	rwlock：指向要初始化的读写锁指针
	attr：读写锁的属性指针。如果attr为NULL则会使用默认的属性初始化读写锁，否则使用指定的attr初始化读写锁
	可以使用宏PTHREAD_RWLOCK_INITIALIZER静态初始化读写锁，比如：
	pthread_rwlock_t my_rwlock = PTHREAD_RWLOCK_INITIALIZER;
	这种方法等价于使用NULL指定的attr参数调用pthread_rwlock_init()来完成动态初始化，不同之处在于PTHREAD_RWLOCK_INITIALIZER宏不进行错误检查
返回值：
	成功：0，读写锁的状态将成为已初始化和已解锁
	失败：非0，错误码
```

#### 4.2 销毁读写锁

> 用于销毁一个读写锁，并释放所有相关联的资源（所谓的所有指的是由pthread_rwlock_init()自动申请的资源）

```java
#include <pthread.h>
int pthread_rwlock_destroy(pthread_rwlock_t *rwlock);
参数：
	rwlock：读写锁指针
返回值：
	成功：0
	失败：非0，错误码
```

#### 4.3 申请读锁

> 以阻塞方式在读写锁上获取读锁（读锁定）。
>
> 如果没有写者持有该锁，并且没有写者阻塞在该锁上，则调用线程会获取读锁。
>
> 如果调用线程未获取读锁，则它将阻塞直到它获取了该锁。一个线程可以在一个读写锁上多次执行读锁定。
>
> 线程可以成功调用pthread_rwlock_rdlock()函数n次，但是之后该线程必须调用pthread_rwlock_unlock()函数n次才能解除锁定。

```java
#include <pthread.h>
int pthread_rwlock_rdlock(pthread_rwlock_t *rwlock); 
参数：
	rwlock：读写锁指针
返回值：
	成功：0
	失败：非0，错误码
```

#### 4.4 申请写锁

> 在读写锁上获取写锁（写锁定）。
>
> 如果没有写者持有该锁，并且没有写者读者持有该锁，则调用线程会获取写锁。
>
> 如果调用线程未获取写锁，则它将阻塞直到它获取了该锁。

```java
#include <pthread.h>
int pthread_rwlock_wrlock(pthread_rwlock_t *rwlock);
参数：
	rwlock：读写锁指针
返回值：
	成功：0
	失败：非0，错误码
```

#### 4.5 尝试申请写锁

> 用于尝试以非阻塞的方式来在读写锁上获取写锁
>
> 如果没有任何的读者或写者持有该锁，则立即失败返回。

```java
#include <pthread.h>
int pthread_rwlock_trywrlock(pthread_rwlock_t *rwlock);
参数：
	rwlock：读写锁指针
返回值：
	成功：0
	失败：非0，错误码
```

#### 4.6 释放读写锁

> 无论是读锁或写锁，都可以通过此函数解锁

```java
#include <pthread.h>
int pthread_rwlock_unlock(pthread_rwlock_t *rwlock);
参数：
	rwlock：读写锁指针
返回值：
	成功：0
	失败：非0，错误码
```

#### 4.7 代码示例：两个任务读，一个任务写

```java
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
//定义一把读写锁
pthread_rwlock_t rwlock;
void *read_data01(void *arg)
{
	int *p = (int *)arg;
	while(1)
	{
		//申请上读锁
		pthread_rwlock_rdlock(&rwlock);
		printf("任务A：num=%d\n",*p);
		//解锁写锁
		pthread_rwlock_unlock(&rwlock);
		sleep(1);
	}
	return NULL;
}
void *read_data02(void *arg)
{
	int *p = (int *)arg;
	while(1)
	{
		//申请上读锁
		pthread_rwlock_rdlock(&rwlock);
		printf("任务B：num=%d\n",*p);
		//解锁写锁
		pthread_rwlock_unlock(&rwlock);
		sleep(1);
	}
	return NULL;
}
void *write_data(void *arg)
{
	int *p = (int *)arg;
	while(1)
	{
		//申请写锁
		pthread_rwlock_wrlock(&rwlock);
		(*p)++;
		//解锁写锁
		pthread_rwlock_unlock(&rwlock);
		printf("任务C：写入num=%d\n",*p);
		sleep(2);
	} 
	return NULL;
}
int main(int argc, char const *argv[])
{
	//定义公共资源
	int num = 0;
	//初始化读写锁
	pthread_rwlock_init(&rwlock, NULL);
	//创建两个线程
	pthread_t tid1, tid2, tid3;
	pthread_create(&tid1, NULL, read_data01, (void *)&num;	//读
	pthread_create(&tid2, NULL, read_data02, (void *)&num);  //读
	pthread_create(&tid3, NULL, write_data, (void *)&num);  //写
	pthread_join(tid1, NULL);
	pthread_join(tid2, NULL);
	pthread_join(tid3, NULL);
	//销毁锁
	pthread_rwlock_destroy(&rwlock);
	return 0;
}
```
