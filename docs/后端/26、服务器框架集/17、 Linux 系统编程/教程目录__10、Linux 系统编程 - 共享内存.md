# 10、Linux 系统编程 - 共享内存
- 来源：https://ddkk.com/zhuanlan/server/linux/3/10.html
- 分类：服务器框架
- 分组：教程目录
## 共享内存

### 1 共享内存概述

> 共享内存允许两个或多个进程共享给定的存储区域

> 共享内存的特点：
>
>
> 共享内存是进程间共享数据的一种最快的方法。一个进程向共享的内存区域写入了数据，共享这个内存区域的所有进程就可以立刻看到其中的内容。
> 使用共享内存要注意的是多个进程之间对一个给定存储区访问的互斥。若一个进程正在向共享内存区写数据，则在它做完这一步操作前，别的进程不应当去读、写这些数据。

在ubuntu部分版本中共享内存限制值如下

共享存储区的最小字节数：1

共享存储区的最大字节数：32M

共享存储区的最大个数：4096

每个进程最多能映射的共享存储区的个数：4096

### 2 共享内存的创建或使用

#### 2.1 获得一个唯一共享存储标识符（创建或打开一个共享内存区）

> 创建或打开一个共享内存区

```java
#include <sys/ipc.h>
#include <sys/shm.h>
int shmget(key_t key, size_t size, int shmflg);
参数：
	key：IPC键值
	size：该共享存储段的长度（字节）
	shmflg：标识函数的行为及共享内存的权限
		IPC_CREAT：如果不存在就创建
		IPC_EXCL：如果已经存在则返回失败
		位或权限位：共享内存位或权限后可以设置共享内存的访问权限，格式和open函数的mode_t一样，但可执行权限未使用
返回值：
	成功：返回共享内存标识符
	失败：-1
```

使用shell命令操作共享内存：

查看共享内存：`ipcs -m`

删除共享内存：`ipcrm -1m shmid`

#### 2.2 建立进程虚拟内存和物理内存的映射

> 将一个共享内存段映射到调用进程的数据段中

```java
#include <sys/types.h>
#include <sys/shm.h>
void *shmat(int shmid, const void *shmaddr, int shmflg);
参数：
	shmid：共享内存标识符
	shmaddr：共享内存映射地址（若为NULL则由系统自动指定，推荐使用NULL）
	shmflg：共享内存段的访问权限和映射条件
		0：共享内存具有可读可写权限
		SHM_RDONLY：可读
		SHM_RND：（shmaddr非空时才有效）
			没有指定SHM_RND则此段连接到shmaddr所指定的地址上（shmaddr必须页对齐）
			指定了SHM_RND则此段连接到shmaddr-shmaddr%SHMLBA所表示的地址上
返回值：
	成功：返回共享内存段映射地址
	失败：-1
```

注：shmat函数使用的时候第二个和第三个参数一般为NULL和0，即系统自动指定共享内存地址，并且共享内存可读可写

#### 2.3 接触共享映射区

> 将共享内存和当前进程分离（仅仅是断开联系并不删除共享内存）

```java
#include <sys/types.h>
#include <sys/shm.h>
int shmdt(const void *shmaddr);
参数：
	shmaddr：共享内存映射地址
返回值：
	成功：0
	失败：-1
```

#### 2.4 共享内存控制

> 共享内存空间的控制

```java
#include <sys/ipc.h>
#include <sys/shm.h>
int shmctl(int shmid, int cmd, struct shmid_ds *buf);
参数：
	shmid：共享内存标识符
	cmd：函数功能的控制
		IPC_RMID：删除
		IPC_SET：设置shmid_ds参数
		IPC_STAT：保存shmid_ds参数
		SHM_LOCK：锁定共享内存段（超级用户）
		SHM_UNLOCK：解锁共享内存段
	buf：shmid_ds数据类型的地址，用来存放或修改共享内存的属性
返回值：
	成功：0
	失败：-1
```

注：SHM_LOCK用于锁定内存，禁止内存交换。并不代表共享内存被锁定后禁止其他进程访问。其真正的意义是：被锁定的内存不允许被交换到虚拟内存中。这样做的优势在于让共享内存一直处于内存中，从而提高程序性能。

#### 2.5 例：共享内存实用

##### 2.5.1 write.c

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <sys/shm.h>
#include <string.h>
int main(int argc, char const *argv[])
{
	//获取唯一的key
	key_t key = ftok("/", 2022);
	//获取共享内存的标识(分配物理内存)
	int shm_id = shmget(key, 32, IPC_CREAT|0666);
	//将虚拟内存和物理内存建立映射
	char *buf = (char *)shmat(shm_id, NULL, 0);
	//操作虚拟内存
	strcpy(buf, "hello shm");
	//释放映射
	shmdt(buf);
	return 0;
}
```

##### 2.5.2 read.c

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <sys/shm.h>
int main(int argc, char const *argv[])
{
	//获取唯一的key
	key_t key = ftok("/", 2022);
	//获取共享内存的标识(分配物理内存)
	int shm_id = shmget(key, 32, IPC_CREAT|0666);
	//将虚拟内存和物理内存建立映射
	char *buf = (char *)shmat(shm_id, NULL, 0);
	//操作虚拟内存
	printf("%s\n", buf);
	//释放映射
	shmdt(buf);
	return 0;
}
```
