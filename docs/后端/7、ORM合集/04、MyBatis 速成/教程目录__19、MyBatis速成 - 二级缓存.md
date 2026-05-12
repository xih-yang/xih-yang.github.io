# 19、MyBatis速成 - 二级缓存
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/19.html
- 分类：ORM框架
- 分组：教程目录
默认情况下是只开启了局部的sqlSession缓存（一级缓存），可以增强变现而且处理循环 依赖也是必须的。

## 1.缓存配置

要开启二级缓存，需要做一些配置

1）开启所有映射器中缓存配置：

将value设置为true

```xml
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>
```

2）需要在你的 SQL 映射文件中添加一行：

```xml
<cache/>
```

字面上看就是这样。这个简单语句的效果如下:

```java
·映射语句文件中的所有 select 语句将会被缓存。
·映射语句文件中的所有 insert,update 和 delete 语句会刷新缓存。
·缓存会使用 Least Recently Used(LRU,最近最少使用的)算法来收回。
·根据时间表(比如 no Flush Interval,没有刷新间隔), 缓存不会以任何时间顺序 来刷新。
·缓存会存储列表集合或对象(无论查询方法返回什么)的 1024 个引用。
·缓存会被视为是 read/write(可读/可写)的缓存,意味着对象检索不是共享的,而 且可以安全地被调用者修改,而不干扰其他调用者或线程所做的潜在修改。
```

所有的这些属性都可以通过缓存元素的属性来修改。比如:

```xml
<cache
  eviction="FIFO"
  flushInterval="60000"
  size="512"
  readOnly="true"/>
```

这个更高级的配置创建了一个 FIFO 缓存,并每隔 60 秒刷新,存数结果对象或列表的 512 个引用,而且返回的对象被认为是只读的,因此在不同线程中的调用者之间修改它们会 导致冲突。

可用的收回策略有:

```java
·LRU – 最近最少使用的:移除最长时间不被使用的对象。
·FIFO – 先进先出:按对象进入缓存的顺序来移除它们。
·SOFT – 软引用:移除基于垃圾回收器状态和软引用规则的对象。
·WEAK – 弱引用:更积极地移除基于垃圾收集器状态和弱引用规则的对象。
```

默认的是 LRU。

flushInterval(刷新间隔)可以被设置为任意的正整数,而且它们代表一个合理的毫秒 形式的时间段。默认情况是不设置,也就是没有刷新间隔,缓存仅仅调用语句时刷新。

size(引用数目)可以被设置为任意正整数,要记住你缓存的对象数目和你运行环境的 可用内存资源数目。默认值是 1024。

readOnly(只读)属性可以被设置为 true 或 false。只读的缓存会给所有调用者返回缓 存对象的相同实例。因此这些对象不能被修改。这提供了很重要的性能优势。可读写的缓存 会返回缓存对象的拷贝(通过序列化) 。这会慢一些,但是安全,因此默认是 false。

## 2.自定义缓存

使用自定义缓存

除了这些自定义缓存的方式, 你也可以通过实现你自己的缓存或为其他第三方缓存方案 创建适配器来完全覆盖缓存行为。

```xml
<cache type="com.domain.something.MyCustomCache"/>
```

这个示例展 示了 如何 使用 一个 自定义 的缓 存实 现。type 属 性指 定的 类必 须实现 org.mybatis.cache.Cache 接口。这个接口是 MyBatis 框架中很多复杂的接口之一,但是简单 给定它做什么就行。

```java
public interface Cache {
  String getId();
  int getSize();
  void putObject(Object key, Object value);
  Object getObject(Object key);
  boolean hasKey(Object key);
  Object removeObject(Object key);
  void clear();
}
```

要配置你的缓存, 简单和公有的 JavaBeans 属性来配置你的缓存实现, 而且是通过 cache 元素来传递属性, 比如, 下面代码会在你的缓存实现中调用一个称为 “setCacheFile(String file)” 的方法：

```xml
<cache type="com.domain.something.MyCustomCache">
  <property name="cacheFile" value="/tmp/my-custom-cache.tmp"/>
</cache>
```

你可以使用所有简单类型作为 JavaBeans 的属性,MyBatis 会进行转换。 And you can specify a placeholder(e.g. ${cache.file}) to replace value defined at configuration properties.

从3.4.2版本开始，MyBatis已经支持在所有属性设置完毕以后可以调用一个初始化方法。如果你想要使用这个特性，请在你的自定义缓存类里实现 org.apache.ibatis.builder.InitializingObject 接口。

```java
public interface InitializingObject {
  void initialize() throws Exception;
}
```

记得缓存配置和缓存实例是绑定在 SQL 映射文件的命名空间是很重要的。因此,所有 在相同命名空间的语句正如绑定的缓存一样。 语句可以修改和缓存交互的方式, 或在语句的 语句的基础上使用两种简单的属性来完全排除它们。默认情况下,语句可以这样来配置：

```xml
<select ... flushCache="false" useCache="true"/>
<insert ... flushCache="true"/>
<update ... flushCache="true"/>
<delete ... flushCache="true"/>
```

因为那些是默认的,你明显不能明确地以这种方式来配置一条语句。相反,如果你想改 变默认的行为,只能设置 flushCache 和 useCache 属性。比如,在一些情况下你也许想排除 从缓存中查询特定语句结果,或者你也许想要一个查询语句来刷新缓存。相似地,你也许有 一些更新语句依靠执行而不需要刷新缓存。

## 3.参照缓存

回想一下上一节内容, 这个特殊命名空间的唯一缓存会被使用或者刷新相同命名空间内 的语句。也许将来的某个时候,你会想在命名空间中共享相同的缓存配置和实例。在这样的 情况下你可以使用 cache-ref 元素来引用另外一个缓存。

```xml
<cache-ref namespace="com.someone.application.data.SomeMapper"/>
```

## 4.示例

**创建实体类**

Employee，这里需要实现Serializable接口

```java
package org.mybatis.cache2;
import java.io.Serializable;
public class Employee implements Serializable{
    private Integer id;
    private String lastName;
    private String email;
    private String gender;
    public Employee() {
    }
    public Employee(Integer id, String lastName, String email, String gender) {
        this.id = id;
        this.lastName = lastName;
        this.email = email;
        this.gender = gender;
    }
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getLastName() {
        return lastName;
    }
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getGender() {
        return gender;
    }
    public void setGender(String gender) {
        this.gender = gender;
    }
    public String toString() {
        return "Employee [id=" + id + ", lastName=" + lastName + ", email="
                + email + ", gender=" + gender + "]";
    }
}
```

**创建方法接口**

EmployeeMapper

```java
package org.mybatis.cache2;
public interface EmployeeMapper {
    public Employee getEmpById(Integer id);
    public void addEmp(Employee emp);
}
```

**创建主配置文件**

mybatis-config-cache2.xml在`` 标签中开启二级缓存全局开关配置

``

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="db.properties"></properties>
    <settings>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
        <setting name="lazyLoadingEnabled" value="true" />
        <setting name="aggressiveLazyLoading" value="false"/>
        <setting name="cacheEnabled" value="true"/>
    </settings>
    <typeAliases>
        <!-- 为包下的所有类起别名，默认为类名大小写（不区分大小写） -->
        <package name="org.mybatis.cache2"/>
    </typeAliases>
    <!-- 默认development是开发环境，如果改成test则表示使用测试环境 -->
    <environments default="dev_mysql">
        <environment id="dev_mysql">
            <transactionManager type="JDBC" />
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.driver}" />
                <property name="url" value="${mysql.url}" />
                <property name="username" value="${mysql.username}" />
                <property name="password" value="${mysql.password}" />
            </dataSource>
        </environment>
        <environment id="test_mysql">
            <transactionManager type="JDBC"></transactionManager>
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.drivertest}" />
                <property name="url" value="${mysql.urltest}" />
                <property name="username" value="${mysql.usernametest}" />
                <property name="password" value="${mysql.passwordtest}" />
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="mapper/cache2mapper.xml"/>
    </mappers>
</configuration>
```

**创建mapper配置文件**

cache2mapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.cache2.EmployeeMapper">
    <cache/>
    <select id="getEmpById" resultType="org.mybatis.cache2.Employee" useCache="true">
        select * from mybatis_employee me where me.id ={id}
    </select>
    <insert id="addEmp" parameterType="org.mybatis.cache2.Employee" useGeneratedKeys="true" keyProperty="id">
        insert into mybatis_employee 
        (last_name,email,gender) 
        values 
        (#{lastName},#{email},#{gender});
    </insert>
</mapper>
```

**创建测试类**

```java
package org.mybatis.cache2;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 测试二级缓存
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-cache2.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            SqlSession sqlSession1 = sqlSessionFactory.openSession();
            EmployeeMapper mapper1 = sqlSession1.getMapper(EmployeeMapper.class);
            Employee emp1 = mapper1.getEmpById(2);
            System.out.println(emp1);
            sqlSession1.close();
            SqlSession sqlSession2 = sqlSessionFactory.openSession();
            EmployeeMapper mapper2 = sqlSession2.getMapper(EmployeeMapper.class);
            Employee emp2 = mapper2.getEmpById(2);
            System.out.println(emp2);
            sqlSession2.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

**测试结果：**

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@704921a5]
>
> DEBUG - ==> Preparing: select * from mybatis_employee me where me.id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=1]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@704921a5]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@704921a5]
>
> DEBUG - Returned connection 1883840933 to pool.
>
> DEBUG - Cache Hit Ratio [org.mybatis.cache2.EmployeeMapper]: 0.5
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=1]

不同的sqlSession（不同sqlSession一级缓存不同，具体参考上一篇[mybatis详解-(18)一级缓存](http://blog.csdn.net/jinjin603/article/details/78845760)），在第二次执行相同的查询时，数据是从二级缓存中直接获取的。

当然这里需要注意的是：**二级缓存是在sqlSession关闭的时候才进行保存的**，

如果上面的demo把sqlSession1.close()放在第二次查询之后关闭，那么第二次查询时无法获取二级缓存的。

## 5.关闭缓存

1）主配置文件中设置cacheEnabled为false

``

2）mapper配置文件中去掉``

``

3）将查询`` 标签useCache属性设置为false

``

4）将查询`` 标签flushCache属性设置为true

``

## 6.二级缓存原理

二级缓存指的就是同一个namespace下的mapper，二级缓存中，也有一个map结构，这个区域就是一级缓存区域。

一级缓存中的key是由sql语句、条件、statement等信息组成一个唯一值。一级缓存中的value，就是查询出的结果对象。

一级缓存是默认使用的。

二级缓存需要手动开启。

图片引自[mybatis–查询缓存](http://blog.csdn.net/csdn_gia/article/details/54948791)
