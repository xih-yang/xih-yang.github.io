# 08、Linux 系统编程 - 消息队列
- 来源：https://ddkk.com/zhuanlan/server/linux/3/8.html
- 分类：服务器框架
- 分组：教程目录
## 消息队列

### 1 消息队列概述

> 消息队列是消息的链表，存放在内存中，由内核维护消息队列的特点：
>
>
> 消息队列中的消息是有类型的
> 消息队列中的消息是有格式的
> 消息队列可以实现消息的随机查询。消息不一定要以先进先出的次序读取，编程时可以按消息的类型读取
> 消息队列允许一个或多个进程向它写入或者读取消息
> 与无名管道、命名管道一样，从消息队列中读出消息，消息队列中对应的数据都会被删除
> 每个消息队列都有消息队列标识符，消息队列的标识符在整个系统中是唯一的
> 只有内核重启或人工删除消息队列时，该消息队列才会被删除。若不人工删除消息队列，消息队列会一直存在于系统中

在ubuntu某些版本中消息队列限制值如下:

每个消息内容最多为8K字节

每个消息队列容量最多为16K字节

系统中消息队列个数最多为1609个

系统中消息个数最多为16384个

### 2 消息队列的API

> SystemV提供的IPC通信机制需要一个key值，通过key值就可在系统内获得一个唯一的消息队列标识符。key值可以是人为指定的，也可以通过ftok 函数获得。

#### 2.1 获取唯一的key值

> 获得项目相关的唯一的IPC键值

```java
#include <sys/types.h>
#include <sys/ipc.h>
key_t ftok(const char *pathname, int proj_id);
参数：
	pathname：路径名
	proj_id：项目ID，非0整数（只有低8位有效）
返回值：
	成功返回key值，失败返回-1
```

**例：**

**bob.c**

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/ipc.h>
int main(int argc, char const *argv[])
{
	//获取IPC的唯一KEY值
	key_t key = ftok("/",2021);
	printf("key=%d\n",key);
	return 0;
}
```

**lucy.c**

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/ipc.h>
int main(int argc, char const *argv[])
{
	//获取IPC的唯一KEY值
	key_t key = ftok("/",2021);
	printf("key=%d\n",key);
	return 0;
}
```

**tom.c**

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/ipc.h>
int main(int argc, char const *argv[])
{
	//获取IPC的唯一KEY值
	key_t key = ftok("/",2021);
	printf("key=%d\n",key);
	return 0;
}
```

#### 2.2 创建消息队列

> 创建一个新的或打开一个已经存在的消息队列。不同的进程调用此函数，只要用相同的key值就能得到同一个消息队列的标识符

```java
#include <sys/msg.h>
int msgget(key_t key, int msgflg);
参数：
	key：IPC键值
	msgflg：标识函数的行为及消息队列的权限
		msgflg的取值：
			IPC_CREAT：创建消息队列
			IPC_EXCL：检测消息队列是否存在
			位或权限位：消息队列位或权限位后可以设置消息队列的访问权限，格式和 open函数的mode_t一样，但可执行权限未使用。
返回值：
	成功：消息队列的标识符
	失败：-1
```

注：使用shell命令操作消息队列：

查看消息队列：`ipcs -q`

删除消息队列：`ipcrm -q msqid`

**例**

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/ipc.h>
int main(int argc, char const *argv[])
{
	//获取IPC的唯一KEY值
	key_t key = ftok("/",2021);
	printf("key=%#x\n",key);
	//创建一个消息队列
	int msg_id = msgget(key, IPC_CREAT|0666);
	printf("msg_id=%d\n",msg_id);
	return 0;
}
```

### 3 消息队列的信息格式定义

```java
typedef struct _msg
{
	long mtype;			//消息类型（必须是第一个成员，必须是long类型）
	char mtext[100];	//消息正文
	...					//消息的正文可以有多个成员
}MSG；
```

消息类型必须是长整型的，而且必须是结构体类型的第一个成员，类型下面是消息正文，正文可以有多个成员（正文成员可以是任意数据类型）

### 4 发送消息

> 将新消息添加到消息队列

```java
#include <sys/msg.h>
int msgsnd(int msqid, const void *msgp, size_t msgsz, int msgflg);
参数：
	msqid：消息队列的标识符
	msgp：待发送消息结构体的地址
	msgsz：消息正文的字节数			//一般为sizeof(MSG)-sizeof(long)
	msgflg：函数的控制属性
		0：msgsnd调用阻塞直到条件满足为止
		IPC_NOWAIT：若消息没有立即发送则调用该函数的进程会立即返回
返回值：
	成功：0
	失败：-1	
```

**例：bob给luny发消息**

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <string.h>
//定义一个消息类型结构体
typedef struct MyStruct
{
	long mtype;		//消息类型
	char mtext[64]; //消息正文
	char name[32];	//发送者的姓名
}MSG;
int main(int argc, char const *argv[])
{
	//获取IPC的唯一KEY值
	key_t key = ftok("/",2021);
	printf("key=%#x\n",key);
	//创建一个消息队列
	int msg_id = msgget(key, IPC_CREAT|0666);
	printf("msg_id=%d\n",msg_id);
	//发送消息 给lucy（lucy只接受20类型的数据）发消息
	MSG msg;
	memset(&msg, 0, sizeof(msg));
	msg.mtype = 20;
	strcpy(msg.name,"bob");
	strcpy(msg.mtext, "hello msg");
	msgsnd(msg_id, &msg, sizeof(MSG)-sizeof(long), 0);
	return 0;
}
```

### 5 接受消息

> 从标识符为msqid的消息队列中接受一个消息。一旦接受消息成功，则消息在消息队列中删除

```java
#include <sys/msg.h>
ssize_t msgrcv(int msqid, void *msgp, size_t msgsz, long msgtyp, int msgflg);
参数：
	msqid：消息队列的标识符，代表要从哪个消息队列中获取消息
	msgp：存放消息结构体的地址 
	msgsz：消息正文的字节数
	msgtyp：感兴趣消息的类型、可以有以下几种类型
		msgtyp = 0：返回队列中的第一个消息
		msgtyp > 0：返回队列中消息类型为msgtyp的消息
		msgtyp < 0：返回队列中消息类型小于或等于msgtyp绝对值的消息，如果这种消息有若干个，则取类型值最小的消息
		注：若消息队列中有多种类型的消息，msgrcv获取消息的时候按消息类型获取，不是先进先出的<br />
			在获取某类型消息的时候，若队列中有多条此类型的消息，则获取最先添加的消息，即先进先出原则
	msgflg：函数的控制属性
			0：msgrcv调用阻塞直到接受消息为止
			MSG_NOERROR：若返回的消息字节数比nbytes字节数多，则消息就会截断到nbytes字节，且不通知消息发送进程。
			IPC_NOWAIT：调用进程会立即返回。若没有收到消息则立即返回-1.
返回值：
	成功：返回读取消息的长度
	失败：-1
```

**例**

```java
#include <stdio.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <string.h>
//定义一个消息类型结构体
typedef struct MyStruct
{
	long mtype;		//消息类型
	char mtext[64]; //消息正文
	char name[32];	//发送者的姓名
}MSG;
int main(int argc, char const *argv[])
{
	//获取IPC的唯一KEY值
	key_t key = ftok("/",2021);
	printf("key=%#x\n",key);
	//创建一个消息队列
	int msg_id = msgget(key, IPC_CREAT|0666);
	printf("msg_id=%d\n",msg_id);
	//接受消息
	MSG msg;
	memset(&msg, 0, sizeof(msg));
	msgrcv(msg_id, &msg, sizeof(MSG)-sizeof(long), 20, 0);
	printf("发送者：%s\n",msg.name);
	printf("消息：%s\n",msg.mtext);
	return 0;
}
```

### 6 消息队列的控制：

> 对消息队列进行各种控制，如修改消息队列的属性，或删除消息消息队列

```java
#include <sys/msg.h>
int msgctl(int msqid, int cmd, struct msqid_ds *buf);
参数：
	msqid：消息队列的标识符
	cmd：函数功能的控制
		IPC_RMID：删除由msqid指示的消息队列，将它从系统中删除并破坏相关数据结构
		IPC_STAT：将msqid相关的数据结构中各个元素的当前值存入到由buf指向的结构中
		IPC_SET：将msqid相关的数据结构中的元素设置为由buf指向的结构中的对应值
	buf：msqid_ds数据类型的地址，用来存放或更改消息队列的属性
返回值：
	成功：0
	失败：-1
```

### 7 总结

> 不管是发送者还是接受者都需要
>
>
> ftok得到唯一的key
> msgget创建消息队列
>
> 发送者：
>
>
> MSG msg
> msg.mtype = 接受感兴趣的类型值
> msgsnd(msg_id, &msg, sizeof(MSG) - sizeof(long), 0) //发送消息到消息队列
>
> 接受者
>
>
> MSG msg
> msgrcv(msg_id, &msg, sizeof(MSG) - sizeof(long), 接受感兴趣的类型值, 0)
