# 03、Spring Data JPA 实战 - 主键生成策略与api对象
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/3.html
- 分类：ORM框架
- 分组：教程目录
## 1.主键生成策略

```java
/**
* @Id：声明主键的配置
*
* @GeneratedValue：配置主键的生成策略
*      strategy:选择策略时如果底层支持自增就选择IDENTITY，如果支持序列就选择SEQUENCE，剩下的两种作为理解内容
*          GenerationType.IDENTITY：自增
*              底层数据库必须支持自动增长(底层数据库支持的自动增长方式，对id自增)
*          GenerationType.SEQUENCE：序列，比如Oracle数据库
*              底层数据库必须支持序列
*          GenerationType.TABLE：jpa提供的一种机制，通过一张数据库表的形式帮助我们完成主键自增
*          GenerationType.AUTO：由程序自动的帮助我们选择主键生成策略
*
*/
```

## 2.api对象

- Jpa的操作步骤

1加载配置文件创建工厂(实体管理类工厂 )对象

```java
Persisitence：静态方法（根据持久化单元名称创建实体管理器工厂）
createEntityMnagerFactory（持久化单元名称）
作用：创建实体管理器工厂
```

2.根据实体管理器工厂，创建实体管理器

```java
EntityManagerFactory ：获取EntityManager对象
方法：createEntityManager
内部维护的很多的内容
内部维护了数据库信息，
维护了缓存信息
维护了所有的实体管理器对象
再创建EntityManagerFactory的过程中会根据配置创建数据库表
EntityManagerFactory的创建过程比较浪费资源
EntityManagerFactory的创建过程比较浪费资源
特点：线程安全的对象
多个线程访问同一个EntityManagerFactory不会有线程安全问题
如何解决EntityManagerFactory的创建过程浪费资源（耗时）的问题？
思路：创建一个公共的EntityManagerFactory的对象
在java里面可以静态代码块的形式创建EntityManagerFactory
```

3.获取事务对象，开启事务

```java
EntityManager对象：实体类管理器
beginTransaction : 创建事务对象
presist ： 保存
merge  ： 更新
remove ： 删除
find/getRefrence ： 根据id查询
Transaction 对象 ： 事务
begin：开启事务
commit：提交事务
rollback：回滚
```

4.完成增删改查操作

5.提交事务(回滚事务)

6.释放资源

## 3.解决创建工程浪费资源的问题：抽取工具类

```java
package cn.yy.util;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/12/4
 *
 * 解决实体管理器工厂的浪费资源和耗时间题
 *      通过静态代码块的形式，当程序第一次访问此工具类时，创建一个公共的实体管理器工厂对象，
 */
public class JpaUtils {
    private static EntityManagerFactory factory;
    static {
        //1.加载配置文件，创建EntityManagerFactory
        factory = Persistence.createEntityManagerFactory("myJpa");
    }
    /**
     * 获取EntityManager对象
     * @return
     * 思想：
     *      第一次访问getEnt ityManager方法:经过静态代码块创建一个factory对象， 再调用方法创建一个EntityManager对象
     *      第二次方法getEntityManager方法:直接通过一个已经创建好的factory对象， 创建EntityManager对象
     */
    public static EntityManager getEntityManager(){
        return factory.createEntityManager();
    }
}
```

测试工具类

```java
@Test
public void testSave1(){
  //1加载配置文件创建工厂(实体管理类工厂 )对象
//        EntityManagerFactory factory = Persistence.createEntityManagerFactory("myJpa");
  //2.通过实体管理类工厂获取实体管理器
//        EntityManager em = factory.createEntityManager();
  EntityManager em = JpaUtils.getEntityManager();
          // 3.获取事务对象，开启事务
  EntityTransaction tx = em.getTransaction();//获取事务对象
  tx.begin();//开启事务
  //4.完成增删改查操作：保存一个括号到数据库中
  Customer customer = new Customer();
  customer.setCustName("延迟");
  customer.setCustIndustry("学习");
  //保存
  em.persist(customer);
  //5.提交事务(回滚事务)
  tx.commit();
  //6.释放资源
  em.close();
  //现在就不需要将工厂类进行关闭，因为可能还有其他的线程要使用它
//        factory.close();
}
```
