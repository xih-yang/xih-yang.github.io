# 12、JDBC 教程 - 处理Blob(存文件)
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/12.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC进阶

### 处理Blob(存文件)

我们主要讲解MySQL BLOB

#### 一、Oracle LOB

**LOB**，即Large Objects(大对象)，是用于存储大量的二进制和文本数据的一种数据类型(一个LOB字段可存储可多达4GB的数据)

LOB分两种类型：内部LOB和外部LOB

- 内部LOB将数据以字节流的形式存储在数据库的内部。因而，内部LOB的许多操作都可以参与事务，也可以像处理普通数据一样对其进行备份和恢复操作。Orcale支持三种类型的内部LOB：
- BLOB (二进制数据)
- CLOB (单字节字符数据)
- NCLOB (多字节字符数据)
- CLOB和NCLOB类型适用于存储超长的文本数据，BLOB字段适用于存储大量的二进制数据，如图像、视频、音频、文件等。
- 目前只支持一种外部LOB类型，即BFILE类型。在数据库内，该类型仅存储数据在操作系统中的位置信息，二数据的实体以外部文件的形式存在于操作系统的文件系统中。因而，该类型所表示的数据是只读的，不参与事务。该类型可帮助用户管理大量的由外部程序访问的文件。

#### 二、 MySQL BLOB

- MySQL中，BLOB是一个二进制大型对象，是一个可以存储大量数据的容器，它能容纳不同大小的数据。
- MySQL的四种BLOB类型(除了在存储的最大信息量上不同外，它们是等同的)

类型
大小(单位：字节)

TinyBlob
最大 255

Blob
最大 65K

MediumBlob
最大 16M

LongBlob
最大 4G

- 实际使用中根据需要存入的数据大小定义不同的BLOB类型。需要注意的是：如果存储的文件过大，数据库的性能会下降。

**举例(写入)**

目的：实验MySQL的BLOB，将一张图片插入数据库

**1、** 我们在之前的User表的基础上加一列：picture，类型：mediumblob；

**2、** 我们在桌面(D:\desktop)上放了一个照片：pic.jpg；

**3、** 下面的代码借用了一部分第5章的JDBCUtils的代码；

将文件转换成字节流再赋值给`ps`，这样就可以添加进入MySQL数据库了。

调用setBlob(int index, InputStream inputStream)

```java
package com.tqazy.test;
import com.tqazy.jdbc.JDBCUtils;
import org.junit.Test;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
public class TestMySQLBlob {
    @Test
    public void testWriteBlob(){
        String sql = "INSERT INTO user (name, password, age, remark, picture) VALUES(?,?,?,?,?)";
        try {
            JDBCUtils.getConnection("database.properties");
            JDBCUtils.ps = JDBCUtils.con.prepareStatement(sql);
            JDBCUtils.ps.setString(1, "海滩");
            JDBCUtils.ps.setString(2, "admin123");
            JDBCUtils.ps.setInt(3, 26);
            JDBCUtils.ps.setString(4, "他去过海边");
            InputStream inputStream = new FileInputStream(new File("D:\\desktop\\pic.jpg"));
            JDBCUtils.ps.setBlob(5, inputStream);
            int num = JDBCUtils.ps.executeUpdate();
            inputStream.close();
            if(num > 0){
                System.out.println("添加成功");
            }else{
                System.out.println("添加失败");
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            JDBCUtils.close();
        }
    }
}
```

**1、** 运行结果：；

数据库结果：

数据库图片展示：点击那个picture字段的421K的按钮，展示如下：

**注意**：插入BLOB类型的数据必须使用PreparedStatement：因为BLOB类型的数据是无法用字符串拼写的。

**举例(读取)**

就读取刚才的那张图片

**1、** 使用getBlob方法读取到Blob对象；

**2、** 调用Blob的getBinaryStream()方法得到输入流，再使用IO操作即可；

```java
@Test
public void testReadBlob(){
    String sql = "SELECT name, picture FROM user WHERE id = ?";
    try {
        JDBCUtils.getConnection("database.properties");
        JDBCUtils.ps = JDBCUtils.con.prepareStatement(sql);
        JDBCUtils.ps.setInt(1, 10);
        JDBCUtils.rs = JDBCUtils.ps.executeQuery();
        if(JDBCUtils.rs.next()){
            String name = JDBCUtils.rs.getString("name");
            Blob picture = JDBCUtils.rs.getBlob("picture");
            // Blob就是一个输入字节流
            InputStream inputStream = picture.getBinaryStream();
            // 我们建立一个输出字节流向一个桌面上的新文件
            OutputStream outputStream = new FileOutputStream("D:\\desktop\\" + name +".jpg");
            // 将输入流通过输出流写入文件
            byte[] buffer = new byte[1024];
            int len;
            while ((len = inputStream.read(buffer)) != -1){
                outputStream.write(buffer, 0, len);
            }
            // 关闭输入输出流
            outputStream.close();
            inputStream.close();
        }
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        JDBCUtils.close();
    }
}
```

输出结果：

桌面上多出了一个《海滩》的jpg格式图片
