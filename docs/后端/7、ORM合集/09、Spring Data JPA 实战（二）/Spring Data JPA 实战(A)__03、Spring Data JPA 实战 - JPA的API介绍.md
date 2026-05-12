# 03、Spring Data JPA 实战 - JPA的API介绍
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/3.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(A)
## JPA的API介绍

```java
/**
* 创建实体管理类工厂，借助Persistence的静态方法获取
* 其中传递的参数为持久化单元名称，需要jpa配置文件中指定
*/
EntityManagerFactory factory = Persistence.createEntityManagerFactory("myJpa");
//创建实体管理类
EntityManager em = factory.createEntityManager();
//获取事务对象
EntityTransaction tx = em.getTransaction();
//开启事务
tx.begin();
Customer c = new Customer();
c.setCustName("传智播客");
//保存操作
em.persist(c);
//提交事务
tx.commit();
//释放资源
em.close();
factory.close();
```

## Persistence

Persistence对象主要作用是用于获取EntityManagerFactory对象的 。通过调用该类的createEntityManagerFactory静态方法，根据配置文件中持久化单元名称创建EntityManagerFactory。

```java
//1. 创建 EntitymanagerFactory
@Test
String unitName = "myJpa";
EntityManagerFactory factory= Persistence.createEntityManagerFactory(unitName);
```

## EntityManagerFactory

EntityManagerFactory 接口主要用来创建 EntityManager 实例

```java
//创建实体管理类
EntityManager em = factory.createEntityManager();
```

由于EntityManagerFactory 是一个线程安全的对象（即多个线程访问同一个EntityManagerFactory 对象不会有线程安全问题），并且EntityManagerFactory 的创建极其浪费资源，所以在使用JPA编程时，我们可以对EntityManagerFactory 的创建进行优化，只需要做到一个工程只存在一个EntityManagerFactory 即可

### 优化方法

创建一个工具类，每次使用时来这个工具类中获取即可。这样就可以保证了一个工程中只存在一个EntityManagerFactory

```java
package cn.itcast.dao;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
public final class JPAUtil {
	// JPA的实体管理器工厂：相当于Hibernate的SessionFactory
	private static EntityManagerFactory em;
	// 使用静态代码块赋值
	static {
		// 注意：该方法参数必须和persistence.xml中persistence-unit标签name属性取值一致
		em = Persistence.createEntityManagerFactory("myPersistUnit");
	}
	/**
	 * 使用管理器工厂生产一个管理器对象
	 * 
	 * @return
	 */
	public static EntityManager getEntityManager() {
		return em.createEntityManager();
	}
}
```

## EntityManager

在JPA 规范中, EntityManager是完成持久化操作的核心对象。实体类作为普通 java对象，只有在调用 EntityManager将其持久化后才会变成持久化对象。EntityManager对象在一组实体类与底层数据源之间进行 O/R 映射的管理。它可以用来管理和更新 Entity Bean, 根椐主键查找 Entity Bean, 还可以通过JPQL语句查询实体。

我们可以通过调用EntityManager的方法完成获取事务，以及持久化数据库的操作

方法说明

- getTransaction : 获取事务对象
- persist ： 保存操作
- merge ： 更新操作
- remove ： 删除操作
- find/getReference ： 根据id查询

## EntityTransaction

在JPA 规范中, EntityTransaction是完成事务操作的核心对象，对于EntityTransaction在我们的java代码中承接的功能比较简单

方法说明

- begin：开启事务
- commit：提交事务
- rollback：回滚事务
