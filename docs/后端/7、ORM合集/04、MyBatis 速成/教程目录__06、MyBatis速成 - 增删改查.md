# 06、MyBatis速成 - 增删改查
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/6.html
- 分类：ORM框架
- 分组：教程目录
## 1.新建对象

新建对象Employee

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

## 2.新建Mapper接口

新建EmployeeMapper接口

```java
package org.mybatis.crud;
public interface EmployeeMapper {
    public Employee getEmployeeById(int id);
    public void addEmployee(Employee employee);
    public void updateEmployee(Employee employee);
    public void deleteEmployee(int id);
}
```

## 3.新建Mapper配置文件

新建配置文件crudmapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.crud.EmployeeMapper">
    <!-- 查询方法 -->
    <!-- 传递单个参数，不用做特殊处理直接使用：#{任意名称的参数} -->
    <select id="getEmployeeById" resultType="org.mybatis.crud.Employee">
        select * from mybatis_employee where id ={id}
    </select>
    <!-- 插入方法 -->
    <insert id="addEmployee" parameterType="org.mybatis.crud.Employee">
        insert into mybatis_employee 
        (last_name,email,gender) 
        values 
        (#{lastName},#{email},#{gender});
    </insert>
    <!-- 更新方法 -->
    <update id="updateEmployee">
        update mybatis_employee
        set
        last_name ={lastName},
        email ={email},
        gender ={gender}
        where 
        id ={id}
    </update>
    <!-- 删除方法 -->
    <delete id="deleteEmployee">
        delete from mybatis_employee where id ={id}
    </delete>
</mapper>
```

## 4.新建主配置文件

新建mybatis-config-crud.xml

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
        <mapper resource="mapper/crudmapper.xml"/>
    </mappers>
</configuration>
```

## 6.新建测试类

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
 *
 */
public class MybatisTest {
    public SqlSessionFactory getSqlSessionFactory() throws IOException{
        String resource = "mybatis-config-crud.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        return sqlSessionFactory;
    }
    @Test
    public void testMybatisSelect() {
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
    @Test
    public void testMybatisAdd() {
    //测试添加
            SqlSessionFactory sqlSessionFactory = null;
            SqlSession sqlSession = null;
            try {
                sqlSessionFactory = getSqlSessionFactory();
                //openSession可以添加参数，无参数表示不会自动提交，需要手动提交
//              sqlSession = sqlSessionFactory.openSession();
                sqlSession = sqlSessionFactory.openSession(true);
                EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
                Employee employee = new Employee();
                //mysql数据库设置id自增，oracle数据库待续
                employee.setLastName("huanhuan");
                employee.setEmail("tang_man@sina.com");
                employee.setGender("2");
                mapper.addEmployee(employee);
//              sqlSession.commit();
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                sqlSession.close();
            }
    }
    @Test
    public void testMybatisUpdate() {
    //测试修改
            SqlSessionFactory sqlSessionFactory = null;
            SqlSession sqlSession = null;
            try {
                sqlSessionFactory = getSqlSessionFactory();
                sqlSession = sqlSessionFactory.openSession();
                EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
                Employee employee = new Employee();
                //数据库设置id自增
                employee.setId(3);
                employee.setLastName("panpan");
                employee.setEmail("tang_man@sohu.com");
                employee.setGender("1");
                mapper.updateEmployee(employee);
                sqlSession.commit();
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                sqlSession.close();
            }
    }
    @Test
    public void testMybatisDelete() {
    //测试删除
            SqlSessionFactory sqlSessionFactory = null;
            SqlSession sqlSession = null;
            try {
                sqlSessionFactory = getSqlSessionFactory();
                sqlSession = sqlSessionFactory.openSession();
                EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
                mapper.deleteEmployee(1);
                sqlSession.commit();
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                sqlSession.close();
            }
    }
}
```
