# 07、Spring Data JPA 实战 - JpaRepository
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/7.html
- 分类：ORM框架
- 分组：教程目录
之前我们学习的Repository都是Spring-Data为了兼容NoSQL而进行的一些抽象封装，从JpaRepository开始是对关系型数据库进行抽象封装。JpaRepository位于spring-data-jpa项目下的repository包中，继承了PagingAndSortingRepository和QueryByExampleExecutor接口，因此也就拥它们的全部方法。并且将默认实现的查询结果变成了List。并且新增了刷新更改到数据库、保存并刷新、批量删除等方法。使用方法同之前的Repository一样我们直接继承它就好了，JpaRepository也是我们最常继承的接口。

```java
@NoRepositoryBean //不要生成该类的代理类
public interface JpaRepository<T, ID> extends PagingAndSortingRepository<T, ID>, QueryByExampleExecutor<T> {
    /*
     * 重写父接口CrudRepository的方法，将查询结果由Iterable变成List。
     */
    @Override
    List<T> findAll();
    /*
     * 重写父接口PagingAndSortingRepository的方法，将查询结果由Iterable变成List。
     */
    @Override
    List<T> findAll(Sort sort);
    /*
     *    重写父接口CrudRepository的方法，将查询结果由Iterable变成List。
     */
    @Override
    List<T> findAllById(Iterable<ID> ids);
    /*
     * 重写父接口CrudRepository的方法，将查询结果由Iterable变成List。
     */
    @Override
    <S extends T> List<S> saveAll(Iterable<S> entities);
    /**
     * 新增方法：刷新挂起的更改到数据库。
     */
    void flush();
    /**
     * 新增方法：保存实体并立即刷新更改。
     */
    <S extends T> S saveAndFlush(S entity);
    /**
     * 新增方法：批量删除给定实体。
     */
    void deleteInBatch(Iterable<T> entities);
    /**
     * 新增方法：批量删除所有。
     */
    void deleteAllInBatch();
    /**
     * 返回对具有给定标识符的实体的引用。根据JPA提供商的实现方式，这很可能总是返回一个实例，
     * 并在第一次访问时抛出javax.persistence.EntityNotFoundException。其中一些会立即拒绝无效的标识符。
     */
    T getOne(ID id);
    /*
     * 重写父接口QueryByExampleExecutor的方法，将查询结果由Iterable变成List。
     */
    @Override
    <S extends T> List<S> findAll(Example<S> example);
    /*
     * 重写父接口QueryByExampleExecutor的方法，将查询结果由Iterable变成List。
     */
    @Override
    <S extends T> List<S> findAll(Example<S> example, Sort sort);
}
```

源码地址：https://github.com/caofanqi/study-spring-data-jpa
