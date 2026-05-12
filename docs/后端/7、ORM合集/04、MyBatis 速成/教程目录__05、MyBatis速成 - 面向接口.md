# 05、MyBatis速成 - 面向接口
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/5.html
- 分类：ORM框架
- 分组：教程目录
前面helloworld中通过selectOne完成了一次查询，但是那种方法需要将所有的参数都写在代码中，包括配置文件的命名空间。这里提供一种通过接口式编程，将所有的方法都定义为接口。在代码中调用接口，实际传递的参数都放置在配置文件中。

## 1.创建实例对象

Employee

```java
package org.mybatis.settings;
public class Employee {
    private Integer id;
    private String lastName;
    private String email;
    private String gender;
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
    @Override
    public String toString() {
        return "Employee [id=" + id + ", lastName=" + lastName + ", email=" + email
                + ", gender=" + gender + "]";
    }
}
```

## 2.创建该业务的方法接口

EmployeeMapper

```java
package org.mybatis.settings;
import org.mybatis.settings.Employee;
public interface EmployeeMapper {
    public Employee getEmpById(Integer id);
}
```

## 3.创建mybatis全局配置文件

mybatis-config.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <!-- 引入外部资源文件
        resource:引入类路径下的资源文件
        url:引入磁盘或者网络路径下的资源文件
     -->
    <properties resource="db.properties"></properties>
    <!-- 配置驼峰命名规则 -->
    <settings>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
    </settings>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC" />
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.driver}" />
                <property name="url" value="${mysql.url}" />
                <property name="username" value="${mysql.username}" />
                <property name="password" value="${mysql.password}" />
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="mapper/settingsmapper.xml"/>
    </mappers>
</configuration>
```

## 4.创建映射配置文件

settingsmapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
    namespace:名称空间，使用接口后，该项的值为接口的全类名
    id:标记的唯一标识，使用接口后，跟接口中的方法名進行绑定
    resultType:返回值类型，想要封装成什么对象
   {id}:从传递的参数取得的值
    public Employee getEmpById(Integer id);
 -->
<mapper namespace="org.mybatis.settings.EmployeeMapper">
    <!-- 这里并没有给last_name起别名lastName，这里是通过配置文件中驼峰命名规则进行注入 -->
    <select id="getEmpById" resultType="org.mybatis.settings.Employee">
        select id,last_name,email,gender from mybatis_employee where id ={id}
    </select>
</mapper>
```

## 5.创建测试类

```java
package org.mybatis.settings;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
import org.mybatis.settings.Employee;
/**
 * 使用接口式編程
 */
public class MybatisTest {
    public SqlSessionFactory getSqlSessionFactory() throws IOException{
        //全局配置文件
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        //获取SqlSessionFactory对象，读取配置文件
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        return sqlSessionFactory;
    }
    @Test
    public void testMybatis() {
        try {
            //1获取sqlSessionFactory对象
            SqlSessionFactory sqlSessionFactory = getSqlSessionFactory();
            //2获取SqlSession对象，由于SqlSession是非线程安全的，所以不能写成成员变量，
            //如果写成成员，有可能会出現资源竞争
            //所以每次使用都应该获取新的对象
            SqlSession openSession = sqlSessionFactory.openSession();
            //3获取接口实现类的对象
            //实际上创建的是一個代理对象，然後由代理对象完成增刪改查
            EmployeeMapper mapper = openSession.getMapper(EmployeeMapper.class);
            System.out.println(mapper.getClass());
            //4调用接口方法
            Employee emp = mapper.getEmpById(2);
            System.out.println(emp);
            openSession.close();
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } finally {
        }
    }
}
```

## 6.执行结果

> DEBUG - Logging initialized using ‘class org.apache.ibatis.logging.slf4j.Slf4jImpl’ adapter.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> class com.sun.proxy.$Proxy2
>
> DEBUG - Openning JDBC Connection
>
> DEBUG - Created connection 665188480.
>
> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@27a5f880]
>
> DEBUG - ==> Preparing: select id,last_name,email,gender from mybatis_employee where id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@27a5f880]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@27a5f880]
>
> DEBUG - Returned connection 665188480 to pool.
