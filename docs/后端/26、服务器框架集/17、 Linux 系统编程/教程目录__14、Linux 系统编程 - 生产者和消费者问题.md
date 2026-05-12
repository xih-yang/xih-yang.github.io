# 14、Linux 系统编程 - 生产者和消费者问题
- 来源：https://ddkk.com/zhuanlan/server/linux/3/14.html
- 分类：服务器框架
- 分组：教程目录
## 生产者和消费者

> 生产者消费者问题（英语：Producer-consumer problem），也称有限缓冲问题（英语：Bounded-buffer problem），是一个多线程同步问题的经典案例。该问题描述了共享固定大小缓冲区的两个线程——即所谓的“生产者”和“消费者”——在实际运行时会发生的问题。生产者的主要作用是生成一定量的数据放到缓冲区中，然后重复此过程。与此同时，消费者也在缓冲区消耗这些数据。该问题的关键就是要保证生产者不会在缓冲区满时加入数据，消费者也不会在缓冲区中空时消耗数据。

**例：** 仓库默认产品为3个，同一时刻只能生产者或消费者中的一个进入仓库（互斥）

如果仓库的产品数量为0，消费者不允许进入仓库购买（条件变量）

### 1 代码示例

```java
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
#include <time.h>
#include <stdlib.h>
//定义互斥锁
pthread_mutex_t mutex;
//定义条件变量
pthread_cond_t cond;
//定义一个仓库，默认有3个产品
int num = 3;
void *consumption_function(void *arg)  //消费
{
	while(1)
	{
		//申请上锁
		pthread_mutex_lock(&mutex);
		//判断仓库是否为空，如果为空，等待条件变量满足
		if(0 == num)	//仓库为空
		{
			printf("%s发现仓库为空，等待生产\n", (char *)arg);
			pthread_cond_wait(&cond, &mutex);  //如果为空，阻塞
		}
		//进入仓库购买产品  
		int is_shopping = 0;
		if(num > 0)
		{
			is_shopping = 1;
			--num;
			printf("%s购买了一个产品，仓库剩余%d个\n", (char *)arg, num);
		}
		//解锁
		pthread_mutex_unlock(&mutex);
		//使用产品
		if(is_shopping == 1)
		{
			printf("%s正在使用产品\n",(char *)arg);
			sleep(rand()%5);
		}
	}
	return NULL;
}	
void *production_function(void *arg)  //生产
{
	while(1)
	{
		//生产一个产品
		sleep(rand()%5);
		//上锁，进入仓库
		pthread_mutex_lock(&mutex);
		//将产品放入仓库
		num++;
		printf("%s放入一个产品，仓库剩余%d个\n",(char *)arg, num);
		//通知条件变量阻塞的线程
		pthread_cond_broadcast(&cond);
		//解锁
		pthread_mutex_unlock(&mutex);
	}
	return NULL;
}	
int main(int argc, char const *argv[])
{
	//设置随机数种子
	srand(time(NULL));
	//初始化锁
	pthread_mutex_init(&mutex, NULL);
	//初始化条件变量
	pthread_cond_init(&cond, NULL);
	pthread_t tid1, tid2, tid3;
	pthread_create(&tid1, NULL, consumption_function, "消费者A");
	pthread_create(&tid2, NULL, consumption_function, "消费者B");
	pthread_create(&tid3, NULL, production_function, "生产者A");
	//等待线程结束
	pthread_join(tid1, NULL);
	pthread_join(tid2, NULL);
	pthread_join(tid3, NULL);
	//销毁锁
	pthread_mutex_destroy(&mutex);
	//销毁条件变量
	pthread_cond_destroy(&cond);
	return 0;
}
```
