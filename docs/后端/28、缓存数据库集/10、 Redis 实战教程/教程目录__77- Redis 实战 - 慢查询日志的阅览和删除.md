# 77- Redis 实战 - 慢查询日志的阅览和删除
- 来源：https://ddkk.com/zhuanlan/db/redis-action/77.html
- 分类：缓存数据库
- 分组：教程目录
## 慢查询日志的阅览和删除

弄清楚了服务器状态的 slowlog 链表的作用之后， 我们可以用以下伪代码来定义查看日志的 SLOWLOG GET 命令：

```sh
def SLOWLOG_GET(number=None):
    # 用户没有给定 number 参数
    # 那么打印服务器包含的全部慢查询日志
    if number is None:
        number = SLOWLOG_LEN()
    # 遍历服务器中的慢查询日志
    for log in redisServer.slowlog:
        if number <= 0:
            # 打印的日志数量已经足够，跳出循环
            break
        else:
            # 继续打印，将计数器的值减一
            number -= 1
        # 打印日志
        printLog(log)
```

查看日志数量的 SLOWLOG LEN 命令可以用以下伪代码来定义：

```sh
def SLOWLOG_LEN():
    # slowlog 链表的长度就是慢查询日志的条目数量
    return len(redisServer.slowlog)
```

另外，用于清除所有慢查询日志的 SLOWLOG RESET 命令可以用以下伪代码来定义：

```sh
def SLOWLOG_RESET():
    # 遍历服务器中的所有慢查询日志
    for log in redisServer.slowlog:
        # 删除日志
        deleteLog(log)
```
