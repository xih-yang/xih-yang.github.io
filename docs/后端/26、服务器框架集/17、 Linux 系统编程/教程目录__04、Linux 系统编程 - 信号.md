# 04、Linux 系统编程 - 信号
- 来源：https://ddkk.com/zhuanlan/server/linux/3/4.html
- 分类：服务器框架
- 分组：教程目录
## Linux进程通信之信号

### 1 信号的概述

> 信号的概念信号是Linux进程间通信的最古老的方式。信号是软件中断，它是在软件层次上对中断机制的一种模拟，是一种异步通信的方式。信号可以导致一个正在运行的进程被另一个正在运行的异步进程中断，转而处理某一个突发事件。“中断"在我们生活中经常遇到，譬如，我正在房间里打游戏，突然送快递的来了，把正在玩游戏的我给“中断"了，我去签收快递(处理中断)，处理完成后，再继续玩我的游戏。这里我们学习的“信号"就是属于这么一种“中断”。我们在终端上敲“Ctrl+c"，就产生一个“中断"，相当于产生一个信号，接着就会处理这么一个“中断任务”(默认的处理方式为中断当前进程）。

信号的特点：简单，不能携带大量信息，满足某个特设条件才发送

> 信号可以直接进行用户空间进程和内核空间进程的交互，内核进程可以利用它来通知用户空间进程发生了哪些系统事件。一个完整的信号周期包括三个部分：信号的产生，信号在进程中的注册，信号在进程中的注销，执行信号处理函数。如下图所示：

注：这里信号的产生，注册，注销时信号的内部机制，而不是信号的函数实现。

### 2 信号的编号

> 查看相应信号编号命令
>
> kill -l

不存在编号为0的信号。其中1-31号信号称之为常规信号（也叫普通信号或标准信号），34-64称之为实时信号，驱动编程与硬件相关。名字上区别不大。而前32个名字各不相同。

#### 2.1 信号四要素

> 编号
> 名称
> 事件
> 默认处理动作，可通过man 7 signal查看帮助文档获取

#### 2.2 发起信号的方式：

> 当用户按某些终端键时，将产生信号
> 硬件异常将产生信号。除数为0，无效的内存访问等
> 软件异常将产生信号（定时器）
> 调用系统函数（如：keill、raise、abort）将发送信号

### 3 未决信号集合、信号阻塞集

> 未决信号集：信号发生但未被处理的信号集合（在PCB中）
>
> 信号阻塞集：加入信号阻塞集的信号不被处理（在PCB中）
>
> 信号的实现手段导致信号有很强的延时性，但对于用户来说，时间非常短，不易察觉。Linux内核的进程控制块PCB是一个结构体，task_struct,除了包含进程id，状态，工作目录，用户 id，组 id，文件描述符表，还包含了信号相关的信息，主要指阻塞信号集和未决信号集。1阻塞信号集(信号屏蔽字〕将某些信号加入集合，对他们设置屏蔽，当屏蔽x信号后，再收到该信号，该信号的处理将推后(处理发生在解除屏蔽后)。未决信号集信号产生，未决信号集中描述该信号的位立刻翻转为1，表示信号处于未决状态。当信号被处理对应位翻转回为0。这一时刻往往非常短暂。信号产生后由于某些原因(主要是阻塞)不能抵达。这类信号的集合称之为未决信号集。在屏蔽解除前，信号一直处于未决状态。

### 4 信号的API

#### 4.1 kill 函数

> 给指定进程发送指定信号（不一定杀死）

```java
#include <sys/types.h>
#include <signal.h>
int kill(pid_t pid, int sig);
参数：
	pid：取值有4种情况：
		pid > 0：将信号传给进程ID为pid的进程
		pid = 0：将信号传给当前进程所在进程组中的所有进程
		pid = -1：将信号传送给系统内所有的进程
		pid < -1：将信号传给指定进程组的所有进程。这个进程组号等于pid的绝对值。
	sig：信号的编号，这里可以填数字编号，也可以填信号的宏定义，可以通过命令kill -l进行相应查看。不推荐直接使用数字，应使用宏名，因为不同操作系统信号编号可能不同，但名称一致
返回值：
	成功：0
	失败：-1
```

**例**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <signal.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	pid_t pid = fork();
	if(pid == 0)
	{
		while(1)
		{
			printf("进程%d -------任务-------\n",getpid());
		}
		_exit(-1);
	}
	else if(pid > 0)
	{
		printf("给你5秒时间去做任务\n");
		sleep(5);
		keill(pid, SIGKILL);
		wait(NULL);  //等待子进程结束
	}
	return 0;
}
```

#### 4.2 raise 函数

> 给当前进程发送指定信号（自己给自己发），等价于kill (getpid() ,sig)

```java
#include <signal.h>
int raise(int sig);
参数：
	sig：信号编号
返回值：
	成功：0
	失败：非0值
```

**例**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <signal.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	int i = 0;
	printf("5秒后结束进程\n");
	sleep(5);
	raise(SIGINT);
	printf("执行不到这里！");	
	return 0;
}
```

#### 4.3 abort函数

> 给自己发送异常终止信号6 (SIGABRT)，并产生core文件，等价于kill (getpid(), SIGABRT)

```java
#include <stdlib.h>
void abort(void);
参数：
	无
返回值：
	无
```

**例**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <signal.h>
#include <sys/wait.h>
#include <stdlib.h>
int main(int argc, char const *argv[])
{
	int i = 0;
	printf("5秒后结束进程\n");
	sleep(5);
	abort();
	printf("执行不到这里！");	
	return 0;
}
```

#### 4.4 alarm函数（闹钟）

> 设置定时器（闹钟）。在指定seconds后，内核会给当前进程发送14 (SIGALRM)信号。进程收到该信号，默认动作终止。每个进程都有且只有唯一的一个定时器。
>
> 取消定时器alarm(0)，返回旧闹钟余下秒数。

```java
#include <unistd.h>
unsigned int alarm(unsigned int seconds);
参数：
	seconds：指定的时间，以秒为单位
返回值：
	返回0或剩余的秒数
```

定时，与进程状态无关（自然定时法）！就绪、运行、挂起（阻塞、暂停）、终止、僵尸…无论进程处于何种状态，alarm都计时。

**例**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <signal.h>
#include <sys/wait.h>
#include <stdlib.h>
int main(int argc, char const *argv[])
{
	int i = 0;
	printf("7秒后结束进程\n");
	int s = alarm(5);	
	printf("s = %d\n", s);
	sleep(2);
	printf("刚过2秒\n"）；
	s = alarm(5);
	printf("s = %d\n", s);
	getchar();
	return 0;
}
```

#### 4.5 setitimer 函数（定时器）

> 设置定时器（闹钟）。可代替alarm函数。精度微妙us，可以实现周期定时。

```java
#include <sys/time.h>
int setitimer(int which, const struct itimerval *new_value, struct itimerval *old_value);
参数：
	which：指定定时方式
		1）自然定时：ITIMER_REAL -> 14（SIGALRM）计算自然时间
		2）虚拟空间计时（用户空间）：ITIMER_VIRTUAL -> 26（SIGVTALRM）只计算进程占用CPU的时间
		3）运行时计时（用户 + 内核）：ITIMER_PROF -> 27（SIGPROF）计算占用CPU及执行系统调用的时间
	new_value：struct itimerval，负责设定timeout时间
		struct itimerval{
			struct timerval it_interval; //闹钟出发周期
			struct timerval it_value;	 //闹钟触发时间
		}；
			struct timeval{
				long tv_sec;				 //秒
				long tv_usec;				 //微妙	
			};
			itimerval.it_value：设定第一次执行function所延迟的秒数
			itimerval.it_interval：设定以后每几秒执行function
	old_value：存放旧的timeout值，一般指定为NULL
返回值：
	成功：0
	失败：-1
```

**例：5秒过后，每2秒打印一次**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <signal.h>
#include <sys/time.h>
void my_fun(int sig)
{
	printf("触发的信号sig = %d\n", sig);
}
int main(int argc, char const *argv[])
{
	struct itimerval tv;
	//设置一次运行所需时间
	tv.it_value.tv_sec = 5;
	tv.it_value.tv_usec = 0;
	//设置周期执行时间
	tv.it_interval.tv_sec = 2;
	tv.it_interval.tv_usec = 0;
	//注册信号的自定义函数
	signal(SIGALRM, my_fun)；
	setitimer(ITIMER_REAL, &tv, NULL);
	getchar();
	return 0;
}
```

### 5. 给信号注册自定义函数

> 信号处理方式：一个进程收到一个信号的时候，可以用如下方法进行处理：
>
>
> 执行系统默认动作对大多数信号来说，系统默认动作是用来终止该进程。
> 忽略此信号（丢弃）接收到此信号后没有任何动作。
> 执行自定义信号处理函数（捕捉）用用户定义的信号处理函数处理该信号。

注：SIGKILL和SIGSTOP不能更改信号的处理方式，因为它们向用户提供了一种进程终止的可靠方法。

> 内核实现捕捉过程：

注：捕捉信号并且信号信号的t理方式有两众函数，signal和sigactione

#### 5.1 signal 函数

> 注册信号处理函数（不可用于SIGKELL、SIGSTOP信号），即确定收到信号后处理函数的入口地址。此函数不会阻塞。

```java
#include <signal.h>
typedef void(*sighandler_t)(int);
sighandler_t signal(int signum, sighandler_t handler);
参数：
	signum：信号的编号，这里可以填数字编号，也可以填信号的宏定义，可以通过命令kill -l 进行相应查看。
	handler：取值有3种情况：
		1）SIG_IGN：忽略该信号
		2）SIG_DFL：执行系统默认动作
		3）信号处理函数名：自定义信号处理函数，如：func
			回调函数的定义如下：
				void func(int signo)
				{
					//signo为触发的信号，为signal()第一个参数的值
				}
返回值：
	成功：第一次返回NULL，下一次返回此信号上一次注册的信号处理函数的地址。如果需要使用此返回值，必须在前面先声明此函数指针的类型。
	失败：返回SIG_ERR 
```

注：该函数由ANSI定义，由于历史原因在不同版本的Unix和不同版本的Linux中可能有不同的行为。因此应该尽量避免使用它，取而代之使用`sigaction`函数。

#### 5.2 sigaction 函数

> 检查或修改指定信号的设置（或同时执行这两种操作）

```java
#include <signal.h>
int sigaction(int signum, const struct sigaction *act, struct sigaction *oldact);
参数：
	signum：要操作的信号
	act：要设置的对信号的新处理方式（传入参数）
	oldact：原来对信号的处理方式（传出参数）
	(如果act指针非空，则要改变指定信号的处理方式（设置），如果aldact指针非空，则系统将此前指定信号的处理方式存入oldact
返回值：
	成功：0
	失败：-1
结构体：
struct sigaction
{
	void(*sa_handler)(int);							//旧的信号处理函数指针
	void(*sa_sigaction)(int, siginfo_t *,void *);	//新的信号处理函数指针
	sigset_t sa_mask;								//信号阻塞集
	int sa_flags;									//信号处理的方式
	void(*sa_restoret)(void);						//已弃用
};
	1）sahandler、sasigaction：信号处理函数指针，和signal（）里的函数指针用法一样，应根据情况给sasigaction、sahandler两者之一赋值，其取值如下：
		a）SIGIGN：忽略信号
		b）SIGDFL：执行系统默认动作
		c）处理函数名：自定义处理函数
	2）samask：信号阻塞集，在信号处理函数执行过程中，临时屏蔽指定的信号
	3）saflags：用于指定信号处理的行为，通常设置为0，表使用默认属性。它可以是以下值的“按位或”组合：
		a）SA_RESTART：使被信号打断的系统调用自动重新发起（已弃用）
		b）SA_NOCLDSTOP：使父进程在它的子进程暂停或继续运行时不会收到SIGCHLD信号
		c）SA_NOCLDWAIT：使父进程在它的子进程退出时不会收到SIGCHLD信号，这时子进程如果退出也不会成为僵尸进程
		d）SA_NODEFER：使对信号的屏蔽无效，即在信号处理函数执行期间仍能发出这个信号
		e）SA_RESETHAND：信号处理之后重新设置为默认的处理方式。
		f）SA_SIGINFO：使用sasigaction成员而不是sahandler作为信号处理函数
信号处理函数：
void (*sa_sigaction)(int signum, siginfo_t *info, void *context);
参数说明：
	signum：信号的编号
	info：记录信号发送进程信息的结构体
	context：可以赋给指定ucontext_t类型的一个对象的指针，已引用在传递信号时被中断的接受进程或线程的上下文
```

**例：按下crtl + c 打印消息**

```java
#include <stdio.h>
#include <signal.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/time.h>
void my_func(int sig)
{
	printf("crtl + c 被按下了\n");
}
int main()
{
	struct sigaction act;
	//act存放回调函数
	act.sa_handler = my_func;
	//act添加阻塞集 act.sa_mask
	sigemptyset(&act.sa_mask); //清空阻塞集
	//SA_RESETHAND：信号处理之后重新设置为默认的处理方式
	act.sa_flags = 0; //默认方式
	//act.sa_flags |= SA_RESETHAND;  //打开第一次按下crtl + c打印消息，之后则取消进程
	sigaction(SIGINT, &act, NULL);
	while(1);
	return 0;
```

### 6. 信号集

#### 6.1 信号集概述

> 在PCB中有两个非常重要的信号集。一个称之为“阻塞信号集"，另一个称之为“未决信号集”。这两个信号集都是内核使用位图机制来实现的。但操作系统不允许我们直接对其进行位操作。而需自定义另外一个集合，借助信号集操作函数来对PCB中的这两个信号集进行修改。

#### 6.2 自定义信号集函数

> 为了方便对多个信号进行处理，一个用户进程常常需要对多个信号做出处理，在Linux系统中引入了信号集（信号的集合）。这个信号集有点类似于我们的QQ群，一个个的信号相当于QQ群里的一个个好友。信号集是一个能表示多个信号的数据类型，sigset_t set，set即一个信号集。既然是一个集合，就需要对集合进行添加/删除等操作。相关函数说明如下:

```java
#include <signal.h>
int sigemptyset(sigset_t *set);						//将set集合置空
int sigfillset(sigset_t *set);						//将所有信号加入set集合
int sigaddset(sigset_t *set, int signo);			//将signo信号加入到set集合
int sigdelset(sigset_t *set, int signo);			//从set集合中移除signo信号
int sigismember(const sigset_t *set, int signo);	//判断信号是否存在
```

除sigismember外，其余操作函数中的set均为传出参数。sigset_t类型的本质是位图。但不应该直接使用位操作，而应该使用上述函数，保证跨系统操作有效。

```java
#include <stdio.h>
#include <signal.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/time.h>
int main(int argc, char const *argv[])
{
	//定义一个信号集合
	sigset_t set;
	//清空信号集合
	sigemptyset(&set);
	//将SIGINT加入set集合
	sigaddset(&set, SIGINT);
	//将SIGISTP加入set集合
	sigaddset(&set, SIGTSTP);
	//判断SIGINT是否在set中
	if(sigismember(&set, SIGINT))
	{
		printf("SIGINT在set集合中\n");
	}
	return 0;
}
```

#### 6.3 信号阻塞集

> 信号阻塞集也称信号屏蔽集、信号掩码。每个进程都有一个阻塞集，创建子进程时子进程将继承父进程的阻塞集。信号阻塞集用来描述哪些信号传递到该进程的时候被阻塞（在信号发生时记住它，直到进程准备好时再将信号通知进程）。所谓阻塞并不是禁止传送信号，而是暂缓信号的传送。若将被阻塞的信号从信号阻塞集中删除，且对应的信号在被阻塞时发生了，进程将会收到相应的信号。我们可以通过sigprocmask()修改当前的信号掩码来改变信号的阻塞情况。

##### 6.3.1 sigprocmask 函数

> 检查或修改信号阻塞集，根据 how 指定的方法对进程的阻塞集和进行修改，新的信
>
> 号阻塞集由set指定，而原先的信号阻塞集合由oldset保存。

```java
#include <signal.h>
int sigprocmask(int how, const sigset_t *set, sigset_t *oldset);
参数：
	how：信号阻塞集合的修改方法，有3种情况：
		1）SIG_BLOCK：向信号阻塞集合中添加set信号集，新的信号掩码是set和旧信号掩码的并集。相当于mask=mask|set。
		2）SIG_UNBLOCK：从信号阻塞集合中删除set信号集，从当前信号掩码中去除set中的信号。相当于mask=mask&~set。
		3）SIG_SETMASK：讲信号阻塞集合设为set信号集，相当于原来信号阻塞集的内容清空，然后按照set中的信号重新设置信号阻塞集。相当于mask=set。
	set:要操作的信号集地址
		若set为NULL，则不改变信号阻塞集合，函数只把当前信号阻塞集合保存到oldset中。
	oldset：保存原先信号阻塞集地址。
返回值：
	成功：0
	失败：-1，失败时错误代码只可能是EINVAL，表示参数how不合法。
```

**例：5秒内按下ctrl + c不结束进程（按下ctrl+c会将信号加入到未决信号集，但是ctrl + c信号阻塞了，不会结束进程，等5秒过后把ctrl + c信号从阻塞信号中删除，就会立马去执行ctrl + c信号，结束进程）**

```java
#include <stdio.h>
#include <signal.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/time.h>
int main(int argc, char const *argv[])
{
	//定义一个信号集合
	sigset_t set;
	//清空信号集合
	sigemptyset(&set);
	//将SIGINT加入set集合
	sigaddset(&set, SIGINT);
	//将set集合添加到阻塞集中
	sigprocmask(SIG_BLOCK, &set, NULL);
	printf("5秒后SIGINT将从阻塞集中删除\n");
	sleep(5);
	//将set集合从阻塞集删除
	sigprocmask(SIG_UNBLOCK, &set, NULL);
	getchar();
	return 0;
}
```

#### 6.4 未决信号集

##### 6.4.1 sigpending 函数

> 读取当前进程的未决信号集

```java
#include <signal.h>
int sigpending(sigset_t *set);
参数：
	set：未决信号集
返回值：
	成功：0
	失败：-1
```

**例：将信号阻塞，看信号是否在未决信号集中**

```java
#include <stdio.h>
#include <signal.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/time.h>
int main(int argc, char const *argv[])
{
	//定义一个信号集合
	sigset_t set;
	//清空信号集合
	sigemptyset(&set);
	//将SIGINT加入set集合
	sigaddset(&set, SIGINT);
	//将set集合添加到阻塞集中
	sigprocmask(SIG_BLOCK, &set, NULL);
	printf("5秒后判断SIGINT是否在未决信号集中\n");
	sleep(5);
	sigset_t set2;
	sigemptyset(&set2);
	//读取未决信号集
	sigpending(set2);
	if(sigismember(&set2,SIGINT))
	{
		printf("SIGINT在未决信号集中\n");
	}
	//将set集合从阻塞集删除
	sigprocmask(SIG_UNBLOCK, &set, NULL);
	getchar();
	return 0;
}
```

### 7. 进程间通信方式

> 进程间通信方式有7种通信方式：

**同一主机的进程通信**：

**1、** 无名管道；

**2、** 有名管道（命令管道）；

**3、** 消息队列；

**4、** mmap（存储映射）；

**5、** 共享内存；

**6、** 信号；

**不同主机的进程通信**：

　7.socket（网络通信）

#### 7.1 通信的特点

##### 7.1.1 无名管道

> 血缘关系、半双工、一对一、先进先出、无格式、数据读取后就丢弃（内存中）

##### 7.1.2 有名管道

> 有/无血缘、半双工、一对一、先进先出、无格式、数据读取后就丢弃（内存抽象成文件名）

##### 7.1.3 消息队列

> 有/无血缘、全双工、多对多、按消息类型收取、同类型先进先出、有格式、数据读取后丢失（内存中）

##### 7.1.4 mmap（存储映射）

> 多对多、无格式、数据读取后数据存在、写入覆盖以前数据（磁盘中）

##### 7.1.5 共享内存

> 多对多、无格式、数据读取后数据存在、写入覆盖以前数据（物理内存中）

##### 7.1.6 信号

> 简单、不能携带大量信息、满足某个特设条件才发送

##### 7.1.7 socket

> 不同主机间的进程通信
