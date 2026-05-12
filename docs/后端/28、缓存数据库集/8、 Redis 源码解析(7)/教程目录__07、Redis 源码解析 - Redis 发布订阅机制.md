# 07、Redis 源码解析 - Redis 发布订阅机制
- 来源：https://ddkk.com/zhuanlan/db/redis/7/7.html
- 分类：缓存数据库
- 分组：教程目录
**redis在2.8版本以后实现了一个发布订阅机制,这使得redis在我们需要一个基本的发布订阅功能的时候可以充当一个消息队列.Redis一共为我们提供了六个命令,两种匹配方法来实现发布订阅**

**1、** 客户端可以一次性订阅一个或者多个channel,`SUBSCRIBE`channel1channel2channel3；

**2、**`PUBSUB`返回当前publish/subscribe系统的内部命令的活动状态,包含三个内部命令,分别为:`channels`(列出当前活跃的channel),`NUMSUB`(返回指定channel的订阅数目),`NUMPAT`(返回订阅pattern的订阅数,不需要参数)；

**3、** 订阅多个channel,也就是我们所说的模式匹配,我们可以使用正则表达式来充当模式串PSUBSCRIBEchan*；

**4、** 消息发布,`PUBLISH`channel2hello；

**5、** 取消某一个channel消息订阅,`UNSUBSCRIBE`channel1；

**6、** 取消某个pattern的消息订阅,`PUNSUBSCRIBE`chan*；

**两种匹配方法其实上面已经提到了,就是精确的频道匹配与使用正则表达式的模式匹配,它们的实现并不相同,频道匹配使用字典作为数据结构,其中的节点key为频道,value为用户链表.而模式匹配中则使用链表来作为底层的数据结构,节点结构为pubsubPattern{模式串,用户信息},这也使得使用模式匹配是搜索的复杂度为O(N).至于模式匹配不使用字典的原因应该是模式串重复的远远小于频道的重复吧,毕竟模式匹配是支持正则表达式的.**

其实下面要说的pubsubPublishMessage函数也是PUBLISH的内部实现,关于Redis的发布订阅模式,[请点击这里](https://blog.csdn.net/baijiwei/article/details/79508389?depth_1-utm_source=distribute.pc_relevant.none-task&utm_source=distribute.pc_relevant.none-task)

### 解析部分

notifyKeyspaceEvent是消息通知的实现函数,也就是当有消息到来时,可以是一条对键的命令,也可以是PUBLISH,如果是对键的消息,就会去构造一个字符串,因为这个过程,当我们监视某个关联键的频道时我们需要遵循redis的协议构造一个频道名,协议如下

```java
 命令      __keyspace@仓库序号__:要监控的命令名
SUBSCRIBE __keyspace@0__:key
 命令      __keyevent@仓库序号__:要监控的命令名
SUBSCRIBE __keyevent@0__:del
```

```java
void notifyKeyspaceEvent(int type, char *event, robj *key, int dbid) {
    sds chan;
    robj *chanobj, *eventobj;
    int len = -1;
    char buf[24];
    /* If notifications for this class of events are off, return ASAP. */
    // 如果服务器配置为不发送 type 类型的通知，那么直接返回 就是配置文件中notify-keyspace-events的值
    if (!(server.notify_keyspace_events & type)) return;
    // 事件的名字
    eventobj = createStringObject(event,strlen(event)); //根据事件名称创建一个robj对象
    /* __keyspace@<db>__:<key> <event> notifications. */
    // 发送键空间通知 
    if (server.notify_keyspace_events & REDIS_NOTIFY_KEYSPACE) {
        // 构建频道对象
        chan = sdsnewlen("__keyspace@",11);
        len = ll2string(buf,sizeof(buf),dbid); //把数据库的号码转换成字符串
        chan = sdscatlen(chan, buf, len);
        chan = sdscatlen(chan, "__:", 3);
        chan = sdscatsds(chan, key->ptr); //已执行的命令名称
        chanobj = createObject(REDIS_STRING, chan); //构建一个key对象
        // 通过 publish 命令发送通知
        pubsubPublishMessage(chanobj, eventobj);
        // 释放频道对象
        decrRefCount(chanobj);
    }
    /* __keyevente@<db>__:<event> <key> notifications. */
    // 发送键事件通知
    if (server.notify_keyspace_events & REDIS_NOTIFY_KEYEVENT) {
        // 构建频道对象
        chan = sdsnewlen("__keyevent@",11);
        // 如果在前面发送键空间通知的时候计算了 len ，那么它就不会是 -1
        // 这可以避免计算两次 buf 的长度
        if (len == -1) len = ll2string(buf,sizeof(buf),dbid);
        chan = sdscatlen(chan, buf, len);
        chan = sdscatlen(chan, "__:", 3);
        chan = sdscatsds(chan, eventobj->ptr);
        chanobj = createObject(REDIS_STRING, chan);
        // 通过 publish 命令发送通知
        pubsubPublishMessage(chanobj, key);
        // 释放频道对象
        decrRefCount(chanobj);
    }
    // 释放事件对象
    decrRefCount(eventobj);
}
```

这里面我们可以看到真正的执行发送消息的函数是pubsubPublishMessage,也就是PUBLISH的内部实现.

首先会在模式匹配的字典中寻找匹配项,然后去模式匹配的链表中寻找匹配

```java
int pubsubPublishMessage(robj *channel, robj *message) {
    int receivers = 0;
    dictEntry *de;
    listNode *ln;
    listIter li;
    /* Send to clients listening for that channel */
    // 取出包含所有订阅频道 channel 的客户端的链表
    // 并将消息发送给它们
    // 这里从字典中取成员也意味着事件通知的注册其实就是利用服务端输入的命令构建一个key
    // 如
    de = dictFind(server.pubsub_channels,channel);
    if (de) {
        list *list = dictGetVal(de); //值为一个链表 其中记录着客户信息 结构为redisClient
        listNode *ln;  
        listIter li;
        // 遍历客户端链表，将 message 发送给它们
        listRewind(list,&li); //设置迭代器,开始遍历
        while ((ln = listNext(&li)) != NULL) {
            redisClient *c = ln->value;
            // 回复客户端。
            // 示例：
            // 1) "message"
            // 2) "xxx"
            // 3) "hello"
            addReply(c,shared.mbulkhdr[3]); 
            // "message" 字符串
            addReply(c,shared.messagebulk); //前两个都一样
            // 消息的来源频道
            addReplyBulk(c,channel); //就是我们前面构造的字符串
            // 消息内容
            addReplyBulk(c,message);
            // 接收客户端计数
            receivers++;
        }
    }
    /* Send to clients listening to matching channels */
    // 将消息也发送给那些和频道匹配的模式
    if (listLength(server.pubsub_patterns)) {
        // 遍历模式链表
        listRewind(server.pubsub_patterns,&li); //设置迭代器
        channel = getDecodedObject(channel);
        while ((ln = listNext(&li)) != NULL) {
            // 取出 pubsubPattern 存储的结构是客户端信息和模式串本身
            pubsubPattern *pat = ln->value;
            // 如果 channel 和 pattern 匹配 模式串为正则表达式
            // 就给所有订阅该 pattern 的客户端发送消息
            // 这个下面有一个样例来解释
            if (stringmatchlen((char*)pat->pattern->ptr, //模式串
                                sdslen(pat->pattern->ptr),
                                (char*)channel->ptr, //从到来的消息中取出要匹配的串
                                sdslen(channel->ptr),0)) {
                addReply(pat->client,shared.mbulkhdr[4]);
                addReply(pat->client,shared.pmessagebulk); //模式串,也就是我们注册时带*的那个
                addReplyBulk(pat->client,pat->pattern); 
                addReplyBulk(pat->client,channel); //匹配的串 
                addReplyBulk(pat->client,message); //这也就是我们要发送的消息了
                // 对接收消息的客户端进行计数
                receivers++;
            }
        }
        decrRefCount(channel);
    }
    // 返回计数
    return receivers;
}
```

其中有一个匹配的函数stringmatchlen,我们来写个简单的小demo测试一个这个函数

```java
int main(){
    string partern="*t[ea]st.*";
    string one="sdatest.asdasd";
    string two="tast.asd.";
    cout << stringmatchlen(partern.c_str(), partern.size(), one.c_str(), one.size(),0) << endl;
    cout << stringmatchlen(partern.c_str(), partern.size(), two.c_str(), two.size(),0) << endl;
    return 0;
}
```

输出为:

```java
1
1
```

stringmatchlen所做的事情其实就是去匹配正则表达式,所以模式串中其实我们是可以去写一个正则表达式的.
