# 07、分布式事务 实战 - 一致性算法Paxos
- 来源：https://ddkk.com/zhuanlan/transaction/6/7.html
- 分类：分布式事务
- 分组：教程目录
## 前言

Google Chubby的作者Mike Burrows说过这个世界上只有一种一致性算法，那就是Paxos，其它的算法都是残次品。

PAXOS可以用来解决分布式环境下，选举（或设置）某一个值的问题（比如更新数据库中某个user的age是多少）。分布式系统中有多个节点就会存在节点间通信的问题，存在着两种节点通讯模型：共享内存（Shared memory）、消息传递（Messages passing），Paxos是基于消息传递的通讯模型的。它的假设前提是，在分布式系统中进程之间的通信会出现丢失、延迟、重复等现象，但不会出现传错的现象。Paxos算法就是为了保证在这样的系统中进程间基于消息传递就某个值达成一致。

## 节点角色

### Proposer:提案者

Proposer 可以有多个，Proposer 提出议案(value)。所谓 value，在工程中可以是任何操作，例如“修改某个变量的值为某个值”、“设置当前 primary 为某个节点”等等。Paxos 协议中统一将这些操作抽象为 value。

不同的Proposer 可以提出不同的甚至矛盾的 value，例如某个 Proposer 提议“将变量 X 设置为 1”，另一个 Proposer 提议“将变量 X 设置为 2”，但对同一轮 Paxos 过程，最多只有一个 value 被批准。

### Acceptor:批准者

Acceptor 有 N 个，Proposer 提出的 value 必须获得超过半数(N/2+1)的，Acceptor 批准后才能通过。Acceptor 之间完全对等独立。

### Learner:学习者

Learner 学习被批准的 value。所谓学习就是通过读取各个 Proposer 对 value 的选择结果，如果某个 value 被超过半数 Proposer 通过，则 Learner 学习到了这个 value。这里类似 Quorum 议会机制，某个 value 需要获得 W=N/2 + 1 的 Acceptor 批准，Learner 需要至少读取 N/2+1 个 Accpetor，至多读取 N 个 Acceptor 的结果后，能学习到一个通过的 value。

## 约束条件

P1：Acceptor必须接受他接收到的第一个提案，

注意P1是不完备的。如果恰好一半Acceptor接受的提案具有value A，另一半接受的提案具有value B，那么就无法形成多数派，无法批准任何一个value。

P2：当且仅当Acceptor没有回应过编号大于n的prepare请求时，Acceptor接受（accept）编号为n的提案。

如果一个没有chosen过任何proposer提案的Acceptor在prepare过程中回答了一个proposer针对提案n的问题，但是在开始对n进行投票前，又接受（accept）了编号小于n的另一个提案（例如n-1），如果n-1和n具有不同的value，这个投票就会违背P2c。因此在prepare过程中，Acceptor进行的回答同时也应包含承诺：不会再接受（accept）编号小于n的提案。

P3：只有Acceptor没有接受过提案Proposer才能采用自己的Value，否者Proposer的Value提案为Acceptor中编号最大的Proposer Value；

P4:一个提案被选中需要过半数的Acceptor接受。

假设A为整个Acceptor集合，B为一个超过A一半的Acceptor集合，B为A的子集，C也是一个超过A一半的Acceptor集合，C也是A的子集，有此可知任意两个过半集合中必定有一个共同的成员Acceptor；此说明了一个Acceptor可以接受不止一个提案，此时需要一个编号来标识每一个提案，提案的格式为：[编号，Value]，编号为不可重复全序的，因为存在着一个一个Paxos过程只能批准一个value这时又推出了一个约束P3；

P5：当编号K0、Value为V0的提案(即[K0,V0])被过半的Acceptor接受后，今后（同一个Paxos或称一个Round中）所有比K0更高编号且被Acceptor接受的提案，其Value值也必须为V0。

**该约束还可以表述为**：

一旦一个具有value v的提案被批准（chosen），那么之后任何Acceptor再次接受（accept）的提案必须具有value v。

一旦一个具有value v的提案被批准（chosen），那么以后任何proposer提出的提案必须具有value v。

如果一个编号为n的提案具有value v，那么存在一个多数派，要么他们中所有人都没有接受（accept）编号小于n的任何提案，要么他们已经接受（accept）的所有编号小于n的提案中编号最大的那个提案具有value v。

因为每个Proposer都可提出多个议案，每个议案最初都有一个不同的Value所以要满足P3就又要推出一个新的约束P4；

## 选举过程

#### Phase 1 准备阶段

Proposer 生成全局唯一且递增的ProposalID，向 Paxos 集群的所有机器发送 Prepare请求，这里不携带value，只携带N即ProposalID 。

Acceptor 收到 Prepare请求 后，判断：收到的ProposalID 是否比之前已响应的所有提案的N大：

如果是，则：

(1)在本地持久化 N，可记为Max_N。

(2)回复请求，并带上已Accept的提案中N最大的value（若此时还没有已Accept的提案，则返回value为空）。

(3)做出承诺：不会Accept任何小于Max_N的提案。

如果否：不回复或者回复Error。

#### Phase 2 选举阶段

P2a：Proposer 发送 Accept

经过一段时间后，Proposer 收集到一些 Prepare 回复，有下列几种情况：

(1)回复数量 > 一半的Acceptor数量，且所有的回复的value都为空，则Porposer发出accept请求，并带上自己指定的value。

(2)回复数量 > 一半的Acceptor数量，且有的回复value不为空，则Porposer发出accept请求，并带上回复中ProposalID最大的value(作为自己的提案内容)。

(3)回复数量 = Max_N (一般情况下是 等于)，则回复提交成功，并持久化N和value。

(2)收到的N  一半的Acceptor数量，则表示提交value成功。此时，可以发一个广播给所有Proposer、Learner，通知它们已commit的value。

(2)回复数量 <= 一半的Acceptor数量，则 尝试 更新生成更大的 ProposalID，再转P1a执行。

(3)收到一条提交失败的回复，则尝试更新生成更大的 ProposalID，再转P1a执行。

## 选举例子

这里具体例子来说明Paxos的整个具体流程： 假如有Server1、Server2、Server3这样三台服务器，我们要从中选出leader，这时候Paxos派上用场了。整个选举的结构图如下：

#### Phase1（准备阶段）

每个Server都向Proposer发消息称自己要成为leader，Server1往Proposer1发、Server2往Proposer2发、Server3往Proposer3发；

现在每个Proposer都接收到了Server1发来的消息但时间不一样，Proposer2先接收到了，然后是Proposer1，接着才是Proposer3；

Proposer2首先接收到消息所以他从系统中取得一个编号1，Proposer2向Acceptor2和Acceptor3发送一条，编号为1的消息；接着Proposer1也接收到了Server1发来的消息，取得一个编号2，Proposer1向Acceptor1和Acceptor2发送一条，编号为2的消息； 最后Proposer3也接收到了Server3发来的消息，取得一个编号3，Proposer3向Acceptor2和Acceptor3发送一条，编号为3的消息；

这时Proposer1发送的消息先到达Acceptor1和Acceptor2，这两个都没有接收过请求所以接受了请求返回[2,null]给Proposer1，并承诺不接受编号小于2的请求；

此时Proposer2发送的消息到达Acceptor2和Acceptor3，Acceprot3没有接收过请求返回[1,null]给Proposer2，并承诺不接受编号小于1的请求，但这时Acceptor2已经接受过Proposer1的请求并承诺不接受编号小于的2的请求了，所以Acceptor2拒绝Proposer2的请求；

最后Proposer3发送的消息到达Acceptor2和Acceptor3，Acceptor2接受过提议，但此时编号为3大于Acceptor2的承诺2与Accetpor3的承诺1，所以接受提议返回[3,null];

Proposer2没收到过半的回复所以重新取得编号4，并发送给Acceptor2和Acceptor3，然后Acceptor2和Acceptor3

#### Phase2（决议阶段）

Proposer3收到过半（三个Server中两个）的返回，并且返回的Value为null，所以Proposer3提交了[3,server3]的议案；

Proposer1收到过半返回，返回的Value为null，所以Proposer1提交了[2,server1]的议案；

Proposer2收到过半返回，返回的Value为null，所以Proposer2提交了[4,server2]的议案；

Acceptor1、Acceptor2接收到Proposer1的提案[2,server1]请求，Acceptor2承诺编号大于4所以拒绝了通过，Acceptor1通过了请求；

Proposer2的提案[4,server2]发送到了Acceptor2、Acceptor3，提案编号为4所以Acceptor2、Acceptor3都通过了提案请求；

Acceptor2、Acceptor3接收到Proposer3的提案[3,server3]请求，Acceptor2、Acceptor3承诺编号大于4所以拒绝了提案；

此时过半的Acceptor都接受了Proposer2的提案[4,server2],Larner感知到了提案的通过，Larner学习提案，server2成为Leader；

一个Paxos过程只会产生一个议案所以至此这个流程结束，选举结果server2为Leader。

## 其他讨论

Paxos算法的核心思想：

（1）引入了多个Acceptor，单个Acceptor就类似2PC中协调者的单点问题，避免故障

（2）Proposer用更大ProposalID来抢占临时的访问权，可以对比2PC协议，防止其中一个Proposer崩溃宕机产生阻塞问题

（3）保证一个N值，只有一个Proposer能进行到第二阶段运行，Proposer按照ProposalID递增的顺序依次运行

（4）新ProposalID的proposer比如认同前面提交的Value值，递增的ProposalID的Value是一个继承关系

为什么在Paxos运行过程中，半数以内的Acceptor失效都能运行？

(1)如果半数以内的Acceptor失效时 还没确定最终的value，此时，所有Proposer会竞争 提案的权限，最终会有一个提案会 成功提交。之后，会有半过数的Acceptor以这个value提交成功。

(2)如果半数以内的Acceptor失效时 已确定最终的value，此时，所有Proposer提交前 必须以 最终的value 提交，此值也可以被获取，并不再修改。

### 如何产生唯一的编号呢？

在《Paxos made simple》中提到的是让所有的Proposer都从不相交的数据集合中进行选择，例如系统有5个Proposer，则可为每一个Proposer分配一个标识j(0~4)，则每一个proposer每次提出决议的编号可以为5*i + j(i可以用来表示提出议案的次数)。
