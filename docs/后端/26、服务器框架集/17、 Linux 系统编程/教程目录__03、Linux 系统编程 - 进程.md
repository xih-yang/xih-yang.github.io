# 03、Linux 系统编程 - 进程
- 来源：https://ddkk.com/zhuanlan/server/linux/3/3.html
- 分类：服务器框架
- 分组：教程目录
## Linux多任务编程之进程

### 1 进程的概述

> 我们平时写的C语言代码，通过编译器编译，最终它会成为一个可执行程序，当这个可执行程序运行起来后（没有结束之前），它就成为了一个进程。程序是存放在存储介质上的一个可执行文件，而进程是程序执行的过程。进程的状态是变化的，其包括进程的创建、调度和消亡。程序是静态的，进程是动态的。

程序静态的 占磁盘空间。

进程动态的（调度、执行、消亡），占内存空间。

(进程是程序执行到结束间的这个过程)

### 2 单道、多道程序设计

> 单道程序设计所有进程一个一个排队执行。若A阻塞，B只能等待，即使CPU处于空闲状态。而在人机交互时阻塞的出现是必然的。所有这种模型在系统资源利用上及其不合理，在计算机发展历史上存在不久，大部分便被淘汰了。

> 多道程序设计在计算机内存中同时存放几道相互独立的程序，它们在管理程序控制之下，相互穿插的运行。多道程序设计必须有硬件基础作为保证。在计算机中时钟中断即为多道程序设计模型的理论基础。并发时，任意进程在执行期间都不希望放弃cpu。因此系统需要一种强制让进程让出 cpu资源的手段。时钟中断有硬件基础作为保障，对进程而言不可抗拒。操作系统中的中断处理函数，来负责调度程序执行。在多道程序设计模型中，多个进程轮流使用CPU(分时复用CPU资源)。而当下常见CPU为纳秒级，1秒可以执行大约10亿条指令。由于人眼的反应速度是毫秒级，所以看似同时在运行。1s = 1000ms 1ms = 1000us 1us = 1000ns 1s = 1000000000nse

### 3 并行和并发的区别

> 并行和并发都是指多个任务同时执行。

并行(parallel)：指在同一时刻，有多条指令在多个处理器上同时执行。（多核）

并发(concurrency)：指在同一时刻只能有一条指令执行，但多个进程指令被快速的轮换执行，使得在宏观上具有多个进程同时执行的效果，但在微观上并不是同时执行的，只是把时间分成若干段，使多个进程快速交替的执行。（单核）

### 4 进程控制块（PCB）

> 进程运行时，内核为进程每个进程分配一个 PCB（进程控制块），维护进程相关的信息，Linux内核的进程控制块是task_struct 结构体。

其内部成员有很多，我们掌握以下部分即可：进程id。系统中每个进程有唯一的id，在C语言中用pid_t类型表示，其实就是一个非负整数。进程的状态，有就绪、运行、挂起、停止等状态。进程切换时需要保存和恢复的一些CPU寄存器。描述虚拟地址空间的信息。描述控制终端的信息。当前工作目录（Current Working Directory)。umask掩码。文件描述符表，包含很多指向file结构体的指针。和信号相关的信息。用户id和组id。会话(Session）和进程组。进程可以使用的资源上限（Resource Limit）。

> PCB存在于进程的内核空间里

> 系统会为每一个进程分配一个进程ID，其类型为pid_t（非负整数）

> 进程是系统分配资源的基本单位，本质就是一个结构体，进程信息被放在一个叫做进程控制块的数据结构中，可以理解为进程属性的集合。Linux操作系统下的PCB是：task_struct

```java
	进程 = 程序 + 操作系统维护进程的相关数据结构
```

```java
task_struct{
	1. 标识符：描述本进程的唯一标识符，用来区别其他进程
	2. 状态：任务状态，退出代码 ，退出信号等
	3. 优先级：相对于其他进程的优先级
	4. 程序计数器：程序中即将被执行的下一条指令的地址
	5. 内存指针：包括程序代码和进程相关数据的指针，还有和其他进程共享的内存块的指针
	6. 上下文数据：进程执行时处理的寄存器中的数据，上下文数据，就是进程1在被CPU处理的时候有可能这个进程没被处理完就被进程2抢占了CPU，这时候寄存器中的数据就会被覆盖掉，所以，在CPU处理进程2之前，就会把寄存器中进程1的数据拷贝到上下文数据中，等到下一次再执行进程1的时候，把数据再读到寄存器中。
	7. I/O状态信息：包括显示的I/O请求，分配给进程的I/O设备和被进程使用的文件列表。
	8. 记账信息：可能包括处理器时间总和，使用的时钟树总和，时间限制，记帐号等
	9. 其他信息
}
```

### 5 进程的状态

> 进程状态反映进程执行过程的变化。这些状态随着进程的执行和外界条件的变化而转换。在三态模型中，进程状态分为三个基本状态，即运行态，就绪态，阻塞态。在五态模型中，进程分为新建态、终止态，运行态，就绪态，阻塞
>
>
> 就绪态：执行条件全部满足，等待CPU的执行调度
> 执行态：正在被CPU调度执行
> 等待态：不具备CPU调度执行的执行条件，等待条件满足。

> ●运行状态（TASK_RUNNING）:进程当前正在运行，或者正在运行队列中等待调度。

> ●可中断的阻塞状态（TASK_INTERRUPTIBLE）：进程处于阻塞(睡眠)状态，正在等待某些事件发生或能够占用某些资源。处在这种状态下的进程 可以被信号中断。接收到信号或被显式的唤醒呼叫（如调用 wake_up 系列宏:wake_up、wake_up_interruptible等）唤醒之后，进程将转变为 TASK_RUNNING 状态。

> ●不可中断的阻塞状态（TASK_UNINTERRUPTIBLE）:此进程状态类似于可中断的阻塞状态（TASK_INTERRUPTIBLE），只是它 不会处理信号，把信号传递到这种状态下的进程不能改变它的状态。在一些特定的情况下（进程必须等待，直到某些不能被中断的事件发生），这种状态是很有用 的。只有在它所等待的事件发生时，进程才被显示的唤醒呼叫唤醒。

> ●可终止的阻塞状态（TASK_KILLABLE）:该状态的运行机制类似于TASK_UNINTERRUPTIBLE，只不过处在该状态下的进程可以响应 致命信号。它可以替代有效但可能无法终止的不可中断的阻塞状态（TASK_UNINTERRUPTIBLE）,以及易于唤醒但安全性欠佳的可中断的阻塞状 态TASK_INTERRUPTIBLE）。

> ●暂停状态（TASK_STOPPED）:进程的执行被暂停，当进程收到 SIGSTOP、SIGSTP、SIGTTIN、SIGTTOU等信号时，就会进入暂停状态。

> ●跟踪状态（TASK_TRACED）:进程的执行被调试器暂停。当一个进程被另一个监控时（如调试器使用ptrace()系统调用监控测试程序），任何信号都可以把这个进程置于跟踪状态。

> ●僵尸状态（EXIT_ZOMBIE）:进程运行结束，父进程尚未使用 wait 函数族(如调用 waitpid()函数)等系统调用来“收尸”，即等待父进程销毁它。处在该状态下的进程“尸体”已经放弃了几乎所有的内存空间，没有任何可执行代码，也 不能被调度，仅仅在进程列表中保留一个位置，记载该进程的推出状态等信息供其他进程收集。

> ●僵尸撤销状态（EXIT_DEAD）:这是最终状态，父进程调用 wait 函数族“收尸”后，进程彻底由系统删除。

#### 5.1 如何查看进程状态:ps auxe

**stat中的参数意义如下**

参数
含义

D
不可中断Uninterruptible(usually IO)

R
正在运行，或在队列中的进程

S
处于休眠状态

T
停止或被追踪

Z
僵尸进程

W
进入内存交换（从内核2.6开始无效）

X
死掉的进程

 进程是一个具有一定独立功能的程序，它是操作系统执行的基本单元。

**ps命令可以查看进程的详细状态，常用选项（选项可以不加“-”）如下：**

选项
含义

-a
显示终端上的所有进程，包括其他用户的进程

-u
显示进程的详细状态

-x
显示没有控制终端的进程

-w
显示加宽，以便显示更多的信息

-r
只显示正在运行的进程

**以树状显示：pstree**

### 6 进程号 PID

> 每个进程都由一个进程号来标识，其类型为pid_t（整型)，进程号的范围:0～32767。进程号总是唯一的，但进程号可以重用。当一个进程终止后，其进程号就可以再次使用。

```java
三种不同的进程号：
	1. 进程号（PID）：标识进程的一个非负整型数。
	2. 父进程（PPID）：任何进程（除init进程）都是由另一个进程创建，该进程称为被创建进程的父进程，对应的进程号称为父进程号(PPID）。
		如，A进程创建了B进程，A的进程号就是B进程的父进程号。
	3. 进程组号(PGID)：进程组是一个或多个进程的集合。
```

他们之间相互关联，进程组可以接收同一终端的各种信号，关联的进程有一个进程组号(PGID）。这个过程有点类似于QQ群，组相当于QQ群，各个进程相当于各个好友，把各个好友都拉入这个QQ群里，主要是方便管理，特别是通知某些事时，只要在群里吼一声，所有人都收到，简单粗暴。但是，这个进程组号和QQ群号是有点区别的，默认的情况下，当前的进程号会当做当前的进程组号。

#### 6.1 获取进程号

> 获取本进程号（PID）
>
> pid_t getpid(void)

```java
#include <sys/type.h>
#include <unistd.h>
pid_t getpid(void);
参数：
	无
返回值：
	本进程号
```

#### 6.2 获取父进程号

> 获取调用此函数进程的父进程号（PPID）
>
> pid_t getppid(void)

```java
#include <sys/type.h>
#include <unistd.h>
pid_t getppid(void);
参数：
	无
返回值：
	调用此函数进程的父进程号（PPID）
```

#### 6.3 获取进程组的ID

> 获取进程组（PGID）
>
> pid_t getpgid(pid_t pid)

```java
#include <sys/type.h>
#include <unistd.h>
pid_t getpgid(pid_t pid);
参数：
	pid：进程号
返回值：
	参数为 0 时返回当前进程组号，否则返回参数指定进程的进程组号
```

### 7 创建进程 fork

> 系统允许一个进程创建新进程，新进程即为子进程，子进程还可以创建新的子进程，形成进程树结构模型。

#### 7.1 fork

> 用于从一个已存在的进程中创建，一个新进程新进程称为子进程，原进程称为父进程。
>
> pid_t fork(void)

```java
#include <sys/types.h>
#include <unistd.h>
pid_t fork(void);
参数：
	无
返回值：
	成功：父进程（此进程）返回PID（pid_t为整型），fork的子进程返回0
	失败：返回-1
		 失败的两个主要原因是：
		 	1）当前的进程数已经到达了系统规定的上限，这时errno的值被设置为EAGAIN
		 	2）系统内存不足，这时errno的值被设置为ENOMEM
```

#### 7.2 fork出来的子进程和父进程之间的关系

> 使用fork函数得到的子进程是父进程的一个复制品，它从父进程处继承了整个进程的地址空间。地址空间：包括进程上下文、进程堆栈、打开的文件描述符、信号控制设定、进程优先级、进程组号等。子进程所独有的只有它的进程号，计时器等。困此，使用fork函数的代价是很太的。

**注：1. 父子进程从fork后开始继续执行。

　　2. 父子进程宏观上同时运行，微观上不确定，由系统决定，可能父进程先执行，因为创建子进程后，子进程需要创建时间。

　　3. fork后的子进程，相当于完全复制了一份父进程，如父进程有4G的内存空间，内存中地址0x2000为int a = 10，那么子进程也有4G的内存空间，内存中地址0x2000也为int a = 10，但是这两份空间是相互独立的，不是同一份，这时修改子进程中a的值为1000，并不会影响父进程的a，父进程的a任然为10。**

**例**

```java
#include <stdio.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	//创建子进程
	pid_t pid = fork();
	if(pid < 0)
	{
		perror("创建失败\n");
		return 0;
	}
	else if(pid == 0)		//子进程
	{
		printf("子进程ID：%d\n",getpid());
	}
	else if(pid > 0)		//父进程
	{
		printf("父进程ID：%d\n",getppid());
	}
	getchar();
	return 0;
}
```

#### 7.3 子进程复制父进程的资源（各自独立）

```java
#include <stdio.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	int num = 10;
	//创建子进程
	pid_t pid = fork();
	if(pid < 0)
	{
		perror("创建失败\n");
		return 0;
	}
	else if(pid == 0)		//子进程
	{
		// 在子进程中修改num的值
		num = 1000;
		printf("子进程ID：%d 中num=%d\n",getpid(),num);
	}
	else if(pid > 0)		//父进程
	{
		printf("父进程ID：%d 中num=%d\n",getppid(),num);
	}
	getchar();
	return 0;
```

#### 7.5 父子进程同时运行

```java
#include <stdio.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	int num = 10;
	//创建子进程
	pid_t pid = fork();
	if(pid < 0)
	{
		perror("创建失败\n");
		return 0;
	}
	else if(pid == 0)		//子进程
	{
		while(1)
		{
			printf("子进程ID：%d 中num=%d\n",getpid(),num);
		}
	}
	else if(pid > 0)		//父进程
	{
		while(1)
		{
			printf("父进程ID：%d 中num=%d\n",getppid(),num);
		}
	}
	getchar();
	return 0;
```

#### 7.6 特殊进程

**特殊进程分类**

**1、** 孤儿进程；

**2、** 僵尸进程；

**3、** 守护进程；

##### 7.6.1 孤儿进程

> 父进程先结束，子进程就是孤儿进程，孤儿进程会被1号进程接管（1号进程负责给子进程回收资源）

```java
#include <stdio.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	//创建子进程
	pid_t pid = fork();
	if(pid < 0)
	{
		perror("创建失败\n");
		return 0;
	}
	else if(pid == 0)		//子进程
	{
		while(1)
		{
			printf("子进程ID：%d 父进程ID：%d\n",getpid(),getppid());
			sleep(1);
		}
	}
	else if(pid > 0)		//父进程
	{
		printf("父进程ID：%d 3秒后结束\n",getppid());
		sleep(3);
	}
	return 0;
```

注：1. 孤儿进程无危害。　　

　　2. 父进程由终端控制，父进程结束后，孤儿进程会脱离终端控制。

##### 7.6.2 僵尸进程

> 子进程结束，父进程没有回收子进程资源（PCB），子进程就是僵尸进程。

注：
　　1. 系统创建一个进程会开辟一个内存空间，如4G内存，其中用户空间占3G，内核空间占1G，内核空间会自动生成一个PCB。

　　2. 进程结束，用户空间和内核空间都会被回收，但PCB不会被回收，PCB需要由父进程进行主动回收。

　　3. 子进程结束，父进程需要给子进程回收PCB，否则子进程变为僵尸进程（为僵尸进程后，等父进程结束，僵尸进程的父进程为系统1号进程，1号进程会自动回收僵尸进程 ）。

　　4. 系统生成的进程，此进程的父进程都为bash，此进程结束后，bash会自动回收此进程的PCB。

#### 7.6.3 守护进程

> 守护进程是脱离终端的孤儿进程，在后端运行。为特殊服务存在的（一般用于服务器）。

#### 7.7 回收子进程资源

> 在每个进程退出的时候，内核释放该进程所有的资源、包括打开的文件、占用的内存等。但是仍然为其保留一定的信息，这些信息主要主要指进程控制块PCB的信息（包括进程号、退出状态、运行时间等）。父进程可以通过调用 wait 或 waitpid 得到它的退出状态同时彻底清除掉这个进程。wait()和waitpid()函数的功能一样，区别在于，wait()函数会阻塞，waitpid0可以设置不阻塞，waitpid()还可以指定等待哪个子进程结束。注意:一次wait或waitpid 调用只能清理一个子进程，清理多个子进程应使用循环。wait、waitpid基本都是在父进程调用

##### 7.7.1 wait函数

> 等待任意一个进程结束，如果任意一个进程结束了，此函数会回收该进程的资源。

```java
include <sys/types.h>
include <sys/wait.h>
 pid_t wait(int *status);
参数：
	status：进程退出时的状态信息。
返回值：
	成功：已经结束子进程的进程号
	失败：-1
```

注：wait带阻塞。

> 调用wait(）函数的进程会挂起（阻塞），直到它的一个子进程退出或收到一个不能被忽视的信号时才被唤醒（相当于继续往下执行)。若调用进程没有子进程，该函数立即返回；若它的子进程已经结束，该函数同样会立即返回，并且会回收那个早已结束进程的资源。所以，wait()函数的主要功能为回收已经结束子进程的资源。如果参数status的值不是NULL，wait()就会把子进程退出时的状态取出并存入其中，这是一个整数值（int)，指出了子进程是正常退出还是被非正常结束的。这个退出信息在一个int中包含了多个字段，直接使用这个值是没有意义的，我们需要用宏定义取出其中的每个字段。

`WIFEXITED(status)`：取出子进程的退出信息如果子进程是正常终止的，取出的字段值非零。

`WEXITSTATUS(status)`：返回子进程的退出状态，退出状态保存在status 变量的8~16位。在用此宏前应先用宏WIFEXITED判断子进程是否正常退出，正常退出才可以使用此宏。

注意：此status是个wait的参数指向的整型变量。

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	//创建子进程
	pid_t pid = fork();
	if(pid < 0)
	{
		perror("创建失败\n");
		return 0;
	}
	else if(pid == 0)		//子进程
	{
		int i = 5;
		for( i = 5; i > 0; i--)
		{
			printf("子进程ID：%d 剩余生命值%ds\n",getpid(),i);
			sleep(1);
		}
		printf("子进程ID：%d 退出了\n",getpid());
		//显示结束
		——exit(10);
	}
	else if(pid > 0)		//父进程
	{
		printf("父进程ID：%d 等待子进程结束\n",getppid());
		int status = 0;
		pid_t pid = wait(&status):
		if(WIFXITED)(status))
		{
			//输出状态值
			printf("子进程退出的状态值： %d\n"， WEXITSTATUS(status));
		}
		printf("父进程ID：%d 等到子进程%d结束\n",getppid(),pid);
	}
	return 0;
```

##### 7.7.２ waitpid函数

> 等待子进程终止，如果子进程终止了，此函数会回收子进程的资源。

```java
include <sys/types.h>
include <sys/wait.h>
pid_t waitpid(pid_t pid, int *status, int option);
参数：
	pid：参数pid的值有以下几种类型：
		pid > 0 等待进程ID等于pid的子进程
		pid = 0 等待同一个进程组中的任何子进程，如果子进程已经加入了别的进程组，waitpid 不会等待它。
		pid = -1 等待任一进程，此时 waitpid 和 wait作用一样
		pid < -1 等待指定进程组的中的任何子进程，这个进程组的ID等于pid的绝对值。
	status：进程退出时的状态信息，和wait()用法一样。
	options：options提供了一些额外的选项来控制waitpid()，选项：
		0：同wait()，阻塞父进程，等待子进程退出。
		WNOHANG：没有任何已经结束的子进程，则立即返回。
		WUNTRACED：如果子进程暂停了则此函数马上返回，并且不予以理会进程的结束状态。（由于涉及到一些跟踪调试方面的知识，加之极少用到）
返回值：
	waitpid()的返回值比wait()稍微复杂一些，一共有三种情况：
	1）当正常返回的时候，waitpid()返回收集到的已经回收子进程的进程号；
	2）如果设置了选项WNOHANG，而调用中waitpid()还有子进程在运行，且没有子进程退出，返回0；父进程的所有子进程都已经退出了返回-1；返回>0表示等到一个子进程退出
	3）如果调用中出错，则返回-1，这时errno会被设置成相应的值以指示错误所在，如：当pid所对应的子进程不存在，或此进程存在，但不是调用进程的子进程，waitpid()就会出错返回，这时errno被设置为ECHILD
```

例：等价于wait的案例

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	//创建子进程
	pid_t pid = fork();
	if(pid < 0)
	{
		perror("创建失败\n");
		return 0;
	}
	else if(pid == 0)		//子进程
	{
		int i = 5;
		for( i = 5; i > 0; i--)
		{
			printf("子进程ID：%d 剩余生命值%ds\n",getpid(),i);
			sleep(1);
		}
		printf("子进程ID：%d 退出了\n",getpid());
		//显示结束
		——exit(10);
	}
	else if(pid > 0)		//父进程
	{
		printf("父进程ID：%d 等待子进程结束\n",getppid());
		int status = 0;
		pid_t pid = waitpid(-1, &status, 0):
		if(WIFXITED)(status))
		{
			//输出状态值
			printf("子进程退出的状态值： %d\n"， WEXITSTATUS(status));
		}
		printf("父进程ID：%d 等到子进程%d结束\n",getppid(),pid);
	}
	return 0;
```

#### 7.8 创建多个子进程

##### 7.8.1 创建2个子进程

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	int i = 0;
	for(i = 0; i < 2; i++)
	{
		pid_t pid = fork();
	}
	while(1)
	{
	}
	return 0;
}
```

注：for循环两次，应该fork两个子进程，结果有三个！！！

　　因为for循环时，创建子进程，但for循环还没结束，条件任然成立，所以子进程会进入for循环创建孙进程。

**解决方案**

> 防止子进程创建孙进程

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>
int main(int argc, char const *argv[])
{
	int i = 0;
	for(i = 0; i < 2; i++)
	{
		pid_t pid = fork();
		if(pid == 0)
		{
			break;
		}
	}
	while(1)
	{
	}
	return 0;
}
```

##### 7.8.2 创建多进程

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>
#define N 3
int main(int argc, char const *argv[])
{
	int i = 0;
	for(i = 0; i < N; i++)
	{
		pid_t pid = fork();
		if(pid == 0)
		{
			break;
		}
	}
	//判断具体的子进程
	if(i == 0) //子进程1
	{
		//完成任务A
		int j = 5;
		for(j = 0; j > 0; j--)
		{
			printf("子进程%d 剩余时间%ds\n",getpid(),j);
			sleep(1);
		}
		_exit(-1);
	}
	else if(i == 1)//子进程2
	{
		//完成任务B
		int j = 3;
		for(j = 0; j > 0; j--)
		{
			printf("子进程%d 剩余时间%ds\n",getpid(),j);
			sleep(1);
		}
		_exit(-1);
	}
	else if(i == 2)//子进程3
	{
		//完成任务C
		int j = 8;
		for(j = 0; j > 0; j--)
		{
			printf("子进程%d 剩余时间%ds\n",getpid(),j);
			sleep(1);
		}
		_exit(-1);
	}
	else if(i == N)//父进程
	{
		while(1)
		{
			//回收所有子进程的资源
			pid_t pid = waitpid(-1, NULL, WNOHANG);//不阻塞
			if(pid > 0) //某个子进程退出了
			{
				printf("子进程%d退出了\n",pid);
			}
			else if(pid == 0) //还有子进程在运行
			{
				continue;
			}
			else if(pid == -1) //所有子进程都退出了
			{
				break;
			}
		}
	}
	return 0;
}
```

#### 7.9 终端

> 在UNIX系统中，用户通过终端登录系统后得到一个Shell进程，这全终端成为Shell进程的控制终端(Controlling Terminal)，进程中，控制终端是保存在PCB中的信息，而fork会复制PCB中的信息，因此由Shell进程启动的其它进程的控制终端也是这个终端。默认情况下（没有重定向），每个进程的标准输入、标准输出和标准错误输出都指向控制终端，进程从标准输入读也就是读用户的键盘输入进程往标准输出或标准错误输出写也就是输出到显示器上。信号中还讲过，在控制终端输入一些特殊的控制键可以给前台进程发信号，例如Ctrl+C表示SIGINT，Ctrl+\表示SIGQUIT。

##### 7.9.1 ttyname 函数

> 由文件描述符查出对应的文件名

```java
#include <unistd.h>
char *ttyname(int fd);
参数：
	fd：文件描述符
返回值：
	成功：终端名
	失败：NULL
```

**例：借助ttyname函数，通过实验看一下各种不同的终端对应的设备文件名**

```java
#include <unistd.h>
#include <stdio.h>
int main()
{
	printf("fd 0: %s\n", ttyname(0));
	printf("fd 1: %s\n", ttyname(1));	
	printf("fd 2: %s\n", ttyname(2));	
	return 0;
}
```

#### 7.10 进程组

> 进程组，也称之为作业。BSD于1980年前后向Unix中增加的一个新特性代表一个或多个进程的集合。每个进程都属于一个进程组。在waitpid函数和 kill函数的参数中都曾使用到。操作系统设计的进程组的概念，是为了简化对多个进程的管理。当父进程，创建子进程的时候，默认子进程与父进程属于同一进程组。进程组ID为第一个进程ID(组长进程)。所以，组长进程标识 ：其进程组ID为其进程ID。
>
> 可以使用kill -SIGKILL -进程组ID(负的)来将整个进程组内的进程全部杀死：

> 组长进程可以创建一个进程组，创建该进程组中的进程，然后终止。只要进程组中有一个进程存在，进程组就存在，与组长进程是否终止无关。进程组生存期：进程组创建到最后一个进程离开(终止或转移到另一个进程组)。一个进程可以为自己或子进程设置进程组ID。I

##### 7.10.1 getpgrp 函数

> 获取当前进程的进程组ID

```java
#include <unistd.h>
pid_t getpgrp(void);
参数：
	无
返回值：
	总是返回调用者的进程组ID
```

##### 7.10.2 getpgid 函数

> 获取指定进程的进程组ID

```java
#include <unistd.h>
pid_t getpgrp(void);
参数：
	pid：进程号，如果pid = 0， 那么该函数作用和getpgrp一样
返回值：
	成功：进程组ID
	失败：-1
```

##### 7.10.3 setpgid 函数

> 改变进程默认所属的进程租。通常可用来加入一个现有的进程组或创建一个新进程组。

```java
#include <unistd.h>
int setpgid(pid_t pid, pid_t pgid);
参数：
	将参1对应的进程，加入参2对应的进程组中
返回值：
	成功：0
	失败：-1
```

#### 7.11 会话

> 会话是一个或多个进程组的集合。一个会话可以有一个控制终端。这通常是终端设备或伪终端设备；建立与控制终端连接的会话首进程被称为控制进程；一个会话中的几个进程组可被分为一个前台进程组以及一个或多个后台进程组;如果一个会话有一个控制终端，则它有一个前台进程组，其它进程组为后台进程组；如果终端接口检测到断开连接，则将挂断信号发送至控制进程（会话首进程）。

如果进程ID== 进程组ID==会话ID那么该进程为会话首进程

##### 7.11.1 创建会话的步骤

> 1)调用进程不能是进程组组长，该进程变成新会话首进程(session header)
>
> 2)该调用进程是组长进程，则出错返回。
>
> 3)该进程成为一个新进程组的组长进程4)需有root权限(ubuntu不需要)
>
> 5)新会话丢弃原有的控制终端，该会话没有控制终端
>
> 6)建立新会话时，先调用fork，父进程终止，子进程调用setsid

 获取进程所属的会话ID

```java
#include <unistd.h>
pid_t getsid(pid_t pid);
参数：
	pid：进程号，pid为0表示查看当前进程session ID
返回值：
	成功：返回调用进程的会话ID
	失败；-1
```

注：组长进程不能成为新会话首进程，新会话首进程必定会成为组长进程

##### 7.11.3 setsid 函数

> 创建一个会话，并以自己的ID设置进程组ID，同时也是新会话的ID。调用了setsid函数的进程，即是新的会长，也是新的组长。

```java
#include <unistd.h>
pid_t setid(void);
参数：
	无
返回值：
	成功：返回调用进程的会话ID
	失败；-1
```

**案例1：创建一个会话**

```java
#include <stdio.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	pid_t pid = fork();
	//父进程结束 子进程设置会话
	if(pid>0)
	{
		exit(-1);
	}
	else if(pid == 0)
	{
		setsid();
	}
	pprintf("进程ID：%d\n",getpid());
	while(1);
	return 0;
}
```

注：虽然子进程脱离了会话终端，但是PCB还在，所以还能在终端上打印。

#### 7.12 创建守护进程模型

> 创建子进程，父进程退出(必须)所有工作在子进程中进行形式上脱离了控制终端
> 在子进程中创建新会话(必须) setsid()函数使子进程完全独立出来，脱离控制
> 改变当前目录为根目录(不是必须)chdir()函数防止占用可卸载的文件系统也可以换成其它路径
> 重设文件权限掩码(不是必须)umask()函数防止继承的文件创建屏蔽字拒绝某些权限增加守护进程灵活性
> 关闭文件描述符(不是必须)继承的打开文件不会用到，浪费系统资源，无法卸载
> 开始执行守护进程核心工作(必须)守护进程退出处理程序模型

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
int main(int argc, char const *argv[])
{
	pid_t pid = fork();
	//父进程结束
	if(pid > 0)
	{
		_exit(-1);
	}
	//子进程设置会话
	setsid();
	//改变工作目录（非必须）
	chdir("/");
	//设置权限掩码
	umask(0002);
	//关闭文件描述符0 1 2
	close(0);
	close(1);
	close(2);
	//守住进程的核心任务
	while(1)
	{
		//核心任务
	}
	return 0;
}
```

#### 7.13 vfork 创建进程

> 创建一个新进程

```java
#include <sys/types.h>
#include <unistd.h>
pid_t vfork(void)
参数：
	无
返回值：
	成功：
		1. 在子进程中返回0
		2. 在父进程中返回子进程ID
	失败：
		返回-1
```

> 注：vfork 函数和fork 函数一样都是在已有的进程中创建一个新的进程，但它们创建的子进程是有区别的。
>
> fork和 vfork函数的区别：vfork保证子进程先运行，在它调用exec或exit之后，父进程才可能被调度运行。vfork和 fork一样都创建一个子进程，但它并不将父进程的地址空间完全复制到子进程中，因为子进程会立即调用exec(或exit)，于是也就不访问该地址空间。相反，在子进程中调用exec或exit之前，它在父进程的地址空间中运行，在exec之后子进程会有自己的进程空间。
>
> 结论：vfork创建的子进程会保证子进程先运行，只有当子进程退出（或调用exec）的时候，父进程才运行。
>
> vfork创建的子进程和父进程公用一个空间。

**子进程先运行完后父进程再运行**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
int main(int argc, char const *argv[])
{
	//vfork创建子进程
	pid_d pid =vfork();
	if(pid == 0) //子进程
	{
		int i = 0;
		for(i; i < 5; i++)
		{
			printf("子进程%d中的i=%d\n",getpid(),i);
			sleep(1);
		}
		//显示退出
		_exit(-1);
	}
	else if(pid > 0) //父进程
	{
		int i = 0;
		for(i; i < 5; i++)
		{
			printf("父进程%d中的i=%d\n",getpid(),i);
			sleep(1);
		}
	}
	return 0;
}
```

**验证vfork子进程和父进程用同一地址空间**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
int main(int argc, char const *argv[])
{
	int num = 10;
	//vfork创建子进程
	pid_d pid =vfork();
	if(pid == 0) //子进程
	{
		num = 1000;
		//显示退出
		_exit(-1);
	}
	else if(pid > 0) //父进程
	{
			printf("父进程中的num=%d\n",num);
	}
	return 0;
}
```

#### 7.14 exec函数族

> exec函数族：在进程中启动另一个进程
>
> 在Windows平台下，我们可以通过双击运行可执行程序，让这个可执行程序成为一个进程；而在 Linux平台，我们可以通过./运行，让一个可执行程序成为一个进程。但是，如果我们本来就运行着一个程序（进程），我们如何在这个进程内部启动一个外部程序，由内核将这个外部程序读入内存，使其执行起来成为一个进程呢？这里我们通过exec函数族实现。exec函数族，顾名思义，就是一簇函数，在Linux中，并不存在 exec()函数，exec指的是一组函数，一共有有6个：

```java
#include <unistd.h>
extern char **environ;
int execl(const char *path, const char *arg, .../* (char *)NULL */);
int execlp(const char *file, const char *arg, .../* (char *)NULL */);
int execle(const char *path, const char *arg, .../*, (char *）NULL, char * const envp[] */);
int execv(const char *pathc, char *const argv[]);
int execvp(const char *file, char *const argv[]);
int execvpe(const char *file, char *const argv[], char *const envp[]);
int execve(const char *filename, char *const argv[], char *const envp[]);
```

> 六个exec函数中只有execve是真正意义的系统调用(内核提供的接口)，其它函数都是在此基础上经过封装的库函数。
>
> l(list)：参数地址列表，以空指针结尾。参数地址列表char *arg0, char *arg1, … , char *argn, NULL v(vector)：在有条参数地址的指钛数组的地址。使用时先构造一个指针数组，指针数组存各参数的地址，然后将该指针数组地址作为函数的参数。
>
> p(path)按PATH环境变量指定的且录搜索可执行文件。以p结尾的exec函数取文件名做为参数。当指定filename作为参数时，若filename中包含/，则将其视为路径名，并直接到指定的路径中执行程序。
>
> e(environment)：在有环境变量字符串地址的指针数组的地址。execle和 execve改变的是exec启动的程序的环境变量（新的环境变量完全由environment 指定），其他四个函数启动的程序则使用默认系统环境变量。

**案列1：在代码中使用execl执行ls命令**

`execl(可执行文件位置，可执行文件名，可执行文件的选项，以NULL结尾);`

```java
#include <stdio.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	printf("执行ls命令前\n");
	execl("/bin/ls","ls","-a","-l","h",NULL);
	printf("执行ls命令后\n");
	return 0;
}
```

注：如果execl成功执行，execl后的代码将不会执行

> exec函数族与一般的函数不同，exec函数族中的函数执行成功后不会返回。只有调用失败了，它们才会返回一1。失败后从原程序的调用点接着往下执行。在平时的编程中，如果用到了exec函数族，一定要记得加错误判断语句。
>
> exec函数族取代调用进程的数据段、代码段和堆栈段。

注：调用exec函数族后，如原进程4G内存空间，新进程4G内存空间，新进程会完全覆盖原进程的内存空间，除了原进程ID，还保留了下列特征不变：父进程号、进程组号、控制终端根目录、当前工作目录、进程信号屏蔽集、未处理信号…

**案列2：在代码中使用execlp执行ls命令**

```java
#include <stdio.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	printf("执行ls命令前\n");
	execlp("ls","ls","-a","-l","h",NULL);
	printf("执行ls命令后\n");
	return 0;
}
```

**案列3：在代码中使用execvp执行ls命令**

```java
#include <stdio.h>
#include <unistd.h>
int main(int argc, char const *argv[])
{
	printf("执行ls命令前\n");
	char *avg[] = {
     "ls","-a","-l","h",NULL};
	execvp("ls", avg);
	printf("执行ls命令后\n");
	return 0;
}
```

**案例4：vfrok和exec配合使用**

```java
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
int main(int argc, char const *argv[])
{
	int num = 10;
	//vfork创建子进程
	pid_d pid =vfork();
	if(pid == 0) //子进程
	{
		//子进程负责启动其他程序
		execlp("ls","ls","-a","-l","-h",NULL);
		//显示退出
		_exit(-1);
	}
	else if(pid > 0) //父进程
	{
		//父进程运行自己的程序
		int i = 0;
		for(; i < 5; i++）
		{
			printf("父进程%d中的i=%d\n",getpid(),i);
			sleep(1);	
		}
	}
	return 0;
}
```

#### 7.15 fork、vfork、exec总结

> fork：开辟一片和父进程一样大的内存空间，完全复制，父子进程同时运行。

> vfork：生成一个子进程，但子进程仍在父进程内存空间中，并且先运行子进程，待子进程结束或子进程中执行exec后父进程才可执行。

> exec：在进程中运行另外一个进程。如用vfork没调用exec那讲毫无意义，vfork调用exec，原本vfork的子进程在父进程的内存空间中，exec后会将子进程迁出父进程空间并开辟一片空间给自己存放需要运行一个进程的代码。
