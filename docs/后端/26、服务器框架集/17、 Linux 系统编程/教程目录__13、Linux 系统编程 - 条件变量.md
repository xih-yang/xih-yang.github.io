# 13、Linux 系统编程 - 条件变量
- 来源：https://ddkk.com/zhuanlan/server/linux/3/13.html
- 分类：服务器框架
- 分组：教程目录
## 条件变量

> 与互斥锁不同，条件变量是用来等待而不是用来上锁的，条件变量本身不是锁！条件变量用来自动阻塞一个线程，直到某特殊情况发生为止。通常条件变量和互斥锁同时使用。

> 条件变量的两个动作：条件不满，阻塞线程；当条件满足，通知阻塞的线程开始工作。条件变量的类型: pthread_cond_t

### 1 条件变量API

#### 1.1 条件变量初始化

> 初始化一个条件变量

```java
#include <pthread.h>
int pthread_cond_init(pthread_cond_t *cond, const pthread_condattr_t *attr);
参数：
	cond：指向要初始化的条件变量指针
	attr：条件变量属性，通常为默认值，传NULL即可
		  也可以使用静态初始化的方法，初始化条件变量：
		  pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
返回值：
	成功：0
	失败：非0，错误吗
```

#### 1.2 释放条件变量

> 销毁一个条件变量

```java
#include <pthread.h>
int pthread_cond_destroy(pthread_cond_t *cond);
参数：
	cond：指向要初始化的条件变量指针
返回值：
	成功：0
	失败：非0，错误号
```

#### 1.3 等待条件

> 阻塞等待一个条件变量
>
>
> a) 阻塞等待条件变量cond（参1）满足
> b) 释放已掌握的互斥锁（解锁互斥量）相当于pthread_mutex_unlock(&mutex);
> c) 当被唤醒，pthread_cond_wait函数返回时，解除阻塞并重新申请获取互斥锁pthread_mutex_lock(&mutex);
>
> 注：a)、b)两步为一个原子操作。
>
> 先阻塞变量cond，再解锁mutex，等待cond满足后对mutex再上锁

```java
#include <pthread.h>
int pthread_cond_wait(pthread_cond_t *cond, pthread_mutex_t *mutex);
参数：
	cond：指向要初始化的条件变量指针
	mutex：互斥锁
返回值：
	成功：0
	失败：非0，错误码
```

#### 1.4 限时等待一个条件变量

> 限时等待一个条件变量

```java
#include <pthread.h>
int pthread_cond_timedwait(pthread_cond_t *cond, pthread_mutex_t *mutex, const struct *abstime);
参数：
	cond：指向要初始化的条件变量指针
	mutex：互斥锁
	abstime：绝对时间
返回值：
	成功：0
	失败：非0，错误吗
```

#### 1.5 唤醒等待在条件变量上的线程

##### 1.5.1 唤醒至少一个阻塞在条件变量上的线程

> 唤醒至少一个阻塞在条件变量上的线程

```java
#include <pthread.h>
int pthread_cond_signal(pthread_cond_t *cond);
参数：
	cond：指向要初始化的条件变量值
返回值：
	成功：0
	失败：非0，错误号
```

##### 1.5.2 唤醒全部阻塞在条件变量上的线程

> 唤醒全部阻塞在条件变量上的线程

```java
#include <pthread.h> 
int pthread_cond_broadcast(pthread_cond_t *cond);
参数：
	cond：指向要初始化的条件变量指针
返回值：
	成功：0
	失败：非0，错误号
```
