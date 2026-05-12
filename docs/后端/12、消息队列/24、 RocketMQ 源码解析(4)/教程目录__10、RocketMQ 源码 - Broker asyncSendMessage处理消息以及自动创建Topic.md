# 10、RocketMQ 源码 - Broker asyncSendMessage处理消息以及自动创建Topic
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/4/10.html
- 分类：消息队列
- 分组：教程目录
asyncSendMessage方法用来处理来自producer发送的消息。

### 1.asyncSendMessage异步处理单条消息

**1、** 调用preSend方法创建响应的命令对象,包括自动创建topic的逻辑,随后创建响应头对象；

**2、** 随后创建MessageExtBrokerInner对象,从请求中获取消息的属性并设置到对象属性中,消息体,topic；

**3、** 判断如果是重试或者死信消息,调用handleRetryAndDLQ方法处理重试和死信队列消息,如果已重试次数大于最大重试次数,那么替换topic为死信队列topic,消息会被发送至死信队列；

**4、** 判断如果是事务准备消息,并且不会拒绝处理事务消息,调用asyncPrepareMessage方法以异步的方式处理存储事务准备消息；

**5、** 如果是普通消息,调用asyncPutMessage方法处理,存储普通消息asyncPutMessage以异步方式将消息存储到存储器中,处理器可以处理下一个请求而不是等待结,当结果完成时,以异步方式通知客户端；

**6、** 调用handlePutMessageResultFuture方法处理消息存储的处理结果；

```java
/**
 * SendMessageProcessor的方法
 * <p>
 * 处理单条消息
 */
private CompletableFuture<RemotingCommand> asyncSendMessage(ChannelHandlerContext ctx, RemotingCommand request,
                                                            SendMessageContext mqtraceContext,
                                                            SendMessageRequestHeader requestHeader) {
    /*
     * 1 创建响应的命令对象，包括自动创建topic的逻辑
     */
    final RemotingCommand response = preSend(ctx, request, requestHeader);
    //获取响应头
    final SendMessageResponseHeader responseHeader = (SendMessageResponseHeader) response.readCustomHeader();
    if (response.getCode() != -1) {
        return CompletableFuture.completedFuture(response);
    }
    //获取消息体
    final byte[] body = request.getBody();
    //获取队列id
    int queueIdInt = requestHeader.getQueueId();
    //从broker的topicConfigTable缓存中根据topicName获取TopicConfig
    TopicConfig topicConfig = this.brokerController.getTopicConfigManager().selectTopicConfig(requestHeader.getTopic());
    //如果队列id小于0，则随机选择一个写队列索引作为id
    if (queueIdInt < 0) {
        queueIdInt = randomQueueId(topicConfig.getWriteQueueNums());
    }
    //构建消息对象，保存着要存入commitLog的数据
    MessageExtBrokerInner msgInner = new MessageExtBrokerInner();
    //设置topic
    msgInner.setTopic(requestHeader.getTopic());
    //设置队列id
    msgInner.setQueueId(queueIdInt);
    /*
     * 2 处理重试和死信队列消息，将会对死信消息替换为死信topic
     */
    if (!handleRetryAndDLQ(requestHeader, response, request, msgInner, topicConfig)) {
        return CompletableFuture.completedFuture(response);
    }
    /*
     * 设置一系列属性
     */
    msgInner.setBody(body);
    msgInner.setFlag(requestHeader.getFlag());
    Map<String, String> origProps = MessageDecoder.string2messageProperties(requestHeader.getProperties());
    //设置到properties属性中
    MessageAccessor.setProperties(msgInner, origProps);
    msgInner.setBornTimestamp(requestHeader.getBornTimestamp());
    msgInner.setBornHost(ctx.channel().remoteAddress());
    msgInner.setStoreHost(this.getStoreHost());
    msgInner.setReconsumeTimes(requestHeader.getReconsumeTimes() == null ? 0 : requestHeader.getReconsumeTimes());
    String clusterName = this.brokerController.getBrokerConfig().getBrokerClusterName();
    MessageAccessor.putProperty(msgInner, MessageConst.PROPERTY_CLUSTER, clusterName);
    //WAIT属性表示 消息发送时是否等消息存储完成后再返回
    if (origProps.containsKey(MessageConst.PROPERTY_WAIT_STORE_MSG_OK)) {
        // There is no need to store "WAIT=true", remove it from propertiesString to save 9 bytes for each message.
        // It works for most case. In some cases msgInner.setPropertiesString invoked later and replace it.
        //不需要存储"WAIT=true"属性，从propertiesString中移除它，为每个消息节省9个字节。
        String waitStoreMsgOKValue = origProps.remove(MessageConst.PROPERTY_WAIT_STORE_MSG_OK);
        //将没有WAIT属性的origProps存入msgInner的propertiesString属性
        msgInner.setPropertiesString(MessageDecoder.messageProperties2String(msgInner.getProperties()));
        // Reput to properties, since msgInner.isWaitStoreMsgOK() will be invoked later
        //将WAIT属性重新存入origProps集合中，因为msgInner.isWaitStoreMsgOK()稍后将被调用
        origProps.put(MessageConst.PROPERTY_WAIT_STORE_MSG_OK, waitStoreMsgOKValue);
    } else {
        //将没有WAIT属性的origProps存入msgInner的propertiesString属性
        msgInner.setPropertiesString(MessageDecoder.messageProperties2String(msgInner.getProperties()));
    }
    CompletableFuture<PutMessageResult> putMessageResult = null;
    /*
     * 处理事务消息逻辑
     */
    //TRAN_MSG属性值为true，表示为事务消息
    String transFlag = origProps.get(MessageConst.PROPERTY_TRANSACTION_PREPARED);
    //处理事务消息
    if (transFlag != null && Boolean.parseBoolean(transFlag)) {
        //判断是否需要拒绝事务消息，如果需要拒绝，则返回NO_PERMISSION异常
        if (this.brokerController.getBrokerConfig().isRejectTransactionMessage()) {
            response.setCode(ResponseCode.NO_PERMISSION);
            response.setRemark(
                    "the broker[" + this.brokerController.getBrokerConfig().getBrokerIP1()
                            + "] sending transaction message is forbidden");
            return CompletableFuture.completedFuture(response);
        }
        //调用asyncPrepareMessage方法以异步的方式处理、存储事务准备消息，底层仍是asyncPutMessage方法
        putMessageResult = this.brokerController.getTransactionalMessageService().asyncPrepareMessage(msgInner);
    } else {
        //不是事务消息，那么调用asyncPutMessage方法处理，存储消息
        //以异步方式将消息存储到存储器中，处理器可以处理下一个请求而不是等待结果，当结果完成时，以异步方式通知客户端
        putMessageResult = this.brokerController.getMessageStore().asyncPutMessage(msgInner);
    }
    //处理消息存放的结果
    return handlePutMessageResultFuture(putMessageResult, response, request, msgInner, responseHeader, mqtraceContext, ctx, queueIdInt);
}
```

### 2.preSend准备响应命令对象

- 创建响应的命令对象, 包括topic的校验和自动创建topic的逻辑。

**1、** 创建RemotingCommand对象,设置唯一请求id；

**2、** 校验当前时间是否小于broker的起始服务时间,如果小于,返回SYSTEM_ERROR,表示不可用提供服务；

**3、** msgCheck方法进行一系列的校验,包括topic的自动创建逻辑；

```java
/**
 * SendMessageProcessor的方法
 * <p>
 * 准备响应数据
 */
private RemotingCommand preSend(ChannelHandlerContext ctx, RemotingCommand request,
                                SendMessageRequestHeader requestHeader) {
    //创建响应命令对象
    final RemotingCommand response = RemotingCommand.createResponseCommand(SendMessageResponseHeader.class);
    //设置唯一id为请求id
    response.setOpaque(request.getOpaque());
    //添加扩展字段属性"MSG_REGION"、"TRACE_ON"
    response.addExtField(MessageConst.PROPERTY_MSG_REGION, this.brokerController.getBrokerConfig().getRegionId());
    response.addExtField(MessageConst.PROPERTY_TRACE_SWITCH, String.valueOf(this.brokerController.getBrokerConfig().isTraceOn()));
    log.debug("Receive SendMessage request command {}", request);
    //获取配置的broker的处理请求的起始服务时间，默认为0
    final long startTimestamp = this.brokerController.getBrokerConfig().getStartAcceptSendRequestTimeStamp();
    //如果当前时间小于起始时间，那么broker会返回一个SYSTEM_ERROR，表示现在broker还不能提供服务
    if (this.brokerController.getMessageStore().now() < startTimestamp) {
        response.setCode(ResponseCode.SYSTEM_ERROR);
        response.setRemark(String.format("broker unable to service, until %s", UtilAll.timeMillisToHumanString2(startTimestamp)));
        return response;
    }
    //设置code为-1
    response.setCode(-1);
    /*
     * 消息校验，包括自动创建topic的逻辑
     */
    super.msgCheck(ctx, requestHeader, response);
    if (response.getCode() != -1) {
        return response;
    }
    return response;
}
```

#### 2.1 msgCheck检查并自动创建topic

**1、** 校验如果当前broker有没有写的权限,如果没有,则broker会返回一个NO_PERMISSION异常；

**2、** 校验topic不能为空,必须属于合法字符,且长度不超过127字符；

**3、** 校验如果当前topic是不为允许使用的系统topic,抛出异常；

**4、** 从broker的topicConfigTable缓存中根据topicName获取TopicConfig；

**1、** 如果不存在该topic信息,调用createTopicInSendMessageMethod创建topic,失败了,判断是否重试,如果是重试创建topic,如果创建还是失败的话,返回TOPIC_NOT_EXIST异常信息；

**5、** 如果找到或者创建了topic,校验queutId不能大于等于该broker的读或写的最大queueId；

```java
/**
 * AbstractSendMessageProcessor的方法
 * <p>
 * 消息校验，包括自动创建topic的逻辑
 */
protected RemotingCommand msgCheck(final ChannelHandlerContext ctx,
                                   final SendMessageRequestHeader requestHeader, final RemotingCommand response) {
    //如果当前broker没有写的权限，那么broker会返回一个NO_PERMISSION异常，sending message is forbidden，禁止向该broker发送消息
    if (!PermName.isWriteable(this.brokerController.getBrokerConfig().getBrokerPermission())
            && this.brokerController.getTopicConfigManager().isOrderTopic(requestHeader.getTopic())) {
        response.setCode(ResponseCode.NO_PERMISSION);
        response.setRemark("the broker[" + this.brokerController.getBrokerConfig().getBrokerIP1()
                + "] sending message is forbidden");
        return response;
    }
    //校验topic不能为空，必须属于合法字符regex: ^[%|a-zA-Z0-9_-]+$，且长度不超过127个字符
    if (!TopicValidator.validateTopic(requestHeader.getTopic(), response)) {
        return response;
    }
    //校验如果当前topic是不为允许使用的系统topic，那么抛出异常，默认不能为SCHEDULE_TOPIC_XXXX
    if (TopicValidator.isNotAllowedSendTopic(requestHeader.getTopic(), response)) {
        return response;
    }
    //从broker的topicConfigTable缓存中根据topicName获取TopicConfig
    TopicConfig topicConfig =
            this.brokerController.getTopicConfigManager().selectTopicConfig(requestHeader.getTopic());
    //如果不存在该topic信息
    if (null == topicConfig) {
        int topicSysFlag = 0;
        if (requestHeader.isUnitMode()) {
            if (requestHeader.getTopic().startsWith(MixAll.RETRY_GROUP_TOPIC_PREFIX)) {
                topicSysFlag = TopicSysFlag.buildSysFlag(false, true);
            } else {
                topicSysFlag = TopicSysFlag.buildSysFlag(true, false);
            }
        }
        log.warn("the topic {} not exist, producer: {}", requestHeader.getTopic(), ctx.channel().remoteAddress());
        /*
         * 尝试创建普通topic
         */
        topicConfig = this.brokerController.getTopicConfigManager().createTopicInSendMessageMethod(
                requestHeader.getTopic(),
                requestHeader.getDefaultTopic(),
                RemotingHelper.parseChannelRemoteAddr(ctx.channel()),
                requestHeader.getDefaultTopicQueueNums(), topicSysFlag);
        /*
         * 尝试创建重试topic
         */
        if (null == topicConfig) {
            if (requestHeader.getTopic().startsWith(MixAll.RETRY_GROUP_TOPIC_PREFIX)) {
                topicConfig =
                        this.brokerController.getTopicConfigManager().createTopicInSendMessageBackMethod(
                                requestHeader.getTopic(), 1, PermName.PERM_WRITE | PermName.PERM_READ,
                                topicSysFlag);
            }
        }
        if (null == topicConfig) {
            response.setCode(ResponseCode.TOPIC_NOT_EXIST);
            response.setRemark("topic[" + requestHeader.getTopic() + "] not exist, apply first please!"
                    + FAQUrl.suggestTodo(FAQUrl.APPLY_TOPIC_URL));
            return response;
        }
    }
    //校验queutId 不能大于等于该broker的读或写的最大数量
    int queueIdInt = requestHeader.getQueueId();
    int idValid = Math.max(topicConfig.getWriteQueueNums(), topicConfig.getReadQueueNums());
    if (queueIdInt >= idValid) {
        String errorInfo = String.format("request queueId[%d] is illegal, %s Producer: %s",
                queueIdInt,
                topicConfig.toString(),
                RemotingHelper.parseChannelRemoteAddr(ctx.channel()));
        log.warn(errorInfo);
        response.setCode(ResponseCode.SYSTEM_ERROR);
        response.setRemark(errorInfo);
        return response;
    }
    return response;
}
```

##### 2.1.1 createTopicInSendMessageMethod创建普通topic#

- 创建一个新的topic

**1、** 获取锁防止并发创建相同的topic,获取锁之后,再次尝试从topicConfigTable获取topic信息,如果获取到了,直接返回,如果没有,创建topic；

**2、** 获取默认topic的信息,作为创建新topic的模板,默认topic实际上就是TBW102,其有8个读写队列,权限为读写并且可继承，即7；

**3、** 如果默认topic就是TBW102,并且如果broker配置不支持自动创建topic,即autoCreateTopicEnable为false,设置权限为可读写,不可继承；

**4、** 如果默认topic配置的权限包括可继承,从默认topic继承属性创建新topic创建一个TopicConfig,选择默认队列数量与默认topic写队列中数量小的值作为新topic的读写队列数量,默认为4,设置权限,去除可继承权限；

**5、** 如果topic不是null,则表示创建了topic,将新的topic信息存入topicConfigTable缓存中,生成下一个数据版本标识位置为true,调用persist方法将topic配置持久化到配置文件{user.home}/store/config/topics.json中；

**6、** 解锁,判断如果创建了新topic,调用registerBrokerAll方法向nameServer注册当前broker的新配置路由信息；

```java
  /**
   * TopicConfigManager的方法
   * <p>
   * 创建普通topic，并持久化至配置文件 {user.home}/store/config/topics.json中
   *
   * @param topic                       待创建topic
   * @param defaultTopic                默认topic，用于作为模板创建新topic
   * @param remoteAddress               远程地址
   * @param clientDefaultTopicQueueNums 自动创建服务器不存在的topic时，默认创建的队列数，默认为4
*                                    可通过生产者DefaultMQProducer的defaultTopicQueueNums属性进行配置
   * @param topicSysFlag                topic标识
   * @return topic配置
   */
  public TopicConfig createTopicInSendMessageMethod(final String topic, final String defaultTopic,
                                                    final String remoteAddress, final int clientDefaultTopicQueueNums, final int topicSysFlag) {
      TopicConfig topicConfig = null;
      boolean createNew = false;
      try {
          //需要加锁防止并发创建相同的topic
          if (this.topicConfigTableLock.tryLock(LOCK_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS)) {
              try {
                  //再次尝试从topicConfigTable获取topic信息，如果获取到了，那么直接返回
                  topicConfig = this.topicConfigTable.get(topic);
                  if (topicConfig != null)
                      return topicConfig;
                  //获取默认topic的信息，用于作为模板创建新topic，默认的默认topic实际上就是TBW102，其有8个读写队列，权限为读写并且可继承，即7
                  TopicConfig defaultTopicConfig = this.topicConfigTable.get(defaultTopic);
                  if (defaultTopicConfig != null) {
                   //如果默认topic就是TBW102
                      if (defaultTopic.equals(TopicValidator.AUTO_CREATE_TOPIC_KEY_TOPIC)) {
                       //如果broker配置不支持自动创建topic，那么设置权限为可读写，不可继承，即6
                          if (!this.brokerController.getBrokerConfig().isAutoCreateTopicEnable()) {
                              defaultTopicConfig.setPerm(PermName.PERM_READ | PermName.PERM_WRITE);
                          }
                      }
                      //如果默认topic配置的权限包括可继承，那么从默认topic继承属性
                      if (PermName.isInherited(defaultTopicConfig.getPerm())) {
                       //创建topic配置
                          topicConfig = new TopicConfig(topic);
                          //选择默认队列数量与默认topic写队列数中最小的值作为新topic的读写队列数量，默认为4
                          int queueNums = Math.min(clientDefaultTopicQueueNums, defaultTopicConfig.getWriteQueueNums());
                          if (queueNums < 0) {
                              queueNums = 0;
                          }
                          topicConfig.setReadQueueNums(queueNums);
                          topicConfig.setWriteQueueNums(queueNums);
                          //权限
                          int perm = defaultTopicConfig.getPerm();
                          //去掉可继承权限
                          perm &= ~PermName.PERM_INHERIT;
                          topicConfig.setPerm(perm);
                          topicConfig.setTopicSysFlag(topicSysFlag);
                          topicConfig.setTopicFilterType(defaultTopicConfig.getTopicFilterType());
                      } else {
                          log.warn("Create new topic failed, because the default topic[{}] has no perm [{}] producer:[{}]",
                                  defaultTopic, defaultTopicConfig.getPerm(), remoteAddress);
                      }
                  } else {
                      log.warn("Create new topic failed, because the default topic[{}] not exist. producer:[{}]",
                              defaultTopic, remoteAddress);
                  }
                  //如果topic不为null，说明创建了新topic
                  if (topicConfig != null) {
                      log.info("Create new topic by default topic:[{}] config:[{}] producer:[{}]",
                              defaultTopic, topicConfig, remoteAddress);
                      //将新的topic信息存入topicConfigTable缓存中
                      this.topicConfigTable.put(topic, topicConfig);
                      //生成下一个数据版本
                      this.dataVersion.nextVersion();
                      //标识位置为true
                      createNew = true;
                      /*
                       * 将topic配置持久化到配置文件 {user.home}/store/config/topics.json中
                       */
                      this.persist();
                  }
              } finally {
               //解锁
                  this.topicConfigTableLock.unlock();
              }
          }
      } catch (InterruptedException e) {
          log.error("createTopicInSendMessageMethod exception", e);
      }
      //如果创建了新topic，那么马上向nameServer注册当前broker的新配置路由信息
      if (createNew) {
          this.brokerController.registerBrokerAll(false, true, true);
      }
      return topicConfig;
  }
```

##### 2.1.2 createTopicInSendMessageBackMethod创建重试topc#

- 自动创建重试topic, 源码和创建普通topic类似,. 不同的是重试topic不需要模板topic, 默认读写队列都是1, 权限为读写。

```java
/**
 * TopicConfigManager的方法
 * <p>
 * 创建重试topic，并持久化至配置文件 {user.home}/store/config/topics.json中
 *
 * @param topic                       待创建topic
 * @param perm                        权限
 * @param clientDefaultTopicQueueNums 自动创建服务器不存在的topic时，默认创建的队列数，默认为4
 *                                    可通过生产者DefaultMQProducer的defaultTopicQueueNums属性进行配置
 * @param topicSysFlag                topic标识
 * @return topic配置
 */
public TopicConfig createTopicInSendMessageBackMethod(
        final String topic,
        final int clientDefaultTopicQueueNums,
        final int perm,
        final int topicSysFlag) {
    //尝试获取topic
    TopicConfig topicConfig = this.topicConfigTable.get(topic);
    //如果存在则直接返回
    if (topicConfig != null)
        return topicConfig;
    boolean createNew = false;
    try {
        //需要加锁防止并发创建相同的topic
        if (this.topicConfigTableLock.tryLock(LOCK_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS)) {
            try {
                //再次尝试从topicConfigTable获取topic信息，如果获取到了，那么直接返回
                topicConfig = this.topicConfigTable.get(topic);
                if (topicConfig != null)
                    return topicConfig;
                //创建topic
                topicConfig = new TopicConfig(topic);
                //重试topic的默认读写队列数量为1
                topicConfig.setReadQueueNums(clientDefaultTopicQueueNums);
                topicConfig.setWriteQueueNums(clientDefaultTopicQueueNums);
                //重试topic的默认权限为读写
                topicConfig.setPerm(perm);
                topicConfig.setTopicSysFlag(topicSysFlag);
                log.info("create new topic {}", topicConfig);
                this.topicConfigTable.put(topic, topicConfig);
                createNew = true;
                //获取下一个版本
                this.dataVersion.nextVersion();
                //持久化broker信息
                this.persist();
            } finally {
                //解锁
                this.topicConfigTableLock.unlock();
            }
        }
    } catch (InterruptedException e) {
        log.error("createTopicInSendMessageBackMethod exception", e);
    }
    if (createNew) {
        //注册broker信息
        this.brokerController.registerBrokerAll(false, true, true);
    }
    return topicConfig;
}
```

##### 2.1.3 autoCreateTopicEnable自动创建topic的问题#

- Producer发送消息源码, 客户端发送信息前, 会选择一个topic所在的broker地址, 如果topic不存在, 那么会默认topic的路由信息中的一个broker发送。
- 信息发送到broker后, 会发送没有指定的topic并且如果broker的autoCreateTopicEnable为true的话, 会走createTopicInSendMessageMethod方法, 会自动创建topic方法的最后马上调用registerBrokerAll方法向nameServer注册当前broker的新配置路由信息。
- 生产者客户端会定时每30s从nameServer更新路由数据, 如果此时有其他的producer的存在, 并且刚好从nameServer获取到了这个新的topic的路由信息, 假设其他producer也需要向该topic发送信息, 由于发现topic路由信息已存在, 并且只存在于刚才那一个broker中, 此时这些producer都会将该topic的消息发送到这一个broker中来。
- 接下来所有的Producer都只会向这一个Broker发送消息, 其他broker不再有机会创建新topic。本想topic在所有broker创建, 但是只有一个broker有topic信息, 违背了RocketMQ集群实现高可用的本事。
- 所以RocketMQ官方建议生产环境下将broker的autoCreateTopicEnable设置为false, 闭自动创建topic, 改为手动在每个broker上创建。

### 3.handlePutMessageResultFuture处理消息存放结果

存放消息后, 调用handlePutMessageResult方法。

```java
/**
 * SendMessageProcessor的方法
 * <p>
 * 处理消息存放结果
 *
 * @param putMessageResult   存放结果
 * @param response           响应对象
 * @param request            请求对象
 * @param msgInner           内部消息对象
 * @param responseHeader     响应头
 * @param sendMessageContext 发送消息上下文
 * @param ctx                连接上下文
 * @param queueIdInt         queueId
 * @return
 */
private CompletableFuture<RemotingCommand> handlePutMessageResultFuture(CompletableFuture<PutMessageResult> putMessageResult,
                                                                        RemotingCommand response,
                                                                        RemotingCommand request,
                                                                        MessageExt msgInner,
                                                                        SendMessageResponseHeader responseHeader,
                                                                        SendMessageContext sendMessageContext,
                                                                        ChannelHandlerContext ctx,
                                                                        int queueIdInt) {
    //阻塞，当从存放消息完毕时，执行后续的操作，即执行handlePutMessageResult方法
    return putMessageResult.thenApply((r) ->
            handlePutMessageResult(r, response, request, msgInner, responseHeader, sendMessageContext, ctx, queueIdInt)
    );
}
```

handlePutMessageResult处理存放消息的结果, 响应写回给客户端。

```java
/**
 * SendMessageProcessor的方法
 * <p>
 * 处理存放消息的结果
 *
 * @param putMessageResult   存放结果
 * @param response           响应对象
 * @param request            请求对象
 * @param msg                内部消息对象
 * @param responseHeader     响应头
 * @param sendMessageContext 发送消息上下文
 * @param ctx                连接上下文
 * @param queueIdInt         queueId
 * @return
 */
private RemotingCommand handlePutMessageResult(PutMessageResult putMessageResult, RemotingCommand response,
                                               RemotingCommand request, MessageExt msg,
                                               SendMessageResponseHeader responseHeader, SendMessageContext sendMessageContext, ChannelHandlerContext ctx,
                                               int queueIdInt) {
    //结果为null，那么直接返回系统异常
    if (putMessageResult == null) {
        response.setCode(ResponseCode.SYSTEM_ERROR);
        response.setRemark("store putMessage return null");
        return response;
    }
    boolean sendOK = false;
    //解析存放消息状态码，转换为对应的响应码
    switch (putMessageResult.getPutMessageStatus()) {
        // Success
        case PUT_OK:
            sendOK = true;
            response.setCode(ResponseCode.SUCCESS);
            break;
        case FLUSH_DISK_TIMEOUT:
            response.setCode(ResponseCode.FLUSH_DISK_TIMEOUT);
            sendOK = true;
            break;
        case FLUSH_SLAVE_TIMEOUT:
            response.setCode(ResponseCode.FLUSH_SLAVE_TIMEOUT);
            sendOK = true;
            break;
        case SLAVE_NOT_AVAILABLE:
            response.setCode(ResponseCode.SLAVE_NOT_AVAILABLE);
            sendOK = true;
            break;
        // Failed
        case CREATE_MAPEDFILE_FAILED:
            response.setCode(ResponseCode.SYSTEM_ERROR);
            response.setRemark("create mapped file failed, server is busy or broken.");
            break;
        case MESSAGE_ILLEGAL:
        case PROPERTIES_SIZE_EXCEEDED:
            response.setCode(ResponseCode.MESSAGE_ILLEGAL);
            response.setRemark(
                    "the message is illegal, maybe msg body or properties length not matched. msg body length limit 128k, msg properties length limit 32k.");
            break;
        case SERVICE_NOT_AVAILABLE:
            response.setCode(ResponseCode.SERVICE_NOT_AVAILABLE);
            response.setRemark(
                    "service not available now. It may be caused by one of the following reasons: " +
                            "the broker's disk is full [" + diskUtil() + "], messages are put to the slave, message store has been shut down, etc.");
            break;
        case OS_PAGECACHE_BUSY:
            response.setCode(ResponseCode.SYSTEM_ERROR);
            response.setRemark("[PC_SYNCHRONIZED]broker busy, start flow control for a while");
            break;
        case LMQ_CONSUME_QUEUE_NUM_EXCEEDED:
            response.setCode(ResponseCode.SYSTEM_ERROR);
            response.setRemark("[LMQ_CONSUME_QUEUE_NUM_EXCEEDED]broker config enableLmq and enableMultiDispatch, lmq consumeQueue num exceed maxLmqConsumeQueueNum config num, default limit 2w.");
            break;
        case UNKNOWN_ERROR:
            response.setCode(ResponseCode.SYSTEM_ERROR);
            response.setRemark("UNKNOWN_ERROR");
            break;
        default:
            response.setCode(ResponseCode.SYSTEM_ERROR);
            response.setRemark("UNKNOWN_ERROR DEFAULT");
            break;
    }
    String owner = request.getExtFields().get(BrokerStatsManager.COMMERCIAL_OWNER);
    //如果发送成功
    if (sendOK) {
        //如果topic是SCHEDULE_TOPIC_XXXX，即延迟消息的topic
        if (TopicValidator.RMQ_SYS_SCHEDULE_TOPIC.equals(msg.getTopic())) {
            //增加统计计数
            this.brokerController.getBrokerStatsManager().incQueuePutNums(msg.getTopic(), msg.getQueueId(), putMessageResult.getAppendMessageResult().getMsgNum(), 1);
            this.brokerController.getBrokerStatsManager().incQueuePutSize(msg.getTopic(), msg.getQueueId(), putMessageResult.getAppendMessageResult().getWroteBytes());
        }
        //增加统计计数
        this.brokerController.getBrokerStatsManager().incTopicPutNums(msg.getTopic(), putMessageResult.getAppendMessageResult().getMsgNum(), 1);
        this.brokerController.getBrokerStatsManager().incTopicPutSize(msg.getTopic(),
                putMessageResult.getAppendMessageResult().getWroteBytes());
        this.brokerController.getBrokerStatsManager().incBrokerPutNums(putMessageResult.getAppendMessageResult().getMsgNum());
        response.setRemark(null);
        //设置响应头中的migId，实际上就是broker生成的offsetMsgId属性
        responseHeader.setMsgId(putMessageResult.getAppendMessageResult().getMsgId());
        //消息队列Id
        responseHeader.setQueueId(queueIdInt);
        //消息逻辑偏移量
        responseHeader.setQueueOffset(putMessageResult.getAppendMessageResult().getLogicsOffset());
        //如果不是单向请求，那么将响应写会客户端
        doResponse(ctx, request, response);
        //如果有发送消息的钩子，那么执行
        if (hasSendMessageHook()) {
            sendMessageContext.setMsgId(responseHeader.getMsgId());
            sendMessageContext.setQueueId(responseHeader.getQueueId());
            sendMessageContext.setQueueOffset(responseHeader.getQueueOffset());
            int commercialBaseCount = brokerController.getBrokerConfig().getCommercialBaseCount();
            int wroteSize = putMessageResult.getAppendMessageResult().getWroteBytes();
            int incValue = (int) Math.ceil(wroteSize / BrokerStatsManager.SIZE_PER_COUNT) * commercialBaseCount;
            sendMessageContext.setCommercialSendStats(BrokerStatsManager.StatsType.SEND_SUCCESS);
            sendMessageContext.setCommercialSendTimes(incValue);
            sendMessageContext.setCommercialSendSize(wroteSize);
            sendMessageContext.setCommercialOwner(owner);
        }
        return null;
    } else {
        //如果有发送消息的钩子，那么执行
        if (hasSendMessageHook()) {
            int wroteSize = request.getBody().length;
            int incValue = (int) Math.ceil(wroteSize / BrokerStatsManager.SIZE_PER_COUNT);
            sendMessageContext.setCommercialSendStats(BrokerStatsManager.StatsType.SEND_FAILURE);
            sendMessageContext.setCommercialSendTimes(incValue);
            sendMessageContext.setCommercialSendSize(wroteSize);
            sendMessageContext.setCommercialOwner(owner);
        }
    }
    return response;
}
```
