# 06、Dubbo 2.7 源码解析 - 高级配置Spring Boot 中使用 Dubbo、generic 泛化服务/泛化引用、属性配置优先级、配置建议
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/6.html
- 分类：J2EE框架
- 分组：教程目录
## 1. Spring Boot 中使用 Dubbo

高并发下Redis会出现的问题：

缓存穿透、缓存雪崩、热点缓存

本节还会演示一下双重检查锁机制

### 1.1 定义 commons 工程 11-dubboCommons

#### (1) 创建工程

这里就创建一个普通的 Maven 的 Java 工程，并命名为 11-dubboCommons。

#### (2) 定义 pom 文件

```java
<groupId>com.abc</groupId>
<artifactId>11-dubboCommons</artifactId>
<version>1.0-SNAPSHOT</version>
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
</properties>
<dependencies>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.2</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

#### (3) 定义实体类

```java
@Data
public class Employee implements Serializable {
    private Integer id;
    private String name;
    private int age;
}
```

#### (4) 定义业务接口

```java
public interface EmployeeService {
    void addEmployee(Employee employee);
    Employee findEmployeeById(int id);
    Integer findEmployeeCount();
}
```

#### (5) 将工程安装到本地库

运行Maven 的 install 命令，将工程安装到本地版本库，以备其它工程使用。

### 1.2 定义提供者 11-provider-springboot

#### (1) 创建工程

创建一个 Spring Boot 工程，并重命名为 11-provider-springboot。

#### (2) 定义 pom 文件

- A、添加 dubbo 与 spring boot 整合依赖

```java
<!--dubbo与spring boot整合依赖-->
<dependency>
    <groupId>com.alibaba.spring.boot</groupId>
    <artifactId>dubbo-spring-boot-starter</artifactId>
    <version>2.0.0</version>
</dependency>
```

- B、 添加 zkClient 依赖

因为dubbo-spring-boot-starter用的dubbo是2.6.0，所以ZK客户端要用zkclient

```java
<!-- zk客户端依赖：zkclient -->
<dependency>
    <groupId>com.101tec</groupId>
    <artifactId>zkclient</artifactId>
    <version>0.10</version>
</dependency>
```

- C、 其它依赖
- dubboCommons 依赖
- spring boot 与 redis 整合依赖
- mybatis 与 spring boot 整合依赖
- 数据源 Druid 依赖
- mysql 驱动依赖
- slf4j-log4j12 依赖
- spring-boot-starter-web 依赖

#### (3) 定义 Service 实现类

```java
@Service   // Dubbo的注解  <dubbo:service/>
@Component
public class EmployeeServiceImpl implements EmployeeService {
    @Autowired
    private EmployeeDao dao;
    @Autowired
    private RedisTemplate<Object, Object> redisTemplate;
    // 当有对象插入时会清空realTimeCache缓存空间
    @CacheEvict(value="realTimeCache", allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    @Override
    public void addEmployee(Employee employee) {
        dao.insertEmployee(employee);
    }
    // 一旦有了查询结果，则会将此结果写入到realTimeCache缓存
    // key是employee_加上方法参数
    @Cacheable(value="realTimeCache", key = "'employee_'+#id")
    @Override
    public Employee findEmployeeById(int id) {
        // 从DB查询
        System.out.println("从DB查询id = " + id);
        return dao.selectEmployeeById(id);
    }
    private volatile Object count;
    // 双重检测锁机制解决Reids的热点缓存问题
    // 非实时缓存数据
    @Override
    public Integer findEmployeeCount() {
        // 获取Redis操作对象
        BoundValueOperations<Object, Object> ops = redisTemplate.boundValueOps("count");
        // 从缓存获取数据
        count = ops.get();
        if(count == null) {
           synchronized (this) {
                count = ops.get();
                if(count == null) {
                    System.out.println("从DB中查询");
                    // 从DB中查询
                    count = dao.selectEmployeeCount();
                    // 将查询结果存放到Redis
                    ops.set(count, 10, TimeUnit.SECONDS);
                }
            }
        }
        return (Integer) count;
    }
}
```

#### (4) 定义 Dao 接口

```java
@Mapper   // 自动Mapper的动态代理对象
public interface EmployeeDao {
    void insertEmployee(Employee employee);
    Integer selectEmployeeCount();
    Employee selectEmployeeById(int id);
}
```

#### (5) 定义映射文件

```java
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.abc.dao.EmployeeDao">
    <insert id="insertEmployee">
        insert into employee(name, age) values(#{name},{age})
    </insert>
    <select id="selectEmployeeCount" resultType="int">
        select count(id) from employee
    </select>
    <select id="selectEmployeeById" resultType="Employee">
        select id, name, age from employee where id=#{xxx}
    </select>
</mapper>
```

数据库已经建好了

#### (6) 修改启动类

在启动类上必须要添加@EnableDubboConfiguration 注解，开启 Dubbo 的自动配置功能。

```java
@EnableTransactionManagement
@SpringBootApplication
@EnableCaching
@EnableDubboConfiguration   // 开启Dubbo自动配置功能
public class ProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProviderApplication.class, args);
    }
}
```

#### (7) 修改主配置文件

```java
server:
  port: 8888
mybatis:
  注册mybatis中实体类的别名
  type-aliases-package: com.abc.bean
  注册映射文件
  mapper-locations: classpath:com/abc/dao/*.xml
spring:
  注册数据源
  datasource:
    指定数据源类型为Druid
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.mysql.jdbc.Driver
    url: jdbc:mysql:///test?useUnicode=true&characterEncoding=utf8
    username: root
    password: 111
  连接Redis服务器
  redis:
    host: redis5OS
    port: 6379
    password: 111
  连接Redis高可有集群
   redis:
     sentinel:
       master: mymaster
       nodes:
         - sentinelOS1:26379
         - sentinelOS2:26379
         - sentinelOS3:26379
  配置缓存
  cache:
    type: redis 指定缓存类型
    cache-names: realTimeCache   指定缓存区域名称
  功能等价于spring-boot配置文件中的<dubbo:application/>
  application:
    name: 11-provider-springboot
  指定zk注册中心
  dubbo:
    registry: zookeeper://zkOS:2181
  zk集群作注册中心
  registry: zookeeper://zkOS1:2181?backup=zkOS2:2181,zkOS3:2181
```

### 1.3 定义消费者 11-consumer-springboot

#### (1) 创建工程

创建一个 Spring Boot 工程，并重命名为 11-consumer-springboot。

#### (2) 定义 pom 文件

- dubbo 与 spring boot 整合依赖
- zkClient 依赖
- dubboCommons 依赖
- JSP 引擎 jasper 依赖
- slf4j-log4j12 依赖
- spring-boot-starter-web 依赖

比较特殊的：

```java
<build>
    <resources>
        <!--注册webapp目录为资源目录-->
        <resource>
            <directory>src/main/webapp</directory>
            <targetPath>META-INF/resources</targetPath>
            <includes>
                <include>**/*.*</include>
            </includes>
        </resource>
    </resources>
</build>
```

#### (3) 修改主配置文件

```java
spring:
  功能等价于spring-dubbo配置文件中的<dubbo:application/>
  application:
    name: 11-consumer-springboot
  指定zk注册中心
  dubbo:
    registry: zookeeper://zkOS:2181
    zk集群作注册中心
    registry: zookeeper://zkOS1:2181?backup=zkOS2:2181,zkOS3:2181
```

#### (4) 创建 index.jsp 页面

在src/main/webapp 目录下定义 index.jsp 文件。

```java
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>index page</title>
</head>
<body>
    <form action="consumer/employee/register" method="post">
        姓名：<input type="text" name="name"/> <br>
        年龄：<input type="text" name="age"/> <br>
        <input type="submit" value="注册"/>
    </form>
</body>
</html>
```

#### (5) 定义处理器

```java
@Controller
@RequestMapping("/consumer/employee")
public class SomeController {
    // @Autowired
    @Reference   // Dubbo的注解   <dubbo:reference />
    private EmployeeService employeeService;
    @PostMapping("/register")
    public String someHandle(Employee employee, Model model) {
        employeeService.addEmployee(employee);
        model.addAttribute("employee", employee);
        return "/welcome.jsp";
    }
    @RequestMapping("/find/{id}")
    @ResponseBody
    public Employee findHandle(@PathVariable("id") int id) {
        return employeeService.findEmployeeById(id);
    }
    @RequestMapping("/count")
    @ResponseBody
    public Integer countHandle() {
        return employeeService.findEmployeeCount();
    }
}
```

> @Reference注解：

#### (6) 定义 welcome.jsp 页面

src/main/webapp 目录下定义 welcome.jsp 文件。

```java
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>welcome page</title>
</head>
<body>
    welcome you 【 ${employee} 】<br>
</body>
</html>
```

#### (7) 修改入口类

```java
@SpringBootApplication
@EnableDubboConfiguration
public class ConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }
}
```

#### (8) 演示

演示实时缓存(高并发情况下会出现缓存一致性问题)：

- 直接查询，发现没有从数据库查询，因为缓存已经有数据了
- 进行插入操作，完成后再次查询，发现从数据库查了，因为插入操作会清空缓存：

非实时缓存演示：

## 2. generic 泛化服务/泛化引用

在[dubbo:service/](dubbo:service/)与[dubbo:reference/](dubbo:reference/)中都有一个 generic 属性，其在[dubbo:service/](dubbo:service/)标签中可以提供泛化服务，在[dubbo:reference/](dubbo:reference/)中可以提供泛化引用。`泛化服务与泛化引用无需同时使用。其主要是针对某一方没有具体业务接口的.class 情况的`。这又是 Dubbo 扩展性的一个体现。

### 2.1 提供者工程 14-generic-provider

#### (1) 创建工程

复制02-provider-zk 工程，在其基础之上修改。

#### (2) 修改 pom

将api 依赖删除，不再需要该业务接口了。

#### (3) 定义 GerericServiceImpl 类

将原有的 SomeServiceImpl 方法删除，定义如下方法。

```java
public class GenericServiceImpl implements GenericService {
    @Override
    public Object $invoke(String method, String[] parameterTypes,
                          Object[] args) throws GenericException {
        if ("hello".equals(method)) {
            return "Generic hello，" + args[0];
        }
        return null;
    }
}
```

泛化服务接口：

```java
/**
 * Generic service interface
 *
 * @export
 */
public interface GenericService {
    /**
     * Generic invocation
     * 方法名
     * @param method         Method name, e.g. findPerson. If there are overridden methods, parameter info is 
     *                       required, e.g. findPerson(java.lang.String)
     * 方法参数类型列表
     * @param parameterTypes Parameter types 
     * 参数具体值
     * @param args           Arguments
     * @return invocation return value
     * @throws GenericException potential exception thrown from the invocation
     */
    Object $invoke(String method, String[] parameterTypes, Object[] args) throws GenericException;
    default CompletableFuture<Object> $invokeAsync(String method, String[] parameterTypes, Object[] args) throws GenericException {
        Object object = $invoke(method, parameterTypes, args);
        if (object instanceof CompletableFuture) {
            return (CompletableFuture<Object>) object;
        }
        return CompletableFuture.completedFuture(object);
    }
}
```

#### (4) 修改 xml 文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://dubbo.apache.org/schema/dubbo
       http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="02-provider-zk"/>
    <!--声明注册中心：单机版zk-->
    <dubbo:registry address="zookeeper://zkOS:2181" />
    <dubbo:protocol name="dubbo" port="20880"/>
    <!--注册GenericServiceImpl-->
    <bean id="someService" class="com.abc.provider.GenericServiceImpl"/>
    <!--此时的报红是Idea检测的问题，不影响运行-->
    <dubbo:service interface="com.abc.service.SomeService" ref="someService"
                   generic="true"/>
</beans>
```

### 2.2 消费者工程 14-generic-consumer

#### (1) 创建工程

复制02-provider-zk 工程，在其基础之上修改。

#### (2) 修改 pom

将api 依赖删除，不再需要该业务接口了。

#### (3) 修改 xml 文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">
    <dubbo:application name="02-consumer-zk">
        <dubbo:parameter key="qos.port" value="33333"/>
    </dubbo:application>
    <!--指定服务注册中心：zk单机-->
    <dubbo:registry address="zookeeper://zkOS:2181" />
    <dubbo:reference id="someService" interface="com.abc.service.SomeService"
                     check="false" generic="true" />
</beans>
```

#### (4) 修改 ConsumerRun

```java
public class ConsumerRun {
    public static void main(String[] args) throws IOException {
        ApplicationContext ac = new ClassPathXmlApplicationContext("spring-consumer.xml");
		// 这里的类型为GenericService
        GenericService service = (GenericService) ac.getBean("someService");
        //调用业务方法
        Object hello = service.$invoke("hello", //指定要调用的方法名
        new String[]{
     String.class.getName()},//方法参数类型列表
         new Object[]{
     "Tom"});//指定方法参数列表
        System.out.println("================ " + hello);
    }
}
```

运行结果：

## 3. 属性配置优先级

Dubbo 配置文件中各个标签属性配置的优先级总原则是：

- 方法级优先，接口级(服务级)次之，全局配置再次之。
- 如果级别一样，则消费方优先，提供方次之。

另外，还有两个标签需要说明一下：

- ``设置在消费者端，用于设置消费者端的默认配置，即消费者端的全局设置。
- ``设置在提供者端，用于设置提供者端的默认配置，即提供者端的默认配置。

## 4. 配置建议

- Provider 端要配置合理的 Provider 端属性
- Provider 端上尽量多配置 Consumer 端属性
