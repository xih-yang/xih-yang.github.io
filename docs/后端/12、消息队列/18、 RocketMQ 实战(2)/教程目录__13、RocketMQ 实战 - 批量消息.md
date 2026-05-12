# 13、RocketMQ 实战 - 批量消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/13.html
- 分类：消息队列
- 分组：教程目录
如果要发送很多消息，可以使用批量消息，一次发送，避免多次调用网络，同时提供吞吐量。

代码如下：

```java
@Component
public class MessageDataUtils {
    private String data;
    public String getData() {
        return data;
    }
    public void setData(String data) {
        this.data = data;
    }
}
```

MessageDataUtils 用于保存消息。

```java
@Component
@Slf4j
public class GenerateData implements CommandLineRunner {
    @Autowired
    private MessageDataUtils dataUtils;
    String  a = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    int size =  4 * 1024 * 1024 - 1024 ;
    @Override
    public void run(String... args) throws Exception {
        String s = buildOneMBData();
        log.info("生成数据:{}", s.length());
        dataUtils.setData(s);
    }
    private String buildOneMBData() {
        StringBuilder builder = new StringBuilder();
        while (builder.toString().getBytes(StandardCharsets.UTF_8).length < size) {
            builder.append(a);
        }
        log.info("长度:{}", builder.toString().length());
        return builder.toString();
    }
}
```

GenerateData 用于生成数据。字符串a的长度是1024，表示1KB数据。

```java
@RestController
@Slf4j
public class OldVersionController {
    @Autowired
    private OldVersionProducer producer;
    String topic = "MyTopic";
    @Autowired
    private MessageDataUtils dataUtils;
    @RequestMapping("/sendBatchMsg")
    public SendResult sendBatchMsg() throws InterruptedException, RemotingException, MQClientException, MQBrokerException {
        List<Message> list =new ArrayList<>();
        //        for (int i = 0; i < 10; i++) {
        //            Message message = new Message(topic, ("My Batch Message " + i).getBytes(StandardCharsets.UTF_8));
        //           // message.setDelayTimeLevel(3);
        //            list.add(message);
        //        }
        String data = dataUtils.getData();
        Message message = new Message(topic, data.getBytes(StandardCharsets.UTF_8));
        // message.setDelayTimeLevel(3);
        list.add(message);
        return producer.sendMsg(list);
    }
}
```

要使用批量消息，只需将消息封装成 Collection msgs 传入方法中即可。在RocketMQ5.x新版本的api中没有找到批量消息的接口。所以这里使用的是RocketMQ4.x版本的api。同时这里演示了批量消息支持的发送消息的大小。分别发送了单个消息大小为1M，4M的数据。

批量消息使用限制：

**1、** 不支持延时消息上面的例子设置了延时等级，发送直接报错；

**2、** 同一批batch中topic必须相同；

**3、** 消息总大小不超过4M，上面的例子中GenerateData的size要减去1024，不然大小会接近4M会报错；

解决方法如下：

**1、** 发送时压缩数据；

```java
@Component
@Slf4j
public class GenerateData implements CommandLineRunner {
    @Autowired
    private MessageDataUtils dataUtils;
    String  a = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    int size =  5 * 1024 * 1024 ;
    @Override
    public void run(String... args) throws Exception {
        String s = zipData(buildOneMBData());
        log.info("生成数据:{}", s.length());
        dataUtils.setData(s);
    }
    private String buildOneMBData() {
        StringBuilder builder = new StringBuilder();
        while (builder.toString().getBytes(StandardCharsets.UTF_8).length < size) {
            builder.append(a);
        }
        log.info("长度:{}", builder.toString().length());
        return builder.toString();
    }
     private String zipData(String s) {
        ByteArrayOutputStream byteArrayOutputStream =new ByteArrayOutputStream();
        try(GZIPOutputStream gzipOutputStream= new GZIPOutputStream(byteArrayOutputStream)){
            gzipOutputStream.write(s.getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            log.error("压缩数据出错", e);
        }
        return new sun.misc.BASE64Encoder().encode(byteArrayOutputStream.toByteArray());
    }
}
```

用GZIPOutputStream压缩5M数据并发送。

消费时解压数据：

```java
/**
 * 使用gzip解压缩
 *
 * @param compressedStr 压缩字符串
 * @return 解压缩字符串
 */
public static String uncompress(String compressedStr) {
    if (compressedStr == null) {
        return null;
    }
    byte[] compressed = null;
    String decompressed = null;
    GZIPInputStream ginzip = null;
    ByteArrayInputStream in = null;
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    try {
        // 先解码
        compressed = new sun.misc.BASE64Decoder().decodeBuffer(compressedStr);
        in = new ByteArrayInputStream(compressed);
        ginzip = new GZIPInputStream(in);
        byte[] buffer = new byte[1024];
        int offset = -1;
        while ((offset = ginzip.read(buffer)) != -1) {
            out.write(buffer, 0, offset);
        }
        decompressed = out.toString();
    } catch (IOException e) {
        log.error("字符串解压缩异常!", e);
        e.printStackTrace();
    } finally {
        // 关流
    }
    return decompressed;
}
  uncompress(StandardCharsets.UTF_8.decode(messageView.getBody()).toString())
```

messageView是MessageView。

**2、** 按大小切割数据在发送；

**3、** 将数据保存到文件，将文件上传到文件存储服务器，发送时发送存储文件的url；
