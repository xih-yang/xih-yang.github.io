# 12、Mybatis-Plus入门 - IService接口CRUD详解
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/12.html
- 分类：ORM框架
- 分组：教程目录
### 简介

Plust提供了一个顶级IService ，封装了很多CRUD操作，实际使用时，推荐直接在service层调用，Mapper：

- 采用 get 查询单行 remove 删除 list 查询集合 page 分页 前缀命名方式区分 Mapper 层避免混淆，
- 泛型 T 为任意实体对象
- 建议如果存在自定义通用 Service 方法的可能，请创建自己的 IBaseService 继承 Mybatis-Plus 提供的基类
- 对象 Wrapper 为 条件构造器

### 插入

#### Save

**1、****booleansave(Tentity);**；

插入单条数据，实际调用的是BaseMapper的insert；

```java
    /**
     * 插入一条记录（选择字段，策略插入）
     *
     * @param entity 实体对象
     */
    default boolean save(T entity) {
        return SqlHelper.retBool(getBaseMapper().insert(entity));
    }
```

**1、****booleansaveBatch(CollectionentityList);**；

批量插入，默认批次提交数量1000条，实际调动的是Mybatis 自带批量保存，通过sqlSession执行。

```java
    /**
     * 插入（批量）
     *
     * @param entityList 实体对象集合
     */
    @Transactional(rollbackFor = Exception.class)
    default boolean saveBatch(Collection<T> entityList) {
        return saveBatch(entityList, DEFAULT_BATCH_SIZE);
    }
```

**1、****booleansaveBatch(CollectionentityList,intbatchSize);**；

批量插入，指定插入批次数量

```java
    /**
     * 插入（批量）
     *
     * @param entityList 实体对象集合
     * @param batchSize  插入批次数量
     */
    boolean saveBatch(Collection<T> entityList, int batchSize);
```

#### SaveOrUpdate

**1、****booleansaveOrUpdate(Tentity);**；

保存或更新，当实体类存在主键值，并且在数据库中存在此数据时，会更新数据。否则才会插入数据。

```java
    public boolean saveOrUpdate(T entity) {
        if (null == entity) {
            return false;
        } else {
            TableInfo tableInfo = TableInfoHelper.getTableInfo(this.entityClass);
            Assert.notNull(tableInfo, "error: can not execute. because can not find cache of TableInfo for entity!", new Object[0]);
            String keyProperty = tableInfo.getKeyProperty();
            Assert.notEmpty(keyProperty, "error: can not execute. because can not find column for id from entity!", new Object[0]);
            Object idVal = ReflectionKit.getFieldValue(entity, tableInfo.getKeyProperty());
            return !StringUtils.checkValNull(idVal) && !Objects.isNull(this.getById((Serializable)idVal)) ? this.updateById(entity) : this.save(entity);
        }
    }
```

**1、****booleansaveOrUpdate(Tentity,WrapperupdateWrapper);**；

根据updateWrapper尝试更新，否继续执行saveOrUpdate(T)方法；

```java
    default boolean saveOrUpdate(T entity, Wrapper<T> updateWrapper) {
        return this.update(entity, updateWrapper) || this.saveOrUpdate(entity);
    }
```

**1、****booleansaveOrUpdateBatch(CollectionentityList);**；

批量删除或者更新；默认批次提交数量1000条

```java
    @Transactional(rollbackFor = Exception.class)
    @Override
    public boolean saveOrUpdateBatch(Collection<T> entityList, int batchSize) {
        TableInfo tableInfo = TableInfoHelper.getTableInfo(entityClass);
        Assert.notNull(tableInfo, "error: can not execute. because can not find cache of TableInfo for entity!");
        String keyProperty = tableInfo.getKeyProperty();
        Assert.notEmpty(keyProperty, "error: can not execute. because can not find column for id from entity!");
        return SqlHelper.saveOrUpdateBatch(this.entityClass, this.mapperClass, this.log, entityList, batchSize, (sqlSession, entity) -> {
            Object idVal = ReflectionKit.getFieldValue(entity, keyProperty);
            return StringUtils.checkValNull(idVal)
                || CollectionUtils.isEmpty(sqlSession.selectList(getSqlStatement(SqlMethod.SELECT_BY_ID), entity));
        }, (sqlSession, entity) -> {
            MapperMethod.ParamMap<T> param = new MapperMethod.ParamMap<>();
            param.put(Constants.ENTITY, entity);
            sqlSession.update(getSqlStatement(SqlMethod.UPDATE_BY_ID), param);
        });
    }
```

**1、****booleansaveOrUpdateBatch(CollectionentityList,intbatchSize);**；

批量删除或者更新；

### Remove

实际调用的是BaseMapper中的相关delete方法。

**1、****booleanremove(WrapperqueryWrapper);**；

根据 entity 条件，删除记录
**2、****booleanremoveById(Serializableid);**；

根据 ID 删除
**3、****booleanremoveByMap(MapcolumnMap);**；

根据 columnMap 条件，删除记录
**4、****booleanremoveByIds(CollectionidList);**；

删除（根据ID 批量删除）

### Update

实际调用的是BaseMapper中的相关update方法。

**1、****booleanupdate(WrapperupdateWrapper);**；

根据 UpdateWrapper 条件，更新记录 需要设置sqlset
**2、****booleanupdate(Tentity,WrapperupdateWrapper**);；

根据 whereEntity 条件，更新记录
**3、****booleanupdateById(Tentity);**；

根据 ID 选择修改
**4、****booleanupdateBatchById(CollectionentityList);**；

根据ID 批量更新
**5、****booleanupdateBatchById(CollectionentityList,intbatchSize);**；

根据ID 批量更新

### Select

#### Get

**1、****TgetById(Serializableid);**；

根据 ID 查询
**2、****TgetOne(WrapperqueryWrapper);**；

根据 Wrapper，查询一条记录。结果集，如果是多个会抛出异常，随机取一条加上限制条件 wrapper.last(“LIMIT 1”)
**3、****TgetOne(WrapperqueryWrapper,booleanthrowEx);**；

根据 Wrapper，查询一条记录,多个结果集时是否抛出异常
**4、****MapgetMap(WrapperqueryWrapper);**；

根据 Wrapper，查询一条记录，返回Map对象
**5、****VgetObj(WrapperqueryWrapper,Functionmapper);**；

根据 Wrapper，查询一条记录

#### list

```java
// 查询所有
List<T> list();
// 查询列表
List<T> list(Wrapper<T> queryWrapper);
// 查询（根据ID 批量查询）
Collection<T> listByIds(Collection<? extends Serializable> idList);
// 查询（根据 columnMap 条件）
Collection<T> listByMap(Map<String, Object> columnMap);
// 查询所有列表
List<Map<String, Object>> listMaps();
// 查询列表
List<Map<String, Object>> listMaps(Wrapper<T> queryWrapper);
// 查询全部记录
List<Object> listObjs();
// 查询全部记录
<V> List<V> listObjs(Function<? super Object, V> mapper);
// 根据 Wrapper 条件，查询全部记录
List<Object> listObjs(Wrapper<T> queryWrapper);
// 根据 Wrapper 条件，查询全部记录
<V> List<V> listObjs(Wrapper<T> queryWrapper, Function<? super Object, V> mapper);
```

#### Page

```java
// 无条件分页查询
IPage<T> page(IPage<T> page);
// 条件分页查询
IPage<T> page(IPage<T> page, Wrapper<T> queryWrapper);
// 无条件分页查询
IPage<Map<String, Object>> pageMaps(IPage<T> page);
// 条件分页查询
IPage<Map<String, Object>> pageMaps(IPage<T> page, Wrapper<T> queryWrapper);
```

#### Count

```java
// 查询总记录数
int count();
// 根据 Wrapper 条件，查询总记录数
int count(Wrapper<T> queryWrapper);
```

####

### 问题

批量插入时，并不是很快。。。。

**测试**：

```java
        List<OrderTbl> list = new ArrayList<>();
        for (int i = 0; i < 10000; i++) {
            OrderTbl orderTbl1 = new OrderTbl().setMoney(100).setUserId("123").setCommodityCode("PHONE");
            list.add(orderTbl1);
        }
        long timeMillis = System.currentTimeMillis();
        boolean b = orderTblService.saveBatch(list);
        System.err.println("耗时===》" + (System.currentTimeMillis() - timeMillis));
```

**1、** saveBatch单条插入1W条数据，一次：3417ms.二次：3276ms.三次：3438ms；

**2、** 数据库连接添加&rewriteBatchedStatements=true，单条插入1W条数据，一次：2098ms.二次：2126ms.三次：2290ms；
