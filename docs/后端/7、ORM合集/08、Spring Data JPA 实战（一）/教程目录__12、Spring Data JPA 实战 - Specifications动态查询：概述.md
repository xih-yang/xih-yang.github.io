# 12、Spring Data JPA 实战 - Specifications动态查询：概述
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/12.html
- 分类：ORM框架
- 分组：教程目录
## 1. 概述

当给定的条件是不固定的，这时就需要动态构建相应的查询语句，在Spring Data JPA中可以通过JpaSpecificationExecutor接口查询。

相比JPQL,其优势是类型安全,更加的面向对象。

> 在其源码里面，定义了许多方法，与JpaRepository接口里面的方法差不多

> JpaSpecificationExecutor里面的查询方法的参数是Specification spec；由此可以动态去拼接不同的查询条件以调用方法的显示去完成需求

## 2. JpaSpecificationExecutor方法介绍

```java
T findOne(Specification<T> spec);  //查询单个对象
List<T> findAll(Specification<T> spec);  //查询列表
//查询全部，分页
//pageable：分页参数
//返回值：分页pageBean（page：是springdatajpa提供的）
Page<T> findAll(Specification<T> spec, Pageable pageable);
//查询列表
//Sort：排序参数
List<T> findAll(Specification<T> spec, Sort sort);
long count(Specification<T> spec);//统计查询
```

Specification ：查询条件，这是一个接口

- 需要自定义我们自己的Specification实现类
- 实现方法：
- Predicate toPredicate(Root root, CriteriaQuery query, CriteriaBuilder cb); //用于封装查询条件
- root：查询的根对象（查询的任何属性都可以从根对象中获取）
- CriteriaQuery：顶层查询对象，自定义查询方式（作为一个了解，一般不用）
- CriteriaBuilder：查询的构造器，封装了很多的查询条件

## 3. 测试动态查询

### 3.1 测试环境搭建

该项目的测试环境与之前（SpringDataJPA（6）SpringDataJPA概述与使用SpringDataJPA进行CRUD操作）的一样，在这里便不再继续叙述了

在这里的dao层的内容如下：

```java
package cn.yy.dao;
import cn.yy.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
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
public interface SpecCustomerDao extends JpaRepository<Customer,Long>, JpaSpecificationExecutor<Customer> {
}
```

### 3.2 查询单个对象

测试类中的代码：

```java
package cn.yy.test;
import cn.yy.dao.CustomerDao;
import cn.yy.dao.SpecCustomerDao;
import cn.yy.domain.Customer;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;
import javax.persistence.criteria.*;
import java.util.Arrays;
import java.util.List;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/5
 */
@RunWith(SpringJUnit4ClassRunner.class)//声明spring提供的单元测试环境
@ContextConfiguration(locations = "classpath:applicationContext.xml")//指定spring容器的配置信息
public class SpecTest {
    @Autowired
    private SpecCustomerDao specCustomerDao;
    /**
     * 根据条件查询单个对象：
     *      根据客户名查询：
     *          查询条件：
     *              1.查询方式
     *                  cb对象
     *              2.比较的属性名称
     *                  root对象
     */
    @Test
    public void testSpec(){
        /*匿名内部类，自定义查询条件
            1.实现Specification接口(提供泛型:查询的对象类型)
            2.实现toPredicate方法(构造查询条件)
            3.需要借助方法参数中的两个参数(
                    root:获取需要查询的对象属性
                    CriteriaBuilder:构造查询条件的，内部封装了很多的查询条件(模糊匹配，精准匹配。)
               )
         */
        Specification<Customer> spec = new Specification<Customer>() {
            @Override
            public Predicate toPredicate(Root<Customer> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                //1.获取比较的属性：参数是属性名
                Path<Object> custName = root.get("custName");
                //2.构造查询条件：select * from cst_customer where cust_name = '更新后的结果'
                /*
                        第一个参数:需要比较的属性(path对象)
                        第二个参数:当前需要比较的取值
                 */
                Predicate predicate = criteriaBuilder.equal(custName, "更新后的结果");//进行精准的匹配（比较的属性，比较的是属性的取值）
                return predicate;
            }
        };
        Customer one = specCustomerDao.findOne(spec);
        System.out.println(one);
    }
}
```

运行结果：

### 3.3 完成多条件拼接

测试类中的代码，该测试是在3.2中的测试类中运行的：

```java
/**
 * 多条件查询：
 *      根据客户名和客户所属行业进行查询
 */
@Test
public void testSpec1(){
    /*
    root：获取属性
        客户名
        所属行业
     cb：构造查询
        1.构造客户名的精准匹配查询
        2.构造所属行业的精准匹配查询
        3.将以上两个查询联系起来
     */
    Specification<Customer> spec = new Specification<Customer>() {
        @Override
        public Predicate toPredicate(Root<Customer> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
            Path<Object> custName = root.get("custName");//客户名
            Path<Object> custIndustry = root.get("custIndustry");//所属行业
            //构造查询
            //1.构造客户名的精准匹配查询
            Predicate p1 = criteriaBuilder.equal(custName, "延迟");
            //2.构造所属行业的精准匹配查询
            Predicate p2 = criteriaBuilder.equal(custIndustry, "学习");
            //3.将以上两个查询联系起来(组合在一起):and、or
            Predicate and = criteriaBuilder.and(p1, p2);//and():以与的形式拼接多个查询条件;cb.or():以或的形式拼接多个查询条件
            return and;
        }
    };
    //是使用findOne还是findAll是要根据数据库中数据的内容而定
    Customer one = specCustomerDao.findOne(spec);
    System.out.println(one);
}
```

运行结果：

### 3.4 模糊匹配查询列表

测试类中的代码，该测试是在3.2中的测试类中运行的：

```java
/**
 * 根据客户名称的模糊匹配
 *      equal():直接的到path对象(属性)，然后进行比较即可
 *      gt、lt、ge、le、like：这些方法不能直接去比较，
 *                          需要先得到path对象，根据path指定比较的参数类型，再去进行比较
 *                          指定参数类型：path.as(类型的字节码对象)
 */
@Test
public void testSpec3(){
    //构造查询条件
    Specification<Customer> spec = new Specification<Customer>() {
        @Override
        public Predicate toPredicate(Root<Customer> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
            //查询属性：客户名
            Path<Object> custName = root.get("custName");
            //查询方式：模糊查询
            Predicate predicate = criteriaBuilder.like(custName.as(String.class), "延%");
            return predicate;
        }
    };
    List<Customer> all = specCustomerDao.findAll(spec);
    for (Customer customer :all){
        System.out.println(customer);
    }
}
```

运行结果：

### 3.5 排序

测试类中的代码，该测试是在3.2中的测试类中运行的：

```java
/**
 * 根据客户名称的模糊匹配
 *      equal():直接的到path对象(属性)，然后进行比较即可
 *      gt、lt、ge、le、like：这些方法不能直接去比较，
 *                          需要先得到path对象，根据path指定比较的参数类型，再去进行比较
 *                          指定参数类型：path.as(类型的字节码对象)
 */
@Test
public void testSpec3(){
    //构造查询条件
    Specification<Customer> spec = new Specification<Customer>() {
        @Override
        public Predicate toPredicate(Root<Customer> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
            //查询属性：客户名
            Path<Object> custName = root.get("custName");
            //查询方式：模糊查询
            Predicate predicate = criteriaBuilder.like(custName.as(String.class), "延%");
            return predicate;
        }
};
    /*创建排序对象，需要调用构造方法实例化Sort对象
            第一个参数:排序的顺序(倒序，正序)
                Sort.Direction.DESC:倒序
                Sort.Direction.ASC：升序
            第二个参数:排序的属性名称
     */
    Sort sort = new Sort(Sort.Direction.DESC,"custId");
    List<Customer> all = specCustomerDao.findAll(spec,sort);
    for (Customer customer :all){
        System.out.println(customer);
    }
}
```

运行结果：

### 3.6 分页

测试类中的代码，该测试是在3.2中的测试类中运行的：

```java
/**
 * 分页查询：
 *      findAll(Specification, Pageable):带有条件的分页
 *          Specification:查询条件
 *          Pageable:分页参数
 *              分页参数: 查询的页码，每页查询的条数
 *      findAll(Pageable):没有条件的分页
 *
 *      返回: Page对象： (这个对象是springDataJpa为我们封装好的pageBean对象，包括：数据列表、共条数)
 */
@Test
public void testSpec4(){
    Specification<Customer> spec = null;
    /*
    创建PageRequest的过程中，需要调用他的构造方法传入两个参数
            第一个参数:当前查询的页数(从0开始)
            第二个参数:每页查询的数量
     */
    Pageable pageable = new PageRequest(0,2);
    Page<Customer> all = specCustomerDao.findAll(spec, pageable);
    System.out.println("数据列表集合："+all.getContent());
    System.out.println("得到总条数："+all.getTotalElements());
    System.out.println("得到总页数："+all.getTotalPages());
}
```

运行结果：
