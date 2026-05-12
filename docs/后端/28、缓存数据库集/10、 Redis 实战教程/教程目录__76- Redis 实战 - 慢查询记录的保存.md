# 76- Redis 实战 - 慢查询记录的保存
- 来源：https://ddkk.com/zhuanlan/db/redis-action/76.html
- 分类：缓存数据库
- 分组：教程目录
## 慢查询记录的保存

服务器状态中包含了几个和慢查询日志功能有关的属性：

```sh
struct redisServer {
    // ...
    // 下一条慢查询日志的 ID
    long long slowlog_entry_id;
    // 保存了所有慢查询日志的链表
    list *slowlog;
    // 服务器配置 slowlog-log-slower-than 选项的值
    long long slowlog_log_slower_than;
    // 服务器配置 slowlog-max-len 选项的值
    unsigned long slowlog_max_len;
    // ...
};
```

slowlog_entry_id 属性的初始值为 0 ， 每当创建一条新的慢查询日志时， 这个属性的值就会用作新日志的 id 值， 之后程序会对这个属性的值增一。

比如说， 在创建第一条慢查询日志时， slowlog_entry_id 的值 0 会成为第一条慢查询日志的 ID ， 而之后服务器会对这个属性的值增一； 当服务器再创建新的慢查询日志的时候， slowlog_entry_id 的值 1 就会成为第二条慢查询日志的 ID ， 然后服务器再次对这个属性的值增一， 以此类推。

slowlog 链表保存了服务器中的所有慢查询日志， 链表中的每个节点都保存了一个 slowlogEntry 结构， 每个 slowlogEntry 结构代表一条慢查询日志：

```sh
typedef struct slowlogEntry {
    // 唯一标识符
    long long id;
    // 命令执行时的时间，格式为 UNIX 时间戳
    time_t time;
    // 执行命令消耗的时间，以微秒为单位
    long long duration;
    // 命令与命令参数
    robj **argv;
    // 命令与命令参数的数量
    int argc;
} slowlogEntry;
```

举个例子， 对于以下慢查询日志来说：

```sh
1) (integer) 3
2) (integer) 1378781439
3) (integer) 10
4) 1) "SET"
   2) "number"
   3) "10086"
```

图23-1 展示的就是该日志所对应的 slowlogEntry 结构。

图23-2 展示了服务器状态中， 和慢查询功能有关的属性：

- slowlog_entry_id 的值为 6 ， 表示服务器下条慢查询日志的 id 值将为 6 。
- slowlog 链表包含了 id 为 5 至 1 的慢查询日志， 最新的 5 号日志排在链表的表头， 而最旧的 1 号日志排在链表的表尾， 这表明slowlog 链表是使用插入到表头的方式来添加新日志的。
- slowlog_log_slower_than 记录了服务器配置 slowlog-log-slower-than 选项的值 0 ， 表示任何执行时间超过 0 微秒的命令都会被慢查询日志记录。
- slowlog-max-len 属性记录了服务器配置 slowlog-max-len 选项的值 5 ， 表示服务器最多储存五条慢查询日志。

> 注意
>
> 因为版面空间不足的缘故， 所以图 23-2 展示的各个 slowlogEntry 结构都省略了 argv 数组。
