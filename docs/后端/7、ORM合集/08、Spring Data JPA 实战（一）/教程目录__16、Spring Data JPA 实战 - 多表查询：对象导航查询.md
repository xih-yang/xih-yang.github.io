# 16、Spring Data JPA 实战 - 多表查询：对象导航查询
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/16.html
- 分类：ORM框架
- 分组：教程目录
## 1.概述

对象导航查询：查询一个对象的同时，通过此对象聋询他的关联对象

在这里，将使用一对多里面所使用的配置进行示例

## 2. 测试对象查询

### 2.1 从一方查询多方

默认使用延迟加载

#### 2.1.1 测试

测试类：

```java
package cn.yy.test;
import cn.yy.dao.ManyCustomerDao;
import cn.yy.dao.ManyLinkManDao;
import cn.yy.domain.Customer;
import cn.yy.domain.LinkMan;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;
import java.util.Set;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 */
@RunWith(SpringJUnit4ClassRunner.class)//声明spring提供的单元测试环境
@ContextConfiguration(locations = "classpath:applicationContext.xml")//指定spring容器的配置信息
public class OneToManyTestQuery {
    @Autowired
    private ManyCustomerDao manyCustomerDao;
    @Autowired
    private ManyLinkManDao manyLinkManDao;
    /**
     * 测试对象导航查询(查询一个对象的时候，通过此对象查询所有的关联对象)
     */
    @Test
    @Transactional//解决java代码中报错：could not initialize proxy - no Session
    public void testQuery1(){
        //查询id为1的客户
        Customer customer = manyCustomerDao.getOne(1l);
        //对象导航查询，此客户下的所有联系人
        Set<LinkMan> linkMans = customer.getLinkMans();
        for (LinkMan linkMan:linkMans){
            System.out.println(linkMan);
        }
    }
}
```

运行结果：

cs_linkman数据库表内容：

cst_customer数据库表中的数据

运行结果：

#### 2.1.1 延迟加载

默认使用的是延迟加载，如果想要修改加载方式的话，想要修改实体类中的注释，在本例中，想要修改加载方式的话就需要对实体类Customer中对注释进行修改

```java
/*
        放弃外键维护权：
            mappedBy:对方配置关系的属性名称
        cascade :配置级联( 可以配置到设置多表的映射关系的注解上)
                CascadeType.all:所有
                            MERGE:更新
                            PERSIST：保存
                            REMOVE:删除
         fetch :配置关联对象的加载方式
                EAGER   :  立即加载
                LAZY    :   延迟加载
     */
    @OneToMany(mappedBy =  "customer" ,cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    private Set<LinkMan> linkMans = new HashSet<LinkMan>();
```

测试方法，该方法在2中的测试类中

```java
/**
     * 对象导航查询:
     *      默认使用的是延迟加载的形式查询的
     *          调用get方法并不会立即发送查询，而是在使用关联对象的时候才会查询，这叫做延迟加载!
     *
     *      修改配置，将延迟加载改为立即加载
     *          fetch,需要配置到多表映射关系的注解上面
     */
    @Test
    @Transactional//解决java代码中报错：could not initialize proxy - no Session
    public void testQuery2(){
        //查询id为1的客户
        //之前的情况下getOne默认使用延迟加载的方式，findOne是使用立即加载的方式进行查询
        //但是在对象查询中，默认使用的都是延迟加载方式
        Customer customer = manyCustomerDao.findOne(1l);
        //对象导航查询，此客户下的所有联系人
        Set<LinkMan> linkMans = customer.getLinkMans();//默认是延迟加载，调用
        System.out.println(linkMans);
        for (LinkMan linkMan:linkMans){
            System.out.println(linkMan);
        }
    }
```

运行结果：

### 2.2 从多一方查询一的一方

默认使用立即加载

#### 2.2.1 测试

测试方法，该方法在2中的测试类中

```java
/**
 * 从联系人对象导航查询他的所属客户
 *      从多的一方去查询少的一方：默认使用立即加载
 *      使用配置修改需要找到查询主体：在这里是联系人，与之前的fetch使用方法一样，修改其属性便可以修改加载方式
 */
@Test
@Transactional//解决java代码中报错：could not initialize proxy - no Session
public void testQuery3(){
    //查询id为1的客户
    LinkMan linkMan = manyLinkManDao.findOne(2l);
    //对象导航查询所属用户
    Customer customer = linkMan.getCustomer();
    System.out.println(customer);
}
```

## 3. 总结

对于对象导航查询来说：

> 从一方查询多方

默认：使用延迟加载

关联对象是一个集合，集合便说明里面可能有许多数据，如果不需要使用所有的数据，就会照成极大的浪费效率，所以需要使用延迟加载

> 从多方查询一方

默认：使用立即加载

只是需要查询一个数据，所以使用立即加载
