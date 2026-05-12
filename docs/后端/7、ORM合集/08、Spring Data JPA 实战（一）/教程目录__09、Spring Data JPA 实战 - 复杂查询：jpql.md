# 09、Spring Data JPA 实战 - 复杂查询：jpql
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/9.html
- 分类：ORM框架
- 分组：教程目录
## 0. JPQL查询引入

jpql ： jpa query language （jpq查询语言）

**特点：**

**1、** 语法或关键字和sql语句类似；

**2、** 查询的是类和类中的属性；

**需要将JPQL语句配置到接口方法上：**

**1、** 特有的查询：需要在dao接口上配置方法；

**2、** 在新添加的方法上，使用注解的形式配置jpql查询语句；

**3、** 注解：@Query；

## 1. 基本查询

修改dao接口里面的内容如下：

```java
package cn.yy.dao;
import cn.yy.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 *
 *      符合SpringDataJpa的dao层接口规范
 *              JpaRepository<操作的实体类类型，实体类中主键属性的类型>
 *                  封装了基本CRUD操作”
 *              JpaSpecificationExecutor<操作的实体类类型>
 *                  封装了复杂查询(分页)
 */
public interface CustomerDao extends JpaRepository<Customer,Long>, JpaSpecificationExecutor<Customer> {
    /**
     * 根据客户名称查询客户
     *      使用jpql形式进行查询
     *      jpql：from Customer where custName = ?
     *  配置jpql语句，使用@Query注解
     *
     * @param custName
     * @return
     */
    @Query(value = "from Customer where custName = ?")
    public Customer findByJpql(String custName);
}
```

测试类

```java
package cn.yy.test;
import cn.yy.dao.CustomerDao;
import cn.yy.domain.Customer;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 */
@RunWith(SpringJUnit4ClassRunner.class)//声明spring提供的单元测试环境
@ContextConfiguration(locations = "classpath:applicationContext.xml")//指定spring容器的配置信息
public class JpqlTest {
    @Autowired//从容器中获取dao
    private CustomerDao customerDao;
    @Test
    public void testFindJPQL(){
        Customer c = customerDao.findByJpql("修改/更新后");
        System.out.println(c);
    }
}
```

运行结果

## 2. 占位符的赋值

在1中的dao中添加如下方法（在这里我便不讲所有的代码复制了）

```java
/**
 * 根据客户名称和客户id查询客户
 *      jpql：from Customer where custName = ? and custId = ?
 *下面的这些红线警告并不用去处理
 * @param name
 * @param id
 * @return
 */
@Query(value = "from Customer where custName = ? and custId = ?")
public Customer findByNameAndId(String name,Long id);//参数和条件没有任何关系
```

在1中的测试类中添加如下方法（在这里我便不讲所有的代码复制了）

```java
@Test
public void testFindCustNameAndId(){
    Customer cu = customerDao.findByNameAndId("延迟", 2l);
    System.out.println(cu);
}
```

运行结果：

```java
对于多个占位符参数
		赋值的时候，默认的情况下，占位符的位置需要和方法参数中的位置保持一致
可以指定占位符参数的位置
		?索引的方式，指定此占位的取值来源
```

如下所示：代表第一个占位符取第一个参数的值，第二个占位符取第二个参数的值

## 3. 更新

在1中的dao中添加如下方法（在这里我便不讲所有的代码复制了）

```java
/**
 * 根据id更新客户的名称
 *      sql：
 *          update cst_customer set cust_name = ? and cust_id = ?
 *      jpql:
 *          update Customer set custName = ? where custId = ?
 *  @Query :代表的是进行查询
 *          需要声明此方法是用来进行更新操作:
 *              @Modifying:当前执行的是一个更新操作
 */
@Query(value = "update Customer set custName = ?2 where custId = ?1")
@Modifying
public void update(long custId,String custName);
```

在1中的测试类中添加如下方法（在这里我便不讲所有的代码复制了）

```java
/**
 * springDataJpa中使用jpq1完成更新/删除操作
 *      1.需要手动添加事务的支持
 *      2.默认会执行结束之后，回滚事务
 *  @Rollback :设直是否自动回滚
 *      false：不自动回滚
 *      true：自动回滚，默认
 */
@Test
@Transactional//必须增加这个注解，添加事务的支持，否则会报错
@Rollback(value = false)
public void testUpdate(){
    customerDao.update(2l,"更新后的结果");
}
```

运行结果：
