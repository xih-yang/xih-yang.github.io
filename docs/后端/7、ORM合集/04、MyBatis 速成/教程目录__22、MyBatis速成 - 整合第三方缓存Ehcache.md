# 22、MyBatis速成 - 整合第三方缓存Ehcache
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/22.html
- 分类：ORM框架
- 分组：教程目录
前面几篇文章剖析了mybatis的缓存原理，发现mybatis提供的缓存是非常简陋的，用HashMap进行存储。

有专业做缓存的，那么就使用专业的缓存框架吧，这里使用Ehcache来作为mybatis的缓存。

## 1.引入jar

```xml
<!-- 添加Ehcache核心包 -->
<dependency>
    <groupId>net.sf.ehcache</groupId>
    <artifactId>ehcache-core</artifactId>
    <version>2.6.10</version>
</dependency>
<!-- mybatis整合Ehcache的适配器 -->
<dependency>
     <groupId>org.mybatis</groupId>
     <artifactId>mybatis-ehcache</artifactId>
     <version>1.0.0</version>
   </dependency>
<!-- 引入日志包 -->
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.12</version>
</dependency>
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-log4j12</artifactId>
    <version>1.7.6</version>
</dependency>
<dependency>
    <groupId>log4j</groupId>
    <artifactId>log4j</artifactId>
    <version>1.2.17</version>
</dependency>
```

## 2.引入ehcache.xml文件

添加ehcache.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="../config/ehcache.xsd">     
<diskStore path="D:\mybatis\ehcache"/>     
   <!--     
   Mandatory Default Cache configuration. These settings will be applied to caches     
   created programmtically using CacheManager.add(String cacheName)     
   -->     
   <!--     
      name:缓存名称。     
      maxElementsInMemory：缓存最大个数。     
      eternal:对象是否永久有效，一但设置了，timeout将不起作用。     
      timeToIdleSeconds：设置对象在失效前的允许闲置时间（单位：秒）。仅当eternal=false对象不是永久有效时使用，可选属性，默认值是0，也就是可闲置时间无穷大。     
      timeToLiveSeconds：设置对象在失效前允许存活时间（单位：秒）。最大时间介于创建时间和失效时间之间。仅当eternal=false对象不是永久有效时使用，默认是0.，也就是对象存活时间无穷大。     
      overflowToDisk：当内存中对象数量达到maxElementsInMemory时，Ehcache将会对象写到磁盘中。     
      diskSpoolBufferSizeMB：这个参数设置DiskStore（磁盘缓存）的缓存区大小。默认是30MB。每个Cache都应该有自己的一个缓冲区。     
      maxElementsOnDisk：硬盘最大缓存个数。     
      diskPersistent：是否缓存虚拟机重启期数据 Whether the disk store persists between restarts of the Virtual Machine. The default value is false.     
      diskExpiryThreadIntervalSeconds：磁盘失效线程运行时间间隔，默认是120秒。     
      memoryStoreEvictionPolicy：当达到maxElementsInMemory限制时，Ehcache将会根据指定的策略去清理内存。默认策略是LRU（最近最少使用）。你可以设置为FIFO（先进先出）或是LFU（较少使用）。     
      clearOnFlush：内存数量最大时是否清除。     
   -->     
   <defaultCache     
           maxElementsInMemory="10"    
           eternal="false"
           timeToIdleSeconds="120"    
           timeToLiveSeconds="120"    
           overflowToDisk="true"    
           maxElementsOnDisk="10000000"    
           diskPersistent="false"    
           diskExpiryThreadIntervalSeconds="120"    
           memoryStoreEvictionPolicy="LRU"    
           />     
</ehcache>
```

## 3.创建示例

```java
package org.mybatis.cache3ehcache;
public class Employee {
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

```java
package org.mybatis.cache3ehcache;
public interface EmployeeMapper {
    public Employee getEmpById(Integer id);
}
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.cache3ehcache.EmployeeMapper">
    <!--这里引用第三方缓存（或自定义缓存）-->
    <cache type="org.mybatis.caches.ehcache.EhcacheCache"></cache>
    <select id="getEmpById" resultType="org.mybatis.cache3ehcache.Employee" useCache="true">
        select * from mybatis_employee me where me.id ={id}
    </select>
</mapper>
```

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
        <!--开启缓存-->
        <setting name="cacheEnabled" value="true"/>
    </settings>
    <typeAliases>
        <!-- 为包下的所有类起别名，默认为类名大小写（不区分大小写） -->
        <package name="org.mybatis.cache3ehcache"/>
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
        <mapper resource="mapper/cache3ehcachemapper.xml"/>
    </mappers>
</configuration>
```

测试类：

```java
package org.mybatis.cache3ehcache;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 整个Ehcache
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-cache3ehcache.xml";//全局配置文件
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
            System.out.println("######");
            SqlSession sqlSession2 = sqlSessionFactory.openSession();
            EmployeeMapper mapper2 = sqlSession2.getMapper(EmployeeMapper.class);
            Employee emp2 = mapper2.getEmpById(2);
            System.out.println(emp2);
            sqlSession2.close();
            System.out.println(emp1 == emp2);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

运行结果：

两个不同的sqlSession，发送了一个sql查询，说明缓存已经生效。
