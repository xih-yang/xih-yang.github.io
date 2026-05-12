# 08、MyBatis速成 - 参数传递
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/8.html
- 分类：ORM框架
- 分组：教程目录
前面两篇分别介绍了mybatis的增删改查和主键生成，遇到在查询中使用多个查询条件的情况，使用前面的sql无法解决，运行程序出现错误。这一篇主要介绍一下mybatis查询sql的参数传递问题。

## 1.单个参数

创建对象类Employee

```java
package org.mybatis.crud;
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

创建方法接口

```java
public interface EmployeeMapper {
    //通过id获取对象
    public Employee getEmployeeById(int id);
    //通过id和lastName获取对象
    public Employee getEmployeeByIdAndLastName(int id,String lastName);
}
```

创建mapper文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.crud.EmployeeMapper">
    <!-- 查询方法1，传递一个参数 -->
    <select id="getEmployeeById" resultType="org.mybatis.crud.Employee">
        select * from mybatis_employee where id ={id}
    </select>
</mapper>
```

创建主配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <!-- 读取外部资源配置文件 -->
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
        <mapper resource="mapper/crudmapper.xml"/>
    </mappers>
</configuration>
```

创建测试类

```java
package org.mybatis.crud;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 使用接口式編程
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * SqlSessionFactory为非线程安全，所以不能够将SqlSessionFactory定义为成员变量
 */
public class MybatisTest {
    public SqlSessionFactory getSqlSessionFactory() throws IOException{
        String resource = "mybatis-config-crud.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        return sqlSessionFactory;
    }
    @Test
    public void testMybatisSelect1() {
    //测试查询
            SqlSessionFactory sqlSessionFactory = null;
            SqlSession sqlSession = null;
            try {
                sqlSessionFactory = getSqlSessionFactory();
                sqlSession = sqlSessionFactory.openSession();
                EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
                Employee employee = mapper.getEmployeeById(1);
                System.out.println("--------------------------" + employee + "--------------------------");
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                sqlSession.close();
            }
    }
}
```

单个参数，传递过程中不需要做特殊处理

直接使用#{参数名}：取出参数值

## 2.多个参数

如传递多个参数

```java
public Employee getEmployeeByIdAndLastName(int id,String lastName);
```

如果使用如下配置

```xml
<!-- 查询方法2，传递多个参数 -->
    <select id="getEmployeeByIdAndLastName" resultType="org.mybatis.crud.Employee">
        select * from mybatis_employee where id ={id} and last_name ={lastName}
    </select>
```

```java
@Test
public void testMybatisSelect2() {
    //测试查询
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            sqlSessionFactory = getSqlSessionFactory();
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
            //传递两个参数
            Employee employee = mapper.getEmployeeByIdAndLastName(1, "zhangsan");
            System.out.println("--------------------------" + employee + "--------------------------");
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            sqlSession.close();
        }
}
```

运行结果出现绑定错误，那么这种参数传递方式是有错误的

> org.apache.ibatis.exceptions.PersistenceException:
>
> Error querying database. Cause: org.apache.ibatis.binding.BindingException: Parameter ‘id’ not found. Available parameters are [0, 1, param1, param2]
>
> The error may exist in mapper/crudmapper.xml
>
> The error may involve defaultParameterMap
>
> The error occurred while setting parameters
>
> SQL: select * from mybatis_employee where id = ? and last_name = ?
>
> Cause: org.apache.ibatis.binding.BindingException: Parameter ‘id’ not found. Available parameters are [0, 1, param1, param2]

错误里面显示使用param1，param2作为参数

```xml
<!-- 查询方法2，传递多个参数
        多个参数会被封装成一个map
        key:param1,param2...paramn或者参数的索引
        value:传入的参数值
       {}就是从map中获取指定key的值
     -->
    <select id="getEmployeeByIdAndLastName" resultType="org.mybatis.crud.Employee">
        select * from mybatis_employee where id ={param1} and last_name ={param2}
    </select>
```

测试结果正确

> ————————–Employee [id=1, lastName=zhangsan, email=bestjinyi@163.com, gender=1]————————–

将param1和param2分别替换成下标0 1

```xml
<select id="getEmployeeByIdAndLastName" resultType="org.mybatis.crud.Employee">
        select * from mybatis_employee where id ={0} and last_name ={1}
    </select>
```

也可以得到正确的结果。

## 3.命名参数

传递多个参数的时候，如果通过下标或者param1，param2，paramn这种形式，容易发生错位导致传递错误。mybatis提供了一个传递参数的注解@Param。将原来的接口方法做一下修改

```java
public Employee getEmployeeByIdAndLastName(@Param("id")int id,@Param("lastName")String lastName);
```

```xml
<!-- 
        查询方法2，传递多个参数使用@Param(参数名)
        多个参数会被封装成一个map
        key:@Param指定的值
        value:为传递的参数
     -->
    <select id="getEmployeeByIdAndLastName" resultType="org.mybatis.crud.Employee">
        select * from mybatis_employee where id ={id} and last_name ={lastName}
    </select>
```

继续测试，结果正常。

## 4.传递pojo参数

接口中添加方法

```java
public Employee getEmployeeByEmployeeField(Employee employee);
```

mapper配置文件中添加

```xml
<select id="getEmployeeByEmployeeField" resultType="org.mybatis.crud.Employee">
        select * from mybatis_employee where id ={id} and last_name ={lastName}
    </select>
```

测试方法使用

```java
@Test
    public void testMybatisSelect3() {
    //测试查询
            SqlSessionFactory sqlSessionFactory = null;
            SqlSession sqlSession = null;
            try {
                sqlSessionFactory = getSqlSessionFactory();
                sqlSession = sqlSessionFactory.openSession();
                Employee emp = new Employee();
                emp.setId(1);
                emp.setLastName("zhangsan");
                Employee employee = mapper.getEmployeeByEmployeeField(emp);
                System.out.println("--------------------------" + employee + "--------------------------");
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                sqlSession.close();
            }
    }
```

## 5.map传递参数

新建接口方法

```java
public Employee getEmployeeByMap(Map<String,Object> conditionsMap);
```

添加配置

```xml
<select id="getEmployeeByMap" resultType="org.mybatis.crud.Employee">
        select * from mybatis_employee where id ={id} and last_name ={lastName}
    </select>
```

新增测试方法

```java
@Test
    public void testMybatisSelect4() {
    //测试查询
            SqlSessionFactory sqlSessionFactory = null;
            SqlSession sqlSession = null;
            try {
                sqlSessionFactory = getSqlSessionFactory();
                sqlSession = sqlSessionFactory.openSession();
                EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
                Map<String,Object> conditionsMap = new HashMap<String,Object>();
                conditionsMap.put("id", 1);
                conditionsMap.put("lastName", "zhangsan");
                Employee employee = mapper.getEmployeeByMap(conditionsMap);
                System.out.println("--------------------------" + employee + "--------------------------");
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                sqlSession.close();
            }
    }
```
