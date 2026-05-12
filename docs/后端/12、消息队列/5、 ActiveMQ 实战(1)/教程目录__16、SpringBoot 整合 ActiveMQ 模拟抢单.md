# 16、SpringBoot 整合 ActiveMQ 模拟抢单
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/16.html
- 分类：消息队列
- 分组：教程目录
由于最近有时间，所以实践一下springboot与ActiveMQ的整合。

下面的场景是 数据库中沙宣有3瓶，假设7人进行抢单，且对用户id进行判断(偶数则出现异常，需要重试三次；奇数则可进行参与), **这个具体逻辑 自己可调整！！！**

首先有两张表：t_produce(产品数量表)、t_produce_record(产品订购消费表)

```sql
CREATE TABLE t_produce_record (
  id int(11) NOT NULL AUTO_INCREMENT COMMENT 'id',
  product_no varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '产品编号',
  user_id int(11) DEFAULT NULL COMMENT '订购产品的用户id',
  status varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '状态',
  PRIMARY KEY (id) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC COMMENT='产品订购记录表';
CREATE TABLE t_produce (
  id int(11) NOT NULL AUTO_INCREMENT COMMENT 'id',
  product_no varchar(255) CHARACTER SET utf8 COLLATE utf8_icelandic_ci DEFAULT NULL COMMENT '产品编号',
  total int(11) DEFAULT NULL COMMENT '产品数量',
  PRIMARY KEY (id) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC COMMENT='产品数量记录表';
INSERT INTO t_produce (id, product_no, total) VALUES ('1', '沙宣', '3');
```

## 引入pom依赖

```xml
<!--activemq-->
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-activemq</artifactId>
</dependency>
<!--ActiveMQ 链接池-->
<dependency>
   <groupId>org.messaginghub</groupId>
   <artifactId>pooled-jms</artifactId>
   <version>1.0.5</version>
</dependency>
```

## application.yml配置ActiveMQ的地址

```java
spring: 
  activemq:
    broker-url: tcp://192.168.43.196:61616
    user: admin
    password: admin
    pool:
      enabled: true
      max-connections: 100
    in-memory: false
```

## 配置文件ActiveMQConfig

```java
@Configuration
public class ActiveMQConfig {
    @Value("${spring.activemq.broker-url}")
    private  String brokerUrl;
    @Value("${spring.activemq.user}")
    private  String username;
    @Value("${spring.activemq.password}")
    private  String password;
    @Bean(autowire = Autowire.BY_NAME,value = "QueueProduct")
    public Queue QueueProduct(){
        return new ActiveMQQueue("productQueue");
    }
    /**
     * 配置名字为givenConnectionFactory的连接工厂
     * @return
     */
    @Bean
    public ActiveMQConnectionFactory connectionFactory() {
        ActiveMQConnectionFactory activeMQConnectionFactory = new ActiveMQConnectionFactory(username, password, brokerUrl);
        // 设置重发机制
        RedeliveryPolicy policy = new RedeliveryPolicy();
        policy.setUseExponentialBackOff(Boolean.TRUE);
        // 消息处理失败重新处理次数,默认为6次
        policy.setMaximumRedeliveries(3); //该重试次数目前是用于queue
        // 重发时间间隔,默认为1秒
        policy.setInitialRedeliveryDelay(1000L);
        policy.setBackOffMultiplier(2);
        policy.setMaximumRedeliveryDelay(1000L);
        activeMQConnectionFactory.setRedeliveryPolicy(policy);
        return activeMQConnectionFactory;
    }
    /**
     * 在Queue模式中，对消息的监听需要对containerFactory进行配置
     *
     * @param givenConnectionFactory
     * @return
     */
    @Bean
    public JmsListenerContainerFactory<?> jmsListenerContainerQueue(ActiveMQConnectionFactory givenConnectionFactory) {
        SimpleJmsListenerContainerFactory factory = new SimpleJmsListenerContainerFactory();
        // 关闭事务
        factory.setSessionTransacted(false);
        // 手动确认消息
        factory.setSessionAcknowledgeMode(ActiveMQSession.INDIVIDUAL_ACKNOWLEDGE);
        factory.setPubSubDomain(false);
        factory.setConnectionFactory(givenConnectionFactory);
        return factory;
    }
}
```

## 生产者ActiveMQSender

```java
@Component
public class ActiveMQSender {
    @Autowired
    private JmsMessagingTemplate jmsTemplate;
    /*
     * 发送消息，destination是发送到的队列，message是待发送的消息
     */
    public void sendChannelMess(Destination destination, final String message){
        jmsTemplate.convertAndSend(destination, message);
    }
}
```

## 消费者监听ActiveMQListener

```java
@Component
public class ActiveMQListener {
    private static final Logger logger= LoggerFactory.getLogger(ActiveMQListener.class);
    private static int num=0; //记录重发总次数
    @Autowired
    private ProductService productService;
    @JmsListener(destination = "productQueue", containerFactory = "jmsListenerContainerQueue")
    public void receiver(ActiveMQMessage message, Session session){
        if(message instanceof TextMessage){
            //处理消息
            TextMessage textMessage=(TextMessage)message;
            try {
                System.out.println("用户"+textMessage.getText()+"开始抢单");
                productService.robbingProduct(Integer.parseInt(textMessage.getText()));
                // 确认消息已经消费成功
                textMessage.acknowledge();
            } catch (Exception e) {
                // 拒绝当前消息，并把消息返回原队列
                try {
                    ++num;
                    logger.error("消费处理异常,触发重试机制:num={},错误信息={}", num, e.getMessage());
                    session.recover();
                } catch (JMSException e1) {
                    e1.printStackTrace();
                }
            }
        }
    }
}
```

## 实体类

```java
public class TProductRecord implements Serializable {
    private int id;
    private String productNo; //产品编号
    private int userId; //用户id
    private String status; //状态 
}
```

```java
public class TProduct implements Serializable {
    private int id;
    private String productNo; //产品编号
    private int total; //总数
}
```

## mapper

```java
public interface TProductMapper {
    //修改产品数量表
    int updateTProduct(TProduct tProduct);
    //新增产品订购记录表
    int insertTProductRecord(TProductRecord tProductRecord);
    //根据产品编号查询产品
    TProduct selectProductByNo(String productNo);
}
```

## sql的xml

```java
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.bigdata.bigdata.mapper.TProductMapper">
	<resultMap type="com.bigdata.bigdata.entity.activemq.TProduct" id="tProductResultMap">
		<id  property="id" column="id" />
		<result property="productNo" column="product_no" />
		<result property="total" column="total" />
	</resultMap>
	<resultMap type="com.bigdata.bigdata.entity.activemq.TProductRecord" id="tProductRecordResultMap">
		<id  property="id" column="id" />
		<result property="productNo" column="product_no" />
		<result property="userId" column="user_id" />
	</resultMap>
    <update id="updateTProduct" parameterType="com.bigdata.bigdata.entity.activemq.TProduct">
        update t_produce
        set total=total-1
        where id=#{id}
    </update>
	<insert id="insertTProductRecord" parameterType="com.bigdata.bigdata.entity.activemq.TProductRecord">
		insert into t_produce_record(product_no,user_id,status)
		values(#{productNo},#{userId},#{status})
	</insert>
	<select id="selectProductByNo" parameterType="String" resultMap="tProductResultMap">
		select * from t_produce
		where id=#{id}
	</select>
</mapper>
```

## service层

```java
@Service
public class ProductService {
    private static final Logger logger= LoggerFactory.getLogger(ProductService.class);
    @Autowired
    private TProductMapper tProductMapper;
    public void robbingProduct(Integer userId){
        TProduct product = tProductMapper.selectProductByNo(""+1);
        System.out.println("抢单人员="+userId);
        if (product != null && product.getTotal() > 0) {
            //更新库存表，库存量减少1。返回1说明更新成功。返回0说明库存已经为0
            if(userId%2==0){
                System.out.println("用户"+userId+"抢单出现异常");
                //插入记录
                TProductRecord tProductRecord=new TProductRecord();
                tProductRecord.setProductNo(product.getProductNo());
                tProductRecord.setUserId(userId);
                tProductRecord.setStatus("重试失败");
                tProductMapper.insertTProductRecord(tProductRecord);
                int iii=111/0;
            }
            TProduct tProduct=new TProduct();
            tProduct.setId(product.getId());
            tProduct.setProductNo(product.getProductNo());
            int i = tProductMapper.updateTProduct(tProduct);
            if(i>0){
                //插入记录
                TProductRecord tProductRecord=new TProductRecord();
                tProductRecord.setProductNo(product.getProductNo());
                tProductRecord.setUserId(userId);
                tProductRecord.setStatus("成功");
                tProductMapper.insertTProductRecord(tProductRecord);
                //发送短信
                logger.info("用户{}抢单成功", userId);
            }else {
                //插入记录
                TProductRecord tProductRecord=new TProductRecord();
                tProductRecord.setProductNo(product.getProductNo());
                tProductRecord.setUserId(userId);
                tProductRecord.setStatus("失败");
                tProductMapper.insertTProductRecord(tProductRecord);
                logger.error("用户{}抢单失败", userId);
            }
        } else {
            //插入记录
            TProductRecord tProductRecord=new TProductRecord();
            tProductRecord.setProductNo(product.getProductNo());
            tProductRecord.setUserId(userId);
            tProductRecord.setStatus("数量无");
            tProductMapper.insertTProductRecord(tProductRecord);
            logger.error("用户{}抢单失败", userId);
        }
    }
}
```

## controller层

```java
@RestController
@RequestMapping("/producer")
public class ProducerController {
   @Autowired
   private ActiveMQSender activeMQSender;
    @Resource(name = "QueueProduct")
    private Queue queueProduct;
    private int userId=0;
    //开始抢单
    @RequestMapping("/begin")
    public void begin(){
        userId++;
        activeMQSender.sendChannelMess(queueProduct,userId+"");
    }
}
```

开发已完成，使用Jmeter进行测试，结果如下：

此篇文章只是为了运用一下ActiveMQ的重试机制和jmeter的使用，所以有逻辑不对的地方自己可进行调整！！！
