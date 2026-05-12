# 03、MyBatis 实战 - 之MyBatis完成增删改查CURD功能超级详细
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/3.html
- 分类：ORM框架
- 分组：教程目录
## 一、准备工作

### 1、引入maven依赖

```xml
<dependencies>
    <!--junit测试类-->
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.11</version>
      <scope>test</scope>
    </dependency>
    <!--mybatis依赖-->
    <dependency>
      <groupId>org.mybatis</groupId>
      <artifactId>mybatis</artifactId>
      <version>3.5.10</version>
    </dependency>
    <!--数据库驱动-->
    <dependency>
      <groupId>mysql</groupId>
      <artifactId>mysql-connector-java</artifactId>
      <version>8.0.30</version>
    </dependency>
    <!--引入logback日志框架依赖，这个日志框架实现了slf4j规范-->
    <dependency>
      <groupId>ch.qos.logback</groupId>
      <artifactId>logback-classic</artifactId>
      <version>1.2.11</version>
    </dependency>
  </dependencies>
```

### 2、开发工具类 SqlSessionUtil

```java
作用：
1、SqlSessionUtil，方便用来获取SqlSession对象
2、避免多次重复创建SqlSessionFactory 对象，
因为一个环境下，只需要创建一个SqlSessionFactory 
```

```java
package com.powernode.util;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import java.io.IOException;
public class SqlSessionUtil {
    private SqlSessionUtil(){
     };
    private static SqlSessionFactory sqlSessionFactory;
    static {
        try {
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(Resources.getResourceAsStream("mybatis-config.xml"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    /**
     * 获取会话对象，
     * @return
     */
    public static SqlSession openSqlSession(){
        return sqlSessionFactory.openSession();
    }
}
```

### 3、准备 mybatis-config.xml文件

```java
在resources目录下，添加mybatis-config.xml文件
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql://localhost:3306/powernode?useUnicode=true&characterEncoding=utf-8"/>
                <property name="username" value="root"/>
                <property name="password" value="root"/>
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="com/CarMapper.xml"/>
    </mappers>
</configuration>
```

### 4、准备日志文件logback.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration debug="false">
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <pattern>%d{HH:mm:ss.SSS} %contextName [%thread] %-5level %logger{36} - %msg%n
            </pattern>
        </encoder>
    </appender>
    <logger name="com.apache.ibatis" level="TRACE"/>
    <logger name="java.sql.Connection" level="DEBUG"/>
    <logger name="java.sql.Statement" level="DEBUG"/>
    <logger name="java.sql.PreparedStatement" level="DEBUG"/>
    <root level="DEBUG">
        <appender-ref ref="STDOUT" />
        <appender-ref ref="FILE" />
    </root>
</configuration>
```

## 二、INSERT 功能

### 1、JDBC和mybatis占位符对比

```java
JDBC的代码是怎么写的?
string sql ="insert into t_car(id,car_num,brand,guide_price,produce_time,car_type) values(null,?,?,?,?,?)"; ps.setstring(1,xxx); ps.setstring(2, yyy);
....
在JDBC当中占位符采用的是?
在mybatis当中不能使用?占位符，必须使用{} 来代替JDBC当中的 ?#{} 和 JDBC当中的 ? 是等效的。
```

### 2、java程序中使用Map可以给SQL语句的占位符传值:

```java
Map<String, Object> map = new HashMap<>(); 
map.put("k1"，"1111"); 
map.put("k2"，"比亚迪汉"); 
map.put("k3"，10.0);
map.put("k4"，"2020-11-11"); 
map.put("k5"，"电车");
```

xml文件写法

```java
insert into t car(id.car_num.brandquide priceproduce_timecartype)values(null,#{k1},#{k2}.#{k3}.#{k4}.#{k5})
```

注意:#{这里写什么?写map集合的key，如果key不存在，获取的是null}

**一般map集合的key起名的时候要见名知意。**

```java
map.put("carNum"，"1111");
 map.put("brand"，"比亚迪汉2"); 
 map.put("guidePrice"，10.0);
map.put("produceTime"，"2020-11-11"); 
map.put("carType"，"电车");
insert into t car(id,car_num,brand,guide_price,produce_time,car_type 
values(null,#{carNum},#{brand},#fauidePrice},#{produceTime},#{carType}）
```

### 3、java程序中使用POJO类给SQL语句的占位符传值

java程序中使用POJO类给SQL语句的占位符传值:

Carcar =new Car(null，“3333”，“比亚迪秦”，30.0，“2020-11-11”，“新能源”);

注意:占位符#{}，大括号里面写:pojo类的属性名

insert into t_car(id,car_num,brand,guide_price,produce_time,car_type)

values(null.#{carNum}.#{brand}.#{quidePrice}.#{produceTime},#{carType}

把SQL语句写成这个德行:

insert into t_car(id,car_num,brand,guide_price,produce_time,car_type)

values(null,#{xyz},#{brand},#{guidePrice},#{produceTime},#{carType})

出现了什么问题呢?

There is no getter for property named 'xyz’ in 'class com.powernode.mybatis.pojo.Car mybatis去找:Car类中的getXyz()方法去了。没找到。报错了。

怎么解决的?

可以在Car类中提供一个getxyz()方法。这样问题就解决了。

**通过这个测试，得出一个结论:**

```java
严格意义上来说:如果使用POJO对象传递值的话，#{}这个大括号中到底写什么?
写的是get方法的方法名去掉get，然后将剩下的单词首字母小写，然后放进去。
例如:getUsername() -->{username}例如:getEmail() -->{email}
也就是说mybatis在底层给?传值的时候，先要获取值，怎么获取的?
调用了pojo对象的get方法。例如:car.getCarNum()，car.getCarType(),car.getBrand()
```

**完整的代码：**

```java
pojo实体类 Car
```

```java
package com.powernode.pojo;
public class Car {
    private Long id;
    private String carNum;
    private String brand;
    private Double guidePrice;
    private String produceTime;
    private String carType;
    public Car(Long id, String carNum, String brand, Double guidePrice, String produceTime, String carType) {
        this.id = id;
        this.carNum = carNum;
        this.brand = brand;
        this.guidePrice = guidePrice;
        this.produceTime = produceTime;
        this.carType = carType;
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getCarNum() {
        return carNum;
    }
    public void setCarNum(String carNum) {
        this.carNum = carNum;
    }
    public String getBrand() {
        return brand;
    }
    public void setBrand(String brand) {
        this.brand = brand;
    }
    public Double getGuidePrice() {
        return guidePrice;
    }
    public void setGuidePrice(Double guidePrice) {
        this.guidePrice = guidePrice;
    }
    public String getProduceTime() {
        return produceTime;
    }
    public void setProduceTime(String produceTime) {
        this.produceTime = produceTime;
    }
    public String getCarType() {
        return carType;
    }
    public void setCarType(String carType) {
        this.carType = carType;
    }
}
```

```java
CarMapper.xml文件配置
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="jskdlf">
    <insert id="insertCar">
            insert into t_car(id,car_num,brand,guide_price,produce_time,car_type)
            values(null,#{carNum},#{brand},#{guidePrice},#{produceTime},#{carType})
    </insert>
</mapper>
```

```java
测试类
```

```java
@Test
    public void testInsertPojo(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        Car car = new Car(null,"333","比亚迪秦",30.0,"220-10-09","新能源");
        int count = sqlSession.insert("insertCar",car);
        System.out.println(count);
        sqlSession.commit();
        sqlSession.close();
    }
```

## 三、delete 功能

```java
需求：根据id删除记录
1、pojo实体类同上
2、CarMapper.xml文件sql语句配置
```

```xml
<delete id="deleteById">
        delete from t_car where id ={id}
    </delete>
```

```java
3、测试类
```

```java
@Test
    public void testDelete(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        int count = sqlSession.delete("deleteById",15);
        System.out.println(count);
        sqlSession.commit();
        sqlSession.close();
    }
```

**注意：如果占位符只有一个，那么#{}的大括号里可以随意写，但是最好是见名知意**

## 四、update 功能

```java
需求：根据id修改记录
1、pojo实体类同上
2、CarMapper.xml文件sql语句配置
```

```java
 <update id="updateById">
        update t_car set car_num=#{carNum},brand=#{brand} where id=#{id}
    </update>
```

```java
3、测试类
```

```java
@Test
    public void testUpdateById(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        Car car = new Car();
        car.setId(14L);
        car .setCarNum("999");
        car.setBrand("GTR");
        int count = sqlSession.update("updateById",car);
        System.out.println(count);
        sqlSession.commit();
        sqlSession.close();
    }
```

## 五、select查询功能

**需求：根据id查询，返回一个目标对象**

```java
1、pojo实体类同上
2、CarMapper.xml文件sql语句配置
```

```java
 <select id="selectById" resultType="com.powernode.pojo.Car">
        select * from t_car where id ={id}
    </select>
```

```java
3、测试类
```

```java
@Test
    public void testSelectOne(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        Car car = sqlSession.selectOne("selectById",12);
        System.out.println(car.toString());
        sqlSession.commit();
        sqlSession.close();
    }
```

```java
运行结果
```

```java
发现问题：
Car{id=12, carNum='null', brand='auto', guidePrice=null, produceTime='null', carType='null'}
为什么只有id和brand有值，其他字段都没有查询到值？
原理是因为数据库的列名和pojo实体类的名字不一致，造成的
```

**解决办法**：

```java
可以使用mysql的as关键字起别名
sql文件修改成这样：
```

```xml
<select id="selectById" resultType="com.powernode.pojo.Car">
        select id,
        car_num as carNum,
        brand,
        guide_price as guidePrice,
        produce_time as produceTime,
        car_type as carType from t_car where id ={id}
    </select>
```

```java
运行测试类结果，
```

**需求：查询所有对象**

```java
1、pojo实体类同上
2、CarMapper.xml文件sql语句配置
```

```xml
<select id="selectAll" resultType="com.powernode.pojo.Car">
        select id,
        car_num as carNum,
        brand,
        guide_price as guidePrice,
        produce_time as produceTime,
        car_type as carType from t_car
    </select>
```

```java
3、测试类
```

```java
@Test
    public void testSelectAll(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        List<Car> carList = sqlSession.selectList("selectAll");
        carList.forEach(c-> System.out.println(c));
        sqlSession.commit();
        sqlSession.close();
    }
```

```java
运行结果
```

**注意：**

```java
如果查询的结果为List，那么resultType还是指定要封装的结果集的类型，不是指定list类型，是指定list集合中元素的类型
selectList方法：mybatis通过这个方法就可以得知你需要一个list集合	，他会自动给你返回一个List集合
```
