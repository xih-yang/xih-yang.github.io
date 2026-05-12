# 12、Hive 实战 - Hive的函数之自定义函数
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/12.html
- 分类：大数据框架
- 分组：教程目录
## 1. 什么是自定义函数

1）Hive 自带了一些函数，比如：max/min等，但是数量有限，自己可以通过自定义UDF来方便的扩展。

2）当Hive提供的内置函数无法满足你的业务处理需要时，此时就可以考虑使用用户自定义函数（UDF：user-defined function）。

3）根据用户自定义函数类别分为以下三种：

> UDF（User-Defined-Function） ： 一进一出
> UDAF（User-Defined Aggregation Function）：聚集函数，多进一出 类似于：count/max/min
> UDTF（User-Defined Table-Generating Functions）：一进多出，如lateral view explode()

4）官方文档地址： https://cwiki.apache.org/confluence/display/Hive/HivePlugins

5）编程步骤：

> 步骤一：
>
> 继承Hive提供的类
>
> org.apache.hadoop.hive.ql.udf.generic.GenericUDF
>
> org.apache.hadoop.hive.ql.udf.generic.GenericUDTF
>
> 步骤二：
>
> 实现类中的抽象方法
>
> 步骤三：
>
> 在hive的命令行窗口创建函数
>
> 添加jar：add jar linux_jar_path
>
> 创建function：create [temporary] function [dbname.]function_name AS class_name;
>
> 步骤四：
>
> 在hive的命令行窗口删除函数
>
> drop [temporary] function [if exists] [dbname.]function_name;

## 2. 自定义UDF函数

1）需求：自定义一个UDF实现计算给定字符串的长度，例如：

```java
hive(default)> select my_len("abcd");
4
```

2）创建一个Maven工程Hive

3）导入依赖

```java
<dependencies>
	<dependency>
		<groupId>org.apache.hive</groupId>
		<artifactId>hive-exec</artifactId>
		<version>3.1.2</version>
	</dependency>
</dependencies>
```

4）创建一个类

```java
import org.apache.hadoop.hive.ql.exec.UDFArgumentException;
import org.apache.hadoop.hive.ql.exec.UDFArgumentLengthException;
import org.apache.hadoop.hive.ql.exec.UDFArgumentTypeException;
import org.apache.hadoop.hive.ql.metadata.HiveException;
import org.apache.hadoop.hive.ql.udf.generic.GenericUDF;
import org.apache.hadoop.hive.serde2.objectinspector.ObjectInspector;
import org.apache.hadoop.hive.serde2.objectinspector.primitive.PrimitiveObjectInspectorFactory;
/**
 * 自定义UDF函数，需要继承GenericUDF类
 * 需求: 计算指定字符串的长度
 */
public class MyStringLength extends GenericUDF {
    /**
     *
     * @param arguments 输入参数类型的鉴别器对象
     * @return 返回值类型的鉴别器对象
     * @throws UDFArgumentException
     */
    @Override
    public ObjectInspector initialize(ObjectInspector[] arguments) throws UDFArgumentException {
        // 判断输入参数的个数
        if(arguments.length !=1){
            throw new UDFArgumentLengthException("Input Args Length Error!!!");
        }
        // 判断输入参数的类型
        if(!arguments[0].getCategory().equals(ObjectInspector.Category.PRIMITIVE)){
            throw new UDFArgumentTypeException(0,"Input Args Type Error!!!");
        }
        //函数本身返回值为int，需要返回int类型的鉴别器对象
        return PrimitiveObjectInspectorFactory.javaIntObjectInspector;
    }
    /**
     * 函数的逻辑处理
     * @param arguments 输入的参数
     * @return 返回值
     * @throws HiveException
     */
    @Override
    public Object evaluate(DeferredObject[] arguments) throws HiveException {
       if(arguments[0].get() == null){
           return 0;
       }
       return arguments[0].get().toString().length();
    }
    @Override
    public String getDisplayString(String[] children) {
        return "";
    }
}
```

5）打成jar包上传到服务器/opt/module/data/myudf.jar

6）将jar包添加到hive的classpath

```java
hive (default)> add jar /opt/module/data/myudf.jar;
```

7）创建临时函数与开发好的java class关联

```java
hive (default)> create temporary function my_len as "com.ouyang.hive.MyStringLength";
```

8）即可在hql中使用自定义的函数

```java
hive (default)> select ename,my_len(ename) ename_len from emp;
```

## 3. 自定义UDTF函数

1）需求 ：自定义一个UDTF实现将一个任意分割符的字符串切割成独立的单词，例如：

```java
hive(default)> select myudtf("hello,world,hadoop,hive", ",");
hello
world
hadoop
hive
```

2）代码实现

```java
import org.apache.hadoop.hive.ql.exec.UDFArgumentException;
import org.apache.hadoop.hive.ql.metadata.HiveException;
import org.apache.hadoop.hive.ql.udf.generic.GenericUDTF;
import org.apache.hadoop.hive.serde2.objectinspector.ObjectInspector;
import org.apache.hadoop.hive.serde2.objectinspector.ObjectInspectorFactory;
import org.apache.hadoop.hive.serde2.objectinspector.StructObjectInspector;
import org.apache.hadoop.hive.serde2.objectinspector.primitive.PrimitiveObjectInspectorFactory;
import java.util.ArrayList;
import java.util.List;
public class MyUDTF extends GenericUDTF {
    private ArrayList<String> outList = new ArrayList<>();
    @Override
    public StructObjectInspector initialize(StructObjectInspector argOIs) throws UDFArgumentException {
        //1.定义输出数据的列名和类型
        List<String> fieldNames = new ArrayList<>();
        List<ObjectInspector> fieldOIs = new ArrayList<>();
        //2.添加输出数据的列名和类型
        fieldNames.add("lineToWord");
        fieldOIs.add(PrimitiveObjectInspectorFactory.javaStringObjectInspector);
        return ObjectInspectorFactory.getStandardStructObjectInspector(fieldNames, fieldOIs);
    }
    @Override
    public void process(Object[] args) throws HiveException {
        //1.获取原始数据
        String arg = args[0].toString();
        //2.获取数据传入的第二个参数，此处为分隔符
        String splitKey = args[1].toString();
        //3.将原始数据按照传入的分隔符进行切分
        String[] fields = arg.split(splitKey);
        //4.遍历切分后的结果，并写出
        for (String field : fields) {
            //集合为复用的，首先清空集合
            outList.clear();
            //将每一个单词添加至集合
            outList.add(field);
            //将集合内容写出
            forward(outList);
        }
    }
    @Override
    public void close() throws HiveException {
    }
}
```

3）打成jar包上传到服务器/opt/module/hive/data/myudtf.jar

4）将jar包添加到hive的classpath下

```java
hive (default)> add jar /opt/module/hive/data/myudtf.jar;
```

5）创建临时函数与开发好的java class关联

```java
hive (default)> create temporary function myudtf as "com.ouyang.hive.MyUDTF";
```

6）使用自定义的函数

```java
hive (default)> select myudtf("hello,world,hadoop,hive",",");
```
