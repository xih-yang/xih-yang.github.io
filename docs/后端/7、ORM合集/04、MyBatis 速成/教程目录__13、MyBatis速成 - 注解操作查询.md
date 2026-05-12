# 13、MyBatis速成 - 注解操作查询
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/13.html
- 分类：ORM框架
- 分组：教程目录
前面讲述的内容中，基本都是按照同样的步骤1）创建接口类，2）创建主配置文件，3）创建接口映射文件。在接口类中定义实现的接口功能，在映射配置文件中写具体的完成接口类容的sql语句，然后在主配置文件中应用映射配置文件操作相关的操作。mybatis也提供了一套通过接口操作数据请求的注解，比如要完成一个查询操作，可以按照如下的步骤完成：

## 1.创建实体类

Employee

```java
package org.mybatis.annotation;
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

## 2.创建方法接口类

EmployeeAnnotation

在接口方法上面添加@Select注解，在注解中添加实际的操作sql语句。还有其他的相关注解如@Insert等，更详细的内容可参考[MybatisApi](http://www.mybatis.org/mybatis-3/zh/java-api.html)

```java
package org.mybatis.annotation;
import org.apache.ibatis.annotations.Select;
public interface EmployeeAnnotation {
    @Select("select * from mybatis_employee where id ={id}")
    public Employee getEmployeeById(int id);
}
```

## 3.创建主配置文件

mybatis-config-annotation.xml

在主配置文件中引用接口类org.mybatis.annotation.EmployeeAnnotation

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="db.properties"></properties>
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
        <!-- 通过注解的形式，不需要mapper配置文件 。但是这样存在硬编码，所以需要优化的，经常变的不要写在这里-->
        <mapper class="org.mybatis.annotation.EmployeeAnnotation"/>
        <!-- 也可以直接通过包，不指定具体类 -->
        <!-- <package name="org.mybatis.annotation"/> -->
    </mappers>
</configuration>
```

## 4.创建测试类

```java
package org.mybatis.annotation;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 使用接口式編程
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-annotation.xml";
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeAnnotation mapper = sqlSession.getMapper(EmployeeAnnotation.class);
            Employee employee = mapper.getEmployeeById(2);
            System.out.println(employee);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            sqlSession.close();
        }
    }
}
```

## 5.测试结果

> DEBUG - Openning JDBC Connection
>
> DEBUG - Created connection 527446182.
>
> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@1f7030a6]
>
> DEBUG - ==> Preparing: select * from mybatis_employee where id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@1f7030a6]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@1f7030a6]
>
> DEBUG - Returned connection 527446182 to pool.

这个步骤中省略了创建映射配置文件的步骤，直接在主配置文件中引用接口类。

但是这种方式也存在一定的问题，比如这样操作是硬编码，为以后的修改和调试都埋下隐患。建议还是使用映射配置文件的方式来操作。
